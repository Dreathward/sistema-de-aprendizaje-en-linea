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
    pintarDatosDocente();
    configurarMenuPerfil();
    cargarPanelDocente();
    configurarModalCrearEvaluacion();

    document.getElementById('btn-recargar-analiticas')?.addEventListener('click', () => {
        cargarPanelDocente();
    });
});

// 2. PINTAR DATOS DEL DOCENTE EN HEADER Y BIENVENIDA
function pintarDatosDocente() {
    const nombreCompleto = usuario.nombre || 'Docente';
    const primerNombre = nombreCompleto.split(' ')[0];
    const iniciales = nombreCompleto
        .split(' ')
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() || '')
        .join('');

    const avatarEl = document.getElementById('avatar-inicial');
    const nombrePerfilEl = document.getElementById('nombre-perfil');
    const rolHeaderEl = document.getElementById('rol-header');
    const rolPerfilEl = document.getElementById('rol-perfil');
    const correoPerfilEl = document.getElementById('correo-perfil');
    const tituloBienvenidaEl = document.querySelector('.titulo-bienvenida');

    if (avatarEl) avatarEl.textContent = iniciales || 'D';
    if (nombrePerfilEl) nombrePerfilEl.textContent = nombreCompleto;
    if (rolHeaderEl) rolHeaderEl.textContent = 'Docente ICFES';
    if (rolPerfilEl) rolPerfilEl.textContent = 'Cuenta Docente';
    if (correoPerfilEl) correoPerfilEl.textContent = usuario.correo || '';
    if (tituloBienvenidaEl) tituloBienvenidaEl.textContent = `¡Hola, Prof. ${primerNombre}!`;
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

// 4. CARGAR RENDIMIENTO DEL GRUPO Y MAPA DE CALOR
async function cargarPanelDocente() {
    await cargarRendimientoDocente();
    await cargarMapaCalorDocente();
}

