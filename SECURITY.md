# Seguridad y privacidad

Atlas Web Pro es una app estática hecha con HTML, CSS y JavaScript.

## Datos locales

La app guarda en `localStorage`:

- Favoritos.
- Notas personales.
- Valoraciones.
- Herramientas personalizadas.
- Skin seleccionada.
- Historial local de uso.

Estos datos permanecen en el navegador del usuario y no se envían a ningún servidor.

## Enlaces externos

Las herramientas incluidas abren sitios externos en una pestaña nueva con `rel="noopener noreferrer"`.

## Medidas aplicadas

- Política CSP por metaetiqueta.
- `referrer=no-referrer`.
- Validación de herramientas personalizadas e importadas.
- Bloqueo de `http://` externo en herramientas personalizadas.
- Se acepta `https://` y `http://localhost`/`127.0.0.1`/`::1` para pruebas locales.
- Backups JSON limitados a 512 KB.
- Limpieza de IDs, URLs, notas, ratings, tags y uso antes de guardar.
- Manejo seguro de localStorage bloqueado, corrupto o sin cuota.
- Service worker limitado a recursos same-origin.

## Recomendaciones

- Revisa cualquier herramienta externa antes de introducir datos sensibles.
- No guardes contraseñas ni información privada en las notas personales.
- Si publicas una versión modificada, revisa que los enlaces añadidos sean legítimos.
- No se recomienda añadir servicios orientados a saltar paywalls, descargar obras con copyright sin autorización o eludir controles de acceso.
- Ejecuta `node qa-check.mjs` antes de publicar cambios.
