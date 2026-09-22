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
    agregarPlantilla: 'Agregar plantilla',
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

  plantilla: {
    nueva: 'Nueva plantilla',
    nombreEIcono: 'Nombre e ícono',
    puntosDeCadaRonda: 'Los puntos de cada ronda',
    seSuman: 'Se suman',
    seRestan: 'Se restan',
    gana: 'Gana',
    menosPuntos: 'Menos puntos',
    masPuntos: 'Más puntos',
    reglas: (n: number) => `Reglas · ${n}`,
    agregarRegla: 'Agregar regla',
    rondas: (n: number) => `Rondas · ${n}`,
    ayudaRondas:
      'Las reglas se aplican en cada ronda. Tocá una ronda para cambiar el objetivo o el puntaje de una regla.',
    guardar: 'GUARDAR PLANTILLA',
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
    ajustado: 'ajustado',
    guardar: 'GUARDAR REGLA',
    // RF-404
    errorTituloVacio: 'Poné un título',
    errorPuntajeCero: 'El puntaje no puede ser cero',
  },

  ronda: {
    titulo: (n: number) => `Ronda ${n}`,
    objetivo: 'Objetivo de la ronda',
    puntajeDeLasReglas: 'Puntaje de las reglas en esta ronda',
    reglaSoloParaEstaRonda: 'Regla solo para esta ronda',
    /** Ayuda al pie del sheet de edicion de ronda (RF-503). */
    ayudaAjuste: (n: number, base: number) =>
      `El puntaje que cambies acá vale solo para la Ronda ${n}. En el resto sigue el de la plantilla (${conSigno(base)}).`,
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
