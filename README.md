# CRM Comercial — Guía de puesta en marcha

Esta guía asume que no tienes conocimientos técnicos. Sigue los pasos en orden.

## PARTE 1 — Supabase (base de datos)

1. Entra a [supabase.com](https://supabase.com), crea una cuenta si no tienes, y crea un **nuevo proyecto**.
2. Espera a que el proyecto termine de crearse (1-2 minutos).
3. En el menú izquierdo entra a **SQL Editor**.
4. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** su contenido, pégalo en el SQL Editor y presiona **Run**.
   - Esto crea todas las tablas, la seguridad (RLS), el bucket de documentos y los catálogos iniciales.
   - Es seguro volver a ejecutarlo si algo falla; no duplica información.
5. En el menú izquierdo entra a **Authentication → Users → Add user**.
   - Crea tu usuario administrador con tu correo y una contraseña.
   - Marca la casilla para que el correo quede confirmado automáticamente ("Auto Confirm User").
6. Vuelve a **SQL Editor** y ejecuta esto, reemplazando el correo por el que usaste (está al final del archivo `schema.sql`, solo hay que quitarle el `--` de comentario):

```sql
update public.profiles set role = 'admin' where id =
  (select id from auth.users where email = 'TU-CORREO@EJEMPLO.COM');

update public.profiles set sucursal_id =
  (select id from public.sucursales limit 1)
  where id = (select id from auth.users where email = 'TU-CORREO@EJEMPLO.COM');
```

   Si aún no tienes ninguna sucursal creada, primero crea una: entra a **Table Editor → sucursales** y agrega una fila con un nombre (ej. "Sucursal Central"), luego ejecuta el segundo `update`.

7. En el menú izquierdo entra a **Project Settings → API**. Ahí verás dos datos que necesitarás en la Parte 2:
   - **Project URL**
   - **anon / publishable key**

Con esto, Supabase queda listo. No necesitas tocar nada más ahí (no se usa Edge Functions, ni CLI, ni Table Editor manual para el uso diario).

## PARTE 2 — Conectar la aplicación

1. Dentro de la carpeta del proyecto, busca el archivo `.env.example` y haz una copia llamada `.env`.
2. Abre `.env` y completa las dos líneas con los datos del paso anterior:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-larga
```

3. Guarda el archivo.

## PARTE 3 — Probar en tu computadora (opcional)

Si tienes Node.js instalado, puedes probarlo localmente antes de publicarlo:

```
npm install
npm run dev
```

Luego abre en tu navegador la dirección que aparezca (normalmente `http://localhost:5173`).

## PARTE 4 — Publicar en Netlify

1. Entra a [netlify.com](https://netlify.com) y crea una cuenta si no tienes.
2. Sube este proyecto a un repositorio de GitHub (o usa la opción de Netlify de arrastrar la carpeta, "Deploy manually" — en ese caso primero ejecuta `npm run build` en tu computadora y sube la carpeta `dist`).
3. Si conectas GitHub: en Netlify elige **Add new site → Import an existing project**, selecciona tu repositorio.
4. En la configuración de build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Antes de publicar, ve a **Site configuration → Environment variables** y agrega las mismas dos variables de tu archivo `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Presiona **Deploy site**.
7. Cuando termine, abre el link que te da Netlify. Deberías ver la pantalla de inicio de sesión.
8. Ingresa con el correo y contraseña del usuario administrador que creaste en la Parte 1.

## PARTE 5 — Crear más usuarios

Ya no necesitas volver a Supabase para esto:

1. Ingresa como administrador.
2. Ve a **Administración → Usuarios → + Nuevo usuario**.
3. Completa nombre, correo, contraseña, rol (Administrador / Vendedor / Consulta) y sucursal.
4. El nuevo usuario ya puede ingresar con ese correo y contraseña.

## PARTE 6 — Documentos (archivos adjuntos)

El bucket de almacenamiento (`documentos-crm`) ya se crea automáticamente al ejecutar el script SQL. No necesitas crear nada manualmente en Supabase Storage. Los archivos se suben desde la pestaña "Documentos" dentro de cada prospecto, cita o cliente, con un límite de 10 MB por archivo.

## Resumen rápido de pasos

**En Supabase:**
1. Crear proyecto.
2. Pegar y ejecutar `supabase/schema.sql` en el SQL Editor.
3. Crear el usuario administrador en Authentication → Add user.
4. Ejecutar el `update` para volverlo admin y asignarle sucursal.
5. Copiar el Project URL y la anon key.

**En la aplicación:**
6. Completar el archivo `.env` con esos dos datos.

**En Netlify:**
7. Publicar el proyecto (GitHub o manual).
8. Configurar `Build command: npm run build` y `Publish directory: dist`.
9. Agregar las mismas dos variables de entorno en Netlify.
10. Deploy y listo.

**Dentro del sistema:**
11. Ingresar como admin y crear a los demás usuarios desde Administración → Usuarios.

## Nota sobre un punto pendiente de diseño

El catálogo de servicios (sección "Servicios") se implementó **compartido entre todas las sucursales** (un solo catálogo para toda la empresa). Si prefieres que cada sucursal administre su propio catálogo de forma independiente, es un ajuste menor al script SQL y a la pantalla de administración — avísame y lo adapto.
