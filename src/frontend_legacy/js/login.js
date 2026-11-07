document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const cardTitle = document.getElementById('card-title');
    const cardSubtitle = document.getElementById('card-subtitle');
    const errorBox = document.getElementById('error-box');
    const submitBtn = document.getElementById('submit-btn');
    const footerLink = document.getElementById('footer-link');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Intentar Login contra el backend
        const respuesta = await API.login(correo, password);

        if (respuesta.estado === "éxito") {
            localStorage.setItem('token_sesion', respuesta.token_sesion);
            localStorage.setItem('usuario', JSON.stringify(respuesta.usuario));

            if (respuesta.usuario.rol === 'estudiante') {
                window.location.href = 'views/dashboard.html';
            } else {
                window.location.href = 'views/en-construccion.html';
            }
        } else {
            // Transformar la UI al estado de "Acceso Denegado" idéntico a Figma
            cardTitle.innerText = "Acceso Denegado";
            cardSubtitle.innerText = "No fue posible validar tu ingreso a la plataforma.";
            errorBox.classList.remove('hidden');
            submitBtn.innerText = "Intentar nuevamente";
            footerLink.innerText = "¿Problemas con tu cuenta? Contacta al administrador";
        }
    });
});