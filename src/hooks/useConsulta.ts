/**
 * El unico patron de acceso a datos de la app (paso 2.5, RNF-2).
 *
 * Una pantalla lee siempre a traves de un hook, y escribe con `mutar`:
 *
 *   const { partida, mutar } = usePartida(id);
 *   await mutar(() => partidas.guardarPuntaje(id, 1, participanteId, 25));
 *
 * `mutar` corre la escritura y, cuando termina, TODOS los hooks montados
 * vuelven a leer su agregado entero desde la base, no solo el que la llamo. Asi
 * el Home, que queda montado debajo de la partida en el stack, esta al dia al
 * volver. Nada de estado optimista ni de parchear objetos en memoria.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

type Recargar = () => Promise<void>;

const montados = new Set<Recargar>();

/** Resuelve cuando todos los hooks montados terminaron de recargar. */
async function avisarCambio(): Promise<void> {
  await Promise.all([...montados].map((recargar) => recargar()));
}

/**
 * Corre una escritura y recarga todo lo que esta en pantalla. Devuelve lo que
 * devuelva la escritura (por ejemplo, la partida recien creada, para navegar).
 * Si la escritura falla, igual recarga y despues deja pasar el error: la
 * transaccion ya se deshizo y la pantalla muestra lo que de verdad hay.
 */
export async function mutar<R>(accion: () => Promise<R>): Promise<R> {
  try {
    return await accion();
  } finally {
    await avisarCambio();
  }
}

export interface Consulta<T> {
  /** undefined solo hasta la primera lectura. */
  datos: T | undefined;
  /** true hasta la primera lectura. Al recargar se sigue mostrando lo anterior. */
  cargando: boolean;
  /** El error de la ultima lectura, o null. */
  error: unknown;
}

/**
 * Base de los hooks de `src/hooks`. `clave` identifica que se esta leyendo: si
 * cambia (otro id de partida), se vuelve a cargar desde cero. `cargar` tiene que
 * depender solo de lo que esta en `clave`.
 */
export function useConsulta<T>(cargar: () => Promise<T>, clave: string): Consulta<T> {
  const [estado, setEstado] = useState<Consulta<T>>({ datos: undefined, cargando: true, error: null });

  const cargarActual = useRef(cargar);
  useEffect(() => {
    cargarActual.current = cargar;
  });

  // Cada lectura lleva un numero. Si llega la respuesta de una vieja despues de
  // una nueva (o despues de desmontar), se descarta.
  const ultimoPedido = useRef(0);

  const recargar = useCallback(async () => {
    const pedido = ++ultimoPedido.current;
    try {
      const datos = await cargarActual.current();
      if (pedido === ultimoPedido.current) setEstado({ datos, cargando: false, error: null });
    } catch (error) {
      if (pedido === ultimoPedido.current) setEstado((previo) => ({ ...previo, cargando: false, error }));
    }
  }, []);

  useEffect(() => {
    setEstado({ datos: undefined, cargando: true, error: null });
    montados.add(recargar);
    void recargar();
    return () => {
      montados.delete(recargar);
      ultimoPedido.current += 1;
    };
  }, [clave, recargar]);

  return estado;
}
