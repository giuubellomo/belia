import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  haySiguienteRonda,
  puedeCerrarRonda,
  puntajeDeReglaEnRonda,
  reglasDeLaRonda,
  reglasSinAsignar,
} from '@/domain/rondas';
import { mejoresDeRonda, puntajeCargado, totalHastaRonda } from '@/domain/scoring';
import type { Participante, Partida, Plantilla, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Boton } from './Boton';
import { Card } from './Card';
import { Chip } from './Chip';

interface Props {
  ronda: RondaJugada;
  partida: Partida;
  /**
   * Tocar la fila de un participante, en la ronda en juego o en una cerrada
   * expandida: abre el popup de carga de esa ronda (7.4, 7.6).
   */
  onTocarParticipante?: (participanteId: string) => void;
  /** Una ronda cerrada abierta para corregirla (7.6). */
  expandida?: boolean;
  /** Tocar una ronda cerrada la expande o la vuelve a colapsar. */
  onAlternar?: () => void;
  /** SIGUIENTE: cierra la ronda en juego y abre la que sigue (7.5). */
  onSiguiente?: () => Promise<void>;
}

/**
 * Una ronda de la partida (paso 7.1, RF-702): cerrada y colapsada, en juego y
 * expandida, o bloqueada. La en juego (paso 7.2, RF-703, RF-704) muestra el
 * objetivo, lo que valen las reglas y una fila por participante con su puntaje
 * de la ronda, sin botones de regla: las reglas se marcan en el popup (7.4).
 * A su derecha va el acumulado de la partida (paso 7.3, A-6). Al pie, SIGUIENTE
 * (paso 7.5, RF-706 a RF-708), salvo en la ultima ronda de rondas fijas.
 * Una cerrada se toca para expandirla y corregirla (paso 7.6, RF-709): sigue
 * cerrada, y la en juego sigue siendo la misma.
 */
export function TarjetaDeRonda({
  ronda,
  partida,
  onTocarParticipante,
  onSiguiente,
  expandida = false,
  onAlternar,
}: Props) {
  const titulo = es.ronda.titulo(ronda.numero);
  const completada = <Text style={styles.completada}>{`${iconos.tilde} ${es.partida.completada}`}</Text>;

  if (ronda.estado === 'cerrada' && expandida) {
    return (
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: true }}
          accessibilityLabel={`${titulo}, ${es.partida.completada}`}
          onPress={onAlternar}
          style={({ pressed }) => [styles.cabeceraTocable, pressed && styles.presionada]}
        >
          <Cabecera ronda={ronda} partida={partida} titulo={titulo} marca={completada} />
        </Pressable>
        <Filas ronda={ronda} partida={partida} onTocarParticipante={onTocarParticipante} />
        {/* Corregir no reabre la ronda: si quedo una regla sin asignar, solo se avisa. */}
        <View style={styles.corregida}>
          <ReglasSinAsignar ronda={ronda} partida={partida} />
        </View>
      </Card>
    );
  }

  if (ronda.estado === 'cerrada') {
    const resumen = resumenDeCerrada(ronda, partida);
    return (
      <Card
        estado="suave"
        style={styles.fila}
        onPress={onAlternar}
        etiqueta={[titulo, es.partida.completada, resumen].filter((texto) => texto !== null).join(', ')}
      >
        <View style={styles.textos}>
          <Text style={styles.titulo}>{titulo}</Text>
          {/* RNF-4: el resumen lleva puntajes («Cortó: −10 pts»). */}
          {resumen !== null && <Text style={[styles.detalle, numerales]}>{resumen}</Text>}
        </View>
        {completada}
      </Card>
    );
  }

  if (ronda.estado === 'bloqueada') {
    return (
      <Card estado="punteada">
        <Text style={[styles.titulo, styles.apagado]}>{titulo}</Text>
        <Text style={[styles.detalle, styles.apagado]}>{es.partida.bloqueada(ronda.numero - 1)}</Text>
      </Card>
    );
  }

  return (
    <Card estado="activa">
      <Cabecera
        ronda={ronda}
        partida={partida}
        titulo={titulo}
        marca={<Chip texto={es.partida.enJuego} variante="borde" />}
      />
      <Filas ronda={ronda} partida={partida} onTocarParticipante={onTocarParticipante} />
      {onSiguiente !== undefined && haySiguienteRonda(partida, ronda.numero) && (
        <Siguiente ronda={ronda} partida={partida} onSiguiente={onSiguiente} />
      )}
    </Card>
  );
}

