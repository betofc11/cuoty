# Cuoty

PWA de finanzas compartidas del hogar + lista de compras. Español de Costa Rica,
mobile-first (390×844). Uso real: una casa con varias personas que reparten gastos.

## Stack — decidido, no lo cuestionés

Next.js App Router (v16, `proxy.ts` en vez de `middleware.ts`) · TypeScript strict ·
Tailwind v4 · Supabase (Postgres, Auth, RLS, Realtime, Storage) · PWA.

Proyecto Supabase: `uhqgwhbuezfvaltgumap`.

## Invariantes del dominio

Romper cualquiera de estas es un bug, aunque el código compile.

1. **El saldo nunca se guarda.** Es `sum(ledger_entries) − sum(payment_allocations)`
   sobre todos los períodos con saldo vivo, abiertos Y cerrados.
2. **Contabilidad append-only.** `ledger_entries`, `payments`, `payment_allocations`
   y `period_carryovers` no tienen política de UPDATE ni DELETE, y un trigger
   `forbid_mutation` lo refuerza. Corregir = asiento compensatorio nuevo.
   De ahí sale que los gastos se **anulan** (`voided_at`), no se borran.
3. **`period_carryovers` es una foto congelada**, para mostrar y auditar. Nunca es
   insumo del cálculo del saldo. Y ojo: **congelada de verdad.** Se escribe al
   cerrar y nunca se actualiza, pero un mes cerrado **sigue recibiendo abonos**
   (`allocate_payment` no mira el estado del período). Apenas alguien abona, la
   foto deja de ser lo que se debe. Para «cuánto falta de ese mes» va
   `period_balances`; el carryover solo dice cuánto había *al cerrar*.
4. **CRC y USD jamás se suman.** Lo impide el tipo (`NoInfer` en el segundo operando
   de `add`/`subtract` en `lib/money`), un guard en runtime, y `MoneyPair` para
   mostrarlos en paralelo. `lib/money/money.type-test.ts` es un guardia permanente:
   tiene `@ts-expect-error` que fallan si alguien afloja el invariante.
5. **Plata como enteros de unidad mínima**, nunca float. En la base, `numeric`.
6. **El residuo va al admin.** El sobrante de redondear porcentajes lo absorbe
   siempre el admin activo más viejo (`house_residue_admin`), para que los cargos
   sumen exacto al gasto.
7. **El rol es por casa.** La misma persona puede ser admin en una y miembro en otra.
8. **Toda la seguridad vive en RLS.** Asumí que el frontend es manipulable. Ninguna
   comprobación de permisos en el cliente es una defensa.
9. **Mes en `America/Costa_Rica`**, nunca UTC. Parseá los ISO a mano: `new Date('2026-09-01')`
   da medianoche UTC, que en CR es el día anterior.
10. **En la lista de compras no hay roles**: cualquier miembro agrega, marca y borra.
    Lo único de admin son las tiendas. Y ahí sí se borra de verdad — no lleva contabilidad.

## Convenciones

- Tablas y columnas en **inglés**; todo el texto de UI en **español de CR**.
  Se escribe «setiembre», no «septiembre». Voseo: «anotá», «probá», «tenés».
- Tipos **generados** del esquema real (`generate_typescript_types` del MCP de
  Supabase) → `types/database.ts`. Nunca escribas ese archivo a mano.
- Server Components por defecto. Cliente solo donde hace falta interactividad.
- Una migración por fase, con nombre descriptivo, vía el MCP de Supabase.
  (Las migraciones viven en Supabase, no hay archivos en `supabase/migrations/`.)
- **Íconos siempre con texto al lado.** Un ícono va solo únicamente si cumple las
  tres: forma convencional (engranaje, más, embudo), `aria-label` propio, y sitio
  donde no queda espacio para la palabra. Hoy son dos: la tuerca del selector de
  casas y el `+` de la barra de alta de Compras. El embudo y la escoba de los
  filtros de Compras se fueron en la fase 2 del rediseño: las tiendas pasaron a
  chips a la vista y las etiquetas a un botón con su palabra. Si vas a agregar
  un tercero, primero probá si cabe el texto.
- Target táctil mínimo 48×48 (`min-h-touch`). Tipografía base 16px, no bajar.
- **Contraste: todo texto pasa 4,5:1 y todo borde de campo 3:1, en los dos temas.**
  `npm run contraste` lo verifica leyendo `app/globals.css`; si agregás un par de
  colores nuevo a la UI, sumalo a `scripts/contraste.mjs`. Texto sobre un relleno
  de color (`bg-marca`, `bg-peligro`, `bg-ok`) va en `text-sobre-relleno`, nunca en
  `text-white`. `text-white` queda solo en los chips de casa, que tienen paleta fija.
- Los campos (`input`, `select`, `textarea`) llevan `border-borde-control` y
  `focus:ring-1 focus:ring-marca`; las tarjetas y los botones, el `border-borde` suave.
- Toda vista necesita sus estados: cargando, vacío, error, sin señal.
  Ojo: «lista vacía» y «el filtro no encontró nada» son pantallas distintas.

