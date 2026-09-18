/**
 * Calculo de puntaje (C-1, C-2, A-2).
 *
 * Toda la aritmetica de la partida vive aca. Si aparece una suma dentro de un
 * componente o de un repositorio, esta en el lugar equivocado.
 */

import type { EntradaRonda, ModoPuntos, Partida } from './types';

/** C-1: lo que hizo un participante en una ronda. */
export function puntajeDeRonda(entrada: EntradaRonda, modo: ModoPuntos): number {
  // A-2: el puntaje manual se guarda siempre positivo y es `modo` el que decide
  // si entra sumando o restando.
  const manual = entrada.puntosManuales ?? 0;
  const manualConSigno = modo === 'suma' ? manual : -manual;

  // C-4: cada marca vale lo que se congelo al marcarla, con su propio signo.
  // `modo` no la toca: manda sobre el puntaje manual y sobre nada mas.
  const deMarcas = Object.values(entrada.marcas).reduce((suma, puntos) => suma + puntos, 0);

  return manualConSigno + deMarcas;
}

/** C-2: total acumulado de un participante en toda la partida. */
export function totalDeParticipante(partida: Partida, participanteId: string): number {
  return partida.rondas.reduce((total, ronda) => {
    const entrada = ronda.entradas.find((e) => e.participanteId === participanteId);
    if (entrada === undefined) return total;
    return total + puntajeDeRonda(entrada, partida.plantilla.modoPuntos);
  }, 0);
}

/** Todos los totales de una vez, para la vista de partida y el podio. */
export function totalesDePartida(
  partida: Partida,
): Array<{ participanteId: string; total: number }> {
  return partida.participantes.map((participante) => ({
    participanteId: participante.id,
    total: totalDeParticipante(partida, participante.id),
  }));
}
