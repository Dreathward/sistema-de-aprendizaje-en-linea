from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from src.modules.ia.router import router as ia_router
from src.modules.auth.router import router as auth_router
from src.modules.competencias.router import router as competencias_router
from src.modules.evaluacion.router import router as evaluacion_router
from src.modules.stats.router import router as stats_router

app = FastAPI(
    title="Sistema de Aprendizaje con IA Adaptativa",
    version="1.0.0"
)

# 1. Habilitar CORS para evitar bloqueos de seguridad del navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Submódulos (routers) de la aplicación
app.include_router(ia_router)
app.include_router(auth_router)
app.include_router(competencias_router)
app.include_router(evaluacion_router)
app.include_router(stats_router)

# Montaje de archivos estáticos del frontend (HTML, CSS y JavaScript)
frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.exists(frontend_path):
    app.mount("/src/frontend", StaticFiles(directory=frontend_path), name="frontend")
    app.mount("/views", StaticFiles(directory=os.path.join(frontend_path, "views")), name="views")
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")
    app.mount("/css", StaticFiles(directory=os.path.join(frontend_path, "css")), name="css")
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

# Entrega de la interfaz gráfica principal en la ruta raíz (/)
@app.get("/")
def read_root():
    login_path = os.path.join(frontend_path, "views", "login.html")
    if os.path.exists(login_path):
        return FileResponse(login_path)
    return {"estado": "Online", "mensaje": "Vista de login no encontrada en src/frontend/views/login.html"}

@app.get("/health")
def health_check():
    return {"estado": "Online", "mensaje": "El servidor está funcionando."}