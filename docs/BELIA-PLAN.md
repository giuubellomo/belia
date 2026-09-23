# BELIA — Guía de implementación

App para anotar puntajes de juegos de cartas. Este archivo es el plan de construcción:
está escrito para que un agente (Claude Code) lo siga paso a paso, de arriba hacia abajo.

- **Especificación funcional:** los IDs `RF-xxx`, `RNF-x`, `C-x`, `D-x` y `A-x` que aparecen
  acá refieren al documento de requerimientos de BELIA.
- **Diseño:** el mockup es en escala de grises, estilo wireframe. Las pantallas y su
  comportamiento están definidos en el canvas de diseño.
  Capturas de las 6 pantallas en `docs/mockup/`.

---

## Cómo usar este archivo

**Reglas de trabajo. Respetalas aunque el usuario no las repita:**

1. **Un paso por vez.** Hacé el paso, corré su checkpoint, contá en dos líneas qué hiciste
   y **pará**. No encadenes pasos sin que te lo pidan.
2. **No saltees fases.** No empieces un paso de la fase N+1 si la fase N tiene pasos sin
   marcar.
3. **Si un checkpoint falla, arreglalo antes de seguir.** No sigas de largo dejando algo
   roto "para después".
4. **No inventes ni renombres campos del modelo.** Las tablas y los tipos están fijados en
   las fases 1 y 2. Si te parece que falta algo, pará y decilo.
5. **Las decisiones abiertas no se resuelven solas.** Están más abajo, con una respuesta
   provisional marcada. Si un paso te obliga a cambiar una, pará y preguntá.
6. **Marcá el avance en este archivo.** Al terminar un paso, cambiá su `- [ ]` por `- [x]`.
7. **Español rioplatense en toda la interfaz** (D-4). El código en inglés, los textos de
   usuario en español, centralizados en `src/i18n/es.ts`.

---

## Stack

| | | Versión instalada |
|---|---|---|
| Framework | Expo (managed) + React Native | `expo ~57.0.24`, `react-native 0.86.3`, `react 19.2.3` |
| Lenguaje | TypeScript, `strict: true` | `typescript ~6.0.3` |
| Navegación | expo-router (file-based) | `expo-router ~57.0.22` |
| Persistencia | expo-sqlite | `expo-sqlite ~57.0.3` |
| Tests | jest + ts-jest sobre el dominio puro | `jest ~29.7.0`, `ts-jest ^29.4.12` |
| Pantalla activa | expo-keep-awake | `expo-keep-awake ~57.0.2` |

**Sin backend, sin llamadas de red** (RNF-1). Nada de Firebase, nada de auth en la v1.

### Dependencias de sostén

Instaladas en el paso 0.1 porque algo del Stack las exige, no porque agreguen capacidades.
No las saques: cada una está acá por una razón concreta.

| Paquete | Versión | Por qué |
|---|---|---|
| `react-native-safe-area-context` | `~5.7.0` | Requisito de expo-router. |
| `react-native-screens` | `~4.26.0` | Requisito de expo-router. |
| `expo-linking` | `~57.0.10` | Requisito de la guía de instalación de expo-router. |
| `expo-constants` | `~57.0.19` | Requisito de la guía de instalación de expo-router. |
| `react-dom` | `19.2.3` | **Pineada a mano.** expo-router arrastra `react-dom@19.3.0`, que exige `react@^19.3.0`, pero el SDK 57 pinea `react@19.2.3`. Sin pinearla, todo `npm install` posterior falla con `ERESOLVE`. |

**Versiones:** las manda el SDK, no npm. Antes de dar un paso por cerrado corré
`npx expo install --check`; si se queja, `npx expo install --fix`. Por eso jest quedó en la
29 y no en la 30: `npm i -D jest` instala la última y el SDK 57 espera `~29.7.0`.

**No hay `babel.config.js`, y no lo crees.** El template de SDK 57 no lo trae a propósito:
Expo aplica `babel-preset-expo` internamente. Si lo agregás, Metro se rompe con
`Cannot find module 'babel-preset-expo'`, porque el preset vive anidado en
`node_modules/expo/node_modules/` y no resuelve desde la raíz.

---

## Decisiones ya tomadas

Estas cerraban las decisiones abiertas de la especificación. Si alguna no te cierra,
cambiala **acá** antes de empezar, no a mitad de camino.

| ID | Decisión | Estado |
|---|---|---|
| A-1 | Karioka se precarga con 7 rondas (ver `seed.ts` en el paso 2.4). La usuaria puede duplicar la plantilla y editarla. | Provisional |
| A-2 | El puntaje manual se carga **siempre como número positivo**; `modo_puntos` de la plantilla decide si entra sumando o restando al total. El signo de cada regla es propio de la regla y se guarda con signo. | **Cerrada** |
| A-3 | No se elige la cantidad de rondas al armar la partida: se duplica la plantilla y se le sacan rondas. | Provisional |
| A-4 | Nombre por defecto de la partida: `Partida del <d/m>`. Editable. | Provisional |
| A-5 | Una sola partida en curso a la vez. Con una partida abierta, «Nuevo juego» sigue visible pero pide confirmación para terminar la anterior. | **Cerrada para el MVP** |
| A-6 | El acumulado va en la fila del participante, a la derecha del puntaje de la ronda, más chico y en gris. | Provisional — **es un cambio de diseño, confirmalo antes del paso 7.3** |

---

## Estructura de carpetas

Creala tal cual en el paso 0.2. El orden importa: `domain/` no importa nada de `db/`
ni de React.

```
BELIA/                        # la raíz del repo es la raíz del proyecto Expo
  docs/
    BELIA-PLAN.md             # este archivo
    mockup/                   # capturas del canvas de diseño (paso 3.2)
  app/                        # expo-router: una pantalla por archivo
    _layout.tsx
    index.tsx                 # Home
    partida/[id].tsx          # Partida en curso
    partida/[id]/final.tsx    # Podio
    plantillas/index.tsx
    plantillas/[id].tsx
    config/index.tsx
  src/
    domain/                   # TypeScript puro. Sin React, sin SQLite, sin imports de RN.
      types.ts
      scoring.ts
      ranking.ts
      rondas.ts
      __tests__/
    db/
      client.ts               # apertura de la base
      schema.sql              # fuente de verdad del esquema
      schema.generated.ts     # derivado del .sql, no se edita (paso 2.2)
      migrations.ts
      seed.ts
    repositories/             # una función por operación, SQL adentro, tipos del dominio afuera
      participantes.ts
      plantillas.ts
      partidas.ts
    hooks/                    # el puente entre repositorios y pantallas (paso 2.5)
      usePartidaEnCurso.ts
      usePartida.ts
      useParticipantes.ts
      usePlantillas.ts
    components/               # UI reutilizable
    theme/
      tokens.ts
    i18n/
      es.ts
```

---

# Fase 0 — Andamiaje

- [x] **0.1 — Crear el proyecto**

  El proyecto se crea **en la raíz del repo**, que ya existe y ya tiene `docs/` adentro.
  No lo crees en un subdirectorio: el repo y el proyecto son la misma carpeta.

  ```bash
  npx create-expo-app@latest . --template blank-typescript
  npx expo install expo-router expo-sqlite expo-keep-awake react-native-safe-area-context react-native-screens
  npm i -D jest ts-jest @types/jest
  ```

  La carpeta no está vacía (ya tiene `docs/` y el repo). Si `create-expo-app` se niega a
  escribir ahí, pará y preguntá antes de borrar nada.

  Después de crear, verificá con `git log` que el commit `Start` sigue estando y que
  `git remote -v` sigue apuntando a `origin`. El repo es el que ya existe, no uno nuevo.

  Configurá expo-router según la documentación vigente de Expo (entry point y `scheme` en
  `app.json`). No copies configuración de memoria: leé la doc de la versión que instalaste.
  `blank-typescript` no trae expo-router cableado — es trabajo tuyo y es la parte del paso
  que más fácil sale mal.

  Lo que hizo falta en SDK 57, ya aplicado:
  - `package.json`: `"main": "expo-router/entry"` (y se borran `App.tsx` e `index.ts`)
  - `app.json`: `"scheme": "belia"` y `"experiments": { "typedRoutes": true }`
  - `app/_layout.tsx` con un `<Stack />` y una ruta `app/index.tsx`, o el router no arranca.
    Ese `index.tsx` es un placeholder: el Home de verdad es el paso 4.2.
  - las dependencias de sostén de la sección Stack (`expo-linking`, `expo-constants`,
    `react-dom` pineada)

  **Checkpoint:** `npx expo start` levanta y la app abre en el teléfono o en el emulador.

