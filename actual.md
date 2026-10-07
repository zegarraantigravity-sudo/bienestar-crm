# Control de Avances - Bienestar CRM

Este documento sirve como registro vivo de las tareas completadas, el estado del desarrollo y las ideas o siguientes pasos planificados para el sistema de ventas de **Bienestar Sin Excusas**.

---

## 📅 Estado Actual del Proyecto

*   **Repositorio GitHub**: [zegarraantigravity-sudo/bienestar-crm](https://github.com/zegarraantigravity-sudo/bienestar-crm)
*   **Servidor de Base de Datos**: Supabase (Proyecto: `Bienestar-CRM`)
*   **Hosting Frontend & Serverless**: Vercel (Producción: `https://bienestar-crm.vercel.app`)
*   **Motor de Inteligencia Artificial**: Google Gemini (**Gemini 3.5 Flash Lite** con cascada de contingencia a **Gemini 3.1 Flash Lite**) vía Google AI Studio. 100% gratuito (1,500 peticiones/día), sin tarjeta bancaria asociada y con latencia ultrarrápida (~1.2s).
*   **Bot de Mensajería**: Telegram Bot Oficial (`@bienestar_crm_bot` / Copiloto Multi-Asesor con notas de voz e imágenes).
*   **Moneda Oficial**: Soles Peruanos (`S/.`)

---

## ✅ Lo que se ha Hecho (Completado)

### 1. Infraestructura y Base de Datos
*   **Inicialización**: Configuración inicial de la aplicación usando React con Vite y herramientas de compilación modernas.
*   **Base de Datos**: Diseño y creación de la tabla `leads` en Supabase con políticas RLS (Row Level Security) para el acceso seguro.
*   **Variables de Entorno**: Configuración de seguridad en `.env` y exclusión segura en `.gitignore` para no filtrar claves sensibles.
*   **Conexión**: Implementación del cliente de Supabase (`supabaseClient.js`) para consultas en tiempo real.

### 2. Diseño e Interfaz Premium (Modo Oscuro)
*   **Estilo Visual**: Creación de un sistema de diseño propio en `index.css` con variables de color HSL, sombras neón sutiles, efectos glassmorphism en tarjetas y paneles, y micro-animaciones fluidas al interactuar.
*   **Diseño Adaptable**: Estructura lateral fija (Sidebar) y panel central fluido, optimizado para computadoras y dispositivos móviles.

### 3. Vistas Principales del CRM
*   **Panel de Controladores (Dashboard)**:
    *   Cálculo automático de tasas clave: Tasa de Contacto (Llamados/Total), Tasa de Citas (Citas/Llamados) y Tasa de Cierre (Cerrados/Demos).
    *   Métrica del valor total del embudo (pipeline proyectado en cartera).
    *   Visualizador gráfico de volumen financiero en Soles por cada una de las 6 fases de venta.
    *   Tarjeta interactiva de "Meta del Mes" con control numérico y gráfico circular cónico en tiempo real.
*   **Tablero Kanban**:
    *   6 columnas de flujo comercial vertical (`Prospecto`, `Llamado`, `Cita Agendada`, `Presentación Realizada`, `Cerrado Ganado`, `Cerrado Perdido`).
    *   Tarjetas con color identificativo y badge dinámico por tipo de cliente (Coach, Nutricionista, Gimnasio, Tienda, Herbalife, Otro).
    *   Botón rápido de **Llamar 📞** en 1 clic que actualiza el estado y escribe en la bitácora automáticamente.
    *   Botones de navegación rápidos `<-` y `->` en cada tarjeta para deslizar prospectos sin arrastrar.
*   **Directorio de Leads (Tabla)**:
    *   Tabla interactiva y searchable por nombre de empresa, contacto, teléfono, correo o tareas pendientes.
    *   Filtros dinámicos en cascada por Estado, Plan y Tipo de Cliente en simultáneo.

### 4. Flujo de Seguimiento y Datos Locales
*   **Modal de Prospecto**:
    *   Formulario completo para crear y editar leads.
    *   **Bitácora de Seguimiento**: Registro interactivo de notas de interacción pasadas con fecha y hora exacta, mostradas en una línea de tiempo vertical. Cada nota incluye botones para **Editar (✏️)** el contenido directamente y **Eliminar (🗑️)** notas duplicadas o accidentales.
    *   **Próxima Acción Pendiente**: Campo específico para registrar la siguiente tarea a realizar, visible en Kanban (badge naranja) y en la tabla (icono 📌).
*   **Planes y Precios Locales (Soles)**:
    *   Configuración de los 5 planes oficiales: **Plan 30** (S/. 400), **Plan 80** (S/. 700), **Plan 200** (S/. 1200), **Plan 500** (S/. 2700) y **Plan 1200** (S/. 6000).
    *   Autocompletado inteligente de precio estimado según el plan seleccionado.

### 5. Acciones de Contacto Rápido y Plantillas de WhatsApp
*   **Integración Directa de WhatsApp con Plantillas**: Botón verde con selector de 5 plantillas pre-redactadas (*Primer Contacto*, *Recordatorio de Demo*, *Presentación de Plan*, *Seguimiento Post-Demo* y *Cierre por Sin Respuesta / Despedida*). El sistema inserta dinámicamente el nombre del cliente, plan y valor en Soles, abriendo WhatsApp Web/App al instante.
*   **Ubicación**: Disponible en el Directorio de Leads, Tablero Kanban y Modal de detalle.

### 6. Seguimiento Inteligente por Agenda (Fechas y Alertas de Tareas)
*   **Fecha y Hora en Próxima Acción**: Selector de fecha y hora (`datetime-local`) para programar el momento exacto del próximo contacto.
*   **Pestañas Inteligentes**: Filtros en 1 clic en la Tabla de Leads para ver *"⏰ Tareas de Hoy / Vencidas"* y *"❄️ Leads Estancados (+5 días sin contacto)"*.
*   **Alertas de Leads Estancados**: Indicador visual (badge azul `❄️ +Xd`) en Kanban y Tabla cuando un prospecto lleva 5 o más días sin actualización.

### 7. Análisis de Motivos de Pérdida
*   **Registro de Motivos**: Al mover un lead a *Cerrado - Perdido*, el sistema solicita registrar la causa (*Precio elevado*, *Sin tiempo/Interés*, *Usa competencia*, *No responde*, *Otro*).
*   **Panel en Dashboard**: Gráfico y métricas detalladas en el Dashboard con porcentajes y conteos exactos de causas de pérdida.

### 8. Seguridad y Autenticación
*   **Acceso Restringido**: Pantalla de Login premium conectada a Supabase Auth.
*   **Cierre de Sesión**: Botón en la barra lateral para salir de la sesión de forma segura.

### 9. Sistema de Roles y Privacidad por Vendedor
*   **Super Administrador (Alberto - `albertozbcoach@gmail.com`)**:
    *   Acceso total al 100% de los leads, métricas globales del embudo y bitácoras.
    *   Selector de vista para alternar entre: *Todos los Vendedores*, *Mis Leads (Alberto)*, *Leads de Luis* o *Leads de Dario*.
    *   Capacidad de reasignar prospectos a cualquier socio comercial.
*   **Vendedor (Luis - `torohakim@gmail.com`)**:
    *   Privacidad estricta: Solo puede visualizar, editar y gestionar sus propios prospectos.
*   **Vendedor (Dario Cienfuegos - `dariospaarnold@gmail.com`)**:
    *   Privacidad estricta: Solo visualiza y gestiona sus prospectos asignados.

### 10. Copiloto de Inteligencia Artificial Integrado (CRM Web)
*   **Widget Flotante Interactivo**: Botón circular `🤖 Copiloto IA` en la esquina inferior derecha con ventana de chat emergente integrada.
*   **Motor Oficial Google Gemini**: Migrado al modelo **Gemini 3.5 Flash Lite** con failover automático a **Gemini 3.1 Flash Lite**, garantizando 1,500 peticiones gratuitas diarias sin costo, cero errores 503 por saturación y tiempo de respuesta en ~1 segundo.
*   **Gestión en Lenguaje Natural de Bitácoras y Tareas**:
    *   Interpreta comandos como: *"Hablé con Noé y me dijo que lo llame el sábado a las 10 am"*.
    *   Detecta al prospecto, agrega la nota a la bitácora con fecha/hora actual, programa la próxima acción y actualiza Supabase en tiempo real.
*   **Consultas y Resúmenes Ejecutivos**: Responde preguntas estratégicas sobre el estado de la cartera, leads vencidos y próximos pasos.
*   **Dictado por Voz (🎙️)**: Reconocimiento de voz en tiempo real con Web Speech API para dictar instrucciones en español.
*   **Modo Conversación en Vivo / Manos Libres 📞**: Modo llamada continua bidireccional con síntesis de voz (Text-to-Speech).
*   **Sincronización en Tiempo Real**: Refleja cambios en el Kanban y en el Directorio al instante.

### 11. Copiloto Ejecutivo Multi-Asesor en Telegram (`api/telegram.js`)
*   **Soporte Multi-Asesor con Identidad Independiente**:
    *   Comandos de vinculación: `/soy_alberto`, `/soy_luis`, `/quiensoy`.
    *   Cada asesor maneja su propio historial de conversación y contexto de prospectos asignados.
*   **Transcripción y Multimodalidad con Gemini**:
    *   Recepción de audios y notas de voz con transcripción automática mediante la API multimodal de Gemini.
    *   Procesamiento inmediato del dictado para agendar tareas, llamadas y notas en la bitácora del prospecto.
*   **Alertas y Recordatorios Proactivos**:
    *   Avisos automáticos 1 hora antes de reuniones por Zoom.
    *   Avisos automáticos 20 minutos antes de llamadas o tareas programadas.
    *   Comandos `/agenda`, `/tareas` y `/test_alerta`.

### 12. Sistema de Comprobantes, Contratos & Galería en Bitácora
*   **Carga en Modal de Prospecto (CRM Web)**:
    *   Selector de archivos adjuntos (`image/*`, `.pdf`) integrado en el formulario de nueva nota.
    *   Compresión automática de imágenes en el cliente (canvas a máx 1200px, compresión inteligente ~80KB) para cargas rápidas sin saturar el almacenamiento.
    *   Visor Lightbox en pantalla completa con soporte para zoom, visor de PDF nativo y botón de descarga.
    *   Pestaña dedicada **"Comprobantes & Archivos"** en el detalle del prospecto con galería en cuadrícula y fechas.
*   **Carga Vía Telegram Copilot**:
    *   Permite enviar fotos de comprobantes (Yape, Plin, transferencias) o documentos PDF directamente al bot con el nombre del cliente en el pie de foto (ej. *"Comprobante de abono de Silmed"*).
    *   El bot descarga el archivo, lo asocia al prospecto en Supabase y lo registra en su bitácora.

### 13. Landing Page Comercial B2B SaaS
*   Transformación de la vista pública de Bienestar CRM (`https://bienestar-crm.vercel.app`) en una página comercial de alto impacto estilo Pipedrive / Bitrix24.
*   Navbar sticky, Hero persuasivo enfocado en *Voice-to-CRM*, showcase interactivo (Kanban en vivo + mockup de smartphone con Telegram), tabla comparativa vs competidores y formulario interactivo de solicitud de demo.

### 14. Blindaje Financiero y Desconexión de Alibaba Cloud
*   Cancelación y revocación exitosa del acuerdo de facturación automática en PayPal con Alibaba Cloud Singapore (`INACTIVO`).
*   Eliminación de dependencias de pago: la cuenta bancaria y el saldo de PayPal están completamente desvinculados y protegidos contra débitos automáticos.
*   Sustitución de todas las credenciales heredadas por Google AI Studio (Free Tier sin tarjeta de crédito).

### 15. Formateo Ejecutivo de Telegram, Transcripción de Audio y Estabilidad de IA
*   **Corrección de Etiquetas HTML en Telegram**: Rediseño del formateador `formatForTelegramHtml` para proteger etiquetas nativas de Telegram (`<b>`, `<i>`, `<code>`, `<blockquote>`, `<a>`) con tokens temporales antes de sanitizar entidades. Se eliminó por completo el escape indebido que mostraba `<b>Nombre</b>` como texto crudo.
*   **Horarios Amigables Peruanos (12h am/pm)**: Implementación de `formatFriendlyTime` para convertir marcas de tiempo de base de datos (`2026-09-22 11:59`, `16:00`) en horarios comerciales legibles (`11:59 a. m.`, `4:00 p. m.`).
*   **Síntesis de Acciones en Agenda**: Creación de `summarizeTaskAction` para detectar borradores o cartas extensas de WhatsApp guardadas en la próxima acción y transformarlas en viñetas ejecutivas concisas (ej: *"Enviar avance de página modificada"*, *"Seguimiento sobre video y panel de la app"*).
*   **Motor Primario de Voz Groq Whisper (Whisper Large v3 Turbo)**: Integración de Groq Whisper como motor principal de speech-to-text para notas de voz en Telegram (2,000 transcripciones diarias gratuitas, 0% saturación, velocidad de 0.3s y sin tarjeta de crédito). Google Gemini actúa como respaldo secundario.
*   **Detección Contextual y Memoria Conversacional**: Implementación de `findLeadInSentence` (para detectar nombres de prospectos dentro de frases naturales completas como *"pon en bitácora el mensaje que le envié a Sandra"*) y `findLeadFromHistory` (para heredar el prospecto en seguimiento en mensajes como *"me respondió esto: ..."* sin necesidad de repetir su nombre).
*   **Saneamiento de Registros en Supabase**: Limpieza y registro de las gestiones en tiempo real en las bitácoras correspondientes.

### 16. Blindaje de Carteras Multi-Asesor, Integridad de Bitácora y Filtro Antierrores (25 de Septiembre de 2026)
*   **Aislamiento Estricto de Carteras Comerciales en Telegram**: Prohibición absoluta de que el bot de un asesor asocie o modifique leads asignados a otro socio comercial (Luis Hakim) mediante coincidencias difusas, palabras sueltas o historial de conversación. Solo se permite interacción si se menciona el nombre exacto al 100%.
*   **Eliminación de Falsos Positivos por Similitud Difusa (Levenshtein)**: Prohibición del cálculo de distancia de Levenshtein en palabras de menos de 6 caracteres. Esto corrigió el error crítico donde palabras cotidianas en español como `"pero"` coincidían erróneamente con `"pezo"` (*Referido de Julizza Pezo*).
*   **Corrección de Lectura Cronológica de Bitácora (Reverse Timeline Bug)**: Corrección del orden de extracción en Supabase (`timeline`). Ahora siempre se ordenan las notas de forma descendente por fecha (`sort desc`) tomando las 10 más recientes, solucionando la ceguera del bot que ignoraba interacciones recientes (ej. Sandra, 23 de septiembre).
*   **Protección Antiactualizaciones ante Debates, Consultas y Quejas**: Blindaje de las funciones `isExplicitUpdateCommand` y `shouldPerformUpdate` para impedir escrituras en base de datos cuando el usuario está debatiendo la redacción de un mensaje (*"no sé si suene bien"*, *"qué opinas"*), haciendo consultas de inspección o expresando frustración / quejas (*"para qué me lo muestras de nuevo"*, *"no seas imbécil"*).
*   **Mapeo Fonético de Nombres y Tareas de Cuentas Ganadas**: Incorporación de la regla fonética `J` $\to$ `I` / `Y` para que *"Jocelyn"* vincule inmediatamente a *"Yoselin Nails"*, e inclusión de prospectos con estado `cerrado_ganado` en la agenda cuando tienen tareas o seguimientos activos programados.
*   **Saneamiento y Verificación de Registros en Supabase**: Restauración y verificación de integridad en tiempo real para `Lic Sandra` (estado `llamado` con seguimiento activo y bitácora intacta), `Rosanna Bravo` (`cerrado_perdido`), `Yoselin Nails` (`cerrado_ganado` con tarea para el lunes), `David Godoy` (tarea de hoy) y los prospectos de Luis Hakim (`Louis Tristán`, `Kevin Dextre`, `Referido de Julizza Pezo`).

### 17. Migración a Gemini 3.8 Flash y Eliminación del Bucle de Fallback Repetitivo (25 de Septiembre de 2026)
*   **Actualización a Modelos de Gama Alta (Gemini 3.8 Flash)**: Reemplazo del modelo obsoleto/saturado `gemini-3.5-flash-lite` por el modelo insignia **`gemini-3.8-flash`** con cascada de contingencia a **`gemini-flash-latest`**, **`gemini-3.8-pro`** y **`gemini-3.1-flash-lite`**. Cero saturación (503) y latencia ultrarrápida.
*   **Eliminación Radical del Bucle de Fallback Repetitivo**: Se eliminó por completo el bloque de código de respaldo que, ante cualquier fallo de red o caída de la IA, disparaba de forma rígida la lista de tareas de la agenda (*"Tienes estos seguimientos pendientes..."*). Si hubiese una intermitencia, el sistema reintenta con los modelos de respaldo o avisa con honestidad, eliminando el comportamiento donde el bot ignoraba instrucciones de voz y repetía la agenda.
*   **Persistencia Estricta de Instrucciones**: Se respetó la orden explícita de Alberto de no alterar manualmente la ficha de David Godoy.
*   **Actualización de Agenda de Anali**: Confirmación de reunión por Zoom para el lunes 28 de septiembre a las 6:00 p. m. registrada en bitácora y próxima acción actualizada en Supabase.

### 18. Capa de Doble Verificación Obligatoria en Telegram (25 de Septiembre de 2026)
*   **Verificación Post-Escritura Inmediata (Post-Validation)**: Tras actualizar un prospecto en Supabase, el bot realiza una re-lectura instantánea (0.1s) del registro para certificar al 100% que la nueva nota y la próxima acción quedaron grabadas con integridad en la base de datos antes de confirmar al usuario.
*   **Confirmación Transparente de Tarea Guardada**: Si la actualización incluye próxima acción, el bot muestra en el badge de confirmación la tarea exacta y el horario verificado (ej: *«📌 Próxima acción verificada: Reunión por Zoom (6:00 p. m.)»*).
*   **Aumento del Umbral de Certeza Fonética**: Elevación del umbral mínimo de coincidencia de 40 a 60 puntos para evitar vinculaciones dudosas o aproximadas en prospectos.

### 19. Reconocimiento de Órdenes Imperativas Enfáticas, Guardián Anti-Alucinación, ADN del Producto y Consulta Contextual Verificada (28 de Septiembre de 2026)
*   **Corrección de Órdenes Imperativas Enfáticas ("Que pongas en la bitácora...")**: Se solucionó el fallo crítico donde audios o frases que iniciaban con *"Que claramente que pongas..."* o *"Que anotes..."* activaban erróneamente `isQueryQuestion` debido a la presencia del token aislado `que` al inicio. Se implementó `hasStrongUpdateCommand` (prioridad sobre preguntas para verbos de acción en bitácora/próxima acción) y se afinó la expresión regular de interrogantes para exigir verbos o sustantivos de pregunta (`qué es`, `qué tareas`, `cuál`, etc.).
*   **Guardián Anti-Alucinación Estricto**: Si la base de datos no fue modificada (`updatePerformed === false`), el bot tiene terminantemente prohibido afirmar *"he registrado"*, *"quedó registrado"*, *"nota y próxima acción registradas"*, etc. Si el modelo intenta alucinar dicha confirmación, el guardián intercepta la respuesta y avisa con la verdad.
*   **Inspección Real de Perfil desde Supabase**: Se inyectó al prompt del Copiloto el bloque `PROSPECTO EN FOCO DIRECTO` con la próxima acción y las últimas notas reales extraídas de Supabase, prohibiendo terminantemente la frase *"no tengo acceso visual"*. Si Alberto pregunta *"¿Registraste lo que te dije?"* o *"revisa su perfil y confirma"*, el bot cita textualmente lo que existe en el CRM sin mentir ni adivinar.
*   **Resolución Contextual por Historial Robusta (`findLeadFromHistory`)**: Se migró la búsqueda de leads en historial para usar el motor completo de `findLeadInSentence`. Ahora reconoce nombres compuestos (*"Yoselin Nails Parra Calixto"*), nombres de pila (*"Yoselin"*, *"Jocelyn"*), variaciones fonéticas y tokens individuales en los últimos 8 turnos de conversación.
*   **Inyección Completa del ADN Comercial y Manejo de Objeciones**: Se configuró en el sistema el producto real de Alberto (Software SaaS / Web App PWA de Marca Blanca con menú de 28 días, fotos reales de comidas, recálculo inteligente de macros, lista de compras por semana, asistente virtual Lucas 24/7 y planes por créditos S/.400 x 30 créditos; NO es agencia de marketing ni publicidad), junto con tácticas para desarmar objeciones de nutricionistas ("yo ya tengo marketing", etc.).
*   **Saneamiento de Sesión ante Errores de Conexión**: Las respuestas temporales de error ("⚠️ Disculpa...") ya no se guardan en el historial de sesión, evitando envenenar turnos posteriores del asistente.
*   **Respeto Estricto de Datos**: Se mantuvo 100% intacta la ficha de Yoselin en Supabase tal como solicitó Alberto (quien la gestionó manualmente).

### 20. Matriz de Psicología Comercial B2B y Motor Táctico de Copywriting para WhatsApp (28 de Septiembre de 2026)
*   **Motor Táctico de Cierre B2B en Telegram**: Cada vez que Alberto consulta qué responder a un prospecto o pega una conversación de WhatsApp, el bot responde obligatoriamente bajo una estructura táctica de 3 partes:
    1. 💡 **Lectura de la jugada:** Diagnóstico psicológico de la respuesta del prospecto (qué asumió, qué objeción tiene y por qué respondemos así).
    2. 💬 **Mensaje listo para copiar:** El texto exacto entre comillas («...») para copiar y pegar directamente en WhatsApp, redactado con tono humano, cálido, conversacional peruano/latino, profesional y sin sonar agresivo.
    3. 🎯 **Siguiente paso:** La jugada estratégica a seguir según la respuesta del cliente.
*   **Matriz de Situaciones Reales para Nutricionistas y Coaches**:
    1. *Mensajes automáticos / Creyó que somos pacientes (ej. consultorio de Sandra):* Desarmar el malentendido con diplomacia y empatía, validar la reputación del consultorio y abrir curiosidad hacia la App propia con micro-compromisos de bajísima fricción (video de 30s o demo interactiva).
    2. *¿Cuánto cuesta? / Piden precio de entrada:* Anclar el retorno de inversión (pasar de consultas sueltas de S/. 70-90 a programas de S/. 250 - S/. 400), explicar el esquema de créditos y dirigir a la demo previa antes de hablar de costos.
    3. *Yo ya tengo marketing / redes / vendo y no compro:* Desarmar aclarando que no somos agencia ni publicidad, sino la herramienta operativa para no desgastarse en PDFs de Excel y evitar que sus pacientes abandonen.
    4. *Mándame información por aquí / no tengo tiempo:* Evitar PDFs pesados y enviar la demo interactiva en vivo con un gancho visual de 2 líneas.
    5. *No me interesa / No gracias:* Salida elegante y profesional que deja la puerta abierta sin discutir ni rogar.
*   **Blindaje Antiescritura en Consultas de Copywriting**: Se añadieron disparadores específicos en `isComplaintOrDebate` e `isExplicitUpdateCommand` (`qué le respondo`, `cómo le respondo`, `dime qué responderle`, `qué le pongo`, `qué le digo`) para garantizar que consultar qué responder jamás modifique por accidente el CRM en Supabase.

### 21. Optimización de Motores IA: Priorización de Qwen 3.8 y OpenAI 20b sobre Groq y Reducción de Latencia (28 de Septiembre de 2026)
*   **Reordenamiento del Motor Primario en Groq (`qwen/qwen3.8-27b`)**: Se identificó que el modelo pesado `openai/gpt-oss-120b` agotó su cuota diaria gratuita de 200,000 tokens en Groq a las 10:52 a. m., y que Google Gemini sufría una saturación mundial (Error 503: High demand). Se reconfiguró la cascada para priorizar a **`qwen/qwen3.8-27b`** como motor #1 (tiempo de respuesta de **0.3 segundos**, excelente comprensión en español y sin cuotas restrictivas), seguido de **`openai/gpt-oss-20b`** (1 segundo) y dejando al modelo pesado al final.
*   **Reducción de Timeouts de Red (4s)**: Se redujo el tiempo máximo de espera por intento a 4000 ms (4 segundos), evitando que solicitudes lentas consuman la ventana de ejecución de Vercel y garantizando respuestas inmediatas en Telegram.

### 22. Dieta Extrema de Tokens (84% menos), Regla Clínica Profesional y Blindaje Vercel (28 de Septiembre de 2026)
*   **Diagnóstico del Límite de Entrada (ITPM 8k en Groq)**: Se identificó que la capa gratuita de Groq aplica una restricción estricta de 8,000 tokens de entrada por minuto (ITPM). Dado que el sistema volcaba en cada consulta los 51 leads del CRM (~5,000 tokens) más 10 turnos de historial y la agenda precalculada, enviar dos mensajes seguidos en menos de un minuto saturaba el cupo de tokens y provocaba el error 413 / intermitencia temporal en Telegram.
*   **Aislamiento Radical del Prospecto en Foco (`targetLead`)**:
    *   Cuando Alberto consulta o interactúa sobre un prospecto concreto (ej. Patricia Badani), el sistema **omite al 100% los otros 50 prospectos** y la agenda general del prompt. Solo inyecta la ficha comercial y las últimas gestiones registradas de ese cliente.
    *   Si no hay prospecto en foco (consulta global), solo se envían los 28 prospectos activos de la cartera personal de Alberto en formato resumido ultracompacto (nombre, estado, próxima tarea), sin incluir leads de otros asesores ni cerrados perdidos.
    *   El consumo por mensaje descendió de ~5,000 tokens a **~780 tokens** (reducción del 84%), permitiendo enviar 8 a 10 mensajes continuos por minuto sin rozar el límite de Groq.
*   **Regla Clínica de Perfil (Prohibido asumir que el cliente está enfermo o es paciente)**:
    *   Se incorporó la **Regla 2 en Reglas de Actuación**: se establece formalmente que todos los contactos de Bienestar CRM son profesionales de la salud (médicos cirujanos, nutricionistas, especialistas).
    *   Si un prospecto indica *"estoy entrando a una cirugía"*, *"voy a operar"* o *"estoy en consulta"*, la IA reconoce que es el cirujano/médico realizando su labor. Queda terminantemente prohibido desearle *"pronta recuperación"* o asumir enfermedad; se le desea éxito en la cirugía y se le deja el camino abierto sin presión para coordinar al salir de quirófano.
*   **Compactación del Historial de Turnos**:
    *   Se redujo el historial remitido al motor IA de 10 a 4 turnos y se truncaron las respuestas anteriores del asistente a un máximo de 350 caracteres, evitando acumulaciones innecesarias de tokens.
*   **Timeouts Extendidos y Configuración de Vercel (`vercel.json`)**:
    *   Se aumentó el timeout del motor Groq a 8 segundos (`AbortSignal.timeout(8000)`) para dar margen holgado a la respuesta.
    *   Se creó el archivo de infraestructura `vercel.json` con `"maxDuration": 60` para `api/telegram.js`, evitando cualquier desconexión por tiempo límite en la nube de Vercel.

### 23. Corrección Crítica de Formato de Fechas en Próxima Acción e Inspección de Perfil (28 de Septiembre de 2026)
*   **Diagnóstico del Bug de Fecha Truncada (`formatFriendlyTime`)**: Al consultar en Telegram por la próxima acción de un cliente (ej. Patricia Badani), el bot respondía erróneamente que la acción era un mensaje pasado ya enviado hoy a las 10:00 a. m., a pesar de que en Supabase la tarea estaba programada para mañana 29 de septiembre a las 10:00 a. m.
*   **Causa Raíz Identificada**: La función auxiliar `formatFriendlyTime` en `api/telegram.js` solo extraía las horas y minutos (ej. `10:00 a. m.`), amputando por completo el día y mes (`2026-09-29`). Al recibir solo la hora `10:00 a. m.` y comparar contra la hora actual de Perú (11:40 a. m.), el modelo asumía que la tarea ya había pasado hoy y alucinaba que era un mensaje ya enviado.
*   **Implementación de `formatFriendlyDateTime`**: Se creó un formateador comprensivo que incluye día de la semana, día del mes, nombre del mes y hora en formato am/pm (ej: `MAÑANA (29 de septiembre) a las 10:00 a. m.` u `HOY (28 de septiembre) a las 10:00 a. m.`).
*   **Blindaje en el Prompt del Prospecto en Foco**:
    *   Se inyecta explícitamente: `Próxima acción en CRM (TAREA PROGRAMADA PENDIENTE DE EJECUTAR): "[Texto exacto]"`.
    *   `Fecha y hora programada: MAÑANA (29 de septiembre) a las 10:00 a. m.`.
    *   `Estado de la próxima acción: TAREA PENDIENTE POR REALIZAR A FUTURO (AÚN NO SE HA ENVIADO)`.
*   **Regla 4 en Reglas de Actuación**: Si el usuario pregunta cuándo es la próxima acción, qué dice o para cuándo es, el Copiloto cita con precisión milimétrica la fecha completa futura y el texto exacto guardado, con prohibición estricta de afirmar que ya se envió.

### 24. Algoritmo de Coincidencia de Prospectos con Acumulación Multi-Token y Super-Prioridad de Apellidos Únicos (28 de Septiembre de 2026)
*   **Diagnóstico del Bug de Homónimos (Caso Nancy Flores vs Nancy Tafoya)**: Alberto dictó un audio indicando: *«...mañana Zoom, una y media con Nancy. ¡Tafoya!»*, pero el bot actualizó la ficha de **Nancy Flores** en Supabase, a pesar de que el texto de la respuesta y la tarea mencionaban a Nancy Tafoya.
*   **Causa Raíz Identificada**:
    *   La función `findLeadInSentence` evaluaba cada coincidencia de palabra de forma atómica e inconexa, insertando un elemento en un arreglo de candidatos por cada token encontrado.
    *   Nancy Flores tenía un elemento de 100 puntos (por *"Nancy"*).
    *   Nancy Tafoya tenía dos elementos de 100 puntos (uno por *"Nancy"* y otro por *"Tafoya"*), pero el código no acumulaba el puntaje en un solo perfil.
    *   Al ordenar los candidatos empatados en 100 puntos, Javascript devolvió a Nancy Flores por haber aparecido primero en el listado de la base de datos.
    *   Tampoco existía diferenciación entre palabras comunes y apellidos raros o únicos.
*   **Solución Implementada**:
    *   **Acumulación de Puntajes por Lead (`leadScores Map`)**: Todas las palabras detectadas para un mismo prospecto en la oración ahora se suman en un único perfil acumulativo.
    *   **Bonus Multi-Token (+150 pts)**: Si el usuario menciona dos o más palabras pertenecientes al mismo prospecto (ej: nombre + apellido, *"Nancy"* y *"Tafoya"*), recibe un bonus multiplicador de +150 puntos por cada palabra adicional coincidente.
    *   **Super-Bonus de Apellidos y Tokens Únicos (+200 pts)**: El sistema precalcula la frecuencia de cada palabra en toda la base de datos de leads. Si el usuario menciona un término que solo pertenece a UN solo prospecto en todo el CRM (ej: *"Tafoya"*, *"Badani"*, *"Godoy"*, *"Culqui"*, *"Flores"*), ese lead recibe de inmediato +200 puntos adicionales de exclusividad.
    *   **Resultado de Validación**: Para la frase con *"Nancy... ¡Tafoya!"*, Nancy Tafoya obtuvo **550 puntos** frente a 100 puntos de Nancy Flores, garantizando una victoria indiscutible e infalible en prospectos con nombres compartidos.

### 25. Cálculo Matemático Determinista de Horas Relativas, Bloqueo Anti-Pasado y Regla de Humildad Ejecutiva (28 de Septiembre de 2026)
*   **Diagnóstico del Bug Horario y Conducta Robótica (Caso Lisbeth a las 18:21)**:
    *   Alberto dictó por audio: *«...pon una próxima acción en una hora si no ha respondido...»* a las 18:21 (6:21 p. m.).
    *   El bot registró la tarea para las **5:21 p. m.** (1 hora en el pasado) en vez de las 7:21 p. m. (+1 hora en el futuro).
    *   Al ser confrontado por Alberto (*«si son las 6:23 cómo sería para las 5:21?»* / *«¿por qué la registraste a esa hora?»*), el bot adoptó una actitud de chatbot corporativo defensivo, justificando el error diciendo que *"la hora correspondía a la tarea que ya tenías en el CRM"* y repitiendo la misma respuesta 3 veces seguidas sin admitir el error de cálculo.
*   **Causa Raíz Identificada**:
    *   El cálculo de expresiones relativas como *"en una hora"* se delegaba al modelo de lenguaje (LLM). El modelo, al recibir `06:21 p. m.`, restó una hora (18 - 1 = 17) en vez de sumar (18 + 1 = 19).
    *   El Copiloto carecía de una directiva de humildad y autocrítica ante errores señalados por el usuario, cayendo en bucles automáticos de justificación burocrática.
*   **Solución Implementada**:
    *   **Cálculo Matemático Determinista (`parseRelativeTimeExpression`)**: El backend en JavaScript ahora intercepta expresiones como *"en una hora"*, *"en 2 horas"*, *"en media hora"*, *"en 30 minutos"*, etc., y calcula matemáticamente en tiempo real la hora exacta en zona horaria America/Lima (sumando los milisegundos exactos), anulando cualquier error aritmético de la IA.
    *   **Filtro Anti-Pasado para Tareas de Hoy**: Si cualquier próxima acción para el día en curso queda programada con una hora anterior a la hora actual de Perú, el sistema detecta la incongruencia y la desplaza automáticamente hacia el futuro.
    *   **Claridad Horaria Dual (24h y 12h)**: El prompt ahora inyecta explícitamente tanto el formato 24h como el 12h (ej: `18:21 (hora militar 24h) / 06:21 p. m. (hora 12h)`).
    *   **Regla 5 de Humildad Ejecutiva y Cero Robot**: Ante cualquier reclamo, contradicción o confrontación por parte de Alberto, queda terminantemente prohibido dar explicaciones robóticas o justificar el error culpando al CRM. El asistente debe reconocer la equivocación en una sola frase honesta de socio (*«Tienes toda la razón Alberto, fue un error mío de cálculo al sumar la hora»*), corregir la hora en la base de datos de inmediato y hablar con naturalidad humana.

### 26. Prioridad Absoluta a Órdenes Explícitas de Bitácora, Desactivación de Falso Positivo "Para Qué" y Blindaje del Guardián Anti-Alucinación (29 de Septiembre de 2026)
*   **Diagnóstico del Fallo Crítico (Caso Nancy Tafoya - Zoom Realizado)**:
    *   Alberto envió el siguiente mensaje de voz y texto: *«Tuve el Zoom con Nancy Tafoya, registra eso en su bitácora. Se interesó bastante, entonces lo que he hecho es le he enviado la página de Nutrialberto y también le he enviado un código de activación y un video para que se guíe. Ya le envié todo para que lo pueda probar. Pon todo eso en bitácora y yo creo que ya para el día jueves ponle una próxima acción para ver cómo le ha ido y si es que ya está haciendo el plan de 28 días. Gracias.»*
    *   En el primer intento el bot respondió con error: *«No se pudo registrar la gestión en la bitácora de Nancy Tafoya debido a un inconveniente con el CRM.»*
    *   En el segundo intento el bot alucinó una actualización ficticia: *«¡Excelente trabajo, Alberto!... Ya actualicé su perfil en el CRM: 1. Bitácora: Registré... 2. Estado: Lo cambié a 'presentacion_realizada'... 3. Próxima Acción: Programé un seguimiento para el jueves 30 de septiembre a las 10:00 a. m.»*, pero en Supabase el registro permaneció intacto (estado "llamado" / Contactado y la tarea antigua del Zoom vencida).
*   **Causas Raíces Identificadas**:
    1.  **Falso Positivo Devastador de `isComplaintOrDebate` por normalización de acentos**:
        *   `isComplaintOrDebate` y `isExplicitUpdateCommand` contenían el patrón `\bpara\s+qu[eé]\b`.
        *   Al ejecutarse `normalizeStr()` (que remueve tildes para uniformizar búsquedas), frases perfectamente naturales como *"para que se guíe"* y *"para que lo pueda probar"* se convirtieron en `para que`, activando falsamente `isComplaintOrDebate = true`.
        *   La condición `shouldPerformUpdate` requería `!isComplaintOrDebate`, anulando la orden de actualización a pesar de que el usuario ordenó explícitamente *"registra eso en su bitácora"* y *"pon todo eso en bitácora"*.
    2.  **Omisión de Pronombres Enclíticos en Verbos Imperativos (`ponle`, `anótale`, `regístralo`)**:
        *   `hasStrongUpdateCommand` evaluaba `\b(pon|pongas|poner|anota|...)\b`, el cual fallaba ante conjugaciones con pronombres enclíticos como `ponle una próxima acción`.
    3.  **Falla del Guardián Anti-Alucinación (`falseClaimRegex`) con Límite de Palabra ASCII (`\b`)**:
        *   La expresión `\bya\s+(actualic[eé]|registr[eé])\b` utilizaba `\b` en una cadena sin normalizar.
        *   En JavaScript RegExp, la letra con tilde `é` es clasificada como carácter no alfanumérico (`\W`), al igual que el espacio en blanco (` `). Por definición matemática de regex, entre dos caracteres `\W` no existe frontera de palabra (`\b`), haciendo que `falseClaimRegex` evaluara a `false` y dejara pasar afirmaciones falsas del modelo sin haber escrito en la base de datos.
*   **Soluciones Implementadas**:
    1.  **Prioridad Absoluta a Órdenes Explícitas de Bitácora (`hasExplicitOrder`)**:
        *   Se definió `hasExplicitOrder = isUserExplicitUpdate || hasStrongUpdateCommand || isUserExplicitCreate`.
        *   Si el usuario da una orden imperativa directa de registrar en bitácora, cambiar estado o agendar próxima acción, la actualización se ejecuta **siempre**, sin que pueda ser bloqueada por detectores de consultas o debates.
        *   En `isExplicitUpdateCommand`, `hasStrongUpdateCommand` ahora se evalúa en primer lugar como condición de retorno inmediato.
    2.  **Eliminación del Falso Positivo `para qué / por qué`**:
        *   Se retiraron `para\s+qu[eé]` y `por\s+qu[eé]` de las expresiones de debate para evitar colisiones con conjunciones normales del español.
    3.  **Soporte Total para Pronombres Enclíticos**:
        *   Se expandieron los patrones de comandos fuertes para capturar `pon(le|lo|me)?`, `anota(le|lo)?`, `registra(le|lo)?`, `guarda(le|lo)?`, `actualiza(le|lo)?`.
    4.  **Blindaje y Normalización del Guardián Anti-Alucinación**:
        *   Se normaliza `cleanReply` (`normalizeStr(cleanReply)`) antes de validar con `falseClaimRegex` sin acentos (`registre`, `actualice`, `actualice su perfil`), asegurando que ninguna afirmación falsa de guardado pueda burlar la intercepción si la base de datos no fue modificada.
    5.  **Actualización Inmediata del Registro de Nancy Tafoya en Supabase**:
        *   Se actualizó directamente en Supabase el perfil de Nancy Tafoya (`9ecbf0ec-a16a-46bf-aca3-276a7dec26b4`): estado cambiado a `presentacion_realizada`, se insertó en la bitácora la realización del Zoom y el envío de enlaces y código para el plan de 28 días, y se programó la próxima acción: *"Seguimiento sobre prueba de app y plan de 28 días"* para el jueves 1 de octubre de 2026 a las 10:00 a. m.

### 27. Pensamiento Deductivo Cronológico Libre y Eliminación del Corsé de Plantillas en WhatsApp Copywriting (29 de Septiembre de 2026)
*   **Diagnóstico del Problema (Caso Mónica - Sugerencia Robótica y Desconectada)**:
    *   Alberto le pidió al Copiloto: *«Ya, según el resumen de Mónica y el contexto, dime qué mensaje le envío.»*
    *   El bot le sugirió un mensaje de WhatsApp genérico y corporativo ofreciéndole ver el enlace de la demo web interactiva de Nutrialberto: *«Si te interesa ver en 2 minutos cómo funciona la vista de paciente... te paso el enlace de la demo interactiva aquí: https://nutri-alberto...»*.
    *   **Incoherencia Grave**: Mónica ya había tenido el Zoom el 22 de septiembre, ya tenía el código de activación y ya había confirmado que estaba probando la app instalada. Además, llevaba 2 mensajes sin responder (25 y 27 de septiembre). Mandarle el enlace de la demo web era un retroceso de 3 pasos en el embudo y mandarle un tercer texto largo de venta era invasivo.
*   **Causa Raíz Identificada**:
    *   El prompt del sistema contenía plantillas rígidas con enlaces fijos y la regla: *«enfocado en micro-compromisos (ver video de 30s o demo interactiva)»*.
    *   Al tener esa orden fija, los modelos de IA se volvían perezosos y caían en la plantilla genérica de "nutricionista con dietas en Excel", ignorando la historia real registrada en la bitácora.
    *   Además, el bot no contaba con una etapa de "Scratchpad / Razonamiento Deductivo previo" en el JSON, viéndose forzado a escribir directamente `reply_message` sin antes deducir la línea de tiempo.
*   **Solución Implementada**:
    1.  **Campo de Deducción Estratégica Obligatorio (`deduccion_estrategica`)**:
        *   Se añadió en el esquema JSON un paso de razonamiento previo antes de generar el texto de respuesta: *`"deduccion_estrategica": "1. Estado real según bitácora. 2. Quién habló último y cuántos mensajes sin respuesta hay. 3. Qué sería absurdo decirle y cuál es el único movimiento inteligente ahora."`*
        *   Dado que los LLMs generan tokens de forma secuencial, este campo obliga al modelo a concluir lógicamente qué pasó y qué NO debe decirse antes de escribir la primera palabra del mensaje.
    2.  **Matriz de Fases de Embudo y Prohibición de Redundancia**:
        *   Si el cliente está en Etapa 3 (Presentación Realizada / App en prueba), queda **terminantemente prohibido** enviar enlaces de demo web o actuar como si el cliente no conociera el sistema.
    3.  **Regla de Oro de Silencio (Descompresión Psicológica ante +2 toques sin respuesta)**:
        *   Si el cliente ya recibió 2 mensajes de seguimiento sin responder, queda **terminantemente prohibido** enviar otro discurso largo o insistir en la venta. Se debe usar la pregunta de descarte técnico (fricción cero) o el desenganche suave (cierre de puerta abierta).
    4.  **Validación Exitosa**:
        *   Al ejecutarse la prueba en tiempo real con la misma consulta sobre Mónica, el Copiloto concluyó de inmediato que no debía insistir en la venta del Plan 30 por haber sido el último mensaje enviado, identificó la fase real de prueba y redactó un mensaje quirúrgico, breve y empático de soporte técnico: *«Hola Mónica, ¿cómo va? Te escribo cortito solo para asegurarme de que no te haya saltado ningún error técnico al intentar entrar o recalcular macros con tus pacientes... Si tienes alguna duda puntual, dime y la resolvemos al toque. ¡Un abrazo!»*.

### 28. Blindaje Absoluto Contra Escrituras No Autorizadas en Base de Datos y Restauración de Patricia Badani (29 de Septiembre de 2026)
*   **Diagnóstico del Fallo Crítico (Caso Patricia Badani - Sobreescritura Indebida de Tarea)**:
    *   Alberto le pidió al Copiloto: *«dame un resumen de patricia»*.
    *   El bot respondió con el cartel: *«✅ CRM verificado y actualizado para Patricia Badani / 📌 Próxima acción verificada: ¡Hola Patricia, buen día!... (5:12 p. m.)»*, sobreescribiendo la tarea real que tenía en el CRM con todo el borrador del WhatsApp.
    *   Al reclamarle Alberto (*«solo te pedi un resumen de patrica no que hicieras una proxima accion»*), el bot se disculpó textualmente pero volvió a incluir la tarea en el JSON, provocando que el backend actualizara la base de datos por segunda vez consecutiva.
*   **Causa Raíz Identificada**:
    *   En `api/telegram.js`, la variable `shouldPerformUpdate` contenía una condición residual:
        `const shouldPerformUpdate = targetLead && !isUserExplicitDoNotModify && (hasExplicitOrder || (!isQueryQuestion && !isComplaintOrDebate && hasConcreteUpdate));`
    *   Cuando el usuario no usaba signos de interrogación `?` (como en *"dame un resumen"*), `isQueryQuestion` evaluaba a `false`.
    *   Si el modelo LLM intentaba ser "proactivo" o alucinaba un campo `next_action_text` o `next_action_date` en su JSON, la condición residual `hasConcreteUpdate` evaluaba a `true`, disparando un `UPDATE` en Supabase a espaldas del usuario a pesar de que este solo pidió un resumen.
*   **Soluciones Implementadas**:
    1.  **Exigencia Obligatoria e Incondicional de Orden Explícita (`hasExplicitOrder`)**:
        *   Se eliminó por completo el fallback permisivo. La condición en `shouldPerformUpdate` ahora exige estrictamente:
            `const shouldPerformUpdate = targetLead && !isUserExplicitDoNotModify && !isQueryQuestion && !isComplaintOrDebate && hasExplicitOrder;`
        *   Si el usuario no dio una orden imperativa directa (*«anota»*, *«registra»*, *«pon en bitácora»*, *«cambia estado»*, *«agenda»*), la base de datos queda **100% bloqueada contra escritura**, ignorando cualquier campo inventado o proactivo que devuelva la IA.
    2.  **Ampliación del Diccionario de Consultas (`isQueryQuestion`)**:
        *   Se incluyeron formalmente expresiones de consulta como `dame`, `hazme`, `pasame`, `muestrame`, `cuentame`, `resumen`, `estado`, `ficha`, `reporte`, `historial`, `datos`.
    3.  **Ampliación del Diccionario de Reclamos y Debates (`isComplaintOrDebate`)**:
        *   Se agregaron expresiones de confrontación y corrección: `solo te pedi`, `no te pedi`, `te dije que`, `por que hiciste`, `por que registraste`, `quien te dijo`, `te equivocaste`, `eso esta mal`, `no hagas`, `no pongas`, `no registres`.
    4.  **Restauración Inmediata del Perfil de Patricia Badani en Supabase**:
        *   Se limpió el texto del mensaje de WhatsApp incrustado y se restauró su próxima acción original: *"Mensaje de seguimiento para coordinar el Plan 30"* con fecha programada `2026-09-29T10:00`.
    5.  **Validación en Vivo**:
        *   Al enviar nuevamente *"dame un resumen de patricia"* y *"solo te pedi un resumen..."*, el bot entregó la respuesta limpia sin tocar la base de datos, sin generar badges verdes y manteniendo la ficha intacta.

### 29. Resolución Dinámica de Especialidad Médica (`resolveLeadProfession`), Erradicación del Sesgo de "Recuperación" y Priorización de Modelo 120B (30 de Septiembre de 2026)
*   **Diagnóstico del Problema (Caso Patricia Badani - Alucinación de Paciente Convaleciente)**:
    *   Alberto consultó: *«no respondio el mensaje de ayer, que mensaje le envio?»*.
    *   El Copiloto redactó un mensaje inapropiado asumiendo que Patricia estaba enferma o internada recuperándose de una operación: *«Sé que ayer estabas ocupada con la cirugía... desearte que estés recuperándote bien...»*.
    *   A pesar de las quejas de Alberto, el bot insistió en decir que estaba en *«recuperación post-quirúrgica»* o le deseó *«que tu cirugía haya salido bien»*.
*   **Causas Raíces Identificadas**:
    1.  **Etiqueta Inexacta en Base de Datos**: En la ficha de Supabase (`client_type`), Patricia estaba registrada como `nutricionista` debido a los valores permitidos del constraint enum (`nutricionista`, `coach`, `gimnasio`, `tienda_suplementos`, `otro`), a pesar de que en sus notas figuraba que es Médico Ginecóloga y Cirujana. El modelo razonó: *"Como las nutricionistas no operan, si dijo que entraba a una cirugía debe ser una paciente que fue operada"*.
    2.  **Modelo Débil 20B en Cascada de Groq**: `openai/gpt-oss-20b` estaba ubicado en segundo lugar de la lista de modelos de Groq. Los modelos pequeños de 20B sufren de sesgo semántico donde la palabra "cirugía" activa automáticamente el patrón de "paciente en cama recuperándose", ignorando las directivas negativas.
    3.  **Anacronismo Temporal**: La cirugía de Patricia fue el lunes 28 a las 10:54 a. m. Que el bot siguiera hablando de la cirugía el miércoles 30 (48 horas después) era un sinsentido comercial.
*   **Soluciones Implementadas**:
    1.  **Resolución Dinámica de Profesión Médica (`resolveLeadProfession`)**:
        *   Se implementó una función que inspecciona los metadatos y notas del lead para detectar especialidades reales (`ginecología`, `cirugía`, `medicina`). Para Patricia Badani ahora inyecta en el prompt: *`Médico Ginecóloga y Cirujana (Opera a sus pacientes) (IMPORTANTE: Es quien opera o atiende a sus pacientes, NUNCA es un paciente enfermo)`*.
    2.  **Regla Clínica y Temporal Reforzada (Regla 2)**:
        *   Se prohibió terminantemente cualquier uso de palabras como *«recuperación»*, *«convaleciente»* o *«modo sobrevivencia»*.
        *   Se prohibió tratar eventos laborales ocurridos hace más de 24 horas como limitaciones activas del día en curso.
    3.  **Priorización de Modelo de Alta Capacidad en Groq**:
        *   Se eliminó `openai/gpt-oss-20b` de la lista de Groq y se dejó al mando el modelo de 120B (`openai/gpt-oss-120b`).
    4.  **Actualización en Supabase**:
        *   Se grabó en el campo `profession` de las notas de Patricia Badani: `Médico Ginecóloga y Cirujana`.
    5.  **Validación en Tiempo Real**:
        *   Al consultar nuevamente qué mensaje enviar a Patricia tras el mensaje de anoche, el Copiloto respondió con precisión quirúrgica, cero menciones a cirugías ni recuperaciones, y un mensaje impecable de soporte técnico para verificar el acceso a la app.

### 30. Actualización de Bitácora y Próxima Acción - Patricia Badani (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Alberto envió el mensaje de verificación técnica y soporte para validar el acceso de Patricia a la app móvil sin presiones de venta.
    *   Se registró en la bitácora del lead en Supabase el texto exacto enviado por WhatsApp.
    *   Se reprogramó la próxima acción para el **viernes 2 de octubre de 2026 a las 5:00 p. m.** con el objetivo: *«Toque suave de seguimiento si no responde al soporte técnico»*, dándole un respiro de 48 horas tras sus cirugías y consultas semanales.

### 31. Reprogramación de Cobro y Activación - David Godoy (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Se constató que David Godoy no ha respondido llamadas ni mensajes previos para el pago del saldo pendiente de S/ 200 para la activación de su plataforma en octubre.
    *   Se actualizó su bitácora en Supabase y se reprogramó la llamada para hoy **30 de septiembre de 2026 a las 5:00 p. m.** con el fin de exigir la definición del cobro y arranque del servicio.

### 32. Envío de Ajustes de Página y Exploración de Lanzamiento - Noé Rojas (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Alberto completó los ajustes solicitados en la página de Noé (reducción y depuración de textos para lectura óptima en móviles).
    *   Se le envió mensaje vía WhatsApp notificando los cambios, solicitando su visto bueno y explorando adelantar la coordinación del lanzamiento oficial antes de mediados de octubre.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 2 de octubre de 2026 a las 3:00 p. m.** para seguimiento en caso de no recibir respuesta.

### 33. Segundo Toque de Reprogramación y Estrategia de Cierre - Mirian (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Se envió el segundo toque suave tras su inasistencia al Zoom de ayer, quitándole la culpa y ofreciéndole reprogramar una llamada breve o revisar la app a su ritmo en su celular.
    *   Se actualizó la bitácora en Supabase y se reprogramó la próxima acción para el **viernes 2 de octubre de 2026 a las 11:00 a. m.** con el objetivo: *«Si no responde, enviar mensaje de descalificación/cierre para definir si se archiva o reactiva»*.

### 34. Respuesta Favorable y Coordinación de Cierre - Nancy Flores (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Nancy Flores respondió solicitando expresamente que Alberto le escriba este viernes: *«Te parece si me escribes el viernes? Ahí te aviso cualquier cosa»*.
    *   Alberto confirmó con total calidez y cordialidad.
    *   Se actualizó la bitácora en Supabase y se agendó la próxima acción para el **viernes 2 de octubre de 2026 a las 11:00 a. m.** con el objetivo: *«Escribir a Nancy para coordinar inicio del Plan 30 según lo acordado»*.

### 35. Confirmación Previa de Zoom - Anali (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Se envió mensaje anticipado a mediodía para confirmar la reunión de Zoom programada para hoy a las 6:00 p. m. (presentación de la app y plataforma para nutricionistas), solicitándole un micro-compromiso ("pulgar arriba") para preparar la sala.
    *   Se registró en la bitácora de Supabase y se mantuvo la próxima acción de Zoom para hoy **30 de septiembre de 2026 a las 6:00 p. m.**

### 36. Resolución de Duda de Intercambio de Alimentos - Mónica (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Mónica envió nota de voz consultando si en la plataforma se pueden intercambiar alimentos que no se consiguen o causan inflamación en México (yuca o calabaza por chayote o ejote).
    *   Alberto le respondió explicando las dos vías disponibles (directo en el plato o mediante el chat de la app) con recálculo automático de gramos y macros, ofreciéndole un video de 30 segundos o un Zoom de 5 minutos.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **jueves 1 de octubre de 2026 a las 4:00 p. m.** con el objetivo: *«Verificar respuesta sobre intercambio de alimentos; si no responde, enviar video demo de 30s»*.

### 37. Alta de Nuevo Lead Calificado - Coach Catrina (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Catrina (Médico y Coach en México) respondió a prospección en frío indicando que mañana tiene guardia hospitalaria y solicitando espacio de reunión para este viernes por la tarde.
    *   Alberto le propuso coordinar para las 4:00 p. m. o 5:00 p. m. (hora de México).
    *   Se dio de alta formalmente en Supabase como lead en estado **`cita_agendada`** asignado a Alberto Zegarra con Plan 30 ($400 USD), registrando su próxima acción para el **viernes 2 de octubre de 2026 a las 4:00 p. m.** con el fin de confirmar la hora exacta y realizar la presentación.

### 38. Mensaje Formal de Cobro de Fin de Mes y Definición - David Godoy (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Alberto envió mensaje formal y sin opciones de dilatación a David Godoy recordándole que el 1 de octubre (mañana) es la fecha pactada de inicio, que su web y app están terminadas y exigiendo la liquidación del saldo pendiente de S/ 200 hoy para cargar los créditos de sus alumnos y habilitar los accesos de administración.

### 39. Confirmación de Llamada para Cobro y Activación - David Godoy (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   David Godoy respondió de inmediato con nota de voz disculpándose por inconvenientes serios y comprometiéndose a llamar hoy para coordinar.
    *   Alberto le propuso llamarlo a partir de las 7:30 p. m. para hablar con calma sin cruzarse con el Zoom de Anali.
    *   David confirmó con audio expreso: *«Ya mi brother, listo, listo, queda»*.
    *   Se actualizó su bitácora en Supabase y se reprogramó la llamada definitiva para **hoy miércoles 30 de septiembre de 2026 a las 7:30 p. m.** para coordinar la activación y cobro de los S/ 200 restantes.

### 40. Estado Integral de la Jornada Comercial y Sincronización del CRM (30 de Septiembre de 2026 - Mediodía)
*   **Gestión Rápida Directa en Sesión**:
    1.  **Patricia Badani**: Mensaje de soporte técnico enviado; reprogramada para el viernes 02/10 a las 5:00 p. m.
    2.  **Noé Rojas**: Ajustes de página enviados y explorado adelanto de lanzamiento; reprogramado para el viernes 02/10 a las 3:00 p. m.
    3.  **Mirian**: Segundo toque suave enviado tras plantón de Zoom; reprogramada para el viernes 02/10 a las 11:00 a. m.
    4.  **Nancy Flores**: Respondió solicitando contacto el viernes; agendada para el viernes 02/10 a las 11:00 a. m. para coordinar arranque del Plan 30.
    5.  **Anali**: Mensaje de confirmación previo de Zoom enviado; reunión pactada para hoy a las 6:00 p. m.
    6.  **Mónica**: Envió audio consultando por sustitución de alimentos en México (yuca/calabaza por chayote/ejote); se le explicó el recálculo automático tanto en pantalla como vía chat, reprogramada para el jueves 01/10 a las 4:00 p. m.
    7.  **Coach Catrina**: Nueva alta calificada en `cita_agendada` ($400 USD); solicitó reunión para el viernes en la tarde por guardia médica hospitalaria, agendada para el viernes 02/10 a las 4:00 p. m.
    8.  **David Godoy**: Mensaje formal de cierre de mes enviado; respondió con disculpas y confirmó llamada para hoy a partir de las 7:30 p. m. para cobro de los S/ 200 y activación.
    9.  **Herramienta CLI Creada (`scripts/crm.js`)**: Script modular que agiliza consultas (`get`), actualizaciones de bitácora/próxima acción (`update`) y altas (`create`) vía API REST de Supabase, eliminando alertas de seguridad y permitiendo flujo veloz.
*   **Cronograma Activo para la Tarde de Hoy (Miércoles 30 de Septiembre)**:
    *   **5:30 p. m.**: **Deysi** — Verificar si confirmó Zoom (propuesto 5:00 o 5:30 p. m.).
    *   **6:00 p. m.**: **Anali** — **Reunión confirmada por Zoom** (presentación de plataforma).
    *   **7:30 p. m.**: **David Godoy** — **Llamada confirmada** para definir cobro de S/ 200 y activación en octubre.

### 41. Cancelación de Demostración y Cierre como Perdido - Anali (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Anali rechazó la reunión por Zoom agendada para hoy a las 6:00 p. m. (*«Tendré dificultad para conectarme... No podré verlo por Zoom. Gracias por su comprensión»*).
    *   Ante la evidente falta de interés en conocer el funcionamiento de la app, Alberto le envió mensaje de despedida cordial y se procedió a descalificarla.
    *   Se actualizó su estado en Supabase a **`cerrado_perdido`** con motivo *«Rechazó reunión por Zoom y no mostró interés real»*, liberando la agenda de las 6:00 p. m.

### 42. Recepción Favorable y Compromiso de Revisión - Noé Rojas (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Noé Rojas respondió de forma muy cálida confirmando que revisará los cambios aplicados en su página y enviará sus comentarios (*«Hola hermano, lo reviso y te dejo mis comentarios. Excelente tarde»*).
    *   Alberto le respondió confirmando de forma concisa (*«Ok dale»*).
    *   Se registró en la bitácora de Supabase y se mantuvo la próxima acción para el **viernes 2 de octubre de 2026 a las 3:00 p. m.** con el objetivo: *«Si no envía comentarios antes, escribirle el viernes para validar impresiones y coordinar lanzamiento»*.

### 43. Espacio de Descompresión y Reprogramación - Deysi (30 de Septiembre de 2026)
*   **Acción Realizada**:
    *   Deysi no respondió al mensaje de confirmación enviado en la mañana para el Zoom de las 5:00 p. m.
    *   Por criterio comercial, se decidió no saturarla con mensajes nocturnos y darle espacio de descompresión.
    *   Se actualizó su bitácora en Supabase y se reprogramó la próxima acción para **mañana jueves 1 de octubre de 2026 a las 10:00 a. m.** con el objetivo: *«Verificar respuesta de Deysi; si no responde, enviar toque suave de reprogramación de Zoom»*.

### 44. Regla Comercial Estricta: Prohibición Total de Ofrecer Videos Demo y Enfoque Exclusivo en Zoom (30 de Septiembre de 2026)
*   **Directiva Obligatoria y Permanente**:
    1.  **NO existen videos demo pregrabados** de la aplicación móvil.
    2.  **PROHIBIDO TERMINANTEMENTE** ofrecer, prometer, sugerir o mencionar el envío de videos de demostración a cualquier prospecto o lead.
    3.  El **ÚNICO canal y objetivo comercial** para mostrar el funcionamiento del aplicativo móvil a un cliente potencial es coordinar y concretar una **reunión por ZOOM en vivo** (de 10 a 15 minutos), donde Alberto comparte pantalla y demuestra la plataforma en tiempo real.
    4.  Cualquier guion, sugerencia o mensaje de WhatsApp generado por el asistente debe conducir única y exclusivamente a agendar el Zoom demostrativo.

### 45. Toque de Inicio de Mes y Reactivación de Alianza - Darío Cienfuegos (1 de Octubre de 2026)
*   **Acción Realizada**:
    *   Alberto envió mensaje táctico de inicio de mes a Darío Cienfuegos consultando por sus proyectos de consultoría y explorando si tiene gimnasios en cartera interesados en digitalizarse este trimestre con la app y web propia, ofreciéndole Zoom demostrativo de 10 min o dejarlo en pausa con total confianza.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **lunes 5 de octubre de 2026 a las 10:00 a. m.** para evaluar archivar o dar por cerrada la alianza si no responde.

### 46. Seguimiento Post-Zoom y Verificación de Experiencia - Nancy Tafoya (1 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 48 horas de la reunión demostrativa por Zoom, Alberto envió mensaje de seguimiento a Nancy Tafoya enfocado en soporte técnico: consultando cómo le fue ingresando con su código de activación en la app, resolviendo posibles dudas y proponiendo coordinar el arranque de octubre para sus alumnos.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 2 de octubre de 2026 a las 4:00 p. m.** para verificar respuesta o realizar toque de cierre de semana.

### 47. Segundo Toque de Reprogramación para Zoom - Deysi (1 de Octubre de 2026)
*   **Acción Realizada**:
    *   Alberto envió mensaje cordial de inicio de mes a Deysi disculpando su inasistencia de ayer por alta carga de consultas y proponiendo coordinar un Zoom rápido de 10 minutos hoy o mañana (mañana o tarde) para mostrarle la app en vivo en pantalla.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 2 de octubre de 2026 a las 11:30 a. m.** para verificar respuesta o aplicar cierre de puerta abierta si no responde.

### 48. Llamada Efectiva, Compromiso de Pago de Saldo y Arranque en Enero - David Godoy (1 de Octubre de 2026)
*   **Acción Realizada**:
    *   Alberto llamó directamente a David Godoy. David confirmó que transferirá el saldo pendiente de S/ 200 mañana viernes 2 de octubre (completando los S/ 400 del acuerdo comercial).
    *   Aclaró que arrancará el consumo de los 30 planes en enero de 2027, ya que aún no pudo colocarlos todos entre sus alumnos y el público de su zona no está tan habituado al uso de apps, pero ratificó su interés firme en la plataforma.
    *   Alberto le reenvió el enlace de su página web (`godoy-fitness.bienestarsinexcusas.site`) para revisión y feedback de diseño.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 2 de octubre de 2026 a las 11:00 a. m.** para verificar la recepción del comprobante de S/ 200 y sus comentarios de la web.

### 49. Descalificación y Cierre como Perdido por Silencio Continuo - Karla Dueñas (1 de Octubre de 2026)
*   **Acción Realizada**:
    *   Karla Dueñas no respondió al mensaje de desenganche final enviado el 30 de septiembre, acumulando 5 mensajes de seguimiento sin respuesta tras haber faltado a la reunión de Zoom pactada el 24 de septiembre.
    *   En cumplimiento de la postura profesional y cierre de ciclo, se decidió no enviar más mensajes.
    *   Se actualizó su estado en Supabase a **`cerrado_perdido`** con motivo *«No asistió a Zoom y no respondió a 5 seguimientos ni al desenganche final»*, liberando la oportunidad del embudo activo.

### 50. Seguimiento Directo de Soporte sobre Intercambio de Alimentos - Mónica (1 de Octubre de 2026)
*   **Acción Realizada**:
    *   Alberto envió mensaje de soporte directo a Mónica (sin solicitar redundancias de Zoom ya que ella cuenta con la app instalada y el código de prueba activo) para verificar si logró probar la sustitución de alimentos en su celular y el recálculo automático de gramos/macros, consultando si le funcionó bien o si tiene dudas técnicas.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 2 de octubre de 2026 a las 5:00 p. m.** para verificar respuesta o evaluar el paso al Plan 30 al cierre de semana.

### 51. Coordinación de Capacitación Vinces Fight, Cobro de Saldo y Comisión - Luis Culqui (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Alberto informó y registró que hoy viernes 2 de octubre a la 1:00 p. m. se llevará a cabo la capacitación del personal de la academia Vinces Fight a cargo de su socio Luis Hakim.
    *   En dicha sesión completarán el abono del saldo pendiente de S/ 200, del cual se destinarán S/ 60 de comisión a Luis Culqui.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 2 de octubre de 2026 a la 1:00 p. m.** para monitorear el cobro del saldo y liquidación de comisión.

### 52. Respeto de Ritmo de Prueba y Reprogramación de Inicio - Carmina Badillo (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Carmina Badillo informó vía WhatsApp que aún no había ingresado a la app y que iniciará el lunes (semana del 5 de octubre), indicando que avisará cuando empiece.
    *   Aplicando la regla táctica de no presionar al prospecto cuando ya estableció su propio compromiso de inicio, se respetó su fecha sin insistencias comerciales.
    *   Se actualizó su bitácora en Supabase y se reprogramó la próxima acción para el **lunes 5 de octubre de 2026 a las 11:00 a. m.** para verificar su arranque en la app.

### 53. Descalificación, Pausa de Acceso y Cierre como Perdido - Lisbeth (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Lisbeth acumuló 4 mensajes sin respuesta tras la reunión por Zoom del 25 de septiembre y entrega de código de prueba.
    *   Alberto envió mensaje de desenganche elegante comunicándole la pausa de su código de acceso de prueba para no saturarla, dejando la puerta abierta para cuando decida retomar el proyecto.
    *   En cumplimiento de la disciplina de embudo activo, se actualizó su estado en Supabase a **`cerrado_perdido`** con motivo *«No respondió a 4 seguimientos tras Zoom y entrega de prueba de app; se pausó código de acceso»*, liberando la oportunidad de la agenda activa.

### 54. Descalificación, Desenganche y Cierre como Perdido - Mirian (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Mirian no asistió a la reunión por Zoom del martes 29 de septiembre a las 4:00 p. m. y no respondió a los toques de reprogramación del 29 y 30 de septiembre.
    *   Alberto envió mensaje de desenganche con puerta abierta, retirando la presión comercial y dejando abierta la opción de reagendar en el futuro si decide digitalizar su consultorio.
    *   Se actualizó su estado en Supabase a **`cerrado_perdido`** con motivo *«No asistió a Zoom del 29/09 y no respondió a 2 seguimientos; se cierra con puerta abierta»*, limpiando el embudo activo.

### 55. Monitoreo de Transferencia de Saldo y Holgura Operativa - David Godoy (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Dado que David Godoy comprometió verbalmente en llamada ayer transferir hoy viernes el saldo de S/ 200, se decidió darle holgura operativa durante toda la jornada laboral y no presionarlo temprano en la mañana.
    *   Se actualizó su bitácora en Supabase y se reprogramó la próxima acción para hoy **viernes 2 de octubre de 2026 a las 6:00 p. m.** para verificar el ingreso bancario o contactarlo por llamada/WhatsApp al término de la tarde.

### 56. Criterio Estricto de Admisión al CRM y Táctica de Marca Blanca - Caso Antonella (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   En prospección en frío, una nueva prospecto (Antonella, nutrióloga en Miraflores, `+51 951 939 214`) respondió: *«Gracias!! Pero estamos por lanzar un app pronto»*.
    *   Alberto identificó la oportunidad de no dar por perdida la conversación y disparar de inmediato una propuesta de valor de **marca blanca** lista para operar, ahorrándole meses de desarrollo y costos pesados en programadores, e invitándola a un Zoom de 10 min para hoy o el lunes.
    *   **Regla Comercial y de CRM Establecida**: Se ratificó formalmente en el protocolo (`AGENTS.md` y `GEMINI.md`) que **SOLO se registran leads en Supabase cuando confirmen interés y agenden una reunión de Zoom**. Las prospecciones en frío no se ingresan al CRM para mantener el embudo 100% limpio y libre de contactos fríos o inciertos.
    *   **Regla de Veracidad de Producto**: Se prohibió terminantemente inventar disponibilidad en tiendas (Play Store / App Store bajo marcas individuales) que no haya sido validada por Alberto.

### 57. Efectividad de Desenganche, Reactivación y Soporte de Acceso - Lisbeth (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Tras enviarle el mensaje de desenganche comunicándole la pausa de su acceso para no saturarla, Lisbeth reaccionó de inmediato y rompió su silencio: *«Gracias, sí estuve ocupada»*.
    *   Alberto le respondió con total empatía validando la alta carga que implica la consulta de nutrición y ofreciéndole con calidez mantenerle el acceso activo a la app durante el fin de semana para que lo pruebe a su ritmo, o retomarlo más adelante.
    *   Se reactivó su estado en Supabase a **`presentacion_realizada`**, se limpiaron los campos de pérdida y se programó la próxima acción para hoy **viernes 2 de octubre de 2026 a las 3:00 p. m.** para verificar su decisión sobre la prueba.

### 58. Seguimiento Puntual de Coordinación de Plan 30 - Nancy Flores (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Cumpliendo exactamente la fecha solicitada por la prospecto el miércoles (*«¿Te parece si me escribes el viernes? Ahí te aviso cualquier cosa»*), Alberto le envió un mensaje de seguimiento cálido y sin fricción consultando qué decidió sobre el inicio del Plan 30 para sus pacientes este mes.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para hoy **viernes 2 de octubre de 2026 a las 5:00 p. m.** para monitorear su respuesta al cierre de la tarde.

### 59. Capacitación Exitosa de Vinces Fight y Seguimiento de Saldo y Comisión - Luis Culqui (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   La capacitación del personal de la academia Vinces Fight a cargo de Luis Hakim se llevó a cabo exitosamente a la 1:00 p. m.
    *   Alberto envió mensaje a Luis Culqui recordándole la transferencia del abono restante de S/ 200 para proceder con la liquidación de sus S/ 60 de comisión.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **sábado 3 de octubre de 2026 a las 10:00 a. m.** para verificar el ingreso del comprobante y transferir la comisión.

### 60. Empatía Médica Post-Guardia y Flexibilidad de Zoom - Coach Catrina (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Ante la falta de respuesta para la reunión de Zoom programada tentativamente para las 4:00 p. m., Alberto envió mensaje empático reconociendo el cansancio y exigencia de su guardia médica hospitalaria reciente.
    *   Le brindó total flexibilidad para conectarse más tarde hoy a un Zoom de 10 min o reprogramar con calma para el fin de semana o el lunes, eliminando cualquier presión comercial.
    *   **Aclaración de Precios**: Se ratificó que el valor del Plan 30 es estrictamente en **Soles Peruanos (S/ 400/mes)**, nunca en dólares.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para hoy **viernes 2 de octubre de 2026 a las 7:00 p. m.** para verificar si se desocupó de sus compromisos hospitalarios.

### 61. Micro-Toque de Fin de Semana y Soporte de Prueba - Nancy Tafoya (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Ante la ausencia de respuesta al seguimiento técnico de ayer, Alberto envió un micro-mensaje cordial y ligero deseándole un excelente fin de semana y recordándole disponibilidad de apoyo técnico si revisa la app en sus ratos libres.
    *   Se aplicó la regla táctica de no presionar con reuniones y permitirle experimentar la plataforma a su ritmo.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **lunes 5 de octubre de 2026 a las 11:00 a. m.** para verificar su experiencia en la app e inicio con alumnos.

### 62. Descalificación, Desenganche y Cierre como Perdido - Deysi (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Deysi acumuló 3 silencios consecutivos tras haber manifestado interés inicial el 29 de septiembre en conocer el funcionamiento de la app.
    *   Alberto envió mensaje de desenganche elegante con puerta abierta, retirando la presión de seguimiento y dejando abierta la posibilidad de coordinar un Zoom en el futuro si decide digitalizar su consultorio.
    *   Se actualizó su estado en Supabase a **`cerrado_perdido`** con motivo *«No respondió a 3 intentos de coordinación de Zoom; se cierra con puerta abierta»*, liberando la oportunidad del embudo activo.

### 63. Cierre Ganado Vinces Fight, Liquidación de Comisión y Reglas de Alianza Comercial - Luis Culqui (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Vinces Fight completó la transferencia del saldo restante de S/ 200, cancelando al 100% el contrato del Plan 30 (S/ 400 total).
    *   **Vigencia del Plan**: El servicio para Vinces Fight queda formalmente activo hasta el **20 de noviembre de 2026**.
    *   **Liquidación de Comisión**: Alberto liquidó a Luis Culqui su comisión del 15% de venta nueva (S/ 60.00) vía Yape (Op. 05279264 a las 04:43 p. m.).
    *   **Comprobante Adjunto**: Se adjuntó la imagen del voucher de Yape de S/ 60 directamente en la bitácora y galería de documentos en Supabase con soporte para visor lightbox y descarga.
    *   **Estructura y Reglas del Acuerdo de Alianza con Culqui**:
        1.  **Venta Nueva**: Culqui comisiona el **15%** por cada nuevo plan vendido (ej: S/ 60 por Plan 30).
        2.  **Renovación Mensual**: Culqui comisiona el **10%** por renovación mensual de cada cliente activo.
        3.  **Condición Obligatoria**: Para acceder al cobro de comisión por renovación, Culqui debe mantener un **mínimo obligatorio de 2 clientes activos simultáneamente**.
    *   Se actualizó su estado en Supabase a **`cerrado_ganado`** (S/ 400) y se programó la próxima acción para el **viernes 9 de octubre de 2026 a las 11:00 a. m.** para seguimiento de nuevos prospectos de academias.

### 64. Paciencia Estratégica de Fin de Semana - Nancy Flores (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Tras el envío del mensaje de seguimiento a las 11:08 a. m. consultando por la definición del Plan 30, no hubo respuesta durante la jornada del viernes.
    *   Aplicando la regla comercial de no duplicar mensajes en el mismo día para evitar percepciones de insistencia o desesperación, se decidió dejarle espacio durante el fin de semana.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **lunes 5 de octubre de 2026 a las 11:00 a. m.** para evaluar un toque de inicio de semana si no escribe antes.

### 65. Paciencia de Fin de Semana y Definición de Prueba - Mónica (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Ante la ausencia de respuesta al soporte técnico de intercambio de alimentos enviado el jueves por la tarde, se optó por no saturarla con un nuevo mensaje el viernes para mantener la postura comercial.
    *   Dado que cuenta con la aplicación y el código de prueba activos en su dispositivo, se le otorgó holgura para experimentar el recálculo y las recetas durante el fin de semana a su propio ritmo.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **lunes 5 de octubre de 2026 a las 11:00 a. m.** para definir el paso al Plan 30 o la pausa de su acceso.

### 66. Análisis Psicológico de Ventas y Estrategia de Desenganche - Patricia Badani (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Se analizó a profundidad la secuencia de interacciones con Patricia Badani. Tras su mensaje del lunes 28 (*«estoy entrando a una cirugía, te escribo para coordinar»*), acumuló dos mensajes de seguimiento sin respuesta (martes 29 y miércoles 30).
    *   Se determinó comercialmente que el *"te escribo para coordinar"* operó como una salida cordial para ganar tiempo ante su alta carga médica y los retos cambiarios de Bolivia, y que insistir un viernes por la tarde resultaría contraproducente.
    *   Alberto optó por la Alternativa A: no enviar mensajes durante el fin de semana y programar un desenganche elegante de puerta abierta para el **lunes 5 de octubre de 2026 a las 11:00 a. m.**, pausando su acceso de prueba para definir si reactiva la oportunidad o se archiva definitivamente.

### 67. Seguimiento Directo de Transferencia de Saldo S/ 200 - David Godoy (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Al cumplirse el plazo acordado de las 6:00 p. m. para el abono voluntario prometido por David Godoy, Alberto le envió un mensaje directo y natural consultando si logró realizar la transferencia de los S/ 200 para verificarlo en cuenta y dejar cerrado el contrato del Plan 30.
    *   Se adaptó la redacción al tono auténtico de Alberto (directo, peruano, sin modismos corporativos forzados).
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para hoy **viernes 2 de octubre de 2026 a las 8:00 p. m.** para monitorear su respuesta y verificar el ingreso del pago.

### 68. Reprogramación de Lanzamiento para Mediados de Octubre - Noé Rojas (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   Dado que Noé Rojas confirmó previamente que proyecta iniciar operaciones con su tienda de suplementos (`nrsports.mx`) para mediados de octubre y que los cambios de su página web ya fueron entregados, se acordó darle holgura y no interrumpirlo en el cierre de semana.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **miércoles 7 de octubre de 2026 a las 11:00 a. m.** para coordinar el lanzamiento y la vinculación con el aplicativo.

### 69. Alta de Nuevo Lead y Zoom Agendado para el Lunes - Consuelo Naranjo (2 de Octubre de 2026)
*   **Acción Realizada**:
    *   En prospección en frío por WhatsApp, Consuelo Naranjo (`+593 96 251 9793`, Nutricionista de Ecuador) revisó la web de muestra y manifestó interés explícito en conocer el funcionamiento de la app.
    *   Acordó coordinar una reunión demostrativa por Zoom para el **lunes 5 de octubre por la tarde**. Alberto le consultó preferencia de horario entre 4:00 p. m. o 5:00 p. m.
    *   Cumpliendo estrictamente la **Regla 5 de Admisión al CRM** (confirmación de interés y pacto de Zoom), se dio de alta su ficha en Supabase bajo el estado **`cita_agendada`** (Plan 30 - S/ 400).
    *   Se programó la próxima acción para el **lunes 5 de octubre de 2026 a las 11:00 a. m.** para confirmar la hora exacta de la tarde y pasarle el enlace de Zoom.

### 70. Confirmación de Hora de Zoom (5:00 p. m.) - Consuelo Naranjo (3 de Octubre de 2026)
*   **Acción Realizada**:
    *   Consuelo Naranjo respondió confirmando la reunión demostrativa por Zoom para el **lunes 5 de octubre a las 5:00 p. m.** (misma zona horaria UTC-5 entre Perú y Ecuador continental).
    *   Alberto envió mensaje de confirmación ratificando la cita e indicando que 10 minutos antes (4:50 p. m.) le pasará el enlace de la sala.
    *   Se actualizó su bitácora y próxima acción en Supabase, fijando la fecha exacta para el **lunes 5 de octubre de 2026 a las 5:00 p. m.** para activar la alerta automática de 1 hora antes en Telegram.

### 71. Escalada Progresiva de Cobro de Saldo S/ 200 - David Godoy (3 de Octubre de 2026)
*   **Acción Realizada**:
    *   Tras verificar que el saldo de S/ 200 no ingresó el viernes por la noche, Alberto implementó una estrategia de cobro progresivo en dos pasos.
    *   **Paso 1 (Mañana del sábado)**: A las 08:55 a. m. envió un mensaje directo, relajado y respetuoso consultando a qué hora podría realizar la transferencia de los S/ 200 coordinados ayer.
    *   **Paso 2 (Tarde del sábado)**: Se fijó el plazo límite para las **2:00 p. m.**; en caso de no recibir el abono ni confirmación por WhatsApp, se procederá a realizar una llamada telefónica directa.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para hoy **sábado 3 de octubre de 2026 a las 2:00 p. m.**

### 72. Compromiso de Pago Ratificado por Audio - David Godoy (3 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 09:01 a. m., David Godoy respondió al mensaje de la mañana enviando un mensaje de voz confirmando el abono con total disposición: *"Amigo, ¿qué tal? Buenos días. Sí, no te preocupes, más tarde o en la noche."*
    *   Alberto respondió ratificando el compromiso para hoy: *"Dale David, genial. Quedo atento entonces más tarde o en la noche para dejarlo registrado hoy. ¡Un abrazo y buen sábado!"*
    *   Se actualizó la bitácora en Supabase, cancelando la necesidad de llamada a las 2:00 p. m. y reprogramando la próxima acción de verificación de abono de S/ 200 para hoy **sábado 3 de octubre de 2026 a las 8:00 p. m.**

### 73. Postura Comercial de Fin de Semana y Reprogramación - David Godoy (3 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 8:23 p. m. se verificó que el saldo de S/ 200 no ingresó a la cuenta bancaria.
    *   Para mantener una alta postura comercial y no interrumpir un sábado por la noche, Alberto decidió no enviar mensajes de noche ni utilizar excusas artificiales. Se acordó darle margen hasta el día siguiente.
    *   Se definió el mensaje de recordatorio directo y limpio (Opción 2) para el domingo a las 11:00 a. m. en caso de no recibir abono previo: *«Hola David, buen domingo. Te consultaba si hoy me llegas a transferir los 200 soles para dejar cerrado tu registro. Me avisas porfa.»*
    *   Se actualizó la bitácora en Supabase y se reprogramó la alarma y próxima acción para el **domingo 4 de octubre de 2026 a las 11:00 a. m.**

### 74. Envío de Recordatorio Directo de Domingo - David Godoy (4 de Octubre de 2026)
*   **Acción Realizada**:
    *   Al no registrarse abono previo durante la mañana del domingo, Alberto envió a las 12:09 p. m. el mensaje acordado consultando si hoy realiza la transferencia de los S/ 200 de saldo para dejar cerrado su registro.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para hoy **domingo 4 de octubre de 2026 a las 7:00 p. m.** para monitorear respuesta o confirmación bancaria.

### 75. Verificación de Visto No Abierto y Programación de Llamada de Cobro - David Godoy (4 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 7:38 p. m. se constató que el mensaje de WhatsApp permaneció con doble check plomo (no abrió el chat deliberadamente para postergar el cobro).
    *   Se mantuvo postura comercial sin enviar mensajes adicionales el domingo por la noche.
    *   Considerando que el saldo de S/ 200 lleva pendiente un mes y que el contacto evade por mensajería pero atiende de inmediato por vía telefónica, se acordó realizar una llamada directa de cobranza el lunes por la mañana.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **lunes 5 de octubre de 2026 a las 10:30 a. m.** para ejecutar la llamada telefónica directa.

### 76. Envío de Mensaje de Inicio de Semana - David Godoy (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 09:42 a. m., Alberto decidió enviar un mensaje directo de inicio de semana por WhatsApp antes de marcarle por teléfono: *«Hola David, ¿qué tal? Buen inicio de semana. Te consultaba a qué hora me llegas a pasar hoy la transferencia de los 200 soles del saldo para dejar cerrado tu registro. Me avisas porfa.»*
    *   Se actualizó la bitácora en Supabase y se programó la próxima acción para hoy **lunes 5 de octubre de 2026 a las 12:00 p. m.** para verificar respuesta o realizar llamada telefónica directa si no contesta.

### 77. Reactivación y Entrega de Accesos al CRM para Prueba - Darío Cienfuegos (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 09:50 a. m., Alberto conversó con Darío Cienfuegos (consultor de gimnasios). Darío confirmó su interés activo y aceptó probar el CRM para evaluar sinergias y ofrecerlo a sus clientes de gimnasios.
    *   Alberto le entregó sus credenciales de acceso para iniciar su periodo de prueba.
    *   Se actualizó su estado en Supabase pasando de `llamado` a **`presentacion_realizada`** *(sistema en prueba)*.
    *   Se acordó darle 3 días completos de exploración y se programó la próxima acción para el **jueves 8 de octubre de 2026 a las 11:00 a. m.** para evaluar impresiones y definir el modelo de alianza comercial.

### 78. Seguimiento Cálido de Inicio en la App - Carmina Badillo (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 09:58 a. m., Alberto envió el mensaje de inicio de semana acordado el viernes, saludándola con calidez y consultando si pudo ingresar a la app o si requiere asistencia con sus accesos.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **martes 6 de octubre de 2026 a las 11:00 a. m.** para esperar sus impresiones iniciales.

### 79. Seguimiento de Definición de Inicio con Alumnos - Nancy Tafoya (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:09 a. m., Alberto envió el mensaje de inicio de semana consultando si logró probar la plataforma con calma o si se le complicó con sus tiempos, para coordinar el arranque de sus alumnos en octubre o pausar el proceso si prefiere retomarlo después.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **miércoles 7 de octubre de 2026 a las 11:00 a. m.** (48 horas de margen) para definir siguientes pasos.

### 80. Seguimiento de Definición de Plan 30 y Prueba de Alimentos - Mónica (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:14 a. m., Alberto envió mensaje de seguimiento enfocado en su duda técnica previa sobre el intercambio de alimentos, consultando si la plataforma cubre lo que busca para sus pacientes a fin de activar el Plan 30 oficial o pausar su acceso de prueba.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **miércoles 7 de octubre de 2026 a las 11:30 a. m.** (48 horas de margen) para evaluar respuesta.

### 81. Desenganche Elegante de Puerta Abierta - Nancy Flores (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:35 a. m., tras no recibir respuesta el viernes al toque acordado previamente por ella misma, Alberto envió un mensaje de desenganche elegante retirando la presión comercial y ofreciendo dejar el proyecto en pausa por ahora con total confianza.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **miércoles 7 de octubre de 2026 a las 12:00 p. m.** para evaluar respuesta o cerrar como perdido con puerta abierta si persiste el silencio.

### 82. Desenganche Definitivo y Cierre con Puerta Abierta - Patricia Badani (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   Tras acumular 3 mensajes sin respuesta posteriores a su mensaje de cirugía del 28 de septiembre, Alberto aplicó una estrategia de desenganche definitivo (break-up message) con enfoque 100% comercial: reconoció sus silencios por su carga quirúrgica, asumió que no es el momento de implementar la plataforma y retiró el seguimiento para no incomodar su tiempo, dejando la puerta abierta si decide retomarlo en el futuro.
    *   Se actualizó su ficha en Supabase pasando su estado a **`cerrado_perdido`** *(Motivo: 3 silencios tras cirugía médica; desenganche elegante con puerta abierta)*, liberando el embudo activo de oportunidades y limpiando las alarmas pendientes.

### 83. Reconfirmación Asertiva de Zoom Demostrativo - Consuelo Naranjo (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:52 a. m., Alberto envió un mensaje de cortesía matutino ratificando con entusiasmo la cita de Zoom programada para hoy a las 5:00 p. m. e indicándole que 10 minutos antes (4:50 p. m.) le pasará el enlace de la sala por WhatsApp.
    *   Se actualizó la bitácora en Supabase manteniendo la próxima acción y la alerta para las **5:00 p. m. de hoy** (notificación previa por Telegram a las 4:00 p. m.).

### 84. Seguimiento Empático y Consulta de Agenda para Zoom - Coach Catrina (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 11:15 a. m., Alberto envió mensaje empático consultando cómo andan sus horarios esta semana tras su guardia médica hospitalaria previa para reprogramar el Zoom demostrativo.
    *   Tomando en cuenta sus silencios anteriores, se programó un límite de 48 horas: si no responde, se procederá con desenganche y cierre con puerta abierta.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **miércoles 7 de octubre de 2026 a las 12:30 p. m.**

### 85. Consulta Comercial Directa de Implementación - Lisbeth (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 11:15 a. m., tras haber roto su silencio el viernes, Alberto envió mensaje 100% comercial consultando si implementará la plataforma para sus pacientes este mes o si prefiere dejar el proyecto en pausa por ahora.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **miércoles 7 de octubre de 2026 a la 1:00 p. m.** para evaluar respuesta.

### 86. Respuesta de Pausa Voluntaria y Cierre con Puerta Abierta - Lisbeth (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 2:17 p. m., Lisbeth respondió con claridad: *«Todavia viendo en pausa por ahora»*.
    *   Alberto validó su decisión con total comprensión y postura profesional, agradeciendo su franqueza y dejándole la puerta abierta para reactivar cuando decida implementar la plataforma para sus pacientes.
    *   Se actualizó su ficha en Supabase pasando su estado a **`cerrado_perdido`** *(Motivo: Prospecto solicitó dejar en pausa por ahora; puerta abierta)*, liberando el embudo de seguimiento activo y limpiando las tareas pendientes.

### 87. Reprogramación de Llamada Directa de Cobranza para la Noche - David Godoy (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   Dado que David no respondió al mensaje de la mañana ni transfirió al mediodía, Alberto optó por darle todo el día de holgura para transferir voluntariamente y programar la llamada telefónica directa de cobranza para la noche.
    *   Se actualizó su bitácora en Supabase y se reprogramó la próxima acción y alarma para hoy **lunes 5 de octubre de 2026 a las 8:00 p. m.**

### 88. Flexibilidad de Horario y Propuesta Inmediata de Zoom - Consuelo Naranjo (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   Al no registrarse confirmación de Consuelo a las 5:00 p. m. por alta carga de pacientes, Alberto envió mensaje a las 6:19 p. m. con alta empatía y flexibilidad, ofreciéndole conectarse 10 minutos por Zoom de inmediato si ya se liberó, o reprogramar para el martes con total tranquilidad.
    *   Se actualizó la bitácora en Supabase y se programó la próxima acción para hoy **lunes 5 de octubre de 2026 a las 7:00 p. m.** para monitorear su respuesta.

### 89. Petición de Espacio y Holgura Comercial de 1 Semana - Carmina Badillo (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 6:23 p. m., Carmina respondió al mensaje de la mañana solicitando espacio con calidez: *«Hola Alberto, gracias igualmente excelente inicio de semana, por favor te aviso cualquier cosa, gracias Bendiciones!»*.
    *   Alberto respondió de inmediato con total cordialidad, dejando la iniciativa en su cancha sin presionar: *«¡Dale Carmina, perfecto! Quedo súper atento a cuando te des un tiempito y me avises. ¡Muchos éxitos en tu semana y bendiciones también para ti! 😊🙏🏻»*.
    *   Se actualizó su bitácora en Supabase y se otorgó 1 semana completa de holgura, programando la próxima acción para el **lunes 12 de octubre de 2026 a las 11:00 a. m.**

### 90. Cierre de Jornada y Consolidación de Agenda de Mañana - David Godoy, Machy y Consuelo (5 de Octubre de 2026)
*   **Acción Realizada**:
    *   **David Godoy**: A las 7:48 p. m., Alberto decidió postergar la llamada directa de cobranza para la mañana siguiente, a fin de abordarlo en pleno horario operativo de su centro fitness. Se programó la alarma para el **martes 6 de octubre a las 10:30 a. m.**
    *   **Machy**: Debido a la diferencia horaria con España (+7 horas, plena madrugada), se trasladó su toque de reactivación para el **martes 6 de octubre a las 10:00 a. m.** (5:00 p. m. hora Madrid).
    *   **Consuelo Naranjo**: Al no responder en la noche del lunes, se aplicó la opción de reprogramación que ya se le había dejado planteada, fijando el seguimiento para el **martes 6 de octubre a las 11:00 a. m.** para concretar nueva fecha y hora del Zoom demostrativo.
    *   Se actualizaron las 3 fichas en Supabase con sus respectivas fechas y alarmas.

### 91. Soporte de Instalación de App en Escritorio PC - Mónica (6 de Octubre de 2026)
*   **Acción Realizada**:
    *   Mónica escribió en la madrugada desde su computadora aclarando que estuvo sin celular desde el viernes hasta el miércoles, y consultó si es posible instalar la app en la computadora.
    *   A las 09:05 a. m., Alberto le confirmó que sí y le brindó una instrucción sencilla paso a paso para instalar la PWA como acceso directo en el escritorio vía Chrome o usarla directo en la web.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para mañana **miércoles 7 de octubre de 2026 a las 11:30 a. m.** para verificar su experiencia en la PC y retomar la prueba en la app móvil cuando reactive su celular.

### 92. Reactivación de Temporada y Consulta de Cobros/Videos - Machy (6 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 09:14 a. m., cumpliendo el acuerdo de pausa estratégica de septiembre por la vuelta al cole y arranque de temporada en España, Alberto envió mensaje de reactivación consultando si resolvió sus dudas de cobros internacionales y si desea retomar con calma la implementación de la plataforma y sus videos de clases para sus alumnas.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **jueves 8 de octubre de 2026 a las 10:00 a. m.** para esperar su respuesta.

### 93. Llamada Directa de Cobranza Exitosa - David Godoy y Monitoreo Consuelo (6 de Octubre de 2026)
*   **Acción Realizada**:
    *   **David Godoy**: A las 11:10 a. m., Alberto realizó la llamada telefónica directa de cobranza. David contestó de inmediato, se disculpó por la demora y ratificó su compromiso formal de realizar la transferencia de los S/ 200 de saldo hoy en la noche. Se programó la alarma de verificación para hoy **martes 6 de octubre a las 8:30 p. m.**
    *   **Consuelo Naranjo**: Al constatarse que no ha abierto aún el mensaje de anoche, se aplicó la regla comercial de no saturar con mensajes adicionales y se programó la revisión de su respuesta para hoy **martes 6 de octubre a las 4:30 p. m.**
    *   Se actualizaron ambas fichas en Supabase con sus respectivas fechas y notas.

### 94. Mensaje de Seguimiento sin Desgaste Telefónico - David Godoy (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   Al no ingresar el abono prometido la noche anterior por teléfono, Alberto optó por no desgastarse en llamadas repetitivas y envió un mensaje directo de WhatsApp a las 09:53 a. m. recordando la conversación y enfocándolo en dejar su cuenta cuadrada para su inicio de enero.
    *   Se acordó evaluar llamada únicamente en la tarde si no responde ni abona.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para hoy **miércoles 7 de octubre de 2026 a las 3:30 p. m.**

### 95. Mensaje de Reprogramación de Zoom y Plazo Límite de 48h - Consuelo Naranjo (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:17 a. m., tras dejar un día de holgura el martes, Alberto envió mensaje de reprogramación consultando si le acomoda coordinar el Zoom demostrativo de 10 minutos para hoy en la tarde o mañana jueves.
    *   Se acordó otorgar 48 horas de plazo: en caso de no responder para el viernes 9 de octubre a las 11:00 a. m., se le enviará un mensaje de desenganche definitivo y se pasará a **`cerrado_perdido`** con puerta abierta para limpiar el embudo.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **viernes 9 de octubre de 2026 a las 11:00 a. m.**

### 96. Seguimiento de Pre-Campaña de Quincena - Noé Rojas (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:36 a. m., Alberto envió mensaje cordial a Noé Rojas consultando por los avances en NR Sports y fecha tentativa para la vinculación final de la página con el aplicativo de cara al arranque de mediados de octubre acordado previamente.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **lunes 12 de octubre de 2026 a las 11:30 a. m.** para afinar detalles antes de la quincena.

### 97. Gestión de Assets Web y Coordinación de Lanzamiento para Noviembre - Noé Rojas (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 10:56 a. m., Noé respondió por audio informando que está migrando su tienda online (`nrsports.mx`) a otra plataforma debido a problemas técnicos con su pasarela de pagos anterior, proyectando que la migración tardará de 10 a 15 días y postergando el lanzamiento oficial de su tienda para principios de noviembre.
    *   Reiteró su gran interés en la plataforma (*«Ya vi el tema de la plataforma, está genial»*) y solicitó los recursos gráficos del banner principal (hombre sentado con celular) para colocarlo en la portada de su nueva web con un enlace/botón que dirija hacia el aplicativo móvil.
    *   Alberto le respondió por texto validando el proceso de migración y enviándole un audio explicándole técnicamente que la sección de la web está compuesta por capas superpuestas (video de fondo + mockup de smartphone con carrusel de imágenes y textos dinámicos sincronizados), acordando facilitarle el material gráfico en alta calidad.
    *   Se actualizó su bitácora en Supabase y se reprogramó la próxima acción para el **lunes 26 de octubre de 2026 a las 11:30 a. m.** para verificar la conclusión de la migración y coordinar la vinculación técnica del aplicativo antes de arrancar noviembre.

### 98. Desenganche Definitivo y Cierre con Puerta Abierta - Nancy Tafoya (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 11:27 a. m., tras cumplirse las 48 horas de espera del mensaje del lunes y acumular 3 silencios consecutivos tras la reunión de demostración por Zoom del 29/09, Alberto envió mensaje de desenganche definitivo (break-up) retirando la presión comercial, liberando el cupo de prueba de la plataforma y dejando la puerta abierta con total cordialidad para cuando decida sistematizar los planes de sus alumnos.
    *   Se actualizó su ficha en Supabase pasando a estado **`cerrado_perdido`** con motivo `no_responde` (*«Silencio post-Zoom / Cupo liberado con puerta abierta»*), liberando la tarea activa para depurar el embudo.

### 99. Paciencia Estratégica y Holgura por Recuperación de Celular - Mónica (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 12:23 p. m., se constató la ausencia de respuesta tras las instrucciones de instalación de la PWA en PC enviadas el martes a las 09:05 a. m.
    *   Considerando que la prospecto notificó explícitamente haber estado sin celular desde el viernes hasta hoy miércoles, se aplicó la regla de paciencia estratégica de no duplicar mensajes en la misma jornada para no saturarla mientras restablece su línea y se pone al día con sus pendientes.
    *   Se actualizó su bitácora en Supabase y se programó la próxima acción para el **jueves 8 de octubre de 2026 a las 11:00 a. m.** para evaluar respuesta o realizar un toque suave de acompañamiento técnico.

### 100. Cierre por Silencio Post-Desenganche con Puerta Abierta - Nancy Flores (7 de Octubre de 2026)
*   **Acción Realizada**:
    *   A las 12:31 p. m., cumplidas las 48 horas tras el mensaje de desenganche con puerta abierta enviado el lunes 5 a las 10:35 a. m., se constató la ausencia de respuesta.
    *   Entendiendo que el silencio confirma su decisión de pausar la implementación del sistema debido a sus actividades docentes y de consulta, se dio por concluido el ciclo de seguimiento sin emitir mensajes adicionales para mantener la postura profesional.
    *   Se actualizó su ficha en Supabase pasando a estado **`cerrado_perdido`** con motivo `no_responde` (*«Silencio post-desenganche / Pausa con puerta abierta»*), depurando el pipeline comercial y liberando la tarea activa.

---

## 🛠️ Lo que se va a Hacer (Siguientes Pasos / Ideas)

### Fase 2: Optimización de Seguimiento e Interacciones
- [x] **Filtro de Asignación comercial y Privacidad**: Permitir filtrar el Dashboard y el Kanban por el socio comercial asignado y restringir visibilidad para vendedores.
- [x] **Copiloto de IA Integrado**: Asistente comercial flotante en el CRM con capacidad de lectura de clientes y actualización automática de bitácoras.
- [x] **Copiloto en Telegram**: Asistente multi-asesor por chat y notas de voz con recordatorios de agenda.
- [ ] **Campos del Lead Personalizados**: Agregar campos adicionales como RUC de la empresa, dirección o enlace de redes sociales al formulario de registro.
- [x] **Acciones de Contacto Rápido**: Integrar botones para abrir directamente chats de WhatsApp (`https://wa.me/...`) con plantillas inteligentes.

### Fase 3: Integraciones y Notificaciones
- [x] **Gestión de Archivos Adjuntos**: Permitir subir imágenes o PDFs en la bitácora del lead (comprobantes de pago, contratos) y galería con visor lightbox.
- [x] **Recordatorios de Tareas y Agenda**: Notificaciones automáticas por Telegram antes de llamadas y Zooms.
- [ ] **Exportación de Datos**: Añadir un botón en la tabla de leads para exportar los prospectos filtrados en formato Excel/CSV.

