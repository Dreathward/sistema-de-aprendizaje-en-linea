from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client

# Configuración y conexión con Supabase
SUPABASE_URL = "https://vxsfvnhxzpaxcsridczy.supabase.co"
SUPABASE_KEY = "sb_publishable_yuMWHTMIWVM1peup5yfwLw_CuGpz2Tn"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(prefix="/auth", tags=["Módulo de Autenticación y Roles"])

# Contratos de datos (schemas)
class UsuarioLogin(BaseModel):
    correo: EmailStr
    password: str

class UsuarioRegistro(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    rol: str
    grado: str | None = None

# Endpoint para iniciar sesión conectado a Supabase
@router.post("/login")
def iniciar_sesion(credenciales: UsuarioLogin):
    try:
        # Consulta en la tabla 'usuarios' por correo electrónico
        res = supabase.table("usuarios").select("*").eq("correo", credenciales.correo).execute()
        usuarios = res.data

        # Validar si el usuario existe
        if not usuarios:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        usuario_db = usuarios[0]

        # Validar contraseña (soporta campo 'password' o 'contrasena')
        password_db = usuario_db.get("password") or usuario_db.get("contrasena")
        if password_db != credenciales.password:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # Retornar el payload esperado por el frontend
        return {
            "estado": "éxito",
            "token_sesion": f"token_seguro_{usuario_db.get('id', 'temp')}",
            "usuario": {
                "nombre": usuario_db.get("nombre", "Estudiante"),
                "rol": usuario_db.get("rol", "estudiante"),
                "grado": usuario_db.get("grado", "11")
            }
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al conectar con la base de datos: {str(e)}"
        )

# Endpoint de registro persistente en Supabase
@router.post("/registro")
def registrar_usuario(nuevo_usuario: UsuarioRegistro):
    try:
        payload = {
            "nombre": nuevo_usuario.nombre,
            "correo": nuevo_usuario.correo,
            "password": nuevo_usuario.password,
            "rol": nuevo_usuario.rol,
            "grado": nuevo_usuario.grado
        }
        res = supabase.table("usuarios").insert(payload).execute()
        
        return {
            "estado": "éxito",
            "mensaje": f"El {nuevo_usuario.rol} {nuevo_usuario.nombre} fue registrado correctamente."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al registrar usuario en la base de datos: {str(e)}"
        )