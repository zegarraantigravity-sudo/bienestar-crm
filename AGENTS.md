# Protocolo Obligatorio de Interacción y Desarrollo con Alberto

## 1. Archivo de Control y Memoria (`actual.md`)
- SIEMPRE que se realice cualquier tarea, mejora, corrección de bug, cambio de código o configuración, debe registrarse y actualizarse inmediatamente en `actual.md`.
- Cuando Alberto inicie una conversación y diga "lee actual", se debe leer `actual.md` de inmediato para tener el 100% del contexto del proyecto.
- `actual.md` debe mantenerse siempre sincronizado y respaldado con `git commit` y `git push`.

## 2. Permiso Previo Obligatorio (No actuar por cuenta propia)
- Cuando Alberto pregunte algo, el asistente DEBE responder primero con total claridad, explicación o propuesta técnica y PEDIR PERMISO.
- NUNCA ponerse a modificar archivos, base de datos ni ejecutar cambios en el proyecto sin que Alberto lo haya autorizado explícitamente.

## 3. Protocolo de Confirmación: Esperar la palabra "DALE"
- Después de responder o dar un resumen con la propuesta de acción, para poder ejecutar cualquier cambio o modificación, se le debe preguntar directamente a Alberto y pedirle que diga la palabra "DALE".
- Si Alberto no ha dicho la palabra "DALE" (o una confirmación explícita equivalente), NO se ejecuta ninguna acción sobre el código ni la base de datos.
