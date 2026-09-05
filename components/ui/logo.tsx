export function Logo({ size = 'grande' }: { size?: 'grande' | 'chico' }) {
  return (
    <span
      className={`text-crc font-display ${size === 'grande' ? 'text-5xl' : 'text-2xl'}`}
    >
      cuoty
    </span>
  )
}
