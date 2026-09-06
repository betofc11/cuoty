'use client'

/**
 * Último recurso: se usa solo si revienta el layout raíz, así que reemplaza al
 * documento entero y tiene que traer su propio `<html>` y `<body>`.
 *
 * No importa `globals.css` ni usa clases de Tailwind: si falló el layout raíz,
 * lo más probable es que las hojas de estilo tampoco hayan cargado. Los estilos
 * van embebidos para que esta pantalla se vea bien igual.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es-CR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '1rem',
          background: '#efe9e1',
          color: '#2a231d',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '16px',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          Cuoty no pudo cargar
        </h1>
        <p style={{ margin: 0, color: '#6b5f52' }}>
          No se perdió nada de lo que ya estaba guardado. Probá de nuevo.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: '3rem',
            border: 'none',
            borderRadius: '1rem',
            background: '#b4552e',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Reintentar
        </button>
        {error.digest ? (
          <p style={{ margin: 0, textAlign: 'center', color: '#6b5f52', fontSize: '.875rem' }}>
            Código del error: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  )
}