### El marco (fase 2 del plan de diseño)

- **Las cuatro pestañas viven en `app/(tabs)/`** (`page.tsx` es `/`, más `gastos`,
  `saldos` y `compras`), y su `layout.tsx` monta el `Shell`. Así el marco no se
  desmonta al cambiar de pestaña: antes cada página traía su `Shell` y el
  `loading.tsx` de la raíz lo reemplazaba entero en cada toque. Cada pestaña trae su
  `loading.tsx` con su forma y el grupo trae su `error.tsx`, los dos dentro del marco.
- **Las pantallas de detalle quedan fuera del grupo** (`app/gastos/nuevo`,
  `app/saldos/[membershipId]`…): pantalla completa, con «Volver» y sin tabs.
  Comparten carpeta de nombre con su pestaña (`app/gastos/` y `app/(tabs)/gastos/`)
  y Next lo acepta porque ninguna ruta se repite.
- **Ancho:** `max-w-app` (28rem, en `@theme` de `globals.css`) para el contenido.
  Las barras van a todo el ancho y solo su contenido se limita: en un iPhone más
  ancho que la columna, las barras cortadas dejaban franjas del fondo a los lados.
- **Abajo:** las pantallas sin tabs terminan en `pb-seguro` (20px más el indicador
  de inicio), y la acción final de un formulario largo va en `<AccionFija>`
  (`components/ui/accion-fija.tsx`), anclada al pie mientras se recorre. En las
  pestañas, la acción principal va sobre las tabs con `<AccionDePie>` (ver las
  trampas).
- **Elegir de una lista va en una `<Hoja>`** (`components/ui/hoja.tsx`), que es un
  `<dialog>` que sube desde abajo, al alcance del pulgar. Así son hoy el selector de
  casa y el de mes. Nada de menús que se abren arriba.
- **La barra de arriba es del color del fondo**, como el `theme-color`, para que no
  haya costura con la barra de estado de iOS.

### Compras (rediseño de octubre de 2026)

Salió de una auditoría de UX: la lista estaba diseñada para organizar y se usa para
comprar. Cada fila apilaba cuatro capas (nombre, etiquetas con tienda, nota, autoría)
y en el iPhone cabían tres. El principio: **la lista es para comprar; organizar va
aparte.** Hay cinco fases y se para al final de cada una.

Fase 1, hecha:
- **Fila de una línea**: nombre y cantidad pegada («Leche · 2»). La segunda línea
  sale solo con nota o fotos. Tienda, etiquetas y «Agregado por» no van en la fila.
  Con nombre largo se corta el nombre, nunca la cantidad.
- **Toda la fila marca** (`<button role="checkbox">`), optimista con estado propio
  y **no** con `useOptimistic` (ver «Una transición async congela las pestañas» en
  las trampas). «Editar» va al final, con su palabra, y abre `/compras/[itemId]`.
  Antes el toque grande abría el detalle, que es lo más raro en el súper.
- **Agrupada por tienda** (`lib/compras/grupos.ts`), por nombre y con la
  predeterminada al final como «En cualquier tienda». Revierte la lista plana de
  antes: agrupar «partía la lista» cuando las filas tenían cuatro renglones.
- **«Comprado hoy»** es su propia sección, lo último primero, con quién lo marcó y
  sin «Editar». Lo de antes sigue en el acordeón, y ahí sí lleva «Editar».
- `marcarComprado` devuelve el error en vez de tragárselo. La fila lo muestra y la
  tilde se revierte sola.

Fase 2, hecha (filtrar por la tienda donde estás):
- **Chips de tienda a la vista**, en un `Carrusel`: «Todo» primero, después cada
  tienda con lo pendiente propio. La predeterminada no lleva chip. El chip elegido
  se trae a la vista: al final de la fila quedaba tapado contra el borde.
- **Elegir una tienda suma lo de «Cualquiera»** (`enLaTienda` en
  `lib/compras/consultas.ts`): antes el filtro lo escondía, y en la casa real era
  la mayoría de lo pendiente. Lo de las demás tiendas queda plegado en «En otras
  tiendas» (`partirPorTienda` en `lib/compras/grupos.ts`), no escondido. La tienda
  y la etiqueta de la URL se validan contra las de la casa.
- **Etiquetas en una `<Hoja>`** (`app/compras/filtro-etiquetas.tsx`), detrás de un
  botón «Etiquetas» fijo a la derecha. Con una puesta, el botón cede su lugar al
  chip de esa etiqueta, en su tono y con su ×.
- Tres vacíos: «Ya está todo comprado», «Nada pendiente con esos filtros» y
  «Nada pendiente en Walmart» (cuando lo que falta es de otras tiendas).
- Los enlaces del pie pasaron a «Editar etiquetas» y «Editar tiendas»: el botón de
  filtrar ya se llama «Etiquetas», y dos controles con el mismo nombre que hacen
  cosas distintas no se distinguen.

