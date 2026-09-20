# Historias de Usuario

---

### Módulo 1: Autenticación y Perfiles

#### HU-01: Primer Acceso con Credenciales Institucionales
* **Como** Estudiante,
* **Quiero** ingresar por primera vez utilizando el usuario y contraseña temporal asignados por mi institución,
* **Para** activar mi cuenta y establecer mis credenciales de acceso definitivas.
* **Criterios de Aceptación:**
  1. El sistema permite ingresar las credenciales preasignadas por la administración institucional.
  2. En el primer inicio de sesión exitoso, exige el cambio obligatorio de la contraseña temporal por una personal y segura.
  3. Al confirmar la nueva contraseña, valida los datos del usuario en Supabase Auth y redirige al panel principal del estudiante.

#### HU-02: Inicio de Sesión
* **Como** Estudiante o Docente registrado,
* **Quiero** ingresar con mi correo e contraseña,
* **Para** acceder de forma segura a mi espacio de trabajo en la plataforma.
* **Criterios de Aceptación:**
  1. El sistema autentica las credenciales contra Supabase Auth y genera el token de sesión.
  2. En caso de error en las credenciales, despliega un mensaje claro sin comprometer la seguridad.
  3. Mantiene la sesión activa en el navegador del usuario para facilitar la navegación.

#### HU-03: Visualización de Entorno Según Rol
* **Como** Usuario registrado (Estudiante o Docente),
* **Quiero** que la plataforma me muestre únicamente las herramientas e interfaces correspondientes a mi perfil,
* **Para** interactuar con las funciones que me pertenecen sin confusiones ni accesos no autorizados.
* **Criterios de Aceptación:**
  1. El usuario con rol `estudiante` accede directamente al catálogo de competencias, entrenamientos y simulacros.
  2. El usuario con rol `docente` o `institución` ingresa al panel de monitoreo y mapas de calor institucionales.
  3. Si un estudiante intenta ingresar manualmente a una ruta reservada para docentes, se le deniega el acceso y se le redirige a su panel principal.

#### HU-04: Gestión de Perfil de Usuario
* **Como** Estudiante o Docente,
* **Quiero** actualizar mis datos personales e institución vinculada desde la configuración de mi cuenta,
* **Para** mantener mi información al día en las métricas y reportes del sistema.
* **Criterios de Aceptación:**
  1. Permite modificar nombre completo e institución o sección asociada.
  2. Guarda los cambios de forma inmediata en la base de datos de Supabase.
  3. Muestra una confirmación visual en pantalla al actualizar los datos correctamente.

---

### Módulo 2: Competencias e Instituciones

#### HU-05: Consulta del Catálogo de Competencias ICFES
* **Como** Estudiante,
* **Quiero** explorar las áreas del examen (Lectura Crítica, Razonamiento Cuantitativo, Ciencias Naturales, Competencias Ciudadanas e Inglés),
* **Para** seleccionar la competencia en la que deseo practicar.
* **Criterios de Aceptación:**
  1. Muestra las áreas de evaluación según la estructura oficial del ICFES.
  2. Permite seleccionar componentes específicos dentro de cada área.
  3. Muestra una breve explicación sobre la habilidad que se evalúa.

#### HU-06: Gestión de Grupos y Estudiantes por el Docente
* **Como** Docente,
* **Quiero** ver y administrar la lista de estudiantes de mis grupos asignados,
* **Para** verificar qué alumnos tienen acceso a las evaluaciones de la plataforma.
* **Criterios de Aceptación:**
  1. Muestra la lista de estudiantes organizada por grupo o salón.
  2. Permite verificar que los datos del estudiante estén vinculados correctamente a la institución.
  3. Permite activar o desactivar el acceso de un estudiante si es necesario.

#### HU-07: Programación de Simulacros
* **Como** Docente,
* **Quiero** programar un simulacro para mis grupos indicando la fecha y el tiempo disponible,
* **Para** evaluarlos en las mismas condiciones que la prueba real.
* **Criterios de Aceptación:**
  1. Permite elegir las competencias que incluirá el simulacro.
  2. Permite definir la fecha, hora de inicio y el tiempo límite para responder.
  3. Muestra el simulacro disponible en la pantalla del estudiante en la fecha indicada.

