// 1. GUARDIA DE SESIÓN (Bloquea acceso directo y restauración con botón Atrás)
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

window.addEventListener('pageshow', () => {
    verificarSesionActiva();
});

const tokenSesion = localStorage.getItem('token_sesion');
const usuario = JSON.parse(localStorage.getItem('usuario'));
const API_BASE = 'http://127.0.0.1:8000';

// Helper para peticiones autenticadas
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
    pintarDatosUsuario();
    configurarMenuPerfil();
    cargarEstadisticasYProgreso();
    cargarTalleresAsignados();
});

// 2. PINTAR DATOS DEL ESTUDIANTE EN EL HEADER Y BIENVENIDA
function pintarDatosUsuario() {
    const nombreCompleto = usuario.nombre || 'Estudiante';
    const primerNombre = nombreCompleto.split(' ')[0];
    const iniciales = nombreCompleto
        .split(' ')
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() || '')
        .join('');

    const avatarEl = document.getElementById('avatar-inicial');
    const nombrePerfilEl = document.getElementById('nombre-perfil');
    const gradoPerfilEl = document.getElementById('grado-perfil');
    const rolPerfilEl = document.getElementById('rol-perfil');
    const correoPerfilEl = document.getElementById('correo-perfil');
    const tituloBienvenidaEl = document.querySelector('.titulo-bienvenida');

    if (avatarEl) avatarEl.textContent = iniciales || 'E';
    if (nombrePerfilEl) nombrePerfilEl.textContent = nombreCompleto;
    if (gradoPerfilEl) gradoPerfilEl.textContent = `Grado ${usuario.grado || '11'}°`;
    if (rolPerfilEl) rolPerfilEl.textContent = 'Cuenta Estudiante';
    if (correoPerfilEl) correoPerfilEl.textContent = usuario.correo || '';
    if (tituloBienvenidaEl) tituloBienvenidaEl.textContent = `¡Hola, ${primerNombre}!`;
}

// 3. MENÚ DESPLEGABLE Y CERRAR SESIÓN
function configurarMenuPerfil() {
    const botonPerfil = document.getElementById('boton-perfil');
    const menuPerfil = document.getElementById('menu-perfil');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    if (botonPerfil && menuPerfil) {
        botonPerfil.addEventListener('click', (e) => {
            e.stopPropagation();
            menuPerfil.classList.toggle('oculto');
        });

        document.addEventListener('click', (e) => {
            if (!menuPerfil.contains(e.target) && !botonPerfil.contains(e.target)) {
                menuPerfil.classList.add('oculto');
            }
        });
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.clear();
            window.location.replace('/');
        });
    }
}

