/**
 * Reglas del nombre de un participante (RF-202). TypeScript puro.
 *
 * La usan el alta del dueño (4.1) y el alta y edicion de participantes (4.3).
 */

export const LARGO_MAXIMO_NOMBRE = 20;

export type ErrorNombre = 'vacio' | 'largo' | 'repetido';

/**
 * null si el nombre sirve. Los espacios de los costados no cuentan, y «Ana» choca
 * con «ana»: en la mesa son la misma persona.
 *
 * @param ocupados los nombres de los participantes activos, sin el que se esta
 *   editando (si no, un participante chocaria consigo mismo).
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
