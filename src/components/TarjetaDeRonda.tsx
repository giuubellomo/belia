import { StyleSheet, Text, View } from 'react-native';

import { reglasDeLaRonda, puntajeDeReglaEnRonda } from '@/domain/rondas';
import { mejoresDeRonda } from '@/domain/scoring';
import type { Partida, RondaJugada } from '@/domain/types';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { colores, espacios, tipografia } from '@/theme/tokens';

import { Card } from './Card';
import { Chip } from './Chip';

interface Props {
  ronda: RondaJugada;
  partida: Partida;
}

/**
 * Una ronda de la partida (paso 7.1, RF-702): cerrada y colapsada, en juego y
 * expandida, o bloqueada. El contenido de la ronda en juego (objetivo, reglas y
 * una fila por jugador) llega en el paso 7.2.
 */
export function TarjetaDeRonda({ ronda, partida }: Props) {
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

  return (
    <Card estado="activa">
      <View style={styles.fila}>
        <Text accessibilityRole="header" style={[styles.titulo, styles.textos]}>
          {titulo}
        </Text>
        <Chip texto={es.partida.enJuego} variante="borde" />
      </View>
    </Card>
  );
}

/**
 * Mockup 4: «2 piernas · Bajó primero: −10 pts · Cortó: −10 pts», con las reglas
 * que hay que asignar en esa ronda y lo que valen ahi. Sin objetivo ni reglas
 * (mockup 5, Simple): quien hizo el mejor puntaje.
 */
function resumenDeCerrada(ronda: RondaJugada, partida: Partida): string | null {
  const { plantilla } = partida;
  const reglas = reglasDeLaRonda(plantilla, ronda.numero)
    .filter((regla) => regla.alcance === 'todas')
    .map((regla) => es.partida.reglaConPuntaje(regla.titulo, puntajeDeReglaEnRonda(plantilla, ronda.numero, regla.id)));
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
});