- [x] **0.2 — Estructura y TypeScript estricto**

  Creá las carpetas de arriba (con un `.gitkeep` donde todavía no haya archivos).
  En `tsconfig.json`: `"strict": true` y un alias `@/*` → `src/*`.

  **Sin `baseUrl`.** TypeScript 6 lo deprecó y `tsc` corta con `TS5101` antes de mirar el
  código, así que el checkpoint falla por el config y no por el alias. Desde TS 5 los `paths`
  se resuelven relativos al propio `tsconfig.json`, así que alcanza con:

  ```json
  { "compilerOptions": { "strict": true, "paths": { "@/*": ["./src/*"] } } }
  ```

  La doc de Expo todavía muestra `baseUrl`: está escrita para TypeScript 5. No la copies.

  Metro resuelve estos alias solo (`tsconfigPaths` viene activado por defecto), así que no
  hace falta tocar `app.json` ni `metro.config.js`. Después de cambiar `tsconfig.json` hay
  que reiniciar el server para que los tome.

  **`"types": ["jest"]` hace falta.** TypeScript 6 dejó de auto-incluir los paquetes de
  `node_modules/@types`: solo entra lo que se importa. Sin declararlo, `npm run typecheck`
  se cae en los archivos de test con `TS2593: Cannot find name 'describe'`, aunque
  `@types/jest` esté instalado y `npm test` pase. Aparece recién en el paso 1.2, cuando
  existe el primer test.

  **Checkpoint:** `npx tsc --noEmit` pasa sin errores.

- [x] **0.3 — Jest sobre el dominio**

  Configurá jest con ts-jest, limitado a `src/domain`. No necesitás jest-expo todavía:
  el dominio es TypeScript puro y se testea sin React Native.

  Si el dominio importa con el alias `@/…`, jest necesita el `moduleNameMapper` equivalente
  (`'^@/(.*)$': '<rootDir>/src/$1'`). Sin eso el checkpoint falla por una razón que no tiene
  nada que ver con el código.

  ```json
  { "scripts": { "test": "jest", "typecheck": "tsc --noEmit" } }
  ```

  **`tsconfig.jest.json` aparte, que no extiende el de Expo.** El tsconfig del proyecto usa
  `module: preserve` y `moduleResolution: bundler`, que jest no puede ejecutar, y esas dos
  opciones no se pueden pisar de a una sin chocar con `customConditions`. Como el dominio es
  TypeScript puro, su tsconfig de tests no necesita nada de Expo: se declara solo, con
  `module: commonjs`, `moduleResolution: node10` y el mismo alias.

  **`--passWithNoTests` era temporal y ya se sacó** (paso 1.4). Estaba para que este
  checkpoint pasara con el dominio todavía vacío. Hoy `npm test` es `jest` a secas, así que
  si alguien rompe `roots` en `jest.config.js` y no corre ni un test, sale con código 1 en
  vez de dar verde. No lo vuelvas a agregar.

  **Checkpoint:** `npm test` corre y reporta 0 tests sin fallar.

  Verificá además que jest realmente **typechequea**: un test que le pase un `string` a una
  función de `number` tiene que fallar la suite con `TS2345`, no pasar transpilando.

---

# Fase 1 — Dominio puro

Esta es la fase más importante. Toda la lógica de puntaje vive acá, en funciones puras y
testeadas, **antes** de que exista una sola pantalla. Si esto queda bien, el resto es
pegar botones.

- [x] **1.1 — Tipos del dominio**

  `src/domain/types.ts`:

  ```ts
  export type AvatarTipo = 'color' | 'icono';
  export type ModoPuntos = 'suma' | 'resta';
  export type CriterioVictoria = 'menor' | 'mayor';
  export type AlcanceRegla = 'todas' | 'opcional';
  export type EstadoRonda = 'bloqueada' | 'en_curso' | 'cerrada';
  export type EstadoPartida = 'en_curso' | 'finalizada';

  export interface Participante {
    id: string;
    nombre: string;
    avatarTipo: AvatarTipo;
    avatarValor: string;
  }

  export interface Regla {
    id: string;
    titulo: string;
    descripcion?: string;
    puntajeBase: number;        // con signo, distinto de cero
    alcance: AlcanceRegla;
    asignacionUnica: boolean;
    orden: number;
  }

  export interface RondaDefinida {
    numero: number;
    objetivo?: string;
    /** puntaje de una regla solo para esta ronda; pisa a puntajeBase (RF-503) */
    ajustes: Record<string, number>;   // reglaId -> puntaje
  }

  export interface Plantilla {
    id: string;
    nombre: string;
    icono: string;
    modoPuntos: ModoPuntos;
    criterioVictoria: CriterioVictoria;
    rondasIlimitadas: boolean;
    reglas: Regla[];
    rondas: RondaDefinida[];
  }

  /** Lo que se carga para un participante en una ronda */
  export interface EntradaRonda {
    participanteId: string;
    /** siempre positivo o null; el signo lo pone modoPuntos (A-2) */
    puntosManuales: number | null;
    /** reglaId -> puntos congelados al marcar (C-4) */
    marcas: Record<string, number>;
  }

  export interface RondaJugada {
    numero: number;
    objetivo?: string;
    estado: EstadoRonda;
    entradas: EntradaRonda[];
  }

  export interface Partida {
    id: string;
    nombre: string;
    estado: EstadoPartida;
    plantilla: Plantilla;        // el snapshot congelado (C-5)
    participantes: Participante[];
    rondas: RondaJugada[];
  }
  ```

  **Checkpoint:** `npm run typecheck` pasa.

- [x] **1.2 — Cálculo de puntaje** (C-1, C-2, A-2)

  `src/domain/scoring.ts`:

  ```ts
  /** C-1: lo que hizo un participante en una ronda. */
  export function puntajeDeRonda(entrada: EntradaRonda, modo: ModoPuntos): number;

  /** C-2: total acumulado de un participante en toda la partida. */
  export function totalDeParticipante(partida: Partida, participanteId: string): number;

  /** Todos los totales de una vez, para la vista de partida y el podio. */
  export function totalesDePartida(partida: Partida): Array<{ participanteId: string; total: number }>;
  ```

  Reglas de implementación:
  - `puntosManuales` entra con el signo que dicta `modo`: `suma` → `+n`, `resta` → `-n`.
  - Cada marca entra con el valor **guardado en la marca**, no con el de la regla viva (C-4).
  - `puntosManuales === null` cuenta como 0 para el acumulado, pero eso **no** significa
    que la ronda esté completa: esa validación es del paso 1.4.

  **Checkpoint:** escribí estos tests en `src/domain/__tests__/scoring.test.ts` y hacelos pasar:
  - modo `suma`, 25 puntos manuales, sin marcas → `25`
  - modo `resta`, 25 puntos manuales, sin marcas → `-25`
  - modo `suma`, 25 manuales + marca de `-20` → `5`
  - modo `resta`, 25 manuales + marca de `-20` → `-45`
    — **el signo de la marca no se invierte nunca con `modo`** (A-2). `modo` manda sobre el
    puntaje manual y sobre nada más. Este test existe para que nadie lo "arregle" después.
  - `puntosManuales: null` + marca de `-20` → `-20`
  - total de 3 rondas suma las 3, incluida la que está `en_curso`
  - `totalesDePartida` devuelve un total por participante, incluidos los que no cargaron nada

- [x] **1.3 — Ranking y empates** (C-3, RF-801, RF-804)

  `src/domain/ranking.ts`:

  ```ts
  export interface Puesto {
    posicion: number;          // 1, 1, 3 en caso de empate
    participanteId: string;
    total: number;
  }
  export function rankear(partida: Partida): Puesto[];
  ```

  **Checkpoint:** tests en `ranking.test.ts`:
  - criterio `menor`: totales `-55, -40, -25, -10` → posiciones `1, 2, 3, 4`
  - criterio `mayor`: los mismos totales → el orden se invierte
  - empate en el primer puesto → `1, 1, 3` (el 2 se saltea)
  - dos participantes → devuelve dos puestos, sin huecos

