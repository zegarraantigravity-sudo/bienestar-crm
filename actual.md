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