interface PropsCabecera {
  ronda: RondaJugada;
  partida: Partida;
  titulo: string;
  /** A la derecha del titulo: EN JUEGO o ✓ Completada. */
  marca: ReactNode;
}

/** Titulo, objetivo y lo que valen las reglas, con la linea que la separa de las filas. */
function Cabecera({ ronda, partida, titulo, marca }: PropsCabecera) {
  const reglas = reglasConPuntaje(ronda, partida.plantilla);
  return (
    <View style={styles.cabecera}>
      <View style={styles.fila}>
        <Text accessibilityRole="header" style={[styles.titulo, styles.textos]}>
          {titulo}
        </Text>
        {marca}
      </View>
      {ronda.objetivo !== undefined && <Text style={styles.detalle}>{es.partida.objetivo(ronda.objetivo)}</Text>}
      {reglas.length > 0 && <Text style={[styles.reglas, numerales]}>{reglas.join(' · ')}</Text>}
    </View>
  );
}

/** Una fila por participante, con el acumulado hasta esta ronda (cambio 80). */
function Filas({ ronda, partida, onTocarParticipante }: Pick<Props, 'ronda' | 'partida' | 'onTocarParticipante'>) {
  return partida.participantes.map((participante) => (
    <FilaDeParticipante
      key={participante.id}
      participante={participante}
      puntaje={puntajeCargado(ronda, partida.plantilla, participante.id)}
      total={totalHastaRonda(partida, participante.id, ronda.numero)}
      reglas={reglasMarcadas(ronda, partida.plantilla, participante.id)}
      onPress={onTocarParticipante && (() => onTocarParticipante(participante.id))}
    />
  ));
}

/** «Falta asignar: Bajó primero» (RF-706), o nada. */
function ReglasSinAsignar({ ronda, partida }: Pick<Props, 'ronda' | 'partida'>) {
  const sinAsignar = reglasSinAsignar(ronda, partida.plantilla);
  if (sinAsignar.length === 0) return null;
  return <Text style={styles.faltante}>{es.partida.faltanReglas(sinAsignar.map((regla) => regla.titulo))}</Text>;
}

/**
 * Habilitado segun `puedeCerrarRonda`. Mientras no, nombra las reglas sin
 * asignar (RF-706). Los puntajes que faltan no se avisan en texto (cambio 79):
 * se ven en las casillas vacias.
 */
function Siguiente({ ronda, partida, onSiguiente }: Required<Pick<Props, 'ronda' | 'partida' | 'onSiguiente'>>) {
  const [avanzando, setAvanzando] = useState(false);
  const [errorAlAvanzar, setErrorAlAvanzar] = useState(false);

  const { plantilla, participantes } = partida;
  const puede = puedeCerrarRonda(ronda, plantilla, participantes).puede;

  async function avanzar() {
    setAvanzando(true);
    setErrorAlAvanzar(false);
    try {
      // Si sale bien esta tarjeta pasa a ser la de una ronda cerrada y este
      // estado se desmonta: no hace falta volver `avanzando` a false.
      await onSiguiente();
    } catch {
      setErrorAlAvanzar(true);
      setAvanzando(false);
    }
  }

  return (
    <View style={styles.siguiente}>
      <Boton titulo={es.partida.siguiente} onPress={avanzar} deshabilitado={!puede || avanzando} />
      <ReglasSinAsignar ronda={ronda} partida={partida} />
      {errorAlAvanzar && <Text style={styles.faltante}>{es.comun.errorGuardar}</Text>}
    </View>
  );
}

interface PropsFila {
  participante: Participante;
  /** null: todavia no cargo. */
  puntaje: number | null;
  /** El acumulado de toda la partida, con esta ronda incluida (C-2). */
  total: number;
  /** Los titulos de las reglas que tiene marcadas en la ronda: «Bajó primero». */
  reglas: string[];
  onPress?: () => void;
}

/**
 * Mockup 4 y 5: avatar, nombre y a la derecha la casilla con el puntaje de la
 * ronda. Sin cargar, la casilla queda punteada con una raya: un lugar vacio
 * que se toca para cargar. A-6: el acumulado a la derecha, mas chico y en gris.
 * Debajo del nombre, las reglas que se llevo en la ronda (cambio 77).
 */
