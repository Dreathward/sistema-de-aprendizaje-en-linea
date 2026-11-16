from fastapi import APIRouter, HTTPException, Depends, Query
from src.database import supabase, resolver_alumn_id
from src.modules.auth.Security import verificar_token

router = APIRouter(
    prefix="/stats",
    tags=["Módulo de Analíticas y Mapa de Calor"],
    dependencies=[Depends(verificar_token)]
)


def _clasificar_nivel_icfes(promedio: float) -> str:
    if promedio >= 80:
        return "Superior"
    if promedio >= 65:
        return "Alto"
    if promedio >= 50:
        return "Básico"
    return "Bajo (Requiere refuerzo)"

def _calcular_global_icfes_ultimo_simulacro(entregas: list, workshops_map: dict, comp_names_map: dict) -> dict:
    simulacros_generales = []
    for sub in entregas:
        ws = workshops_map.get(sub.get("workshop_id"), {})
        modalidad = (ws.get("modalidad") or "").lower().strip()
        tema = (ws.get("topic") or "").lower().strip()
        es_diag = (
            modalidad in ("entrenamiento", "diagnostico", "diagnóstico")
            or bool(ws.get("competence_id"))
            or "diagnostico" in tema
            or "diagnóstico" in tema
        )
        if not es_diag:
            simulacros_generales.append(sub)

    if not simulacros_generales:
        return {
            "tiene_simulacro": False,
            "puntaje_500": None,
            "nivel_icfes": "Sin simulacro general",
            "percentil_estimado": None
        }

    # Tomar el último Simulacro General presentado (ordenado por fecha o ID)
    ultimo = sorted(
        simulacros_generales,
        key=lambda s: (str(s.get("submitted_at") or s.get("created_at") or ""), int(s.get("id") or 0)),
        reverse=True
    )[0]

    scores_ultimo = _calcular_scores_por_competencia([ultimo], workshops_map, comp_names_map)
    score_respaldo = float(ultimo.get("score") or 0.0)

    # Ponderación oficial ICFES: Lectura (3), Matemáticas (3), Sociales (3), Ciencias (3), Inglés (1) = 13
    pesos = [
        ("lectura", 3),
        ("matematic", 3),
        ("social", 3),
        ("ciencia", 3),
        ("ingles", 1),
    ]

    suma_ponderada = 0.0
    for clave, peso in pesos:
        valor_area = None
        for nombre_comp, vals in scores_ultimo.items():
            norm = nombre_comp.lower().replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
            if clave in norm or (clave == "matematic" and "cuantitativo" in norm) or (clave == "social" and "ciudadana" in norm):
                valor_area = sum(vals) / len(vals) if vals else score_respaldo
                break
        if valor_area is None:
            valor_area = score_respaldo
        suma_ponderada += valor_area * peso

    puntaje_500 = int(round((suma_ponderada / 13.0) * 5.0))
    puntaje_500 = max(0, min(500, puntaje_500))

    if puntaje_500 >= 400:
        nivel = "Avanzado"
        percentil = 95
    elif puntaje_500 >= 325:
        nivel = "Satisfactorio"
        percentil = 78
    elif puntaje_500 >= 250:
        nivel = "Mínimo"
        percentil = 52
    else:
        nivel = "Insuficiente"
        percentil = 25

    return {
        "tiene_simulacro": True,
        "puntaje_500": puntaje_500,
        "nivel_icfes": nivel,
        "percentil_estimado": percentil
    }

