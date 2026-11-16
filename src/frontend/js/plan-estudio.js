(function () {
    const API_BASE = 'http://127.0.0.1:8000';

    const COMPETENCIAS_BASE = [
        { clave: 'lectura', nombre: 'Lectura Crítica', descripcion: 'Comprensión literal, inferencial y crítica de textos.' },
        { clave: 'matematicas', nombre: 'Matemáticas', descripcion: 'Razonamiento cuantitativo, álgebra, geometría y estadística.' },
        { clave: 'sociales', nombre: 'Sociales y Ciudadanas', descripcion: 'Pensamiento social, constitución y análisis de perspectivas.' },
        { clave: 'ciencias', nombre: 'Ciencias Naturales', descripcion: 'Uso comprensivo del conocimiento científico e indagación.' },
        { clave: 'ingles', nombre: 'Inglés', descripcion: 'Comprensión lectora, vocabulario y uso comunicativo.' }
    ];

    function obtenerSesion() {
        try {
            const token = localStorage.getItem('token_sesion');
            const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
            return { token, usuario };
        } catch {
            return { token: null, usuario: null };
        }
    }

    function normalizarTexto(txt) {
        return String(txt || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function inyectarEstilosPlanEstudio() {
        if (document.getElementById('estilos-modal-plan-estudio')) return;

        const style = document.createElement('style');
        style.id = 'estilos-modal-plan-estudio';
        style.textContent = `
            .fondo-modal-plan {
                position: fixed;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.55);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                z-index: 260;
            }
            .fondo-modal-plan.oculto {
                display: none !important;
            }
            .caja-modal-plan {
                background-color: white;
                border: 1px solid silver;
                border-radius: 16px;
                width: 100%;
                max-width: 540px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 26px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .cabecera-modal-plan {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }
            .titulo-modal-plan {
                font-size: 20px;
                font-weight: 700;
                color: black;
                margin: 0;
            }
            .subtitulo-modal-plan {
                font-size: 12.5px;
                color: dimgray;
                margin-top: 3px;
            }
            .btn-cerrar-modal-plan {
                background-color: transparent;
                border: none;
                font-size: 16px;
                font-weight: 700;
                color: dimgray;
                cursor: pointer;
                padding: 2px 6px;
            }
            .btn-cerrar-modal-plan:hover {
                color: black;
            }
            .resumen-prioridad-plan {
                background-color: aliceblue;
                border: 1px solid silver;
                border-radius: 10px;
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .etiqueta-prioridad-plan {
                font-size: 11px;
                font-weight: 700;
                color: navy;
                text-transform: uppercase;
            }
            .texto-prioridad-plan {
                font-size: 13px;
                color: black;
                line-height: 1.45;
                margin: 0;
            }
            .lista-ruta-plan {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .tarjeta-ruta-item {
                border: 1px solid lightgray;
                background-color: whitesmoke;
                border-radius: 10px;
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .tarjeta-ruta-item.prioritaria {
                background-color: white;
                border-color: silver;
            }
            .fila-superior-ruta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
            }
            .nombre-comp-ruta {
                font-size: 13.5px;
                font-weight: 700;
                color: black;
            }
            .badge-estado-ruta {
                font-size: 11px;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 999px;
                border: 1px solid silver;
            }
            .badge-estado-ruta.alta {
                background-color: mistyrose;
                border-color: crimson;
                color: darkred;
            }
            .badge-estado-ruta.media {
                background-color: lightyellow;
                border-color: goldenrod;
                color: saddlebrown;
            }
            .badge-estado-ruta.baja {
                background-color: honeydew;
                border-color: seagreen;
                color: darkgreen;
            }
            .desc-comp-ruta {
                font-size: 12px;
                color: dimgray;
                margin: 0;
                line-height: 1.4;
            }
            .barra-contenedor-ruta {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .barra-fondo-ruta {
                flex: 1;
                height: 7px;
                background-color: lightgray;
                border-radius: 999px;
                overflow: hidden;
            }
            .barra-relleno-ruta {
                height: 100%;
                border-radius: 999px;
                transition: width 0.25s ease;
            }
            .porcentaje-ruta {
                font-size: 12.5px;
                font-weight: 700;
                color: black;
                min-width: 36px;
                text-align: right;
            }
            .nota-tutoria-plan {
                background-color: whitesmoke;
                border: 1px solid lightgray;
                border-radius: 10px;
                padding: 11px 14px;
                font-size: 12px;
                color: dimgray;
                line-height: 1.45;
            }
            .nota-tutoria-plan strong {
                color: black;
            }
            .acciones-modal-plan {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 4px;
            }
            .btn-secundario-plan {
                background-color: white;
                color: black;
                border: 1px solid silver;
                border-radius: 8px;
                padding: 10px 16px;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }
            .btn-secundario-plan:hover {
                background-color: whitesmoke;
            }
            .btn-primario-plan {
                background-color: navy;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 18px;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            .btn-primario-plan:hover {
                background-color: darkblue;
            }
        `;
        document.head.appendChild(style);
    }

    function leerPorcentajesDesdeDOM() {
        const mapa = {};
        const textoPagina = document.body ? document.body.innerText : '';
        COMPETENCIAS_BASE.forEach(comp => {
            const regex = new RegExp(`${comp.nombre}[\\s\\S]{0,120}?(\\d{1,3})%`, 'i');
            const match = textoPagina.match(regex);
            if (match) {
                mapa[comp.clave] = Math.min(100, Math.max(0, Number(match[1])));
            }
        });
        return mapa;
    }

    async function obtenerDatosRuta(token, usuario) {
        const porcentajesDOM = leerPorcentajesDesdeDOM();
        let competenciasData = COMPETENCIAS_BASE.map(c => ({
            ...c,
            porcentaje: porcentajesDOM[c.clave] ?? 0
        }));
        let ultimaCorreccion = null;
        let totalCorrecciones = 0;

        try {
            const res = await fetch(`${API_BASE}/stats/estudiante/${usuario.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const stats = await res.json();
                const listaApi = stats.competencias || stats.modulos || stats.progreso_competencias || [];

                if (Array.isArray(listaApi) && listaApi.length > 0) {
                    competenciasData = competenciasData.map(base => {
                        const encontrada = listaApi.find(item => {
                            const nom = normalizarTexto(item.nombre || item.competencia || item.area || '');
                            return nom.includes(base.clave);
                        });
                        if (encontrada) {
                            const val = Number(encontrada.porcentaje ?? encontrada.progreso ?? encontrada.puntaje ?? base.porcentaje);
                            return { ...base, porcentaje: Math.min(100, Math.max(0, Math.round(val))) };
                        }
                        return base;
                    });
                }

                const historial = stats.historial_tutoria || stats.retroalimentaciones || [];
                if (Array.isArray(historial) && historial.length > 0) {
                    totalCorrecciones = historial.length;
                    const primera = historial[0];
                    ultimaCorreccion = {
                        area: primera.competencia || primera.area || 'Competencia evaluada',
                        consejo: primera.retroalimentacion || primera.mensaje || primera.detalle || ''
                    };
                }
            }
        } catch {
            // Si falla la red, usa los valores ya renderizados en el dashboard
        }

        // Ordenar de menor a mayor rendimiento para priorizar refuerzo
        competenciasData.sort((a, b) => a.porcentaje - b.porcentaje);

        return { competenciasData, ultimaCorreccion, totalCorrecciones };
    }

    function construirModalPlan() {
        if (document.getElementById('modal-plan-estudio')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'modal-plan-estudio';
        wrapper.className = 'fondo-modal-plan oculto';
        wrapper.innerHTML = `
            <div class="caja-modal-plan">
                <div class="cabecera-modal-plan">
                    <div>
                        <h3 class="titulo-modal-plan">Plan de Estudio Personalizado</h3>
                        <p class="subtitulo-modal-plan">Ruta de refuerzo ordenada según tu desempeño ICFES Saber 9/11</p>
                    </div>
                    <button type="button" id="btn-cerrar-modal-plan" class="btn-cerrar-modal-plan">✕</button>
                </div>

                <div id="resumen-prioridad-plan" class="resumen-prioridad-plan">
                    <span class="etiqueta-prioridad-plan">Foco recomendado hoy</span>
                    <p id="texto-prioridad-plan" class="texto-prioridad-plan">Analizando tus módulos de competencia...</p>
                </div>

                <div id="lista-ruta-plan" class="lista-ruta-plan"></div>

                <div id="nota-tutoria-plan" class="nota-tutoria-plan"></div>

                <div class="acciones-modal-plan">
                    <button type="button" id="btn-cerrar-plan-footer" class="btn-secundario-plan">Cerrar</button>
                    <a href="/views/simulacro.html" class="btn-primario-plan">Practicar en Simulacro</a>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const { token, usuario } = obtenerSesion();
        if (!token || !usuario) return;

        inyectarEstilosPlanEstudio();
        construirModalPlan();

        const modal = document.getElementById('modal-plan-estudio');
        const btnCerrarTop = document.getElementById('btn-cerrar-modal-plan');
        const btnCerrarFooter = document.getElementById('btn-cerrar-plan-footer');
        const textoPrioridad = document.getElementById('texto-prioridad-plan');
        const listaRuta = document.getElementById('lista-ruta-plan');
        const notaTutoria = document.getElementById('nota-tutoria-plan');

        function cerrarModal() {
            modal.classList.add('oculto');
        }

        async function abrirModalPlan(e) {
            if (e) e.preventDefault();
            modal.classList.remove('oculto');
            listaRuta.innerHTML = '<p class="desc-comp-ruta">Calculando ruta de estudio...</p>';

            const { competenciasData, ultimaCorreccion, totalCorrecciones } = await obtenerDatosRuta(token, usuario);
            const menorPuntaje = competenciasData[0]?.porcentaje ?? 0;
            const prioritarias = competenciasData.filter(c => c.porcentaje === menorPuntaje);

            if (prioritarias.length === competenciasData.length && menorPuntaje === 0) {
                textoPrioridad.innerHTML = 'Aún no registras simulacros evaluados. Comienza con un <strong>Simulacro Diagnóstico</strong> para trazar tu línea base en las 5 áreas.';
            } else if (prioritarias.length > 1) {
                const nombres = prioritarias.map(p => p.nombre).join(', ');
                textoPrioridad.innerHTML = `Tus áreas con mayor oportunidad de mejora están en <strong>${menorPuntaje}%</strong>: <strong>${nombres}</strong>.`;
            } else {
                textoPrioridad.innerHTML = `Tu prioridad #1 es <strong>${prioritarias[0].nombre} (${menorPuntaje}%)</strong>. Refuerza esta competencia antes de tu próxima evaluación.`;
            }

            listaRuta.innerHTML = '';
            competenciasData.forEach((comp, idx) => {
                let claseBadge = 'alta';
                let textoBadge = 'Prioridad Alta';
                let colorBarra = 'crimson';

                if (comp.porcentaje >= 80) {
                    claseBadge = 'baja';
                    textoBadge = 'Consolidado';
                    colorBarra = 'seagreen';
                } else if (comp.porcentaje >= 50) {
                    claseBadge = 'media';
                    textoBadge = 'En progreso';
                    colorBarra = 'darkorange';
                }

                const item = document.createElement('div');
                item.className = `tarjeta-ruta-item ${idx === 0 ? 'prioritaria' : ''}`;
                item.innerHTML = `
                    <div class="fila-superior-ruta">
                        <span class="nombre-comp-ruta">${idx + 1}. ${comp.nombre}</span>
                        <span class="badge-estado-ruta ${claseBadge}">${textoBadge}</span>
                    </div>
                    <p class="desc-comp-ruta">${comp.descripcion}</p>
                    <div class="barra-contenedor-ruta">
                        <div class="barra-fondo-ruta">
                            <div class="barra-relleno-ruta" style="width: ${comp.porcentaje}%; background-color: ${colorBarra};"></div>
                        </div>
                        <span class="porcentaje-ruta">${comp.porcentaje}%</span>
                    </div>
                `;
                listaRuta.appendChild(item);
            });

            if (ultimaCorreccion && ultimaCorreccion.consejo) {
                notaTutoria.innerHTML = `<strong>Última recomendación de TutorIA (${ultimaCorreccion.area}):</strong> ${ultimaCorreccion.consejo}`;
            } else if (totalCorrecciones > 0) {
                notaTutoria.innerHTML = `Tienes <strong>${totalCorrecciones} corrección(es) pedagógica(s)</strong> en tu Historial TutorIA. Revísalas en la columna derecha antes de iniciar tu próxima práctica.`;
            } else {
                notaTutoria.innerHTML = '<strong>Sugerencia TutorIA:</strong> Al finalizar cada simulacro recibirás retroalimentación automática sobre las preguntas falladas para alimentar esta ruta.';
            }
        }

        // Conectar automáticamente tanto el enlace del menú superior como el botón de bienvenida
        document.querySelectorAll('a, button').forEach(el => {
            const texto = normalizarTexto(el.textContent);
            if (texto === 'plan de estudio' || texto === 'ver plan de estudio') {
                el.addEventListener('click', abrirModalPlan);
            }
        });

        btnCerrarTop.addEventListener('click', cerrarModal);
        btnCerrarFooter.addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('oculto')) {
                cerrarModal();
            }
        });
    });
})();