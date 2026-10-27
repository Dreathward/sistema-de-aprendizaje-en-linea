document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar si existe sesión activa
    const usuarioRaw = localStorage.getItem('usuario');
    const token = localStorage.getItem('token_sesion');

    if (!usuarioRaw || !token) {
        // Redirige a la raíz del sitio (el formulario de login principal)
        window.location.href = '/';
        return;
    }

    // 2. Cargar datos del usuario guardados tras el login
    const usuario = JSON.parse(usuarioRaw);
    const nombreCompleto = usuario.nombre || 'Estudiante';
    const primerNombre = nombreCompleto.split(' ')[0];
    const gradoTexto = usuario.grado ? `Grado ${usuario.grado}` : 'Grado 11º';

    // Generar iniciales
    const iniciales = nombreCompleto
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    // 3. Renderizar datos en el frontend
    const userNameEl = document.getElementById('user-name');
    const welcomeNameEl = document.getElementById('welcome-name');
    const userGradeEl = document.getElementById('user-grade');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.innerText = nombreCompleto;
    if (welcomeNameEl) welcomeNameEl.innerText = primerNombre;
    if (userGradeEl) userGradeEl.innerText = gradoTexto;
    if (userAvatarEl) userAvatarEl.innerText = iniciales;

    // 4. Lógica de Cerrar Sesión corregida
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            // Redirige a la raíz del servidor donde se sirve el Login
            window.location.href = '/';
        });
    }

    // 5. Redirecciones temporales
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'en-construccion.html';
        });
    });
});