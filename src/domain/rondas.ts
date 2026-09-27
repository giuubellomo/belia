/**
 * Estado de la ronda: que vale cada regla, si se puede cerrar, y el marcado
 * de reglas (RF-406, RF-706, RF-707).
 *
 * `marcarRegla` y `desmarcarRegla` son puras: devuelven una ronda nueva y no
 * tocan la que reciben.
 */

import type { Participante, Partida, Plantilla, Regla, RondaJugada } from './types';

/**
 * La «Cortó» de Karioka, por el id fijo que tiene en la semilla (cambio 79):
 * quien corta no carga puntaje y, en esa ronda, todos los demas tienen que
 * cargar mas de 0. Solo esa regla: una copia de Karioka tiene ids nuevos y ahi
 * «Cortó» es una regla comun.
 */
export const REGLA_CORTO = '841a8dd9-f409-4553-9826-79e0ea157cfc';

export type ResultadoCierre =
  | { puede: true }
  | { puede: false; motivo: 'faltan_puntajes' | 'faltan_reglas'; reglas?: Regla[] };

/** Las reglas que existen en esa ronda: las de todas, mas las que son solo de ella. */
export function reglasDeLaRonda(plantilla: Plantilla, numeroRonda: number): Regla[] {
  return plantilla.reglas.filter(
    (regla) => regla.soloEnRonda === undefined || regla.soloEnRonda === numeroRonda,
  );
}

/** Puntaje que vale una regla en una ronda concreta: el ajuste si existe, si no el base. */
export function puntajeDeReglaEnRonda(
  plantilla: Plantilla,
  numeroRonda: number,
  reglaId: string,
): number {
  const regla = reglaEnRonda(plantilla, numeroRonda, reglaId);

  // RF-503: el ajuste de la ronda pisa al puntaje base. Una plantilla de rondas
  // ilimitadas no tiene RondaDefinida para las rondas nuevas: ahi vale el base.
  const definida = plantilla.rondas.find((r) => r.numero === numeroRonda);
  const ajuste = definida?.ajustes[reglaId];

  return ajuste ?? regla.puntajeBase;
}

/** ¿Se juega la «Cortó» de Karioka en esa ronda? */
export function rondaConCorte(plantilla: Plantilla, numeroRonda: number): boolean {
  return reglasDeLaRonda(plantilla, numeroRonda).some((regla) => regla.id === REGLA_CORTO);
}

/**
 * RF-707: ¿el participante ya cargo un puntaje que sirve para cerrar la ronda?
 * Tiene que haber puntaje manual. Si la ronda tiene «Cortó» (cambio 79), el que
 * corto queda en 0 y los demas tienen que tener mas de 0.
 */
export function cargoPuntaje(ronda: RondaJugada, plantilla: Plantilla, participanteId: string): boolean {
  const entrada = ronda.entradas.find((e) => e.participanteId === participanteId);
  if (entrada === undefined || entrada.puntosManuales === null) return false;
  if (!rondaConCorte(plantilla, ronda.numero)) return true;
  return REGLA_CORTO in entrada.marcas ? entrada.puntosManuales === 0 : entrada.puntosManuales > 0;
}

/** RF-707: ¿todos cargaron su puntaje? */
export function todosCargaron(
  ronda: RondaJugada,
  plantilla: Plantilla,
  participantes: Participante[],
): boolean {
  return participantes.every((participante) => cargoPuntaje(ronda, plantilla, participante.id));
}

