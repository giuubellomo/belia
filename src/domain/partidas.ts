/**
 * El nombre de una partida (A-4, paso 7.1). TypeScript puro.
 *
 * Se escribe al armarla y es obligatorio (registro, cambio 71).
 */

/** Como el de una plantilla: tiene que entrar en el encabezado de la partida. */
export const LARGO_MAXIMO_NOMBRE_PARTIDA = 30;

/** El nombre como se guarda: sin los espacios de los costados. null si queda vacio. */
export function nombreDePartida(texto: string): string | null {
  const limpio = texto.trim().slice(0, LARGO_MAXIMO_NOMBRE_PARTIDA).trim();
  return limpio === '' ? null : limpio;
}
