import os
import random
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from src.database import supabase, resolver_alumn_id
from src.modules.auth.Security import verificar_token

load_dotenv()
client = genai.Client()

router = APIRouter(
    prefix="/evaluacion",
    tags=["Módulo de Evaluación y Banco de Preguntas"],
    dependencies=[Depends(verificar_token)]
)

# --- Contratos de datos (Schemas) ---
class RespuestaEstudiante(BaseModel):
    id_pregunta: int
    respuesta_seleccionada: str

class EntregaTaller(BaseModel):
    id_estudiante: int
    id_workshop: int
    respuestas: list[RespuestaEstudiante]

class VerificacionPreguntaLibre(BaseModel):
    id_pregunta: int
    respuesta_seleccionada: str

class OpcionCrear(BaseModel):
    texto: str
    es_correcta: bool
    causa_error: str | None = None  # Hipótesis del distractor para el mapa de calor e IA

class PreguntaCrear(BaseModel):
    enunciado: str
    competence_id: int | None = None
    opciones: list[OpcionCrear]

class TallerCrear(BaseModel):
    team_id: int
    tema: str
    competence_id: int | None = None
    modalidad: str = "simulacro"  # "simulacro" (temporizado) o "entrenamiento" (libre)
    duracion_minutos: int | None = 60
    fecha_inicio: str | None = None
    preguntas: list[PreguntaCrear]

class EstadoPregunta(BaseModel):
    is_active: bool


