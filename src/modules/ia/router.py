import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from src.database import supabase

load_dotenv()
client = genai.Client()

router = APIRouter(prefix="/ia", tags=["Módulo Orquestador de IA"])

class PeticionTutor(BaseModel):
    id_pregunta: str
    competencia: str
    pregunta_enunciado: str
    opcion_correcta: str
    distractor_elegido: str

@router.post("/tutor-descarte")
def generar_tutoria_descarte(peticion: PeticionTutor):
    llave_cache = f"{peticion.id_pregunta}_{peticion.distractor_elegido}"
    
    try:
        # Buscar en Supabase si esta explicación ya se generó antes
        res = supabase.table("ia_cache").select("explicacion").eq("llave", llave_cache).execute()
        
        if res.data:
            return {
                "estado": "éxito",
                "explicacion_ia": res.data[0]["explicacion"],
                "origen": "cache_db"
            }

        # Si no existe en la base de datos, construimos el prompt y llamamos a Gemini
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
            model='gemini-3.5-flash',
            contents=prompt
        )
        explicacion_generada = response.text
        
        # Guardar la nueva explicación en Supabase para futuras consultas
        supabase.table("ia_cache").insert({
            "llave": llave_cache,
            "explicacion": explicacion_generada
        }).execute()

        return {
            "estado": "éxito",
            "explicacion_ia": explicacion_generada,
            "origen": "generado_por_api" 
        }

    except Exception as e:
        print(f"DEBUG ERROR IA/DB: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error en IA o Base de Datos: {str(e)}")