/**
 * Repositorio de partidas (paso 2.3).
 *
 * Una partida no mira nunca la plantilla ni los participantes vivos: guarda su
 * snapshot al crearse (C-5) y cada marca guarda los puntos que valia al marcarla
 * (C-4). Lo que se decide sobre puntajes lo decide el dominio; aca solo se lee,
 * se valida que la escritura tenga sentido y se guarda.
 *
 * Las rondas se nombran por su numero, como en `RondaJugada`: los ids de
 * `ronda_partida` no salen de este archivo.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { escribir, leer } from '@/db/client';
import { MAXIMO_JUGADORES, MINIMO_JUGADORES } from '@/domain/participantes';
import { nombreDePartida } from '@/domain/partidas';
import { marcarRegla as marcarEnRonda, puedeCerrarRonda } from '@/domain/rondas';
import type {
  AvatarTipo,
  EntradaRonda,
  EstadoPartida,
  EstadoRonda,
  Participante,
  Partida,
  Plantilla,
  RondaJugada,
} from '@/domain/types';

import { agrupar, ahora, nuevoId } from './comun';
import { plantillaDesdeBase } from './plantillas';

export interface DatosPartida {
  /** Se escribe al armar y es obligatorio (registro, cambio 71). Se guarda limpio. */
  nombre: string;
  plantillaId: string;
  /**
   * Los jugadores del armado, en el orden en que se van a mostrar. Son de esta
   * partida y no estan en la tabla `participante` (registro, cambio 65): se
   * guardan directo en `partida_participante`, con el id que traen.
   */
  participantes: Participante[];
}

interface FilaPartida {
  id: string;
  nombre: string;
  plantilla_snapshot: string;
  estado: EstadoPartida;
}

interface FilaParticipante {
  participante_id: string;
  nombre_snapshot: string;
  avatar_tipo_snapshot: AvatarTipo;
  avatar_valor_snapshot: string;
}

interface FilaRonda {
  id: string;
  numero: number;
  objetivo: string | null;
  estado: EstadoRonda;
}

interface FilaPuntaje {
  ronda_partida_id: string;
  participante_id: string;
  puntos_manuales: number | null;
}

interface FilaMarca {
  ronda_partida_id: string;
  regla_id: string;
  participante_id: string;
  puntos_aplicados: number;
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

/** La unica partida en curso (A-5), o null si no hay. */
export function obtenerEnCurso(): Promise<Partida | null> {
  return leer(async (db) => {
    const fila = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM partida WHERE estado = 'en_curso' ORDER BY iniciada_en DESC LIMIT 1",
    );
    return fila === null ? null : partidaDesdeBase(db, fila.id);
  });
}

