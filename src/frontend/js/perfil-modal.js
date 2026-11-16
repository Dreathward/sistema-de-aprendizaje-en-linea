(function () {
    const API_AUTH = 'http://127.0.0.1:8000/auth';

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

    function formatearGradoSaber(gradoRaw) {
        const limpio = String(gradoRaw || '11').replace('°', '').trim();
        return limpio === '9' ? '9°' : '11°';
    }

    function inyectarEstilosPerfil() {
        if (document.getElementById('estilos-modal-perfil')) return;

        const style = document.createElement('style');
        style.id = 'estilos-modal-perfil';
        style.textContent = `
            .btn-menu-perfil-opcion {
                width: 100%;
                background-color: transparent;
                border: none;
                border-bottom: 1px solid lightgray;
                color: black;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                text-align: left;
                padding: 10px 12px;
                margin: 0 0 8px 0;
                cursor: pointer;
                transition: background-color 0.15s ease, color 0.15s ease;
            }
            .btn-menu-perfil-opcion:hover {
                background-color: whitesmoke;
                color: navy;
            }
            .fondo-modal-perfil {
                position: fixed;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.55);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                z-index: 250;
            }
            .fondo-modal-perfil.oculto {
                display: none !important;
            }
            .caja-modal-perfil {
                background-color: white;
                border: 1px solid silver;
                border-radius: 16px;
                width: 100%;
                max-width: 470px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 26px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .cabecera-modal-perfil {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }
            .titulo-modal-perfil {
                font-size: 20px;
                font-weight: 700;
                color: black;
                margin: 0;
            }
            .subtitulo-modal-perfil {
                font-size: 12.5px;
                color: dimgray;
                margin-top: 3px;
            }
            .btn-cerrar-modal-perfil {
                background-color: transparent;
                border: none;
                font-size: 16px;
                font-weight: 700;
                color: dimgray;
                cursor: pointer;
                padding: 2px 6px;
            }
            .btn-cerrar-modal-perfil:hover {
                color: black;
            }
            .tabs-modal-perfil {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                background-color: whitesmoke;
                padding: 5px;
                border-radius: 10px;
                border: 1px solid lightgray;
            }
            .tab-btn-perfil {
                background-color: transparent;
                border: none;
                border-radius: 7px;
                padding: 9px 12px;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                color: dimgray;
                cursor: pointer;
                transition: background-color 0.15s ease, color 0.15s ease;
            }
            .tab-btn-perfil.activo {
                background-color: white;
                color: navy;
                border: 1px solid silver;
            }
            .alerta-modal-perfil {
                font-size: 12.5px;
                line-height: 1.45;
                padding: 11px 13px;
                border-radius: 8px;
                border: 1px solid silver;
            }
            .alerta-modal-perfil.oculto {
                display: none !important;
            }
            .alerta-modal-perfil.error {
                background-color: mistyrose;
                border-color: crimson;
                color: darkred;
            }
            .alerta-modal-perfil.exito {
                background-color: honeydew;
                border-color: seagreen;
                color: darkgreen;
            }
            .nota-institucional-perfil {
                background-color: whitesmoke;
                border: 1px solid lightgray;
                color: dimgray;
                font-size: 12px;
                line-height: 1.45;
                padding: 9px 12px;
                border-radius: 8px;
                margin: 0;
            }
            .form-modal-perfil {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .form-modal-perfil.oculto {
                display: none !important;
            }
            .campo-grupo-perfil {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .campo-grupo-perfil.oculto {
                display: none !important;
            }
            .label-perfil {
                font-size: 12.5px;
                font-weight: 600;
                color: black;
            }
            .input-perfil {
                width: 100%;
                padding: 10px 12px;
                font-size: 13.5px;
                font-family: inherit;
                color: black;
                background-color: white;
                border: 1px solid silver;
                border-radius: 8px;
                outline: none;
            }
            .input-perfil:focus {
                border-color: navy;
            }
            .input-perfil:disabled {
                background-color: whitesmoke;
                color: dimgray;
                cursor: not-allowed;
            }
            .fila-dos-columnas-perfil {
                display: grid;
                grid-template-columns: 110px 1fr;
                gap: 10px;
            }
            .acciones-modal-perfil {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 6px;
            }
            .btn-secundario-perfil {
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
            .btn-secundario-perfil:hover {
                background-color: whitesmoke;
            }
            .btn-primario-perfil {
                background-color: navy;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 18px;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }
            .btn-primario-perfil:hover {
                background-color: darkblue;
            }
            .btn-primario-perfil.oculto {
                display: none !important;
            }
            .btn-primario-perfil:disabled {
                opacity: 0.7;
                cursor: wait;
            }
        `;
        document.head.appendChild(style);
    }

    function construirModalHTML(usuario) {
        const docente = esRolDocente(usuario);
        const rolEtiqueta = docente ? 'Docente ICFES' : 'Estudiante Saber 9/11';

        const wrapper = document.createElement('div');
        wrapper.id = 'modal-mi-perfil';
        wrapper.className = 'fondo-modal-perfil oculto';
        wrapper.innerHTML = `
            <div class="caja-modal-perfil">
                <div class="cabecera-modal-perfil">
                    <div>
                        <h3 class="titulo-modal-perfil">Mi Perfil</h3>
                        <p class="subtitulo-modal-perfil" id="subtitulo-info-perfil">
                            ${rolEtiqueta} • ${usuario.correo || ''}
                        </p>
                    </div>
                    <button type="button" id="btn-cerrar-modal-perfil" class="btn-cerrar-modal-perfil">✕</button>
                </div>

                <div class="tabs-modal-perfil">
                    <button type="button" id="tab-datos-perfil" class="tab-btn-perfil activo">
                        Datos Personales
                    </button>
                    <button type="button" id="tab-seguridad-perfil" class="tab-btn-perfil">
                        Seguridad
                    </button>
                </div>

                <div id="alerta-modal-perfil" class="alerta-modal-perfil oculto"></div>

                <!-- PESTAÑA 1: DATOS PERSONALES -->
                <form id="form-datos-perfil" class="form-modal-perfil">
                    <p class="nota-institucional-perfil">
                        ${docente
                            ? 'Tu nombre y correo institucional son asignados por la administración del plantel.'
                            : 'Tu nombre, correo y grado Saber (9° u 11°) son asignados por la institución. Solo puedes actualizar tus datos de contacto.'}
                    </p>

                    <div class="campo-grupo-perfil">
                        <label for="perfil-nombre" class="label-perfil">Nombre completo</label>
                        <input type="text" id="perfil-nombre" class="input-perfil" disabled>
                    </div>

                    <div class="campo-grupo-perfil">
                        <label for="perfil-correo" class="label-perfil">Correo institucional</label>
                        <input type="email" id="perfil-correo" class="input-perfil" disabled>
                    </div>

                    <div id="campos-exclusivos-estudiante" class="${docente ? 'oculto' : ''}" style="display: flex; flex-direction: column; gap: 14px;">
                        <div class="fila-dos-columnas-perfil">
                            <div class="campo-grupo-perfil">
                                <label for="perfil-grado" class="label-perfil">Grado Saber</label>
                                <input type="text" id="perfil-grado" class="input-perfil" disabled>
                            </div>
                            <div class="campo-grupo-perfil">
                                <label for="perfil-telefono" class="label-perfil">Teléfono de contacto</label>
                                <input type="tel" id="perfil-telefono" class="input-perfil" placeholder="Ej. 300 123 4567">
                            </div>
                        </div>

                        <div class="campo-grupo-perfil">
                            <label for="perfil-direccion" class="label-perfil">Dirección de residencia</label>
                            <input type="text" id="perfil-direccion" class="input-perfil" placeholder="Ej. Cra 15 # 42-10, Bogotá">
                        </div>
                    </div>

                    <div class="acciones-modal-perfil">
                        <button type="button" id="btn-cancelar-datos-perfil" class="btn-secundario-perfil">
                            ${docente ? 'Cerrar' : 'Cancelar'}
                        </button>
                        <button type="submit" id="btn-guardar-datos-perfil" class="btn-primario-perfil ${docente ? 'oculto' : ''}">
                            Guardar cambios
                        </button>
                    </div>
                </form>

                <!-- PESTAÑA 2: CAMBIO DE CONTRASEÑA -->
                <form id="form-seguridad-perfil" class="form-modal-perfil oculto">
                    <div class="campo-grupo-perfil">
                        <label for="perfil-pass-actual" class="label-perfil">Contraseña actual</label>
                        <input type="password" id="perfil-pass-actual" class="input-perfil" placeholder="••••••••" required>
                    </div>

                    <div class="campo-grupo-perfil">
                        <label for="perfil-pass-nueva" class="label-perfil">Nueva contraseña (mínimo 6 caracteres)</label>
                        <input type="password" id="perfil-pass-nueva" class="input-perfil" placeholder="••••••••" minlength="6" required>
                    </div>

                    <div class="campo-grupo-perfil">
                        <label for="perfil-pass-confirmar" class="label-perfil">Confirmar nueva contraseña</label>
                        <input type="password" id="perfil-pass-confirmar" class="input-perfil" placeholder="••••••••" minlength="6" required>
                    </div>

                    <div class="acciones-modal-perfil">
                        <button type="button" id="btn-cancelar-seg-perfil" class="btn-secundario-perfil">Cancelar</button>
                        <button type="submit" id="btn-guardar-pass-perfil" class="btn-primario-perfil">Actualizar contraseña</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(wrapper);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const { token, usuario } = obtenerSesion();
        if (!token || !usuario) return;

        const menuPerfil = document.getElementById('menu-perfil');
        const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
        if (!menuPerfil || !btnCerrarSesion) return;

        inyectarEstilosPerfil();
        construirModalHTML(usuario);

        const btnAbrirPerfil = document.createElement('button');
        btnAbrirPerfil.type = 'button';
        btnAbrirPerfil.id = 'btn-abrir-mi-perfil';
        btnAbrirPerfil.className = 'btn-menu-perfil-opcion';
        btnAbrirPerfil.textContent = 'Mi Perfil y Seguridad';
        menuPerfil.insertBefore(btnAbrirPerfil, btnCerrarSesion);

        const modal = document.getElementById('modal-mi-perfil');
        const btnCerrar = document.getElementById('btn-cerrar-modal-perfil');
        const alerta = document.getElementById('alerta-modal-perfil');

        const tabDatos = document.getElementById('tab-datos-perfil');
        const tabSeguridad = document.getElementById('tab-seguridad-perfil');
        const formDatos = document.getElementById('form-datos-perfil');
        const formSeguridad = document.getElementById('form-seguridad-perfil');

        const inputNombre = document.getElementById('perfil-nombre');
        const inputCorreo = document.getElementById('perfil-correo');
        const inputGrado = document.getElementById('perfil-grado');
        const inputTelefono = document.getElementById('perfil-telefono');
        const inputDireccion = document.getElementById('perfil-direccion');
        const btnGuardarDatos = document.getElementById('btn-guardar-datos-perfil');

        const inputPassActual = document.getElementById('perfil-pass-actual');
        const inputPassNueva = document.getElementById('perfil-pass-nueva');
        const inputPassConfirmar = document.getElementById('perfil-pass-confirmar');
        const btnGuardarPass = document.getElementById('btn-guardar-pass-perfil');

        function mostrarAlerta(msg, tipo) {
            alerta.textContent = msg;
            alerta.className = `alerta-modal-perfil ${tipo}`;
            alerta.classList.remove('oculto');
        }

        function ocultarAlerta() {
            alerta.classList.add('oculto');
        }

        function cargarValoresActuales() {
            const sesionActual = obtenerSesion().usuario || usuario;
            inputNombre.value = sesionActual.nombre || '';
            inputCorreo.value = sesionActual.correo || '';
            if (inputGrado) inputGrado.value = formatearGradoSaber(sesionActual.grado);
            if (inputTelefono) inputTelefono.value = '';
            if (inputDireccion) inputDireccion.value = '';
        }

        function activarTabDatos() {
            ocultarAlerta();
            tabDatos.classList.add('activo');
            tabSeguridad.classList.remove('activo');
            formDatos.classList.remove('oculto');
            formSeguridad.classList.add('oculto');
        }

        function activarTabSeguridad() {
            ocultarAlerta();
            tabSeguridad.classList.add('activo');
            tabDatos.classList.remove('activo');
            formSeguridad.classList.remove('oculto');
            formDatos.classList.add('oculto');
        }

        function cerrarModal() {
            modal.classList.add('oculto');
            ocultarAlerta();
            formSeguridad.reset();
        }

        btnAbrirPerfil.addEventListener('click', () => {
            menuPerfil.classList.add('oculto');
            cargarValoresActuales();
            activarTabDatos();
            modal.classList.remove('oculto');
        });

        btnCerrar.addEventListener('click', cerrarModal);
        document.getElementById('btn-cancelar-datos-perfil').addEventListener('click', cerrarModal);
        document.getElementById('btn-cancelar-seg-perfil').addEventListener('click', cerrarModal);

        tabDatos.addEventListener('click', activarTabDatos);
        tabSeguridad.addEventListener('click', activarTabSeguridad);

        // Permitir solo dígitos y espacios mientras se escribe en el teléfono
        inputTelefono?.addEventListener('input', () => {
            inputTelefono.value = inputTelefono.value.replace(/[^\d\s]/g, '').slice(0, 12);
        });

        // Guardar únicamente Teléfono y Dirección del estudiante (PUT /auth/perfil/{user_id})
        formDatos.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarAlerta();

            const { token: tokenActual, usuario: userActual } = obtenerSesion();
            if (esRolDocente(userActual)) return;

            const telLimpio = inputTelefono.value.replace(/\s+/g, '').trim();
            const dirLimpia = inputDireccion.value.trim();

            if (!telLimpio && !dirLimpia) {
                mostrarAlerta('Ingresa un teléfono o una dirección de residencia para actualizar.', 'error');
                inputTelefono.focus();
                return;
            }

            if (telLimpio && !/^(3\d{9}|60\d{8})$/.test(telLimpio)) {
                mostrarAlerta('Ingresa un teléfono válido de 10 dígitos (ej. 300 123 4567 o 601 234 5678).', 'error');
                inputTelefono.focus();
                return;
            }

            if (dirLimpia && dirLimpia.length < 6) {
                mostrarAlerta('Ingresa una dirección de residencia más completa (mínimo 6 caracteres).', 'error');
                inputDireccion.focus();
                return;
            }

            const payload = {};
            if (telLimpio) payload.telefono = telLimpio;
            if (dirLimpia) payload.direccion = dirLimpia;

            btnGuardarDatos.textContent = 'Guardando...';
            btnGuardarDatos.disabled = true;

            try {
                const res = await fetch(`${API_AUTH}/perfil/${userActual.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenActual}`
                    },
                    body: JSON.stringify(payload)
                });

                const datos = await res.json();
                if (!res.ok) {
                    throw new Error(datos.detail || 'No se pudieron actualizar los datos de contacto.');
                }

                inputTelefono.value = '';
                inputDireccion.value = '';

                const usuarioActualizado = {
                    ...userActual,
                    ...(telLimpio ? { telefono: telLimpio } : {}),
                    ...(dirLimpia ? { direccion: dirLimpia } : {})
                };

                localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
                mostrarAlerta(datos.mensaje || 'Datos de contacto actualizados correctamente.', 'exito');
            } catch (err) {
                mostrarAlerta(err.message, 'error');
            } finally {
                btnGuardarDatos.textContent = 'Guardar cambios';
                btnGuardarDatos.disabled = false;
            }
        });

        // Cambiar Contraseña dentro de sesión (POST /auth/cambiar-password)
        formSeguridad.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarAlerta();

            const passActual = inputPassActual.value.trim();
            const passNueva = inputPassNueva.value.trim();
            const passConfirmar = inputPassConfirmar.value.trim();

            if (passNueva.length < 6) {
                mostrarAlerta('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }

            if (passNueva !== passConfirmar) {
                mostrarAlerta('Las contraseñas nuevas no coinciden.', 'error');
                inputPassConfirmar.focus();
                return;
            }

            const { token: tokenActual, usuario: userActual } = obtenerSesion();

            btnGuardarPass.textContent = 'Actualizando...';
            btnGuardarPass.disabled = true;

            try {
                const res = await fetch(`${API_AUTH}/cambiar-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokenActual}`
                    },
                    body: JSON.stringify({
                        user_id: userActual.id,
                        password_actual: passActual,
                        nueva_password: passNueva
                    })
                });

                const datos = await res.json();
                if (!res.ok) {
                    throw new Error(datos.detail || 'No se pudo actualizar la contraseña.');
                }

                formSeguridad.reset();
                mostrarAlerta(datos.mensaje || 'Contraseña actualizada correctamente.', 'exito');
            } catch (err) {
                mostrarAlerta(err.message, 'error');
            } finally {
                btnGuardarPass.textContent = 'Actualizar contraseña';
                btnGuardarPass.disabled = false;
            }
        });
    });
})();