// 4. CARGAR MÉTRICAS, BARRAS POR COMPETENCIA E HISTORIAL DE TUTORIA
async function cargarEstadisticasYProgreso() {
    try {
        const datos = await fetchAutenticado(`/stats/estudiante/${usuario.id}`);
        if (!datos || datos.estado !== 'éxito') return;

        const { resumen, historial } = datos;

        // Actualizar tarjetas de métricas
        const tarjetasValor = document.querySelectorAll('.tarjeta-metrica .metrica-valor');
        const detallePuntaje = document.querySelector('.metrica-detalle.positivo');

        if (tarjetasValor[0]) {
            tarjetasValor[0].textContent = `${resumen.promedio_general || 0}/100`;
        }
        if (detallePuntaje) {
            detallePuntaje.textContent = resumen.nivel_proyectado
                ? `Nivel: ${resumen.nivel_proyectado}`
                : 'Sin evaluaciones aún';
        }
        if (tarjetasValor[1]) {
            tarjetasValor[1].textContent = `${resumen.simulacros_completados || 0} realizados`;
        }
        if (tarjetasValor[2]) {
            tarjetasValor[2].textContent = `${resumen.mejor_puntaje || 0} pts mejor nota`;
        }

        // Animar barras por competencia (incluye diagnósticos y simulacros generales)
        const competenciasStats = datos.promedio_por_competencia || [];
        document.querySelectorAll('.item-modulo').forEach(modulo => {
            const nombreEl = modulo.querySelector('.nombre-materia');
            const porcentajeEl = modulo.querySelector('.porcentaje-materia');
            const barraEl = modulo.querySelector('.barra-llena');
            if (!nombreEl || !porcentajeEl || !barraEl) return;

            const nombre = nombreEl.textContent.trim().toLowerCase();
            const match = competenciasStats.find(c => {
                const compApi = (c.competencia || '').toLowerCase();
                return compApi.includes(nombre)
                    || nombre.includes(compApi)
                    || (nombre.includes('matemáticas') && compApi.includes('cuantitativo'))
                    || (nombre.includes('sociales') && compApi.includes('ciudadanas'));
            });

            if (match) {
                const prom = Math.round(match.promedio || 0);
                porcentajeEl.textContent = `${prom}%`;
                barraEl.style.width = `${prom}%`;
                barraEl.style.backgroundColor = prom >= 65 ? 'seagreen' : prom >= 50 ? 'orange' : 'crimson';
            }
        });

        // Actualizar Historial de TutorIA agrupado por competencias en acordeón
        const listaHistorial = document.querySelector('.lista-historial');
        if (listaHistorial) {
            listaHistorial.style.gap = '10px';

            const grupos = {
                'Lectura Crítica': [],
                'Matemáticas': [],
                'Sociales y Ciudadanas': [],
                'Ciencias Naturales': [],
                'Inglés': []
            };

            (historial || []).forEach(item => {
                const nombreComp = normalizarNombreCompetencia(item.competencia || item.tema);
                if (!grupos[nombreComp]) return;
                grupos[nombreComp].push(item);
            });

            listaHistorial.innerHTML = '';

            Object.entries(grupos).forEach(([competencia, items]) => {
                const acordeon = document.createElement('div');
                acordeon.className = `acordeon-competencia ${items.length > 0 ? 'con-datos' : ''}`;

                const contenidoInterno = items.length === 0
                    ? `<p class="acordeon-vacio">Aún no tienes retroalimentaciones en ${competencia}.</p>`
                    : items.map(item => `
                        <div class="item-historial-compacto">
                            <p class="texto-historial">${formatearTextoIA(item.retroalimentacion_ia || 'Evaluación completada.')}</p>
                            <span class="enlace-historial">Puntaje obtenido: ${item.puntaje}%</span>
                        </div>
                    `).join('');

                acordeon.innerHTML = `
                    <button type="button" class="acordeon-cabecera">
                        <div class="acordeon-titulo-grupo">
                            <div class="icono-mini-temp"></div>
                            <span class="acordeon-nombre">${competencia}</span>
                        </div>
                        <div class="acordeon-titulo-grupo">
                            <span class="acordeon-contador">${items.length}</span>
                            <span class="acordeon-flecha">▼</span>
                        </div>
                    </button>
                    <div class="acordeon-cuerpo">
                        ${contenidoInterno}
                    </div>
                `;

                const btnCabecera = acordeon.querySelector('.acordeon-cabecera');
                btnCabecera.addEventListener('click', () => {
                    acordeon.classList.toggle('abierto');
                });

                listaHistorial.appendChild(acordeon);
            });
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// 5. CARGAR TALLERES / SIMULACROS ASIGNADOS AL ESTUDIANTE
function clasificarEvaluacion(taller) {
    const mapaCompetencias = {
        1: 'Lectura Crítica',
        2: 'Matemáticas',
        3: 'Sociales y Ciudadanas',
        4: 'Ciencias Naturales',
        5: 'Inglés'
    };

    const temaNorm = (taller.tema || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const esDiagnostico = taller.modalidad === 'entrenamiento'
        || taller.modalidad === 'diagnostico'
        || Boolean(taller.competence_id)
        || temaNorm.includes('diagnostico');

    if (esDiagnostico) {
        const area = mapaCompetencias[taller.competence_id] || taller.tema || 'Competencia';
        return {
            esDiagnostico: true,
            etiquetaTipo: 'Diagnóstico • Con TutorIA',
            textoBoton: `Iniciar Diagnóstico: ${area}`
        };
    }

    const yaDiceSimulacro = temaNorm.includes('simulacro');
    return {
        esDiagnostico: false,
        etiquetaTipo: 'Simulacro General • Sin IA',
        textoBoton: taller.tema
            ? (yaDiceSimulacro ? `Iniciar ${taller.tema}` : `Iniciar Simulacro General: ${taller.tema}`)
            : 'Iniciar Simulacro General'
    };
}

function obtenerProgresoLocalTaller(workshopId) {
    try {
        const raw = localStorage.getItem(`progreso_eval_${usuario.id}_${workshopId}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

async function cargarTalleresAsignados() {
    const btnIniciar = document.getElementById('btn-iniciar-simulacro')
        || document.querySelector('.botones-bienvenida .btn-primario');

    // Conectar el enlace "Simulacros" de la barra superior hacia Próximas Evaluaciones
    const tarjetasLaterales = document.querySelectorAll('.columna-lateral .tarjeta-lateral');
    const tarjetaEvaluaciones = tarjetasLaterales[1];
    document.querySelectorAll('.zona-menu .enlace-menu').forEach(enlace => {
        if (enlace.textContent.trim().toLowerCase() === 'simulacros' && tarjetaEvaluaciones) {
            enlace.addEventListener('click', (e) => {
                e.preventDefault();
                tarjetaEvaluaciones.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    });

    function aplicarEstadoBoton(pendiente, totalPendientes) {
        if (!btnIniciar) return;

        const subtituloEl = document.querySelector('.subtitulo-bienvenida');

        if (!pendiente) {
            btnIniciar.disabled = true;
            btnIniciar.textContent = 'No hay simulacros pendientes';
            btnIniciar.onclick = null;
            if (subtituloEl) {
                subtituloEl.textContent = 'Tu meta comienza aquí. Cuando tu docente habilite una prueba aparecerá aquí.';
            }
            return;
        }

        const info = clasificarEvaluacion(pendiente);
        const enCurso = obtenerProgresoLocalTaller(pendiente.id);
        btnIniciar.disabled = false;
        btnIniciar.textContent = enCurso
            ? info.textoBoton.replace(/^Iniciar\b/, 'Continuar')
            : info.textoBoton;

        if (subtituloEl) {
            if (enCurso) {
                subtituloEl.textContent = `Tienes una evaluación en curso (${info.etiquetaTipo}). Retómala donde la dejaste.`;
            } else {
                subtituloEl.textContent = totalPendientes > 1
                    ? `Tienes ${totalPendientes} evaluaciones pendientes asignadas por tu docente.`
                    : `Tienes 1 evaluación pendiente (${info.etiquetaTipo}).`;
            }
        }

        btnIniciar.onclick = () => {
            window.location.href = `/views/simulacro.html?workshop_id=${pendiente.id}`;
        };
    }

    try {
        const datos = await fetchAutenticado(`/evaluacion/mis-talleres/${usuario.id}`);
        if (!datos || datos.estado !== 'éxito') {
            aplicarEstadoBoton(null, 0);
            return;
        }

        const talleres = datos.talleres || [];
        const pendientes = talleres.filter(t => !t.completado);

        // Priorizar si hay alguna evaluación ya iniciada ("En curso")
        const siguiente = pendientes.find(t => obtenerProgresoLocalTaller(t.id)) || pendientes[0] || null;
        aplicarEstadoBoton(siguiente, pendientes.length);

        if (!tarjetaEvaluaciones) return;

        const itemsAnteriores = tarjetaEvaluaciones.querySelectorAll('.item-evaluacion');
        itemsAnteriores.forEach(el => el.remove());

        if (talleres.length === 0) {
            const vacio = document.createElement('div');
            vacio.className = 'item-evaluacion';
            vacio.innerHTML = `<p class="desc-evaluacion">No tienes evaluaciones pendientes asignadas a tu grupo.</p>`;
            tarjetaEvaluaciones.appendChild(vacio);
            return;
        }

        talleres.forEach(t => {
            if (t.completado) {
                localStorage.removeItem(`progreso_eval_${usuario.id}_${t.id}`);
            }
            const progresoLocal = !t.completado ? obtenerProgresoLocalTaller(t.id) : null;
            const info = clasificarEvaluacion(t);

            let textoEstado = 'Pendiente';
            let textoPie = `${t.duracion_minutos ? `${t.duracion_minutos} min` : 'Sin límite'} • Clic para abrir`;

            if (t.completado) {
                textoEstado = `Presentado • ${t.puntaje}/100`;
                textoPie = 'Evaluación finalizada • Clic para ver resultado';
            } else if (progresoLocal) {
                textoEstado = 'En curso';
                textoPie = 'Progreso guardado • Clic para continuar';
            }

            const item = document.createElement('div');
            item.className = 'item-evaluacion';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="cabecera-evaluacion">
                    <div class="icono-mini-temp"></div>
                    <div class="textos-evaluacion">
                        <h4 class="titulo-evaluacion">${t.tema}</h4>
                        <p class="desc-evaluacion">${info.etiquetaTipo}</p>
                    </div>
                    <span class="etiqueta-hoy">${textoEstado}</span>
                </div>
                <div class="pie-evaluacion">
                    <span class="texto-tiempo">${textoPie}</span>
                </div>
            `;
            item.addEventListener('click', () => {
                window.location.href = `/views/simulacro.html?workshop_id=${t.id}`;
            });
            tarjetaEvaluaciones.appendChild(item);
        });
    } catch (error) {
        console.error('Error cargando talleres:', error);
        aplicarEstadoBoton(null, 0);
    }
}

// 6. FUNCIONES AUXILIARES DE FORMATO
function formatearTextoIA(texto) {
    if (!texto) return '';
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^\*\s+/gm, '• ')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function normalizarNombreCompetencia(raw) {
    const texto = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (texto.includes('lectura') || texto.includes('lenguaje')) return 'Lectura Crítica';
    if (texto.includes('matematic') || texto.includes('cuantitativo')) return 'Matemáticas';
    if (texto.includes('social') || texto.includes('ciudadan')) return 'Sociales y Ciudadanas';
    if (texto.includes('ciencia') || texto.includes('natural')) return 'Ciencias Naturales';
    if (texto.includes('ingles') || texto.includes('idioma')) return 'Inglés';
    return raw || 'General';
}