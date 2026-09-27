/**
 * Calculo de puntaje (C-1, C-2, A-2).
 *
 * Toda la aritmetica de la partida vive aca. Si aparece una suma dentro de un
 * componente o de un repositorio, esta en el lugar equivocado.
 */

import { cargoPuntaje } from './rondas';
import type { EntradaRonda, ModoPuntos, Partida, Plantilla, RondaJugada } from './types';

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

/**
 * Lo que muestra la fila de un participante en la ronda en juego (paso 7.2,
 * RF-704): su puntaje de la ronda, o null si todavia no cargo. «Cargar» es lo
 * mismo que pide `todosCargaron` para cerrar la ronda: un 0 de quien no corto,
 * en una ronda con «Cortó», se ve vacio (cambio 79).
 */
export function puntajeCargado(
  ronda: RondaJugada,
  plantilla: Plantilla,
  participanteId: string,
): number | null {
  const entrada = ronda.entradas.find((e) => e.participanteId === participanteId);
  if (entrada === undefined || !cargoPuntaje(ronda, plantilla, participanteId)) return null;
  return puntajeDeRonda(entrada, plantilla.modoPuntos);
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

/**
 * Quien hizo el mejor puntaje de una ronda, segun `criterioVictoria`: lo que
 * resume una ronda cerrada sin objetivo ni reglas (paso 7.1, mockup 5). Si
 * empatan, vienen todos. null si nadie cargo nada en esa ronda.
 */
export function mejoresDeRonda(
  ronda: RondaJugada,
  plantilla: Plantilla,
): { participanteIds: string[]; puntaje: number } | null {
  if (ronda.entradas.length === 0) return null;

  const puntajes = ronda.entradas.map((entrada) => ({
    participanteId: entrada.participanteId,
    puntaje: puntajeDeRonda(entrada, plantilla.modoPuntos),
  }));
  const valores = puntajes.map((p) => p.puntaje);
  const mejor = plantilla.criterioVictoria === 'menor' ? Math.min(...valores) : Math.max(...valores);

  return {
    participanteIds: puntajes.filter((p) => p.puntaje === mejor).map((p) => p.participanteId),
    puntaje: mejor,
  };
}