Fases que faltan, con el usuario ya de acuerdo:
3. **Editar en una `<Hoja>`** que guarda cada campo al tocarlo, con la tienda en
   chips. Después de anotar, una tira «¿Dónde se compra?» de un toque (82 % de los
   items de la casa real terminaban movidos a mano a una tienda). Aviso de
   «Ya está en la lista» al escribir un duplicado.
4. Encabezado, buscador (se va el de arriba) y una sola sección «Comprado».
5. Más adelante, con datos: que `add_shopping_item` recuerde la última tienda de
   cada producto. Hoy casi no se repiten productos y no acertaría.

## Auth y correo

Se entra con un **código numérico** que llega por correo, o con Google. No hay
contraseñas ni enlaces mágicos.

- **Los enlaces mágicos están descartados a propósito, no por gusto.** En iOS una
  app agregada a la pantalla de inicio tiene su **propio frasco de cookies**,
  separado del de Safari. Con flujo PKCE (el de `@supabase/ssr`) la cookie
  `code_verifier` queda del lado de la PWA, el enlace abre en Safari, y el
  `exchangeCodeForSession` falla. No hay forma de que un enlace abra dentro de una
  PWA instalada en iOS. El código se escribe en la misma pestaña que lo pidió, y
  por eso funciona.
- **Supabase manda DOS plantillas distintas**: «Confirm sign up» la primera vez y
  «Magic link or OTP» de ahí en adelante. Si tocás una sola, quien se registra por
  primera vez —justo a quien más le importa— recibe la otra. Las dos llevan
  `{{ .Token }}` y ninguna `{{ .ConfirmationURL }}`.
- **El largo del código es configuración, no constante.** «Email OTP Length» del
  panel acepta de 6 a 10 y hoy está en **8**. Nunca lo claves en el código ni en
  los textos de la UI: `verificarCodigo` solo exige un mínimo y deja que el
  servidor juzgue. Clavarlo en 6 truncaba el código bueno y rompía todos los
  ingresos.
- `type: 'email'` en `verifyOtp` cubre **los dos** tipos de token, el de registro y
  el de reingreso, incluso con el prefijo `pkce_`. Está probado; no lo cambies por
  `'signup'` ni `'magiclink'`.
- **El correo sale por Resend**, dominio `cuoty.xyz`, remitente
  `no-responder@cuoty.xyz` — que no existe como buzón y no hace falta que exista.
  El SMTP de prueba de Supabase eran **2 correos por hora en todo el proyecto** y
  bloqueaba a la gente en su primer intento.
- **El nombre visible sale siempre de `profiles.display_name`**, nunca de
  `user_metadata.full_name` — esa solo la llena Google. Es lo que ve toda la casa
  en los saldos y en cada abono. Vacío significa «todavía no lo puso» y dispara
  `/bienvenida`, que no deja pasar sin nombre.

Ojo: **plantillas, SMTP, rate limits y largo del OTP se configuran a mano en el
panel de Supabase.** El MCP expone migraciones y SQL, no la configuración de Auth:
esos pasos hay que pasárselos al usuario.

## Diseños

Viven en **`design/`**. Cuando el usuario mencione «el diseño», «el prototipo» o
una pantalla concreta, buscá ahí primero — no pidas que te lo pegue.

`design/Cuoty.html` es el prototipo original de toda la app.

Dos cosas sobre cómo usarlos:

- **Mandan en lo visual y en el flujo, NO en el comportamiento.** Donde el
  prototipo contradiga a los invariantes de arriba, ganan los invariantes. El
  prototipo se dibujó antes que las reglas de negocio.
- **`Read` no sirve** con `Cuoty.html`: viene empaquetado en una sola línea de
  ~108k tokens y se come la ventana de contexto entera. Servilo con
  `preview_start` y leelo con `get_page_text` desde el navegador.

La carpeta está fuera de `app/` y de `public/` para que Next no la sirva ni la
empaquete: los diseños no van a producción.

**Tres desvíos del prototipo, aprobados por el usuario el 20/10/2026.** Salieron
de la revisión de diseño y acá ya no manda `Cuoty.html`:

1. **La plata va en tinta.** Sin color por moneda: terracota para colones y teal
   para dólares es del prototipo y quedó atrás. El ₡ o el $ dicen la moneda y solo
   los dólares llevan chip (`ChipMoneda` devuelve `null` para CRC).
2. **Fondo piedra (`#efede9`), no crema.** El crema con terracota es la paleta por
   defecto de las interfaces generadas.
3. **Sin mayúsculas espaciadas como títulos.** Las etiquetas tipo «MI SALDO
   PENDIENTE» pasaron a títulos de verdad (fase 3). Queda en mayúscula solo el
   campo del código de invitación, porque ahí es el formato del código.

Los estilos de texto que quedaron (fase 3):

| Qué | Clases |
| --- | --- |
| Título de pantalla (`h1`) | `text-tinta text-xl font-semibold` |
| Sección (`h2`) | `text-tinta text-base font-semibold`, en sentence case |
| Rótulo chico que no es título | `text-tinta-suave text-sm font-medium` |
| Etiqueta de campo | la de `components/ui/field.tsx`: `text-tinta text-base font-medium` |

