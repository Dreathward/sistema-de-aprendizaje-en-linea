import os
import secrets
import smtplib
from email.message import EmailMessage
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from src.database import supabase, resolver_alumn_id
from src.modules.auth.Security import verificar_token

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Módulo de Autenticación y Roles"])

# --- Contratos de datos (Schemas) ---
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

class RestablecerPassword(BaseModel):
    token: str
    nueva_password: str

class CambiarPassword(BaseModel):
    user_id: int
    password_actual: str
    nueva_password: str

class ActualizarPerfil(BaseModel):
    nombre: str | None = None
    grado: str | None = None
    telefono: str | None = None
    direccion: str | None = None

class EstadoUsuario(BaseModel):
    is_active: bool


# --- Helper interno para envío de correo SMTP ---
def _enviar_correo_recuperacion(destinatario: str, nombre: str, token: str) -> bool:
    remitente = os.getenv("SMTP_EMAIL")
    clave_app = os.getenv("SMTP_PASSWORD")
    frontend_url = os.getenv("FRONTEND_URL", "http://127.0.0.1:8000")

    if not remitente or not clave_app:
        print(f"[AVISO SMTP] Credenciales no configuradas en .env. Token para {destinatario}: {token}")
        return False

    enlace = f"{frontend_url}/views/restablecer.html?token={token}"
    msg = EmailMessage()
    msg["Subject"] = "Recuperación de contraseña - Plataforma ICFES IA"
    msg["From"] = remitente
    msg["To"] = destinatario
    msg.set_content(
        f"Hola {nombre},\n\n"
        f"Recibimos una solicitud para restablecer tu contraseña.\n"
        f"Usa el siguiente token o ingresa al enlace para crear una nueva clave:\n\n"
        f"Token: {token}\n"
        f"Enlace: {enlace}\n\n"
        f"Si no solicitaste este cambio, ignora este mensaje."
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(remitente, clave_app)
            smtp.send_message(msg)
        return True
    except Exception as mail_err:
        print(f"DEBUG ERROR SMTP: {repr(mail_err)}")
        return False


# --- HU-01 y HU-02: Inicio de sesión ---
@router.post("/login")
def iniciar_sesion(credenciales: UsuarioLogin):
    try:
        res = (
            supabase.table("users")
            .select("*")
            .eq("email", credenciales.correo)
            .execute()
        )
        usuarios = res.data

        if not usuarios:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        usuario_db = usuarios[0]

        if usuario_db.get("is_active") is False:
            raise HTTPException(status_code=403, detail="Esta cuenta se encuentra inactiva")

        if usuario_db.get("password") != credenciales.password:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # Puente hacia la tabla 'alumn' si el rol es estudiante
        alumn_id = None
        grado_actual = "11"
        if usuario_db.get("role") in ["student", "estudiante"]:
            alumn_id = resolver_alumn_id(usuario_db.get("id"))
            res_alumn = supabase.table("alumn").select("grade").eq("id", alumn_id).execute()
            if res_alumn.data and res_alumn.data[0].get("grade"):
                grado_actual = res_alumn.data[0]["grade"]

        return {
            "estado": "éxito",
            "token_sesion": f"token_seguro_{usuario_db.get('id')}",
            "requiere_cambio_password": bool(usuario_db.get("must_change_password", False)),
            "usuario": {
                "id": usuario_db.get("id"),
                "alumn_id": alumn_id,
                "nombre": usuario_db.get("name", "Estudiante"),
                "correo": usuario_db.get("email"),
                "rol": usuario_db.get("role", "student"),
                "grado": grado_actual
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


# --- HU-01: Cambio de contraseña en primer acceso ---
@router.post("/cambiar-password")
def cambiar_password(datos: CambiarPassword):
    try:
        res = supabase.table("users").select("id, password").eq("id", datos.user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        if res.data[0].get("password") != datos.password_actual:
            raise HTTPException(status_code=401, detail="La contraseña actual o temporal es incorrecta.")

        if len(datos.nueva_password.strip()) < 6:
            raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres.")

        supabase.table("users").update({
            "password": datos.nueva_password.strip(),
            "must_change_password": False
        }).eq("id", datos.user_id).execute()

        return {
            "estado": "éxito",
            "mensaje": "Contraseña actualizada correctamente. Credenciales definitivas activadas."
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR CAMBIO PASSWORD: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar contraseña: {str(e)}")


# --- Registro de usuarios ---
@router.post("/registro")
def registrar_usuario(nuevo_usuario: UsuarioRegistro):
    try:
        payload = {
            "name": nuevo_usuario.nombre,
            "email": nuevo_usuario.correo,
            "password": nuevo_usuario.password,
            "role": nuevo_usuario.rol,
            "is_active": True
        }
        res = supabase.table("users").insert(payload).execute()
        user_id = res.data[0]["id"]

        if nuevo_usuario.rol in ["student", "estudiante"]:
            alumn_id = resolver_alumn_id(user_id)
            if nuevo_usuario.grado:
                supabase.table("alumn").update({"grade": nuevo_usuario.grado}).eq("id", alumn_id).execute()

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


# --- Solicitud y confirmación de recuperación de contraseña ---
@router.post("/recuperar-password")
def solicitar_recuperacion(datos: RecuperarPassword):
    try:
        res = supabase.table("users").select("id, name").eq("email", datos.correo).execute()
        if not res.data:
            return {
                "estado": "éxito",
                "mensaje": "Si el correo está registrado, recibirás las instrucciones de recuperación."
            }

        usuario = res.data[0]
        token_recuperacion = secrets.token_urlsafe(24)

        supabase.table("users").update({"reset_token": token_recuperacion}).eq("id", usuario["id"]).execute()
        correo_enviado = _enviar_correo_recuperacion(datos.correo, usuario.get("name", "Usuario"), token_recuperacion)

        respuesta = {
            "estado": "éxito",
            "mensaje": "Si el correo está registrado, recibirás las instrucciones de recuperación.",
            "correo_enviado": correo_enviado
        }
        if not correo_enviado:
            respuesta["debug_token"] = token_recuperacion

        return respuesta

    except Exception as e:
        print(f"DEBUG ERROR RECUPERACIÓN: {repr(e)}")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")


@router.post("/restablecer-password")
def restablecer_password(datos: RestablecerPassword):
    try:
        if len(datos.nueva_password.strip()) < 6:
            raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres.")

        res = supabase.table("users").select("id").eq("reset_token", datos.token.strip()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="El token de recuperación es inválido o ya fue utilizado.")

        user_id = res.data[0]["id"]
        supabase.table("users").update({
            "password": datos.nueva_password.strip(),
            "reset_token": None,
            "must_change_password": False
        }).eq("id", user_id).execute()

        return {
            "estado": "éxito",
            "mensaje": "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión."
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR RESTABLECER: {repr(e)}")
        raise HTTPException(status_code=500, detail="Error al restablecer la contraseña.")


# --- HU-04: Gestión de Perfil de Usuario ---
@router.put("/perfil/{user_id}", dependencies=[Depends(verificar_token)])
def actualizar_perfil(user_id: int, datos: ActualizarPerfil):
    try:
        res_user = supabase.table("users").select("id, role").eq("id", user_id).execute()
        if not res_user.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        if datos.nombre:
            supabase.table("users").update({"name": datos.nombre.strip()}).eq("id", user_id).execute()

        if res_user.data[0].get("role") in ["student", "estudiante"]:
            alumn_id = resolver_alumn_id(user_id)
            campos_alumn = {}
            if datos.grado is not None:
                campos_alumn["grade"] = datos.grado.strip()
            if datos.telefono is not None:
                campos_alumn["phone"] = datos.telefono.strip()
            if datos.direccion is not None:
                campos_alumn["address"] = datos.direccion.strip()

            if campos_alumn:
                supabase.table("alumn").update(campos_alumn).eq("id", alumn_id).execute()

        return {
            "estado": "éxito",
            "mensaje": "Datos del perfil actualizados correctamente."
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR PERFIL: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar perfil: {str(e)}")


# --- HU-06: Gestión de Grupos y Estudiantes por el Docente ---
@router.get("/docente/{teacher_id}/estudiantes", dependencies=[Depends(verificar_token)])
def listar_estudiantes_docente(teacher_id: int):
    try:
        res_teams = supabase.table("team").select("id, name, grade").eq("teacher_id", teacher_id).execute()
        if not res_teams.data:
            return {"estado": "éxito", "grupos": []}

        team_ids = [t["id"] for t in res_teams.data]
        res_links = supabase.table("alumn_team").select("team_id, alumn_id").in_("team_id", team_ids).execute()

        alumn_ids = list({link["alumn_id"] for link in res_links.data})
        alumns_map = {}
        users_map = {}

        if alumn_ids:
            res_alumns = supabase.table("alumn").select("id, user_id, grade, is_active").in_("id", alumn_ids).execute()
            alumns_map = {a["id"]: a for a in res_alumns.data}
            user_ids = [a["user_id"] for a in res_alumns.data if a.get("user_id")]
            if user_ids:
                res_users = supabase.table("users").select("id, name, email, is_active").in_("id", user_ids).execute()
                users_map = {u["id"]: u for u in res_users.data}

        grupos_respuesta = []
        for team in res_teams.data:
            estudiantes_grupo = []
            for link in res_links.data:
                if link["team_id"] == team["id"]:
                    alumn_info = alumns_map.get(link["alumn_id"])
                    if alumn_info:
                        user_info = users_map.get(alumn_info["user_id"], {})
                        estudiantes_grupo.append({
                            "user_id": alumn_info["user_id"],
                            "alumn_id": alumn_info["id"],
                            "nombre": user_info.get("name", "Sin nombre"),
                            "correo": user_info.get("email", ""),
                            "grado": alumn_info.get("grade") or str(team.get("grade", "")),
                            "activo": user_info.get("is_active", True)
                        })

            grupos_respuesta.append({
                "team_id": team["id"],
                "nombre_grupo": team["name"],
                "grado": team["grade"],
                "estudiantes": estudiantes_grupo
            })

        return {"estado": "éxito", "grupos": grupos_respuesta}
    except Exception as e:
        print(f"DEBUG ERROR ESTUDIANTES DOCENTE: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al consultar grupos del docente: {str(e)}")


@router.patch("/usuario/{user_id}/estado", dependencies=[Depends(verificar_token)])
def cambiar_estado_usuario(user_id: int, estado: EstadoUsuario):
    try:
        res = supabase.table("users").update({"is_active": estado.is_active}).eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        supabase.table("alumn").update({"is_active": estado.is_active}).eq("user_id", user_id).execute()

        accion = "activado" if estado.is_active else "desactivado"
        return {
            "estado": "éxito",
            "mensaje": f"El acceso del usuario ha sido {accion} correctamente."
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"DEBUG ERROR ESTADO USUARIO: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar estado: {str(e)}")