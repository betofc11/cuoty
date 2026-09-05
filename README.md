# Cuoty

Finanzas compartidas del hogar + lista de compras. PWA mobile-first.

Stack: Next.js (App Router) + TypeScript estricto + Tailwind v4 + Supabase.

## Arrancar

```bash
npm install
cp .env.example .env.local   # y llenalo
npm run dev
```

| Script             | Qué hace                        |
| ------------------ | ------------------------------- |
| `npm run dev`      | Servidor de desarrollo          |
| `npm run build`    | Build de producción             |
| `npm run typecheck`| `tsc --noEmit`                  |

## Estructura

```
app/                 rutas (Server Components por defecto)
lib/supabase/        cliente browser · server · middleware
lib/money/           moneda: la invariante 7 como sistema de tipos
types/database.ts    GENERADO desde el esquema real — no editar
supabase/migrations/ migraciones versionadas, una por fase
middleware.ts        refresco de sesión
```

## Invariantes que el código debe respetar

Las reglas completas viven en el documento de producto. Las que más fácil se
rompen al escribir código:

1. **El saldo se deriva del ledger, nunca se guarda.** Saldo = cargos y ajustes
   menos abonos asignados, sobre todos los períodos con saldo vivo, abiertos y
   cerrados. `period_carryovers` es foto para mostrar y auditar, jamás insumo del
   cálculo. Si el derivado y el arrastre no coinciden, gana el ledger y hay bug.
2. **CRC y USD nunca se suman ni se convierten.** No existe un total único:
   siempre dos cifras paralelas (`MoneyPair`). En `lib/money` esto es un error de
   compilación, no una convención.
3. **Solo el admin registra abonos.** El miembro no tiene ninguna acción de pago
   — ni deshabilitada. Si no puede, no se renderiza.
4. **El rol es por casa**, no global.
5. **Ledger append-only.** Los cargos son inmutables; un cambio de porcentajes
   escribe asientos delta que suman cero entre miembros. El ajuste *es* el
   recálculo.
6. **El residuo del redondeo lo absorbe siempre el admin.** La suma de los cargos
   da exactamente el monto del gasto.
7. **Montos `numeric(14,2)`, nunca float.** En el cliente viven como enteros en
   céntimos.
8. **Los meses se cortan en `America/Costa_Rica`**, nunca en UTC.
9. **Un saldo negativo es saldo a favor** y nunca se muestra como número
   negativo.
10. **Toda la seguridad vive en RLS.** El frontend es manipulable.

## Modelo de permisos (RLS)

Toda la seguridad vive en políticas RLS. El cliente no decide nada.

| Área | Miembro | Admin |
| --- | --- | --- |
| Gastos, listas, porcentajes, períodos | lee | lee y escribe |
| Registrar abonos | — | sí |
| Ver abonos | los suyos | todos los de la casa |
| Saldos y arrastres | el suyo | todos los de la casa |
| Ledger de cargos | lee (es el reparto compartido) | lee |
| Lista de compras, productos, tags, precios reales | todo | todo |
| Crear tiendas | — | sí |

`ledger_entries`, `payments`, `payment_allocations` y `period_carryovers` no
tienen política de `UPDATE` ni `DELETE`: son append-only para todos, admin
incluido. El trigger `forbid_mutation` es la segunda capa.

Los helpers de RLS viven en el esquema **`app`**, no en `public`. PostgREST
publica todo lo que hay en `public` como `/rest/v1/rpc/<función>`, y un helper
como `list_house(uuid)` expuesto es un oráculo. Si agregás un helper nuevo,
va en `app`.

Las vistas `membership_balances` y `period_balances` usan `security_invoker` y
además se filtran a lo que cada quien puede ver. Sin ese filtro un miembro vería
los cargos de otros pero no sus abonos, y el saldo ajeno saldría inflado.

## Vocabulario

- **cargo** — lo que te tocó de los gastos del mes.
- **saldo** — lo que queda después de los abonos.

No son sinónimos y no se mezclan. Español de Costa Rica: «setiembre».