- [x] **1.4 — Estado de la ronda** (RF-406, RF-706, RF-707)

  `src/domain/rondas.ts`:

  ```ts
  /** Puntaje que vale una regla en una ronda concreta: el ajuste si existe, si no el base. */
  export function puntajeDeReglaEnRonda(plantilla: Plantilla, numeroRonda: number, reglaId: string): number;

  /** RF-707: ¿todos cargaron su puntaje? */
  export function todosCargaron(ronda: RondaJugada, participantes: Participante[]): boolean;

  /** RF-706: las reglas de alcance 'todas' tienen que estar asignadas a alguien. */
  export function reglasSinAsignar(ronda: RondaJugada, plantilla: Plantilla): Regla[];

  /** RF-707 + RF-706 juntos. */
  export function puedeCerrarRonda(ronda: RondaJugada, plantilla: Plantilla, participantes: Participante[]):
    { puede: true } | { puede: false; motivo: 'faltan_puntajes' | 'faltan_reglas'; reglas?: Regla[] };

  /** RF-406: marcar una regla única a alguien se la saca al anterior. */
  export function marcarRegla(ronda: RondaJugada, plantilla: Plantilla, reglaId: string, participanteId: string): RondaJugada;

  /** Saca la marca de una regla a un participante. El tilde del paso 7.4 es un toggle. */
  export function desmarcarRegla(ronda: RondaJugada, reglaId: string, participanteId: string): RondaJugada;
  ```

  `marcarRegla` y `desmarcarRegla` son **puras**: devuelven una ronda nueva, no mutan la que
  reciben. Desmarcar no necesita la plantilla: solo borra una marca ya congelada.

  **Checkpoint:** tests en `rondas.test.ts`:
  - `puntajeDeReglaEnRonda` devuelve el ajuste cuando existe y el base cuando no
  - `puedeCerrarRonda` con un participante sin puntaje → `faltan_puntajes`
  - todos con puntaje pero una regla `todas` sin asignar → `faltan_reglas` y la nombra
  - una regla `opcional` sin marcar **no** bloquea
  - `marcarRegla` con `asignacionUnica: true` deja exactamente una marca de esa regla en toda la ronda
  - `marcarRegla` con `asignacionUnica: false` permite dos participantes marcados
  - `desmarcarRegla` saca esa marca y deja intactos los puntajes manuales y las demás marcas
  - `desmarcarRegla` sobre una regla que no estaba marcada devuelve una ronda equivalente, sin romper

**Fin de fase 1.** No sigas si `npm test` no está en verde. Todo lo que viene se apoya en esto.

---

# Fase 2 — Base de datos

- [x] **2.1 — Esquema**

  `src/db/schema.sql`. Nombres de tabla y columna en `snake_case` y sin acentos.
  Ids `TEXT` con uuid, timestamps `TEXT` en ISO 8601 (RNF-9).

  ```sql
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

  CREATE TABLE partida (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    plantilla_snapshot TEXT NOT NULL,     -- JSON del tipo Plantilla (C-5)
    estado TEXT NOT NULL CHECK (estado IN ('en_curso','finalizada')),
    iniciada_en TEXT NOT NULL,
    finalizada_en TEXT
  );

  CREATE TABLE partida_participante (
    partida_id TEXT NOT NULL REFERENCES partida(id) ON DELETE CASCADE,
    participante_id TEXT NOT NULL,
    nombre_snapshot TEXT NOT NULL,
    avatar_tipo_snapshot TEXT NOT NULL,
    avatar_valor_snapshot TEXT NOT NULL,
    orden INTEGER NOT NULL,
    PRIMARY KEY (partida_id, participante_id)
  );

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
    puntos_manuales INTEGER,              -- NULL = todavía no cargó
    PRIMARY KEY (ronda_partida_id, participante_id)
  );

  CREATE TABLE marca_regla (
    ronda_partida_id TEXT NOT NULL REFERENCES ronda_partida(id) ON DELETE CASCADE,
    regla_id TEXT NOT NULL,
    participante_id TEXT NOT NULL,
    puntos_aplicados INTEGER NOT NULL,    -- congelado al marcar (C-4)
    PRIMARY KEY (ronda_partida_id, regla_id, participante_id)
  );
  ```

  `participante_id` en las tablas de partida **no** lleva foreign key: la partida sobrevive
  aunque se borre el participante, porque guarda su snapshot.

  **No hay columna `ronda_actual` en `partida`.** La ronda en curso es, por definición, la
  única fila de `ronda_partida` con `estado = 'en_curso'`, y se deriva de ahí siempre. Una
  columna aparte sería una segunda fuente de verdad y se desincronizaría en cuanto alguien
  corrija una ronda vieja (RF-709).

  **Checkpoint:** el archivo existe y es SQL válido.

- [x] **2.2 — Conexión y migraciones** (RNF-10)

  `src/db/client.ts` abre la base con `expo-sqlite`, activa `PRAGMA foreign_keys = ON`
  y corre las migraciones pendientes.

  `src/db/migrations.ts` mantiene una lista ordenada de migraciones y usa `user_version`
  de SQLite para saber cuáles faltan. La migración 1 es el esquema del paso 2.1.

  **El SQL llega al bundle como TypeScript.** Metro no importa archivos `.sql`, así que
  `scripts/generar-schema.mjs` deriva `src/db/schema.generated.ts` desde `schema.sql`.
  El `.sql` sigue siendo la única fuente de verdad; el `.ts` no se edita a mano. Si tocás
  el esquema: `npm run db:schema`. Para verificar que no quedó viejo: `npm run db:schema:check`.

  **Una migración publicada no se edita.** Se agrega otra abajo con `version + 1`. Cada una
  corre en una transacción junto con su `PRAGMA user_version`, así que o entra entera o no entra.

  **Checkpoint:** la app arranca, crea el archivo de base y a la segunda corrida no vuelve
  a aplicar la migración 1.

- [x] **2.3 — Repositorios**

  Un archivo por agregado en `src/repositories/`. Cada función recibe y devuelve **tipos del
  dominio**, nunca filas crudas: el mapeo `snake_case` → `camelCase` vive acá y en ningún
  otro lado.

  Mínimo necesario:

  ```
  participantes.ts   listar, obtener, crear, actualizar, archivar, obtenerDueno
  plantillas.ts      listar, obtener (arma la Plantilla completa con reglas y rondas),
                     crear, actualizar, duplicar, borrar
  partidas.ts        obtenerEnCurso, obtener (arma la Partida completa),
                     crear (congela el snapshot), guardarPuntaje, marcarRegla,
                     desmarcarRegla, cerrarRonda, abrirRonda, finalizar
  ```

  `partidas.obtener` devuelve el tipo `Partida` del paso 1.1, con el snapshot ya parseado.
  Ese es el objeto que consumen las funciones puras de la fase 1.

  **Cómo quedó** (ver registro, cambios 23 a 27):
  - Las rondas de una partida se nombran por su **número**, como en `RondaJugada`. Los ids
    de `ronda_partida` no salen del repositorio.
  - `abrirRonda` no es una función aparte: abrir la siguiente es parte de `cerrarRonda`.
  - Los repositorios validan lo que la base no puede: una sola partida en curso (A-5),
    puntaje manual entero y positivo (A-2), predefinidas intocables (RF-303), ronda
    bloqueada o partida finalizada no se editan, y `cerrarRonda` exige `puedeCerrarRonda`.
  - Todo acceso pasa por `leer` / `escribir` de `db/client.ts`. Adentro de una tarea se usa
    el `db` que llega por parámetro, nunca otra función pública de un repositorio.

  **Checkpoint:** `npm run typecheck` pasa y ningún archivo fuera de `repositories/`
  contiene SQL. `db/` queda afuera de esa regla: esquema, migraciones y control de
  transacciones son la infraestructura del paso 2.2.