def _calcular_scores_por_competencia(entregas: list, ws_map: dict, comp_names_map: dict) -> dict:
    sub_ids = [s["id"] for s in entregas if s.get("id")]
    ans_por_sub = {}
    q_map = {}
    correctas_por_q = {}

    if sub_ids:
        res_ans = (
            supabase.table("student_answer")
            .select("submission_id, question_id, selected_answer")
            .in_("submission_id", sub_ids)
            .execute()
        )
        ans_list = res_ans.data or []
        for a in ans_list:
            ans_por_sub.setdefault(a["submission_id"], []).append(a)

        q_ids = list({a["question_id"] for a in ans_list if a.get("question_id")})
        if q_ids:
            res_q = (
                supabase.table("question")
                .select("id, competence_id, workshop_id")
                .in_("id", q_ids)
                .execute()
            )
            q_map = {q["id"]: q for q in (res_q.data or [])}

            res_opt = (
                supabase.table("question_option")
                .select("question_id, option_text, is_correct")
                .in_("question_id", q_ids)
                .execute()
            )
            for op in (res_opt.data or []):
                if op.get("is_correct"):
                    correctas_por_q.setdefault(op["question_id"], set()).add(
                        (op.get("option_text") or "").strip()
                    )

    scores_por_comp = {}
    for sub in entregas:
        sid = sub.get("id")
        ws = ws_map.get(sub.get("workshop_id"), {})
        sub_answers = ans_por_sub.get(sid, [])

        if sub_answers:
            conteo_sub = {}
            for a in sub_answers:
                qid = a.get("question_id")
                q_info = q_map.get(qid, {})
                cid = q_info.get("competence_id") or ws.get("competence_id")
                if not cid:
                    continue
                marcada = (a.get("selected_answer") or "").strip()
                es_ok = marcada in correctas_por_q.get(qid, set())
                par = conteo_sub.setdefault(cid, [0, 0])
                par[1] += 1
                if es_ok:
                    par[0] += 1

            for cid, (ok, tot) in conteo_sub.items():
                nombre_comp = comp_names_map.get(cid)
                if nombre_comp and tot > 0:
                    scores_por_comp.setdefault(nombre_comp, []).append((ok / tot) * 100.0)
        else:
            cid = ws.get("competence_id")
            nombre_comp = comp_names_map.get(cid)
            if nombre_comp:
                scores_por_comp.setdefault(nombre_comp, []).append(float(sub.get("score") or 0))

    return scores_por_comp

# Historial Individual de Desempeño
@router.get("/estudiante/{id_estudiante}")
def obtener_metricas_estudiante(id_estudiante: int, competence_id: int | None = Query(default=None)):
    try:
        alumn_id_real = resolver_alumn_id(id_estudiante)

        res_subs = supabase.table("submission").select("*").eq("alumn_id", alumn_id_real).execute()
        entregas = res_subs.data

        if not entregas:
            return {
                "estado": "éxito",
                "resumen": {
                    "promedio_general": 0.0,
                    "simulacros_completados": 0,
                    "mejor_puntaje": 0.0,
                    "puntaje_icfes_500": None,
                    "tiene_simulacro_general": False,
                    "nivel_proyectado": "Sin simulacro general",
                    "percentil_estimado": None
                },
                "promedio_por_competencia": [],
                "historial": []
            }

        workshop_ids = list({e["workshop_id"] for e in entregas if e.get("workshop_id")})
        workshops_map = {}
        if workshop_ids:
            res_ws = supabase.table("workshop").select("*").in_("id", workshop_ids).execute()
            workshops_map = {w["id"]: w for w in res_ws.data}

        res_comps = supabase.table("competence").select("id, name, category").execute()
        comps_map = {c["id"]: c for c in res_comps.data}

        historial = []
        puntajes_filtrados = []

        for sub in entregas:
            ws = workshops_map.get(sub.get("workshop_id"), {})
            ws_comp_id = ws.get("competence_id")

            # Filtro opcional por competencia (HU-17.2)
            if competence_id is not None and ws_comp_id != competence_id:
                continue

            comp_info = comps_map.get(ws_comp_id, {})
            score = float(sub["score"]) if sub.get("score") is not None else 0.0
            puntajes_filtrados.append(score)

            historial.append({
                "submission_id": sub["id"],
                "workshop_id": sub.get("workshop_id"),
                "tema": ws.get("topic", "Evaluación ICFES"),
                "competence_id": ws_comp_id,
                "competencia": comp_info.get("name", "General"),
                "modalidad": ws.get("modalidad", "simulacro"),
                "fecha": sub.get("submitted_at") or sub.get("created_at"),
                "puntaje": round(score, 2),
                "retroalimentacion_ia": sub.get("ai_feedback")
            })

        total = len(puntajes_filtrados)
        promedio = sum(puntajes_filtrados) / total if total > 0 else 0.0
        mejor = max(puntajes_filtrados) if total > 0 else 0.0
        
        comp_names_map = {c["id"]: c["name"] for c in res_comps.data}
        scores_por_comp = _calcular_scores_por_competencia(entregas, workshops_map, comp_names_map)
        promedio_por_competencia = [
            {
                "competencia": comp,
                "promedio": round(sum(vals) / len(vals), 2),
                "total_entregas": len(vals)
            }
            for comp, vals in scores_por_comp.items()
        ]

        global_icfes = _calcular_global_icfes_ultimo_simulacro(entregas, workshops_map, comp_names_map)

        return {
            "estado": "éxito",
            "resumen": {
                "promedio_general": round(promedio, 2),
                "simulacros_completados": total,
                "mejor_puntaje": round(mejor, 2),
                "puntaje_icfes_500": global_icfes["puntaje_500"],
                "tiene_simulacro_general": global_icfes["tiene_simulacro"],
                "nivel_proyectado": global_icfes["nivel_icfes"],
                "percentil_estimado": global_icfes["percentil_estimado"]
            },
            "promedio_por_competencia": promedio_por_competencia,
            "historial": historial
        }
    except Exception as e:
        print(f"DEBUG ERROR STATS ESTUDIANTE: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al calcular métricas del estudiante: {str(e)}")


