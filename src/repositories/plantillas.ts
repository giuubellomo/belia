/**
 * Repositorio de plantillas (paso 2.3).
 *
 * Una plantilla se guarda en cuatro tablas (plantilla, regla_plantilla,
 * ronda_plantilla, puntaje_regla_por_ronda) y sale armada como una sola
 * `Plantilla` del dominio. `actualizar` reemplaza reglas y rondas enteras:
 * el editor modifica el objeto y lo manda completo.
 *
 * Las predefinidas (RF-303) se leen y se duplican, pero no se editan ni se borran.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { escribir, leer } from '@/db/client';
import type {
  AlcanceRegla,
  CriterioVictoria,
  ModoPuntos,
  Plantilla,
  Regla,
  RondaDefinida,
} from '@/domain/types';

import { agrupar, ahora, nuevoId } from './comun';

/**
 * `esPredefinida` no es parte del modelo del dominio: la lista (5.1) la necesita
 * para mostrar el candado. Nunca viaja al snapshot de una partida.
 */
export type PlantillaGuardada = Plantilla & { esPredefinida: boolean };

/** Todo menos el id de la plantilla. Las reglas traen su id: los ajustes lo referencian. */
export type DatosPlantilla = Omit<Plantilla, 'id'>;

interface FilaPlantilla {
  id: string;
  nombre: string;
  icono: string;
  es_predefinida: number;
  modo_puntos: ModoPuntos;
  criterio_victoria: CriterioVictoria;
  rondas_ilimitadas: number;
}

interface FilaRegla {
  id: string;
  plantilla_id: string;
  titulo: string;
  descripcion: string | null;
  puntaje_base: number;
  alcance: AlcanceRegla;
  asignacion_unica: number;
  orden: number;
}

interface FilaRonda {
  id: string;
  plantilla_id: string;
  numero: number;
  objetivo: string | null;
}

interface FilaAjuste {
  ronda_plantilla_id: string;
  regla_id: string;
  puntaje: number;
}

/** Predefinidas primero, despues las propias en el orden en que se crearon. */
export function listar(): Promise<PlantillaGuardada[]> {
  return leer((db) => plantillasDesdeBase(db, null));
}

export function obtener(id: string): Promise<PlantillaGuardada | null> {
  return leer((db) => plantillaDesdeBase(db, id));
}

/** `predefinida` es para la semilla del paso 2.4. */
export function crear(
  datos: DatosPlantilla,
  opciones: { predefinida?: boolean } = {},
): Promise<PlantillaGuardada> {
  return escribir((db) => insertar(db, datos, opciones.predefinida === true));
}

/** Reemplaza datos generales, reglas y rondas por lo que trae `plantilla`. */
export function actualizar(plantilla: Plantilla): Promise<PlantillaGuardada> {
  return escribir(async (db) => {
    await exigirEditable(db, plantilla.id);

    await db.runAsync(
      `UPDATE plantilla
       SET nombre = ?, icono = ?, modo_puntos = ?, criterio_victoria = ?, rondas_ilimitadas = ?, editada_en = ?
       WHERE id = ?`,
      [
        plantilla.nombre,
        plantilla.icono,
        plantilla.modoPuntos,
        plantilla.criterioVictoria,
        plantilla.rondasIlimitadas ? 1 : 0,
        ahora(),
        plantilla.id,
      ],
    );

    // Los ajustes se van en cascada con sus reglas y sus rondas.
    await db.runAsync('DELETE FROM regla_plantilla WHERE plantilla_id = ?', [plantilla.id]);
    await db.runAsync('DELETE FROM ronda_plantilla WHERE plantilla_id = ?', [plantilla.id]);
    await insertarContenido(db, plantilla.id, plantilla);

    return (await plantillaDesdeBase(db, plantilla.id))!;
  });
}

/**
 * Copia cualquier plantilla, predefinida o propia, como plantilla propia.
 * Las reglas nacen con ids nuevos y los ajustes de cada ronda se reapuntan a ellos.
 * El nombre lo pone quien llama: es texto de interfaz (i18n).
 */