Cada pantalla abre con su `h1`, y el texto gris va para datos, no para explicar la
interfaz: una frase de ayuda se queda solo si evita un error.

La regla de color que salió de ahí (fase 1, ya hecha):

| Uso | Token | Ejemplos |
| --- | --- | --- |
| Acción | `marca` | logo, botón principal, pestaña activa, enlaces |
| Selección | `tinta` | moneda elegida, método de pago, tienda activa, casillas |
| Estado | `ok` / `peligro` | al día, a favor, abonos, errores, anular |
| Plata | `tinta` | todos los montos |

`marca` era `crc`: se renombró porque el terracota ya no significa «colones».

Una excepción a «enlaces en marca»: **la acción que se repite en cada fila** («Editar»
en Compras) va en `tinta-suave`. En terracota serían siete palabras de acción
compitiendo con los productos; la acción principal de esa fila es tocarla. La de
una sola por pantalla o por sección («Editar» de un gasto, «Editar %») sigue en marca.

**Identidad (fase 4, la última del plan de diseño):**

- **Cada persona tiene un tono en su casa**: `--persona-N-fondo` y `--persona-N-tinta`,
  N de 1 a 6, pálidos y con su tinta oscura, lejos del terracota y del carmesí. Lo
  reparte `personasDeLaCasa()` (`lib/casas/personas.ts`) por posición de ingreso,
  **contando también a quienes ya se fueron**: si no, la salida de alguien le
  cambiaría el color a todos los que entraron después. Ese archivo es solo de
  servidor (lee la sesión): a un componente cliente le llegan la inicial y el tono
  ya calculados, como al editor de porcentajes.
- **`<Avatar>`** (`components/ui/avatar.tsx`): la inicial en su tono, siempre con el
  nombre escrito al lado. Está en la barra de arriba (mi tono en la casa activa),
  «La casa» del inicio, Saldos, el detalle de saldo, `/casa` y los repartos. En
  Compras no, a propósito: la fila es de una línea y no nombra a nadie, salvo quién
  marcó en «Comprado hoy», donde el ancho es del producto.
- **Casa saturada, persona pálida.** Las casas (`lib/casas/color.ts`) van en color
  fuerte con letra blanca; las personas, pálidas con letra oscura. Así un chip de
  casa no se confunde con un avatar. El terracota y el ladrillo de la paleta de
  casas pasaron a azul pizarra y ciruela (el terracota es de la marca).
- **`<BarraDeReparto>`** (`components/gastos/reparto.tsx`): un segmento por persona
  en su tono, con la leyenda en texto. Está en cada lista de Gastos (los porcentajes
  vigentes, solo con el mes abierto), en el detalle del gasto (el
  `percent_applied` real) y en vivo en el editor de porcentajes.
- **Ícono:** la misma «c», recoloreada a `#a14a26` con letra `#fffefc`, mezclando
  cada píxel en la misma proporción para no perder el antialias. iOS guarda el
  `apple-touch-icon` en caché: para ver uno nuevo hay que sacar la app de la pantalla
  de inicio y volver a agregarla.

**Skill `design-taste-frontend`** (taste-skill, de `Leonxlnx/taste-skill`): vive en
`.claude/skills/design-taste-frontend/`, instalada con
`npx skills add Leonxlnx/taste-skill -a claude-code -y --copy`; `skills-lock.json` la
registra y `npx skills update` la actualiza. Sus scripts dejan trabajo en
`.taste-skill/`, que está en `.gitignore`. Su estilo de la casa (sin íconos sueltos,
sin ornamentos) es una guía de gusto, **no manda**: el prototipo de `design/` y las
convenciones de este archivo —íconos con texto, `min-h-touch`, 16px, voseo— le ganan.

- **Su `lint.mjs --app` falla sobre Cuoty, y no todo es un error.** Las etiquetas
  chicas en mayúscula espaciada sí se van (desvío 3, arriba). El degradado de
  `compras/carrusel.tsx` es una máscara que desvanece los chips en el borde, no un
  relleno. El `animate-pulse` de `loading.tsx` es el esqueleto de carga, y las
  sombras de los selectores son menús flotantes, que su propia regla permite. No
  «arreglés» sus FAIL a ciegas.
- **En el contenedor de la nube el inspector no arranca solo.** No encuentra el
  Chromium de Playwright y, como corre de root, Chrome exige `--no-sandbox`. La
  skill no acepta flags extra, así que va un envoltorio (fuera del repo, para no
  tocar la skill y que `npx skills update` siga limpio):
  `printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' > chrome.sh`,
  `chmod +x` y `CHROME_PATH=$PWD/chrome.sh`. En una Mac encuentra Chrome sin ayuda.
- **Con el proyecto real no hay sesión en la nube.** El modo automático bloquea
  fabricar una (ponerle contraseña temporal a un usuario del seed, o mockear la
  sesión contra Supabase de verdad). Para ver la app logueada con datos de
  mentira está el Supabase falso de las pruebas (ver «Pruebas»). Para cómo se ve
  en el teléfono, con datos reales, pedile al usuario capturas del iPhone, en claro
  y en oscuro.

