from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Módulo de Autenticación"])

@router.get("/")
def prueba_auth():
    return {"modulo": "Auth", "mensaje": "Enrutador de Autenticación listo."}
