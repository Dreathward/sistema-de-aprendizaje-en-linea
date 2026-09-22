from fastapi import APIRouter

router = APIRouter(prefix="/evaluacion", tags=["Módulo de Evaluación"])

@router.get("/")
def prueba_evaluacion():
    return {"modulo": "Evaluación", "mensaje": "Enrutador de Evaluación listo."}
