# Concurso de Pura Raza Árabe · Zafra — resultados en directo

Web para publicar en directo el orden de salida y la clasificación de cada
clase del concurso. Tú (organización) editas desde el móvil u ordenador con
tu usuario, y cualquiera con el enlace puede consultarlo en tiempo real.

Ya viene cargada con las **16 clases y 53 caballos** de tu Excel
(`ZAFRA_2026_INSCRIPCIONES_FINALES_AHC.xlsx`).

Ahora mismo, si abres `index.html` directamente, la web funciona en
**modo demostración**: se ve todo con los datos reales del Excel, pero no
puedes iniciar sesión ni guardar cambios. Sigue estos pasos para activar la
edición real.

---

## Paso 1 — Crear la base de datos (Supabase, gratis)

1. Ve a [supabase.com](https://supabase.com) → crea una cuenta → **New project**.
2. Cuando el proyecto esté listo, entra en **SQL Editor** → **New query**.
3. Copia y pega el contenido de `sql/schema.sql` → **Run**. Esto crea las tablas.
4. Nueva query → copia y pega `sql/seed.sql` → **Run**. Esto carga tus 16 clases
   y 53 caballos automáticamente.
5. Ve a **Project Settings → API**. Copia:
   - **Project URL**
   - **anon public key**
6. Abre `js/config.js` en este proyecto y pega ahí esos dos valores:
   ```js
   window.SUPABASE_URL = "https://xxxxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

## Paso 2 — Crear tu usuario de organización (el único que puede editar)

1. En Supabase, ve a **Authentication → Users → Add user**.
2. Pon tu correo y una contraseña. Marca **Auto Confirm User**.
3. Con ese correo y contraseña entrarás en la web pulsando
   **"Acceso organización"** (arriba a la derecha).

> Solo necesitas un usuario. Cualquiera que entre con ese correo/contraseña
> podrá editar — no compartas la contraseña, comparte solo el enlace de la web.

## Paso 3 — Publicar la web (Netlify, gratis)

1. Ve a [netlify.com](https://netlify.com) → crea una cuenta.
2. **Add new site → Deploy manually** → arrastra la carpeta entera de este
   proyecto (con `index.html` en la raíz).
3. En un minuto tendrás tu enlace público, tipo
   `https://tu-concurso.netlify.app`. Puedes personalizarlo en
   **Site settings → Change site name**.
4. Comparte ese enlace: todo el mundo podrá consultar resultados; solo tú,
   entrando con tu usuario, podrás editarlos.

> Si prefieres subirlo desde GitHub en vez de arrastrar la carpeta, también
> funciona: Netlify → **Import from Git**, sin configuración de build
> (es un sitio estático, no hace falta ningún comando).

---

## Cómo se usa el día del concurso

- **Portada**: título del concurso, cartel, patrocinadores y las 16 clases.
  Puedes editar todo eso (incluido subir la URL del cartel y logos) desde
  el panel que aparece al final de la portada cuando entras como
  organización.
- **Cada clase** tiene dos pestañas:
  - **Orden de salida**: fijo, viene del Excel (número de dorsal).
  - **Clasificación**: cada caballo tiene una hoja igual que la de papel,
    con las 5 notas de cada juez (T, CyC, C, E, M). La web suma
    automáticamente el total de cada juez, y calcula el total final como
    la media de los dos. El **puesto (1º, 2º, 3º...) lo decides tú a mano**
    con las flechas ↑ ↓ — no hay fórmula automática para el orden, así que
    los empates o casos especiales los resuelves tú. Mientras no fijes un
    puesto, se muestran ordenados por puntuación total como referencia
    (marcados con un asterisco).
  - Cada clase tiene un interruptor **"Publicar esta clasificación"** — así
    puedes ir rellenando resultados sin que se vean hasta que estén
    confirmados, y publicarlos con un clic cuando termine la clase.
- Los cambios se guardan al momento en la base de datos: en cuanto pulsas
  **Guardar cambios**, cualquiera que tenga la página abierta lo verá al
  recargar.

## Imágenes (cartel y logos de patrocinadores)

Este proyecto no aloja imágenes por sí mismo — necesitas pegar una URL.
La forma más simple:
- Sube la imagen a **Supabase → Storage** (crea un bucket público
  "imagenes"), o
- Sube la imagen a cualquier alojamiento de imágenes gratuito.

Copia la URL pública y pégala en el campo correspondiente del panel de
edición de portada.

## Estructura del proyecto

```
index.html          página única (portada + vista de cada clase)
css/style.css        estilos
js/config.js          tus credenciales de Supabase (rellenar)
js/data-demo.js       datos de ejemplo para el modo demostración
js/app.js             toda la lógica de la web
sql/schema.sql        tablas y permisos de Supabase
sql/seed.sql           tus 16 clases y 53 caballos ya listos para importar
sql/migracion_puntuaciones.sql   solo si ya habías creado la base de datos antes
```

> Si ya habías ejecutado `schema.sql` en Supabase antes de tener las
> puntuaciones de los jueces, ejecuta también
> `sql/migracion_puntuaciones.sql` (SQL Editor → New query → pegar → Run)
> para añadir esos campos sin perder los datos que ya tengas cargados.
> Si es tu primera vez instalando todo, no hace falta: ya viene incluido
> en `schema.sql`.

## Cambios futuros en los caballos inscritos

Si necesitas añadir, quitar o corregir algún caballo más adelante, hazlo
directamente en Supabase → **Table Editor → caballos** (o **clases**), sin
tocar código.
