import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { PopupDeCarga } from '@/components/PopupDeCarga';
import { TarjetaDeRonda } from '@/components/TarjetaDeRonda';
import type { Partida, RondaJugada } from '@/domain/types';
import { usePartida } from '@/hooks/usePartida';
import { es } from '@/i18n/es';
import * as partidas from '@/repositories/partidas';
import { iconos } from '@/theme/iconos';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Partida en curso (paso 7.1, RF-701, RF-702, RF-712): encabezado con el nombre,
 * que se elige al armarla y aca no se edita (registro, cambio 71), las rondas y
 * TERMINAR PARTIDA fijo abajo. Todo sale de la base via `usePartida`: salir y
 * volver deja todo igual. Tocar a un participante abre el popup de carga (7.4).
 */
export default function PantallaDePartida() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { partida, mutar } = usePartida(id);
  // A quien se le esta cargando. Se guarda aparte de `abierta` para que el popup
  // no se vacie mientras se desvanece al cerrarse.
  const [carga, setCarga] = useState<{ numeroRonda: number; participanteId: string } | null>(null);
  const [cargaAbierta, setCargaAbierta] = useState(false);

  // RF-713: en la mesa nadie toca el telefono por un rato y la pantalla no se apaga.
  useKeepAwake();

  if (partida === null) return null;

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.encabezado}>
        <BotonIcono icono={iconos.atras} etiqueta={es.comun.volver} tamano={36} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={styles.titulo}>
          {partida.nombre}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.rondas}>
        {rondasAMostrar(partida).map((ronda) => (
          <TarjetaDeRonda
            key={ronda.numero}
            ronda={ronda}
            partida={partida}
            onTocarParticipante={(participanteId) => {
              setCarga({ numeroRonda: ronda.numero, participanteId });
              setCargaAbierta(true);
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.pie}>
        {/* Confirmar y terminar es el paso 8.1. */}
        <Boton titulo={es.partida.terminarPartida} variante="secundario" onPress={() => {}} />
      </View>

      <PopupDeCarga
        visible={cargaAbierta}
        partida={partida}
        numeroRonda={carga?.numeroRonda ?? 0}
        participanteId={carga?.participanteId ?? null}
        onCerrar={() => setCargaAbierta(false)}
        onGuardar={(puntos, reglas) =>
          mutar(() => partidas.guardarCarga(partida.id, carga!.numeroRonda, carga!.participanteId, puntos, reglas))
        }
      />
    </SafeAreaView>
  );
}

/**
 * Las rondas de la base, y con rondas ilimitadas una mas bloqueada al final, como
 * dibuja el mockup 5: la siguiente recien se crea al cerrar la actual (7.5).
 */
function rondasAMostrar(partida: Partida): RondaJugada[] {
  const { rondas } = partida;
  const hayEnCurso = rondas.some((ronda) => ronda.estado === 'en_curso');
  if (!partida.plantilla.rondasIlimitadas || !hayEnCurso) return rondas;
  return [...rondas, { numero: rondas.length + 1, estado: 'bloqueada', entradas: [] }];
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.xs,
    paddingBottom: espacios.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  titulo: { ...tipografia.subtitulo, color: colores.tinta, flexShrink: 1 },
  rondas: { padding: espacios.xl, gap: espacios.md },
  pie: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
  },
});
