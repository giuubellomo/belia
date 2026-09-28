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
  {
    // Paso 5.4 (ver registro): una regla puede existir en una sola ronda de la
    // plantilla. NULL = vale en todas. Es el numero de ronda y no una foreign key
    // a ronda_plantilla: `actualizar` recrea reglas y rondas enteras, y las
    // reglas se insertan antes que las rondas.
    version: 2,
    nombre: 'reglas de una sola ronda',
    sql: 'ALTER TABLE regla_plantilla ADD COLUMN solo_en_ronda INTEGER CHECK (solo_en_ronda >= 1);',
  },
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

  // BEGIN/COMMIT a mano sobre la misma conexion, como `escribir` en client.ts:
  // withExclusiveTransactionAsync no existe en web (fase 10, cambio 86).
  for (const migracion of pendientes) {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      await db.execAsync(migracion.sql);
      // user_version no acepta parametros: va interpolado. El valor es nuestro, no del usuario.
      await db.execAsync(`PRAGMA user_version = ${migracion.version}`);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  return pendientes;
}
