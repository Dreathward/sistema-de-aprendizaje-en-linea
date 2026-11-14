import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from src.database import supabase, resolver_alumn_id
from src.modules.auth.Security import verificar_token

load_dotenv()
client = genai.Client()

router = APIRouter(
    prefix="/ia",
    tags=["Módulo Orquestador de IA"],
    dependencies=[Depends(verificar_token)]
)

class PeticionTutor(BaseModel):
    id_estudiante: int
    id_pregunta: int
    competencia: str
    pregunta_enunciado: str
    distractor_elegido: str
    opcion_correcta: str | None = None
    causa_error: str | None = None
    modalidad: str = "entrenamiento"  # "entrenamiento", "revision_simulacro" o "simulacro_activo"


@router.post("/tutor-descarte")
def generar_tutoria_descarte(peticion: PeticionTutor):
    # Bloquear peticiones de IA mientras un simulacro real esté en curso
    if peticion.modalidad == "simulacro_activo":
        raise HTTPException(
            status_code=403,
            detail="La tutoría de IA está deshabilitada durante la presentación de un simulacro real. Podrás consultarla en la revisión final."
        )

    distractor_limpio = peticion.distractor_elegido.strip()

    try:
        alumn_id_real = resolver_alumn_id(peticion.id_estudiante)

        # Verificar primero en la tabla 'ia_cache' para ahorrar tokens
        res_cache = supabase.table("ia_cache") \
            .select("explanation") \
            .eq("question_id", peticion.id_pregunta) \
            .eq("selected_distractor", distractor_limpio) \
            .limit(1) \
            .execute()

        if res_cache.data:
            return {
                "estado": "éxito",
                "explicacion_ia": res_cache.data[0]["explanation"],
                "origen": "cache_db"
            }

        # Completar opcion_correcta y causa_error desde BD si el frontend no las envió (seguridad anti-trampa)
        opcion_correcta = peticion.opcion_correcta
        causa_error = peticion.causa_error

        if not opcion_correcta or not causa_error:
            res_ops = supabase.table("question_option") \
                .select("option_text, is_correct, error_reason") \
                .eq("question_id", peticion.id_pregunta) \
                .execute()

            for op in res_ops.data:
                if op.get("is_correct") and not opcion_correcta:
                    opcion_correcta = op["option_text"]
                if op["option_text"].strip() == distractor_limpio and not causa_error:
                    causa_error = op.get("error_reason")

        causa_texto = causa_error or "Interpretación imprecisa del enunciado o distractor conceptual"
        correcta_texto = opcion_correcta or "No especificada"

        # Prompt pedagógico formateado y acotado a lógica de descarte
        prompt = f"""
        Actúa como un tutor pedagógico experto en las Pruebas Saber (ICFES) para la competencia de {peticion.competencia}.

        Enunciado de la pregunta:
        "{peticion.pregunta_enunciado}"

        Respuesta correcta (NO la reveles): "{correcta_texto}"
        Opción incorrecta elegida por el estudiante: "{distractor_limpio}"
        Hipótesis del error conceptual del distractor: "{causa_texto}"

        Instrucciones estrictas de formato y pedagogía:
        1. Redacta un párrafo breve (máximo 3 líneas) explicando por qué la opción elegida cae en la trampa conceptual indicada, sin decir cuál es la opción correcta.
        2. Añade exactamente 2 viñetas cortas con pistas de lectura o razonamiento para descartar ese distractor por cuenta propia.
        3. Usa negritas únicamente para resaltar 2 o 3 conceptos clave.
        """

        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )
            explicacion_generada = response.text.strip()
        except Exception as api_err:
            # HU-15 (Criterio 3): Mensaje amigable si falla la API externa
            print(f"DEBUG ERROR GEMINI API: {repr(api_err)}")
            raise HTTPException(
                status_code=503,
                detail="El servicio de tutoría inteligente está temporalmente ocupado. Por favor, intenta solicitar la explicación nuevamente en unos segundos."
            )

        # Guardar en 'ia_cache' para futuros estudiantes con el mismo error
        supabase.table("ia_cache").insert({
            "question_id": peticion.id_pregunta,
            "selected_distractor": distractor_limpio,
            "explanation": explicacion_generada
        }).execute()

        # 5egistrar trazabilidad en 'ia_interaction' si la tabla está disponible
        try:
            supabase.table("ia_interaction").insert({
                "alumn_id": alumn_id_real,
                "prompt": f"Q{peticion.id_pregunta} | {distractor_limpio}",
                "response": explicacion_generada,
                "interaction_type": "tutor_descarte"
            }).execute()
        except Exception:
            pass

        return {
            "estado": "éxito",
            "explicacion_ia": explicacion_generada,
            "origen": "generado_por_api"
        }

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR ORQUESTADOR IA: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno en el módulo de IA: {str(e)}")