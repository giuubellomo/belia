/**
 * Apertura de la base (paso 2.2).
 *
 * Toda la app usa esta unica conexion. Nadie mas llama a openDatabaseAsync.
 * Los repositorios piden `await obtenerBase()`; cuando la promesa resuelve,
 * los PRAGMA ya estan puestos y las migraciones ya corrieron.
 */
import * as SQLite from 'expo-sqlite';

import { migrar, versionActual, VERSION_OBJETIVO } from './migrations';
import { esperarTurno } from './turno';

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
  // En web, esperar a que otra pagina suelte la base (cambio 87).
  if (!(await esperarTurno())) throw new Error(`NoModificationAllowedError: ${NOMBRE_BASE} esta abierta en otra pestaña`);
  return abrirUnaVez();
}

async function abrirUnaVez(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(NOMBRE_BASE);

  try {
    // Fuera de transaccion y antes de migrar: journal_mode no cambia dentro de una,
    // y foreign_keys se ignora en silencio si se setea con una transaccion abierta.
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');

    await migrar(db);
  } catch (error) {
    // Si falla despues de abrir, se cierra: el reintento no puede chocar consigo mismo.
    await db.closeAsync().catch(() => undefined);
    throw error;
  }

  return db;
}

/**
 * Web (fase 10, cambio 87): SQLite toma el archivo de la base de forma exclusiva
 * en el navegador, asi que una segunda pestaña con la app no la puede abrir.
 * Llega como un NoModificationAllowedError del almacenamiento del navegador.
 */
export function esBaseAbiertaEnOtraPestana(error: unknown): boolean {
  return String(error).includes('NoModificationAllowedError');
}

/*
 * Acceso para los repositorios (paso 2.3).
 *
 * Todo pasa por una cola: una operacion por vez, en el orden en que se pidieron.
 * No usamos withExclusiveTransactionAsync porque abre una conexion nueva, y en esa
 * conexion `foreign_keys` esta apagado: los ON DELETE CASCADE no correrian y las
 * referencias rotas entrarian sin error. Las transacciones van sobre la conexion
 * principal, y la cola garantiza que nada se meta en el medio.
 *
 * Adentro de una tarea no se llama a `leer` ni a `escribir`: esperaria a que termine
 * la tarea que la llamo y no terminaria nunca. Se usa el `db` que llega por parametro.
 */
let cola: Promise<unknown> = Promise.resolve();

function encolar<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = cola.then(tarea);
  // La cola sigue aunque una tarea falle: el error le llega a quien la pidio.
  cola = resultado.catch(() => undefined);
  return resultado;
}

/** Lecturas: sin transaccion, pero sin pisarse con una escritura a medias. */
export function leer<T>(tarea: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  return encolar(async () => tarea(await obtenerBase()));
}

/** Escrituras: o entra todo lo que hace la tarea, o no entra nada (RNF-2). */
export function escribir<T>(tarea: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  return encolar(async () => {
    const db = await obtenerBase();
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      const resultado = await tarea(db);
      await db.execAsync('COMMIT');
      return resultado;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  });
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
