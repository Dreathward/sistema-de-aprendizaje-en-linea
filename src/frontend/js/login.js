const formulario = document.getElementById('formulario-login');
const inputCorreo = document.getElementById('correo');
const inputPassword = document.getElementById('password');
const botonIngreso = document.getElementById('boton-ingreso');
const cajaAlerta = document.getElementById('caja-alerta');
const mensajeAlerta = document.querySelector('.alerta-mensaje');

const API_AUTH = 'http://127.0.0.1:8000/auth';

// 1. INICIO DE SESIÓN PRINCIPAL
formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    cajaAlerta.classList.add('oculto');

    botonIngreso.textContent = 'Verificando...';
    botonIngreso.disabled = true;

    const credenciales = {
        correo: inputCorreo.value.trim(),
        password: inputPassword.value.trim()
    };

    try {
        const respuesta = await fetch(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            localStorage.setItem('token_sesion', datos.token_sesion);
            localStorage.setItem('usuario', JSON.stringify(datos.usuario));

            const u = datos.usuario || {};
            const rolDetectado = String(u.rol || u.role || u.tipo || u.perfil || '').toLowerCase().trim();
            const esDocente = ['docente', 'profesor', 'teacher', 'profe', 'admin'].includes(rolDetectado)
                || (u.correo || u.email || '').toLowerCase().startsWith('profe@');

            if (esDocente) {
                window.location.href = '/views/dashboard-docente.html';
            } else {
                window.location.href = '/views/dashboard-estudiante.html';
            }
        } else {
            if (datos.detail) {
                mensajeAlerta.textContent = datos.detail;
            }
            cajaAlerta.classList.remove('oculto');
        }
    } catch (error) {
        mensajeAlerta.textContent = 'No se pudo conectar con el servidor. Revisa que FastAPI esté encendido en la terminal.';
        cajaAlerta.classList.remove('oculto');
    } finally {
        botonIngreso.textContent = 'Entrar';
        botonIngreso.disabled = false;
    }
});

// 2. FLUJO DE RECUPERACIÓN EN 3 PASOS ENCADENADOS
const enlaceAyuda = document.getElementById('enlace-ayuda');
const modalRecuperar = document.getElementById('modal-recuperar');
const btnCerrarRecuperar = document.getElementById('btn-cerrar-recuperar');
const subtituloModal = document.getElementById('subtitulo-modal-recuperar');
const alertaModal = document.getElementById('alerta-modal-recuperar');

const formSolicitarToken = document.getElementById('form-solicitar-token');
const inputCorreoRecup = document.getElementById('correo-recuperacion');
const btnEnviarToken = document.getElementById('btn-enviar-token');

const bloqueTokenDinamico = document.getElementById('bloque-token-dinamico');
const cajaTokenLocal = document.getElementById('caja-token-local');
const inputTokenRecup = document.getElementById('token-recuperacion');
const btnVerificarToken = document.getElementById('btn-verificar-token');

const formRestablecer = document.getElementById('form-restablecer-password');
const badgeCorreoVerificado = document.getElementById('badge-correo-verificado');
const inputNuevaPass = document.getElementById('nueva-password');
const inputConfirmarPass = document.getElementById('confirmar-password');
const btnGuardarPass = document.getElementById('btn-guardar-password');
const btnVolverPaso1 = document.getElementById('btn-volver-paso1');

let correoValidado = '';

function mostrarAlertaModal(texto, tipo) {
    alertaModal.textContent = texto;
    alertaModal.className = `alerta-modal ${tipo}`;
    alertaModal.classList.remove('oculto');
}

function ocultarAlertaModal() {
    alertaModal.classList.add('oculto');
}

function ocultarCajaToken() {
    correoValidado = '';
    bloqueTokenDinamico.classList.add('oculto');
    cajaTokenLocal.classList.add('oculto');
    inputTokenRecup.value = '';
    btnEnviarToken.textContent = 'Solicitar código de recuperación';
    subtituloModal.textContent = 'Paso 1 de 3: Verifica tu correo institucional';
}

function irAPantallaCorreoYToken() {
    ocultarAlertaModal();
    formRestablecer.classList.add('oculto');
    formSolicitarToken.classList.remove('oculto');
    subtituloModal.textContent = correoValidado
        ? 'Paso 2 de 3: Ingresa el código enviado a tu correo'
        : 'Paso 1 de 3: Verifica tu correo institucional';
}

function irAPantallaNuevaPassword() {
    ocultarAlertaModal();
    formSolicitarToken.classList.add('oculto');
    formRestablecer.classList.remove('oculto');
    badgeCorreoVerificado.textContent = `Cuenta verificada: ${correoValidado}`;
    subtituloModal.textContent = 'Paso 3 de 3: Crea tu nueva contraseña';
}

function reiniciarModalRecuperar() {
    formSolicitarToken.reset();
    formRestablecer.reset();
    ocultarCajaToken();
    irAPantallaCorreoYToken();
}

function cerrarModalRecuperar() {
    modalRecuperar.classList.add('oculto');
    ocultarAlertaModal();
}

enlaceAyuda?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!inputCorreoRecup.value.trim() && inputCorreo.value.trim()) {
        inputCorreoRecup.value = inputCorreo.value.trim();
    }
    modalRecuperar.classList.remove('oculto');
});

