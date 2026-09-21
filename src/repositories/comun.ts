/**
 * Lo que comparten los repositorios: ids, timestamps (RNF-9) y agrupar filas.
 *
 * El uuid lo genera el runtime nativo de Expo: expo-modules-core instala
 * `globalThis.expo.uuidv4` en toda app de Expo, asi que no hace falta sumar
 * una dependencia para esto.
 */

export function nuevoId(): string {
  return globalThis.expo.uuidv4();
}

/** ISO 8601, como pide el esquema. */
export function ahora(): string {
  return new Date().toISOString();
}

/** Agrupa filas por una clave, conservando el orden en que llegaron. */
export function agrupar<T>(filas: T[], clave: (fila: T) => string): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const fila of filas) {
    const k = clave(fila);
    const grupo = grupos.get(k);
    if (grupo === undefined) grupos.set(k, [fila]);
    else grupo.push(fila);
  }
  return grupos;
}
