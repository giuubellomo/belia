/**
 * Apertura de la base (paso 2.2).
 *
 * Toda la app usa esta unica conexion. Nadie mas llama a openDatabaseAsync.
 * Los repositorios piden `await obtenerBase()`; cuando la promesa resuelve,
 * los PRAGMA ya estan puestos y las migraciones ya corrieron.
 */
import * as SQLite from 'expo-sqlite';

import { migrar, versionActual, VERSION_OBJETIVO } from './migrations';

export const NOMBRE_BASE = 'belia.db';

let conexion: Promise<SQLite.SQLiteDatabase> | null = null;

export function obtenerBase(): Promise<SQLite.SQLiteDatabase> {
  if (conexion === null) {
    conexion = abrir().catch((error: unknown) => {
      // Si falla la apertura no dejamos cacheada una promesa rechazada:
      // el proximo intento tiene que poder volver a intentarlo.
      conexion = null;
      throw error;
    });
  }
  return conexion;
}

async function abrir(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(NOMBRE_BASE);

  // Fuera de transaccion y antes de migrar: journal_mode no cambia dentro de una,
  // y foreign_keys se ignora en silencio si se setea con una transaccion abierta.
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  await migrar(db);

  return db;
}

/** Solo para tests y para el reset de la pantalla de configuracion (fase 9). */
export async function cerrarBase(): Promise<void> {
  if (conexion === null) return;
  const db = await conexion;
  conexion = null;
  await db.closeAsync();
}

export interface EstadoBase {
  nombre: string;
  version: number;
  versionObjetivo: number;
  tablas: number;
}

/** Diagnostico: sirve para el checkpoint del paso 2.2 y para la pantalla de configuracion. */
export async function estadoBase(): Promise<EstadoBase> {
  const db = await obtenerBase();
  const fila = await db.getFirstAsync<{ n: number }>(
    "SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  return {
    nombre: NOMBRE_BASE,
    version: await versionActual(db),
    versionObjetivo: VERSION_OBJETIVO,
    tablas: fila?.n ?? 0,
  };
}
