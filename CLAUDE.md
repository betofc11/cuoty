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
   insumo del cálculo del saldo.
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
  donde no queda espacio para la palabra. Hoy son cuatro: la tuerca del selector
  de casas, el `+` de la barra de alta de Compras, y el embudo de «Filtros» y la
  escoba de «Limpiar» cuando la fila de filtros está colapsada — esos dos además
  muestran su palabra al expandirse. Si vas a agregar un quinto, primero probá si
  cabe el texto.
- Target táctil mínimo 48×48 (`min-h-touch`). Tipografía base 16px, no bajar.
- Toda vista necesita sus estados: cargando, vacío, error, sin señal.
  Ojo: «lista vacía» y «el filtro no encontró nada» son pantallas distintas.

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

## Cómo trabajar acá

- **Parás al final de cada fase.** Mostrás qué se construyó, qué decisiones tomaste
  que no estaban en el documento, y esperás aprobación. No encadenés fases.
- **Bash está bloqueado** en este entorno (falla el proxy corporativo). No busqués
  rodeos: pasale los comandos al usuario en un bloque ```bash para que los corra.
  Para levantar el server de desarrollo sí se usa `preview_start` (`.claude/launch.json`).
- **Verificá manejando la UI de verdad**, no solo con `tsc`. Los bugs que más han
  dolido acá —casas duplicadas, la tuerca que no salía, Realtime mudo, el 404 al
  borrar— no los agarra el tipado. Impersonar usuarios en SQL también sirve.
- Antes de sobrescribir un archivo, leelo. Si ya existía, decilo.

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
  llamado `nombre` lo toma por titular de tarjeta y ofrece los datos de pago.
- **`useState(prop)` no se actualiza** cuando la prop cambia por navegación. Si un
  input refleja un parámetro de la URL, sincronizalo a mano.
- **Comentarios**: `/* ... */` dentro de un bloque `/** ... */` lo cierra antes.

## Estado y huecos conocidos

Funcionando: auth (magic link + Google), onboarding, gastos con listas y porcentajes,
recurrentes, saldos y abonos, cierre de mes con arrastres, lista de compras completa
(tiendas, etiquetas, filtros, búsqueda, comprados, Realtime, fotos en Storage), PWA
instalable con tema claro/oscuro y service worker.

Pendiente:
- **No hay escrituras sin conexión.** El service worker deja *leer* la lista guardada;
  marcar comprado necesita red. Una cola de sincronización es una función aparte.
- Rotar el código de invitación y sacar miembros (la pantalla `/casa` lo dice).
- UI de reversa/devolución de abonos.
- «Leaked password protection» sigue apagada en Supabase (la app no usa contraseñas).
- `Shell` es un componente y no `app/(app)/layout.tsx`, porque `app/page.tsx` ocupa `/`.

## Datos de prueba

Casas del seed: **Casa Fonseca** (Luis admin, Marta y Rodrigo miembros; agosto abierto),
**Apto Escalante** (Marta admin, Luis miembro; setiembre cerrado, octubre abierto).
Hay un abono real de ₡1.000 de Luis que es inmutable — no intentés borrarlo.
**Fonseca Cerdas** es la casa real del usuario: no dejes datos de prueba ahí.
