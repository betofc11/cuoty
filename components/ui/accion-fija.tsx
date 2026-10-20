/**
 * La acción final de una pantalla de detalle, anclada al pie mientras se
 * recorre el formulario. En un formulario largo, «Guardar» quedaba debajo del
 * último campo y había que bajar a buscarlo; y al final del scroll quedaba
 * a 20px del borde, debajo del indicador de inicio (34pt).
 *
 * Es `sticky` y no `fixed`: se ancla mientras su contenedor ocupe la pantalla y
 * vuelve a su lugar al final. Va dentro del `form` o de la columna de la
 * pantalla, que tiene `px-4`: el `-mx-4` estira el fondo hasta el borde.
 */
export function AccionFija({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="border-borde bg-fondo sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t px-4
                 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      {children}
    </div>
  )
}