# Creación de simulacros/talleres y banco de preguntas (Rol Docente)
@router.post("/crear")
def crear_taller_completo(taller: TallerCrear):
    try:
        res_team = supabase.table("team").select("id").eq("id", taller.team_id).execute()
        if not res_team.data:
            raise HTTPException(status_code=404, detail=f"El grupo con team_id={taller.team_id} no existe.")

        if not taller.preguntas:
            raise HTTPException(status_code=400, detail="El taller debe incluir al menos una pregunta.")

        for idx, preg in enumerate(taller.preguntas, start=1):
            if len(preg.opciones) < 2:
                raise HTTPException(status_code=400, detail=f"La pregunta #{idx} debe tener al menos 2 opciones.")
            if not any(op.es_correcta for op in preg.opciones):
                raise HTTPException(status_code=400, detail=f"La pregunta #{idx} requiere al menos una opción correcta.")

        payload_workshop = {
            "team_id": taller.team_id,
            "topic": taller.tema.strip(),
            "competence_id": taller.competence_id,
            "modalidad": taller.modalidad,
            "duracion_minutos": taller.duracion_minutos if taller.modalidad == "simulacro" else None,
            "fecha_inicio": taller.fecha_inicio,
            "is_active": True
        }
        res_workshop = supabase.table("workshop").insert(payload_workshop).execute()
        workshop_id = res_workshop.data[0]["id"]

        for preg in taller.preguntas:
            comp_final = preg.competence_id or taller.competence_id
            res_preg = supabase.table("question").insert({
                "workshop_id": workshop_id,
                "statement": preg.enunciado.strip(),
                "competence_id": comp_final,
                "is_active": True
            }).execute()
            question_id = res_preg.data[0]["id"]

            opciones_db = [
                {
                    "question_id": question_id,
                    "option_text": op.texto.strip(),
                    "is_correct": op.es_correcta,
                    "error_reason": None if op.es_correcta else (op.causa_error.strip() if op.causa_error else "Error de interpretación del enunciado")
                }
                for op in preg.opciones
            ]
            supabase.table("question_option").insert(opciones_db).execute()

        return {
            "estado": "éxito",
            "mensaje": f"Evaluación '{taller.tema}' ({taller.modalidad}) creada con {len(taller.preguntas)} preguntas.",
            "workshop_id": workshop_id
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR CREAR TALLER: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear la evaluación: {str(e)}")


# Revisión y administración del banco de preguntas (Docente / Admin)
@router.get("/banco-preguntas")
def consultar_banco_preguntas(competence_id: int | None = None, workshop_id: int | None = None):
    try:
        query = supabase.table("question").select("*")
        if competence_id is not None:
            query = query.eq("competence_id", competence_id)
        if workshop_id is not None:
            query = query.eq("workshop_id", workshop_id)

        res_pregs = query.execute()
        if not res_pregs.data:
            return {"estado": "éxito", "preguntas": []}

        q_ids = [p["id"] for p in res_pregs.data]
        res_ops = supabase.table("question_option").select("*").in_("question_id", q_ids).execute()

        ops_por_pregunta = {}
        for op in res_ops.data:
            ops_por_pregunta.setdefault(op["question_id"], []).append({
                "id": op["id"],
                "texto": op["option_text"],
                "es_correcta": op["is_correct"],
                "causa_error": op.get("error_reason")
            })

        banco = []
        for p in res_pregs.data:
            banco.append({
                "id": p["id"],
                "workshop_id": p.get("workshop_id"),
                "competence_id": p.get("competence_id"),
                "enunciado": p["statement"],
                "activa": p.get("is_active", True),
                "opciones": ops_por_pregunta.get(p["id"], [])
            })

        return {"estado": "éxito", "preguntas": banco}
    except Exception as e:
        print(f"DEBUG ERROR BANCO PREGUNTAS: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al consultar el banco: {str(e)}")


@router.patch("/pregunta/{question_id}/estado")
def cambiar_estado_pregunta(question_id: int, estado: EstadoPregunta):
    try:
        res = supabase.table("question").update({"is_active": estado.is_active}).eq("id", question_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Pregunta no encontrada.")
        return {
            "estado": "éxito",
            "mensaje": f"Pregunta {'activada' if estado.is_active else 'desactivada'} correctamente."
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR ESTADO PREGUNTA: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Modo Entrenamiento Libre (Preguntas aleatorias sin tiempo límite)
@router.get("/entrenamiento/{competence_id}")
def iniciar_entrenamiento_libre(competence_id: int, cantidad: int = Query(default=5, ge=1, le=30)):
    try:
        res_pregs = supabase.table("question").select("*").eq("competence_id", competence_id).execute()
        preguntas_activas = [p for p in res_pregs.data if p.get("is_active", True) is not False]

        if not preguntas_activas:
            raise HTTPException(status_code=404, detail="No hay preguntas activas disponibles para esta competencia.")

        seleccionadas = random.sample(preguntas_activas, min(cantidad, len(preguntas_activas)))
        q_ids = [p["id"] for p in seleccionadas]

        res_ops = supabase.table("question_option").select("id, question_id, option_text").in_("question_id", q_ids).execute()
        ops_map = {}
        for op in res_ops.data:
            ops_map.setdefault(op["question_id"], []).append({
                "id": op["id"],
                "option_text": op["option_text"]
            })

        preguntas_seguras = []
        for p in seleccionadas:
            opciones = ops_map.get(p["id"], [])
            random.shuffle(opciones)
            preguntas_seguras.append({
                "id": p["id"],
                "statement": p["statement"],
                "competence_id": p.get("competence_id"),
                "opciones": opciones
            })

        return {
            "estado": "éxito",
            "modalidad": "entrenamiento_libre",
            "tiempo_limite": None,
            "tutor_ia_habilitado": True,
            "preguntas": preguntas_seguras
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR ENTRENAMIENTO LIBRE: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al cargar entrenamiento: {str(e)}")


@router.post("/entrenamiento/verificar-pregunta")
def verificar_pregunta_entrenamiento(datos: VerificacionPreguntaLibre):
    """
    Valida una sola pregunta en entrenamiento libre.
    Si el estudiante falla, devuelve la causa del error y habilita el botón del tutor IA.
    """
    try:
        res_preg = supabase.table("question").select("id, statement, competence_id").eq("id", datos.id_pregunta).execute()
        if not res_preg.data:
            raise HTTPException(status_code=404, detail="Pregunta no encontrada.")

        res_ops = supabase.table("question_option").select("*").eq("question_id", datos.id_pregunta).execute()
        opcion_correcta = None
        opcion_elegida_obj = None

        for op in res_ops.data:
            if op.get("is_correct"):
                opcion_correcta = op["option_text"]
            if op["option_text"].strip() == datos.respuesta_seleccionada.strip():
                opcion_elegida_obj = op

        if not opcion_correcta:
            raise HTTPException(status_code=500, detail="La pregunta no tiene una opción correcta configurada.")

        es_correcta = (datos.respuesta_seleccionada.strip() == opcion_correcta.strip())

        return {
            "estado": "éxito",
            "es_correcta": es_correcta,
            "opcion_correcta": opcion_correcta if es_correcta else None,  # No regala la respuesta si falló
            "causa_error": None if es_correcta else (opcion_elegida_obj.get("error_reason") if opcion_elegida_obj else "Distractor conceptual"),
            "habilitar_tutor_ia": not es_correcta
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR VERIFICAR PREGUNTA: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Listar simulacros/talleres asignados al estudiante
@router.get("/mis-talleres/{id_estudiante}")
def listar_talleres_estudiante(id_estudiante: int):
    try:
        alumn_id_real = resolver_alumn_id(id_estudiante)

        res_teams = supabase.table("alumn_team").select("team_id").eq("alumn_id", alumn_id_real).execute()
        team_ids = [item["team_id"] for item in res_teams.data]
        if not team_ids:
            return {
                "estado": "éxito",
                "talleres": [],
                "mensaje": "El estudiante aún no tiene grupos asignados."
            }

        res_workshops = supabase.table("workshop").select("*").in_("team_id", team_ids).execute()
        res_subs = supabase.table("submission").select("id, workshop_id, score").eq("alumn_id", alumn_id_real).execute()

        entregas_map = {}
        for sub in res_subs.data:
            w_id = sub["workshop_id"]
            puntaje = sub["score"]
            if w_id not in entregas_map or (puntaje is not None and puntaje > (entregas_map[w_id]["puntaje"] or 0)):
                entregas_map[w_id] = {"puntaje": puntaje, "submission_id": sub["id"]}

        talleres_formateados = []
        for w in res_workshops.data:
            if w.get("is_active", True) is False:
                continue
            ya_completado = w["id"] in entregas_map
            modalidad = w.get("modalidad", "simulacro")
            talleres_formateados.append({
                "id": w["id"],
                "tema": w["topic"],
                "team_id": w["team_id"],
                "competence_id": w.get("competence_id"),
                "modalidad": modalidad,
                "duracion_minutos": w.get("duracion_minutos", 60 if modalidad == "simulacro" else None),
                "fecha_inicio": w.get("fecha_inicio") or w.get("created_at"),
                "completado": ya_completado,
                "submission_id": entregas_map[w["id"]]["submission_id"] if ya_completado else None,
                "puntaje": round(entregas_map[w["id"]]["puntaje"], 2) if ya_completado and entregas_map[w["id"]]["puntaje"] is not None else None
            })

        return {"estado": "éxito", "talleres": talleres_formateados}
    except Exception as e:
        print(f"DEBUG ERROR LISTAR TALLERES: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al consultar talleres: {str(e)}")


# Cargar simulacro/taller sin exponer respuestas correctas
@router.get("/{id_workshop}/taller")
def obtener_taller(id_workshop: int):
    try:
        res_workshop = supabase.table("workshop").select("*").eq("id", id_workshop).execute()
        if not res_workshop.data:
            raise HTTPException(status_code=404, detail="Taller o simulacro no encontrado en la base de datos.")

        taller = res_workshop.data[0]
        modalidad = taller.get("modalidad", "simulacro")

        res_preguntas = supabase.table("question").select("*").eq("workshop_id", id_workshop).execute()
        preguntas_activas = [p for p in res_preguntas.data if p.get("is_active", True) is not False]

        q_ids = [p["id"] for p in preguntas_activas]
        ops_map = {}
        if q_ids:
            # No seleccionamos is_correct ni error_reason para blindar el examen
            res_ops = supabase.table("question_option").select("id, question_id, option_text").in_("question_id", q_ids).execute()
            for op in res_ops.data:
                ops_map.setdefault(op["question_id"], []).append({
                    "id": op["id"],
                    "option_text": op["option_text"]
                })

        preguntas_limpias = []
        for p in preguntas_activas:
            preguntas_limpias.append({
                "id": p["id"],
                "statement": p["statement"],
                "competence_id": p.get("competence_id") or taller.get("competence_id"),
                "question_option": ops_map.get(p["id"], [])
            })

        return {
            "estado": "éxito",
            "taller": {
                "id": taller["id"],
                "tema": taller["topic"],
                "modalidad": modalidad,
                "duracion_minutos": taller.get("duracion_minutos", 60 if modalidad == "simulacro" else None),
                "bloquear_ia": (modalidad == "simulacro"),
                "preguntas": preguntas_limpias
            }
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR OBTENER TALLER: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Calificación, desglose por competencia y retroalimentación IA
@router.post("/entregar")
def procesar_entrega(entrega: EntregaTaller):
    try:
        alumn_id_real = resolver_alumn_id(entrega.id_estudiante)
        ids_preguntas = [resp.id_pregunta for resp in entrega.respuestas]

        # Traer respuestas correctas
        res_correctas = supabase.table("question_option") \
            .select("question_id, option_text") \
            .eq("is_correct", True) \
            .in_("question_id", ids_preguntas) \
            .execute()
        mapa_correctas = {item["question_id"]: item["option_text"] for item in res_correctas.data}

        # Traer metadatos de preguntas y competencias para desglosar resultados
        res_pregs = supabase.table("question").select("id, statement, competence_id").in_("id", ids_preguntas).execute()
        pregs_map = {p["id"]: p for p in res_pregs.data}

        res_ws = supabase.table("workshop").select("competence_id, topic").eq("id", entrega.id_workshop).execute()
        ws_info = res_ws.data[0] if res_ws.data else {}
        default_comp_id = ws_info.get("competence_id")

        res_comps = supabase.table("competence").select("id, name").execute()
        comps_names = {c["id"]: c["name"] for c in res_comps.data}

        total_preguntas = len(entrega.respuestas)
        respuestas_correctas = 0
        desglose_comp = {}
        errores_para_ia = []

        for resp in entrega.respuestas:
            opcion_marcada = resp.respuesta_seleccionada.strip()
            opcion_real = mapa_correctas.get(resp.id_pregunta, "").strip()
            es_acierto = (opcion_marcada == opcion_real)

            preg_info = pregs_map.get(resp.id_pregunta, {})
            comp_id = preg_info.get("competence_id") or default_comp_id
            nombre_comp = comps_names.get(comp_id, ws_info.get("topic", "General"))

            if nombre_comp not in desglose_comp:
                desglose_comp[nombre_comp] = {"correctas": 0, "incorrectas": 0, "total": 0}

            desglose_comp[nombre_comp]["total"] += 1
            if es_acierto:
                respuestas_correctas += 1
                desglose_comp[nombre_comp]["correctas"] += 1
            else:
                desglose_comp[nombre_comp]["incorrectas"] += 1
                errores_para_ia.append(f"- Pregunta: '{preg_info.get('statement', '')}' | Marcó: '{opcion_marcada}'")

        score = (respuestas_correctas / total_preguntas) * 100 if total_preguntas > 0 else 0

        # Generar diagnóstico general para submission.ai_feedback
        ai_feedback = "¡Excelente trabajo! Respondiste correctamente todas las preguntas del intento."
        if errores_para_ia:
            try:
                resumen_errores = "\n".join(errores_para_ia[:5])
                prompt_general = (
                    f"Actúa como tutor ICFES. Un estudiante obtuvo {round(score, 1)}/100 en '{ws_info.get('topic', 'Simulacro')}'. "
                    f"Falló en:\n{resumen_errores}\n"
                    f"Redacta una retroalimentación general motivadora en máximo 3 líneas indicando qué habilidad debe reforzar, sin dar las respuestas literales."
                )
                ia_resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt_general)
                ai_feedback = ia_resp.text.strip()
            except Exception as ia_err:
                print(f"DEBUG AVISO AI FEEDBACK: {repr(ia_err)}")
                ai_feedback = f"Obtuviste {respuestas_correctas} de {total_preguntas} aciertos. Revisa el detalle de tus errores para practicar con el tutor de IA."

        # Guardar submission y student_answer
        payload_submission = {
            "workshop_id": entrega.id_workshop,
            "alumn_id": alumn_id_real,
            "score": score,
            "ai_feedback": ai_feedback
        }
        res_sub = supabase.table("submission").insert(payload_submission).execute()
        submission_id = res_sub.data[0]["id"]

        respuestas_db = [
            {
                "submission_id": submission_id,
                "question_id": resp.id_pregunta,
                "selected_answer": resp.respuesta_seleccionada
            }
            for resp in entrega.respuestas
        ]
        supabase.table("student_answer").insert(respuestas_db).execute()

        return {
            "estado": "éxito",
            "mensaje": "Evaluación calificada y registrada correctamente.",
            "submission_id": submission_id,
            "resultados": {
                "preguntas_totales": total_preguntas,
                "respuestas_correctas": respuestas_correctas,
                "respuestas_incorrectas": total_preguntas - respuestas_correctas,
                "puntaje_final": round(score, 2),
                "desglose_competencias": desglose_comp,
                "retroalimentacion_ia": ai_feedback
            }
        }
    except Exception as e:
        print(f"DEBUG ERROR ENTREGA TALLER: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al calificar y guardar: {str(e)}")


# Revisión post-simulacro (desbloquea tutoría IA al finalizar)
@router.get("/intento/{submission_id}/revision")
def revisar_intento_finalizado(submission_id: int):
    try:
        res_sub = supabase.table("submission").select("*").eq("id", submission_id).execute()
        if not res_sub.data:
            raise HTTPException(status_code=404, detail="Intento no encontrado.")
        submission = res_sub.data[0]

        res_ans = supabase.table("student_answer").select("*").eq("submission_id", submission_id).execute()
        q_ids = [a["question_id"] for a in res_ans.data]

        pregs_map = {}
        ops_map = {}
        if q_ids:
            res_pregs = supabase.table("question").select("*").in_("id", q_ids).execute()
            pregs_map = {p["id"]: p for p in res_pregs.data}

            res_ops = supabase.table("question_option").select("*").in_("question_id", q_ids).execute()
            for op in res_ops.data:
                ops_map.setdefault(op["question_id"], []).append(op)

        detalle = []
        for ans in res_ans.data:
            qid = ans["question_id"]
            marcada = ans["selected_answer"].strip()
            opciones = ops_map.get(qid, [])

            correcta_txt = ""
            causa_error = None
            for op in opciones:
                if op.get("is_correct"):
                    correcta_txt = op["option_text"].strip()
                if op["option_text"].strip() == marcada and not op.get("is_correct"):
                    causa_error = op.get("error_reason", "Error de interpretación")

            es_correcta = (marcada == correcta_txt)
            detalle.append({
                "id_pregunta": qid,
                "enunciado": pregs_map.get(qid, {}).get("statement", ""),
                "respuesta_estudiante": marcada,
                "es_correcta": es_correcta,
                "opcion_correcta": correcta_txt,
                "causa_error": None if es_correcta else causa_error,
                "puede_pedir_tutoria_ia": not es_correcta
            })

        return {
            "estado": "éxito",
            "submission_id": submission_id,
            "puntaje": submission.get("score"),
            "retroalimentacion_general_ia": submission.get("ai_feedback"),
            "detalle_preguntas": detalle
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR REVISION INTENTO: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))