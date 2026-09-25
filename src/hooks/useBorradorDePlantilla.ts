import { useEffect, useState } from 'react';

import type { Regla, RondaDefinida } from '@/domain/types';
import { nuevoId } from '@/repositories/comun';
import * as plantillas from '@/repositories/plantillas';
import type { DatosPlantilla, PlantillaGuardada } from '@/repositories/plantillas';

import { usePlantillas } from './usePlantillas';

/** El id de ruta que el editor entiende como «plantilla en blanco». */
export const ID_NUEVA = 'nueva';

/** Con que datos arranca una plantilla nueva. */
export const BORRADOR_NUEVO: DatosPlantilla = {
  nombre: '',
  icono: 'cartas',
  modoPuntos: 'suma',
  criterioVictoria: 'menor',
  rondasIlimitadas: true,
  reglas: [],
  rondas: [],
};

/** Una regla sin lo que pone el borrador: el id (si es nueva) y el orden. */
export type DatosRegla = Omit<Regla, 'id' | 'orden'> & { id?: string };

/** Lo que devuelve el sheet de una ronda al tocar GUARDAR RONDA (paso 5.4). */
export interface DatosRonda {
  objetivo?: string;
  /** Solo los puntajes que difieren del base de la regla. */
  ajustes: Record<string, number>;
  /** Las reglas que existen solo en esta ronda, ya editadas: reemplazan a las que habia. */
  reglasPropias: DatosRegla[];
}

export interface BorradorDePlantilla {
  /** null mientras se lee la plantilla, o si el id no existe. */
  borrador: DatosPlantilla | null;
  esNueva: boolean;
  /** Hay cambios sin guardar. */
  sucio: boolean;
  cargando: boolean;
  cambiar: (cambio: Partial<DatosPlantilla>) => void;
  /** Agrega la regla al final, o reemplaza la que tenga ese id (paso 5.3). */
  guardarRegla: (regla: DatosRegla) => void;
  /** Saca la regla y los ajustes por ronda que la apuntaban. */
  borrarRegla: (id: string) => void;
  /** Mueve la regla un lugar entre las de todas las rondas: -1 sube, 1 baja. */
  moverRegla: (id: string, direccion: -1 | 1) => void;
  /** Con `numero` null agrega la ronda al final; si no, reemplaza esa (paso 5.4). */
  guardarRonda: (numero: number | null, ronda: DatosRonda) => void;
  /** Saca la ronda y sus reglas propias, y corre un lugar las que venian despues. */
  borrarRonda: (numero: number) => void;
  /** Intercambia la ronda con la de al lado. Objetivo, ajustes y reglas propias viajan con ella. */
  moverRonda: (numero: number, direccion: -1 | 1) => void;
  /** Escribe la plantilla entera. Si falla, deja pasar el error. */
  guardar: () => Promise<void>;
}

/**
 * El borrador del editor de plantillas (pasos 5.2 a 5.4).
 *
 * Decision registrada (cambio 54): el editor trabaja en memoria y escribe entero
 * al guardar, como el mockup. Por eso el borrador vive aca y no se pisa cuando
 * `mutar` recarga las plantillas: es de la pantalla hasta que se guarda.
 */
