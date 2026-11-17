# Maestra 🎼

App personal de estudio para las oposiciones de **Maestro/a de Primaria — Música** (2026-2027, academia Luis Vives).

Construida sobre los PDFs de los TEMAS 1, 2, 5, 6, 7 y 8.

## Qué incluye

- 📚 **Mapa del temario** — árbol plegable de cada tema (sección → subsección → contenido).
- 🧠 **Repaso inteligente** — tarjetas con repetición espaciada (SM-2).
- ⏱️ **Simulador de oposición** — reloj real + informe de cobertura de secciones.
- 🎮 **Juegos**:
  - ¿Quién lo dijo? (citas → pedagogo)
  - Empareja método (drag-and-drop)
  - Rellena el hueco (cloze)
  - Método → autor relámpago (60s)
- 🎧 **Educación del oído** — intervalos, modos, texturas (audio generado con Tone.js).
- 🎯 **Puntos débiles** — heatmap de secciones (verde = dominas, rojo = fallas).
- ✍️ **Ensayos con feedback asíncrono** — ella escribe un tema completo; el marido lo copia al chat con Claude en su propio ordenador, pega la respuesta en `/admin`, ella la ve al refrescar.

## Setup — 3 pasos

### 1 · Instalar dependencias

```bash
cd maestra
pnpm install
```

### 2 · Cargar el esquema en Supabase

1. Abre el [SQL editor de tu proyecto](https://supabase.com/dashboard/project/wmsjnpxrozwpimdjlfwn/sql/new).
2. Pega el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. Dale a **Run**.

### 3 · Cargar PDFs y tarjetas

```bash
pnpm run setup
```

Esto parsea los 6 PDFs → tabla `sections`, y genera ~200 tarjetas (pedagogos, audio, cloze, recuerdo de estructura).

### 4 · Arrancar

```bash
pnpm dev
```

→ [http://localhost:3131](http://localhost:3131)

## Variables de entorno

Edita `.env.local` (ya está configurado con tus claves de Supabase):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # cliente (safe)
SUPABASE_SERVICE_ROLE_KEY=...              # server ONLY — nunca commit
ADMIN_PASSWORD=...                         # para /admin
```

## Flujo de feedback (Claude asíncrono)

No hay llamadas de API a Claude desde la app. Es un relé manual:

1. Ella entra en `/ensayos/nuevo`, elige un tema, escribe el desarrollo, le da a **Enviar**.
2. El marido abre `/admin` (con su contraseña), ve el ensayo pendiente.
3. Pulsa **Copiar prompt completo para Claude** → se copia el ensayo con las instrucciones de revisión.
4. Lo pega en su chat de Claude → recibe el feedback.
5. Copia el feedback, lo pega en el cuadro de la derecha, pulsa **Publicar**.
6. Ella entra a `/ensayos/[id]` y ve el feedback.

## Desplegar en Vercel

```bash
pnpm dlx vercel@latest
# O desde Vercel dashboard: importar el repo
```

En Vercel añade las mismas variables de entorno en *Settings → Environment Variables*.

## Rutas

- `/` — Inicio con racha, pendientes, accesos directos
- `/temas` — Índice del temario
- `/temas/[id]` — Árbol de un tema
- `/repaso` — Tarjetas SRS (atajos: Espacio para revelar, 1-4 para calificar)
- `/simulador` — Simulador cronometrado
- `/juegos` — Hub de mini-juegos
- `/oido` — Entrenamiento auditivo
- `/debilidades` — Heatmap de dominio
- `/ensayos` — Lista de tus ensayos
- `/ensayos/nuevo` — Escribir uno
- `/ensayos/[id]` — Leer un ensayo + su feedback
- `/admin` — (contraseña) revisar ensayos pendientes

## Troubleshooting

- **"Could not find the table 'public.temas'"** → Paso 2 pendiente: pega `supabase/schema.sql` en el SQL editor.
- **No suena audio** → Haz clic en la página primero; los navegadores bloquean audio sin interacción.
- **Tema sin subsecciones** → El parser de PDF no reconoció el formato; abre un issue y comparte el PDF.

## Seguridad

- Las claves que están en `.env.local` fueron compartidas en chat durante el setup — **rota tanto la publishable como la service role** en Supabase cuando puedas.
- El token `sbp_` de Supabase y el `vcp_` de Vercel que se compartieron durante el desarrollo **deberían revocarse**, no son necesarios para la app.
