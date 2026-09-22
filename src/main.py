from fastapi import FastAPI
from src.modules.ia.router import router as ia_router

app = FastAPI(
    title="API - Sistema de Aprendizaje con IA Adaptativa",
    version="1.0.0"
)

# Registramos los submódulos aquí
app.include_router(ia_router)

@app.get("/")
def health_check():
    return {"estado": "Online", "mensaje": "El servidor de Thomas y Jeison está funcionando."}