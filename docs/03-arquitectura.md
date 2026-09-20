# Descripción de la Arquitectura

## 1. Estilo Arquitectónico

Para el diseño y construcción de la plataforma se seleccionó el estilo arquitectónico de **Monolito Modular**. Esta decisión responde a la necesidad de mantener un sistema altamente mantenible, desacoplado y fácil de desplegar dentro de un único repositorio de código.

A diferencia de un monolito convencional de capas planas, la aplicación organiza su lógica de negocio en módulos funcionales independientes centrados en el dominio del problema. Cada módulo gestiona sus propias reglas de negocio y expone interfaces claras para comunicarse con el resto del sistema. De esta manera, componentes como el motor de evaluación por competencias, el orquestador de IA o el generador de analíticas institucionales operan de forma aislada, facilitando el mantenimiento y la evolución del código por parte del equipo de desarrollo.

---

## 2. Diagrama de Arquitectura del Sistema

La arquitectura de la solución se organiza en tres capas principales: la capa de presentación en el cliente web, el servidor de aplicación monolítico modular desarrollado en Python con FastAPI, y la capa de persistencia y servicios externos respaldada por Supabase y la API de Google Gemini.

```mermaid
graph TD
    subgraph Capa_Presentacion ["Capa de Presentación (Frontend)"]
        UI ["Interfaz Web Adaptativa (HTML5 / CSS3 / JS)"]
    end

    UI -->|Peticiones HTTPS / JSON| Router

    subgraph Monolito_Modular ["Servidor Principal (Monolito Modular en Python / FastAPI)"]
        Router ["Enrutador de Peticiones HTTP / REST"]
        
        subgraph Modulos_Dominio ["Módulos de Dominio (Desacoplados)"]
            M_Auth ["Módulo de Autenticación y Perfiles"]
            M_Comp ["Módulo de Competencias e Instituciones"]
            M_Eval ["Módulo de Evaluación (Libre y Simulacro)"]
            M_AI ["Módulo Orquestador de IA (Gemini API)"]
            M_Metrics ["Módulo de Analíticas e Historial"]
        end

        Router --> M_Auth
        Router --> M_Comp
        Router --> M_Eval
        Router --> M_AI
        Router --> M_Metrics
    end

    subgraph Servicios_Persistencia ["Servicios Externos y Persistencia"]
        DB [("Supabase: PostgreSQL & Auth")]
        Gemini ["Google Gemini API (Tutoría de Descarte)"]
    end

    M_Auth -->|Validación de Tokens| DB
    M_Comp -->|Consulta Estructura ICFES| DB
    M_Eval -->|Banco de Preguntas y Respuestas| DB
    M_Metrics -->|Lectura/Escritura de Métricas| DB
    M_AI -->|Guarda / Consulta Caché de Tutorías| DB
    M_AI -->|Prompts Estructurados| Gemini
```

---

## 3. Descripción de los Módulos de Dominio

### Módulo de Autenticación y Control de Acceso
Gestiona la identidad de los usuarios, diferenciando los permisos y vistas entre el rol de **Docente** y el rol de **Estudiante**. Se integra directamente con el servicio de seguridad de Supabase Auth para el manejo de sesiones mediante tokens seguros.

### Módulo de Cursos y Secciones
Resuelve la variabilidad del entorno escolar permitiendo la administración independiente de aulas. Permite la clonación de talleres entre secciones y el control de disponibilidad de las actividades según el avance real de cada grupo.

### Módulo de Evaluación y Cuestionarios
Encargado de la estructura de las evaluaciones, el registro de opciones de respuesta y la calificación automática en el servidor al momento en que un alumno envía su intento.

### Módulo Adaptativo de IA (Orquestador de Prompts)
Actúa como la capa de inteligencia del sistema construida en Python. Cuando el módulo de evaluación detecta fallas conceptuales en la entrega de un estudiante, este módulo empaqueta el contexto académico (grado, tema y tipo de error) y consulta la API de Google Gemini para obtener una tutoría explicativa. Implementa un mecanismo de almacenamiento en caché en la base de datos para reutilizar explicaciones frente a errores idénticos.

### Módulo de Analíticas
Agrupa y procesa las calificaciones e intentos de los estudiantes para construir visualizaciones consolidadas ("mapas de calor") que sirven como insumo diagnóstico para el docente en su aula presencial.

---

## 4. Componentes Tecnológicos e Infraestructura

* **Frontend:** Cliente web interactivo basado en HTML5, CSS3 y JavaScript, optimizado para bajo consumo de datos en redes escolares.
* **Backend:** Servidor en **Python** estructurado con el framework **FastAPI**, organizado bajo el patrón de carpetas por módulo (`src/modules/...`).
* **Base de Datos y Persistencia:** Supabase (PostgreSQL relacional) con esquemas definidos para el almacenamiento de usuarios, secciones, cuestionarios, intentos y respuestas de caché.
* **Proveedor de IA:** Google Gemini API (modelo Gemini 1.5 Flash integrado mediante la librería oficial `google-genai` en Python), seleccionado por su baja latencia y alta precisión pedagógica.
