import { useEffect, useState } from 'react';

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

export interface BorradorDePlantilla {
  /** null mientras se lee la plantilla, o si el id no existe. */
  borrador: DatosPlantilla | null;
  esNueva: boolean;
  /** Hay cambios sin guardar. */
  sucio: boolean;
  cargando: boolean;
  cambiar: (cambio: Partial<DatosPlantilla>) => void;
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
