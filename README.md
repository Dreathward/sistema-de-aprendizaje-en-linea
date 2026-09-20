# Sistema de Aprendizaje en Línea con IA Adaptativa

**Asignatura:** Ingeniería de Software II  
**Profesor:** Julián Prado (`jprado399@uan.edu.co`)  
**Universidad:** Universidad Antonio Nariño – Sede Sur, Bogotá  
**Periodo:** 2026-2  

---

## Integrantes del Equipo y Responsabilidades

* **Jhon Alexander Pérez Llerena:** Scrum Master & Lead Frontend (HTML5, CSS3, JavaScript).
* **Jeison Steven Niño Rojas:** Core Backend & IA Engineer (Python, FastAPI, Google Gemini API).
* **Samuel Thomas Monroy Pérez:** Core Backend & IA Engineer (Python, FastAPI, Google Gemini API).
* **Andrés Felipe Páez Díaz:** Database & Infrastructure Lead (Supabase, PostgreSQL).

---

## Descripción General

Plataforma web de entrenamiento adaptativo para la preparación de las **Pruebas Saber (ICFES)** en educación secundaria, orientada al desarrollo de competencias mediante la **lógica de descarte**. 

El sistema integra la **API de Google Gemini** para actuar como un tutor inteligente que analiza los distractores seleccionados por el estudiante en el modo *Entrenamiento Libre*, guiándolo hacia el razonamiento correcto sin entregarle la respuesta directa. Asimismo, cuenta con un modo de *Simulacro Real* temporizado y un módulo de analíticas institucionales para el seguimiento docente.

---

## Stack Tecnológico

* **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript Vanilla.
* **Backend:** Python con FastAPI (API REST).
* **Base de Datos:** PostgreSQL administrado en Supabase (Auth & Database).
* **Servicio de IA:** API de Google Gemini (SDK oficial en Python) con sistema de caché de respuestas en base de datos.

---

## Estructura del Proyecto y Documentación

Toda la documentación técnica del proyecto se encuentra organizada en el directorio `/docs`:

1. [Presentación del Proyecto](./docs/01-presentacion-primera-propuesta.md): Descripción general, objetivos, problemática y alcance de la plataforma.
2. [Lógica del Proyecto](./docs/02-logica-y-procesos.md): Procesos del sistema, modos de evaluación y estrategia de tutoría por descarte.
3. [Arquitectura del Sistema](./docs/03-arquitectura.md): Estilo Monolito Modular, diagrama general de componentes en Mermaid y modelos de datos.
4. [Modelo de Desarrollo](./docs/04-modelo-desarrollo.md): Metodología de trabajo (Scrum Adaptado), roles y cronograma por Sprints y Cortes.
5. [Historias de Usuario](./docs/05-historias-usuario.md): Backlog modular de requerimientos funcionales y criterios de aceptación.
6. [Evidencias de Funcionamiento](./docs/06-evidencias/): Capturas y demostraciones del avance del sistema por corte académico.
