from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Módulo de Autenticación y Roles"])

# Contratos de datos (Lo que esperamos recibir del frontend)
class UsuarioLogin(BaseModel):
    correo: EmailStr # Valida automáticamente que tenga un formato de email válido
    password: str

class UsuarioRegistro(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    rol: str # Esperamos "docente" o "estudiante"
    grado: str | None = None # Opcional ya que solo aplica si el rol es estudiante

# Endpoint de Inicio de Sesión
@router.post("/login")
def iniciar_sesion(credenciales: UsuarioLogin):

    # Hay que reemplazar esto en el futuro con la consulta real a Supabase
    
    # Simulamos un docente exitoso
    if credenciales.correo == "profe@colegio.edu.co" and credenciales.password == "123456":
        return {
            "estado": "éxito",
            "token_sesion": "simulacion_de_token_seguro_123",
            "usuario": {
                "nombre": "Julián Prado",
                "rol": "docente"
            }
        }
    
    # Simulamos un estudiante exitoso
    if credenciales.correo == "alumno@colegio.edu.co" and credenciales.password == "123456":
        return {
            "estado": "éxito",
            "token_sesion": "simulacion_de_token_seguro_456",
            "usuario": {
                "nombre": "Thomas",
                "rol": "estudiante",
                "grado": "11-A"
            }
        }

    # Si no es ninguno de los de prueba, lanzamos error 401 (No Autorizado)
    raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

# Endpoint de Registro
@router.post("/registro")
def registrar_usuario(nuevo_usuario: UsuarioRegistro):

    # Aquí irá el código para insertar en PostgreSQL
    
    return {
        "estado": "éxito",
        "mensaje": f"El {nuevo_usuario.rol} {nuevo_usuario.nombre} fue registrado correctamente."
    }