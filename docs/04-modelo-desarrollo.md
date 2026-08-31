# Modelo de Desarrollo y Metodología de Trabajo

**Asignatura:** Ingeniería de Software II  
**Profesor:** Julián Prado (`jprado399@uan.edu.co`)  
**Universidad:** Universidad Antonio Nariño – Sede Sur, Bogotá  
**Periodo:** 2026-2  

---

## 1. Justificación

Para la construcción de la plataforma se adopta el **Modelo Incremental e Iterativo**, soportado por el marco de trabajo **Scrum Adaptado**.

### Definición del Modelo
* **Enfoque Incremental:** El sistema se divide en módulos funcionales que añaden valor de forma progresiva: Autenticación, Motor de Cuestionarios, Integración con IA Gemini y Analíticas de Rendimiento.
* **Enfoque Iterativo:** El equipo realiza iteraciones de revisión interna durante las semanas de desarrollo para probar, ajustar y pulir las interfaces, la lógica y las respuestas de la IA antes de cada entrega oficial.

---

## 2. Marco de Trabajo

Scrum se adapta para alinear el trabajo interno con las entregas de los cuatro cortes académicos.

### 2.1 Roles del Equipo
* **Product Owner:** Prof. Julián Prado.
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
