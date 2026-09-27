from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/evaluacion", tags=["Módulo de Evaluación y Banco de Preguntas"])

# Contratos de datos para recibir las respuestas
class RespuestaEstudiante(BaseModel):
    id_pregunta: int
    respuesta_seleccionada: str

class EntregaTaller(BaseModel):
    id_estudiante: int
    id_seccion: str
    respuestas: list[RespuestaEstudiante]

# Endpoint para obtener el taller de una sección específica
@router.get("/{id_seccion}/taller")
def obtener_taller(id_seccion: str):
    # Simulación de un cuestionario activo generado previamente
    return {
        "estado": "éxito",
        "id_seccion": id_seccion,
        "tema": "El Renacimiento y la Edad Moderna",
        "preguntas": [
            {
                "id_pregunta": 101,
                "enunciado": "¿Cuál fue el principal cambio de pensamiento durante el Renacimiento?",
                "opciones": [
                    "El teocentrismo absolutista",
                    "El antropocentrismo",
                    "La revolución industrial",
                    "El feudalismo económico"
                ]
            },
            {
                "id_pregunta": 102,
                "enunciado": "¿Qué invento facilitó la expansión de las ideas renacentistas?",
                "opciones": [
                    "La brújula",
                    "La máquina de vapor",
                    "La imprenta de Gutenberg",
                    "El telescopio"
                ]
            }
        ]
    }

# Endpoint para recibir y procesar las respuestas del alumno
@router.post("/entregar")
def procesar_entrega(entrega: EntregaTaller):

    # Aquí irá la lógica pesada en el Sprint 5 para calificar y llamar a Gemini si hay errores
    
    return {
        "estado": "éxito",
        "mensaje": f"Taller recibido correctamente del estudiante {entrega.id_estudiante} de la sección {entrega.id_seccion}.",
        "analisis_ia": "Pendiente de integración en el Sprint 5"
    }