- [x] **2.4 — Semilla de plantillas predefinidas** (RF-301)

  `src/db/seed.ts` corre una sola vez, en la primera apertura, e inserta:

  **Karioka** — `modoPuntos: 'suma'`, `criterioVictoria: 'menor'`, `rondasIlimitadas: false`.
  Reglas:
  - `Bajó primero`, base `-10`, alcance `todas`, asignación única
  - `Cortó`, base `-10`, alcance `todas`, asignación única

  Rondas (A-1, provisional):

  | # | Objetivo | Ajuste de Bajó / Cortó |
  |---|---|---|
  | 1 | 2 piernas | −10 |
  | 2 | 1 pierna + 1 escalera | −20 |
  | 3 | 2 escaleras | −30 |
  | 4 | 3 piernas | −40 |
  | 5 | 2 piernas + 1 escalera | −50 |
  | 6 | 1 pierna + 2 escaleras | −60 |
  | 7 | 3 escaleras | −70 |

  **Simple** — `modoPuntos: 'suma'`, `criterioVictoria: 'mayor'`, `rondasIlimitadas: true`,
  sin reglas y sin rondas definidas.

  **Cómo quedó** (ver registro, cambios 28 a 31): las predefinidas tienen ids fijos y
  `app/_layout.tsx` llama a `sembrar()` en cada arranque, antes de montar las pantallas.
  `plantillas.asegurarPredefinidas` inserta solo las que falten, así que la primera vez
  entran las dos y después no entra nada.

  **Checkpoint:** en una base recién creada, `plantillas.listar()` devuelve las dos, Karioka
  con 2 reglas y 7 rondas. Borrar la app y reinstalar vuelve a sembrarlas sin duplicar.

- [x] **2.5 — Hooks: cómo la pantalla se entera de que la base cambió** (RNF-2)

  Este paso define el único patrón de acceso a datos de toda la app. Resolvelo acá, con la
  cabeza fría, y no en medio de la fase 7.

  La regla: **después de cada escritura se recarga el agregado entero desde la base.** Nada
  de estado optimista, nada de parchear el objeto en memoria. La `Partida` es chica (hasta 8
  participantes por unas pocas rondas) y las funciones puras de la fase 1 ya trabajan sobre
  el objeto completo, así que recargar es barato y elimina de raíz toda una familia de bugs
  de desincronización.

  En `src/hooks/`:

  ```ts
  /** Devuelve la Partida completa y un mutar() que escribe y recarga. */
  function usePartida(id: string): {
    partida: Partida | null;
    cargando: boolean;
    mutar: (accion: () => Promise<void>) => Promise<void>;
  };
  ```

  `mutar` corre la escritura del repositorio, espera, y vuelve a llamar a
  `partidas.obtener(id)`. Las pantallas nunca llaman a un repositorio directo: piden un hook.

  Lo mismo para `usePartidaEnCurso()`, `useParticipantes()` y `usePlantillas()`.

  **Cómo quedó** (ver registro, cambios 32 a 34): la base común es `useConsulta` en
  `src/hooks/useConsulta.ts`. `mutar` recarga **todos** los hooks montados, no solo el que la
  llamó, y devuelve lo que devuelva la escritura. Las pantallas leen solo con hooks y
  escriben pasando la llamada al repositorio adentro de `mutar`.

  **Checkpoint:** con la partida abierta, guardar un puntaje desde el popup actualiza la fila
  y el acumulado sin que ninguna pantalla haga `setState` sobre datos de la base a mano.
  **Se verifica en el paso 7.4**, que es cuando existe el popup (cambio 33). Al cerrar el 2.5
  se verificó `npm run typecheck`.

---

# Fase 3 — Sistema de diseño

El mockup es monocromo a propósito. Construí los componentes en escala de grises;
si más adelante entra color, entra por los tokens y en un solo lugar.

- [x] **3.1 — Tokens**

  `src/theme/tokens.ts`: escala de grises, tipografía, espaciado, radios.
  Valores del mockup: tinta `#1C1C1E`, gris medio `#9A9AA0`, línea `#D8D8DC`,
  superficie `#F2F2F4`, fondo `#FFFFFF`. Radios 10 / 12 / 14 / 16 / 18.
  **Altura mínima de cualquier área tocable: 44** (RNF-3).

  **Cómo quedó** (ver registro, cambio 35): `colores`, `radios`, `espacios`, `tipografia`,
  `AREA_TOCABLE_MINIMA` y `numerales` (RNF-4). Tipografía y espaciado quedaron fijos en el
  paso 3.2, tomados de las capturas del mockup (cambio 38).

- [x] **3.2 — Componentes base**

  En `src/components/`, cada uno con su archivo:

  `Avatar` (color o ícono, tamaños 32/40/60), `Boton` (primario / secundario / deshabilitado),
  `Chip`, `Card`, `BottomSheet`, `Popup`, `Stepper`, `Segmented`, `CampoTexto`, `Vacio`.

  `Avatar` recibe `{ tipo, valor, nombre, tamano }` y resuelve solo si muestra inicial o ícono.

  **Checkpoint:** una pantalla temporal que renderiza todos los componentes en todos sus
  estados. Miralo en el teléfono, ajustá, y después borrá la pantalla.

  **Cómo quedó** (ver registro, cambios 36 a 40): los diez, más `Etiqueta` y `BotonIcono`.
  `Avatar` suma `onPress` y `seleccionado` para el selector del paso 4.3. Los íconos son
  glifos de texto en `src/theme/iconos.ts`. Verificado en el teléfono con la pantalla
  temporal, que ya se borró.

- [x] **3.3 — Textos**

  `src/i18n/es.ts` con todas las cadenas de interfaz. Ningún texto visible se escribe
  suelto en un componente.

  **Cómo quedó** (ver registro, cambio 41): un objeto `es` por pantalla, con funciones para
  los textos que llevan un dato, y `conSigno()` para mostrar puntajes con el signo menos
  tipográfico. Incluye los textos del mockup y los que ya fija el plan (A-4, A-5, RF-202,
  RF-404, RF-706).

---

# Fase 4 — Home y participantes

- [x] **4.1 — Alta del dueño del dispositivo** (RF-205, RF-901)

  En el primer arranque, si no hay participante con `es_dueno = 1`, pedir nombre y avatar
  antes de mostrar el home.

  **Cómo quedó** (ver registro, cambios 42 a 44): `app/bienvenida.tsx`, una pantalla con la
  marca arriba y el formulario del popup «Agregar participante» abajo. `_layout.tsx` la
  muestra con `Stack.Protected` mientras no hay dueño.

  **Checkpoint:** primera corrida pide los datos; la segunda va directo al home.

- [x] **4.2 — Home** (RF-101 a RF-105)

  `app/index.tsx`. Consulta `partidas.obtenerEnCurso()` (vía `usePartidaEnCurso`, paso 2.5):
  - hay partida → se muestran las dos acciones, con plantilla, cantidad de jugadores y ronda
  - no hay → solo «Nuevo juego» y la línea de estado vacío

  **A-5 se hace cumplir acá.** Con una partida en curso, «Nuevo juego» sigue visible, pero al
  tocarlo abre una confirmación en lugar del armado: «Terminá "<nombre>" para empezar una
  nueva», con Cancelar y Terminar. Terminar finaliza la partida anterior (mismo camino que el
  paso 8.1) y recién ahí abre el sheet de armado. Nunca hay dos partidas `en_curso` a la vez.

  Abajo, los dos íconos: configuración y plantillas (todavía pueden no navegar a nada).

  **Cómo quedó** (ver registro, cambios 45 a 48): `app/index.tsx` con la marca arriba, las
  acciones abajo al alcance del pulgar y el pie con los dos íconos sobre una línea fina.
  El resumen de la partida usa `numeroRondaEnCurso()`, nuevo en el dominio. La confirmación
  de A-5 es un `Popup` con Cancelar y Terminar. Se fue el placeholder de diagnóstico de los
  pasos 2.2 y 2.4, y el Home quedó sin header.

  **Checkpoint:** las dos variantes del home se ven según haya o no partida en curso.
  Verificada en el teléfono la variante **sin partida**; la de partida en curso queda para
  el paso 6.2 (cambio 48).

- [x] **4.3 — Crear y editar participantes** (RF-201 a RF-204)

  Popup de alta con nombre y selector de color o ícono. Validación: obligatorio,
  máximo 20 caracteres, sin repetir entre activos.

  **Cómo quedó** (ver registro, cambios 49 y 50): `src/components/PopupParticipante.tsx`,
  el popup del mockup sobre el `FormularioParticipante` del 4.1. Sin `participante` da de
  alta; con uno, edita (RF-203). Escribe por `mutar`, avisa al que lo montó con qué se
  guardó, y cada apertura monta un formulario limpio.

  **Checkpoint:** se crea un participante, se cierra y se reabre la app, y sigue ahí.
  Diferido al paso 6.1, que es donde el popup se abre (cambio 49).