# Reportes de Rendimiento para Docentes
@router.get("/docente/{teacher_id}/rendimiento")
def obtener_reporte_docente(teacher_id: int, team_id: int | None = Query(default=None)):
    try:
        query_teams = supabase.table("team").select("id, name, grade").eq("teacher_id", teacher_id)
        if team_id is not None:
            query_teams = query_teams.eq("id", team_id)

        res_teams = query_teams.execute()
        if not res_teams.data:
            return {
                "estado": "éxito",
                "promedio_por_competencia": [],
                "rendimiento_estudiantes": [],
                "resumen_pruebas": []
            }

        team_ids = [t["id"] for t in res_teams.data]

        # Estudiantes del grupo
        res_links = supabase.table("alum_team").select("team_id, alumn_id").in_("team_id", team_ids).execute()
        alumn_ids = list({l["alumn_id"] for l in res_links.data})

        alumns_map = {}
        users_map = {}
        if alumn_ids:
            res_alumns = supabase.table("alumn").select("id, user_id").in_("id", alumn_ids).execute()
            alumns_map = {a["id"]: a for a in res_alumns.data}
            user_ids = [a["user_id"] for a in res_alumns.data if a.get("user_id")]
            if user_ids:
                res_users = supabase.table("users").select("id, name, email").in_("id", user_ids).execute()
                users_map = {u["id"]: u for u in res_users.data}

        # Talleres y entregas del grupo (excluyendo el contenedor interno del banco)
        res_ws = supabase.table("workshop").select("*").in_("team_id", team_ids).execute()
        ws_map = {
            w["id"]: w
            for w in (res_ws.data or [])
            if w.get("is_active") is not False and w.get("topic") != "Banco Base Saber 9/11"
        }
        ws_ids = list(ws_map.keys())

        res_comps = supabase.table("competence").select("id, name").execute()
        comps_map = {c["id"]: c["name"] for c in res_comps.data}

        entregas = []
        if ws_ids:
            res_subs = supabase.table("submission").select("*").in_("workshop_id", ws_ids).execute()
            entregas = res_subs.data

        # Promedio por competencia (desglosando preguntas en simulacros generales)
        scores_por_comp = _calcular_scores_por_competencia(entregas, ws_map, comps_map)

        promedio_competencias = [
            {
                "competencia": comp,
                "promedio": round(sum(vals) / len(vals), 2),
                "total_entregas": len(vals),
                "nivel": _clasificar_nivel_icfes(sum(vals) / len(vals))
            }
            for comp, vals in scores_por_comp.items()
        ]

        # Avance individual por estudiante
        subs_por_alumno = {}
        for sub in entregas:
            subs_por_alumno.setdefault(sub["alumn_id"], []).append(float(sub.get("score") or 0))

        rendimiento_estudiantes = []
        for aid in alumn_ids:
            alumn_info = alumns_map.get(aid, {})
            user_info = users_map.get(alumn_info.get("user_id"), {})
            notas = subs_por_alumno.get(aid, [])
            prom = round(sum(notas) / len(notas), 2) if notas else 0.0
            rendimiento_estudiantes.append({
                "alumn_id": aid,
                "nombre": user_info.get("name", "Estudiante"),
                "correo": user_info.get("email", ""),
                "pruebas_realizadas": len(notas),
                "promedio": prom,
                "requiere_refuerzo": (len(notas) > 0 and prom < 60.0)
            })

        # Resumen de notas por prueba
        subs_por_ws = {}
        for sub in entregas:
            subs_por_ws.setdefault(sub["workshop_id"], []).append(float(sub.get("score") or 0))

        resumen_pruebas = []
        for wid, ws in ws_map.items():
            notas = subs_por_ws.get(wid, [])
            aprobados = sum(1 for n in notas if n >= 60.0)
            resumen_pruebas.append({
                "workshop_id": wid,
                "tema": ws.get("topic"),
                "modalidad": ws.get("modalidad", "simulacro"),
                "entregas": len(notas),
                "promedio_grupo": round(sum(notas) / len(notas), 2) if notas else 0.0,
                "porcentaje_aprobacion": round((aprobados / len(notas)) * 100, 2) if notas else 0.0
            })

        return {
            "estado": "éxito",
            "promedio_por_competencia": promedio_competencias,
            "rendimiento_estudiantes": rendimiento_estudiantes,
            "resumen_pruebas": resumen_pruebas
        }
    except Exception as e:
        print(f"DEBUG ERROR REPORTE DOCENTE: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al generar reporte docente: {str(e)}")


