import { useEffect, useState } from "react";
import { getPref, setPref } from "@/utils/prefs";

/**
 * `useState` que sobrevive a salir de la pantalla y volver.
 *
 * El caso concreto: filtrar una tabla, entrar al detalle de un animal y volver
 * atrás. Sin esto el componente se vuelve a montar con el estado inicial y los
 * filtros se pierden, que es justo lo que hace tediosa la revisión del hato.
 *
 * Guarda en `sessionStorage` (el mismo almacén que ya usa /animals): los
 * filtros duran mientras la app esté abierta y se limpian solos al reabrirla,
 * de modo que nadie se encuentra días después con una tabla filtrada sin
 * acordarse de por qué.
 */
export function useStickyState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    getPref<T>(key, initialValue, { session: true })
  );

  useEffect(() => {
    setPref(key, value, { session: true });
  }, [key, value]);

  return [value, setValue];
}

export default useStickyState;