btnCerrarRecuperar?.addEventListener('click', cerrarModalRecuperar);
btnVolverPaso1?.addEventListener('click', irAPantallaCorreoYToken);

// Si el usuario edita el correo después de haber validado uno, ocultar dinámicamente la caja del token
inputCorreoRecup?.addEventListener('input', () => {
    const valorActual = inputCorreoRecup.value.trim().toLowerCase();
    if (correoValidado && valorActual !== correoValidado.toLowerCase()) {
        ocultarAlertaModal();
        ocultarCajaToken();
    }
});

// PASO 1: Validar existencia del correo y desplegar caja del token
formSolicitarToken?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarAlertaModal();

    btnEnviarToken.textContent = 'Verificando correo...';
    btnEnviarToken.disabled = true;

    const correoIngresado = inputCorreoRecup.value.trim();

    try {
        const res = await fetch(`${API_AUTH}/recuperar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: correoIngresado })
        });

        const datos = await res.json();

        if (!res.ok) {
            ocultarCajaToken();
            throw new Error(datos.detail || 'El correo no está registrado en el sistema.');
        }

        // Correo válido: habilita dinámicamente el Paso 2
        correoValidado = correoIngresado;
        bloqueTokenDinamico.classList.remove('oculto');
        subtituloModal.textContent = 'Paso 2 de 3: Ingresa el código enviado a tu correo';
        btnEnviarToken.textContent = 'Reenviar código de recuperación';

        if (datos.debug_token) {
            inputTokenRecup.value = datos.debug_token;
            cajaTokenLocal.innerHTML = `<strong>Usuario de prueba (@colegio.edu.co):</strong> Tu código es <strong>${datos.debug_token}</strong> y ya fue cargado abajo.`;
            cajaTokenLocal.classList.remove('oculto');
        } else {
            cajaTokenLocal.classList.add('oculto');
            inputTokenRecup.value = '';
            mostrarAlertaModal('Correo verificado. Revisa tu bandeja de entrada y pega el código abajo.', 'exito');
            inputTokenRecup.focus();
        }
    } catch (err) {
        mostrarAlertaModal(err.message, 'error');
        btnEnviarToken.textContent = 'Solicitar código de recuperación';
    } finally {
        btnEnviarToken.disabled = false;
    }
});

// PASO 2: Verificar que el token sea válido para ese correo antes de pasar a nueva contraseña
async function ejecutarVerificacionToken() {
    ocultarAlertaModal();

    const tokenIngresado = inputTokenRecup.value.trim();
    if (!correoValidado) {
        mostrarAlertaModal('Primero debes verificar un correo institucional válido.', 'error');
        return;
    }
    if (!tokenIngresado) {
        mostrarAlertaModal('Ingresa el código de verificación antes de continuar.', 'error');
        inputTokenRecup.focus();
        return;
    }

    btnVerificarToken.textContent = 'Validando código...';
    btnVerificarToken.disabled = true;

    try {
        const res = await fetch(`${API_AUTH}/verificar-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correo: correoValidado,
                token: tokenIngresado
            })
        });

        const datos = await res.json();

        if (!res.ok) {
            throw new Error(datos.detail || 'El código ingresado es incorrecto.');
        }

        // Token confirmado: avanzar al Paso 3 (Nueva contraseña)
        irAPantallaNuevaPassword();
        inputNuevaPass.focus();
    } catch (err) {
        mostrarAlertaModal(err.message, 'error');
    } finally {
        btnVerificarToken.textContent = 'Verificar código';
        btnVerificarToken.disabled = false;
    }
}

btnVerificarToken?.addEventListener('click', ejecutarVerificacionToken);
inputTokenRecup?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        ejecutarVerificacionToken();
    }
});

// PASO 3: Guardar nueva contraseña con doble confirmación
formRestablecer?.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarAlertaModal();

    const pass1 = inputNuevaPass.value.trim();
    const pass2 = inputConfirmarPass.value.trim();

    if (pass1.length < 6) {
        mostrarAlertaModal('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    if (pass1 !== pass2) {
        mostrarAlertaModal('Las contraseñas no coinciden. Verifica que ambas sean iguales.', 'error');
        inputConfirmarPass.focus();
        return;
    }

    btnGuardarPass.textContent = 'Guardando contraseña...';
    btnGuardarPass.disabled = true;

    try {
        const res = await fetch(`${API_AUTH}/restablecer-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correo: correoValidado,
                token: inputTokenRecup.value.trim(),
                nueva_password: pass1
            })
        });

        const datos = await res.json();

        if (!res.ok) {
            throw new Error(datos.detail || 'No se pudo restablecer la contraseña.');
        }

        mostrarAlertaModal(datos.mensaje || 'Contraseña actualizada correctamente.', 'exito');
        inputCorreo.value = correoValidado;
        inputPassword.value = '';

        setTimeout(() => {
            reiniciarModalRecuperar();
            cerrarModalRecuperar();
        }, 2000);
    } catch (err) {
        mostrarAlertaModal(err.message, 'error');
    } finally {
        btnGuardarPass.textContent = 'Guardar nueva contraseña';
        btnGuardarPass.disabled = false;
    }
});