# Mapa de Calor de Brechas Conceptuales
@router.get("/docente/{teacher_id}/mapa-calor")
def generar_mapa_calor_docente(teacher_id: int, team_id: int | None = Query(default=None)):
    try:
        query_teams = supabase.table("team").select("id, name").eq("teacher_id", teacher_id)
        if team_id is not None:
            query_teams = query_teams.eq("id", team_id)

        res_teams = query_teams.execute()
        if not res_teams.data:
            return {"estado": "éxito", "mapa_calor": [], "mensaje": "No se encontraron grupos para este docente."}

        team_ids = [t["id"] for t in res_teams.data]
        res_ws = supabase.table("workshop").select("id, topic, competence_id").in_("team_id", team_ids).execute()
        if not res_ws.data:
            return {"estado": "éxito", "mapa_calor": []}

        ws_map = {w["id"]: w for w in res_ws.data}
        ws_ids = list(ws_map.keys())

        res_subs = supabase.table("submission").select("id, workshop_id, alumn_id").in_("workshop_id", ws_ids).execute()
        if not res_subs.data:
            return {"estado": "éxito", "mapa_calor": [], "mensaje": "Aún no hay entregas registradas en estos grupos."}

        sub_ids = [s["id"] for s in res_subs.data]
        res_ans = supabase.table("student_answer").select("submission_id, question_id, selected_answer").in_("submission_id", sub_ids).execute()
        if not res_ans.data:
            return {"estado": "éxito", "mapa_calor": []}

        q_ids = list({a["question_id"] for a in res_ans.data})
        res_pregs = supabase.table("question").select("id, statement, competence_id, workshop_id").in_("id", q_ids).execute()
        pregs_map = {p["id"]: p for p in res_pregs.data}

        res_ops = supabase.table("question_option").select("question_id, option_text, is_correct, error_reason").in_("question_id", q_ids).execute()
        ops_por_pregunta = {}
        for op in res_ops.data:
            ops_por_pregunta.setdefault(op["question_id"], []).append(op)

        res_comps = supabase.table("competence").select("id, name").execute()
        comps_map = {c["id"]: c["name"] for c in res_comps.data}

        # Agrupar intentos por pregunta y contar caídas en cada distractor
        total_respuestas_pregunta = {}
        fallos_agrupados = {}

        for ans in res_ans.data:
            qid = ans["question_id"]
            marcada = ans["selected_answer"].strip()
            total_respuestas_pregunta[qid] = total_respuestas_pregunta.get(qid, 0) + 1

            opcion_match = None
            for op in ops_por_pregunta.get(qid, []):
                if op["option_text"].strip() == marcada:
                    opcion_match = op
                    break

            if opcion_match and not opcion_match.get("is_correct"):
                preg_info = pregs_map.get(qid, {})
                ws_info = ws_map.get(preg_info.get("workshop_id"), {})
                comp_id = preg_info.get("competence_id") or ws_info.get("competence_id")
                tema = comps_map.get(comp_id, ws_info.get("topic", "General"))
                hipotesis = opcion_match.get("error_reason") or "Distractor conceptual sin clasificar"

                clave = (tema, hipotesis, qid)
                if clave not in fallos_agrupados:
                    fallos_agrupados[clave] = {
                        "tema": tema,
                        "hipotesis_error": hipotesis,
                        "question_id": qid,
                        "enunciado_resumen": preg_info.get("statement", "")[:120],
                        "distractor_frecuente": marcada,
                        "cantidad_fallos": 0
                    }
                fallos_agrupados[clave]["cantidad_fallos"] += 1

        mapa_calor = []
        for (tema, hipotesis, qid), data in fallos_agrupados.items():
            total_q = total_respuestas_pregunta.get(qid, 1)
            porcentaje_fallo = round((data["cantidad_fallos"] / total_q) * 100, 2)

            if porcentaje_fallo >= 50:
                nivel = "critico"
                color = "#EF4444"
            elif porcentaje_fallo >= 25:
                nivel = "moderado"
                color = "#F59E0B"
            else:
                nivel = "leve"
                color = "#10B981"

            mapa_calor.append({
                "tema": data["tema"],
                "hipotesis_error": data["hipotesis_error"],
                "question_id": qid,
                "enunciado_resumen": data["enunciado_resumen"],
                "distractor_frecuente": data["distractor_frecuente"],
                "estudiantes_afectados": data["cantidad_fallos"],
                "total_evaluados": total_q,
                "porcentaje_desacierto": porcentaje_fallo,
                "nivel_alerta": nivel,
                "color_hex": color
            })

        # Ordenar de mayor a menor tasa de error
        mapa_calor.sort(key=lambda x: x["porcentaje_desacierto"], reverse=True)

        return {
            "estado": "éxito",
            "total_brechas_detectadas": len(mapa_calor),
            "mapa_calor": mapa_calor
        }
    except Exception as e:
        print(f"DEBUG ERROR MAPA DE CALOR: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al generar mapa de calor: {str(e)}")


