# Modelo de Desarrollo y Metodología de Trabajo

**Asignatura:** Ingeniería de Software II  
**Profesor:** Julián Prado (`jprado399@uan.edu.co`)  
**Universidad:** Universidad Antonio Nariño – Sede Sur, Bogotá  
**Periodo:** 2026-2  

---

## 1. Justificación

Para la construcción de la plataforma se adopta el **Modelo Incremental e Iterativo**, soportado operativamente por el marco de trabajo ágil **Scrum (Adaptado para MVP)**.

### Definición del Modelo
* **Enfoque Incremental:** El sistema no se desarrolla de forma monolítica al final del semestre. Se divide en módulos funcionales que añaden valor operativo de manera progresiva (Base de datos y Autenticación -> Motor de Cuestionarios -> Integración con IA Gemini -> Analíticas de Rendimiento).
* **Enfoque Iterativo:** Dado que las evaluaciones oficiales ocurren al cierre de cada uno de los 4 cortes evaluativos, el equipo realiza iteraciones de revisión interna durante las semanas de desarrollo para probar, ajustar y pulir la calidad de las interfaces, lógica de negocio y respuesta de la IA antes de consolidar la entrega oficial.

---

## 2. Marco de Trabajo: Scrum Adaptado (Gestión por Cortes)

El framework Scrum se adapta para alinear el ritmo de trabajo interno con la estructura del calendario académico de la institución.

### 2.1 Roles del Equipo
* **Product Owner / Evaluador Externo:** Prof. Julián Prado (establece requerimientos de la asignatura y criterios de aceptación).
* **Scrum Master & Lead Frontend:** Jhon Alexander Pérez Llerena (coordinación del flujo de trabajo, gestión de repositorio e interfaz de usuario).
* **Core Backend & IA Engineers:** Jeison Steven Niño Rojas y Samuel Thomas Monroy Pérez (desarrollo de servicios API REST en Python/FastAPI, lógica de negocio e integración con la API de Google Gemini).
* **Database & Infrastructure Lead:** Andrés Felipe Páez Díaz (diseño relacional en PostgreSQL/Supabase, persistencia de datos y gestión de caché).

### 2.2 Artefactos del Sistema
* **Product Backlog:** Listado general de historias de usuario detalladas en el archivo `/docs/05-historias-usuario.md`.
* **Sprint Backlog:** Subconjunto de tareas priorizadas que el equipo asume durante cada ciclo de 2 a 3 semanas.
* **Incremento Entregable:** Versión ejecutable de software o documentación funcional presentada al cierre de cada corte académico.

---

## 3. Planificación por Cortes y Sprints

El desarrollo del proyecto se estructura en **7 Sprints distribuidos a lo largo de los 4 Cortes evaluativos del semestre**:

| Corte Académico | Sprint | Duración Estimada | Alcance y Tareas Principales | Entregable del Sprint / Corte |
| :--- | :--- | :--- | :--- | :--- |
| **Corte 1** | **Sprint 1** | 2 Semanas | **Fase de Análisis y Diseño:** Levantamiento de requerimientos, estructuración de arquitectura (Monolito Modular) y formalización de la documentación base en GitHub. | Repositorio estructurado y carpeta `/docs` completa. |
| **Corte 2** | **Sprint 2** | 2 Semanas | **Fase de Infraestructura:** Modelado relacional en Supabase, configuración del servidor Backend en Python/FastAPI y rutas iniciales. | Base de datos desplegada y API REST base funcional. |
| | **Sprint 3** | 2 Semanas | **Fase de Interfaz y Usuarios:** Desarrollo del Frontend en HTML5/CSS3/JS (vistas de estudiante/docente) e integración del módulo de autenticación. | Modulo funcional de usuarios y secciones (ej. 6-1, 6-2). |
| **Corte 3** | **Sprint 4** | 2 Semanas | **Integración de IA:** Conexión del SDK de Google Gemini API en Python, diseño de prompts estructurados por grado escolar y caché de tutorías. | Motor de generación de contenido explicativo operativo. |
| | **Sprint 5** | 2 Semanas | **Motor de Evaluación:** Lógica de cuestionarios interactivos, calificación automática e identificación de vacíos conceptuales en tiempo real. | Módulo de tutoría adaptativa e interacción completa del alumno. |
| **Corte 4** | **Sprint 6** | 2 Semanas | **Analíticas y Diagnóstico:** Módulo de reporte para docentes con mapas de rendimiento grupal e historial de actividades por sección. | Panel de analíticas para el profesor 100% integrado. |
| | **Sprint 7** | 2 Semanas | **Pruebas y Cierre:** Pruebas integrales de rendimiento, corrección de errores, refinamiento visual y preparación del despliegue final. | Producto Mínimo Viable (MVP) desplegado y `06-evidencias.md`. |
