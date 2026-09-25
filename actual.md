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