# Consulta de Indicadores Institucionales
@router.get("/institucion/indicadores")
def obtener_indicadores_institucionales():
    try:
        res_teams = supabase.table("team").select("id, name, grade").execute()
        res_ws = supabase.table("workshop").select("id, team_id, competence_id, topic").execute()
        res_subs = supabase.table("submission").select("workshop_id, score").execute()
        res_comps = supabase.table("competence").select("id, name").execute()

        teams_map = {t["id"]: t for t in res_teams.data}
        ws_map = {w["id"]: w for w in res_ws.data}
        comps_map = {c["id"]: c["name"] for c in res_comps.data}

        notas_por_comp = {}
        notas_por_grupo = {}

        for sub in res_subs.data:
            score = float(sub.get("score") or 0)
            ws = ws_map.get(sub.get("workshop_id"), {})

            comp_name = comps_map.get(ws.get("competence_id"), ws.get("topic", "General"))
            notas_por_comp.setdefault(comp_name, []).append(score)

            tid = ws.get("team_id")
            if tid in teams_map:
                grupo_label = f"{teams_map[tid]['name']} (Grado {teams_map[tid].get('grade', '')})"
                notas_por_grupo.setdefault(grupo_label, []).append(score)

        desempeno_competencias = [
            {
                "competencia": comp,
                "promedio_institucional": round(sum(vals) / len(vals), 2),
                "nivel_proyectado": _clasificar_nivel_icfes(sum(vals) / len(vals)),
                "total_evaluaciones": len(vals)
            }
            for comp, vals in notas_por_comp.items()
        ]

        comparativa_grupos = [
            {
                "grupo": grupo,
                "promedio": round(sum(vals) / len(vals), 2),
                "nivel_proyectado": _clasificar_nivel_icfes(sum(vals) / len(vals)),
                "total_entregas": len(vals)
            }
            for grupo, vals in notas_por_grupo.items()
        ]

        return {
            "estado": "éxito",
            "desempeno_por_competencia": desempeno_competencias,
            "comparativa_entre_grupos": comparativa_grupos
        }
    except Exception as e:
        print(f"DEBUG ERROR INDICADORES INSTITUCIONALES: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al calcular indicadores institucionales: {str(e)}")
    
