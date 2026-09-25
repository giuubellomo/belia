/**
 * Reglas del nombre de un participante (RF-202) y cuantos juegan una partida
 * (RF-604, RF-605). TypeScript puro.
 *
 * La usan el alta del dueño (4.1) y el armado de la partida (6.1), donde los
 * jugadores se cargan para esa partida sola (registro, cambio 65).
 */

export const LARGO_MAXIMO_NOMBRE = 20;

/** RF-604: con menos no hay a quien ganarle. */
export const MINIMO_JUGADORES = 2;
/** RF-605. */
export const MAXIMO_JUGADORES = 8;

/** RF-604: EMPEZAR se habilita con una plantilla elegida y entre 2 y 8 jugadores. */
export function puedeEmpezar(hayPlantilla: boolean, jugadores: number): boolean {
  return hayPlantilla && jugadores >= MINIMO_JUGADORES && jugadores <= MAXIMO_JUGADORES;
}

export type ErrorNombre = 'vacio' | 'largo' | 'repetido';

/**
 * null si el nombre sirve. Los espacios de los costados no cuentan, y «Ana» choca
 * con «ana»: en la mesa son la misma persona.
 *
 * @param ocupados los nombres con los que no puede chocar, sin el que se esta
 *   editando (si no, un participante chocaria consigo mismo). En el armado son
 *   los otros jugadores de la partida.
 */
export function validarNombre(nombre: string, ocupados: string[]): ErrorNombre | null {
  const limpio = normalizarNombre(nombre);
  if (limpio.length === 0) return 'vacio';
  // Array.from cuenta caracteres reales: un emoji o una «ñ» compuesta es uno solo.
  if (Array.from(limpio).length > LARGO_MAXIMO_NOMBRE) return 'largo';

  const clave = limpio.toLocaleLowerCase('es');
  if (ocupados.some((otro) => normalizarNombre(otro).toLocaleLowerCase('es') === clave)) return 'repetido';

  return null;
}

/** Lo que se guarda: sin espacios en los costados ni repetidos en el medio. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ');
}