---

# Fase 5 — Plantillas y reglas

- [x] **5.1 — Lista de plantillas** (RF-303, RF-304, RF-305)

  `app/plantillas/index.tsx`. Las predefinidas se muestran con un candado: se duplican,
  no se editan ni se borran. Borrar una propia pide confirmación (RNF-6).

  **Cómo quedó** (ver registro, cambios 51 y 52): card punteada «+ Nueva plantilla» arriba
  y una card por plantilla con ícono, nombre y resumen (`2 reglas · 7 rondas`). Las
  predefinidas llevan el sello «Predefinida» en lugar del candado y solo ofrecen Duplicar;
  las propias se tocan para editarlas y ofrecen Duplicar y Borrar, con confirmación. Se
  entra desde el ícono del pie del Home. Header nativo, con el título y el botón de volver.

  **Checkpoint:** verificado en el teléfono: duplicar Karioka dos veces da «Karioka (copia)»
  y «Karioka (copia 2)», borrar pide confirmación, y la copia sobrevive al reinicio.

- [x] **5.2 — Editor de plantilla: datos generales** (RF-302)

  `app/plantillas/[id].tsx`, primera parte: nombre, ícono, `modo_puntos`, `criterio_victoria`.

  **Cómo quedó** (ver registro, cambios 54 a 56): encabezado propio con ‹ y título, nombre e
  ícono, los dos segmentados y la línea de ayuda que se reescribe según lo elegido, con
  GUARDAR PLANTILLA al pie. El borrador vive en `useBorradorDePlantilla`, que los pasos 5.3
  y 5.4 van a reusar. El id `nueva` en la ruta es la plantilla en blanco.

  **Checkpoint:** verificado en el teléfono: se crea una plantilla desde cero, se edita una
  propia, y volver con cambios sin guardar pregunta antes de descartarlos.

- [x] **5.3 — Reglas** (RF-401 a RF-406)

  Lista de reglas de la plantilla con su puntaje y su alcance, más el sheet de alta y
  edición: título, descripción opcional, suma o resta, valor, y alcance con las dos
  opciones explicadas.

  Validación: título obligatorio, puntaje distinto de cero (RF-404).

  **Cómo quedó** (ver registro, cambios 57 a 59): `ListaDeReglas` (la sección «REGLAS · n»
  con el chip de alcance, la pastilla del puntaje y las flechas de orden) y `SheetDeRegla`
  (el sheet del mockup, más la fila «¿Quién la recibe?» y un «Eliminar» al pie). Las tres
  operaciones sobre reglas viven en `useBorradorDePlantilla`.

  **Checkpoint:** se agrega una regla a una plantilla duplicada, se reabre la app y quedó.
  Verificado en el teléfono.

- [ ] **5.4 — Rondas y ajuste por ronda** (RF-501 a RF-505)

  Lista de rondas con su objetivo y los chips de las reglas con el puntaje que valen en esa
  ronda. Editar una ronda abre un sheet con el objetivo y un stepper por regla; si el valor
  difiere del base, se guarda un `puntaje_regla_por_ronda` y se marca como ajustado.

  **Checkpoint:** cambiar el puntaje de una regla en la ronda 1 no cambia el de la ronda 2
  ni el base de la plantilla.

---

# Fase 6 — Nueva partida

- [ ] **6.1 — Bottom sheet de armado** (RF-601 a RF-605)

  Grilla de plantillas de a dos por fila, grilla de participantes de a dos por fila con el
  dueño preseleccionado y un círculo de «agregar». Tope de 8 (RF-605).

  `EMPEZAR` deshabilitado hasta tener una plantilla y dos participantes (RF-604).

  El sheet asume que **no hay ninguna partida en curso**: el home ya resolvió ese caso en el
  paso 4.2. Si igual llega a abrirse con una partida abierta, es un bug, no un caso a manejar.

- [ ] **6.2 — Crear la partida** (RF-606, A-4)

  Al confirmar:
  1. armar el objeto `Plantilla` completo desde los repositorios
  2. serializarlo en `partida.plantilla_snapshot` (C-5)
  3. copiar nombre y avatar de cada participante en `partida_participante`
  4. crear las rondas: la 1 en `en_curso` y el resto en `bloqueada`.
     Si `rondasIlimitadas` es `true` (plantilla **Simple**, que no tiene rondas definidas),
     se crea **solo la ronda 1**; las siguientes nacen de a una al cerrar la anterior (7.5).
  5. nombre por defecto `Partida del <d/m>`
  6. navegar a `partida/[id]`

  **Checkpoint:** después de crear la partida, editá la plantilla original y volvé a abrir la
  partida: **no cambió nada**. Si cambió, el snapshot está mal y hay que arreglarlo antes de
  seguir.

---

# Fase 7 — Partida en curso

El corazón de la app. Todo el cálculo sale de las funciones de la fase 1: si te encontrás
escribiendo una suma dentro de un componente, está mal.

- [ ] **7.1 — Estructura de la pantalla** (RF-701, RF-702, RF-712)

  `app/partida/[id].tsx`: encabezado con el nombre editable, lista de rondas (cerradas
  colapsadas, actual expandida, siguientes bloqueadas) y `TERMINAR` fijo abajo.

  Activá `useKeepAwake()` (RF-713).

  **Checkpoint:** salir de la pantalla y volver desde el home deja todo igual.

- [ ] **7.2 — Ronda activa** (RF-703, RF-704)

  Objetivo, puntaje que valen las reglas, y una fila por participante con avatar, nombre y
  su puntaje de la ronda. Sin cargar, un espacio tocable claramente vacío.

  **Sin botones de regla en la fila** — así quedó decidido en el diseño.

- [ ] **7.3 — Acumulado** (RF-710, A-6)

  **Confirmá A-6 antes de hacer este paso.** La opción provisional es mostrar el total a la
  derecha del puntaje de la ronda, más chico y en gris.

- [ ] **7.4 — Popup de carga** (RF-705)

  Se abre al tocar una fila: stepper de puntaje (siempre positivo, A-2) y la lista de reglas
  de esa ronda con su puntaje y un tilde.

  Al marcar una regla con `asignacionUnica`, usá `marcarRegla` del paso 1.4 y guardá
  `puntos_aplicados` con el valor que devuelve `puntajeDeReglaEnRonda` (C-4).

  **Checkpoint:** marcar «bajó primero» a un participante se lo saca al anterior,
  y los totales de los dos se actualizan.

  **Checkpoint pendiente del 2.5:** guardar un puntaje desde el popup actualiza la fila y el
  acumulado sin ningún `setState` manual sobre datos de la base. Si no pasa, el problema
  está en `src/hooks/useConsulta.ts`, no en esta pantalla.

- [ ] **7.5 — Avanzar de ronda** (RF-706, RF-707, RF-708)

  `SIGUIENTE` habilitado según `puedeCerrarRonda`. Si falta una regla de alcance `todas`,
  mostrar cuál (RF-706). Al cerrar: la ronda pasa a `cerrada`, la siguiente a `en_curso`.
  Si la plantilla es de rondas ilimitadas y no hay siguiente, crear una nueva.

  **Checkpoint:** una partida de Karioka avanza de la ronda 1 a la 2 y el objetivo cambia.
  Una partida Simple genera rondas indefinidamente.

- [ ] **7.6 — Corregir una ronda cerrada** (RF-709)

  Tocar una ronda cerrada la expande y deja editar sus puntajes. Los totales se recalculan.

  La ronda **sigue en estado `cerrada`** mientras se la corrige: corregir no la vuelve la
  ronda en curso, y la ronda `en_curso` sigue siendo la que era. Si al corregir se marca una
  regla de nuevo, `puntos_aplicados` se vuelve a congelar con `puntajeDeReglaEnRonda` para
  **esa** ronda, no para la actual (C-4).

  **Checkpoint:** corregir un puntaje de la ronda 1 cambia el acumulado en la ronda 3.

---

# Fase 8 — Finalizar

