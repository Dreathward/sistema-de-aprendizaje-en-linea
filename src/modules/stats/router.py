from fastapi import APIRouter

router = APIRouter(prefix="/stats", tags=["Módulo de Analíticas"])

@router.get("/")
def prueba_stats():
    return {"modulo": "Analíticas", "mensaje": "Enrutador de Analíticas listo."}