export function useBorradorDePlantilla(id: string): BorradorDePlantilla {
  const { plantillas: lista, cargando, mutar } = usePlantillas();

  const esNueva = id === ID_NUEVA;
  const guardada = lista.find((plantilla) => plantilla.id === id);

  const [borrador, setBorrador] = useState<DatosPlantilla | null>(esNueva ? BORRADOR_NUEVO : null);

  // Se arma una sola vez, cuando llega la plantilla.
  useEffect(() => {
    if (guardada === undefined) return;
    setBorrador((previo) => previo ?? aBorrador(guardada));
  }, [guardada]);

  const original = guardada === undefined ? BORRADOR_NUEVO : aBorrador(guardada);

  return {
    borrador,
    esNueva,
    sucio: borrador !== null && enJson(borrador) !== enJson(original),
    cargando,
    cambiar: (cambio) => setBorrador((previo) => (previo === null ? previo : { ...previo, ...cambio })),

    guardarRegla: (regla) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        const existe = regla.id !== undefined && previo.reglas.some((otra) => otra.id === regla.id);
        const reglas = existe
          ? previo.reglas.map((otra) => (otra.id === regla.id ? { ...otra, ...regla, id: otra.id } : otra))
          : [...previo.reglas, { ...regla, id: regla.id ?? nuevoId(), orden: previo.reglas.length }];
        return { ...previo, reglas: ordenar(reglas) };
      }),

    borrarRegla: (id) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        return {
          ...previo,
          reglas: ordenar(previo.reglas.filter((regla) => regla.id !== id)),
          // Sin esto quedarian ajustes apuntando a una regla que ya no existe, y
          // guardar la plantilla romperia la clave foranea de la base.
          rondas: previo.rondas.map((ronda) => {
            const { [id]: _borrado, ...ajustes } = ronda.ajustes;
            return { ...ronda, ajustes };
          }),
        };
      }),

    moverRegla: (id, direccion) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        // Solo entre las de todas las rondas, que son las que muestra la lista.
        const generales = previo.reglas.filter((regla) => regla.soloEnRonda === undefined);
        const desde = generales.findIndex((regla) => regla.id === id);
        const hasta = desde + direccion;
        if (desde === -1 || hasta < 0 || hasta >= generales.length) return previo;
        const [movida] = generales.splice(desde, 1);
        generales.splice(hasta, 0, movida!);
        const propias = previo.reglas.filter((regla) => regla.soloEnRonda !== undefined);
        return { ...previo, reglas: ordenar([...generales, ...propias]) };
      }),

    guardarRonda: (numero, { objetivo, ajustes, reglasPropias }) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        const destino = numero ?? previo.rondas.length + 1;
        const ronda: RondaDefinida = { numero: destino, ajustes };
        if (objetivo !== undefined) ronda.objetivo = objetivo;
        const rondas =
          numero === null
            ? [...previo.rondas, ronda]
            : previo.rondas.map((otra) => (otra.numero === numero ? ronda : otra));
        const reglas = [
          ...previo.reglas.filter((regla) => regla.soloEnRonda !== destino),
          ...reglasPropias.map((regla, i) => ({
            ...regla,
            id: regla.id ?? nuevoId(),
            orden: previo.reglas.length + i,
            soloEnRonda: destino,
          })),
        ];
        return { ...previo, rondas, reglas: ordenar(reglas) };
      }),

    borrarRonda: (numero) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        // El numero ES el orden (schema): las que venian despues bajan uno.
        const correr = (n: number) => (n > numero ? n - 1 : n);
        return {
          ...previo,
          rondas: previo.rondas
            .filter((ronda) => ronda.numero !== numero)
            .map((ronda) => ({ ...ronda, numero: correr(ronda.numero) })),
          reglas: ordenar(
            previo.reglas
              .filter((regla) => regla.soloEnRonda !== numero)
              .map((regla) =>
                regla.soloEnRonda === undefined ? regla : { ...regla, soloEnRonda: correr(regla.soloEnRonda) },
              ),
          ),
        };
      }),

    moverRonda: (numero, direccion) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        const otro = numero + direccion;
        if (otro < 1 || otro > previo.rondas.length) return previo;
        const cambiar = (n: number) => (n === numero ? otro : n === otro ? numero : n);
        return {
          ...previo,
          rondas: previo.rondas
            .map((ronda) => ({ ...ronda, numero: cambiar(ronda.numero) }))
            .sort((a, b) => a.numero - b.numero),
          reglas: ordenar(
            previo.reglas.map((regla) =>
              regla.soloEnRonda === undefined ? regla : { ...regla, soloEnRonda: cambiar(regla.soloEnRonda) },
            ),
          ),
        };
      }),

    guardar: async () => {
      if (borrador === null) return;
      const datos: DatosPlantilla = {
        ...borrador,
        nombre: borrador.nombre.trim(),
        // Sin rondas definidas, la plantilla es de rondas libres (como Simple).
        rondasIlimitadas: borrador.rondas.length === 0,
      };
      await mutar(() => (esNueva ? plantillas.crear(datos) : plantillas.actualizar({ id, ...datos })));
    },
  };
}

/**
 * `orden` es la posicion en la lista: se recalcula cada vez que la lista cambia.
 * Primero van las de todas las rondas y despues las propias de cada ronda, por
 * numero: asi las flechas de la lista general no saltan sobre reglas que no ve.
 */
function ordenar(reglas: Regla[]): Regla[] {
  const generales = reglas.filter((regla) => regla.soloEnRonda === undefined);
  const propias = reglas
    .filter((regla) => regla.soloEnRonda !== undefined)
    .sort((a, b) => a.soloEnRonda! - b.soloEnRonda! || a.orden - b.orden);
  return [...generales, ...propias].map((regla, i) => (regla.orden === i ? regla : { ...regla, orden: i }));
}

/** Los datos editables, sin el id ni `esPredefinida`, que el editor no toca. */
function aBorrador(plantilla: PlantillaGuardada): DatosPlantilla {
  return {
    nombre: plantilla.nombre,
    icono: plantilla.icono,
    modoPuntos: plantilla.modoPuntos,
    criterioVictoria: plantilla.criterioVictoria,
    rondasIlimitadas: plantilla.rondasIlimitadas,
    reglas: plantilla.reglas,
    rondas: plantilla.rondas,
  };
}

/**
 * JSON con las claves ordenadas: una regla armada en un sheet y la misma leida
 * de la base traen los campos en otro orden, y no por eso hay cambios.
 */
function enJson(datos: DatosPlantilla): string {
  return JSON.stringify(datos, (_clave, valor: unknown) =>
    valor !== null && typeof valor === 'object' && !Array.isArray(valor)
      ? Object.fromEntries(Object.entries(valor).sort(([a], [b]) => (a < b ? -1 : 1)))
      : valor,
  );
}
