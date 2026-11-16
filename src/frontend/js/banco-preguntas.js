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
    iniciarVistaBancoPreguntas();
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

function iniciarVistaBancoPreguntas() {
    const badgeGrado = document.getElementById('badge-grado-docente');
    const buscadorInput = document.getElementById('buscador-banco-texto');
    const filtroTipo = document.getElementById('filtro-banco-tipo');
    const filtroComp = document.getElementById('filtro-banco-competencia');
    const contadorEl = document.getElementById('contador-preguntas-banco');
    const btnNueva = document.getElementById('btn-nueva-pregunta-banco');
    const seccionForm = document.getElementById('seccion-form-banco');
    const form = document.getElementById('form-pregunta-banco');
    const btnCerrarForm = document.getElementById('btn-cerrar-form-banco');
    const btnCancelarForm = document.getElementById('btn-cancelar-form-banco');
    const listaEl = document.getElementById('lista-preguntas-banco');
    const estadoFormEl = document.getElementById('banco-form-estado');

    const NOMBRES_COMP = {
        1: 'Lectura Crítica',
        2: 'Matemáticas',
        3: 'Sociales y Ciudadanas',
        4: 'Ciencias Naturales',
        5: 'Inglés'
    };

    let gradoDocenteActual = 11;
    let preguntasCache = [];

    const cerrarForm = () => {
        seccionForm.classList.add('oculto');
        estadoFormEl.classList.add('oculto');
    };

    btnCerrarForm?.addEventListener('click', cerrarForm);
    btnCancelarForm?.addEventListener('click', cerrarForm);

    function abrirFormulario(pregunta = null) {
        estadoFormEl.classList.add('oculto');
        const idInput = document.getElementById('banco-preg-id');
        const tituloForm = document.getElementById('titulo-form-banco');
        const tipoSel = document.getElementById('banco-preg-tipo');
        const compSel = document.getElementById('banco-preg-comp');
        const enunInput = document.getElementById('banco-preg-enunciado');
        const textosOps = form.querySelectorAll('.input-op-texto');
        const erroresOps = form.querySelectorAll('.input-op-error');
        const radios = form.querySelectorAll('input[name="opcion-correcta-banco"]');

        if (pregunta) {
            idInput.value = pregunta.id;
            tituloForm.textContent = `Editar Pregunta #${pregunta.id} (Saber ${gradoDocenteActual}°)`;
            tipoSel.value = pregunta.tipo_prueba || 'diagnostico';
            compSel.value = String(pregunta.competence_id || 1);
            enunInput.value = pregunta.enunciado || '';

            textosOps.forEach((inp, idx) => {
                const op = pregunta.opciones[idx];
                inp.value = op ? op.texto : '';
                erroresOps[idx].value = op && op.causa_error ? op.causa_error : '';
                if (op && op.es_correcta && radios[idx]) radios[idx].checked = true;
            });
        } else {
            idInput.value = '';
            tituloForm.textContent = `Nueva Pregunta en el Banco (Saber ${gradoDocenteActual}°)`;
            tipoSel.value = filtroTipo.value || 'diagnostico';
            compSel.value = filtroComp.value || '1';
            enunInput.value = '';
            textosOps.forEach((inp, idx) => {
                inp.value = '';
                erroresOps[idx].value = '';
            });
            if (radios[0]) radios[0].checked = true;
        }

        seccionForm.classList.remove('oculto');
        seccionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function pintarTarjetas() {
        const termino = (buscadorInput?.value || '').trim().toLowerCase();
        const filtradas = termino
            ? preguntasCache.filter(p => (p.enunciado || '').toLowerCase().includes(termino))
            : preguntasCache;

        if (contadorEl) {
            contadorEl.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'pregunta' : 'preguntas'}`;
        }

        if (filtradas.length === 0) {
            listaEl.innerHTML = '<p class="texto-vacio">No hay preguntas registradas que coincidan con los filtros seleccionados.</p>';
            return;
        }

        const letras = ['A', 'B', 'C', 'D'];
        listaEl.innerHTML = '';

        filtradas.forEach(p => {
            const card = document.createElement('div');
            card.className = `tarjeta-pregunta-banco ${p.activa ? '' : 'inactiva'}`;
            const etiquetaUso = p.tipo_prueba === 'simulacro_general' ? 'Simulacro General' : 'Diagnóstico';

            const opsHtml = (p.opciones || []).map((op, i) => `
                <div class="${op.es_correcta ? 'op-ok' : ''}">
                    <strong>${letras[i] || i + 1}.</strong> ${op.texto} ${op.es_correcta ? '✓' : ''}
                </div>
            `).join('');

            card.innerHTML = `
                <div class="cabecera-pregunta-banco">
                    <div class="badges-pregunta-banco">
                        <span class="badge-banco">Saber ${p.grade || gradoDocenteActual}°</span>
                        <span class="badge-banco">${etiquetaUso}</span>
                        <span class="badge-banco">${NOMBRES_COMP[p.competence_id] || 'Competencia'}</span>
                        <span class="badge-banco">${p.activa ? 'Activa' : 'Desactivada'}</span>
                    </div>
                    <div class="acciones-pregunta-banco">
                        <button type="button" class="btn-mini-banco btn-editar-preg">Editar</button>
                        <button type="button" class="btn-mini-banco btn-toggle-preg">${p.activa ? 'Desactivar' : 'Activar'}</button>
                    </div>
                </div>
                <p class="enunciado-pregunta-banco">${p.enunciado}</p>
                <div class="opciones-mini-banco">${opsHtml}</div>
            `;

            card.querySelector('.btn-editar-preg').addEventListener('click', () => abrirFormulario(p));
            card.querySelector('.btn-toggle-preg').addEventListener('click', async () => {
                await fetch(`${API_BASE}/evaluacion/pregunta/${p.id}/estado`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenSesion}`
                    },
                    body: JSON.stringify({ is_active: !p.activa })
                });
                await cargarListaBanco();
            });

            listaEl.appendChild(card);
        });
    }

    async function cargarListaBanco() {
        listaEl.innerHTML = '<p class="texto-vacio">Cargando banco de preguntas...</p>';
        const params = new URLSearchParams();
        params.set('teacher_id', usuario.id);
        if (filtroTipo.value) params.set('tipo_prueba', filtroTipo.value);
        if (filtroComp.value) params.set('competence_id', filtroComp.value);

        const data = await fetchAutenticado(`/evaluacion/banco-preguntas?${params.toString()}`);
        if (data?.grados_docente && data.grados_docente.length > 0) {
            gradoDocenteActual = Number(data.grados_docente[0]);
            if (badgeGrado) badgeGrado.textContent = `Nivel asignado: Saber ${gradoDocenteActual}°`;
        }

        preguntasCache = data?.preguntas || [];
        pintarTarjetas();
    }

    buscadorInput?.addEventListener('input', pintarTarjetas);
    filtroTipo?.addEventListener('change', cargarListaBanco);
    filtroComp?.addEventListener('change', cargarListaBanco);
    btnNueva?.addEventListener('click', () => abrirFormulario(null));

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        estadoFormEl.classList.add('oculto');

        const idEdit = document.getElementById('banco-preg-id').value;
        const tipoVal = document.getElementById('banco-preg-tipo').value;
        const compVal = Number(document.getElementById('banco-preg-comp').value);
        const enunciadoVal = document.getElementById('banco-preg-enunciado').value.trim();
        const idxCorrecta = Number(form.querySelector('input[name="opcion-correcta-banco"]:checked')?.value || 0);

        const textosOps = form.querySelectorAll('.input-op-texto');
        const erroresOps = form.querySelectorAll('.input-op-error');
        const opciones = Array.from(textosOps).map((inp, idx) => ({
            texto: inp.value.trim(),
            es_correcta: idx === idxCorrecta,
            causa_error: idx === idxCorrecta ? null : (erroresOps[idx].value.trim() || null)
        }));

        try {
            const url = idEdit
                ? `${API_BASE}/evaluacion/pregunta/${idEdit}`
                : `${API_BASE}/evaluacion/banco-preguntas`;
            const method = idEdit ? 'PUT' : 'POST';
            const body = idEdit
                ? { enunciado: enunciadoVal, competence_id: compVal, tipo_prueba: tipoVal, opciones }
                : { grade: gradoDocenteActual, competence_id: compVal, tipo_prueba: tipoVal, enunciado: enunciadoVal, opciones };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenSesion}`
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error al guardar la pregunta.');

            cerrarForm();
            await cargarListaBanco();
        } catch (err) {
            estadoFormEl.textContent = err.message;
            estadoFormEl.classList.remove('oculto');
        }
    });

    cargarListaBanco();
}