#### HU-08: Banco de Preguntas y Respuestas
* **Como** Administrador o Docente,
* **Quiero** revisar las preguntas del banco agrupadas por competencia y sus opciones de respuesta,
* **Para** asegurar que cada pregunta tenga sus respuestas bien configuradas con sus explicaciones.
* **Criterios de Aceptación:**
  1. Muestra las preguntas organizadas por área y tema.
  2. Verifica que las opciones incorrectas tengan asignada la causa del error para la tutoría.
  3. Permite activar o desactivar preguntas del banco principal.

---

### Módulo 3: Evaluación

#### HU-09: Práctica en Modo Entrenamiento Libre
* **Como** Estudiante,
* **Quiero** resolver preguntas de una competencia seleccionada a mi propio ritmo y sin límite de tiempo,
* **Para** poner a prueba mis conocimientos y solicitar apoyo pedagógico inmediato cuando tenga dudas.
* **Criterios de Aceptación:**
  1. Presenta las preguntas de forma secuencial con las opciones de respuesta múltiples.
  2. No aplica restricciones de tiempo ni cronómetro regresivo durante la sesión.
  3. Muestra una opción visible para confirmar y enviar la respuesta seleccionada en cada pregunta.

#### HU-10: Presentación de Simulacro Real Temporizado
* **Como** Estudiante,
* **Quiero** realizar un examen de simulacro con tiempo límite y condiciones controladas,
* **Para** vivir una experiencia similar a la prueba oficial del ICFES.
* **Criterios de Aceptación:**
  1. Muestra un cronómetro visible en pantalla con el tiempo restante programado por el docente.
  2. Bloquea las retroalimentaciones inmediatas de la inteligencia artificial durante el examen.
  3. Envía automáticamente las respuestas registradas cuando el tiempo asignado finaliza.

#### HU-11: Registro y Navegación de Respuestas
* **Como** Estudiante,
* **Quiero** seleccionar y modificar mis opciones de respuesta antes de finalizar la evaluación,
* **Para** revisar mis selecciones y asegurarme de marcar las opciones deseadas.
* **Criterios de Aceptación:**
  1. Permite marcar una opción de respuesta por pregunta y cambiar la selección mientras el intento esté activo.
  2. Indica de forma visual cuáles preguntas han sido respondidas y cuáles están pendientes.
  3. Solicita confirmación al estudiante antes de realizar la entrega final de la prueba.

#### HU-12: Calificación y Ponderación de Intentos
* **Como** Estudiante,
* **Quiero** recibir el resultado general al terminar un simulacro o sesión de práctica,
* **Para** conocer mi nivel de desempeño y el número de aciertos por competencia.
* **Criterios de Aceptación:**
  1. Calcula el puntaje total y el porcentaje de aciertos al cerrar la prueba.
  2. Desglosa los resultados indicando respuestas correctas e incorrectas por competencia.
  3. Registra el intento en la base de datos para habilitar la consulta posterior en el historial.

---

### Módulo 4: Orquestador de IA

#### HU-13: Solicitud de Tutoría por Lógica de Descarte
* **Como** Estudiante en Modo Entrenamiento Libre,
* **Quiero** solicitar una explicación cuando me equivoque en una pregunta,
* **Para** entender por qué la opción que elegí es un distractor incorrecto sin que la plataforma me regale la respuesta directa.
* **Criterios de Aceptación:**
  1. Habilita el botón de tutoría de IA únicamente tras registrar una respuesta incorrecta en entrenamiento libre.
  2. Envía a la API de Gemini el contexto de la pregunta, la opción seleccionada y la causa del error.
  3. Muestra una explicación enfocada en el análisis del error y la lógica para descartar dicha opción.

