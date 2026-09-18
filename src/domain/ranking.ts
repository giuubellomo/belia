/**
 * Ranking y empates (C-3, RF-801, RF-804).
 */

import { totalesDePartida } from './scoring';
import type { Partida } from './types';

export interface Puesto {
  posicion: number;          // 1, 1, 3 en caso de empate
  participanteId: string;
  total: number;
}

/**
 * Ordena a los participantes segun el criterio de victoria de la plantilla
 * congelada y les asigna posicion.
 *
 * Los empates comparten posicion y saltean las siguientes (RF-804): dos
 * primeros dan `1, 1, 3`, no `1, 1, 2`.
 *
 * El orden entre empatados es el de `partida.participantes`, porque `sort` es
 * estable: dos podios de la misma partida se ven siempre igual.
 */
export function rankear(partida: Partida): Puesto[] {
  const { criterioVictoria } = partida.plantilla;

  const ordenados = [...totalesDePartida(partida)].sort((a, b) =>
    criterioVictoria === 'menor' ? a.total - b.total : b.total - a.total,
  );

  const puestos: Puesto[] = [];
  for (const [indice, { participanteId, total }] of ordenados.entries()) {
    const anterior = puestos[indice - 1];
    const empataConElAnterior = anterior !== undefined && anterior.total === total;

    puestos.push({
      posicion: empataConElAnterior ? anterior.posicion : indice + 1,
      participanteId,
      total,
    });
  }

  return puestos;
}
