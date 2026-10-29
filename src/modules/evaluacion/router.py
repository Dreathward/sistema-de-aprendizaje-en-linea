from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.database import supabase
from src.modules.auth.router import verificar_token

router = APIRouter(
    prefix="/evaluacion", 
    tags=["Módulo de Evaluación y Banco de Preguntas"],
    dependencies=[Depends(verificar_token)]
)

# Contratos de datos
class RespuestaEstudiante(BaseModel):
    id_pregunta: int
    respuesta_seleccionada: str

class EntregaTaller(BaseModel):
    id_estudiante: int
    id_workshop: int
    respuestas: list[RespuestaEstudiante]

@router.get("/{id_workshop}/taller")
def obtener_taller(id_workshop: int):
    try:
        # Obtener la cabecera del taller
        res_workshop = supabase.table("workshop").select("*").eq("id", id_workshop).execute()
        if not res_workshop.data:
            raise HTTPException(status_code=404, detail="Taller no encontrado en la base de datos")
        
        taller = res_workshop.data[0]

        # Obtener las preguntas anidadas con sus opciones
        res_preguntas = supabase.table("question") \
            .select("id, statement, question_option(id, option_text, is_correct)") \
            .eq("workshop_id", id_workshop) \
            .execute()
        
        return {
            "estado": "éxito",
            "taller": {
                "id": taller["id"],
                "tema": taller["topic"],
                "preguntas": res_preguntas.data
            }
        }
    except Exception as e:
        print(f"DEBUG ERROR OBTENER TALLER: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/entregar")
def procesar_entrega(entrega: EntregaTaller):
    try:
        # Obtener la lista de IDs de las preguntas que respondió el estudiante
        ids_preguntas = [resp.id_pregunta for resp in entrega.respuestas]
        
        # Consultar a Supabase cuáles son las opciones correctas de esas preguntas
        res_correctas = supabase.table("question_option") \
            .select("question_id, option_text") \
            .eq("is_correct", True) \
            .in_("question_id", ids_preguntas) \
            .execute()
        
        # Convertimos la respuesta a un diccionario de Python para buscar rápido 
        mapa_correctas = {item["question_id"]: item["option_text"] for item in res_correctas.data}
        
        # Comparar respuestas y calcular el puntaje
        total_preguntas = len(entrega.respuestas)
        respuestas_correctas = 0
        
        for resp in entrega.respuestas:
            # Quitamos posibles espacios en blanco extra por seguridad
            opcion_marcada = resp.respuesta_seleccionada.strip()
            opcion_real = mapa_correctas.get(resp.id_pregunta, "").strip()
            
            if opcion_marcada == opcion_real:
                respuestas_correctas += 1
                
        # Calificación sobre 100 (Estilo porcentaje ICFES)
        score = (respuestas_correctas / total_preguntas) * 100 if total_preguntas > 0 else 0
        
        # Crear el registro en 'submission' incluyendo el score
        payload_submission = {
            "workshop_id": entrega.id_workshop,
            "alumn_id": entrega.id_estudiante,
            "score": score
        }
        res_sub = supabase.table("submission").insert(payload_submission).execute()
        submission_id = res_sub.data[0]["id"]

        # Preparar y guardar los incisos marcados por el estudiante
        respuestas_db = []
        for resp in entrega.respuestas:
            respuestas_db.append({
                "submission_id": submission_id,
                "question_id": resp.id_pregunta,
                "selected_answer": resp.respuesta_seleccionada
            })
        
        supabase.table("student_answer").insert(respuestas_db).execute()

        # Devolvemos un reporte completo para que se pueda mostrar la nota al estudiante
        return {
            "estado": "éxito",
            "mensaje": "Taller calificado y guardado correctamente.",
            "submission_id": submission_id,
            "resultados": {
                "preguntas_totales": total_preguntas,
                "respuestas_correctas": respuestas_correctas,
                "puntaje_final": round(score, 2) # Redondeado a 2 decimales
            }
        }
    except Exception as e:
        print(f"DEBUG ERROR ENTREGA TALLER: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al calificar y guardar: {str(e)}")