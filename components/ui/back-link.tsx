import Link from 'next/link'

/** El ícono nunca va solo: siempre lleva su texto al lado. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="min-h-touch text-tinta-suave -ml-2 flex items-center gap-1 self-start px-2 text-base"
    >
      <span aria-hidden="true">‹</span>
      {children}
    </Link>
  )
}
