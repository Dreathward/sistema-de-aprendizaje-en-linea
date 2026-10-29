from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from fastapi import Header, HTTPException

# Conexión con Supabase
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
    rol: str = "student"
    grado: str | None = None

class RecuperarPassword(BaseModel):
    correo: EmailStr


@router.post("/login")
def iniciar_sesion(credenciales: UsuarioLogin):
    try:
        # Consulta directa a la tabla 'users' filtrando por 'email'
        res = (
            supabase.table("users")
            .select("*")
            .eq("email", credenciales.correo)
            .execute()
        )
        usuarios = res.data

        # 1. Verificar si el usuario existe
        if not usuarios:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        usuario_db = usuarios[0]

        # 2. Verificar si la cuenta está activa (campo is_active de la BD)
        if usuario_db.get("is_active") is False:
            raise HTTPException(status_code=403, detail="Esta cuenta se encuentra inactiva")

        # 3. Validar contraseña
        if usuario_db.get("password") != credenciales.password:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # 4. Mapeo al contrato JSON exacto que espera tu frontend
        return {
            "estado": "éxito",
            "token_sesion": f"token_seguro_{usuario_db.get('id')}",
            "usuario": {
                "id": usuario_db.get("id"),
                "nombre": usuario_db.get("name", "Estudiante"),
                "rol": usuario_db.get("role", "student"),
                "grado": "11"  # Valor por defecto mientras se vincula con la tabla team
            }
        }

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR SUPABASE: {repr(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al conectar con la base de datos: {str(e)}"
        )


@router.post("/registro")
def registrar_usuario(nuevo_usuario: UsuarioRegistro):
    try:
        # Mapeo a las columnas exactas de la tabla 'users': name, email, password, role, is_active
        payload = {
            "name": nuevo_usuario.nombre,
            "email": nuevo_usuario.correo,
            "password": nuevo_usuario.password,
            "role": nuevo_usuario.rol,
            "is_active": True
        }
        res = supabase.table("users").insert(payload).execute()

        return {
            "estado": "éxito",
            "mensaje": f"El usuario {nuevo_usuario.nombre} fue registrado correctamente en la base de datos."
        }
    except Exception as e:
        print(f"DEBUG ERROR REGISTRO: {repr(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al registrar usuario en la base de datos: {str(e)}"
        )

@router.post("/recuperar-password")
def solicitar_recuperacion(datos: RecuperarPassword):
    try:
        # Verificar si el correo existe en la tabla de Supabase
        res = supabase.table("users").select("id, name").eq("email", datos.correo).execute()
        
        # Práctica de seguridad de retornar éxito incluso si el correo no existe
        if not res.data:
            return {
                "estado": "éxito",
                "mensaje": "Si el correo está registrado, recibirás las instrucciones de recuperación."
            }
            
        usuario = res.data[0]
        
        # Generar un token temporal (Mockup, luego se puede guardar en una tabla 'password_resets')
        token_recuperacion = f"reset_{usuario['id']}_xyz789"
        
        # A futuro: Integrar librería para enviar correos (ej. smtplib o Resend)
        # Por ahora, simulamos el envío devolviendo el enlace en consola o en modo debug
        print(f"ENVIANDO CORREO A {datos.correo} -> Enlace: http://localhost:8000/restablecer?token={token_recuperacion}")
        
        return {
            "estado": "éxito",
            "mensaje": "Si el correo está registrado, recibirás las instrucciones de recuperación.",
            "debug_token": token_recuperacion
        }
        
    except Exception as e:
        print(f"DEBUG ERROR RECUPERACIÓN: {repr(e)}")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")