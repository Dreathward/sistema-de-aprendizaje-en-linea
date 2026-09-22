from fastapi import APIRouter

# Definimos el enrutador para este módulo
router = APIRouter(
    prefix="/ia",
    tags=["Módulo Adaptativo (IA)"]
)

@router.post("/generar-tutoria")
def generar_tutoria():
    return {
        "modulo": "IA", 
        "mensaje": "Aquí irá la lógica de Jeison y Thomas para conectar con Gemini."
    }
