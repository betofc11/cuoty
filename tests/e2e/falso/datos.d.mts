// Los tipos de `datos.mjs`, para que las pruebas en TypeScript lo importen con
// `strict`. El archivo de datos es JS plano porque también lo carga el
// Supabase falso, que corre con `node` a secas.

export declare const USUARIO: { id: string; email: string; nombre: string }
export declare const TOKEN: string
export declare const IDS: {
  casa: string
  leche: string
  pinol: string
  pan: string
  cafe: string
  tomate: string
  jabon: string
}
export declare function datosIniciales(): Record<string, Record<string, unknown>[]>
