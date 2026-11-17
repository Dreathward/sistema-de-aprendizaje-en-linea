import httpx
from supabase import create_client, Client, ClientOptions

# Credenciales de Supabase
SUPABASE_URL = "https://vxsfvnhxzpaxcsridczy.supabase.co"
SUPABASE_KEY = "sb_publishable_yuMWHTMIWVM1peup5yfwLw_CuGpz2Tn"

# Cliente HTTP sin HTTP/2 ni sockets reciclados para evitar WinError 10035 en Windows
_http_client = httpx.Client(
    http2=False,
    timeout=20.0,
    limits=httpx.Limits(max_keepalive_connections=0, max_connections=20),
)

# Inicializar cliente de Supabase
try:
    supabase: Client = create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options=ClientOptions(httpx_client=_http_client),
    )
except TypeError:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    supabase.postgrest.session = httpx.Client(
        base_url=str(supabase.postgrest.session.base_url),
        headers=dict(supabase.postgrest.session.headers),
        http2=False,
        timeout=20.0,
        limits=httpx.Limits(max_keepalive_connections=0, max_connections=20),
    )

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