import { Shell } from '@/components/shell/shell'

/**
 * Las cuatro pestañas (inicio, gastos, saldos y compras) comparten este layout,
 * y por eso el marco no se desmonta al pasar de una a otra. Las pantallas de
 * detalle (`/gastos/nuevo`, `/saldos/[id]`…) viven fuera del grupo: son a
 * pantalla completa, con su «Volver», sin tabs.
 */
export default function LayoutDeTabs({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>
}
