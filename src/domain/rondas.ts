/**
 * Estado de la ronda: que vale cada regla, si se puede cerrar, y el marcado
 * de reglas (RF-406, RF-706, RF-707).
 *
 * `marcarRegla` y `desmarcarRegla` son puras: devuelven una ronda nueva y no
 * tocan la que reciben.
 */

import type { Participante, Plantilla, Regla, RondaJugada } from './types';

export type ResultadoCierre =
  | { puede: true }
  | { puede: false; motivo: 'faltan_puntajes' | 'faltan_reglas'; reglas?: Regla[] };

/** Puntaje que vale una regla en una ronda concreta: el ajuste si existe, si no el base. */
export function puntajeDeReglaEnRonda(
  plantilla: Plantilla,
  numeroRonda: number,
  reglaId: string,
): number {
  const regla = plantilla.reglas.find((r) => r.id === reglaId);
  if (regla === undefined) {
    // Solo pasa si la plantilla y las marcas se desincronizaron, y eso nunca
    // deberia ocurrir: la partida usa un snapshot congelado (C-5). Mejor
    // romper fuerte que devolver 0 y falsear un puntaje en silencio.
    throw new Error(`La regla ${reglaId} no existe en la plantilla ${plantilla.id}`);
  }

  // RF-503: el ajuste de la ronda pisa al puntaje base. Una plantilla de rondas
  // ilimitadas no tiene RondaDefinida para las rondas nuevas: ahi vale el base.
  const definida = plantilla.rondas.find((r) => r.numero === numeroRonda);
  const ajuste = definida?.ajustes[reglaId];

  return ajuste ?? regla.puntajeBase;
}

/** RF-707: ¿todos cargaron su puntaje? */
export function todosCargaron(
  ronda: RondaJugada,
  participantes: Participante[],
): boolean {
  return participantes.every((participante) => {
    const entrada = ronda.entradas.find((e) => e.participanteId === participante.id);
    return entrada !== undefined && entrada.puntosManuales !== null;
  });
}

/** RF-706: las reglas de alcance 'todas' tienen que estar asignadas a alguien. */
export function reglasSinAsignar(ronda: RondaJugada, plantilla: Plantilla): Regla[] {
  return plantilla.reglas.filter((regla) => {
    if (regla.alcance !== 'todas') return false;
    return !ronda.entradas.some((entrada) => regla.id in entrada.marcas);
  });
}

/** RF-707 + RF-706 juntos. */
export function puedeCerrarRonda(
  ronda: RondaJugada,
  plantilla: Plantilla,
  participantes: Participante[],
): ResultadoCierre {
  if (!todosCargaron(ronda, participantes)) {
    return { puede: false, motivo: 'faltan_puntajes' };
  }

  const sinAsignar = reglasSinAsignar(ronda, plantilla);
  if (sinAsignar.length > 0) {
    // RF-706 pide poder nombrarlas en el aviso, no solo bloquear.
    return { puede: false, motivo: 'faltan_reglas', reglas: sinAsignar };
  }

  return { puede: true };
}

/** RF-406: marcar una regla única a alguien se la saca al anterior. */
export function marcarRegla(
  ronda: RondaJugada,
  plantilla: Plantilla,
  reglaId: string,
  participanteId: string,
): RondaJugada {
  const regla = plantilla.reglas.find((r) => r.id === reglaId);
  if (regla === undefined) {
    throw new Error(`La regla ${reglaId} no existe en la plantilla ${plantilla.id}`);
  }

  // C-4: el puntaje se congela ahora, con lo que la regla vale en ESTA ronda.
  const puntos = puntajeDeReglaEnRonda(plantilla, ronda.numero, reglaId);

  const entradas = ronda.entradas.map((entrada) => {
    const esElDestino = entrada.participanteId === participanteId;

    // RF-406: si la regla es de asignacion unica, marcarsela a alguien se la
    // saca a cualquier otro que la tuviera.
    if (!esElDestino && !regla.asignacionUnica) return entrada;
    if (!esElDestino) {
      if (!(reglaId in entrada.marcas)) return entrada;
      const { [reglaId]: _quitada, ...resto } = entrada.marcas;
      return { ...entrada, marcas: resto };
    }

    return { ...entrada, marcas: { ...entrada.marcas, [reglaId]: puntos } };
  });

  const yaTenia = ronda.entradas.some((e) => e.participanteId === participanteId);
  if (!yaTenia) {
    // Se puede marcar una regla antes de cargar el puntaje: la entrada nace
    // con puntosManuales en null, que es "todavia no cargo" (A-2).
    entradas.push({ participanteId, puntosManuales: null, marcas: { [reglaId]: puntos } });
  }

  return { ...ronda, entradas };
}

/** Saca la marca de una regla a un participante. El tilde del paso 7.4 es un toggle. */
export function desmarcarRegla(
  ronda: RondaJugada,
  reglaId: string,
  participanteId: string,
): RondaJugada {
  const entradas = ronda.entradas.map((entrada) => {
    if (entrada.participanteId !== participanteId) return entrada;
    if (!(reglaId in entrada.marcas)) return entrada;

    const { [reglaId]: _quitada, ...resto } = entrada.marcas;
    return { ...entrada, marcas: resto };
  });

  return { ...ronda, entradas };
}
