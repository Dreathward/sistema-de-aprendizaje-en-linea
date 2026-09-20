# Modelo de Desarrollo y Metodología de Trabajo

---

## 1. Justificación

Para la construcción de la plataforma se adopta el **Modelo Incremental e Iterativo**, soportado operativamente por un marco de trabajo **Scrum Adaptado**. Esta combinación metodológica permite abordar la complejidad del software dividiendo el proyecto en entregables funcionales de valor inmediato, al tiempo que facilita la incorporación continua de retroalimentación pedagógica y técnica sin interrumpir el avance general del desarrollo.

El **enfoque incremental** estructura la construcción del sistema en módulos independientes que se añaden de forma progresiva a la arquitectura. La plataforma evoluciona a través de la integración de capas clave: la gestión de autenticación y perfiles, el catálogo estructurado de competencias del ICFES, el motor de evaluación para los modos de Entrenamiento Libre y Simulacro Real, el orquestador de tutorías por lógica de descarte con la API de Google Gemini y, finalmente, el módulo de analíticas e historial institucional. Cada incremento entrega una versión utilizable que amplía la funcionalidad del producto.

Por su parte, el **enfoque iterativo** garantiza la revisión y perfeccionamiento constante de los componentes construidos. A lo largo de los ciclos de trabajo, el equipo prueba, ajusta y pule la fluidez de las interfaces de usuario, la precisión en los tiempos de respuesta del backend en FastAPI, la calidad pedagógica de las explicaciones generadas por la inteligencia artificial y la estabilidad de las conexiones con Supabase. Esta dinámica iterativa asegura que cada funcionalidad no solo se despliegue, sino que se optimice técnicamente antes de su validación final.

---

## 2. Marco de Trabajo

El marco de trabajo Scrum se adapta para alinear la dinámica interna del equipo de desarrollo con las entregas formales programadas a lo largo de los cortes académicos de la universidad.

### 2.1 Roles del Equipo
* **Product Owner:** Julián Prado.
* **Scrum Master & Lead Frontend:** Jhon Alexander Pérez Llerena.
* **Core Backend & IA Engineers:** Jeison Steven Niño Rojas y Samuel Thomas Monroy Pérez.
* **Database & Infrastructure Lead:** Andrés Felipe Páez Díaz.

### 2.2 Artefactos del Sistema
* **Product Backlog:** Listado general de historias de usuario y requerimientos técnicos consignados en `/docs/05-historias-usuario.md`, priorizados según la arquitectura por competencias del ICFES.
* **Sprint Backlog:** Conjunto de tareas específicas e historias de usuario seleccionadas por el equipo para ser desarrolladas dentro de un ciclo de trabajo determinado (2 a 3 semanas).
* **Incremento Entregable:** Versión funcional del software o cuerpo de documentación técnica presentado de forma acumulativa al cierre de cada corte académico.

---

## 3. Planificación

El ciclo de desarrollo se estructura en **7 Sprints de 2 semanas de duración cada uno**, distribuidos estratégicamente a lo largo de los **4 Cortes Evaluativos** de la universidad para asegurar un avance constante y entregas incrementales funcionales:

| Corte Académico | Sprint | Duración Estimada | Alcance y Tareas Principales | Entregable del Sprint / Corte |
| :--- | :--- | :--- | :--- | :--- |
| **Corte 1** | **Sprint 1** | 2 Semanas | Levantamiento de requerimientos, definición de la arquitectura modular y documentación base en el repositorio GitHub. | Repositorio estructurado y directorio `/docs` completo. |
| **Corte 2** | **Sprint 2** | 2 Semanas | Modelado de base de datos relacional en Supabase con matrices del ICFES, servidor FastAPI en Python y rutas base REST. | Base de datos desplegada y API REST inicial funcional. |
| | **Sprint 3** | 2 Semanas | Desarrollo del cliente web en HTML/CSS/JS, gestión de roles (Estudiante/Institución) y módulo de autenticación segura. | Módulo funcional de usuarios y perfiles. |
| **Corte 3** | **Sprint 4** | 2 Semanas | Conexión de Google Gemini API en Python, diseño de prompts por descarte pedagógico y tabla de caché para tutorías. | Motor explicativo de tutoría adaptativa operativo. |
| | **Sprint 5** | 2 Semanas | Lógica de preguntas aleatorias para Modo Entrenamiento Libre (inmediato) y Modo Simulacro Real (temporizado con informe final). | Módulo de evaluaciones por competencias integrado. |
| **Corte 4** | **Sprint 6** | 2 Semanas | Reportes para docentes y colegios con mapas de calor grupales por competencia e historial del estudiante. | Panel de analíticas e indicadores institucionales. |
| | **Sprint 7** | 2 Semanas | Pruebas integrales de rendimiento, optimización de caché, corrección de errores, despliegue final y evidencias de funcionamiento. | MVP desplegado en la nube y registro visual en `/docs/06-evidencias`. |
