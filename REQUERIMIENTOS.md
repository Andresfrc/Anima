# Especificación de Requerimientos de Software — Aníma

> **Proyecto:** Aníma — Aplicación de Acompañamiento Emocional  
> **Versión:** 2.0  
> **Fecha:** Febrero 2026  
> **Plataformas objetivo:** Android, iOS

---

## 1. Introducción

### 1.1 Propósito
Este documento define los requerimientos funcionales y no funcionales del sistema Aníma, una aplicación móvil de acompañamiento emocional orientada a jóvenes universitarios (18–30 años). Sirve como referencia para desarrollo, pruebas y validación.

### 1.2 Alcance
Aníma ofrece herramientas de autorregulación emocional, psicoeducación y acompañamiento basadas en evidencia clínica. La aplicación **no reemplaza** la atención profesional de salud mental.

### 1.3 Definiciones
| Término | Definición |
|---|---|
| **Ruta emocional** | Perfil de acompañamiento personalizado basado en el estado emocional del usuario |
| **Actividad** | Herramienta interactiva de regulación emocional (respiración, escritura, etc.) |
| **Lumi** | Mascota virtual que acompaña al usuario en la experiencia |
| **Triage** | Cuestionario inicial que determina la ruta emocional recomendada |
| **SOS** | Intervención rápida de apoyo emocional accesible en cualquier momento |

---

## 2. Requerimientos Funcionales

### Autenticación y Gestión de Usuario

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-01 | Registro de usuario | El sistema debe permitir al usuario crear una cuenta mediante datos básicos (nombre, correo electrónico). |
| RF-02 | Inicio de sesión | El sistema debe permitir al usuario iniciar sesión con sus credenciales y validar su identidad. |
| RF-03 | Cierre de sesión | El sistema debe permitir al usuario cerrar sesión de forma segura, limpiando datos de sesión activa. |
| RF-04 | Edición de perfil | El usuario debe poder modificar su nombre y su foto de perfil desde la pantalla de perfil. |
| RF-05 | Selección de avatar | El sistema debe ofrecer un catálogo de avatares ilustrados organizados por categorías para que el usuario personalice su imagen de perfil. |

### Personalización Emocional

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-06 | Triage emocional | El sistema debe presentar un cuestionario emocional inicial que determine la ruta de acompañamiento más adecuada para el usuario. |
| RF-07 | Rutas emocionales | El sistema debe ofrecer múltiples rutas emocionales diferenciadas, cada una con contenido, actividades, estrategias y frases adaptadas al perfil del usuario. |
| RF-08 | Cambio de ruta | El usuario debe poder cambiar su ruta emocional activa en cualquier momento desde la configuración. |
| RF-09 | Contenido adaptativo | Las frases motivacionales, sugerencias, micro-retos y respuestas del chatbot deben ajustarse automáticamente según la ruta emocional activa. |

### Registro y Seguimiento Emocional

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-10 | Registro de estado de ánimo | El usuario debe poder registrar su estado emocional diario seleccionando entre diferentes niveles de ánimo. |
| RF-11 | Historial emocional | El sistema debe almacenar los registros emocionales del usuario y permitir su consulta. |
| RF-12 | Visualización de progreso | El sistema debe mostrar una representación gráfica del progreso emocional semanal del usuario. |

### Chatbot de Acompañamiento

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-13 | Interacción conversacional | El sistema debe permitir al usuario comunicarse con un chatbot empático mediante mensajes de texto. |
| RF-14 | Respuestas empáticas | El chatbot debe responder con lenguaje validante, calmado y adaptado a la ruta emocional del usuario. |
| RF-15 | Respuestas rápidas | El chatbot debe ofrecer opciones de respuesta rápida predefinidas para facilitar la interacción. |

### Actividades de Bienestar

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-16 | Catálogo de actividades | El sistema debe ofrecer un catálogo de actividades interactivas de regulación emocional accesibles desde una pantalla dedicada. |
| RF-17 | Actividades guiadas | Las actividades deben incluir instrucciones interactivas, retroalimentación visual y/o háptica durante su ejecución. |
| RF-18 | Actividades exclusivas | Ciertas actividades deben estar disponibles únicamente para la ruta emocional a la que pertenecen, informando al usuario si intenta acceder desde otra ruta. |
| RF-19 | Diario de gratitud | El sistema debe incluir una herramienta de diario positivo donde el usuario registre experiencias de gratitud con representación visual. |
| RF-20 | Registro de actividades completadas | El sistema debe registrar las actividades completadas por el usuario y mostrarlas como historial reciente. |

### Intervención en Crisis

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-21 | Botón SOS | El sistema debe incluir un botón de ayuda rápida accesible desde cualquier pantalla de la aplicación. |
| RF-22 | Intervención adaptativa | La intervención del botón SOS debe variar según la ruta emocional activa del usuario, ofreciendo la técnica más apropiada para su perfil. |

### Herramientas Complementarias

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-23 | Micro-retos | El sistema debe ofrecer retos breves y aleatorios adaptados a la ruta del usuario para fomentar la activación conductual. |
| RF-24 | Checklist de autocuidado | El sistema debe incluir un checklist interactivo de actividades de autocuidado contextualizado según la ruta emocional. |
| RF-25 | Sonidos ambientales | El sistema debe ofrecer reproducción de sonidos relajantes como herramienta complementaria de regulación emocional. |
| RF-26 | Restricción horaria | El sistema debe restringir el acceso a ciertas actividades en horarios nocturnos para fomentar la higiene del sueño (según ruta). |

