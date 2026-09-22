from fastapi import APIRouter

router = APIRouter(prefix="/cursos", tags=["Módulo de Cursos y Secciones"])

@router.get("/")
def prueba_cursos():
    return {"modulo": "Cursos", "mensaje": "Enrutador de Cursos listo."}
