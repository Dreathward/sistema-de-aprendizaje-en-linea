import os
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client()

router = APIRouter(prefix="/ia", tags=["Módulo Orquestador de IA"])

# Contrato de datos (lo que el Frontend va a enviar)
class PeticionTutor(BaseModel):
    competencia: str
    pregunta_enunciado: str
    opcion_correcta: str
    distractor_elegido: str

@router.post("/tutor-descarte")
def generar_tutoria_descarte(peticion: PeticionTutor):
    try:
        # Prompt basado en la lógica de descarte ICFES
        prompt = f"""
        Actúa como un tutor experto en preparación para las Pruebas Saber (ICFES) en la competencia de {peticion.competencia}.
        
        El estudiante analizó el siguiente enunciado: 
        "{peticion.pregunta_enunciado}"
        
        La respuesta correcta es: "{peticion.opcion_correcta}"
        Sin embargo, el estudiante eligió el siguiente distractor incorrecto: "{peticion.distractor_elegido}"
        
        Tu tarea: 
        Explícale al estudiante, en un párrafo corto, por qué la opción que eligió es una "trampa" conceptual o un error de lectura. 
        Enséñale a identificar la pista en el texto para descartar esa opción. 
        NO le digas directamente cuál es la respuesta correcta, guíalo para que lo deduzca.
        """

        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt
        )

        return {
            "estado": "éxito",
            "explicacion_ia": response.text,
            "origen": "generado_por_api" # Mas adelante cambiaremos esto cuando leamos   la Caché
        }

    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}