export function duplicar(id: string, nombre: string): Promise<PlantillaGuardada> {
  return escribir(async (db) => {
    const origen = await plantillaDesdeBase(db, id);
    if (origen === null) throw new Error(`No existe la plantilla ${id}`);

    const idNuevo = new Map(origen.reglas.map((regla) => [regla.id, nuevoId()]));
    const reapuntar = (reglaId: string): string => idNuevo.get(reglaId)!;

    const copia: DatosPlantilla = {
      nombre,
      icono: origen.icono,
      modoPuntos: origen.modoPuntos,
      criterioVictoria: origen.criterioVictoria,
      rondasIlimitadas: origen.rondasIlimitadas,
      reglas: origen.reglas.map((regla) => ({ ...regla, id: reapuntar(regla.id) })),
      rondas: origen.rondas.map((ronda) => ({
        ...ronda,
        ajustes: Object.fromEntries(
          Object.entries(ronda.ajustes).map(([reglaId, puntaje]) => [reapuntar(reglaId), puntaje]),
        ),
      })),
    };

    return insertar(db, copia, false);
  });
}

/** Las partidas que la usaron no se enteran: guardan su snapshot (C-5). */
export function borrar(id: string): Promise<void> {
  return escribir(async (db) => {
    await exigirEditable(db, id);
    await db.runAsync('DELETE FROM plantilla WHERE id = ?', [id]);
  });
}

// ---------------------------------------------------------------------------
// Para otros repositorios. Reciben el `db` de una tarea ya abierta.
// ---------------------------------------------------------------------------

export async function plantillaDesdeBase(
  db: SQLiteDatabase,
  id: string,
): Promise<PlantillaGuardada | null> {
  const [plantilla] = await plantillasDesdeBase(db, id);
  return plantilla ?? null;
}

// ---------------------------------------------------------------------------
// Internas
// ---------------------------------------------------------------------------

/** Con `id` null trae todas. Son cuatro consultas en total, no una por plantilla. */
async function plantillasDesdeBase(
  db: SQLiteDatabase,
  id: string | null,
): Promise<PlantillaGuardada[]> {
  const filtro = [id, id];

  const plantillas = await db.getAllAsync<FilaPlantilla>(
    `SELECT id, nombre, icono, es_predefinida, modo_puntos, criterio_victoria, rondas_ilimitadas
     FROM plantilla WHERE (? IS NULL OR id = ?)
     ORDER BY es_predefinida DESC, creada_en, id`,
    filtro,
  );
  const reglas = await db.getAllAsync<FilaRegla>(
    `SELECT id, plantilla_id, titulo, descripcion, puntaje_base, alcance, asignacion_unica, orden
     FROM regla_plantilla WHERE (? IS NULL OR plantilla_id = ?)
     ORDER BY orden, id`,
    filtro,
  );
  const rondas = await db.getAllAsync<FilaRonda>(
    `SELECT id, plantilla_id, numero, objetivo
     FROM ronda_plantilla WHERE (? IS NULL OR plantilla_id = ?)
     ORDER BY numero`,
    filtro,
  );
  const ajustes = await db.getAllAsync<FilaAjuste>(
    `SELECT a.ronda_plantilla_id, a.regla_id, a.puntaje
     FROM puntaje_regla_por_ronda a
     JOIN ronda_plantilla r ON r.id = a.ronda_plantilla_id
     WHERE (? IS NULL OR r.plantilla_id = ?)`,
    filtro,
  );

  const ajustesPorRonda = agrupar(ajustes, (a) => a.ronda_plantilla_id);
  const reglasPorPlantilla = agrupar(reglas, (r) => r.plantilla_id);
  const rondasPorPlantilla = agrupar(rondas, (r) => r.plantilla_id);

  return plantillas.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    icono: fila.icono,
    modoPuntos: fila.modo_puntos,
    criterioVictoria: fila.criterio_victoria,
    rondasIlimitadas: fila.rondas_ilimitadas === 1,
    esPredefinida: fila.es_predefinida === 1,
    reglas: (reglasPorPlantilla.get(fila.id) ?? []).map(aRegla),
    rondas: (rondasPorPlantilla.get(fila.id) ?? []).map((ronda) =>
      aRonda(ronda, ajustesPorRonda.get(ronda.id) ?? []),
    ),
  }));
}

