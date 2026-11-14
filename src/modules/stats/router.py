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
                    "mejor_puntaje": 0.0
                },
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

        return {
            "estado": "éxito",
            "resumen": {
                "promedio_general": round(promedio, 2),
                "simulacros_completados": total,
                "mejor_puntaje": round(mejor, 2),
                "nivel_proyectado": _clasificar_nivel_icfes(promedio)
            },
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
        res_links = supabase.table("alumn_team").select("team_id, alumn_id").in_("team_id", team_ids).execute()
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

        # Talleres y entregas del grupo
        res_ws = supabase.table("workshop").select("*").in_("team_id", team_ids).execute()
        ws_map = {w["id"]: w for w in res_ws.data}
        ws_ids = list(ws_map.keys())

        res_comps = supabase.table("competence").select("id, name").execute()
        comps_map = {c["id"]: c["name"] for c in res_comps.data}

        entregas = []
        if ws_ids:
            res_subs = supabase.table("submission").select("*").in_("workshop_id", ws_ids).execute()
            entregas = res_subs.data

        # Promedio por competencia
        scores_por_comp = {}
        for sub in entregas:
            ws = ws_map.get(sub["workshop_id"], {})
            nombre_comp = comps_map.get(ws.get("competence_id"), ws.get("topic", "General"))
            scores_por_comp.setdefault(nombre_comp, []).append(float(sub.get("score") or 0))

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