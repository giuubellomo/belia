import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reglasDeLaRonda, puntajeDeReglaEnRonda } from '@/domain/rondas';
import { mejoresDeRonda, puntajeCargado, totalDeParticipante } from '@/domain/scoring';
import type { Participante, Partida, Plantilla, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Card } from './Card';
import { Chip } from './Chip';

interface Props {
  ronda: RondaJugada;
  partida: Partida;
  /** Tocar la fila de un participante en la ronda en juego: abre el popup de carga (7.4). */
  onTocarParticipante?: (participanteId: string) => void;
}

/**
 * Una ronda de la partida (paso 7.1, RF-702): cerrada y colapsada, en juego y
 * expandida, o bloqueada. La en juego (paso 7.2, RF-703, RF-704) muestra el
 * objetivo, lo que valen las reglas y una fila por participante con su puntaje
 * de la ronda, sin botones de regla: las reglas se marcan en el popup (7.4).
 * A su derecha va el acumulado de la partida (paso 7.3, A-6).
 */
export function TarjetaDeRonda({ ronda, partida, onTocarParticipante }: Props) {
  const titulo = es.ronda.titulo(ronda.numero);

  if (ronda.estado === 'cerrada') {
    const resumen = resumenDeCerrada(ronda, partida);
    return (
      <Card estado="suave" style={styles.fila}>
        <View style={styles.textos}>
          <Text style={styles.titulo}>{titulo}</Text>
          {resumen !== null && <Text style={styles.detalle}>{resumen}</Text>}
        </View>
        <Text style={styles.completada}>{`${iconos.tilde} ${es.partida.completada}`}</Text>
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

  const reglas = reglasConPuntaje(ronda, partida.plantilla);
  return (
    <Card estado="activa">
      <View style={styles.cabecera}>
        <View style={styles.fila}>
          <Text accessibilityRole="header" style={[styles.titulo, styles.textos]}>
            {titulo}
          </Text>
          <Chip texto={es.partida.enJuego} variante="borde" />
        </View>
        {ronda.objetivo !== undefined && <Text style={styles.detalle}>{es.partida.objetivo(ronda.objetivo)}</Text>}
        {reglas.length > 0 && <Text style={styles.reglas}>{reglas.join(' · ')}</Text>}
      </View>

      {partida.participantes.map((participante) => (
        <FilaDeParticipante
          key={participante.id}
          participante={participante}
          puntaje={puntajeCargado(ronda, participante.id, partida.plantilla.modoPuntos)}
          total={totalDeParticipante(partida, participante.id)}
          onPress={onTocarParticipante && (() => onTocarParticipante(participante.id))}
        />
      ))}
    </Card>
  );
}

interface PropsFila {
  participante: Participante;
  /** null: todavia no cargo. */
  puntaje: number | null;
  /** El acumulado de toda la partida, con esta ronda incluida (C-2). */
  total: number;
  onPress?: () => void;
}

/**
 * Mockup 4 y 5: avatar, nombre y a la derecha la casilla con el puntaje de la
 * ronda. Sin cargar, la casilla queda punteada con una raya: un lugar vacio
 * que se toca para cargar. A-6: el acumulado a la derecha, mas chico y en gris.
 */
function FilaDeParticipante({ participante, puntaje, total, onPress }: PropsFila) {
  const vacia = puntaje === null;
  const valor = vacia ? es.partida.sinCargar : conSigno(puntaje);
  const contenido = (
    <>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
      <Text style={styles.nombre}>{participante.nombre}</Text>
      <View style={[styles.casilla, vacia && styles.casillaVacia]}>
        <Text style={[styles.puntaje, numerales, vacia && styles.puntajeVacio]}>
          {vacia ? iconos.raya : valor}
        </Text>
      </View>
      <Text style={[styles.total, numerales]}>{conSigno(total)}</Text>
    </>
  );
  const etiqueta = es.partida.puntajeDe(participante.nombre, valor, conSigno(total));

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
  nombre: { ...tipografia.cuerpoFuerte, color: colores.tinta, flex: 1 },
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
