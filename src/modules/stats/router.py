from fastapi import APIRouter, HTTPException
from src.database import supabase

router = APIRouter(prefix="/stats", tags=["Módulo de Analíticas"])

@router.get("/estudiante/{id_estudiante}")
def obtener_metricas_estudiante(id_estudiante: int):
    try:
        # Consultar todas las entregas de este estudiante en específico
        res = supabase.table("submission").select("score").eq("alumn_id", id_estudiante).execute()
        entregas = res.data

        # Si el estudiante es nuevo y no ha hecho simulacros, devolvemos todo en cero
        if not entregas:
            return {
                "estado": "éxito",
                "metricas": {
                    "talleres_completados": 0,
                    "promedio_general": 0.0,
                    "mensaje": "Aún no hay simulacros completados."
                }
            }

        # Lógica matemática para el Dashboard
        total_talleres = len(entregas)
        # Sumamos las notas asegurándonos de ignorar valores nulos por precaución
        suma_puntajes = sum([entrega["score"] for entrega in entregas if entrega["score"] is not None])
        promedio = suma_puntajes / total_talleres

        return {
            "estado": "éxito",
            "metricas": {
                "talleres_completados": total_talleres,
                "promedio_general": round(promedio, 2)
            }
        }
    except Exception as e:
        print(f"DEBUG ERROR STATS: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener analíticas: {str(e)}")