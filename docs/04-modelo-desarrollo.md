# Modelo de Desarrollo y Metodología de Trabajo

---

## 1. Justificación

Para la construcción de la plataforma se adopta el **Modelo Incremental e Iterativo**, soportado operativamente por un marco de trabajo **Scrum Adaptado**. Esta combinación metodológica permite abordar la complejidad del software dividiendo el proyecto en entregables funcionales de valor inmediato, al tiempo que facilita la incorporación continua de retroalimentación pedagógica y técnica sin interrumpir el avance general del desarrollo.

El **enfoque incremental** estructura la construcción del sistema en módulos independientes que se añaden de forma progresiva a la arquitectura. La plataforma evoluciona a través de la integración de capas clave: la gestión de autenticación y perfiles, el catálogo estructurado de competencias del ICFES, el motor de evaluación para los modos de Entrenamiento Libre y Simulacro Real, el orquestador de tutorías por lógica de descarte con la API de Google Gemini y, finalmente, el módulo de analíticas e historial institucional. Cada incremento entrega una versión utilizable que amplía la funcionalidad del producto.

Por su parte, el **enfoque iterativo** garantiza la revisión y perfeccionamiento constante de los componentes construidos. A lo largo de los ciclos de trabajo, el equipo prueba, ajusta y pule la fluidez de las interfaces de usuario, la precisión en los tiempos de respuesta del backend en FastAPI, la calidad pedagógica de las explicaciones generadas por la inteligencia artificial y la estabilidad de las conexiones con Supabase. Esta dinámica iterativa asegura que cada funcionalidad no solo se despliegue, sino que se optimice técnicamente antes de su validación final.

---

## 2. Marco de Trabajo

Scrum se adapta para alinear el trabajo interno con las entregas de los cuatro cortes académicos.

### 2.1 Roles del Equipo
* **Product Owner:** Julián Prado.
* **Scrum Master & Lead Frontend:** Jhon Alexander Pérez Llerena.
* **Core Backend & IA Engineers:** Jeison Steven Niño Rojas y Samuel Thomas Monroy Pérez.
* **Database & Infrastructure Lead:** Andrés Felipe Páez Díaz.

### 2.2 Artefactos del Sistema
* **Product Backlog:** Listado general de historias de usuario en `/docs/05-historias-usuario.md`.
* **Sprint Backlog:** Tareas priorizadas asignadas para cada ciclo de 2 a 3 semanas.
* **Incremento Entregable:** Versión ejecutable de software o documentación presentada al cierre de cada corte.

---

## 3. Planificación

El desarrollo se estructura en **7 Sprints distribuidos en los 4 Cortes evaluativos**:

| Corte Académico | Sprint | Duración Estimada | Alcance y Tareas Principales | Entregable del Sprint / Corte |
| :--- | :--- | :--- | :--- | :--- |
| **Corte 1** | **Sprint 1** | 2 Semanas | **Análisis y Diseño:** Levantamiento de requerimientos, definición de arquitectura y documentación base en GitHub. | Repositorio estructurado y carpeta `/docs` completa. |
| **Corte 2** | **Sprint 2** | 2 Semanas | **Infraestructura:** Modelado relacional en Supabase, servidor Backend en Python/FastAPI y rutas iniciales. | Base de datos desplegada y API REST base funcional. |
| | **Sprint 3** | 2 Semanas | **Interfaz y Usuarios:** Desarrollo Frontend en HTML/CSS/JS e integración del módulo de autenticación. | Módulo funcional de usuarios y secciones. |
| **Corte 3** | **Sprint 4** | 2 Semanas | **Integración de IA:** Conexión de Google Gemini API en Python, diseño de prompts por grado escolar y caché de tutorías. | Motor de generación de contenido explicativo operativo. |
| | **Sprint 5** | 2 Semanas | **Motor de Evaluación:** Cuestionarios interactivos, calificación automática e identificación de fallas conceptuales. | Módulo de tutoría adaptativa e interacción completa del alumno. |
| **Corte 4** | **Sprint 6** | 2 Semanas | **Analíticas y Diagnóstico:** Reportes para docentes con mapas de rendimiento grupal e historial de actividades. | Panel de analíticas para el profesor integrado. |
| | **Sprint 7** | 2 Semanas | **Pruebas y Cierre:** Pruebas integrales de rendimiento, corrección de errores, despliegue del sistema y documentación de pruebas. | MVP desplegado en la nube y registro visual en `06-evidencias.md`. |