- [ ] **8.1 — Terminar la partida** (RF-710 → confirmación, RF-711, RF-805)

  `TERMINAR` pide confirmación y avisa si la ronda en curso quedó incompleta. Al confirmar,
  la partida pasa a `finalizada` y deja de aparecer en el home.

  **Consecuencia asumida:** sin historial (es fase 2), el podio se ve una sola vez. Si la
  usuaria cierra la app estando en el podio, no hay forma de volver a ese resultado. La
  partida finalizada queda en la base igual, así que el historial de fase 2 la va a encontrar.

- [ ] **8.2 — Podio** (RF-801 a RF-804)

  `app/partida/[id]/final.tsx`. Usa `rankear()` del paso 1.3. Podio en orden visual
  2º–1º–3º y el resto en lista. Con dos participantes, sin escalón vacío (RF-803).
  Empates compartiendo posición (RF-804).

  **Checkpoint:** una partida de 4 con dos empatados en primer lugar se ve correcta.

---

# Fase 9 — Cierre del MVP

- [ ] **9.1 — Configuración** (RF-901 a RF-903)

  Perfil del dueño, administración de participantes y acceso a plantillas.

- [ ] **9.2 — Confirmaciones y estados vacíos** (RNF-6)

  Revisá que borrar plantilla, borrar participante y terminar partida pidan confirmación.
  Revisá que ninguna lista vacía quede en blanco sin explicación.

- [ ] **9.3 — Repaso de no funcionales**

  - RNF-2: matá la app en medio de una ronda y verificá que no se perdió nada
  - RNF-3: ningún área tocable por debajo de 44
  - RNF-4: numerales tabulares en todos los puntajes
  - RNF-7: subí el tamaño de fuente del sistema al máximo y recorré las pantallas
  - RNF-8: medí el arranque en frío

- [ ] **9.4 — Partida completa de punta a punta**

  Armá una partida de Karioka con 4 participantes, jugá 3 rondas cargando puntajes y
  marcando reglas, corregí un puntaje viejo, terminá y mirá el podio. Sin recargar la app
  a mano en ningún momento.

---

## Convenciones

- **Nada de lógica de puntaje fuera de `src/domain`.** Los componentes muestran lo que el
  dominio calcula.
- **Nada de SQL fuera de `src/repositories`.**
- **Las pantallas no llaman repositorios directo:** pasan por un hook de `src/hooks` (paso 2.5).
  Toda escritura recarga el agregado desde la base.
- **Ids uuid siempre**, nunca el índice de un array ni un autoincremental (RNF-9).
- **Una función, un archivo, un propósito.** Si un componente pasa las 150 líneas,
  probablemente tiene adentro algo que va en un hook o en el dominio.
- **Guardar en el momento** (RNF-2). No acumules cambios en memoria para guardar al salir.
- **Textos de usuario solo desde `i18n/es.ts`.**

## Qué no hacer

- No recalcular los puntajes de una partida desde las reglas vivas de la plantilla: se usa
  el snapshot y las marcas congeladas (C-4, C-5).
- No guardar el puntaje manual con signo: positivo siempre, el signo lo pone `modo_puntos` (A-2).
- No agregar dependencias que no estén en la sección Stack sin preguntar.
- No implementar nada marcado como fase 2 en la especificación: sincronización, historial,
  compartir, exportar, tema oscuro, cuentas.
- No inventar pantallas que no estén en el mockup. Si hace falta una, pará y preguntá.

---

## Registro de cambios al plan

Revisión del 18/9/2026, antes de escribir la primera línea de código. Todo lo de acá ya está
aplicado arriba; queda anotado para que se entienda por qué el plan dice lo que dice.

| # | Cambio | Motivo |
|---|---|---|
| 1 | El proyecto se crea en la raíz del repo, no en `belia/`. El plan se mudó a `docs/`. | La carpeta ya era el repo: `create-expo-app belia` habría anidado el proyecto y creado un segundo git. |
| 2 | **Paso 2.5 nuevo**: hooks y patrón de acceso a datos. Toda escritura recarga el agregado. | `src/hooks/` estaba en la estructura y en ningún paso. Sin definirlo, la decisión caía a mitad de la fase 7, apurada. |
| 3 | Se eliminó `partida.ronda_actual`. La ronda en curso se deriva de `ronda_partida.estado`. | Dos fuentes de verdad que se contradicen apenas se corrige una ronda vieja (RF-709). |
| 4 | `desmarcarRegla` agregada al dominio (paso 1.4) con sus tests. | El repositorio ya la listaba; sin la función pura, el toggle del paso 7.4 terminaba escrito en un componente. |
| 5 | El paso 6.2 dice explícitamente que con `rondasIlimitadas` se crea solo la ronda 1. | «La 1 en curso y el resto bloqueadas» funcionaba por accidente con la plantilla Simple, que no tiene rondas. |
| 6 | A-5 se hace cumplir en el paso 4.2, con confirmación al tocar «Nuevo juego». | La decisión estaba cerrada pero ningún paso la implementaba. |
| 7 | Test de `modo: 'resta'` + marca negativa en el paso 1.2. | Fija que el signo de la marca nunca se invierte con `modo_puntos` (A-2). Es lo más fácil de romper sin darse cuenta. |
| 8 | `CHECK (puntaje <> 0)` en `puntaje_regla_por_ronda`; `ronda_plantilla` pierde `orden` y gana `UNIQUE (plantilla_id, numero)`. | Coherencia con RF-404 y con `regla_plantilla`; `numero` y `orden` eran redundantes. |
| 9 | Nota en 7.6: corregir una ronda cerrada no la vuelve `en_curso`, y re-marcar recongela el puntaje de **esa** ronda. | Era la ambigüedad más peligrosa de C-4. |
| 10 | Nota en 8.1: sin historial, el podio se ve una sola vez. | Que sea una decisión asumida y no un descubrimiento. |
| 11 | Nota sobre `moduleNameMapper` de ts-jest en el paso 0.3; aviso de que `blank-typescript` no trae expo-router cableado. | Dos checkpoints que fallan por razones que no tienen que ver con el código. |

Durante el paso 0.1 (Expo SDK 57):

| # | Cambio | Motivo |
|---|---|---|
| 12 | La tabla de Stack ahora fija versiones, y se agregó «Dependencias de sostén». | `expo-linking`, `expo-constants` y `react-dom` hicieron falta y no estaban documentadas. El plan prohíbe agregar deps sin registrarlas. |
| 13 | jest queda en `~29.7.0`, no en la 30. | `npm i -D jest` instala la última; el SDK 57 espera la 29 y `expo install --check` la rechaza. |
| 14 | Queda escrito que **no** va `babel.config.js`. | Crearlo rompe Metro: `babel-preset-expo` vive anidado en `node_modules/expo/node_modules/`. Perdido medio paso en descubrirlo. |
| 15 | El alias va **sin `baseUrl`** (paso 0.2). | TypeScript 6 lo deprecó: `tsc` corta con `TS5101` antes de mirar el código. La doc de Expo que lo muestra está escrita para TS 5. |
| 16 | `tsconfig.jest.json` propio, que no extiende el de Expo (paso 0.3). | `module: preserve` + `moduleResolution: bundler` no corren en jest, y no se pisan de a una sin chocar con `customConditions`. |
| 17 | `npm test` llevó `--passWithNoTests` entre 0.3 y 1.4, y se removió al cerrar 1.4. | Necesario para que 0 tests no fallara con el dominio vacío; peligroso de dejar una vez que hay tests. |
| 18 | `tsconfig.json` declara `"types": ["jest"]` (anotado en 0.2, surge en 1.2). | TypeScript 6 no auto-incluye `node_modules/@types`. Sin eso, `typecheck` falla en los tests con `TS2593` aunque `npm test` pase. |

Durante el paso 2.2 (conexión y migraciones):

