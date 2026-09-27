from fastapi import APIRouter

router = APIRouter(prefix="/competencias", tags=["Módulo de Competencias e Instituciones"])

# Endpoint para obtener el catalogo de materias
@router.get("/")
def listar_competencias():
    return {
        "estado": "éxito",
        "competencias": [
            {"id": 1, "nombre": "Lectura Crítica", "categoria": "Humanidades"},
            {"id": 2, "nombre": "Matemáticas y Razonamiento", "categoria": "Ciencias Exactas"},
            {"id": 3, "nombre": "Ciencias Naturales", "categoria": "Ciencias Exactas"},
            {"id": 4, "nombre": "Inglés", "categoria": "Idiomas"}
        ]
    }

# Endpoint dinámico para listar los salones segun el grado escolar
@router.get("/{grado}/secciones")
def listar_secciones(grado: int):
    # Simulación de los salones para un grado específico (ej. si entra 6, devuelve 6-1 y 6-2)
    return {
        "estado": "éxito",
        "grado": grado,
        "secciones": [
            {"id_seccion": f"{grado}01", "nombre": f"{grado}-1", "estudiantes_activos": 25},
            {"id_seccion": f"{grado}02", "nombre": f"{grado}-2", "estudiantes_activos": 28}
        ]
    }