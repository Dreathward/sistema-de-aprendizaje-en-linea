// 1. GUARDIA DE SESIÓN
function verificarSesionActiva() {
    const token = localStorage.getItem('token_sesion');
    const user = localStorage.getItem('usuario');
    if (!token || !user) {
        window.location.replace('/');
        return false;
    }
    return true;
}

if (!verificarSesionActiva()) {
    throw new Error('Sesión no válida');
}

window.addEventListener('pageshow', () => verificarSesionActiva());

const tokenSesion = localStorage.getItem('token_sesion');
const usuario = JSON.parse(localStorage.getItem('usuario'));
const API_BASE = 'http://127.0.0.1:8000';

async function fetchAutenticado(endpoint) {
    const respuesta = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenSesion}`
        }
    });
    if (respuesta.status === 401) {
        localStorage.clear();
        window.location.replace('/');
        return null;
    }
    return await respuesta.json();
}

document.addEventListener('DOMContentLoaded', () => {
    pintarDatosDocente();
    configurarMenuPerfil();
    iniciarVistaMapaCalor();
});

function pintarDatosDocente() {
    const nombreCompleto = usuario.nombre || 'Docente';
    const iniciales = nombreCompleto.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('avatar-inicial', iniciales || 'D');
    setTxt('nombre-perfil', nombreCompleto);
    setTxt('rol-header', 'Docente ICFES');
    setTxt('rol-perfil', 'Cuenta Docente');
    setTxt('correo-perfil', usuario.correo || '');
}

function configurarMenuPerfil() {
    const botonPerfil = document.getElementById('boton-perfil');
    const menuPerfil = document.getElementById('menu-perfil');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    botonPerfil?.addEventListener('click', (e) => {
        e.stopPropagation();
        menuPerfil?.classList.toggle('oculto');
    });

    document.addEventListener('click', (e) => {
        if (menuPerfil && botonPerfil && !menuPerfil.contains(e.target) && !botonPerfil.contains(e.target)) {
            menuPerfil.classList.add('oculto');
        }
    });

    btnCerrarSesion?.addEventListener('click', () => {
        localStorage.clear();
        window.location.replace('/');
    });
}

function iniciarVistaMapaCalor() {
    const buscadorInput = document.getElementById('buscador-estudiante-calor');
    const filtroGrupo = document.getElementById('filtro-grupo-calor');
    const btnRecargar = document.getElementById('btn-recargar-matriz');
    const contadorEl = document.getElementById('contador-estudiantes-calor');
    const contenedor = document.getElementById('contenedor-matriz-calor');

    let compsCache = [];
    let filasCache = [];

    const claseCalor = (pct) => {
        if (pct === null || pct === undefined) return 'calor-vacio';
        if (pct >= 75) return 'calor-alto';
        if (pct >= 50) return 'calor-medio';
        return 'calor-bajo';
    };

    function pintarTabla() {
        const termino = (buscadorInput?.value || '').trim().toLowerCase();
        const grupoSel = filtroGrupo?.value || '';

        const filtradas = filasCache.filter(f => {
            const coincideGrupo = !grupoSel || f.grupo === grupoSel;
            const coincideTexto = !termino
                || (f.estudiante || '').toLowerCase().includes(termino)
                || (f.grupo || '').toLowerCase().includes(termino);
            return coincideGrupo && coincideTexto;
        });

        if (contadorEl) {
            contadorEl.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'estudiante' : 'estudiantes'}`;
        }

        if (filtradas.length === 0 || compsCache.length === 0) {
            contenedor.innerHTML = '<p class="texto-vacio">No hay estudiantes que coincidan con el filtro seleccionado.</p>';
            return;
        }

        const headersHtml = compsCache.map(c => `<th>${c.name}</th>`).join('');
        const bodyHtml = filtradas.map(f => {
            const celdasHtml = f.celdas.map(cel => {
                const cls = claseCalor(cel.porcentaje);
                const textoPct = cel.porcentaje !== null ? `${cel.porcentaje}%` : '—';
                const detalle = cel.total > 0 ? `${cel.aciertos}/${cel.total} aciertos` : 'Sin intentos';
                return `<td class="celda-valor-calor ${cls}">${textoPct}<small>${detalle}</small></td>`;
            }).join('');

            const promCls = claseCalor(f.promedio_general);
            const promTxt = f.promedio_general !== null ? `${f.promedio_general}%` : '—';

            return `
                <tr>
                    <td class="celda-estudiante-calor">
                        ${f.estudiante}
                        <span>${f.grupo}</span>
                    </td>
                    ${celdasHtml}
                    <td class="celda-valor-calor ${promCls}">${promTxt}<small>Global</small></td>
                </tr>
            `;
        }).join('');

        contenedor.innerHTML = `
            <table class="tabla-matriz-calor">
                <thead>
                    <tr>
                        <th class="col-estudiante">Estudiante</th>
                        ${headersHtml}
                        <th>Promedio</th>
                    </tr>
                </thead>
                <tbody>${bodyHtml}</tbody>
            </table>
        `;
    }

    async function cargarMatriz() {
        contenedor.innerHTML = '<p class="texto-vacio">Cargando matriz de rendimiento...</p>';
        try {
            const datos = await fetchAutenticado(`/stats/docente/${usuario.id}/matriz-calor`);
            if (!datos || datos.estado !== 'éxito') return;

            compsCache = datos.competencias || [];
            filasCache = datos.filas || [];

            if (filtroGrupo) {
                const gruposUnicos = [...new Set(filasCache.map(f => f.grupo).filter(Boolean))];
                const actual = filtroGrupo.value;
                filtroGrupo.innerHTML = '<option value="">Todos los grupos</option>' +
                    gruposUnicos.map(g => `<option value="${g}">${g}</option>`).join('');
                if (gruposUnicos.includes(actual)) filtroGrupo.value = actual;
            }

            pintarTabla();
        } catch (error) {
            console.error('Error cargando matriz de calor:', error);
            contenedor.innerHTML = '<p class="texto-vacio">No se pudo cargar la matriz de rendimiento.</p>';
        }
    }

    buscadorInput?.addEventListener('input', pintarTabla);
    filtroGrupo?.addEventListener('change', pintarTabla);
    btnRecargar?.addEventListener('click', cargarMatriz);

    cargarMatriz();
}