## Pruebas

`npm run test:e2e` corre Playwright (`tests/e2e/`) contra la app de verdad,
compilada como en producción, y un **Supabase falso** que vive en memoria
(`tests/e2e/falso/supabase.mjs`, sin dependencias). Ese falso imita lo justo que
usa Cuoty: `GET /auth/v1/user` con el token de prueba y PostgREST con `eq`, `in`,
`is`, `order`, `limit`, `single` y escrituras. Arranca siempre con la casa de
`tests/e2e/falso/datos.mjs` (inventada) y tiene tres palancas que las pruebas usan:
`/__reiniciar`, `/__demora?ms=` (la señal del súper) y `/__fallar?tabla=`. No toca
el proyecto real, así que se puede correr en la nube y con sesión.

- **No hay RLS en el falso.** Las pruebas de permisos van impersonando en SQL contra
  la base real (ver las trampas). Si una pantalla nueva usa un operador de
  PostgREST que el falso no conoce, el falso lo dice con un 500 en la salida.
- **El build de las pruebas lleva adentro la URL del falso** (las `NEXT_PUBLIC_*`
  se escriben al compilar). Después de correrlas, volvé a compilar antes de un
  `next start` contra Supabase de verdad.
- Solo Chromium, con pantalla de iPhone y toques. En una Mac, la primera vez:
  `npx playwright install chromium`. En el contenedor de la nube ya está.
- `tests/e2e/navegacion.spec.ts` es el guardia de la barra de pestañas: prueba
  cada pestaña desde cada pantalla y también **con una acción en vuelo**, que es
  como se rompió, y **un rato después de cargar Compras**, que es como se rompió
  la segunda vez. Lo de Compras (marcar, deshacer, fallos, sin señal) está en
  `compras.spec.ts`, y los filtros por tienda y etiqueta en `filtros.spec.ts`.
- **Para cortar los servidores de prueba, buscá por nombre de proceso**
  (`ps -eo pid,comm`, el que se llama `next-server`), nunca con `pkill -f`: el
  patrón también aparece en la línea de comando de tu propia terminal y te la
  corta. Y si un `next-server` viejo queda vivo mientras recompilás, sigue
  sirviendo con el `.next` nuevo por debajo y la página revienta en «Algo se
  rompió»: parece un bug de la app y no lo es.

## Cómo trabajar acá

- **Parás al final de cada fase.** Mostrás qué se construyó, qué decisiones tomaste
  que no estaban en el documento, y esperás aprobación. No encadenés fases.
