/**
 * Repositorio de participantes (paso 2.3).
 *
 * Afuera solo salen tipos del dominio. `es_dueno` y `archivado` no estan en
 * `Participante`: se consultan con `obtenerDueno` y filtrando en `listar`.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { escribir, leer } from '@/db/client';
import type { AvatarTipo, Participante } from '@/domain/types';

import { ahora, nuevoId } from './comun';

interface FilaParticipante {
  id: string;
  nombre: string;
  avatar_tipo: AvatarTipo;
  avatar_valor: string;
  es_dueno: number;
}

const COLUMNAS = 'id, nombre, avatar_tipo, avatar_valor, es_dueno';

function aParticipante(fila: FilaParticipante): Participante {
  return {
    id: fila.id,
    nombre: fila.nombre,
    avatarTipo: fila.avatar_tipo,
    avatarValor: fila.avatar_valor,
  };
}

export type DatosParticipante = Omit<Participante, 'id'>;

/** Los activos: el dueño primero y el resto en el orden en que se dieron de alta. */
export function listar(): Promise<Participante[]> {
  return leer(async (db) => {
    const filas = await db.getAllAsync<FilaParticipante>(
      `SELECT ${COLUMNAS} FROM participante WHERE archivado = 0 ORDER BY es_dueno DESC, creado_en, id`,
    );
    return filas.map(aParticipante);
  });
}

/** Devuelve tambien a los archivados: un id que existe siempre se puede resolver. */
export function obtener(id: string): Promise<Participante | null> {
  return leer(async (db) => {
    const fila = await db.getFirstAsync<FilaParticipante>(
      `SELECT ${COLUMNAS} FROM participante WHERE id = ?`,
      [id],
    );
    return fila === null ? null : aParticipante(fila);
  });
}

export function obtenerDueno(): Promise<Participante | null> {
  return leer(duenoDesdeBase);
}

/** `esDueno` es solo para el alta del paso 4.1. Hay un unico dueño por dispositivo. */
export function crear(
  datos: DatosParticipante,
  opciones: { esDueno?: boolean } = {},
): Promise<Participante> {
  const esDueno = opciones.esDueno === true;

  return escribir(async (db) => {
    if (esDueno && (await duenoDesdeBase(db)) !== null) {
      throw new Error('Ya hay un dueño del dispositivo');
    }

    const participante: Participante = {
      id: nuevoId(),
      nombre: datos.nombre,
      avatarTipo: datos.avatarTipo,
      avatarValor: datos.avatarValor,
    };

    await db.runAsync(
      `INSERT INTO participante (id, nombre, avatar_tipo, avatar_valor, es_dueno, archivado, creado_en)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [participante.id, participante.nombre, participante.avatarTipo, participante.avatarValor, esDueno ? 1 : 0, ahora()],
    );

    return participante;
  });
}

/** Cambia nombre y avatar. Las partidas ya creadas no se enteran: guardan su snapshot. */
export function actualizar(participante: Participante): Promise<void> {
  return escribir(async (db) => {
    const { changes } = await db.runAsync(
      'UPDATE participante SET nombre = ?, avatar_tipo = ?, avatar_valor = ? WHERE id = ?',
      [participante.nombre, participante.avatarTipo, participante.avatarValor, participante.id],
    );
    if (changes === 0) throw new Error(`No existe el participante ${participante.id}`);
  });
}

/**
 * Archivar en lugar de borrar: deja de aparecer en `listar`, pero el id sigue
 * resolviendo. Al dueño no se lo archiva.
 */
export function archivar(id: string): Promise<void> {
  return escribir(async (db) => {
    const fila = await db.getFirstAsync<FilaParticipante>(
      `SELECT ${COLUMNAS} FROM participante WHERE id = ?`,
      [id],
    );
    if (fila === null) throw new Error(`No existe el participante ${id}`);
    if (fila.es_dueno === 1) throw new Error('Al dueño del dispositivo no se lo puede archivar');

    await db.runAsync('UPDATE participante SET archivado = 1 WHERE id = ?', [id]);
  });
}

// ---------------------------------------------------------------------------
// Internas
// ---------------------------------------------------------------------------

async function duenoDesdeBase(db: SQLiteDatabase): Promise<Participante | null> {
  const fila = await db.getFirstAsync<FilaParticipante>(
    `SELECT ${COLUMNAS} FROM participante WHERE es_dueno = 1`,
  );
  return fila === null ? null : aParticipante(fila);
}
