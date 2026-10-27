from supabase import create_client, Client

# Credenciales de Supabase
SUPABASE_URL = "https://vxsfvnhxzpaxcsridczy.supabase.co"
SUPABASE_KEY = "sb_publishable_yuMWHTMIWVM1peup5yfwLw_CuGpz2Tn"

# Inicializar cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)