function FilaDeParticipante({ participante, puntaje, total, reglas, onPress }: PropsFila) {
  const vacia = puntaje === null;
  const valor = vacia ? es.partida.sinCargar : conSigno(puntaje);
  const contenido = (
    <>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
      <View style={styles.textos}>
        <Text style={styles.nombre}>{participante.nombre}</Text>
        {reglas.length > 0 && <Text style={styles.reglasDelJugador}>{reglas.join(' · ')}</Text>}
      </View>
      <View style={[styles.casilla, vacia && styles.casillaVacia]}>
        <Text style={[styles.puntaje, numerales, vacia && styles.puntajeVacio]}>
          {vacia ? iconos.raya : valor}
        </Text>
      </View>
      <Text style={[styles.total, numerales]}>{conSigno(total)}</Text>
    </>
  );
  const etiqueta = [es.partida.puntajeDe(participante.nombre, valor, conSigno(total)), ...reglas].join(', ');

  if (onPress === undefined) {
    return (
      <View accessible accessibilityLabel={etiqueta} style={styles.participante}>
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [styles.participante, pressed && styles.presionada]}
    >
      {contenido}
    </Pressable>
  );
}

/** Las reglas de la ronda que tiene marcadas un participante, en el orden de la plantilla. */
function reglasMarcadas(ronda: RondaJugada, plantilla: Plantilla, participanteId: string): string[] {
  const marcas = ronda.entradas.find((e) => e.participanteId === participanteId)?.marcas ?? {};
  return reglasDeLaRonda(plantilla, ronda.numero)
    .filter((regla) => regla.id in marcas)
    .map((regla) => regla.titulo);
}

/**
 * «Bajó primero: −20 pts», por cada regla de alcance `todas` de esa ronda, con
 * lo que vale ahi (cambio 72). Las opcionales no se nombran: el mockup 4 no las
 * lista en la tarjeta, aparecen en el popup de carga.
 */
function reglasConPuntaje(ronda: RondaJugada, plantilla: Plantilla): string[] {
  return reglasDeLaRonda(plantilla, ronda.numero)
    .filter((regla) => regla.alcance === 'todas')
    .map((regla) => es.partida.reglaConPuntaje(regla.titulo, puntajeDeReglaEnRonda(plantilla, ronda.numero, regla.id)));
}

/**
 * Mockup 4: «2 piernas · Bajó primero: −10 pts · Cortó: −10 pts», con las reglas
 * que hay que asignar en esa ronda y lo que valen ahi. Sin objetivo ni reglas
 * (mockup 5, Simple): quien hizo el mejor puntaje.
 */
function resumenDeCerrada(ronda: RondaJugada, partida: Partida): string | null {
  const { plantilla } = partida;
  const reglas = reglasConPuntaje(ronda, plantilla);
  const partes = ronda.objetivo === undefined ? reglas : [ronda.objetivo, ...reglas];
  if (partes.length > 0) return partes.join(' · ');

  const mejores = mejoresDeRonda(ronda, plantilla);
  if (mejores === null) return null;
  const nombres = mejores.participanteIds.map(
    (id) => partida.participantes.find((participante) => participante.id === id)?.nombre ?? '',
  );
  return es.partida.mejorPuntaje(nombres, mejores.puntaje);
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: espacios.xxs },
  titulo: { ...tipografia.tituloChico, color: colores.tinta },
  detalle: { ...tipografia.secundario, color: colores.grisOscuro },
  completada: { ...tipografia.chico, color: colores.grisOscuro },
  apagado: { color: colores.grisMedio },
  cabecera: {
    gap: espacios.xxs,
    paddingBottom: espacios.sm,
    marginBottom: espacios.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  reglas: { ...tipografia.chico, color: colores.grisOscuro, marginTop: espacios.xxs },
  participante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: AREA_TOCABLE_MINIMA,
    paddingVertical: espacios.xs,
  },
  presionada: { opacity: 0.7 },
  // RNF-3: en Simple la cabecera es solo el titulo, mas bajo que 44.
  cabeceraTocable: { minHeight: AREA_TOCABLE_MINIMA },
  siguiente: { marginTop: espacios.md, gap: espacios.xs },
  corregida: { marginTop: espacios.xs },
  faltante: { ...tipografia.secundario, color: colores.grisOscuro, textAlign: 'center' },
  nombre: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  reglasDelJugador: { ...tipografia.chico, color: colores.grisOscuro },
  casilla: {
    minWidth: 68,
    alignItems: 'center',
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs - 2,
    borderRadius: radios.xs,
    borderWidth: 1.5,
    borderColor: colores.tinta,
  },
  casillaVacia: { borderStyle: 'dashed', borderColor: colores.linea },
  puntaje: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  puntajeVacio: { color: colores.grisMedio },
  // Ancho fijo: los totales quedan en columna aunque cambie la cantidad de digitos.
  total: { ...tipografia.secundario, color: colores.grisOscuro, minWidth: 44, textAlign: 'right' },
});
