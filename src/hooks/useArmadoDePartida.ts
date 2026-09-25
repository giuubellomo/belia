import { useCallback, useState } from 'react';

import { MAXIMO_JUGADORES, puedeEmpezar } from '@/domain/participantes';
import type { Participante } from '@/domain/types';
import { nuevoId } from '@/repositories/comun';

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
  };
}