async function cargarRendimientoDocente() {
    try {
        const datos = await fetchAutenticado(`/stats/docente/${usuario.id}/rendimiento`);
        if (!datos || datos.estado !== 'éxito') return;

        const competencias = datos.promedio_por_competencia || [];
        const estudiantes = datos.rendimiento_estudiantes || [];
        const pruebas = datos.resumen_pruebas || [];

        // Calcular KPIs globales
        const totalEntregas = pruebas.reduce((acc, p) => acc + (p.entregas || 0), 0);
        const promediosValidos = competencias.filter(c => (c.total_entregas || 0) > 0);
        const promedioGlobal = promediosValidos.length > 0
            ? Math.round((promediosValidos.reduce((acc, c) => acc + c.promedio, 0) / promediosValidos.length) * 10) / 10
            : 0;

        document.getElementById('kpi-promedio').textContent = `${promedioGlobal}/100`;
        document.getElementById('kpi-nivel').textContent = promedioGlobal > 0
            ? `Nivel: ${clasificarNivel(promedioGlobal)}`
            : 'Sin evaluaciones aún';
        document.getElementById('kpi-entregas').textContent = `${totalEntregas} entregas`;

        // Detectar competencia más crítica
        if (promediosValidos.length > 0) {
            const masCritica = [...promediosValidos].sort((a, b) => a.promedio - b.promedio)[0];
            document.getElementById('kpi-critica').textContent = `${masCritica.competencia} - ${Math.round(masCritica.promedio)}%`;
            document.getElementById('kpi-critica-detalle').textContent = 'Área prioritaria de refuerzo';
        }

        // Animar barras de Rendimiento por Competencia
        document.querySelectorAll('#lista-competencias-docente .item-modulo').forEach(modulo => {
            const nombreEl = modulo.querySelector('.nombre-materia');
            const porcentajeEl = modulo.querySelector('.porcentaje-materia');
            const barraEl = modulo.querySelector('.barra-llena');
            if (!nombreEl || !porcentajeEl || !barraEl) return;

            const nombre = nombreEl.textContent.trim().toLowerCase();
            const match = competencias.find(c => {
                const compApi = (c.competencia || '').toLowerCase();
                return compApi.includes(nombre) ||
                    nombre.includes(compApi) ||
                    (nombre.includes('matemáticas') && compApi.includes('cuantitativo')) ||
                    (nombre.includes('sociales') && compApi.includes('ciudadanas'));
            });

            if (match) {
                const prom = Math.round(match.promedio || 0);
                porcentajeEl.textContent = `${prom}%`;
                barraEl.style.width = `${prom}%`;
                barraEl.style.backgroundColor = prom >= 65 ? 'seagreen' : prom >= 50 ? 'orange' : 'crimson';
            }
        });

        // Pintar columna lateral 1: Estudiantes del grupo
        const contGrupos = document.getElementById('lista-grupos-docente');
        if (contGrupos) {
            if (estudiantes.length === 0) {
                contGrupos.innerHTML = '<p class="texto-vacio">Aún no hay estudiantes vinculados a tus grupos.</p>';
            } else {
                contGrupos.innerHTML = estudiantes.map(est => `
                    <div class="item-lateral-card">
                        <div class="item-lateral-izq">
                            <div class="icono-mini-temp"></div>
                            <div>
                                <p class="titulo-item-lat">${est.nombre}</p>
                                <p class="sub-item-lat">${est.pruebas_realizadas} prueba(s) • ${est.requiere_refuerzo ? 'Requiere refuerzo' : 'Al día'}</p>
                            </div>
                        </div>
                        <span class="badge-nota-grupo">${Math.round(est.promedio || 0)} pts</span>
                    </div>
                `).join('');
            }
        }

        // Pintar columna lateral 2: Talleres y Simulacros
        const contTalleres = document.getElementById('lista-talleres-docente');
        if (contTalleres) {
            if (pruebas.length === 0) {
                contTalleres.innerHTML = '<p class="texto-vacio">Aún no has creado simulacros o talleres.</p>';
            } else {
                contTalleres.innerHTML = pruebas.map(ws => `
                    <div class="item-lateral-card">
                        <div class="item-lateral-izq">
                            <div class="icono-mini-temp"></div>
                            <div>
                                <p class="titulo-item-lat">${ws.tema}</p>
                                <p class="sub-item-lat">Modalidad: ${ws.modalidad} • Promedio: ${Math.round(ws.promedio_grupo || 0)}%</p>
                            </div>
                        </div>
                        <span class="badge-estado-activo">${ws.entregas} ent.</span>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando reporte docente:', error);
    }
}

async function cargarMapaCalorDocente() {
    const contenedor = document.getElementById('lista-mapa-calor');
    if (!contenedor) return;

    try {
        const datos = await fetchAutenticado(`/stats/docente/${usuario.id}/mapa-calor`);
        if (!datos || datos.estado !== 'éxito') return;

        const brechas = datos.mapa_calor || [];
        if (brechas.length === 0) {
            contenedor.innerHTML = '<p class="texto-vacio">Aún no se registran errores frecuentes en los simulacros del grupo.</p>';
            return;
        }

        contenedor.innerHTML = brechas.map(item => `
            <div class="tarjeta-alerta-calor">
                <div class="cabecera-alerta-calor">
                    <span class="etiqueta-comp-alerta">${item.tema}</span>
                    <span class="badge-fallo-calor">Falló el ${Math.round(item.porcentaje_desacierto || 0)}% (${item.estudiantes_afectados}/${item.total_evaluados})</span>
                </div>
                <p class="enunciado-alerta-calor">${item.enunciado_resumen}</p>
                <p class="distractor-alerta-calor"><strong>Distractor más elegido:</strong> ${item.distractor_frecuente}</p>
                <div class="causa-alerta-calor">
                    <strong>Diagnóstico pedagógico:</strong> ${item.hipotesis_error}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando mapa de calor:', error);
        contenedor.innerHTML = '<p class="texto-vacio">No se pudo cargar el mapa de calor en este momento.</p>';
    }
}

function clasificarNivel(promedio) {
    if (promedio >= 80) return 'Superior';
    if (promedio >= 65) return 'Alto';
    if (promedio >= 50) return 'Básico';
    return 'Bajo (Requiere refuerzo)';
}

// 5. MODAL PARA CREAR Y ASIGNAR EVALUACIONES (DIAGNÓSTICO O SIMULACRO GENERAL)
// 5. MODAL PARA CREAR Y ASIGNAR EVALUACIONES (SABER 9° / SABER 11°)
function configurarModalCrearEvaluacion() {
    const modal = document.getElementById('modal-crear-evaluacion');
    const btnAbrir = document.getElementById('btn-abrir-crear-evaluacion');
    const btnCerrar = document.getElementById('btn-cerrar-modal-eval');
    const btnCancelar = document.getElementById('btn-cancelar-eval');
    const form = document.getElementById('form-crear-evaluacion');
    const selectTeam = document.getElementById('eval-team-id');
    const selectTipo = document.getElementById('eval-tipo');
    const grupoComp = document.getElementById('grupo-eval-competencia');
    const selectComp = document.getElementById('eval-competencia');
    const tituloPreview = document.getElementById('eval-titulo-preview');
    const inputDuracion = document.getElementById('eval-duracion');
    const resumenEl = document.getElementById('eval-resumen-banco');
    const estadoEl = document.getElementById('eval-mensaje-estado');
    const btnPublicar = document.getElementById('btn-publicar-eval');

    if (!modal || !btnAbrir || !form) return;

    let contextoCache = { grupos: [], preguntas: [] };
    let tituloGenerado = '';

    const nombresAreas = {
        '1': 'Lectura Crítica',
        '2': 'Matemáticas',
        '3': 'Sociales y Ciudadanas',
        '4': 'Ciencias Naturales',
        '5': 'Inglés'
    };

    function obtenerGradoSeleccionado() {
        const opt = selectTeam.options[selectTeam.selectedIndex];
        return Number(opt?.dataset?.grade || 11);
    }

    function actualizarVistaModal() {
        const grado = obtenerGradoSeleccionado();
        const etiquetaSaber = `Saber ${grado}°`;
        const esDiagnostico = selectTipo.value === 'diagnostico';
        const areaNombre = nombresAreas[selectComp.value] || 'Competencia';

        if (esDiagnostico) {
            grupoComp.classList.remove('oculto');
            tituloGenerado = `Diagnóstico ${etiquetaSaber} — ${areaNombre}`;
            inputDuracion.value = 30;
            resumenEl.innerHTML = `Se asignarán <strong>2 preguntas de ${areaNombre} (${etiquetaSaber})</strong> y los estudiantes contarán con <strong>TutorIA</strong>.`;
        } else {
            grupoComp.classList.add('oculto');
            tituloGenerado = `Simulacro General ${etiquetaSaber}`;
            inputDuracion.value = 60;
            resumenEl.innerHTML = `Se asignarán <strong>10 preguntas de ${etiquetaSaber}</strong> (2 por cada una de las 5 competencias) con <strong>TutorIA bloqueada</strong>.`;
        }

        tituloPreview.textContent = tituloGenerado;
    }

    const abrir = async () => {
        estadoEl.classList.add('oculto');
        btnPublicar.disabled = true;
        modal.classList.remove('oculto');

        try {
            const ctx = await fetchAutenticado(`/evaluacion/docente/${usuario.id}/contexto-creacion`);
            if (!ctx || ctx.estado !== 'éxito') {
                throw new Error('No se pudieron cargar tus grupos asignados.');
            }
            contextoCache = ctx;

            if (!ctx.grupos || ctx.grupos.length === 0) {
                selectTeam.innerHTML = '<option value="">Sin grupos asignados</option>';
                throw new Error('No tienes grupos activos asignados para habilitar pruebas.');
            }

            selectTeam.innerHTML = ctx.grupos.map(g =>
                `<option value="${g.id}" data-grade="${g.grade}">${g.name} (Saber ${g.grade}°)</option>`
            ).join('');

            actualizarVistaModal();
            btnPublicar.disabled = false;
        } catch (err) {
            estadoEl.textContent = err.message;
            estadoEl.classList.remove('oculto');
        }
    };

    const cerrar = () => modal.classList.add('oculto');

    btnAbrir.addEventListener('click', abrir);
    btnCerrar?.addEventListener('click', cerrar);
    btnCancelar?.addEventListener('click', cerrar);

    selectTeam.addEventListener('change', actualizarVistaModal);
    selectTipo.addEventListener('change', actualizarVistaModal);
    selectComp.addEventListener('change', actualizarVistaModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        estadoEl.classList.add('oculto');
        btnPublicar.disabled = true;
        btnPublicar.textContent = 'Publicando...';

        try {
            const grado = obtenerGradoSeleccionado();
            const preguntasGrado = (contextoCache.preguntas || []).filter(p => Number(p.grade) === grado);
            const esDiagnostico = selectTipo.value === 'diagnostico';
            let preguntasElegidas = [];

            if (esDiagnostico) {
                const compId = Number(selectComp.value);
                preguntasElegidas = preguntasGrado.filter(p => Number(p.competence_id) === compId).slice(0, 2);
                if (preguntasElegidas.length === 0) {
                    throw new Error(`No hay preguntas de Saber ${grado}° para ${nombresAreas[selectComp.value]}.`);
                }
            } else {
                for (let c = 1; c <= 5; c++) {
                    const delArea = preguntasGrado.filter(p => Number(p.competence_id) === c).slice(0, 2);
                    if (delArea.length < 2) {
                        throw new Error(`Faltan preguntas de Saber ${grado}° en ${nombresAreas[String(c)]} (se requieren 2 por área).`);
                    }
                    preguntasElegidas.push(...delArea);
                }
            }

            const payload = {
                team_id: Number(selectTeam.value),
                tema: tituloGenerado,
                competence_id: esDiagnostico ? Number(selectComp.value) : null,
                modalidad: esDiagnostico ? 'entrenamiento' : 'simulacro',
                duracion_minutos: Number(inputDuracion.value) || (esDiagnostico ? 30 : 60),
                preguntas: preguntasElegidas.map(p => ({
                    enunciado: p.enunciado,
                    competence_id: p.competence_id,
                    opciones: (p.opciones || []).map(op => ({
                        texto: op.texto,
                        es_correcta: Boolean(op.es_correcta),
                        causa_error: op.causa_error || null
                    }))
                }))
            };

            const resCrear = await fetch(`${API_BASE}/evaluacion/crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenSesion}`
                },
                body: JSON.stringify(payload)
            });

            const dataCrear = await resCrear.json();
            if (!resCrear.ok) {
                const detalle = Array.isArray(dataCrear.detail)
                    ? dataCrear.detail.map(d => d.msg).join(', ')
                    : dataCrear.detail;
                throw new Error(detalle || 'Error al crear la evaluación.');
            }

            cerrar();
            await cargarPanelDocente();
        } catch (err) {
            estadoEl.textContent = err.message;
            estadoEl.classList.remove('oculto');
        } finally {
            btnPublicar.disabled = false;
            btnPublicar.textContent = 'Publicar y Asignar';
        }
    });
}