- **Bash está bloqueado** en este entorno (falla el proxy corporativo), y tampoco
  hay Glob ni Grep. El rodeo es `.claude/launch.json`: agregale una entrada con el
  comando (`runtimeExecutable` + `runtimeArgs` y un puerto de mentira) y correla con
  `preview_start`, que devuelve la salida — código 0 sin texto es que pasó limpio.
  Sirve para `tsc`, para `next build` y para un `grep` puntual. **Ese archivo está
  en `.gitignore`**, así que las entradas son locales y hay que rehacerlas en cada
  clon; conviene dejar fijas `typecheck` (con `--incremental false`, ver abajo),
  `build` y `contraste`. Lo que toque correr de verdad al usuario, pasáselo en un bloque ```bash.
- **Verificá manejando la UI de verdad**, no solo con `tsc`. Los bugs que más han
  dolido acá —casas duplicadas, la tuerca que no salía, Realtime mudo, el 404 al
  borrar, el campo del código que truncaba a 6 dígitos uno de 8— no los agarra el
  tipado. Impersonar usuarios en SQL también sirve.
- Antes de sobrescribir un archivo, leelo. Si ya existía, decilo.
- **Anotá acá lo que aprendas.** Cada vez que aparezca algo que le habría ahorrado
  tiempo a quien venga después —una trampa, una decisión con su porqué, una
  configuración que vive fuera del repo, un invariante nuevo— sumalo a este archivo
  en la sección que corresponda, en la misma pasada. Un CLAUDE.md desactualizado
  hace más daño que uno corto: manda a la gente con confianza en la dirección
  equivocada. Si algo de acá ya no es cierto, borralo.

## Trampas ya pisadas — no las repitas

- **`revoke ... from public` NO alcanza.** Supabase tiene `ALTER DEFAULT PRIVILEGES`
  que le da EXECUTE a `anon` **directamente**. Hay dos vías de concesión y hay que
  cerrar las dos.
- **Realtime necesita `setAuth(token)` ANTES de suscribirse.** Sin eso el servidor
  evalúa RLS como anónimo, no manda ningún evento y **no reporta error**. Mirá
  siempre el status del `.subscribe()`.
- **DELETE por Realtime necesita `replica identity full`**, o el payload trae solo
  la PK y el filtro por casa descarta el evento.
- **`sw.js` va fuera del matcher de `proxy.ts`.** Un redirect al pedir el script de
  un service worker es error duro por especificación.
- **Las variables de entorno se validan al usarlas, no al importar el módulo**
  (`lib/supabase/env.ts` exporta funciones). Como constantes, `next build` reventaba
  al recolectar la configuración de las rutas.
- **RLS deja ver toda la casa.** Filtrá siempre por `membership_id` o `house_id` en
  la consulta; si no, se mezclan los datos de otras personas y de otras casas. Esto
  ya causó un bug de saldos inflados.
- **`.like('month', '2026-08%')` sobre una columna `date` no matchea nada.** Usá `.eq`.
- **Los únicos por nombre necesitan `lower(btrim(name))`**, o «despensa» y «Despensa»
  conviven. `unaccent` es STABLE y no puede ir en un índice.
- **Safari ignora `autoComplete="off"`** y clasifica por el `name`/`id`. Un campo
  llamado `nombre` lo toma por titular de tarjeta y ofrece los datos de pago. Por
  eso `crearCasa` recibe `casa` y `guardarNombre` recibe `apodo`.
- **`useState(prop)` no se actualiza** cuando la prop cambia por navegación. Si un
  input refleja un parámetro de la URL, sincronizalo a mano.
- **React 19 limpia los campos del formulario después de correr su `action`.** Un
  `defaultValue` nuevo NO los repone: el input ya está montado y React no vuelve a
  mirar ese atributo. Si el valor tiene que sobrevivir a un error, el input va
  **controlado**. Sin esto, el correo recién escrito se borraba en cada error.
- **Un archivo `'use server'` solo puede exportar funciones async.** Una constante
  exportada rompe el build entero. Por eso `LARGO_MAXIMO_NOMBRE` vive en
  `lib/perfil/nombre.ts` y no junto a la acción que la usa.
- **El `className` de un componente propio se pisa con el spread.** Si el JSX es
  `<input className="…" {...props} />`, pasarle un `className` **borra** los estilos
  base en vez de sumarse. Hay que concatenarlo a mano (ver `components/ui/field.tsx`).
- **`npm run typecheck` miente con la caché.** `tsconfig.tsbuildinfo` guarda rutas
  que ya no existen y `tsc` sigue reportándolas después de agregar una página,
  aunque los archivos generados estén bien. La entrada `typecheck` de
  `launch.json` corre con `--incremental false` justo por eso. Pasa lo mismo al
  **mover** una página: `.next/types/validator.ts` sigue apuntando a la ruta vieja
  hasta el próximo `next build` o `next dev`, y `tsc` falla con «Cannot find module».
- **Un `<dialog>` no lleva clases de display** (`flex`, `grid`, `block`): pisan el
  `display: none` con el que el navegador lo esconde cerrado, y queda siempre a la
  vista. El layout va en un `div` de adentro (ver `components/ui/hoja.tsx`).
- **Lo que vive en el layout de las tabs no se desmonta al navegar**, así que su
  estado sobrevive. El selector de casa se cierra solo porque escucha el cambio de
  `activa.id`; si agregás otro control con estado al `Shell`, pensá cuándo se resetea.
- **La acción anclada sobre las tabs la pone la página, con `<AccionDePie>`**
  (`components/shell/accion-de-pie.tsx`): un portal hacia el `div` vacío que el
  `Shell` deja ahí. Así son el alta de Compras y «Agregar gasto». Probamos dos
  cosas que no sirvieron. Un slot paralelo (`@pie`): en una navegación del lado
  del cliente, un slot sin página para la ruta nueva se queda mostrando la
  anterior. Y un componente del layout que mirara la ruta: no sabe si sos admin
  ni si el mes está abierto. Un `sticky` dentro de la página tampoco sirve, porque
  las tabs ya ocupan el `bottom-0`.
- **Las variables de Vercel estaban solo en Production**, y los previews se
  construían sin Supabase: cada pantalla con datos reventaba. Desde el 20/10/2026
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` están también en
  Preview. `NEXT_PUBLIC_SITE_URL` queda solo en Production a propósito: en un preview
  `siteUrl()` cae a producción, así que ahí Google vuelve a producción y el correo
  funciona.
- **Un 401 en `POST /auth/v1/otp` es la clave pública mal puesta** (una vieja en
  `.env.local`). La app lo mostraba como «No se pudo completar»; ahora dice «La app no
  pudo hablar con su servidor» y las acciones de login escriben el error crudo en la
  terminal. Para diagnosticar auth sin la terminal del usuario: `query_logs` del MCP
  de Supabase, fuentes `auth_logs` y `edge_logs`.
- **Google en local necesita `http://localhost:3000/**` en las Redirect URLs de
  Supabase** (Authentication → URL Configuration). Si el `redirectTo` no está en
  esa lista, Supabase no da error: manda al Site URL, que es producción. Y fijate el
  puerto: si `next dev` cae en el 3001, `NEXT_PUBLIC_SITE_URL` tiene que decir 3001.
