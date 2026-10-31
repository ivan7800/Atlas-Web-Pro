# Atlas Web Pro

Atlas Web Pro es un directorio local de herramientas web para IA, productividad, libros, cursos, programación, diseño, vídeo/audio, escritura, ciencia, seguridad, mapas, utilidades y recursos poco conocidos.

Funciona con HTML, CSS y JavaScript puro. No necesita backend, base de datos ni claves API. Está preparado para abrirse en local o publicarse en GitHub Pages.

## Funciones principales

- 188 herramientas incluidas.
- Buscador instantáneo tolerante a acentos.
- Filtros por categoría.
- Favoritos con localStorage.
- Notas personales por herramienta.
- Valoración de 1 a 5 estrellas.
- Registro local de herramientas más usadas.
- Herramientas personalizadas añadidas por el usuario.
- Edición y eliminación de herramientas personalizadas.
- Vista en tarjetas o lista.
- Orden por categoría, nombre, favoritas, valoración, uso o apertura reciente.
- Botón de herramienta aleatoria.
- Exportación/importación de backup en JSON con límite de tamaño y limpieza de datos.
- Atajo `Ctrl + K` para buscar rápido.
- PWA con service worker, fallback offline seguro e iconos PNG/SVG.
- 6 skins visuales intercambiables.
- Metadatos móviles para iPhone, Android y modo instalable.
- CSP, referrer seguro, limpieza de datos importados y protección ante localStorage bloqueado/corrupto.
- Accesibilidad: salto al contenido, estados ARIA, avisos en pantalla y controles táctiles de 44 px.
- `qa-check.mjs` para verificar el proyecto antes de publicarlo.

## Criterio editorial de enlaces

La versión 3.2.2 mantiene las herramientas útiles añadidas en 3.2.1 y evita incorporar enlaces orientados a saltar paywalls o descargar material con copyright sin permiso. Esto mantiene el proyecto limpio para GitHub Pages, portfolio público y posible uso profesional.

## Skins incluidas

- Pro oscuro.
- Atlas dorado.
- Cyberpunk.
- Terminal.
- Omega rojo.
- Claro limpio.

## Uso local

Abre `index.html` en tu navegador. Para probar la PWA/service worker de forma completa, sirve la carpeta con un servidor local o súbela a GitHub Pages.

## Verificación local

Con Node.js instalado, desde la carpeta del proyecto ejecuta:

```bash
node qa-check.mjs
```

El script comprueba archivos requeridos, sintaxis JavaScript, catálogo, duplicados, HTTPS, CSP, política referrer y manifest PWA.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de este proyecto.
3. Entra en `Settings` → `Pages`.
4. Selecciona la rama `main` y la carpeta raíz.
5. Guarda y espera a que GitHub genere la URL.

El archivo `.nojekyll` está incluido para evitar procesado innecesario de Jekyll en GitHub Pages.

## Archivos

- `index.html` — estructura de la app.
- `style.css` — estilos, responsive y skins.
- `app.js` — lógica de búsqueda, favoritos, notas, ratings y herramientas personalizadas.
- `data.js` — catálogo base de herramientas.
- `manifest.json` — configuración PWA.
- `sw.js` — cache offline básico.
- `icon.svg` — icono vectorial de la app.
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — iconos para PWA, Android e iOS.
- `qa-check.mjs` — verificación local sin dependencias externas.
- `README.md` — documentación.
- `SECURITY.md` — notas de seguridad.
- `CHANGELOG.md` — historial de cambios.
- `AUDIT_REPORT.md` — informe de auditoría.
- `LICENSE` — licencia MIT completa.
- `.nojekyll` — configuración para GitHub Pages.

## Privacidad

La app no envía favoritos, notas, ratings ni herramientas propias a ningún servidor. Todo se guarda en el navegador mediante localStorage. Si el navegador bloquea localStorage o se queda sin cuota, la app sigue funcionando y muestra un aviso.

## Compatibilidad

La app es responsive, no requiere backend y puede abrirse como web estática en GitHub Pages. Para instalación PWA completa, GitHub Pages debe servirla por HTTPS.

Para un cierre comercial absoluto, conviene probar también la URL publicada con Lighthouse, un móvil físico y los depuradores sociales de LinkedIn/Facebook.
