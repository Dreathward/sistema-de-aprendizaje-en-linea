from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Módulo de Autenticación y Roles"])

# Contratos de datos (schemas) para las solicitudes de inicio de sesión y registro
class UsuarioLogin(BaseModel):
    correo: EmailStr # Validación de correo electrónico
    password: str

class UsuarioRegistro(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    rol: str
    grado: str | None = None # Opcional (aplicable solo para estudiantes)

# Endpoint para iniciar sesión
@router.post("/login")
def iniciar_sesion(credenciales: UsuarioLogin):

    # Reemplazamos la lógica de autenticación con una simulación de base de datos
    
    # Simulación de un docente exitoso
    if credenciales.correo == "profe@colegio.edu.co" and credenciales.password == "123456":
        return {
            "estado": "éxito",
            "token_sesion": "simulacion_de_token_seguro_123",
            "usuario": {
                "nombre": "Julián Prado",
                "rol": "docente"
            }
        }
    
    # Simulación de un estudiante exitoso
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

    # Si no es válido en ninguno de los casos anteriores, se lanza un error de autenticación (401 - No Autorizado)
    raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

# Endpoint de registro de usuario
@router.post("/registro")
def registrar_usuario(nuevo_usuario: UsuarioRegistro):

    # A futuro, aquí se implementará la lógica para almacenar el nuevo usuario en la base de datos.
    
    return {
        "estado": "éxito",
        "mensaje": f"El {nuevo_usuario.rol} {nuevo_usuario.nombre} fue registrado correctamente."
    }