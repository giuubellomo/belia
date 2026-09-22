import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { Card } from '@/components/Card';
import { Popup } from '@/components/Popup';
import { Vacio } from '@/components/Vacio';
import { numeroRondaEnCurso } from '@/domain/rondas';
import type { Partida } from '@/domain/types';
import { usePartidaEnCurso } from '@/hooks/usePartidaEnCurso';
import { es } from '@/i18n/es';
import * as partidas from '@/repositories/partidas';
import { iconos } from '@/theme/iconos';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Home (paso 4.2, RF-101 a RF-105).
 *
 * Tiene dos variantes segun `usePartidaEnCurso`: con partida abierta aparece
 * «Continuar partida» con su resumen; sin partida, solo «Nuevo juego» y la
 * linea de estado vacio.
 *
 * A-5 se hace cumplir aca: con una partida abierta, «Nuevo juego» no arma nada,
 * pide confirmacion para terminar la anterior. Nunca hay dos `en_curso`.
 */
export default function Home() {
  const { partida, cargando, mutar } = usePartidaEnCurso();
  const [confirmando, setConfirmando] = useState(false);
  const [errorAlTerminar, setErrorAlTerminar] = useState(false);

  /** Paso 6.1: el sheet de armado todavia no existe. */
  const abrirArmado = () => {};

  const nuevoJuego = () => {
    if (partida === null) {
      abrirArmado();
      return;
    }
    setErrorAlTerminar(false);
    setConfirmando(true);
  };

  /** A-5: termina la anterior (mismo camino que el paso 8.1) y recien ahi arma. */
  const terminarYEmpezar = async () => {
    if (partida === null) return;
    try {
      await mutar(() => partidas.finalizar(partida.id));
    } catch {
      setErrorAlTerminar(true);
      return;
    }
    setConfirmando(false);
    abrirArmado();
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.marca}>
        <Text style={styles.titulo}>{es.home.titulo}</Text>
        <Text style={styles.subtitulo}>{es.home.subtitulo}</Text>
      </View>

      <View style={styles.acciones}>
        {/* Hasta la primera lectura no se dibuja nada: si no, el estado vacio parpadea. */}
        {!cargando && (
          <>
            {partida !== null && <ContinuarPartida partida={partida} />}
            <Boton titulo={es.home.nuevoJuego} onPress={nuevoJuego} />
            {partida === null && <Vacio texto={es.home.sinPartidas} />}
          </>
        )}
      </View>

      <View style={styles.pie}>
        {/* Paso 9.1 y paso 5.1: las dos pantallas todavia no existen. */}
        <AccionDePie icono={iconos.engranaje} texto={es.home.configuracion} onPress={() => {}} />
        <AccionDePie icono={iconos.plantillaNueva} texto={es.home.agregarPlantilla} onPress={() => {}} />
      </View>

      {partida !== null && (
        <Popup
          visible={confirmando}
          onCerrar={() => setConfirmando(false)}
          etiquetaCerrar={es.comun.cerrar}
          titulo={es.finalizar.confirmarTitulo}
        >
          <Text style={styles.textoPopup}>{es.home.terminarAnterior(partida.nombre)}</Text>
          {errorAlTerminar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
          <View style={styles.botonesPopup}>
            <View style={styles.boton}>
              <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setConfirmando(false)} />
            </View>
            <View style={styles.boton}>
              <Boton titulo={es.comun.terminar} onPress={() => void terminarYEmpezar()} />
            </View>
          </View>
        </Popup>
      )}
    </SafeAreaView>
  );
}

/** RF-102: plantilla, cuantos juegan y en que ronda va. Paso 7.1: todavia no navega. */
function ContinuarPartida({ partida }: { partida: Partida }) {
  const resumen = es.home.resumenPartida(
    partida.plantilla.nombre,
    partida.participantes.length,
    numeroRondaEnCurso(partida.rondas),
  );

  return (
    <Card onPress={() => {}} etiqueta={`${es.home.continuarPartida}. ${resumen}`} style={styles.card}>
      <View style={styles.cardTexto}>
        <Text style={styles.continuar}>{es.home.continuarPartida}</Text>
        <Text style={styles.resumen}>{resumen}</Text>
      </View>
      <Text allowFontScaling={false} style={styles.flecha}>
        {iconos.adelante}
      </Text>
    </Card>
  );
}

function AccionDePie({ icono, texto, onPress }: { icono: string; texto: string; onPress: () => void }) {
  return (
    <View style={styles.accionDePie}>
      <BotonIcono icono={icono} etiqueta={texto} tamano={48} onPress={onPress} />
      <Text style={styles.textoDePie}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, padding: espacios.xl },
  marca: { alignItems: 'center', gap: espacios.xxs, paddingTop: espacios.xxl },
  titulo: { ...tipografia.marca, color: colores.tinta },
  subtitulo: { ...tipografia.secundario, color: colores.grisMedio },
  // Las acciones van abajo, al alcance del pulgar: el espacio sobrante queda arriba.
  acciones: { flex: 1, justifyContent: 'flex-end', gap: espacios.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  cardTexto: { flex: 1, gap: espacios.xxs },
  continuar: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  resumen: { ...tipografia.secundario, color: colores.grisOscuro },
  flecha: { ...tipografia.subtitulo, color: colores.tinta },
  pie: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
    paddingTop: espacios.lg,
    marginTop: espacios.xl,
  },
  accionDePie: { alignItems: 'center', gap: espacios.xs },
  textoDePie: { ...tipografia.chico, color: colores.grisOscuro },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  error: { ...tipografia.secundario, color: colores.tinta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
});
