# EsquiSolar — tienda web estática

Sitio comercial y catálogo editable para EsquiSolar. Funciona con HTML, CSS, JavaScript y JSON; no usa servidor, base de datos, cuentas ni pagos en línea.

## Probar la página

El catálogo necesita un servidor local sencillo para leer `data/productos.json`. Con Python instalado, abra una terminal en esta carpeta y ejecute:

```powershell
python -m http.server 8000
```

Después abra `http://localhost:8000`.

## Publicar gratis en GitHub Pages

1. Cree un repositorio nuevo en GitHub, por ejemplo `esque-solar`.
2. Suba todo el contenido de esta carpeta a la rama `main`.
3. Abra **Settings → Pages** en el repositorio.
4. En **Build and deployment**, seleccione **Deploy from a branch**.
5. Seleccione la rama `main`, la carpeta `/ (root)` y pulse **Save**.
6. Espere unos minutos y abra la dirección que GitHub mostrará.

No se necesita un workflow para este proyecto.

## Cambiar el WhatsApp

Abra `js/app.js` y modifique:

```js
const WHATSAPP_NUMBER = "50236529128";
```

Use código de país y número, sin `+`, espacios ni guiones.

## Editar productos, precios e imágenes

Abra `data/productos.json`. Cada producto es un bloque entre llaves.

- `precio` debe contener solo números, sin `Q` ni comas.
- Cambie `nombre`, `marca`, `modelo`, `descripcion` y `garantia` según corresponda.
- Use `true` o `false` en `destacado`.
- Use `Nuevo`, `Oferta`, `Recomendado` o texto vacío en `etiqueta`.
- Para una imagen, guarde el archivo optimizado en `assets/images/` y escriba una ruta como `assets/images/panel-550.webp` en `imagen`.
- Si una imagen falta, la tarjeta muestra automáticamente un símbolo solar.

Para agregar o eliminar productos, mantenga el formato JSON y las comas entre registros.

## Cambiar información comercial y logo

Busque los textos entre corchetes, por ejemplo `[COLOCAR DIRECCIÓN]`, y reemplácelos. El encabezado y pie están en `js/app.js`. El favicon provisional está en `assets/images/favicon.svg`.

Antes de publicar, valide marcas, modelos, garantías, existencias, testimonios y precios de ejemplo.

## Actualizar el sitio

Guarde los cambios y súbalos a la rama `main`. GitHub Pages actualizará la página automáticamente.

## Privacidad

Los formularios no guardan datos personales. Preparan el mensaje en el navegador y abren WhatsApp para que el cliente decida enviarlo.

## Datos de ubicación

La lista local de departamentos y municipios se preparó a partir del conjunto público “Centroides de lugares poblados de la República de Guatemala — Censo 2018”, reorganizado únicamente para los selectores del formulario. El sitio no consulta servicios externos al usarla.