### Pantalla Principal

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-27 | Saludo personalizado | El sistema debe mostrar un saludo dinámico según la hora del día y el nombre del usuario. |
| RF-28 | Afirmación diaria | El sistema debe mostrar una frase motivacional diaria adaptada a la ruta emocional del usuario, rotándola automáticamente. |
| RF-29 | Mascota acompañante | El sistema debe incluir un personaje mascota visual presente en las pantallas principales con variantes emocionales. |
| RF-30 | Indicador de progreso | El sistema debe mostrar un indicador visual del bienestar semanal basado en los registros del usuario. |

### Notificaciones y Comunicación

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-31 | Notificaciones locales | El sistema debe enviar notificaciones con recordatorios y mensajes motivacionales configurables por el usuario. |
| RF-32 | Control de notificaciones | El usuario debe poder activar o desactivar las notificaciones desde la configuración. |

### Navegación

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-33 | Navegación principal | El sistema debe permitir la navegación entre secciones principales mediante una barra de navegación inferior. |
| RF-34 | Avatar en navegación | El avatar del usuario debe reflejarse en las áreas principales de la aplicación para reforzar la identidad dentro de la experiencia. |

### Información y Soporte

| ID | Requerimiento | Descripción |
|---|---|---|
| RF-35 | Aviso clínico | El sistema debe mostrar un aviso accesible informando que la aplicación no reemplaza la atención profesional. |
| RF-36 | Información de privacidad | El sistema debe informar al usuario sobre cómo se manejan y protegen sus datos. |
| RF-37 | Invitación social | El sistema debe ofrecer una funcionalidad para invitar a otras personas a utilizar la aplicación. |
| RF-38 | Ayuda y soporte | El sistema debe proporcionar un canal de contacto para reportar problemas o solicitar ayuda. |

---

## 3. Requerimientos No Funcionales

### Seguridad y Privacidad

| ID | Requerimiento | Descripción |
|---|---|---|
| RNF-01 | Confidencialidad | La información emocional del usuario debe tratarse como datos sensibles con almacenamiento exclusivamente local en el dispositivo. |
| RNF-02 | Protección de datos | Los datos personales y emocionales deben almacenarse utilizando mecanismos de persistencia segura del sistema operativo. |
| RNF-03 | Acceso restringido | El sistema debe impedir accesos no autorizados a cuentas de usuario. |
| RNF-04 | No diagnóstico clínico | La aplicación no debe emitir diagnósticos psicológicos ni médicos bajo ninguna circunstancia. |
| RNF-05 | Derivación responsable | Ante señales de riesgo emocional, la aplicación debe priorizar la seguridad del usuario proporcionando información de contacto profesional. |

### Rendimiento

| ID | Requerimiento | Descripción |
|---|---|---|
| RNF-06 | Tiempo de respuesta | La aplicación debe responder a las interacciones del usuario en menos de 2 segundos bajo condiciones normales. |
| RNF-07 | Funcionamiento offline | Las funcionalidades principales deben operar sin conexión a internet. |
| RNF-08 | Rendimiento adaptativo | La calidad de animaciones y efectos visuales debe ajustarse automáticamente según las capacidades del dispositivo. |
| RNF-09 | Gestión de memoria | La aplicación debe implementar limpieza adecuada de procesos al desmontar pantallas para evitar fugas de memoria. |

### Usabilidad

| ID | Requerimiento | Descripción |
|---|---|---|
| RNF-10 | Interfaz intuitiva | La aplicación debe ser fácil de usar para personas sin conocimientos técnicos. |
| RNF-11 | Diseño visual calmado | La interfaz debe utilizar paletas de colores suaves, tipografía profesional y elementos visuales tranquilizadores. |
| RNF-12 | Modo visual dual | La aplicación debe ofrecer un modo oscuro y un modo claro intercambiables por el usuario. |
| RNF-13 | Transiciones fluidas | La aplicación debe implementar transiciones animadas entre pantallas para una experiencia de navegación coherente. |
| RNF-14 | Tipografía profesional | Todos los elementos de texto deben utilizar una fuente tipográfica profesional y consistente. |
| RNF-15 | Iconografía consistente | La aplicación debe utilizar iconos vectoriales profesionales en todas las plataformas. |

### Accesibilidad e Inclusión

| ID | Requerimiento | Descripción |
|---|---|---|
| RNF-16 | Accesibilidad visual | La aplicación debe garantizar contrastes legibles y tamaños de fuente adecuados para usuarios con dificultades visuales leves. |
| RNF-17 | Lenguaje inclusivo | Todo el contenido debe utilizar lenguaje respetuoso, empático y no discriminatorio. |
| RNF-18 | Representación diversa | Los elementos visuales de personalización deben representar diversidad étnica, de género y de estilos. |

### Calidad y Mantenibilidad

| ID | Requerimiento | Descripción |
|---|---|---|
| RNF-19 | Compatibilidad multiplataforma | La aplicación debe funcionar correctamente en dispositivos Android e iOS. |
| RNF-20 | Escalabilidad | La arquitectura debe permitir la incorporación futura de nuevas funcionalidades sin reestructuración significativa. |
| RNF-21 | Modularidad | El código debe estar organizado en componentes reutilizables con estado centralizado y tipado estricto. |
| RNF-22 | Tipado seguro | Todo el código fuente debe pasar validación de tipado estricto sin errores. |



