import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Boton } from '@/components/Boton';
import { rankear, type Puesto } from '@/domain/ranking';
import type { Participante } from '@/domain/types';
import { es } from '@/i18n/es';
import { colores, espacios, numerales, radios, tipografia } from '@/theme/tokens';
import { usePartida } from '@/hooks/usePartida';

/** Alto del escalon segun la posicion: con empate, los que comparten puesto quedan a la misma altura. */
const ALTO_ESCALON: Record<number, number> = { 1: 150, 2: 105, 3: 75 };

/**
 * Podio (paso 8.2, RF-801 a RF-804, mockup 6). Sale de `rankear()`: los tres
 * primeros del ranking en orden visual 2º–1º–3º y el resto en lista. Con dos
 * participantes no hay escalon vacio (RF-803). Los empatados comparten numero y
 * altura de escalon (RF-804). Sin historial, se ve una sola vez (8.1).
 */
export default function PantallaDePodio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { partida } = usePartida(id);

  if (partida === null) return null;

  const puestos = rankear(partida);
  const [primero, segundo, tercero] = puestos;
  // 2º–1º–3º; con dos jugadores, solo 2º–1º.
  const podio = [segundo, primero, tercero].filter((puesto): puesto is Puesto => puesto !== undefined);
  const resto = puestos.slice(3);
  const participante = (puesto: Puesto) => partida.participantes.find((p) => p.id === puesto.participanteId)!;

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.etiqueta}>{es.finalizar.partidaTerminada}</Text>
          <Text accessibilityRole="header" style={styles.titulo}>
            {partida.nombre}
          </Text>
        </View>

        <View style={styles.podio}>
          {podio.map((puesto) => (
            <Escalon key={puesto.participanteId} puesto={puesto} participante={participante(puesto)} />
          ))}
        </View>

        {resto.length > 0 && (
          <View>
            <View style={styles.separador}>
              <View style={styles.linea} />
              <Text style={styles.etiqueta}>{es.finalizar.restoDeParticipantes}</Text>
              <View style={styles.linea} />
            </View>
            {resto.map((puesto) => (
              <FilaDelResto key={puesto.participanteId} puesto={puesto} participante={participante(puesto)} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.pie}>
        {/* Se llego con replace desde la partida: atras es el Home. */}
        <Boton titulo={es.finalizar.volverAlInicio} variante="secundario" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

interface PropsPuesto {
  puesto: Puesto;
  participante: Participante;
}

/** Avatar, nombre y puntos arriba; el escalon con la posicion abajo. */
function Escalon({ puesto, participante }: PropsPuesto) {
  const { posicion, total } = puesto;
  const esPrimero = posicion === 1;
  return (
    <View
      accessible
      accessibilityLabel={`${es.finalizar.puesto(posicion)}: ${participante.nombre}, ${es.comun.puntos(total)}`}
      style={styles.columna}
    >
      <Avatar
        tipo={participante.avatarTipo}
        valor={participante.avatarValor}
        nombre={participante.nombre}
        tamano={esPrimero ? 60 : 40}
      />
      <Text style={styles.nombre} numberOfLines={1}>
        {participante.nombre}
      </Text>
      <Text style={[styles.puntos, numerales]}>{es.comun.puntos(total)}</Text>
      <View style={[styles.escalon, estilosEscalon[posicion] ?? estilosEscalon[3], { height: ALTO_ESCALON[posicion] ?? ALTO_ESCALON[3] }]}>
        <Text style={[styles.numero, esPrimero && styles.numeroPrimero]}>{posicion}</Text>
      </View>
    </View>
  );
}

/** Mockup 6: la posicion en un circulo, avatar, nombre y los puntos a la derecha. */
function FilaDelResto({ puesto, participante }: PropsPuesto) {
  return (
    <View
      accessible
      accessibilityLabel={`${es.finalizar.puesto(puesto.posicion)}: ${participante.nombre}, ${es.comun.puntos(puesto.total)}`}
      style={styles.fila}
    >
      <View style={styles.circulo}>
        <Text style={[styles.posicionChica, numerales]}>{puesto.posicion}</Text>
      </View>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
      <Text style={styles.nombreFila}>{participante.nombre}</Text>
      <Text style={[styles.puntosFila, numerales]}>{es.comun.puntos(puesto.total)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacios.xl, gap: espacios.xl },
  encabezado: { alignItems: 'center', gap: espacios.xxs, paddingTop: espacios.md },
  etiqueta: { ...tipografia.etiqueta, color: colores.grisMedio },
  titulo: { ...tipografia.subtitulo, color: colores.tinta, textAlign: 'center' },
  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: espacios.sm },
  columna: { flex: 1, maxWidth: 110, alignItems: 'center', gap: espacios.xxs },
  nombre: { ...tipografia.cuerpoFuerte, color: colores.tinta, marginTop: espacios.xxs },
  puntos: { ...tipografia.chico, color: colores.grisOscuro, marginBottom: espacios.xs },
  escalon: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: espacios.sm,
    borderTopLeftRadius: radios.sm,
    borderTopRightRadius: radios.sm,
  },
  numero: { ...tipografia.subtitulo, color: colores.tinta },
  numeroPrimero: { color: colores.fondo },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm, marginBottom: espacios.xs },
  linea: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colores.linea },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingVertical: espacios.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posicionChica: { ...tipografia.chico, color: colores.grisOscuro },
  nombreFila: { ...tipografia.cuerpoFuerte, color: colores.tinta, flex: 1 },
  puntosFila: { ...tipografia.cuerpoFuerte, color: colores.grisOscuro },
  pie: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
  },
});

/** 1º en tinta, 2º gris, 3º claro con borde, como el mockup. */
const estilosEscalon = StyleSheet.create({
  1: { backgroundColor: colores.tinta },
  2: { backgroundColor: colores.linea },
  3: { backgroundColor: colores.superficie, borderWidth: 1.5, borderBottomWidth: 0, borderColor: colores.linea },
}) as Record<number, object>;
