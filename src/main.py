from fastapi import FastAPI
from src.modules.ia.router import router as ia_router
from src.modules.auth.router import router as auth_router
from src.modules.cursos.router import router as cursos_router
from src.modules.evaluacion.router import router as evaluacion_router
from src.modules.stats.router import router as stats_router

app = FastAPI(
    title="API - Sistema de Aprendizaje con IA Adaptativa",
    version="1.0.0"
)

# Registramos TODOS los submódulos aquí
app.include_router(ia_router)
app.include_router(auth_router)
app.include_router(cursos_router)
app.include_router(evaluacion_router)
app.include_router(stats_router)

@app.get("/")
def health_check():
    return {"estado": "Online", "mensaje": "El servidor de Thomas y Jeison está funcionando."}
