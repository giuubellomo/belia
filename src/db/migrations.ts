/**
 * Migraciones de la base (paso 2.2).
 *
 * La version aplicada vive en `PRAGMA user_version` de SQLite: es un entero que
 * viaja en el header del archivo, asi que no hace falta una tabla de control.
 *
 * Reglas:
 *   - una migracion ya publicada NO se edita: se agrega otra abajo con version +1
 *   - `version` arranca en 1 y va de a uno, sin huecos
 *   - cada migracion corre dentro de una transaccion junto con su `user_version`,
 *     asi que o se aplica entera o no se aplica
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_SQL } from './schema.generated';

export interface Migracion {
  version: number;
  nombre: string;
  sql: string;
}

export const MIGRACIONES: Migracion[] = [
  { version: 1, nombre: 'esquema inicial', sql: SCHEMA_SQL },
];

/** La version mas alta que conoce este build. */
export const VERSION_OBJETIVO = MIGRACIONES.reduce((max, m) => Math.max(max, m.version), 0);

export async function versionActual(db: SQLiteDatabase): Promise<number> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return fila?.user_version ?? 0;
}

/**
 * Aplica las migraciones pendientes, en orden, y devuelve cuales corrio.
 * En una base ya migrada no toca nada y devuelve [].
 */
export async function migrar(db: SQLiteDatabase): Promise<Migracion[]> {
  const desde = await versionActual(db);

  if (desde > VERSION_OBJETIVO) {
    throw new Error(
      `La base esta en la version ${desde} y este build solo conoce hasta la ${VERSION_OBJETIVO}. ` +
        'Probablemente sea una app mas vieja abriendo datos mas nuevos.',
    );
  }

  const pendientes = MIGRACIONES.filter((m) => m.version > desde).sort((a, b) => a.version - b.version);

  for (const migracion of pendientes) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(migracion.sql);
      // user_version no acepta parametros: va interpolado. El valor es nuestro, no del usuario.
      await txn.execAsync(`PRAGMA user_version = ${migracion.version}`);
    });
  }

  return pendientes;
}
