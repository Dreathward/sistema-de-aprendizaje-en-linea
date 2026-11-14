from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.database import supabase, resolver_alumn_id
from src.modules.auth.Security import verificar_token

router = APIRouter(prefix="/competencias", tags=["Módulo de Competencias"])

class CompetenciaCrear(BaseModel):
    nombre: str
    categoria: str
    descripcion: str | None = None

# Consulta del Catálogo de Competencias ICFES
@router.get("/")
def obtener_todas_las_competencias():
    try:
        res = supabase.table("competence").select("*").execute()
        competencias = []
        for item in res.data:
            competencias.append({
                "id": item["id"],
                "nombre": item.get("name"),
                "categoria": item.get("category"),
                "descripcion": item.get("description", "Evaluación de habilidades fundamentales según estructura ICFES.")
            })

        return {
            "estado": "éxito",
            "competencias": competencias
        }
    except Exception as e:
        print(f"DEBUG ERROR COMPETENCIAS: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")


@router.post("/", dependencies=[Depends(verificar_token)])
def crear_competencia(datos: CompetenciaCrear):
    try:
        payload = {
            "name": datos.nombre.strip(),
            "category": datos.categoria.strip(),
            "description": datos.descripcion.strip() if datos.descripcion else None
        }
        res = supabase.table("competence").insert(payload).execute()
        return {
            "estado": "éxito",
            "mensaje": f"Competencia '{datos.nombre}' registrada correctamente.",
            "competencia": res.data[0]
        }
    except Exception as e:
        print(f"DEBUG ERROR CREAR COMPETENCIA: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear competencia: {str(e)}")


@router.get("/estudiante/{id_estudiante}", dependencies=[Depends(verificar_token)])
def obtener_progreso_estudiante(id_estudiante: int):
    try:
        alumn_id_real = resolver_alumn_id(id_estudiante)
        res_prog = supabase.table("alumn_competence").select("*").eq("alumn_id", alumn_id_real).execute()

        if not res_prog.data:
            return {"estado": "éxito", "progreso_competencias": []}

        comp_ids = list({item["competence_id"] for item in res_prog.data})
        res_comps = supabase.table("competence").select("*").in_("id", comp_ids).execute()
        comps_map = {c["id"]: c for c in res_comps.data}

        progreso = []
        for item in res_prog.data:
            comp_info = comps_map.get(item["competence_id"], {})
            progreso.append({
                "competence_id": item["competence_id"],
                "materia": comp_info.get("name", "Competencia"),
                "categoria": comp_info.get("category", "General"),
                "nivel_alcanzado": item.get("level_achieved", "En progreso"),
                "fecha_actualizacion": item.get("acquired_at")
            })

        return {
            "estado": "éxito",
            "progreso_competencias": progreso
        }
    except Exception as e:
        print(f"DEBUG ERROR PROGRESO: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener progreso: {str(e)}")