# Changelog

## 3.2.2

### Auditoría final

- Añadida licencia MIT completa.
- Añadido `qa-check.mjs` para validación local sin dependencias.
- Añadido `.nojekyll` para GitHub Pages.
- Mejorados estados `aria-pressed` y resaltado visual de “Favoritas” y “Mis herramientas”.
- Actualizado service worker a cache `v3.2.2`.
- Añadida protección adicional para peticiones `only-if-cached` en el service worker.
- README, SECURITY y AUDIT_REPORT actualizados con verificación final.

## 3.2.1

### Añadido

- Unscreen.
- Carbon.
- Ray.so.
- Shots.so.
- Smartmockups.

### Evitado por duplicado

- AlternativeTo.
- JustWatch.
- Internet Archive.
- Wayback Machine.
- Project Gutenberg.
- Open Culture.
- Wolfram Alpha.
- Photopea.
- Squoosh.
- Remove.bg.
- Cleanup Pictures.
- Have I Been Pwned.

### Descartado por riesgo legal/editorial

- 12ft.io.
- LibGen.
- Sci-Hub.
- PDFDrive.

## 3.2.0

- Endurecimiento de importación/exportación JSON.
- Mejora de localStorage ante errores o bloqueo.
- CSP y política referrer.
- Validación de URLs personalizadas.
- Mejoras de accesibilidad.
- Mejoras responsive.
- Service worker con fallback offline controlado.
- Búsqueda tolerante a acentos.