- **Comentarios**: `/* ... */` dentro de un bloque `/** ... */` lo cierra antes.
- **`close_period` hace dos cosas de más**: crea el período siguiente si no existe y
  le corre `generate_recurring_expenses`. Al cerrar meses viejos en lote, el último
  cierre apunta al mes vivo. No duplica —la función se salta la plantilla que ya
  tiene gasto en ese período— pero si una plantilla todavía no se generó ahí, se
  genera sola. Revisá `recurring_templates` antes de cerrar nada en lote.
- **Impersonar en SQL de verdad** (lo que el MCP corre como `postgres` bypassea RLS):
  los dos `set_config` van en **sentencias separadas, antes de la consulta**, en la
  misma llamada a `execute_sql` (corren en una sola transacción, así que el `true`
  de «local» los mantiene). Mirá `current_user` en el resultado: tiene que decir
  `authenticated`.

  ```sql
  select set_config('request.jwt.claims',
           json_build_object('sub','<user_id>','role','authenticated')::text, true);
  select set_config('role','authenticated', true);
  select current_user, /* la consulta */ ...;
  ```

  **Ojo, esto corrige una receta vieja de acá.** Con los `set_config` en el `FROM` y
  la consulta en un `LATERAL`, todo en la misma sentencia, el RLS de las tablas NO
  se aplica: la consulta se planifica todavía como `postgres`. Solo andaban las
  funciones que leen el claim al ejecutarse (`app.is_house_admin`, `close_period`).
  Con esa receta, Rodrigo «veía» las membresías de Apto Escalante, que no es su casa.
  Fue un falso positivo de la prueba, no una fuga real: una prueba de RLS hecha así
  no prueba nada.

  Sin el claim, `app.is_house_admin` da false y `close_period` levanta 42501. Para la
  autoría alcanza `cuoty.actor_id`, que `current_actor()` mira antes que `auth.uid()`.
- **Un efecto sin dependencias que llama a `setState` es un bucle esperando a
  pasar.** El `Carrusel` de Compras medía su scroll en `useEffect(medir)`, que corre
  después de cada render, y `medir` llamaba a `setLados` con un updater que
  devolvía el mismo objeto si nada cambiaba. Igual, en dos de cada tres cargas
  entraba en un bucle de unos 3.800 renders por segundo que no cambiaba nada en
  pantalla y no dejaba a React terminar ninguna transición: las pestañas no
  navegaban desde Compras. Se midió, no se dedujo (un contador en el render y otro
  en `medir`). En la fase 1 no se notaba porque el carrusel casi nunca se mostraba.
  Ahora mide en un solo efecto con observadores (scroll, `ResizeObserver`,
  `MutationObserver`) y compara contra una ref **antes** de llamar a `setLados`.
- **Una transición async congela las pestañas.** React junta todas las
  transiciones en curso: mientras una espera al servidor, no aplica ninguna otra,
  y la navegación de Next es una transición. `useOptimistic`, `useActionState` y
  `<form action>` corren la acción en una transición async, así que en una pestaña,
  tocar la barra justo después de marcar o de agregar no hacía nada hasta que
  volvía la respuesta (y con mala señal, nunca). Pasaba igual en `main`, con el
  formulario de antes. En una pestaña, una acción que la gente hace y sigue de largo
  (marcar, agregar) se llama **como función, fuera de toda transición**, con el
  estado optimista a mano: ver `useMarcar` en `app/compras/fila-item.tsx` y
  `app/compras/agregar.tsx`. La navegación descarta la acción pendiente, pero el
  pedido ya salió y el servidor lo termina («The destination stream closed early»
  en el log es eso, no un error). «Quitar los comprados» sigue como `<form action>`
  a propósito: es en bloque y uno espera a que termine.
- **Nunca hagas `git checkout CLAUDE.md` para limpiar algo**: se lleva también lo
  que escribiste y todavía no commiteaste. Ya pasó una vez.
- **`next dev` 16.3 agrega un bloque de reglas al final de CLAUDE.md** (el de
  «nextjs-agent-rules», entre dos comentarios HTML) cada vez que arranca. Está
  apagado con `agentRules: false` en `next.config.ts`, a pedido del usuario: no lo
  saqués. Si alguna vez vuelve a aparecer, **nunca escribas acá el comentario de
  apertura literal:** `next dev` busca la primera aparición y reemplaza desde ahí
  hasta el cierre, y se llevaría todo lo que haya en el medio. Y si cortás `next dev` a mitad de una compilación,
  `.next/dev/types/validator.ts` puede quedar a medio escribir y el próximo
  `next build` falla en el typecheck: `rm -rf .next/dev`.
- **Una Server Action llamada como función puede rechazar sin que falte señal.**
  `marcarComprado` se llama dentro de un `try/catch` y los errores de la base vuelven
  como `{ error }`, pero al `catch` llegan también: el redirect de `requireUser`
  (dejalo seguir con `unstable_rethrow`), el `UnrecognizedActionError` de una PWA
  abierta desde antes de un deploy (el id de la acción cambió y cada toque falla
  hasta recargar: `unstable_isUnrecognizedActionError`), y cualquier respuesta que
  no sea de Next. `navigator.onLine` solo es confiable cuando dice `false`: en iOS
  da `true` con señal débil. Ver `app/compras/fallo.ts`.
