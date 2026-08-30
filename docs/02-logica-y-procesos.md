# Lógica del Proyecto y Procesos Principales

## 1. Propósito e Intención General
El **Sistema de Aprendizaje en Línea con IA Adaptativa** es una plataforma de apoyo y refuerzo académico diseñada para estudiantes de educación básica y media (grados 6° a 11°). 

A diferencia de un Sistema de Gestión de Aprendizaje (LMS) tradicional como Moodle —cuya función es la administración de contenidos y calificaciones sumativas oficiales—, este sistema actúa como un **entorno de tutoría formativa y remediación**. Su objetivo no es calificar punitivamente, sino diagnosticar en tiempo real los vacíos de conocimiento que surgen durante el proceso de aprendizaje y ofrecer explicaciones de refuerzo personalizadas de manera inmediata.

El sistema funciona de forma **transversal al aula presencial**: el docente dicta su clase, asigna actividades de verificación en la plataforma y utiliza las analíticas generadas para retroalimentar sus clases presenciales según las falencias detectadas.

---

## 2. Flujo Principal de Procesos (El Ciclo de Aprendizaje)

```mermaid
sequenceDiagram
    autonumber
    actor Docente
    actor Estudiante
    participant UI as Cliente Web (Frontend)
    participant Server as Backend (Node.js/Express)
    participant IA as Google Gemini API
    participant DB as Supabase (PostgreSQL)

    Docente->>UI: 1. Selecciona tema y sección (ej. 6-1)
    UI->>IA: 2. Solicita borrador de cuestionario
    IA-->>UI: 3. Retorna propuesta de preguntas
    Docente->>UI: 4. Revisa, aprueba y publica el taller
    UI->>DB: 5. Almacena taller asociado a la sección
    
    Estudiante->>UI: 6. Resuelve el cuestionario desde casa
    UI->>Server: 7. Envía respuestas del estudiante
    Server->>Server: 8. Evalúa respuestas e identifica errores específicos
    
    alt Si el estudiante presenta vacíos conceptuales
        Server->>IA: 9. Envía prompt con fallas + grado del alumno
        IA-->>Server: 10. Genera tutoría de refuerzo personalizada
        Server->>DB: 11. Guarda historial de intentos y caché de tutoría
        Server-->>UI: 12. Despliega retroalimentación pedagógica en tiempo real
    else Si aprueba sin fallas
        Server->>DB: 13. Registra avance positivo
        Server-->>UI: 14. Confirma dominio del tema
    end

    Server->>DB: 15. Actualiza mapa de calor del grupo
    Docente->>UI: 16. Consulta analíticas para preparar la siguiente clase presencial
