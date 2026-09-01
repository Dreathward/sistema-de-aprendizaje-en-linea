# Historias de Usuario por Módulos de Arquitectura

**Asignatura:** Ingeniería de Software II  
**Proyecto:** Plataforma de Aprendizaje con IA Adaptativa  
**Universidad:** Universidad Antonio Nariño – Sede Sur, Bogotá  
**Periodo:** 2026-2  

---

## 1. Módulo de Autenticación y Gestión de Roles

### HU01 - Inicio de Sesión de Docentes
* **Como** docente de secundaria,
* **Quiero** autenticarme en la plataforma utilizando mi correo institucional y contraseña,
* **Para** acceder de manera segura al panel de gestión de cursos y creación de evaluaciones.
* **Criterios de Aceptación:**
  1. El backend valida las credenciales contra la base de datos en Supabase Auth.
  2. Al autenticarse correctamente, se genera un Token JWT con permisos de rol `docente`.
  3. Si las credenciales son incorrectas, la interfaz despliega un mensaje de error claro.

### HU02 - Ingreso Simplificado de Estudiantes
* **Como** estudiante de grado 9-3,
* **Quiero** ingresar a la plataforma ingresando con mi código de estudiante y clase proporcionado por mi profesor,
* **Para** acceder rápidamente a mis talleres asignados sin recordar contraseñas complejas.
* **Criterios de Aceptación:**
  1. El estudiante no requiere registro de correo electrónico para acceder.
  2. El sistema valida que el código de clase corresponda a una sección activa (ej. 9-3).
  3. La sesión asigna el rol `estudiante` y restringe el acceso a rutas administrativas.

### HU03 - Cierre de Sesión y Control de Acceso
* **Como** usuario registrado (docente o estudiante),
* **Quiero** poder cerrar mi sesión activa en cualquier momento desde la interfaz,
* **Para** proteger la privacidad de mis datos e historial académico en equipos compartidos del colegio.
* **Criterios de Aceptación:**
  1. La opción de cierre de sesión es visible en la barra superior de la aplicación.
  2. Al cerrar sesión, el Token JWT se invalida y el cliente web redirige a la pantalla de login.
  3. Intentar navegar hacia rutas protegidas por URL sin un token válido redirige automáticamente al login.

### HU04 - Gestión de Perfil de Usuario
* **Como** estudiante de grado 10-1,
* **Quiero** visualizar mi nombre completo, curso asignado y avatar de usuario en mi panel principal,
* **Para** confirmar que estoy trabajando dentro del grupo e historial académico correcto.
* **Criterios de Aceptación:**
  1. La API retorna los datos básicos del perfil guardados en Supabase al cargar el panel.
  2. El estudiante puede actualizar su nombre o foto de perfil si la institución lo habilita.

---

## 2. Módulo de Gestión de Cursos y Secciones

### HU05 - Creación y Configuración de Secciones Académicas
* **Como** docente de matemáticas,
* **Quiero** registrar nuevas secciones académicas (ej. 8-2, 10-1, 11-3) asignadas a la materia,
* **Para** clasificar y organizar a los estudiantes según su grupo escolar.
* **Criterios de Aceptación:**
  1. El docente puede crear una sección definiendo nombre, grado y año lectivo.
  2. El sistema genera automáticamente un código único de 6 caracteres alfanuméricos por sección.
  3. La sección creada queda visible inmediatamente en el tablero del docente.

### HU06 - Asociación de Estudiantes a Secciones
* **Como** docente,
* **Quiero** visualizar el listado de estudiantes inscritos en la sección 9-3,
* **Para** verificar la asistencia y participación de mi grupo de clase.
* **Criterios de Aceptación:**
  1. El módulo de backend permite listar todos los estudiantes asociados a un código de sección.
  2. El docente puede desvincular o mover un estudiante de sección si existe un error de matriculación.

### HU07 - Visualización de Talleres Pendientes
* **Como** estudiante de grado 11-2,
* **Quiero** ver la lista de cuestionarios activos y fechas de entrega asignadas a mi sección,
* **Para** planificar la resolución de mis tareas de estudio.
* **Criterios de Aceptación:**
  1. El panel del estudiante consume la API REST de cursos y lista los talleres publicados no resueltos.
  2. Cada taller muestra su tema, fecha límite y número de preguntas.

### HU08 - Publicación y Deshabilitación de Material
* **Como** docente,
* **Quiero** cambiar el estado de un taller entre "Borrador", "Publicado" u "Oculto",
* **Para** controlar el momento exacto en que los estudiantes pueden responder las evaluaciones.
* **Criterios de Aceptación:**
  1. Los talleres en estado "Borrador" no son visibles para la interfaz del estudiante.
  2. Al cambiar a "Publicado", el sistema habilita el cuestionario para la sección correspondiente.

---

## 3. Módulo de Evaluación y Banco de Preguntas

### HU09 - Generación Asistida de Borradores de Evaluación
* **Como** docente de biología,
* **Quiero** solicitar una propuesta de 5 preguntas de opción múltiple sobre un tema específico (ej. Genética para grado 9-3),
* **Para** acelerar la creación de cuestionarios alineados al currículo escolar.
* **Criterios de Aceptación:**
  1. El docente selecciona el tema, cantidad de preguntas y grado académico.
  2. El backend invoca al orquestador de IA para retornar la estructura en formato JSON.
  3. El cuestionario se despliega en modo edición previo a su almacenamiento final.

### HU10 - Edición y Aprobación de Preguntas
* **Como** docente,
* **Quiero** revisar, corregir o reemplazar las opciones de respuesta del borrador generado,
* **Para** garantizar la precisión pedagógica antes de enviarlo a mis estudiantes.
* **Criterios de Aceptación:**
  1. La interfaz permite editar el enunciado, las 4 opciones de respuesta y la respuesta correcta.
  2. El docente puede agregar preguntas manuales al banco antes de guardar.
  3. El cuestionario definitivo se almacena en las tablas relacionales de Supabase.

