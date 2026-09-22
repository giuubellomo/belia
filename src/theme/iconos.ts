/**
 * Iconos como glifos de texto (paso 3.2): sin dependencias, y se pintan con el
 * color del texto, asi que respetan el mockup monocromo.
 *
 * `︎` pide la version de texto del caracter: sin eso, iOS y Android dibujan
 * ☀ o ⚙ como emoji de color.
 */
const TEXTO = '︎';

/** Los de la interfaz. */
export const iconos = {
  cerrar: '✕',
  tilde: '✓',
  mas: '+',
  menos: '−',
  atras: '‹',
  adelante: '›',
  abajo: '↓',
  arriba: '↑',
  engranaje: `⚙${TEXTO}`,
  /** «Agregar plantilla» en el pie del Home (paso 4.2). */
  plantillaNueva: '⊞',
} as const;

/** Los que se pueden elegir para un avatar (RF-201). `valor` del avatar = el glifo. */
export const ICONOS_AVATAR = ['★', `☀${TEXTO}`, `☾${TEXTO}`, `♠${TEXTO}`, `♥${TEXTO}`, `♦${TEXTO}`, `♣${TEXTO}`, `♪${TEXTO}`] as const;

/**
 * Los de plantilla. En la base se guarda la clave (`plantilla.icono`), no el glifo:
 * asi el dibujo se puede cambiar sin migrar datos.
 */
export const ICONOS_PLANTILLA: Record<string, string> = {
  cartas: `⚄${TEXTO}`,
  numeral: '±',
};

/** El glifo de una clave de plantilla. Una clave desconocida no rompe: muestra un punto. */
export function iconoDePlantilla(clave: string): string {
  return ICONOS_PLANTILLA[clave] ?? '•';
}
