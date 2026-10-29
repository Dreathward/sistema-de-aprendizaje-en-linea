from fastapi import APIRouter, HTTPException
from src.database import supabase

router = APIRouter(prefix="/competencias", tags=["Módulo de Competencias"])

@router.get("/")
def obtener_todas_las_competencias():
    try:
        # Traer el catálogo general de materias de la tabla 'competence'
        res = supabase.table("competence").select("id, name, category").execute()
        
        return {
            "estado": "éxito",
            "competencias": res.data
        }
    except Exception as e:
        print(f"DEBUG ERROR COMPETENCIAS: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")

@router.get("/estudiante/{id_estudiante}")
def obtener_progreso_estudiante(id_estudiante: int):
    try:
        # Consultar el nivel alcanzado haciendo un Join con la tabla 'competence'
        res = supabase.table("alumn_competence") \
            .select("level_achieved, competence(name, category)") \
            .eq("alumn_id", id_estudiante) \
            .execute()
            
        # Formatear la respuesta para que sea más fácil de leer en JavaScript
        progreso = []
        for item in res.data:
            progreso.append({
                "materia": item["competence"]["name"],
                "categoria": item["competence"]["category"],
                "nivel_alcanzado": item["level_achieved"]
            })
            
        return {
            "estado": "éxito",
            "progreso_competencias": progreso
        }
    except Exception as e:
        print(f"DEBUG ERROR PROGRESO: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener progreso: {str(e)}")