| # | Cambio | Motivo |
|---|---|---|
| 19 | `src/db/schema.generated.ts`, generado desde `schema.sql` por `scripts/generar-schema.mjs`, con los scripts `db:schema` y `db:schema:check`. | Metro no sabe importar `.sql`. Las alternativas eran copiar el SQL a mano en un `.ts` (dos copias que se desincronizan) o cablear un loader de assets (dependencias y complejidad que el plan no autoriza). |
| 20 | `client.ts` expone `estadoBase()` y el placeholder de `app/index.tsx` lo muestra. | La mitad del checkpoint («la app arranca y crea el archivo») solo se ve en el teléfono. Es temporal: se va en el paso 4.2. El SQL queda en `db/`, no en la pantalla. |
| 21 | `migrar()` corta con error si `user_version` es mayor que la versión que conoce el build. | Una app vieja abriendo datos nuevos corrompe en silencio. Cuesta cuatro líneas detectarlo. |
| 22 | `journal_mode = WAL` además del `foreign_keys = ON` que pedía el paso. | Es la recomendación de la doc de expo-sqlite para SDK 57, y tiene que ir antes de abrir cualquier transacción. |

Durante el paso 2.3 (repositorios):

| # | Cambio | Motivo |
|---|---|---|
| 23 | `db/client.ts` expone `leer` y `escribir`: una cola que ejecuta de a una operación, y transacciones (`BEGIN IMMEDIATE`) sobre la conexión principal. No se usa `withExclusiveTransactionAsync`. | `withExclusiveTransactionAsync` abre una conexión nueva, y ahí `foreign_keys` está apagado: los `ON DELETE CASCADE` no correrían y entrarían referencias rotas sin error. Leído en el código de `expo-sqlite` 57. |
| 24 | `abrirRonda` no existe como función pública: `cerrarRonda` cierra la ronda y abre la siguiente (o la crea, con rondas ilimitadas) en la misma transacción. | Separadas, un corte entre las dos llamadas deja la partida sin ronda en curso (RNF-2). El paso 7.6 ya descarta reabrir una ronda cerrada. |
| 25 | `plantillas.listar` y `obtener` devuelven `PlantillaGuardada` = `Plantilla` + `esPredefinida`. Es un tipo del repositorio, no del dominio, y el snapshot de la partida no lo incluye. | La lista del paso 5.1 necesita el candado y `Plantilla` no tiene ese campo. No se tocó el modelo del paso 1.1. |
| 26 | `repositories/comun.ts` genera los uuid con `globalThis.expo.uuidv4()`. | Viene con el runtime nativo de Expo (`expo-modules-core`). Evita sumar `expo-crypto` o `uuid`, que no están en el Stack. |
| 27 | En `plantillas.crear` y `actualizar`, las reglas llegan con su id ya puesto; el id de la plantilla lo pone el repositorio. | Los ajustes de cada ronda apuntan a la regla por id. El editor (5.3) necesita ese id antes de guardar, y lo saca de `nuevoId()`. |

Durante el paso 2.4 (semilla):

| # | Cambio | Motivo |
|---|---|---|
| 28 | La semilla no corre «una sola vez» con una marca: corre en cada arranque desde `app/_layout.tsx`, y `plantillas.asegurarPredefinidas` inserta por id fijo solo las que falten, chequeando e insertando en la misma transacción. `plantillas.crear` ya no acepta la opción `predefinida`. | No puede correr dentro de `obtenerBase`: `escribir` esperaría a la apertura que la está llamando y la app quedaría colgada. Con ids fijos es idempotente, y una predefinida que se sume en un build futuro entra sola. |
| 29 | La ronda 1 de Karioka no guarda ajuste: vale −10, igual que el base. | El editor (5.4) guarda un ajuste solo si difiere del base y lo muestra como «ajustado». Con el ajuste guardado, la ronda 1 aparecería ajustada sin estarlo. El puntaje que vale no cambia. |
| 30 | `icono` de las predefinidas: claves provisionales `cartas` y `numeral`. | El plan no fija el set de íconos; lo define el sistema de diseño (fase 3). Si cambia, se corrige con una migración. |
| 31 | El placeholder de `app/index.tsx` suma una línea con las plantillas y llama a `plantillas.listar()` directo. | Es la mitad visible del checkpoint. Temporal como la del 2.2: se va con el paso 4.2, y los hooks recién llegan en el 2.5. |

Durante el paso 2.5 (hooks):

| # | Cambio | Motivo |
|---|---|---|
| 32 | `mutar` es una sola función para toda la app: después de escribir recarga **todos** los hooks montados, no solo el que la llamó. Es genérica: devuelve lo que devuelva la escritura. Los hooks exponen además `error`. | El Home queda montado debajo de la partida en el stack: si solo recargara el hook que escribió, al volver mostraría datos viejos. Que devuelva el resultado es para `partidas.crear`, que el paso 6.2 necesita para navegar a la partida. |
| 33 | El checkpoint del 2.5 se verifica en el paso 7.4. | Pide el popup de carga, que todavía no existe. Decisión de la usuaria: no agregar un panel de prueba ni datos falsos en la base para verificarlo antes. |
| 34 | El placeholder de `app/index.tsx` lee las plantillas con `usePlantillas` en lugar de llamar al repositorio. | Desde este paso rige que las pantallas no leen repositorios directo. |

Durante el paso 3.1 (tokens):

| # | Cambio | Motivo |
|---|---|---|
| 35 | Tipografía (6 estilos, de 12 a 28, fuente del sistema) y espaciado (escala de 4, de 4 a 32) quedan **provisionales**. Los radios se nombran por tamaño (`xs` a `xl`), no por componente. Se suma `numerales` con `tabular-nums` para RNF-4. | El plan fija colores, radios y el área tocable, pero no tipografía ni espaciado, y el mockup no está en el repo. Qué radio usa cada componente se decide en el 3.2, mirándolo en el teléfono. |

Durante el paso 3.2 (componentes base):

| # | Cambio | Motivo |
|---|---|---|
| 36 | **Íconos como glifos de texto** en `src/theme/iconos.ts`, sin dependencia: ✕ ✓ + − ‹ › ↓ ↑ ⚙ para la interfaz, ★ ☀ ☾ ♠ ♥ ♦ ♣ ♪ para avatares, y ⚄ (`cartas`) y ± (`numeral`) para plantillas. Llevan `U+FE0E` para que no se dibujen como emoji de color. | Decisión de la usuaria frente a sumar `@expo/vector-icons`. El mockup usa íconos negros, y los glifos se pintan con el color del texto. En la base se guarda la clave de plantilla, no el glifo, así que el dibujo se cambia sin migrar. |
| 37 | Dos componentes más: `Etiqueta` (título de sección en mayúsculas) y `BotonIcono` (círculo con borde: ✕, ‹, −/+). `Avatar` suma `onPress`, `seleccionado` (anillo) y `etiqueta`; sin nombre se dibuja liso. | Aparecen en todas las pantallas del mockup. El anillo de selección está en el popup de alta de participante (4.3). |
| 38 | Tokens nuevos: `grisOscuro` (`#636366`), `velo`, `COLORES_AVATAR`, y los estilos `tituloChico`, `etiqueta`, `boton` y `numeroGrande`. Cada radio quedó asignado: 10 casillas, 12 campos y segmented, 14 botones, 16 cards, 18 popup y sheet. | Salen de las capturas del mockup (`docs/mockup/`). El cuarto gris de avatar no estaba entre los cinco colores del plan. |
| 39 | Los glifos dentro de un círculo de tamaño fijo (avatar, botón de ícono) no escalan con la fuente del sistema. Todo el resto del texto sí (RNF-7). | Si crecen, se salen del círculo. |
| 40 | `BottomSheet` usa el `Modal` de React Native con animación propia. Se cierra tocando el velo, con atrás en Android o con la ✕, pero **no se arrastra**. | Arrastrar necesita `react-native-gesture-handler`, que no está en el Stack. |

Durante el paso 3.3 (textos):

| # | Cambio | Motivo |
|---|---|---|
| 41 | `es.ts` también lleva los textos que solo oye el lector de pantalla (`Cerrar`, `Sumar`…) y `conSigno()`, que escribe los puntajes con `−` (U+2212) como el mockup. Los mensajes de validación y de confirmación que el mockup no muestra (nombre vacío o repetido, puntaje cero, «¿Terminar la partida?») son **propuestas**: se revisan en el paso que los usa. No entran los datos de la base (nombres de plantilla, reglas, objetivos). | La regla es «ningún texto visible suelto», y un texto para accesibilidad es igual de visible para quien lo usa. Los datos no son interfaz: la usuaria los edita. |

Durante el paso 4.1 (alta del dueño):

