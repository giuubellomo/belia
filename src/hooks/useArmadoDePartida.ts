import { useCallback, useState } from 'react';

import { MAXIMO_JUGADORES, puedeEmpezar } from '@/domain/participantes';
import type { Partida, Participante } from '@/domain/types';
import { es } from '@/i18n/es';
import { nuevoId } from '@/repositories/comun';
import * as partidas from '@/repositories/partidas';

import { mutar } from './useConsulta';

/** Nombre y avatar: lo que carga el popup. El id lo pone el armado. */
type DatosJugador = Omit<Participante, 'id'>;

export interface ArmadoDePartida {
  plantillaId: string | null;
  /** En el orden en que se agregaron: es el orden de la partida. */
  jugadores: Participante[];
  elegirPlantilla: (id: string) => void;
  /** No hace nada si ya estan los ocho (RF-605). */
  agregarJugador: (datos: DatosJugador) => void;
  editarJugador: (id: string, datos: DatosJugador) => void;
  sacarJugador: (id: string) => void;
  /** Vuelve a cero: sin plantilla y sin jugadores. Es la misma funcion en cada render. */
  reiniciar: () => void;
  hayLugar: boolean;
  puedeEmpezar: boolean;
  /**
   * Crea la partida con lo elegido (paso 6.2) y recarga los hooks montados: el
   * Home pasa a mostrarla. Si falla, deja pasar el error.
   */
  empezar: () => Promise<Partida>;
}

/**
 * Lo que se elige en el sheet de «Nueva partida» (paso 6.1, RF-601 a RF-605).
 *
 * Los jugadores son de esta partida y no se guardan aparte (registro, cambio 65):
 * viven aca, en memoria, hasta EMPEZAR. Cada uno nace con un uuid, que es el que
 * va a llevar en la partida (RNF-9).
 */
export function useArmadoDePartida(): ArmadoDePartida {
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [jugadores, setJugadores] = useState<Participante[]>([]);

  // Estable: el sheet la llama en un efecto, cada vez que se abre.
  const reiniciar = useCallback(() => {
    setPlantillaId(null);
    setJugadores([]);
  }, []);

  return {
    plantillaId,
    jugadores,
    elegirPlantilla: setPlantillaId,
    agregarJugador: (datos) =>
      setJugadores((previos) =>
        previos.length >= MAXIMO_JUGADORES ? previos : [...previos, { ...datos, id: nuevoId() }],
      ),
    editarJugador: (id, datos) =>
      setJugadores((previos) => previos.map((jugador) => (jugador.id === id ? { ...datos, id } : jugador))),
    sacarJugador: (id) => setJugadores((previos) => previos.filter((jugador) => jugador.id !== id)),
    reiniciar,
    hayLugar: jugadores.length < MAXIMO_JUGADORES,
    puedeEmpezar: puedeEmpezar(plantillaId !== null, jugadores.length),
    empezar: () => {
      if (plantillaId === null) return Promise.reject(new Error('No hay plantilla elegida'));
      return mutar(() =>
        partidas.crear({
          // A-4: «Partida del 25/9». El mockup no tiene donde editarlo al armar.
          nombre: es.nuevaPartida.nombrePorDefecto(new Date()),
          plantillaId,
          participantes: jugadores,
        }),
      );
    },
  };
}
