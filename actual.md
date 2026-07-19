# Control de Avances - Bienestar CRM

Este documento sirve como registro vivo de las tareas completadas, el estado del desarrollo y las ideas o siguientes pasos planificados para el sistema de ventas de **Bienestar Sin Excusas**.

---

## 📅 Estado Actual del Proyecto

*   **Repositorio GitHub**: [Hotrebla/bienestar-crm](https://github.com/Hotrebla/bienestar-crm)
*   **Servidor de Base de Datos**: Supabase (Proyecto: `Bienestar-CRM`)
*   **Hosting Frontend**: Vercel (Producción)
*   **Moneda Oficial**: Soles Peruanos (`S/.`)

---

## ✅ Lo que se ha Hecho (Completado)

### 1. Infraestructura y Base de Datos
*   **Inicialización**: Configuración inicial de la aplicación usando React con Vite y herramientas de compilación modernas.
*   **Base de Datos**: Diseño y creación de la tabla `leads` en Supabase con políticas RLS (Row Level Security) para el acceso seguro.
*   **Variables de Entorno**: Configuración de seguridad en el archivo `.env` y exclusión segura en `.gitignore` para no filtrar claves de Supabase.
*   **Conexión**: Implementación del cliente de Supabase (`supabaseClient.js`) para consultas en tiempo real.

### 2. Diseño e Interfaz Premium (Modo Oscuro)
*   **Estilo Visual**: Creación de un sistema de diseño propio en `index.css` con variables de color HSL, sombras neón sutiles, efectos glassmorphism en tarjetas y paneles, y micro-animaciones fluidas al pasar el cursor o interactuar.
*   **Diseño Adaptable**: Estructura lateral fija (Sidebar) y panel central fluido, optimizado para uso en computadoras y pantallas móviles.

### 3. Vistas Principales del CRM
*   **Panel de Controladores (Dashboard)**:
    *   Cálculo automático de tasas clave: Tasa de Contacto (Llamados/Total), Tasa de Citas (Citas/Llamados) y Tasa de Cierre (Cerrados/Demos).
    *   Métrica del valor total del embudo (pipeline proyectado en cartera).
    *   Visualizador gráfico de volumen financiero en Soles por cada una de las 6 fases de venta.
    *   Tarjeta interactiva de "Meta del Mes" con un control numérico y gráfico circular cónico que calcula el porcentaje completado en tiempo real.
*   **Tablero Kanban**:
    *   6 columnas de flujo comercial vertical (`Prospecto`, `Llamado`, `Cita Agendada`, `Presentación Realizada`, `Cerrado Ganado`, `Cerrado Perdido`).
    *   Tarjetas con color identificativo y badge dinámico por tipo de cliente (Coach, Nutricionista, Gimnasio, Tienda, Herbalife, Otro).
    *   Botón rápido de **Llamar 📞** en 1 clic que actualiza el estado y escribe en la bitácora automáticamente.
    *   Botones de navegación rápidos `<-` y `->` en cada tarjeta para deslizar prospectos sin arrastrar.
*   **Directorio de Leads (Tabla)**:
    *   Tabla interactiva y searchable por nombre de empresa, contacto, teléfono, correo o incluso por tareas pendientes.
    *   Filtros dinámicos en cascada por Estado, Plan y Tipo de Cliente en simultáneo.

### 4. Flujo de Seguimiento y Datos Locales
*   **Modal de Prospecto**:
    *   Formulario completo para crear y editar leads.
    *   **Bitácora de Seguimiento**: Registro interactivo de notas de interacción pasadas con fecha y hora exacta, mostradas en una línea de tiempo vertical.
    *   **Próxima Acción Pendiente**: Campo específico para registrar la siguiente tarea a realizar. Se muestra a primera vista en las tarjetas de Kanban (badge naranja) y en la tabla del directorio (icono 📌) para no perder el seguimiento.
*   **Planes y Precios Locales (Soles)**:
    *   Configuración de los 5 planes oficiales: **Plan 30** (S/. 300), **Plan 80** (S/. 600), **Plan 200** (S/. 1200), **Plan 500** (S/. 2700) y **Plan 1200** (S/. 6000).
    *   Autocompletado inteligente de precio estimado según el plan seleccionado.
    *   Eliminación de la restricción antigua de la base de datos para habilitar los nuevos tiers de planes.

### 5. Seguridad y Autenticación
*   **Acceso Restringido**: Implementación de una pantalla de Login premium antes de cargar la aplicación conectada directamente a Supabase Auth.
*   **Cierre de Sesión**: Botón en la parte inferior izquierda de la barra lateral para salir de la sesión de forma segura.

---

## 🛠️ Lo que se va a Hacer (Siguientes Pasos / Ideas)

### Fase 2: Optimización de Seguimiento e Interacciones
- [ ] **Filtro de Asignación comercial**: Permitir filtrar el Dashboard y el Kanban por el socio comercial asignado para evaluar el desempeño individual.
- [ ] **Campos del Lead Personalizados**: Agregar campos adicionales como RUC de la empresa, dirección o enlace de redes sociales al formulario de registro.
- [ ] **Acciones de Contacto Rápido**: Integrar botones para abrir directamente chats de WhatsApp (`https://wa.me/...`) o correos usando el número y mail registrado en la tarjeta del lead.

### Fase 3: Integraciones y Notificaciones
- [ ] **Gestión de Archivos Adjuntos**: Permitir subir imágenes o PDFs en la bitácora del lead (como comprobantes de pago o capturas de pantalla) vinculándolo con Supabase Storage.
- [ ] **Recordatorios de Tareas**: Crear una sección de "Tareas para Hoy" que alerte al comercial de todas las "Próximas Acciones Pendientes" cuya fecha coincida con el día de hoy.
- [ ] **Exportación de Datos**: Añadir un botón en la tabla de leads para exportar los prospectos filtrados en formato Excel/CSV.