| # | Cambio | Motivo |
|---|---|---|
| 42 | **Pantalla nueva**, `app/bienvenida.tsx`: «BELIA» y el subtítulo arriba, y abajo el mismo formulario del popup «Agregar participante», sin botón Cancelar. | El mockup no tiene pantalla para el alta del dueño. La eligió la usuaria entre esta y reusar el popup sobre el Home. |
| 43 | `_layout.tsx` usa `Stack.Protected` con un hook nuevo, `useDueno()`: sin dueño solo existe la bienvenida; al crearlo, el guard cambia y el router pasa al Home sacando la bienvenida del historial. | Es el mecanismo de expo-router para esto. Evita redirecciones a mano y que el botón atrás vuelva a la bienvenida. |
| 44 | El formulario es un componente, `FormularioParticipante`, y la validación del nombre (RF-202) está en `src/domain/participantes.ts` con tests: obligatorio, máximo 20 caracteres reales, sin repetir entre activos ignorando mayúsculas y espacios. | El 4.3 usa el mismo formulario. Validar es lógica pura: va al dominio y se prueba ahí, no dentro de un componente. |

Durante el paso 4.2 (Home):

| # | Cambio | Motivo |
|---|---|---|
| 45 | `numeroRondaEnCurso()` en `src/domain/rondas.ts`, con tests, aunque la fase 1 estaba cerrada. | El resumen del Home muestra en qué ronda va, y esa ronda se deriva del estado de `ronda_partida` (cambio 3). Escrita en la pantalla sería lógica fuera del dominio y sin forma de probarla. Con rondas ilimitadas, o con la última cerrada, no hay ninguna `en_curso`: devuelve la última. |
| 46 | Las cuatro acciones del Home quedan tocables pero sin destino: «Continuar partida» (paso 7.1), el armado de «Nuevo juego» (6.1), Configuración (9.1) y Agregar plantilla (5.1). | El plan ya lo permitía para los dos íconos del pie; las otras dos pantallas tampoco existen todavía y navegar a una ruta inexistente rompe el router. Cada una está marcada con el paso que la cablea. |
| 47 | Ícono nuevo `plantillaNueva` (`⊞`) y el Home sin header (`headerShown: false` en `_layout.tsx`). El popup de A-5 reusa `es.finalizar.confirmarTitulo` como título, con `es.home.terminarAnterior(nombre)` como texto. | El mockup muestra un ícono de grilla con un `+` para «Agregar plantilla» y ninguna barra de título. El texto de confirmación estaba marcado como propuesta en el cambio 41: se confirma acá. |
| 48 | La mitad del checkpoint que pide una partida en curso se verifica en el paso 6.2. | Ninguna pantalla crea partidas hasta ese paso. Misma decisión de la usuaria que el cambio 33: no meter datos falsos en la base para adelantar una verificación. El cálculo de la ronda queda cubierto por los tests del cambio 45. |

Durante el paso 4.3 (participantes):

| # | Cambio | Motivo |
|---|---|---|
| 49 | El paso entrega un componente, `PopupParticipante`, y ninguna pantalla lo monta todavía: lo abren el sheet de armado (6.1) y la configuración (9.1). Su checkpoint se verifica en el 6.1. Texto nuevo: `participante.editarTitulo`. | El popup del mockup vive sobre el sheet de «Nueva partida», que todavía no existe, y el plan prohíbe inventar pantallas que el mockup no tiene. Decisión de la usuaria, como en los cambios 33 y 48: antes diferir la verificación que agregar un host de prueba. El formulario y la validación (RF-202) ya estaban del 4.1. |
| 50 | Archivar un participante (RF-204) se implementa en el 9.1, no acá. El popup solo da de alta y edita. | El plan ya pone «administración de participantes» en Configuración (9.1), y el mockup no muestra un botón de eliminar dentro del popup. `participantes.archivar` está desde el 2.3 y el 9.2 revisa que pida confirmación. |

Durante el paso 5.1 (lista de plantillas):

| # | Cambio | Motivo |
|---|---|---|
| 51 | El ícono del pie del Home dice «Plantillas» y no «Agregar plantilla», y abre la lista. | El mockup no tiene pantalla de lista: ahí el ícono va directo a «Nueva plantilla». Pero duplicar (RF-304) y borrar (RF-305) no tienen otra puerta de entrada, y el plan pide la lista. Desde la lista se agrega con la card punteada, así que el «agregar» del mockup no se pierde. |
| 52 | Las predefinidas se marcan con un `Chip` que dice «Predefinida», no con un candado. La lista usa el header nativo del stack en lugar del encabezado dibujado del mockup. | Los glifos de candado disponibles se dibujan como emoji de color en el teléfono y romperían el monocromo (misma razón que el cambio 36). La pantalla no está en el mockup, así que no hay encabezado propio que copiar, y el header nativo trae el botón de volver. |
| 53 | Duplicar numera desde la segunda copia: «Karioka (copia)», «Karioka (copia 2)». | `plantilla.nombre` no es único en la base, y dos plantillas con el mismo nombre no se distinguen en la grilla del armado (6.1). |

Durante el paso 5.2 (editor: datos generales):

| # | Cambio | Motivo |
|---|---|---|
| 54 | **El editor de plantillas no guarda en el momento**: arma un borrador en memoria y escribe la plantilla entera al tocar GUARDAR PLANTILLA. Volver con cambios sin guardar pide confirmación; el gesto de arrastrar está apagado y el botón atrás de Android pasa por la misma confirmación. | Choca con la convención «guardar en el momento» (RNF-2), así que lo decidió la usuaria. Es lo que dibuja el mockup y para lo que se escribió el repositorio (`actualizar` reemplaza reglas y rondas enteras). La alternativa creaba una plantilla vacía apenas se entraba a «Nueva plantilla» y no dejaba arrepentirse de un cambio. La confirmación cubre lo que RNF-2 protege: que no se pierda nada en silencio. |
| 55 | El borrador es un hook, `useBorradorDePlantilla`: expone `borrador`, `sucio`, `cambiar` y `guardar`, y no se pisa cuando `mutar` recarga las plantillas. `ID_NUEVA` (`'nueva'`) es el id de ruta de una plantilla en blanco; no hay `app/plantillas/nueva.tsx`. | La pantalla pasaba las 150 líneas de la convención, y los pasos 5.3 y 5.4 editan el mismo borrador. El plan fija `app/plantillas/[id].tsx` como única ruta del editor. |
| 56 | Al guardar, `rondasIlimitadas` se deriva: sin rondas definidas, la plantilla es de rondas libres. El nombre se corta en 30 caracteres. | Es la invariante que ya cumplen las predefinidas (Karioka 7 rondas, Simple ninguna) y evita una plantilla de cero rondas fijas, que no se puede jugar. El largo del nombre no estaba fijado y tiene que entrar en la card de la grilla del armado (6.1). |

Durante el paso 5.3 (reglas):

| # | Cambio | Motivo |
|---|---|---|
| 57 | El sheet de la regla lleva una fila que el mockup no tiene: **«¿Quién la recibe?»**, con «Una sola persona» (por defecto) o «Varias». Es `asignacionUnica` (RF-406). | Alguien tiene que decidir ese campo y el mockup no lo muestra. Decisión de la usuaria entre esto, derivarlo del alcance o fijarlo siempre en «una sola persona»: derivarlo dejaba mal al «7 de oro», que es opcional y lo tiene una sola persona. En la lista solo se anuncia la excepción («Varias»). |
| 58 | Las reglas se reordenan con flechas ↑ ↓ en cada fila, no arrastrando el ≡ del mockup. | Arrastrar necesita `react-native-gesture-handler`, que no está en el Stack (misma razón que el cambio 40). Decisión de la usuaria; las flechas además funcionan con el lector de pantalla. |
| 59 | El puntaje se mueve de a 5, entre 5 y 500, y se edita como magnitud + signo. Borrar una regla limpia los ajustes por ronda que la apuntaban. El «Eliminar» va al pie del contenido del sheet, no en el encabezado. | Con mínimo 5 el puntaje nunca puede ser cero (RF-404) sin un mensaje de error. Un ajuste huérfano rompe la clave foránea al guardar la plantilla. En el encabezado, «Eliminar» ocupaba el lugar de la ✕, que es la salida del sheet en el mockup. |