- **Los `timestamptz` de PostgREST no tienen largo fijo**: Postgres recorta los ceros
  de los milisegundos («…12+00:00» al lado de «…12.5+00:00»). Para ordenar, usá
  `Date.parse`, no comparación de texto.
- **`shopping_items_status_shape` exige `archived_at` nulo para `pending` y
  `purchased`.** Marcar o desmarcar algo archivado lo rechaza el CHECK (23514).
  Filtrá con `.is('archived_at', null)` y tratalo como «ya no está en la lista».
- **Los asientos de una misma transacción comparten `created_at`**: `now()` es el
  arranque de la transacción, no del `insert`. En `/saldos/[id]` salen en orden
  arbitrario entre ellos. Si el orden importa, separá las transacciones.
- **Las tarjetas de arrastre mostraban la foto del cierre, no lo que falta.** Un
  mes cerrado y después abonado seguía anunciando «1 miembro debe ₡16.604» ya
  saldado, y la tarjeta no desaparecía nunca: `close_period` solo escribe
  carryovers distintos de cero, así que el filtro `monto === 0` no descartaba
  nada. Ahora el monto sale de `period_balances` y el carryover se muestra como
  línea secundaria solo cuando difiere. Las dos fuentes tienen **la misma policy**
  (admin ve la casa, miembro solo lo suyo), así que el cambio no movió los
  alcances. Queda un borde preexistente: un saldo **a favor** cuenta como
  «miembro debe», porque solo se filtra el cero.
- **El blanco sobre el terracota del modo oscuro daba 3,07:1.** En oscuro los
  rellenos de color son claros (`#d97a4e`, `#f0707f`, `#6bbf85`), así que el texto
  encima tiene que ser oscuro. Por eso existe `sobre-relleno`. Lo mismo le pasaba a
  la tilde de «comprado»: blanco sobre el verde oscuro daba 2,2:1.
- **Los buffers de `read_console_messages` y `preview_logs` son acumulativos.** Un
  error de un render intermedio —típico entre dos ediciones, cuando el JSX ya usa
  algo que todavía no se importó— sigue apareciendo después de arreglarlo, y
  `console.clear()` no lo borra. Antes de perseguirlo, mirá si el conteo *crece*
  al navegar de nuevo y si el `GET` da 200.

## Estado y huecos conocidos

Funcionando: auth (código por correo + Google) con SMTP propio en Resend, nombre de
perfil editable en `/cuenta` y obligatorio en `/bienvenida`, onboarding, gastos con
listas y porcentajes, recurrentes, saldos y abonos, cierre de mes con arrastres,
lista de compras completa (tiendas, etiquetas, filtros, búsqueda, comprados,
Realtime, fotos en Storage), PWA instalable con tema claro/oscuro y service worker.

El plan de la revisión de diseño (octubre de 2026) está completo en sus cuatro
fases: contraste y color, el marco en el iPhone, jerarquía y textos, e identidad.
Lo que salió de ahí está en «Diseños» y en «El marco».

El rediseño de Compras va por la fase 2 de cinco: ver «Compras» en «Diseños».

Pendiente:
- **Foto de perfil.** `profiles.avatar_url` existe y Google la llena, pero el shell
  solo pinta la inicial y no hay forma de subir una: eso es Storage y es otra función.
- **No hay escrituras sin conexión.** El service worker deja *leer* la lista guardada;
  marcar comprado necesita red: sin señal, la fila avisa y deshace la tilde. Una
  cola de sincronización es una función aparte.
- Rotar el código de invitación y sacar miembros (la pantalla `/casa` lo dice).
- UI de reversa/devolución de abonos.
- **No hay forma de cargar deuda vieja desde la UI**, la de antes de empezar a usar
  la app. El rodeo, ya usado en Fonseca Cerdas (mayo–agosto 2026 de Eugenia): crear
  el período, meter un gasto en una lista que sea 100% de esa persona y cerrarlo con
  `close_period`. Conviene sobre un asiento suelto porque el gasto se puede **anular**
  desde `/gastos` si el monto salió mal, y el asiento suelto no se corrige por
  ningún lado. Ojo: anular exige el mes abierto, y **no hay `reopen_period` ni botón
  para reabrir** — se reabre por SQL (`periods` sí tiene policy de UPDATE para el
  admin, y el check `periods_closed_shape` acepta volver a `open` con `closed_at`
  y `closed_by` en NULL).
- «Leaked password protection» sigue apagada en Supabase (la app no usa contraseñas).

## Datos de prueba

Casas del seed: **Casa Fonseca** (Luis admin, Marta y Rodrigo miembros; agosto abierto),
**Apto Escalante** (Marta admin, Luis miembro; setiembre cerrado, octubre abierto).
Hay un abono real de ₡1.000 de Luis que es inmutable — no intentés borrarlo.
**Fonseca Cerdas** es la casa real del usuario: no dejes datos de prueba ahí.