#### HU-14: Optimización de Respuestas Mediante Caché
* **Como** Estudiante,
* **Quiero** recibir la retroalimentación de la IA de forma rápida al solicitar una tutoría,
* **Para** continuar mi entrenamiento sin interrupciones ni esperas prolongadas.
* **Criterios de Aceptación:**
  1. Verifica en la base de datos si la explicación a ese error específico ya fue generada previamente.
  2. Si la respuesta está guardada en caché, la despliega inmediatamente en pantalla.
  3. Si no existe en caché, realiza la petición a Gemini, entrega la explicación y la almacena para futuras consultas.

#### HU-15: Retroalimentación Pedagógica Formateada
* **Como** Estudiante,
* **Quiero** ver la explicación de la IA organizada de forma clara y legible,
* **Para** identificar rápidamente el fallo conceptual y el razonamiento correcto.
* **Criterios de Aceptación:**
  1. Presenta el texto explicativo con formato limpio (resaltados y viñetas sencillas).
  2. Limita la extensión de la respuesta a un párrafo breve y directo focalizado en la lógica de descarte.
  3. Muestra un mensaje amigable en caso de interrupción en el servicio de la API externa.

#### HU-16: Evaluación Autónoma sin Ayudas en Simulacros
* **Como** Docente,
* **Quiero** que los simulacros reales mantengan desactivada la tutoría de IA durante la prueba,
* **Para** evaluar el rendimiento real de mis estudiantes sin interferencias ni apoyos externos.
* **Criterios de Aceptación:**
  1. Oculta y desactiva la opción de tutoría de IA mientras el estudiante esté presentado un simulacro real.
  2. Impide el envío de peticiones al módulo de IA durante el intento activo del examen.
  3. Permite la consulta de las explicaciones de IA únicamente al finalizar el examen en la fase de revisión.

---

### Módulo 5: Analíticas e Historial

#### HU-17: Historial Individual de Desempeño
* **Como** Estudiante,
* **Quiero** consultar el historial de mis entrenamientos y simulacros realizados,
* **Para** monitorear mi nivel de avance y revisar los aciertos y fallos acumulados en cada competencia.
* **Criterios de Aceptación:**
  1. Muestra un listado con los intentos pasados, indicando fecha, modalidad y puntaje obtenido.
  2. Permite filtrar los resultados por competencia específica del ICFES.
  3. Despliega el detalle de cada intento con las respuestas seleccionadas y las explicaciones de descarte consultadas.

#### HU-18: Reportes de Rendimiento para Docentes
* **Como** Docente,
* **Quiero** acceder a un panel general con los resultados de mis grupos,
* **Para** identificar qué estudiantes o salones necesitan refuerzo en competencias específicas.
* **Criterios de Aceptación:**
  1. Muestra el promedio de desempeño del grupo organizado por área evaluada.
  2. Permite visualizar el avance individual de cada estudiante vinculado al grupo.
  3. Permite exportar o consultar un resumen de notas y porcentajes de acierto por prueba.

#### HU-19: Mapa de Calor de Brechas Conceptuales
* **Como** Docente,
* **Quiero** visualizar un mapa de calor que resalte los distractores más seleccionados por el grupo,
* **Para** detectar las falencias conceptuales recurrentes y preparar retroalimentaciones en las clases presenciales.
* **Criterios de Aceptación:**
  1. Agrupa los errores del salón por tema y por la hipótesis de error específica del distractor marcado.
  2. Resalta de forma visual (colores o indicadores) los temas con mayor tasa de desacierto.
  3. Muestra el porcentaje de estudiantes del grupo que cayeron en la misma trampa conceptual.

#### HU-20: Consulta de Indicadores Institucionales
* **Como** Administrador Institucional,
* **Quiero** revisar el desempeño global de la institución comparado entre grupos o sedes,
* **Para** tomar decisiones directivas sobre los planes de preparación para las Pruebas Saber.
* **Criterios de Aceptación:**
  1. Muestra gráficos con el nivel de desempeño proyectado de la institución por competencia.
  2. Permite comparar las métricas generales entre distintas secciones o jornadas de la institución.
  3. Actualiza los datos de forma automática a medida que los estudiantes completan nuevos simulacros.
