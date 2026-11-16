(function () {
    const API_BASE = 'http://127.0.0.1:8000';

    function obtenerSesion() {
        try {
            const token = localStorage.getItem('token_sesion');
            const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
            return { token, usuario };
        } catch {
            return { token: null, usuario: null };
        }
    }

    function esRolDocente(usuario) {
        if (!usuario) return false;
        const rol = String(usuario.rol || usuario.role || usuario.tipo || '').toLowerCase().trim();
        return ['docente', 'profesor', 'teacher', 'profe', 'admin'].includes(rol)
            || (usuario.correo || usuario.email || '').toLowerCase().startsWith('profe@');
    }

    // Persistencia en cookie para que el estado leído sobreviva al localStorage.clear() de Cerrar Sesión
    function leerNotifLeidas(userId) {
        const prefijo = `notif_leidas_${userId}=`;
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            c = c.trim();
            if (c.startsWith(prefijo)) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(c.substring(prefijo.length)));
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            }
        }
        return [];
    }

    function guardarNotifLeidas(userId, ids) {
        const valor = encodeURIComponent(JSON.stringify(ids));
        document.cookie = `notif_leidas_${userId}=${valor}; max-age=31536000; path=/; SameSite=Lax`;
    }

    function inyectarEstilosNotificaciones() {
        if (document.getElementById('estilos-notificaciones')) return;

        const style = document.createElement('style');
        style.id = 'estilos-notificaciones';
        style.textContent = `
            .zona-perfil {
                position: relative;
            }
            .btn-notificaciones {
                position: relative;
                background-color: transparent;
                border: none;
                border-radius: 8px;
                padding: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.15s ease;
            }
            .btn-notificaciones:hover {
                background-color: whitesmoke;
            }
            .badge-notificaciones {
                position: absolute;
                top: 1px;
                right: 1px;
                min-width: 16px;
                height: 16px;
                padding: 0 4px;
                border-radius: 999px;
                background-color: crimson;
                color: white;
                font-size: 10px;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            .badge-notificaciones.oculto {
                display: none !important;
            }
            .panel-notificaciones {
                position: absolute;
                top: 52px;
                right: 150px;
                width: 330px;
                max-width: calc(100vw - 32px);
                background-color: white;
                border: 1px solid silver;
                border-radius: 12px;
                padding: 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 120;
            }
            .panel-notificaciones.oculto {
                display: none !important;
            }
            .cabecera-notificaciones {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 8px;
                border-bottom: 1px solid lightgray;
            }
            .titulo-notificaciones {
                font-size: 14px;
                font-weight: 700;
                color: black;
                margin: 0;
            }
            .btn-marcar-leidas {
                background-color: transparent;
                border: none;
                color: navy;
                font-family: inherit;
                font-size: 11.5px;
                font-weight: 600;
                cursor: pointer;
                padding: 2px 4px;
            }
            .btn-marcar-leidas:hover {
                text-decoration: underline;
            }
            .btn-marcar-leidas.oculto {
                display: none !important;
            }
            .lista-notificaciones {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 290px;
                overflow-y: auto;
            }
            .item-notificacion {
                display: flex;
                flex-direction: column;
                gap: 3px;
                padding: 10px 12px;
                border-radius: 8px;
                border: 1px solid lightgray;
                background-color: whitesmoke;
                text-decoration: none;
                transition: border-color 0.15s ease, background-color 0.15s ease;
            }
            .item-notificacion.no-leida {
                background-color: aliceblue;
                border-color: silver;
            }
            .item-notificacion.clicable {
                cursor: pointer;
            }
            .item-notificacion.clicable:hover {
                border-color: navy;
            }
            .item-notif-etiqueta {
                font-size: 10.5px;
                font-weight: 700;
                color: navy;
                text-transform: uppercase;
            }
            .item-notif-titulo {
                font-size: 12.5px;
                font-weight: 600;
                color: black;
            }
            .item-notif-detalle {
                font-size: 11.5px;
                color: dimgray;
                line-height: 1.4;
            }
            @media (max-width: 600px) {
                .panel-notificaciones {
                    right: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    async function cargarNotificacionesEstudiante(token, usuario) {
        const avisos = [];
        const userId = usuario.id;

        if (!userId) {
            return [{
                id: 'al-dia-sin-id',
                etiqueta: 'Al día',
                titulo: 'Sin pendientes por ahora',
                detalle: 'Cuando tu docente asigne nuevas evaluaciones aparecerán aquí.',
                enlace: null,
                soloInformativo: true
            }];
        }

        try {
            const resTalleres = await fetch(`${API_BASE}/evaluacion/mis-talleres/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resTalleres.ok) {
                const dataTalleres = await resTalleres.json();
                const lista = Array.isArray(dataTalleres)
                    ? dataTalleres
                    : (dataTalleres.talleres || dataTalleres.evaluaciones || []);

                const pendientes = lista.filter(t => !t.completado);
                pendientes.forEach(t => {
                    const esDiagnostico = t.modalidad === 'entrenamiento'
                        || t.modalidad === 'diagnostico'
                        || Boolean(t.competence_id);

                    avisos.push({
                        id: `workshop-${t.id}`,
                        etiqueta: esDiagnostico ? 'Diagnóstico pendiente' : 'Simulacro General pendiente',
                        titulo: t.tema || 'Evaluación asignada',
                        detalle: esDiagnostico
                            ? 'Prueba diagnóstica con apoyo de TutorIA. Haz clic para iniciar.'
                            : 'Evaluación formal Saber 9/11. Haz clic para iniciar.',
                        enlace: `/views/simulacro.html?workshop_id=${t.id}`,
                        soloInformativo: false
                    });
                });
            }
        } catch {
            // Continúa sin interrumpir si aún no tiene grupo asignado
        }

        try {
            const resStats = await fetch(`${API_BASE}/stats/estudiante/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resStats.ok) {
                const stats = await resStats.json();
                const historial = stats.historial_tutoria || stats.retroalimentaciones || [];

                if (Array.isArray(historial) && historial.length > 0) {
                    avisos.push({
                        id: `tutoria-${historial.length}`,
                        etiqueta: 'TutorIA',
                        titulo: `${historial.length} corrección(es) pedagógica(s) disponible(s)`,
                        detalle: 'Revisa las recomendaciones de estudio en tu panel principal.',
                        enlace: null,
                        soloInformativo: false
                    });
                }
            }
        } catch {
            // Fallback silencioso
        }

        if (avisos.length === 0) {
            avisos.push({
                id: `al-dia-${userId}`,
                etiqueta: 'Al día',
                titulo: 'Sin pendientes por ahora',
                detalle: 'Cuando tu docente asigne nuevas evaluaciones aparecerán aquí.',
                enlace: null,
                soloInformativo: true
            });
        }

        return avisos;
    }

    async function cargarNotificacionesDocente(token, usuario) {
        const avisos = [];
        const teacherId = usuario.id;

        if (teacherId) {
            try {
                const res = await fetch(`${API_BASE}/auth/docente/${teacherId}/estudiantes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const grupos = data.grupos || [];
                    const totalEstudiantes = grupos.reduce((acc, g) => acc + (g.estudiantes?.length || 0), 0);

                    if (grupos.length > 0 || totalEstudiantes > 0) {
                        avisos.push({
                            id: `doc-grupos-${grupos.length}-${totalEstudiantes}`,
                            etiqueta: 'Gestión de Grupos',
                            titulo: `${grupos.length} grupo(s) • ${totalEstudiantes} estudiante(s) vinculado(s)`,
                            detalle: 'Revisa el mapa de calor de TutorIA para identificar competencias a reforzar.',
                            enlace: '#seccion-mapa-calor',
                            soloInformativo: false
                        });
                    }
                }
            } catch {
                // Fallback silencioso
            }
        }

        if (avisos.length === 0) {
            avisos.push({
                id: `al-dia-doc-${teacherId || '0'}`,
                etiqueta: 'Panel Docente',
                titulo: 'Sin novedades por ahora',
                detalle: 'Aquí recibirás alertas sobre el rendimiento grupal de tus estudiantes.',
                enlace: null,
                soloInformativo: true
            });
        }

        return avisos;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const { token, usuario } = obtenerSesion();
        if (!token || !usuario) return;

        const btnNotif = document.getElementById('boton-notificaciones');
        const badgeNotif = document.getElementById('badge-notificaciones');
        const zonaPerfil = document.querySelector('.zona-perfil');
        if (!btnNotif || !badgeNotif || !zonaPerfil) return;

        inyectarEstilosNotificaciones();

        const panelExistente = document.getElementById('panel-notificaciones');
        if (panelExistente) panelExistente.remove();

        const panel = document.createElement('div');
        panel.id = 'panel-notificaciones';
        panel.className = 'panel-notificaciones oculto';
        panel.innerHTML = `
            <div class="cabecera-notificaciones">
                <h4 class="titulo-notificaciones">Notificaciones</h4>
                <button type="button" id="btn-marcar-leidas" class="btn-marcar-leidas">Marcar como leídas</button>
            </div>
            <div id="lista-notificaciones" class="lista-notificaciones"></div>
        `;
        zonaPerfil.appendChild(panel);

        const listaEl = document.getElementById('lista-notificaciones');
        const btnMarcarLeidas = document.getElementById('btn-marcar-leidas');
        const menuPerfil = document.getElementById('menu-perfil');
        const btnPerfil = document.getElementById('boton-perfil');

        let leidasIds = leerNotifLeidas(usuario.id);

        const avisos = esRolDocente(usuario)
            ? await cargarNotificacionesDocente(token, usuario)
            : await cargarNotificacionesEstudiante(token, usuario);

        function renderizarAvisos() {
            const noLeidas = avisos.filter(a => !a.soloInformativo && !leidasIds.includes(a.id));

            if (noLeidas.length > 0) {
                badgeNotif.textContent = String(noLeidas.length);
                badgeNotif.classList.remove('oculto');
                btnMarcarLeidas.classList.remove('oculto');
            } else {
                badgeNotif.classList.add('oculto');
                btnMarcarLeidas.classList.add('oculto');
            }

            listaEl.innerHTML = '';
            avisos.forEach(aviso => {
                const esNoLeida = !aviso.soloInformativo && !leidasIds.includes(aviso.id);
                const el = document.createElement(aviso.enlace ? 'a' : 'div');
                el.className = `item-notificacion ${esNoLeida ? 'no-leida' : ''} ${aviso.enlace ? 'clicable' : ''}`;
                if (aviso.enlace) el.href = aviso.enlace;

                el.innerHTML = `
                    <span class="item-notif-etiqueta">${aviso.etiqueta}</span>
                    <span class="item-notif-titulo">${aviso.titulo}</span>
                    <span class="item-notif-detalle">${aviso.detalle}</span>
                `;

                el.addEventListener('click', () => {
                    if (!aviso.soloInformativo && !leidasIds.includes(aviso.id)) {
                        leidasIds.push(aviso.id);
                        guardarNotifLeidas(usuario.id, leidasIds);
                        renderizarAvisos();
                    }
                    if (aviso.enlace && aviso.enlace.startsWith('#')) {
                        panel.classList.add('oculto');
                    }
                });

                listaEl.appendChild(el);
            });
        }

        renderizarAvisos();

        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menuPerfil) menuPerfil.classList.add('oculto');
            panel.classList.toggle('oculto');
        });

        btnPerfil?.addEventListener('click', () => {
            panel.classList.add('oculto');
        });

        btnMarcarLeidas.addEventListener('click', (e) => {
            e.stopPropagation();
            const idsAccionables = avisos.filter(a => !a.soloInformativo).map(a => a.id);
            leidasIds = Array.from(new Set([...leidasIds, ...idsAccionables]));
            guardarNotifLeidas(usuario.id, leidasIds);
            renderizarAvisos();
        });

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !btnNotif.contains(e.target)) {
                panel.classList.add('oculto');
            }
        });
    });
})();