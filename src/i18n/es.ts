/**
 * Todos los textos de interfaz, en español rioplatense (D-4). Paso 3.3.
 *
 * Ningun texto visible se escribe suelto en un componente o una pantalla: sale de
 * aca. Tampoco los que solo oye el lector de pantalla (`etiqueta` de los botones de
 * icono). Los que llevan un dato son funciones.
 *
 * Organizado por pantalla, como el mockup (`docs/mockup/`). Lo que todavia no
 * existe se suma cuando se construye cada pantalla.
 *
 * No van aca los datos que la usuaria carga o que vienen de la semilla (nombres de
 * plantillas, titulos de reglas, objetivos): esos viven en la base.
 */

/** «−20», «+100», «0». El menos es el signo tipografico (U+2212), no el guion. */
export function conSigno(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

export const es = {
  comun: {
    cancelar: 'Cancelar',
    guardar: 'Guardar',
    agregar: 'Agregar',
    eliminar: 'Eliminar',
    terminar: 'Terminar',
    // Solo para el lector de pantalla
    cerrar: 'Cerrar',
    volver: 'Volver',
    sumar: 'Sumar',
    restar: 'Restar',
    puntos: (n: number) => `${conSigno(n)} pts`,
    errorGuardar: 'No se pudo guardar. Probá de nuevo.',
  },

  bienvenida: {
    titulo: 'Antes de empezar',
    texto: 'Contanos cómo te llamás y elegí tu avatar. En las partidas vas a aparecer como «Tú».',
    continuar: 'CONTINUAR',
  },

  home: {
    titulo: 'BELIA',
    subtitulo: 'Anotador de partidas',
    continuarPartida: 'Continuar partida',
    /** «Karioka · 4 jugadores · Ronda 2» */
    resumenPartida: (plantilla: string, jugadores: number, ronda: number) =>
      `${plantilla} · ${jugadores} jugadores · Ronda ${ronda}`,
    nuevoJuego: 'Nuevo juego',
    sinPartidas: 'Todavía no tenés partidas guardadas',
    configuracion: 'Configuración',
    /** El mockup dice «Agregar plantilla»; el icono abre la lista (ver registro, cambio 51). */
    plantillas: 'Plantillas',
    // A-5: confirmacion al tocar «Nuevo juego» con una partida abierta
    terminarAnterior: (nombre: string) => `Terminá "${nombre}" para empezar una nueva`,
  },

  nuevaPartida: {
    titulo: 'Nueva partida',
    tipoDeJuego: 'Tipo de juego',
    proximamente: 'Próximamente',
    participantes: 'Participantes',
    agregar: 'Agregar',
    empezar: 'EMPEZAR',
    /** A-4. El dueño del dispositivo aparece como «Tú» en el armado. */
    nombrePorDefecto: (fecha: Date) => `Partida del ${fecha.getDate()}/${fecha.getMonth() + 1}`,
    tu: 'Tú',
  },

  participante: {
    agregarTitulo: 'Agregar participante',
    /** El mismo popup, con los datos cargados: alta en el 6.1, edicion en el 9.1. */
    editarTitulo: 'Editar participante',
    nombre: 'Nombre',
    nombreEjemplo: 'Ej: Sol',
    iconoOColor: 'Ícono o color',
    // RF-202: validaciones del alta
    errorNombre: {
      vacio: 'Poné un nombre',
      largo: 'Máximo 20 caracteres',
      repetido: 'Ya hay un participante con ese nombre',
    },
    // Lector de pantalla, en el selector de avatar
    colorNumero: (n: number) => `Color ${n}`,
    icono: (glifo: string) => `Ícono ${glifo}`,
  },

  /** La lista (paso 5.1). El editor de una plantilla es `plantilla`, mas abajo. */
  plantillas: {
    titulo: 'Plantillas',
    predefinida: 'Predefinida',
    /** «3 reglas · 7 rondas», «2 reglas · rondas libres» */
    resumen: (reglas: number, rondas: number | null) => {
      const cuantasReglas = reglas === 1 ? '1 regla' : `${reglas} reglas`;
      const cuantasRondas = rondas === null ? 'rondas libres' : rondas === 1 ? '1 ronda' : `${rondas} rondas`;
      return `${cuantasReglas} · ${cuantasRondas}`;
    },
    duplicar: 'Duplicar',
    borrar: 'Borrar',
    /** RF-304. El numero aparece recien en la segunda copia: «Karioka (copia 2)». */
    nombreCopia: (nombre: string, numero: number) =>
      numero === 1 ? `${nombre} (copia)` : `${nombre} (copia ${numero})`,
    // RF-305 + RNF-6
    confirmarBorrarTitulo: '¿Borrar la plantilla?',
    confirmarBorrarTexto: (nombre: string) =>
      `Se borra «${nombre}». Las partidas que ya jugaste con ella no cambian.`,
  },

  plantilla: {
    nueva: 'Nueva plantilla',
    editar: 'Editar plantilla',
    nombreEIcono: 'Nombre e ícono',
    nombreEjemplo: 'Ej: Karioka',
    /** Lector de pantalla, en el selector de icono. `clave` es la del ícono: «cartas». */
    icono: (clave: string) => `Ícono ${clave}`,
    puntosDeCadaRonda: 'Los puntos de cada ronda',
    seSuman: 'Se suman',
    seRestan: 'Se restan',
    gana: 'Gana',
    menosPuntos: 'Menos puntos',
    masPuntos: 'Más puntos',
    /**
     * Lo que queda configurado, en una linea. Las uniones son las del dominio
     * (`ModoPuntos`, `CriterioVictoria`); este archivo no importa nada.
     */
    ayudaPuntos: (modo: 'suma' | 'resta', criterio: 'menor' | 'mayor') =>
      `Los puntos de cada ronda ${modo === 'suma' ? 'se suman al' : 'se restan del'} total y gana ` +
      `quien termina con ${criterio === 'menor' ? 'menos' : 'más'}. Cada regla puede sumar o restar por separado.`,
    // Al volver con cambios sin guardar (el editor guarda recien al tocar GUARDAR)
    salirTitulo: '¿Salir sin guardar?',
    salirTexto: 'Los cambios que hiciste se pierden.',
    salir: 'Salir',
    reglas: (n: number) => `Reglas · ${n}`,
    agregarRegla: 'Agregar regla',
    rondas: (n: number) => `Rondas · ${n}`,
    ayudaRondas:
      'Las reglas se aplican en cada ronda. Tocá una ronda para cambiar el objetivo o el puntaje de una regla.',
    // Sin rondas definidas la plantilla es de rondas libres (registro, cambio 56)
    ayudaSinRondas: 'Sin rondas definidas se juegan las que quieran, y cada regla vale siempre lo mismo.',
    agregarRonda: 'Agregar ronda',
    guardar: 'GUARDAR PLANTILLA',
    // Una predefinida se abre para verla; guardar crea una copia (registro, cambio 64)
    verPredefinida: 'Plantilla predefinida',
    ayudaPredefinida: 'Esta plantilla no se modifica. Si cambiás algo, al guardar se crea una copia con tus cambios.',
    guardarCopia: 'GUARDAR COMO COPIA',
  },

  regla: {
    editar: 'Editar regla',
    nueva: 'Nueva regla',
    titulo: 'Título',
    descripcion: 'Descripción (opcional)',
    puntaje: 'Puntaje',
    suma: 'Suma',
    resta: 'Resta',
    cuandoSeAplica: '¿Cuándo se aplica?',
    enTodasLasRondas: 'En todas las rondas',
    enTodasLasRondasAyuda: 'Se pide cargarla en cada ronda',
    opcional: 'Opcional',
    opcionalAyuda: 'Se marca solo si pasó en esa ronda',
    // RF-406. No está en el mockup: decisión de la usuaria (ver registro, cambio 57).
    quienLaRecibe: '¿Quién la recibe?',
    unaPersona: 'Una sola persona',
    varias: 'Varias',
    quienLaRecibeAyuda:
      'Con «una sola persona», marcársela a alguien se la saca a quien la tenía en esa ronda.',
    // Lector de pantalla, en las flechas que ordenan la lista
    subir: 'Subir',
    bajar: 'Bajar',
    // «¿Cuándo se aplica?» de una regla que es solo de una ronda (paso 5.4)
    obligatoria: 'Obligatoria',
    obligatoriaAyuda: 'Hay que marcársela a alguien para cerrar la ronda',
    guardar: 'GUARDAR REGLA',
    // RF-404
    errorTituloVacio: 'Poné un título',
    errorPuntajeCero: 'El puntaje no puede ser cero',
  },

  ronda: {
    titulo: (n: number) => `Ronda ${n}`,
    objetivo: 'Objetivo de la ronda',
    objetivoEjemplo: 'Ej: 2 piernas',
    sinObjetivo: 'Sin objetivo',
    puntajeDeLasReglas: 'Puntaje de las reglas en esta ronda',
    reglaSoloParaEstaRonda: 'Regla solo para esta ronda',
    soloEnEstaRonda: 'Solo en esta ronda',
    /** «ajustado (base −20)»: al lado del alcance, cuando la ronda pisa el puntaje. */
    ajustado: (base: number) => `ajustado (base ${conSigno(base)})`,
    /**
     * Ayuda al pie del sheet de edicion de ronda (RF-503). El mockup nombra un solo
     * puntaje base; con varias reglas, cada una muestra el suyo en su fila.
     */
    ayudaAjuste: (n: number) =>
      `El puntaje que cambies acá vale solo para la Ronda ${n}. En las demás sigue el de la plantilla.`,
    guardar: 'GUARDAR RONDA',
  },

  partida: {
    completada: 'Completada',
    enJuego: 'EN JUEGO',
    objetivo: (texto: string) => `Objetivo: ${texto}`,
    bloqueada: (anterior: number) => `Se habilita al terminar la Ronda ${anterior}`,
    siguiente: 'SIGUIENTE',
    terminarPartida: 'TERMINAR PARTIDA',
    editarNombre: 'Editar nombre',
    sinCargar: 'Sin cargar',
    // RF-706 / RF-707: por que no se puede cerrar la ronda
    faltanPuntajes: 'Falta cargar el puntaje de todos',
    faltanReglas: (reglas: string[]) => `Falta asignar: ${reglas.join(', ')}`,
  },

  carga: {
    puntajeDeLaRonda: 'Puntaje de la ronda',
    reglasDeLaRonda: 'Reglas de la ronda',
    guardar: 'GUARDAR',
  },

  finalizar: {
    // RF-710: confirmacion
    confirmarTitulo: '¿Terminar la partida?',
    rondaIncompleta: 'La ronda en curso quedó incompleta.',
    partidaTerminada: 'Partida terminada',
    restoDeParticipantes: 'Resto de participantes',
    volverAlInicio: 'Volver al inicio',
  },
} as const;
