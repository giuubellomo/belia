import { useEffect, useState } from 'react';

import type { Regla } from '@/domain/types';
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
  /** Mueve la regla un lugar: -1 sube, 1 baja. En la punta no hace nada. */
  moverRegla: (id: string, direccion: -1 | 1) => void;
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

  // Los dos objetos se arman con la misma forma, asi que comparar su JSON alcanza.
  const original = guardada === undefined ? BORRADOR_NUEVO : aBorrador(guardada);

  return {
    borrador,
    esNueva,
    sucio: borrador !== null && JSON.stringify(borrador) !== JSON.stringify(original),
    cargando,
    cambiar: (cambio) => setBorrador((previo) => (previo === null ? previo : { ...previo, ...cambio })),

    guardarRegla: (regla) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        const existe = regla.id !== undefined && previo.reglas.some((otra) => otra.id === regla.id);
        const reglas = existe
          ? previo.reglas.map((otra) => (otra.id === regla.id ? { ...otra, ...regla, id: otra.id } : otra))
          : [...previo.reglas, { ...regla, id: regla.id ?? nuevoId(), orden: previo.reglas.length }];
        return { ...previo, reglas: conOrden(reglas) };
      }),

    borrarRegla: (id) =>
      setBorrador((previo) => {
        if (previo === null) return previo;
        return {
          ...previo,
          reglas: conOrden(previo.reglas.filter((regla) => regla.id !== id)),
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
        const desde = previo.reglas.findIndex((regla) => regla.id === id);
        const hasta = desde + direccion;
        if (desde === -1 || hasta < 0 || hasta >= previo.reglas.length) return previo;
        const reglas = [...previo.reglas];
        const [movida] = reglas.splice(desde, 1);
        reglas.splice(hasta, 0, movida!);
        return { ...previo, reglas: conOrden(reglas) };
      }),
    guardar: async () => {
      if (borrador === null) return;
      const datos: DatosPlantilla = {
        ...borrador,
        nombre: borrador.nombre.trim(),
        // Sin rondas definidas, la plantilla es de rondas libres (como Simple).
        // Agregarlas es el paso 5.4.
        rondasIlimitadas: borrador.rondas.length === 0,
      };
      await mutar(() => (esNueva ? plantillas.crear(datos) : plantillas.actualizar({ id, ...datos })));
    },
  };
}

/** `orden` es la posicion en la lista: se recalcula cada vez que la lista cambia. */
function conOrden(reglas: Regla[]): Regla[] {
  return reglas.map((regla, i) => (regla.orden === i ? regla : { ...regla, orden: i }));
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