@router.get("/taller/{workshop_id}/asistencia")
def obtener_asistencia_taller(workshop_id: int):
    try:
        res_ws = supabase.table("workshop").select("*").eq("id", workshop_id).execute()
        if not res_ws.data:
            raise HTTPException(status_code=404, detail="Evaluación no encontrada")
        ws = res_ws.data[0]
        team_id = ws.get("team_id")

        # Estudiantes matriculados en el grupo de esa evaluación
        res_links = supabase.table("alum_team").select("alumn_id").eq("team_id", team_id).execute()
        alumn_ids = [l["alumn_id"] for l in (res_links.data or [])]

        alumns_map = {}
        users_map = {}
        if alumn_ids:
            res_alumns = supabase.table("alumn").select("id, user_id").in_("id", alumn_ids).execute()
            alumns_map = {a["id"]: a for a in (res_alumns.data or [])}
            user_ids = [a["user_id"] for a in (res_alumns.data or []) if a.get("user_id")]
            if user_ids:
                res_users = supabase.table("users").select("id, name, email, role").in_("id", user_ids).execute()
                users_map = {u["id"]: u for u in (res_users.data or [])}

        # Entregas registradas para este taller
        res_subs = supabase.table("submission").select("*").eq("workshop_id", workshop_id).execute()
        subs_por_alumn = {}
        for s in (res_subs.data or []):
            aid = s.get("alumn_id")
            if aid not in subs_por_alumn:
                subs_por_alumn[aid] = s

        presentaron = []
        pendientes = []

        for aid in alumn_ids:
            a_info = alumns_map.get(aid, {})
            u_info = users_map.get(a_info.get("user_id"), {})
            if u_info.get("role") in ("teacher", "docente", "admin"):
                continue

            base_est = {
                "alumn_id": aid,
                "nombre": u_info.get("name", "Estudiante"),
                "correo": u_info.get("email", "")
            }

            if aid in subs_por_alumn:
                sub = subs_por_alumn[aid]
                puntaje = round(float(sub.get("score") or 0), 1)
                presentaron.append({
                    **base_est,
                    "puntaje": puntaje,
                    "aprobado": puntaje >= 60.0,
                    "fecha": sub.get("submitted_at") or sub.get("created_at")
                })
            else:
                pendientes.append(base_est)

        presentaron.sort(key=lambda x: x["nombre"])
        pendientes.sort(key=lambda x: x["nombre"])

        return {
            "estado": "éxito",
            "taller": {
                "id": ws["id"],
                "tema": ws.get("topic"),
                "modalidad": ws.get("modalidad", "simulacro")
            },
            "total_grupo": len(presentaron) + len(pendientes),
            "total_presentaron": len(presentaron),
            "total_pendientes": len(pendientes),
            "presentaron": presentaron,
            "pendientes": pendientes
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando asistencia del taller: {str(e)}")

@router.get("/docente/{teacher_id}/matriz-calor")
def obtener_matriz_calor_docente(teacher_id: int, team_id: int | None = None):
    try:
        teams_query = supabase.table("team").select("id, name, grade").eq("teacher_id", teacher_id).eq("is_active", True)
        if team_id is not None:
            teams_query = teams_query.eq("id", team_id)
        teams = teams_query.execute().data or []
        if not teams:
            return {"estado": "éxito", "competencias": [], "filas": []}

        team_ids = [t["id"] for t in teams]
        team_info = {t["id"]: f"{t['name']} ({t.get('grade', '')}°)" for t in teams}

        # Estudiantes vinculados a los grupos del docente
        links = supabase.table("alum_team").select("alumn_id, team_id").in_("team_id", team_ids).execute().data or []
        alum_ids = list({l["alumn_id"] for l in links})
        grupo_por_alum = {l["alumn_id"]: team_info.get(l["team_id"], "") for l in links}

        if not alum_ids:
            return {"estado": "éxito", "competencias": [], "filas": []}

        alumns = supabase.table("alumn").select("id, user_id").in_("id", alum_ids).execute().data or []
        user_ids = [a["user_id"] for a in alumns if a.get("user_id")]
        users = supabase.table("users").select("id, name").in_("id", user_ids).execute().data or [] if user_ids else []
        names_by_user = {u["id"]: u["name"] for u in users}
        nombre_por_alum = {a["id"]: names_by_user.get(a.get("user_id"), f"Estudiante #{a['id']}") for a in alumns}

        # Competencias oficiales ordenadas
        comps = supabase.table("competence").select("id, name").order("id").execute().data or []
        comp_ids = [c["id"] for c in comps]

        # Talleres activos del grupo (excluyendo el Banco Base)
        ws_res = supabase.table("workshop").select("id, team_id, competence_id, topic, is_active").in_("team_id", team_ids).execute().data or []
        ws_map = {
            w["id"]: w
            for w in ws_res
            if w.get("is_active") is not False and "banco base" not in (w.get("topic") or "").lower()
        }
        ws_ids = list(ws_map.keys())

        # Conteo de aciertos y totales por (alum_id, competence_id)
        conteo = {aid: {cid: {"ok": 0, "total": 0} for cid in comp_ids} for aid in alum_ids}

        if ws_ids:
            subs = supabase.table("submission").select("id, alumn_id, workshop_id").in_("workshop_id", ws_ids).in_("alumn_id", alum_ids).execute().data or []
            sub_map = {s["id"]: s for s in subs}
            sub_ids = list(sub_map.keys())

            if sub_ids:
                ans_res = supabase.table("student_answer").select("submission_id, question_id, selected_answer").in_("submission_id", sub_ids).execute().data or []
                q_ids = list({a["question_id"] for a in ans_res if a.get("question_id")})

                pregs = supabase.table("question").select("id, competence_id").in_("id", q_ids).execute().data or [] if q_ids else []
                comp_por_preg = {p["id"]: p.get("competence_id") for p in pregs}

                ops = supabase.table("question_option").select("question_id, option_text").eq("is_correct", True).in_("question_id", q_ids).execute().data or [] if q_ids else []
                correcta_por_preg = {o["question_id"]: (o.get("option_text") or "").strip() for o in ops}

                for a in ans_res:
                    sub = sub_map.get(a.get("submission_id"))
                    if not sub:
                        continue
                    aid = sub["alumn_id"]
                    qid = a.get("question_id")
                    ws = ws_map.get(sub.get("workshop_id"), {})
                    cid = comp_por_preg.get(qid) or ws.get("competence_id")
                    if aid not in conteo or cid not in conteo[aid]:
                        continue

                    conteo[aid][cid]["total"] += 1
                    marcada = (a.get("selected_answer") or "").strip()
                    if marcada and marcada == correcta_por_preg.get(qid, ""):
                        conteo[aid][cid]["ok"] += 1

        filas = []
        for aid in sorted(alum_ids, key=lambda x: nombre_por_alum.get(x, "")):
            celdas = []
            suma_prom = 0
            areas_evaluadas = 0
            for c in comps:
                cid = c["id"]
                info = conteo[aid][cid]
                if info["total"] > 0:
                    pct = round((info["ok"] / info["total"]) * 100)
                    suma_prom += pct
                    areas_evaluadas += 1
                else:
                    pct = None
                celdas.append({
                    "competence_id": cid,
                    "competencia": c["name"],
                    "porcentaje": pct,
                    "aciertos": info["ok"],
                    "total": info["total"]
                })
            promedio_general = round(suma_prom / areas_evaluadas) if areas_evaluadas > 0 else None
            filas.append({
                "alum_id": aid,
                "estudiante": nombre_por_alum.get(aid, f"Estudiante #{aid}"),
                "grupo": grupo_por_alum.get(aid, ""),
                "promedio_general": promedio_general,
                "celdas": celdas
            })

        return {
            "estado": "éxito",
            "competencias": [{"id": c["id"], "name": c["name"]} for c in comps],
            "filas": filas
        }
    except Exception as e:
        print(f"DEBUG ERROR MATRIZ CALOR: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error generando matriz de calor: {str(e)}")