function aRegla(fila: FilaRegla): Regla {
  const regla: Regla = {
    id: fila.id,
    titulo: fila.titulo,
    puntajeBase: fila.puntaje_base,
    alcance: fila.alcance,
    asignacionUnica: fila.asignacion_unica === 1,
    orden: fila.orden,
  };
  if (fila.descripcion !== null) regla.descripcion = fila.descripcion;
  return regla;
}

function aRonda(fila: FilaRonda, ajustes: FilaAjuste[]): RondaDefinida {
  const ronda: RondaDefinida = {
    numero: fila.numero,
    ajustes: Object.fromEntries(ajustes.map((a) => [a.regla_id, a.puntaje])),
  };
  if (fila.objetivo !== null) ronda.objetivo = fila.objetivo;
  return ronda;
}

async function insertar(
  db: SQLiteDatabase,
  datos: DatosPlantilla,
  predefinida: boolean,
): Promise<PlantillaGuardada> {
  const id = nuevoId();
  const momento = ahora();

  await db.runAsync(
    `INSERT INTO plantilla
       (id, nombre, icono, es_predefinida, modo_puntos, criterio_victoria, rondas_ilimitadas, creada_en, editada_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      datos.nombre,
      datos.icono,
      predefinida ? 1 : 0,
      datos.modoPuntos,
      datos.criterioVictoria,
      datos.rondasIlimitadas ? 1 : 0,
      momento,
      momento,
    ],
  );
  await insertarContenido(db, id, datos);

  return (await plantillaDesdeBase(db, id))!;
}

async function insertarContenido(
  db: SQLiteDatabase,
  plantillaId: string,
  datos: Pick<Plantilla, 'reglas' | 'rondas'>,
): Promise<void> {
  const reglasPropias = new Set(datos.reglas.map((regla) => regla.id));

  for (const regla of datos.reglas) {
    await db.runAsync(
      `INSERT INTO regla_plantilla
         (id, plantilla_id, titulo, descripcion, puntaje_base, alcance, asignacion_unica, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        regla.id,
        plantillaId,
        regla.titulo,
        regla.descripcion ?? null,
        regla.puntajeBase,
        regla.alcance,
        regla.asignacionUnica ? 1 : 0,
        regla.orden,
      ],
    );
  }

  for (const ronda of datos.rondas) {
    const rondaId = nuevoId();
    await db.runAsync(
      'INSERT INTO ronda_plantilla (id, plantilla_id, numero, objetivo) VALUES (?, ?, ?, ?)',
      [rondaId, plantillaId, ronda.numero, ronda.objetivo ?? null],
    );

    for (const [reglaId, puntaje] of Object.entries(ronda.ajustes)) {
      // La foreign key solo mira que la regla exista, no que sea de ESTA plantilla.
      if (!reglasPropias.has(reglaId)) {
        throw new Error(`La ronda ${ronda.numero} ajusta la regla ${reglaId}, que no es de esta plantilla`);
      }
      await db.runAsync(
        'INSERT INTO puntaje_regla_por_ronda (ronda_plantilla_id, regla_id, puntaje) VALUES (?, ?, ?)',
        [rondaId, reglaId, puntaje],
      );
    }
  }
}

async function exigirEditable(db: SQLiteDatabase, id: string): Promise<void> {
  const fila = await db.getFirstAsync<{ es_predefinida: number }>(
    'SELECT es_predefinida FROM plantilla WHERE id = ?',
    [id],
  );
  if (fila === null) throw new Error(`No existe la plantilla ${id}`);
  if (fila.es_predefinida === 1) {
    throw new Error('Las plantillas predefinidas no se editan ni se borran: se duplican (RF-303)');
  }
}
