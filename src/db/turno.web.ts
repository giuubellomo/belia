/**
 * Turno para abrir la base en el navegador (fase 10, cambio 87).
 *
 * SQLite toma el archivo de la base de forma exclusiva: una sola pestaña a la
 * vez. Al recargar, la pagina anterior tarda un momento en soltarlo, y si la
 * nueva intenta abrir antes, expo-sqlite falla y su worker queda roto. Por eso
 * se espera el turno antes de abrir: cada pagina toma un Web Lock y lo tiene
 * mientras vive; el navegador lo suelta cuando la pagina se cierra.
 *
 * Devuelve false si no llega el turno a tiempo: hay otra pestaña con la app.
 */
const NOMBRE = 'belia-base';
const ESPERA_MAXIMA_MS = 3000;

export function esperarTurno(): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.locks === undefined) return Promise.resolve(true);

  return new Promise((resolver) => {
    const cancelar = new AbortController();
    const plazo = setTimeout(() => cancelar.abort(), ESPERA_MAXIMA_MS);

    navigator.locks
      .request(NOMBRE, { signal: cancelar.signal }, () => {
        clearTimeout(plazo);
        resolver(true);
        // No resuelve nunca: el turno queda tomado hasta que se cierre la pagina.
        return new Promise<void>(() => {});
      })
      .catch(() => resolver(false));
  });
}
