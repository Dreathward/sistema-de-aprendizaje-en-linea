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

window.addEventListener('pageshow', () => {
    verificarSesionActiva();
});

const tokenSesion = localStorage.getItem('token_sesion');
const usuario = JSON.parse(localStorage.getItem('usuario'));
const API_BASE = 'http://127.0.0.1:8000';

const params = new URLSearchParams(window.location.search);
const workshopId = params.get('workshop_id');

if (!workshopId) {
    window.location.replace('/views/dashboard-estudiante.html');
}

const MAPA_COMPETENCIAS = {
    1: 'Lectura Crítica',
    2: 'Matemáticas',
    3: 'Sociales y Ciudadanas',
    4: 'Ciencias Naturales',
    5: 'Inglés'
};

let preguntasActuales = [];
let indiceActual = 0;
let respuestasSeleccionadas = {};
let tituloPrueba = 'Simulacro Diagnóstico';
let intervaloTimer = null;
let bloquearIA = false;
let competenceIdTaller = null;
let examenEnCurso = false;
let segundosRestantesGlobal = 0;

function obtenerClaveProgreso() {
    return `progreso_eval_${usuario.id}_${workshopId}`;
}

function guardarProgresoLocal() {
    if (!examenEnCurso) return;
    const estado = {
        indiceActual,
        respuestasSeleccionadas,
        segundosRestantes: segundosRestantesGlobal,
        actualizadoEn: Date.now()
    };
    localStorage.setItem(obtenerClaveProgreso(), JSON.stringify(estado));
}

function cargarProgresoLocal() {
    try {
        const raw = localStorage.getItem(obtenerClaveProgreso());
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function limpiarProgresoLocal() {
    localStorage.removeItem(obtenerClaveProgreso());
}

function configurarProteccionSalida() {
    window.addEventListener('popstate', () => {
        if (!examenEnCurso) return;
        history.pushState({ examenActivo: true }, '', window.location.href);
        guardarProgresoLocal();
        const deseaSalir = confirm('Tienes una evaluación en curso. Tu progreso quedará guardado, ¿seguro que deseas salir al panel principal?');
        if (deseaSalir) {
            examenEnCurso = false;
            if (intervaloTimer) clearInterval(intervaloTimer);
            window.location.href = '/views/dashboard-estudiante.html';
        }
    });

    window.addEventListener('beforeunload', (e) => {
        if (!examenEnCurso) return;
        guardarProgresoLocal();
        e.preventDefault();
        e.returnValue = '';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    pintarUsuarioHeader();
    configurarProteccionSalida();
    configurarEventosNavegacion();
    configurarModalTutor();
    cargarTaller();
});

function pintarUsuarioHeader() {
    const nombre = usuario.nombre || 'Estudiante';
    const iniciales = nombre
        .split(' ')
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() || '')
        .join('');

    const avatarEl = document.getElementById('avatar-mini');
    const nombreEl = document.getElementById('nombre-mini');
    if (avatarEl) avatarEl.textContent = iniciales || 'E';
    if (nombreEl) nombreEl.textContent = nombre;
}

function configurarEventosNavegacion() {
    document.getElementById('btn-volver')?.addEventListener('click', () => {
        if (examenEnCurso) {
            guardarProgresoLocal();
            const confirmar = confirm('Tu avance y tiempo restante quedarán guardados como "En curso". ¿Deseas pausar y volver al inicio?');
            if (!confirmar) return;
            examenEnCurso = false;
            if (intervaloTimer) clearInterval(intervaloTimer);
        }
        window.location.href = '/views/dashboard-estudiante.html';
    });

    document.getElementById('btn-ir-dashboard')?.addEventListener('click', () => {
        examenEnCurso = false;
        window.location.href = '/views/dashboard-estudiante.html';
    });

    document.getElementById('btn-anterior')?.addEventListener('click', () => {
        if (indiceActual > 0) {
            indiceActual--;
            guardarProgresoLocal();
            renderizarPreguntaActual();
        }
    });

    document.getElementById('btn-siguiente')?.addEventListener('click', () => {
        if (indiceActual < preguntasActuales.length - 1) {
            indiceActual++;
            guardarProgresoLocal();
            renderizarPreguntaActual();
        } else {
            enviarSimulacro(false);
        }
    });
}

function configurarModalTutor() {
    const modal = document.getElementById('modal-tutor-ia');
    const cerrar = () => modal?.classList.add('oculto');

    document.getElementById('btn-cerrar-modal')?.addEventListener('click', cerrar);
    document.getElementById('btn-modal-volver')?.addEventListener('click', cerrar);
    document.getElementById('btn-modal-entendido')?.addEventListener('click', cerrar);

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) cerrar();
    });
}

