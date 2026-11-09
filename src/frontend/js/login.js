const formulario = document.getElementById('formulario-login');
const inputCorreo = document.getElementById('correo');
const inputPassword = document.getElementById('password');
const botonIngreso = document.getElementById('boton-ingreso');
const cajaAlerta = document.getElementById('caja-alerta');
const mensajeAlerta = document.querySelector('.alerta-mensaje');


formulario.addEventListener('submit', async (evento) => {
    // Evita que se recargue toda la página
    evento.preventDefault();

    // Si había una alerta visible de un intento anterior, se oculta
    cajaAlerta.classList.add('oculto');

    // El texto del botón cambia para que el usuario sepa que el sistema está trabajando
    botonIngreso.textContent = 'Verificando...';
    botonIngreso.disabled = true;

    // Los datos se empacan exactamente con los nombres definidos en UsuarioLogin
    const credenciales = {
        correo: inputCorreo.value.trim(),
        password: inputPassword.value.trim()
    };

    try {
        const respuesta = await fetch('http://127.0.0.1:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credenciales)
        });

        // Respuesta del servidor en un objeto legible
        const datos = await respuesta.json();

        if (respuesta.ok) {
            // Si se devuelve éxito (200):
            // El token y los datos del estudiante se guardan en la memoria del navegador
            localStorage.setItem('token_sesion', datos.token_sesion);
            localStorage.setItem('usuario', JSON.stringify(datos.usuario));

            // Acceso del estudiante directamente al Dashboard
            window.location.href = '/views/dashboard-estudiante.html';
        }
        else {
            // Si se devuelve error (401 o 403):
            // Reemplazamos el texto con el mensaje exacto que mandó FastAPI
            if (datos.detail) {
                mensajeAlerta.textContent = datos.detail;
            }
            // Clase 'oculto' se retira para que la tarjeta roja aparezca en pantalla
            cajaAlerta.classList.remove('oculto');
        }

    }
    catch (error) {
        mensajeAlerta.textContent = 'No se pudo conectar con el servidor. Revisa que FastAPI esté encendido en la terminal.';
        cajaAlerta.classList.remove('oculto');
    }
    finally {
        // Botón vuelve a su estado normal
        botonIngreso.textContent = 'Entrar';
        botonIngreso.disabled = false;
    }
});