/** RF-706: las reglas de alcance 'todas' tienen que estar asignadas a alguien. */
export function reglasSinAsignar(ronda: RondaJugada, plantilla: Plantilla): Regla[] {
  return reglasDeLaRonda(plantilla, ronda.numero).filter((regla) => {
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
  if (!todosCargaron(ronda, plantilla, participantes)) {
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
  const regla = reglaEnRonda(plantilla, ronda.numero, reglaId);

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

/**
 * Lo que guarda el popup de carga (paso 7.4, RF-705): el puntaje manual del
 * participante y sus marcas quedan como las dejo en el popup. Las que ya tenia
 * y siguen marcadas conservan los puntos que se congelaron al marcarlas (C-4);
 * las nuevas pasan por `marcarRegla`, que se las saca a otro si son de
 * asignacion unica (RF-406). Si marco la «Cortó» de Karioka, el puntaje queda
 * en 0 (cambio 79). Pura, como las otras dos.
 */
export function aplicarCarga(
  ronda: RondaJugada,
  plantilla: Plantilla,
  participanteId: string,
  puntosManuales: number,
  reglasMarcadas: string[],
): RondaJugada {
  const antes = ronda.entradas.find((e) => e.participanteId === participanteId)?.marcas ?? {};
  const marcadas = new Set(reglasMarcadas);
  const puntos = marcadas.has(REGLA_CORTO) ? 0 : puntosManuales;

  let nueva = ronda;
  for (const reglaId of Object.keys(antes)) {
    if (!marcadas.has(reglaId)) nueva = desmarcarRegla(nueva, reglaId, participanteId);
  }
  for (const reglaId of marcadas) {
    if (!(reglaId in antes)) nueva = marcarRegla(nueva, plantilla, reglaId, participanteId);
  }

  const yaTenia = nueva.entradas.some((e) => e.participanteId === participanteId);
  const entradas = yaTenia
    ? nueva.entradas.map((e) => (e.participanteId === participanteId ? { ...e, puntosManuales: puntos } : e))
    : [...nueva.entradas, { participanteId, puntosManuales: puntos, marcas: {} }];

  return { ...nueva, entradas };
}

/** Quienes tienen marcada una regla en la ronda, en el orden de la ronda. */
export function quienesTienenRegla(ronda: RondaJugada, reglaId: string): string[] {
  return ronda.entradas.filter((e) => reglaId in e.marcas).map((e) => e.participanteId);
}

/**
 * ¿Cerrar esta ronda abre otra? Con rondas ilimitadas siempre; con rondas fijas,
 * si la partida tiene la siguiente. En la ultima no hay SIGUIENTE: se termina
 * con TERMINAR PARTIDA (paso 7.5, cambio 78).
 */
export function haySiguienteRonda(partida: Partida, numeroRonda: number): boolean {
  if (partida.plantilla.rondasIlimitadas) return true;
  return partida.rondas.some((ronda) => ronda.numero === numeroRonda + 1);
}

/**
 * RF-710: al terminar la partida, ¿la ronda en curso quedo sin poder cerrarse?
 * Es el aviso de la confirmacion (paso 8.1). Sin ronda en curso -- se cerro la
 * ultima -- no hay nada incompleto.
 */
export function rondaEnCursoIncompleta(partida: Partida): boolean {
  const enCurso = partida.rondas.find((ronda) => ronda.estado === 'en_curso');
  if (enCurso === undefined) return false;
  return !puedeCerrarRonda(enCurso, partida.plantilla, partida.participantes).puede;
}

/**
 * El numero de la ronda que se esta jugando (RF-102, cambio 3 del registro: la
 * ronda en curso se deriva del estado, no hay campo `ronda_actual`).
 *
 * Si ninguna esta en curso -- la ultima se cerro y la plantilla no tiene mas --
 * vale la ultima ronda, que es hasta donde llego la partida.
 */
export function numeroRondaEnCurso(rondas: RondaJugada[]): number {
  const enCurso = rondas.find((ronda) => ronda.estado === 'en_curso');
  if (enCurso !== undefined) return enCurso.numero;
  return rondas.reduce((mayor, ronda) => Math.max(mayor, ronda.numero), 1);
}

/**
 * La regla, si existe en esa ronda. Si no, rompe: solo pasa si la plantilla y
 * las marcas se desincronizaron, y eso nunca deberia ocurrir porque la partida
 * usa un snapshot congelado (C-5). Mejor romper fuerte que devolver 0 y
 * falsear un puntaje en silencio.
 */
function reglaEnRonda(plantilla: Plantilla, numeroRonda: number, reglaId: string): Regla {
  const regla = plantilla.reglas.find((r) => r.id === reglaId);
  if (regla === undefined) {
    throw new Error(`La regla ${reglaId} no existe en la plantilla ${plantilla.id}`);
  }
  if (regla.soloEnRonda !== undefined && regla.soloEnRonda !== numeroRonda) {
    throw new Error(`La regla ${reglaId} es solo de la ronda ${regla.soloEnRonda}, no de la ${numeroRonda}`);
  }
  return regla;
}
