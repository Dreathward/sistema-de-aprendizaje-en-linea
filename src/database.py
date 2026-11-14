from supabase import create_client, Client

# Credenciales de Supabase
SUPABASE_URL = "https://vxsfvnhxzpaxcsridczy.supabase.co"
SUPABASE_KEY = "sb_publishable_yuMWHTMIWVM1peup5yfwLw_CuGpz2Tn"

# Inicializar cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def resolver_alumn_id(user_id: int) -> int:
    """
    Traduce un users.id al alumn.id correspondiente.
    Si el estudiante existe en 'users' pero aún no tiene fila en 'alumn', la crea automáticamente.
    """
    res = supabase.table("alumn").select("id").eq("user_id", user_id).execute()
    if res.data:
        return res.data[0]["id"]

    nuevo_alumno = supabase.table("alumn").insert({
        "user_id": user_id,
        "is_active": True
    }).execute()
    return nuevo_alumno.data[0]["id"]