/** La Partida completa, con el snapshot ya parseado: lo que consume la fase 1. */
export function obtener(id: string): Promise<Partida | null> {
  return leer((db) => partidaDesdeBase(db, id));
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/**
 * Paso 6.2. Congela la plantilla tal como esta ahora, guarda a los jugadores y crea
 * las rondas: la 1 en curso y el resto bloqueadas. Con rondas ilimitadas se crea
 * solo la 1; las siguientes nacen al cerrar la anterior.
 */
export function crear(datos: DatosPartida): Promise<Partida> {
  return escribir(async (db) => {
    const enCurso = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM partida WHERE estado = 'en_curso' LIMIT 1",
    );
    if (enCurso !== null) {
      throw new Error('Ya hay una partida en curso: hay que terminarla antes de crear otra (A-5)');
    }

    const nombre = nombreDePartida(datos.nombre);
    if (nombre === null) throw new Error('La partida necesita un nombre');

    const { participantes } = datos;
    if (new Set(participantes.map((p) => p.id)).size !== participantes.length) {
      throw new Error('Un participante no puede estar dos veces en la misma partida');
    }
    // RF-604 y RF-605: el armado ya no deja pasar otra cantidad.
    if (participantes.length < MINIMO_JUGADORES || participantes.length > MAXIMO_JUGADORES) {
      throw new Error(
        `Una partida se juega entre ${MINIMO_JUGADORES} y ${MAXIMO_JUGADORES}, no con ${participantes.length}`,
      );
    }

    const guardada = await plantillaDesdeBase(db, datos.plantillaId);
    if (guardada === null) throw new Error(`No existe la plantilla ${datos.plantillaId}`);
    const plantilla = snapshotDe(guardada);

    if (!plantilla.rondasIlimitadas && plantilla.rondas.length === 0) {
      throw new Error(`La plantilla ${plantilla.id} no tiene rondas y no es de rondas ilimitadas`);
    }

    const id = nuevoId();

    await db.runAsync(
      `INSERT INTO partida (id, nombre, plantilla_snapshot, estado, iniciada_en, finalizada_en)
       VALUES (?, ?, ?, 'en_curso', ?, NULL)`,
      [id, nombre, JSON.stringify(plantilla), ahora()],
    );

    for (const [orden, participante] of participantes.entries()) {
      await db.runAsync(
        `INSERT INTO partida_participante
           (partida_id, participante_id, nombre_snapshot, avatar_tipo_snapshot, avatar_valor_snapshot, orden)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, participante.id, participante.nombre, participante.avatarTipo, participante.avatarValor, orden],
      );
    }

    const numeros = plantilla.rondasIlimitadas
      ? [1]
      : plantilla.rondas.map((ronda) => ronda.numero).sort((a, b) => a - b);

    for (const [i, numero] of numeros.entries()) {
      await insertarRonda(db, id, plantilla, numero, i === 0 ? 'en_curso' : 'bloqueada');
    }

    return (await partidaDesdeBase(db, id))!;
  });
}

/**
 * Carga o borra (null) el puntaje manual. Siempre positivo: el signo lo pone
 * `modoPuntos` (A-2). Vale para la ronda en curso y para una cerrada (RF-709).
 */
export function guardarPuntaje(
  partidaId: string,
  numeroRonda: number,
  participanteId: string,
  puntos: number | null,
): Promise<void> {
  if (puntos !== null && !(Number.isInteger(puntos) && puntos >= 0)) {
    return Promise.reject(new Error(`El puntaje manual va entero y positivo (A-2), llego ${puntos}`));
  }

  return escribir(async (db) => {
    const partida = await partidaEditable(db, partidaId);
    const rondaId = await rondaEditable(db, partida, numeroRonda);
    exigirParticipante(partida, participanteId);

    await db.runAsync(
      `INSERT INTO puntaje_ronda (ronda_partida_id, participante_id, puntos_manuales)
       VALUES (?, ?, ?)
       ON CONFLICT (ronda_partida_id, participante_id) DO UPDATE SET puntos_manuales = excluded.puntos_manuales`,
      [rondaId, participanteId, puntos],
    );
  });
}

/**
 * Marca una regla. Quien decide los puntos y a quien se le saca (RF-406) es
 * `marcarRegla` del dominio; aca se guarda lo que devuelve. Los puntos se congelan
 * con lo que la regla vale en ESA ronda, aunque sea una cerrada (C-4, 7.6).
 */
export function marcarRegla(
  partidaId: string,
  numeroRonda: number,
  reglaId: string,
  participanteId: string,
): Promise<void> {
  return escribir(async (db) => {
    const partida = await partidaEditable(db, partidaId);
    const rondaId = await rondaEditable(db, partida, numeroRonda);
    exigirParticipante(partida, participanteId);

    const ronda = partida.rondas.find((r) => r.numero === numeroRonda)!;
    const nueva = marcarEnRonda(ronda, partida.plantilla, reglaId, participanteId);

    // Se reescriben todas las marcas de esta regla en la ronda: asi entra tanto
    // la marca nueva como la que se le saco a otro por asignacion unica.
    await db.runAsync('DELETE FROM marca_regla WHERE ronda_partida_id = ? AND regla_id = ?', [
      rondaId,
      reglaId,
    ]);
    for (const entrada of nueva.entradas) {
      const puntos = entrada.marcas[reglaId];
      if (puntos === undefined) continue;
      await db.runAsync(
        `INSERT INTO marca_regla (ronda_partida_id, regla_id, participante_id, puntos_aplicados)
         VALUES (?, ?, ?, ?)`,
        [rondaId, reglaId, entrada.participanteId, puntos],
      );
    }
  });
}

/** Saca una marca. Si no estaba, no pasa nada: el tilde es un toggle. */
export function desmarcarRegla(
  partidaId: string,
  numeroRonda: number,
  reglaId: string,
  participanteId: string,
): Promise<void> {
  return escribir(async (db) => {
    const partida = await partidaEditable(db, partidaId);
    const rondaId = await rondaEditable(db, partida, numeroRonda);

    await db.runAsync(
      'DELETE FROM marca_regla WHERE ronda_partida_id = ? AND regla_id = ? AND participante_id = ?',
      [rondaId, reglaId, participanteId],
    );
  });
}

/**
 * Paso 7.5. Cierra la ronda en curso y abre la siguiente, en la misma transaccion:
 * separadas, un corte entre las dos dejaria la partida sin ronda en curso.
 * Si la plantilla es de rondas ilimitadas y no hay siguiente, la crea.
 * Si era la ultima de una plantilla con rondas fijas, no queda ninguna en curso.
 */
export function cerrarRonda(partidaId: string, numeroRonda: number): Promise<void> {
  return escribir(async (db) => {
    const partida = await partidaEditable(db, partidaId);
    const ronda = partida.rondas.find((r) => r.numero === numeroRonda);
    if (ronda === undefined) throw new Error(`La partida no tiene ronda ${numeroRonda}`);
    if (ronda.estado !== 'en_curso') {
      throw new Error(`Solo se cierra la ronda en curso, y la ${numeroRonda} esta ${ronda.estado}`);
    }

    const cierre = puedeCerrarRonda(ronda, partida.plantilla, partida.participantes);
    if (!cierre.puede) {
      throw new Error(`La ronda ${numeroRonda} todavia no se puede cerrar: ${cierre.motivo}`);
    }

    await db.runAsync(
      "UPDATE ronda_partida SET estado = 'cerrada' WHERE partida_id = ? AND numero = ?",
      [partidaId, numeroRonda],
    );

    const siguiente = partida.rondas.find((r) => r.numero === numeroRonda + 1);
    if (siguiente !== undefined) {
      await db.runAsync(
        "UPDATE ronda_partida SET estado = 'en_curso' WHERE partida_id = ? AND numero = ?",
        [partidaId, numeroRonda + 1],
      );
    } else if (partida.plantilla.rondasIlimitadas) {
      await insertarRonda(db, partidaId, partida.plantilla, numeroRonda + 1, 'en_curso');
    }
  });
}

/** Paso 8.1. La partida queda en la base para el historial de fase 2. */
export function finalizar(partidaId: string): Promise<void> {
  return escribir(async (db) => {
    const { changes } = await db.runAsync(
      "UPDATE partida SET estado = 'finalizada', finalizada_en = ? WHERE id = ? AND estado = 'en_curso'",
      [ahora(), partidaId],
    );
    if (changes === 0) throw new Error(`La partida ${partidaId} no existe o ya estaba finalizada`);
  });
}

// ---------------------------------------------------------------------------
// Internas
// ---------------------------------------------------------------------------

async function partidaDesdeBase(db: SQLiteDatabase, id: string): Promise<Partida | null> {
  const fila = await db.getFirstAsync<FilaPartida>(
    'SELECT id, nombre, plantilla_snapshot, estado FROM partida WHERE id = ?',
    [id],
  );
  if (fila === null) return null;

  const participantes = (
    await db.getAllAsync<FilaParticipante>(
      `SELECT participante_id, nombre_snapshot, avatar_tipo_snapshot, avatar_valor_snapshot
       FROM partida_participante WHERE partida_id = ? ORDER BY orden`,
      [id],
    )
  ).map(
    (p): Participante => ({
      id: p.participante_id,
      nombre: p.nombre_snapshot,
      avatarTipo: p.avatar_tipo_snapshot,
      avatarValor: p.avatar_valor_snapshot,
    }),
  );

  const rondas = await db.getAllAsync<FilaRonda>(
    'SELECT id, numero, objetivo, estado FROM ronda_partida WHERE partida_id = ? ORDER BY numero',
    [id],
  );
  const puntajes = await db.getAllAsync<FilaPuntaje>(
    `SELECT p.ronda_partida_id, p.participante_id, p.puntos_manuales
     FROM puntaje_ronda p JOIN ronda_partida r ON r.id = p.ronda_partida_id
     WHERE r.partida_id = ?`,
    [id],
  );
  const marcas = await db.getAllAsync<FilaMarca>(
    `SELECT m.ronda_partida_id, m.regla_id, m.participante_id, m.puntos_aplicados
     FROM marca_regla m JOIN ronda_partida r ON r.id = m.ronda_partida_id
     WHERE r.partida_id = ?`,
    [id],
  );

  const puntajesPorRonda = agrupar(puntajes, (p) => p.ronda_partida_id);
  const marcasPorRonda = agrupar(marcas, (m) => m.ronda_partida_id);

  return {
    id: fila.id,
    nombre: fila.nombre,
    estado: fila.estado,
    plantilla: JSON.parse(fila.plantilla_snapshot) as Plantilla,
    participantes,
    rondas: rondas.map((ronda) =>
      aRondaJugada(
        ronda,
        participantes,
        puntajesPorRonda.get(ronda.id) ?? [],
        marcasPorRonda.get(ronda.id) ?? [],
      ),
    ),
  };
}

/** Una entrada por participante, en su orden, aunque todavia no haya cargado nada. */
function aRondaJugada(
  fila: FilaRonda,
  participantes: Participante[],
  puntajes: FilaPuntaje[],
  marcas: FilaMarca[],
): RondaJugada {
  const entradas = participantes.map((participante): EntradaRonda => {
    const puntaje = puntajes.find((p) => p.participante_id === participante.id);
    return {
      participanteId: participante.id,
      puntosManuales: puntaje?.puntos_manuales ?? null,
      marcas: Object.fromEntries(
        marcas
          .filter((m) => m.participante_id === participante.id)
          .map((m) => [m.regla_id, m.puntos_aplicados]),
      ),
    };
  });

  const ronda: RondaJugada = { numero: fila.numero, estado: fila.estado, entradas };
  if (fila.objetivo !== null) ronda.objetivo = fila.objetivo;
  return ronda;
}

/**
 * Solo los campos del dominio, copiados uno por uno: `esPredefinida` y cualquier
 * otra cosa que traiga el objeto no tienen que quedar congelados en el snapshot.
 */
function snapshotDe(plantilla: Plantilla): Plantilla {
  return {
    id: plantilla.id,
    nombre: plantilla.nombre,
    icono: plantilla.icono,
    modoPuntos: plantilla.modoPuntos,
    criterioVictoria: plantilla.criterioVictoria,
    rondasIlimitadas: plantilla.rondasIlimitadas,
    reglas: plantilla.reglas.map((regla) => ({
      id: regla.id,
      titulo: regla.titulo,
      descripcion: regla.descripcion,
      puntajeBase: regla.puntajeBase,
      alcance: regla.alcance,
      asignacionUnica: regla.asignacionUnica,
      orden: regla.orden,
      soloEnRonda: regla.soloEnRonda,
    })),
    rondas: plantilla.rondas.map((ronda) => ({
      numero: ronda.numero,
      objetivo: ronda.objetivo,
      ajustes: { ...ronda.ajustes },
    })),
  };
}

/** El objetivo sale del snapshot. Una ronda de mas en rondas ilimitadas no tiene. */
async function insertarRonda(
  db: SQLiteDatabase,
  partidaId: string,
  plantilla: Plantilla,
  numero: number,
  estado: EstadoRonda,
): Promise<void> {
  const definida = plantilla.rondas.find((r) => r.numero === numero);
  await db.runAsync(
    'INSERT INTO ronda_partida (id, partida_id, numero, objetivo, estado) VALUES (?, ?, ?, ?, ?)',
    [nuevoId(), partidaId, numero, definida?.objetivo ?? null, estado],
  );
}

/** Una partida finalizada ya no se toca. */
async function partidaEditable(db: SQLiteDatabase, partidaId: string): Promise<Partida> {
  const partida = await partidaDesdeBase(db, partidaId);
  if (partida === null) throw new Error(`No existe la partida ${partidaId}`);
  if (partida.estado !== 'en_curso') throw new Error(`La partida ${partidaId} ya esta finalizada`);
  return partida;
}

/** En curso o cerrada (RF-709) se puede editar; bloqueada no. Devuelve el id de la fila. */
async function rondaEditable(
  db: SQLiteDatabase,
  partida: Partida,
  numeroRonda: number,
): Promise<string> {
  const fila = await db.getFirstAsync<{ id: string; estado: EstadoRonda }>(
    'SELECT id, estado FROM ronda_partida WHERE partida_id = ? AND numero = ?',
    [partida.id, numeroRonda],
  );
  if (fila === null) throw new Error(`La partida no tiene ronda ${numeroRonda}`);
  if (fila.estado === 'bloqueada') throw new Error(`La ronda ${numeroRonda} todavia esta bloqueada`);
  return fila.id;
}

function exigirParticipante(partida: Partida, participanteId: string): void {
  if (!partida.participantes.some((p) => p.id === participanteId)) {
    throw new Error(`El participante ${participanteId} no juega esta partida`);
  }
}