### HU11 - Resolución Interactiva de Cuestionarios
* **Como** estudiante de grado 10-1,
* **Quiero** responder las preguntas de un taller opción por opción desde mi navegador,
* **Para** completar mi proceso de evaluación formativa.
* **Criterios de Aceptación:**
  1. La interfaz muestra las preguntas de una en una o en formato de lista navegable.
  2. El cliente web registra las opciones seleccionadas y las envía en un payload JSON al backend.
  3. No se permite reenviar un taller ya finalizado a menos que el docente habilite un nuevo intento.

### HU12 - Calificación Inmediata y Diagnóstico
* **Como** estudiante de grado 8-4,
* **Quiero** obtener mi puntaje total al finalizar la entrega del cuestionario,
* **Para** conocer inmediatamente mi nivel de desempeño en el taller.
* **Criterios de Aceptación:**
  1. El backend (FastAPI) compara la respuesta enviada con la clave guardada en la base de datos.
  2. Se calcula el puntaje numérico y se retorna el desglose de aciertos y desaciertos al instante.

---

## 4. Módulo de Integración con IA (Orquestador Gemini API)

### HU13 - Tutoría Adaptativa por Vacíos Conceptuales
* **Como** estudiante de grado 9-3,
* **Quiero** recibir una explicación corta y adaptada a mi nivel escolar cuando falle una pregunta clave,
* **Para** comprender el concepto erróneo sin tener que esperar a la siguiente clase.
* **Criterios de Aceptación:**
  1. Cuando el backend detecta una respuesta incorrecta, extrae la falencia y el grado del alumno.
  2. El módulo de IA envía un prompt estructurado a la API de Google Gemini 1.5 Flash.
  3. La respuesta de la IA debe ser explicativa, breve y adecuada para la edad del grado evaluado.

### HU14 - Caché de Tutorías y Optimización
* **Como** estudiante,
* **Quiero** recibir la retroalimentación de IA de forma casi instantánea,
* **Para** continuar respondiendo la prueba sin demoras ni interrupciones.
* **Criterios de Aceptación:**
  1. El backend consulta en Supabase si la misma falla conceptual para ese grado ya fue explicada antes.
  2. Si existe en caché, retorna el texto guardado omitiendo la llamada remota a la API de Gemini.
  3. Si no existe, realiza la petición a Gemini y guarda la respuesta generada en caché.

### HU15 - Generación de Ejemplos Prácticos de Refuerzo
* **Como** estudiante de grado 11-1,
* **Quiero** pedir un ejemplo práctico o cotidiano sobre un ejercicio de física o matemáticas donde me equivoqué,
* **Para** visualizar la aplicación del concepto en la vida real.
* **Criterios de Aceptación:**
  1. La interfaz incluye el botón "Ver ejemplo práctico" junto a la retroalimentación del error.
  2. La IA genera una analogía o problema resuelto paso a paso adaptado al grado 11°.

### HU16 - Ajuste de Tono y Formato Pedagógico
* **Como** docente,
* **Quiero** asegurar que las explicaciones generadas por la IA mantengan un lenguaje respetuoso, motivador y claro,
* **Para** evitar frustraciones o confusión en el aprendizaje de los alumnos.
* **Criterios de Aceptación:**
  1. El System Prompt del backend incluye restricciones estrictas de tono pedagógico y brevedad (máx. 150 palabras).
  2. Se filtran posibles alucinaciones o términos técnicos avanzados no aptos para educación secundaria.

---

## 5. Módulo de Analíticas y Reportes

### HU17 - Mapa de Calor por Sección Académica
* **Como** docente de grado 10-3,
* **Quiero** ver una gráfica/mapa de calor interactivo de los temas con mayor índice de error en el grupo,
* **Para** identificar con precisión los vacíos que debo reforzar en la clase presencial.
* **Criterios de Aceptación:**
  1. El módulo de analíticas procesa los resultados almacenados en Supabase y agrupa los errores por tema.
  2. La interfaz dibuja el mapa de calor utilizando códigos de color (rojo: crítico, amarillo: medio, verde: óptimo).

### HU18 - Historial y Progreso Individual del Estudiante
* **Como** docente,
* **Quiero** consultar el historial de calificaciones y preguntas falladas de un estudiante en particular,
* **Para** llevar un seguimiento personalizado de su evolución durante el periodo académico.
* **Criterios de Aceptación:**
  1. Al hacer clic en un alumno de la lista, se abre un reporte detallado con su tasa de aciertos y talleres completados.
  2. Permite exportar o visualizar un resumen del progreso individual.

### HU19 - Reporte de Interacciones con la IA
* **Como** docente,
* **Quiero** visualizar cuántas tutorías de refuerzo ha solicitado cada sección (ej. 7-2) y qué temas generaron más consultas,
* **Para** evaluar el nivel de autonomía y dudas frecuentes de los alumnos.
* **Criterios de Aceptación:**
  1. El backend consolida el conteo de tutorías solicitadas por tema y sección.
  2. La interfaz gráfica muestra las estadísticas tabuladas para el docente.

### HU20 - Tablero Consolidado para Administración
* **Como** docente,
* **Quiero** visualizar un resumen general con el total de talleres activos, promedio del curso y participación,
* **Para** tener un diagnóstico rápido al ingresar a la plataforma antes de iniciar la jornada escolar.
* **Criterios de Aceptación:**
  1. El panel principal (Dashboard) calcula y muestra métricas globales en tiempo real.
  2. Los datos se actualizan automáticamente tras cada entrega de cuestionario.