// 2. CARGAR TALLER DESDE BACKEND
async function cargarTaller() {
    const estadoCarga = document.getElementById('estado-carga');
    try {
        // Verificar primero si el estudiante ya presentó esta evaluación
        const resEstado = await fetch(`${API_BASE}/evaluacion/mis-talleres/${usuario.id}`, {
            headers: { 'Authorization': `Bearer ${tokenSesion}` }
        });
        if (resEstado.ok) {
            const dataEstado = await resEstado.json();
            const tallerPrevio = (dataEstado.talleres || []).find(t => String(t.id) === String(workshopId));
            if (tallerPrevio && tallerPrevio.completado) {
                limpiarProgresoLocal();
                examenEnCurso = false;
                const temaPrevNorm = (tallerPrevio.tema || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                const esDiagPrevio = tallerPrevio.modalidad === 'entrenamiento'
                    || tallerPrevio.modalidad === 'diagnostico'
                    || Boolean(tallerPrevio.competence_id)
                    || temaPrevNorm.includes('diagnostico');
                bloquearIA = !esDiagPrevio;
                estadoCarga.classList.add('oculto');
                document.getElementById('seccion-preguntas').classList.add('oculto');
                document.getElementById('seccion-resultados').classList.remove('oculto');
                document.getElementById('puntaje-final-texto').textContent = `${tallerPrevio.puntaje ?? 0} / 100 puntos`;
                document.getElementById('detalle-aciertos').textContent = 'Esta evaluación ya fue presentada y calificada. No se permiten nuevos intentos.';
                const cajaFeedback = document.querySelector('.caja-feedback-general');
                if (cajaFeedback) cajaFeedback.classList.add('oculto');
                if (tallerPrevio.submission_id) {
                    const resRev = await fetch(`${API_BASE}/evaluacion/intento/${tallerPrevio.submission_id}/revision`, {
                        headers: { 'Authorization': `Bearer ${tokenSesion}` }
                    });
                    const datosRev = await resRev.json();
                    if (resRev.ok && datosRev.detalle_preguntas) {
                        renderizarRevision(datosRev.detalle_preguntas);
                    }
                }
                return;
            }
        }

        const res = await fetch(`${API_BASE}/evaluacion/${workshopId}/taller`, {
            headers: { 'Authorization': `Bearer ${tokenSesion}` }
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.replace('/');
            return;
        }

        const datos = await res.json();
        if (!res.ok) {
            throw new Error(datos.detail || 'No se pudo cargar el simulacro.');
        }

        const infoTaller = datos.taller || datos;
        tituloPrueba = infoTaller.tema || 'Simulacro Diagnóstico ICFES';
        competenceIdTaller = infoTaller.competence_id || null;
        preguntasActuales = infoTaller.preguntas || datos.preguntas || [];

        const temaNorm = tituloPrueba
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const esDiagnostico = infoTaller.modalidad === 'entrenamiento'
            || infoTaller.modalidad === 'diagnostico'
            || Boolean(competenceIdTaller)
            || temaNorm.includes('diagnostico');

        bloquearIA = !esDiagnostico;

        const yaTieneTipo = temaNorm.includes('diagnostico') || temaNorm.includes('simulacro');
        const etiquetaModalidad = esDiagnostico ? ' (Diagnóstico)' : ' (Simulacro General)';
        document.getElementById('titulo-simulacro').textContent = (tituloPrueba.includes('(') || yaTieneTipo)
            ? tituloPrueba
            : `${tituloPrueba}${etiquetaModalidad}`;

        if (preguntasActuales.length === 0) {
            estadoCarga.innerHTML = '<p>Este simulacro aún no tiene preguntas cargadas.</p>';
            return;
        }

        // Restaurar progreso previo si existía en curso
        const progresoGuardado = cargarProgresoLocal();
        if (progresoGuardado) {
            respuestasSeleccionadas = progresoGuardado.respuestasSeleccionadas || {};
            const idxGuardado = Number(progresoGuardado.indiceActual) || 0;
            indiceActual = Math.min(Math.max(idxGuardado, 0), preguntasActuales.length - 1);
        }

        const segundosIniciales = (progresoGuardado && Number(progresoGuardado.segundosRestantes) > 0)
            ? Number(progresoGuardado.segundosRestantes)
            : (Number(infoTaller.duracion_minutos) || 0) * 60;

        examenEnCurso = true;
        history.pushState({ examenActivo: true }, '', window.location.href);

        iniciarTemporizador(segundosIniciales);
        renderizarPreguntaActual();

        estadoCarga.classList.add('oculto');
        document.getElementById('seccion-preguntas').classList.remove('oculto');
    } catch (error) {
        estadoCarga.innerHTML = `<p style="color:#dc2626;">Error: ${error.message}</p>`;
    }
}

function iniciarTemporizador(segundosIniciales) {
    const cajaTimer = document.getElementById('caja-temporizador');
    const valorTimer = document.getElementById('temporizador');

    if (!segundosIniciales || segundosIniciales <= 0) {
        cajaTimer.classList.add('oculto');
        return;
    }

    let segundosRestantes = Math.floor(segundosIniciales);
    segundosRestantesGlobal = segundosRestantes;

    const actualizarTexto = () => {
        const min = Math.floor(segundosRestantes / 60);
        const seg = segundosRestantes % 60;
        valorTimer.textContent = `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    };

    actualizarTexto();
    intervaloTimer = setInterval(() => {
        segundosRestantes--;
        segundosRestantesGlobal = segundosRestantes;
        if (segundosRestantes <= 0) {
            clearInterval(intervaloTimer);
            valorTimer.textContent = '00:00';
            enviarSimulacro(true);
            return;
        }
        actualizarTexto();
        if (segundosRestantes % 5 === 0) guardarProgresoLocal();
    }, 1000);
}

// 3. RENDERIZAR PREGUNTA ACTUAL EN FORMATO 2 COLUMNAS (FIGMA)
function renderizarPreguntaActual() {
    const total = preguntasActuales.length;
    const preg = preguntasActuales[indiceActual];
    const letras = ['A', 'B', 'C', 'D', 'E'];

    // Actualizar indicadores superiores con el área de competencia
    const compIdActual = preg.competence_id || competenceIdTaller;
    const nombreArea = MAPA_COMPETENCIAS[compIdActual] || '';
    document.getElementById('indicador-pregunta').textContent = nombreArea
        ? `Pregunta ${indiceActual + 1} de ${total} • Área: ${nombreArea}`
        : `Pregunta ${indiceActual + 1} de ${total}`;
    document.getElementById('titulo-numero-pregunta').textContent = `Pregunta ${indiceActual + 1}`;

    // Separar contexto/lectura vs pregunta si hay salto de párrafo, o mostrar enunciado completo
    const enunciadoCompleto = (preg.enunciado || preg.statement || '').trim();
    const bloques = enunciadoCompleto.split(/\n\s*\n/);

    const textoLecturaEl = document.getElementById('texto-lectura');
    const textoPreguntaDerechaEl = document.getElementById('texto-pregunta-derecha');

    if (bloques.length > 1) {
        textoLecturaEl.textContent = bloques.slice(0, -1).join('\n\n');
        textoPreguntaDerechaEl.textContent = bloques[bloques.length - 1];
    } else {
        textoLecturaEl.textContent = enunciadoCompleto;
        textoPreguntaDerechaEl.textContent = 'De acuerdo con el planteamiento anterior, selecciona la respuesta correcta:';
    }

    // Extraer opciones sin importar el nombre de clave que retorne el endpoint
    const opciones =
        preg.opciones ||
        preg.options ||
        preg.respuestas ||
        preg.alternativas ||
        Object.values(preg).find(v => Array.isArray(v)) ||
        [];

    const listaOps = document.getElementById('lista-opciones');
    listaOps.innerHTML = '';

    opciones.forEach((op, idx) => {
        const textoOpcion = typeof op === 'string'
            ? op
            : (op.texto || op.option_text || op.text || '');

        const item = document.createElement('div');
        item.className = 'opcion-item';
        if (respuestasSeleccionadas[preg.id] === textoOpcion) {
            item.classList.add('seleccionada');
        }

        const badgeLetra = document.createElement('span');
        badgeLetra.className = 'letra-opcion';
        badgeLetra.textContent = letras[idx] || (idx + 1);

        const spanTexto = document.createElement('span');
        spanTexto.textContent = textoOpcion;

        item.appendChild(badgeLetra);
        item.appendChild(spanTexto);

        item.addEventListener('click', () => {
            const yaSeleccionada = respuestasSeleccionadas[preg.id] === textoOpcion;
            listaOps.querySelectorAll('.opcion-item').forEach(el => el.classList.remove('seleccionada'));

            if (yaSeleccionada) {
                delete respuestasSeleccionadas[preg.id];
            } else {
                item.classList.add('seleccionada');
                respuestasSeleccionadas[preg.id] = textoOpcion;
            }

            guardarProgresoLocal();
            actualizarBarraProgreso();
        });

        listaOps.appendChild(item);
    });

    // Actualizar botones Anterior / Siguiente
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');

    btnAnterior.disabled = indiceActual === 0;

    if (indiceActual === total - 1) {
        btnSiguiente.textContent = 'Finalizar y Calificar Simulacro ✓';
        btnSiguiente.classList.add('finalizar');
    } else {
        btnSiguiente.textContent = 'Siguiente Pregunta →';
        btnSiguiente.classList.remove('finalizar');
    }

    actualizarBarraProgreso();
}

function actualizarBarraProgreso() {
    const total = preguntasActuales.length;
    const respondidas = Object.keys(respuestasSeleccionadas).length;
    const porcentaje = total > 0 ? Math.round((respondidas / total) * 100) : 0;

    document.getElementById('porcentaje-progreso').textContent = `${porcentaje}%`;
    document.getElementById('barra-progreso-relleno').style.width = `${porcentaje}%`;
}

// 4. ENVIAR Y CALIFICAR SIMULACRO
async function enviarSimulacro(porTiempoAgotado) {
    const total = preguntasActuales.length;
    const respondidas = Object.keys(respuestasSeleccionadas).length;

    if (!porTiempoAgotado && respondidas < total) {
        alert(`Te faltan ${total - respondidas} pregunta(s) por responder antes de finalizar el simulacro.`);
        return;
    }

    const btnSiguiente = document.getElementById('btn-siguiente');
    btnSiguiente.disabled = true;
    btnSiguiente.textContent = 'Calificando simulacro...';

    if (intervaloTimer) clearInterval(intervaloTimer);

    const payload = {
        id_estudiante: usuario.id,
        id_workshop: Number(workshopId),
        respuestas: preguntasActuales.map(p => ({
            id_pregunta: p.id,
            respuesta_seleccionada: respuestasSeleccionadas[p.id] || ''
        }))
    };

    try {
        const res = await fetch(`${API_BASE}/evaluacion/entregar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenSesion}`
            },
            body: JSON.stringify(payload)
        });

        const datos = await res.json();
        if (!res.ok) {
            throw new Error(datos.detail || 'Error al calificar el simulacro.');
        }

        examenEnCurso = false;
        limpiarProgresoLocal();
        mostrarResultados(datos);

    } catch (error) {
        alert(`No se pudo entregar el simulacro: ${error.message}`);
        btnSiguiente.disabled = false;
        btnSiguiente.textContent = 'Finalizar y Calificar Simulacro ✓';
    }
}

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

// 5. MOSTRAR RESULTADOS Y ABRIR MODAL TUTORIA (FIGMA)
async function mostrarResultados(datosEntrega) {
    document.getElementById('seccion-preguntas').classList.add('oculto');
    document.getElementById('seccion-resultados').classList.remove('oculto');

    const resultados = datosEntrega.resultados || {};
    document.getElementById('puntaje-final-texto').textContent =
        `${resultados.puntaje_final ?? 0} / 100 puntos`;
    document.getElementById('detalle-aciertos').textContent =
        `${resultados.respuestas_correctas ?? 0} de ${resultados.preguntas_totales ?? preguntasActuales.length} respuestas correctas`;
    const cajaFeedback = document.querySelector('.caja-feedback-general');
    if (cajaFeedback) {
        if (bloquearIA) {
            cajaFeedback.classList.add('oculto');
        } else {
            cajaFeedback.classList.remove('oculto');
            document.getElementById('texto-feedback-general').innerHTML =
                formatearTextoIA(resultados.retroalimentacion_ia || 'Evaluación registrada correctamente.');
        }
    }

    try {
        const resRev = await fetch(`${API_BASE}/evaluacion/intento/${datosEntrega.submission_id}/revision`, {
            headers: { 'Authorization': `Bearer ${tokenSesion}` }
        });
        const datosRev = await resRev.json();
        if (resRev.ok && datosRev.detalle_preguntas) {
            renderizarRevision(datosRev.detalle_preguntas);
        }
    } catch (err) {
        console.error('Error cargando revisión detallada:', err);
    }
}

function renderizarRevision(detallePreguntas) {
    const lista = document.getElementById('lista-revision');
    lista.innerHTML = '';

    detallePreguntas.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = `tarjeta-revision ${item.es_correcta ? '' : 'incorrecta'}`;

        card.innerHTML = `
            <span class="estado-badge">${item.es_correcta ? '✓ Correcta' : '✗ Incorrecta'} • Pregunta ${idx + 1}</span>
            <p class="enunciado-pregunta"><strong>Enunciado:</strong> ${item.enunciado}</p>
            <p class="dato-respuesta"><strong>Tu respuesta:</strong> ${item.respuesta_estudiante}</p>
            ${!item.es_correcta ? `<p class="dato-respuesta"><strong>Respuesta correcta:</strong> ${item.opcion_correcta}</p>` : ''}
        `;

        if (!item.es_correcta && !bloquearIA) {
            const btnTutor = document.createElement('button');
            btnTutor.type = 'button';
            btnTutor.className = 'btn-abrir-tutor';
            btnTutor.textContent = '✦ Ver análisis de descarte con TutorIA';

            btnTutor.addEventListener('click', () => abrirModalTutorIA(item));
            card.appendChild(btnTutor);
        }

        lista.appendChild(card);
    });
}

async function abrirModalTutorIA(item) {
    if (bloquearIA) return;
    const modal = document.getElementById('modal-tutor-ia');
    const badgeError = document.getElementById('modal-badge-error');
    const cuerpoTexto = document.getElementById('modal-texto-explicacion');

    badgeError.textContent = `Respuesta incorrecta (${item.respuesta_estudiante})`;
    cuerpoTexto.textContent = 'Analizando tu respuesta con TutorIA...';
    modal.classList.remove('oculto');

    try {
        const resIA = await fetch(`${API_BASE}/ia/tutor-descarte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenSesion}`
            },
            body: JSON.stringify({
                id_estudiante: usuario.id,
                id_pregunta: item.id_pregunta,
                competencia: tituloPrueba,
                pregunta_enunciado: item.enunciado,
                distractor_elegido: item.respuesta_estudiante,
                opcion_correcta: item.opcion_correcta,
                causa_error: item.causa_error,
                modalidad: 'revision_simulacro'
            })
        });

        const datosIA = await resIA.json();
        if (!resIA.ok) {
            throw new Error(datosIA.detail || 'Error al consultar TutorIA.');
        }

        cuerpoTexto.innerHTML = formatearTextoIA(datosIA.explicacion_ia);
    } catch (err) {
        cuerpoTexto.innerHTML = `<span style="color:#dc2626;">${err.message}</span>`;
    }
}