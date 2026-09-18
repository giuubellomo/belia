-- Esquema de BELIA (paso 2.1 del plan).
--
-- Convenciones:
--   - nombres de tabla y columna en snake_case, sin acentos
--   - ids TEXT con uuid (RNF-9), nunca autoincremental
--   - timestamps TEXT en ISO 8601 (RNF-9)
--   - booleanos INTEGER 0/1
--
-- Este archivo es la migracion 1 (paso 2.2). No se edita para cambiar el modelo:
-- un cambio de esquema entra como migracion nueva.

-- ---------------------------------------------------------------------------
-- Participantes y plantillas: los datos "vivos", los que el usuario edita.
-- ---------------------------------------------------------------------------

CREATE TABLE participante (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  avatar_tipo TEXT NOT NULL CHECK (avatar_tipo IN ('color','icono')),
  avatar_valor TEXT NOT NULL,
  es_dueno INTEGER NOT NULL DEFAULT 0,
  archivado INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL
);

CREATE TABLE plantilla (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  icono TEXT NOT NULL,
  es_predefinida INTEGER NOT NULL DEFAULT 0,
  modo_puntos TEXT NOT NULL CHECK (modo_puntos IN ('suma','resta')),
  criterio_victoria TEXT NOT NULL CHECK (criterio_victoria IN ('menor','mayor')),
  rondas_ilimitadas INTEGER NOT NULL DEFAULT 0,
  creada_en TEXT NOT NULL,
  editada_en TEXT NOT NULL
);

CREATE TABLE regla_plantilla (
  id TEXT PRIMARY KEY,
  plantilla_id TEXT NOT NULL REFERENCES plantilla(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  puntaje_base INTEGER NOT NULL CHECK (puntaje_base <> 0),
  alcance TEXT NOT NULL CHECK (alcance IN ('todas','opcional')),
  asignacion_unica INTEGER NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL
);

CREATE TABLE ronda_plantilla (
  id TEXT PRIMARY KEY,
  plantilla_id TEXT NOT NULL REFERENCES plantilla(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,          -- el numero ES el orden: no hay columna orden aparte
  objetivo TEXT,
  UNIQUE (plantilla_id, numero)
);

CREATE TABLE puntaje_regla_por_ronda (
  ronda_plantilla_id TEXT NOT NULL REFERENCES ronda_plantilla(id) ON DELETE CASCADE,
  regla_id TEXT NOT NULL REFERENCES regla_plantilla(id) ON DELETE CASCADE,
  puntaje INTEGER NOT NULL CHECK (puntaje <> 0),   -- mismo criterio que puntaje_base (RF-404)
  PRIMARY KEY (ronda_plantilla_id, regla_id)
);

-- ---------------------------------------------------------------------------
-- Partidas: datos congelados. Guardan snapshot de plantilla y participantes
-- (C-4, C-5), asi que sobreviven a que se edite o se borre el original.
-- ---------------------------------------------------------------------------

CREATE TABLE partida (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  plantilla_snapshot TEXT NOT NULL,     -- JSON del tipo Plantilla (C-5)
  estado TEXT NOT NULL CHECK (estado IN ('en_curso','finalizada')),
  iniciada_en TEXT NOT NULL,
  finalizada_en TEXT
);

-- participante_id no lleva foreign key: la partida sobrevive aunque se borre
-- el participante, porque guarda su snapshot. Vale para las tres tablas de abajo.
CREATE TABLE partida_participante (
  partida_id TEXT NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
  participante_id TEXT NOT NULL,
  nombre_snapshot TEXT NOT NULL,
  avatar_tipo_snapshot TEXT NOT NULL,
  avatar_valor_snapshot TEXT NOT NULL,
  orden INTEGER NOT NULL,
  PRIMARY KEY (partida_id, participante_id)
);

-- No hay columna ronda_actual en partida: la ronda en curso es, por definicion,
-- la unica fila con estado = 'en_curso' y se deriva de aca siempre.
CREATE TABLE ronda_partida (
  id TEXT PRIMARY KEY,
  partida_id TEXT NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  objetivo TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('bloqueada','en_curso','cerrada')),
  UNIQUE (partida_id, numero)
);

CREATE TABLE puntaje_ronda (
  ronda_partida_id TEXT NOT NULL REFERENCES ronda_partida(id) ON DELETE CASCADE,
  participante_id TEXT NOT NULL,
  puntos_manuales INTEGER,              -- NULL = todavia no cargo
  PRIMARY KEY (ronda_partida_id, participante_id)
);

CREATE TABLE marca_regla (
  ronda_partida_id TEXT NOT NULL REFERENCES ronda_partida(id) ON DELETE CASCADE,
  regla_id TEXT NOT NULL,
  participante_id TEXT NOT NULL,
  puntos_aplicados INTEGER NOT NULL,    -- congelado al marcar (C-4)
  PRIMARY KEY (ronda_partida_id, regla_id, participante_id)
);
