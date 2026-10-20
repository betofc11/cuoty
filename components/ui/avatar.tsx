/**
 * La inicial de una persona en su tono (`lib/casas/personas.ts`). Es identidad,
 * no un control: va siempre con el nombre escrito al lado, así que es
 * decorativo para el lector de pantalla.
 *
 * Pálido con letra oscura a propósito. Las casas van al revés, saturadas con
 * letra blanca (`lib/casas/color.ts`), para que un chip de casa no se confunda
 * con una persona.
 *
 * El color va por `style` y variables CSS, como el chip de etiqueta de Compras: el tono se
 * decide en runtime y Tailwind solo genera las clases que ve escritas.
 */
export function Avatar({
  inicial,
  tono,
  tamano = 'chico',
}: {
  inicial: string
  tono: number
  tamano?: 'chico' | 'grande'
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        backgroundColor: `var(--persona-${tono}-fondo)`,
        color: `var(--persona-${tono}-tinta)`,
      }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
        tamano === 'grande' ? 'size-10 text-base' : 'size-8 text-sm'
      }`}
    >
      {inicial}
    </span>
  )
}
