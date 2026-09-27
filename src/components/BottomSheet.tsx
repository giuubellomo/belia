import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iconos } from '@/theme/iconos';
import { colores, espacios, radios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';

interface Props {
  visible: boolean;
  /** Tocar afuera, el boton atras de Android o la ✕. */
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  /** Lo que va fijo abajo, separado por una linea: el boton principal. */
  pie?: ReactNode;
  /** Si viene, muestra la ✕ arriba a la derecha y este es su texto para el lector de pantalla. */
  etiquetaCerrar?: string;
  /** Algo en lugar de la ✕, como el «Eliminar» de una ronda. */
  accionEncabezado?: ReactNode;
}

/** Cuanto hay que bajarlo, o que tan rapido, para que al soltarlo se cierre. */
const DISTANCIA_PARA_CERRAR = 120;
const VELOCIDAD_PARA_CERRAR = 0.8;

/**
 * Sube desde abajo sobre un velo oscuro. Se cierra tocando el velo, con el boton
 * atras de Android, con la ✕ o deslizandolo hacia abajo desde la manija o el
 * titulo (paso 9.3, cambio 84). El gesto es `PanResponder`, que viene con React
 * Native: no hace falta una libreria. No se toma desde el contenido, para no
 * pelear con su scroll.
 */
export function BottomSheet({ visible, onCerrar, titulo, children, pie, etiquetaCerrar, accionEncabezado }: Props) {
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const progreso = useRef(new Animated.Value(0)).current;
  // Se desmonta recien cuando termina de bajar, no apenas `visible` pasa a false.
  const [montado, setMontado] = useState(visible);
  // Lo que el dedo lo bajo, sumado a la animacion de abrir y cerrar.
  const arrastre = useRef(new Animated.Value(0)).current;
  // El PanResponder se crea una vez: lee el onCerrar del ultimo render.
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  const gesto = useRef(
    PanResponder.create({
      // Toma el toque apenas se apoya el dedo en la manija o el titulo. La ✕ es un
      // Pressable mas adentro: lo pide primero, asi que un toque sigue llegando a ella.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => dy > 6 && Math.abs(dy) > Math.abs(dx),
      // Una vez que arrastra, nadie se lo saca a mitad de camino.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => Keyboard.dismiss(),
      onPanResponderMove: (_, { dy }) => arrastre.setValue(Math.max(0, dy)),
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > DISTANCIA_PARA_CERRAR || vy > VELOCIDAD_PARA_CERRAR) cerrar.current();
        else volver();
      },
      onPanResponderTerminate: () => volver(),
    }),
  ).current;

  function volver() {
    Animated.spring(arrastre, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  }

  useEffect(() => {
    if (visible) {
      arrastre.setValue(0);
      setMontado(true);
      Animated.timing(progreso, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progreso, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMontado(false);
      });
    }
  }, [visible, progreso, arrastre]);

  const translateY = Animated.add(
    progreso.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }),
    arrastre,
  );

  return (
    <Modal visible={montado} transparent animationType="none" onRequestClose={onCerrar} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.velo, { opacity: progreso }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessible={false} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.abajo}
        pointerEvents="box-none"
      >
        {/* El tope es un porcentaje del espacio que deja el teclado, no de la pantalla:
            con el teclado abierto el sheet se achica y el contenido pasa a scrollear,
            en lugar de salirse por arriba con el encabezado y el primer campo. */}
        <Animated.View style={[styles.hoja, { transform: [{ translateY }] }]}>
          <View {...gesto.panHandlers} style={styles.agarre}>
            <View style={styles.manija} />

            <View style={styles.encabezado}>
              <Text accessibilityRole="header" style={styles.titulo}>
                {titulo}
              </Text>
              {accionEncabezado ??
                (etiquetaCerrar !== undefined && (
                  <BotonIcono icono={iconos.cerrar} etiqueta={etiquetaCerrar} tamano={32} onPress={onCerrar} />
                ))}
            </View>
          </View>

          <ScrollView
            style={styles.contenido}
            contentContainerStyle={styles.contenidoInterno}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {pie !== undefined && (
            <View style={[styles.pie, { paddingBottom: Math.max(bottom, espacios.md) }]}>{pie}</View>
          )}
          {pie === undefined && <View style={{ height: Math.max(bottom, espacios.md) }} />}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { backgroundColor: colores.velo },
  abajo: { flex: 1, justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: colores.fondo,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    maxHeight: '90%',
  },
  // La manija y el titulo: de donde se lo arrastra. El padding de arriba es parte, asi se agarra mas facil.
  agarre: { paddingTop: espacios.xs },
  manija: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colores.linea,
    marginBottom: espacios.sm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacios.sm,
    paddingHorizontal: espacios.xl,
    paddingBottom: espacios.sm,
  },
  titulo: { ...tipografia.subtitulo, color: colores.tinta, flexShrink: 1 },
  // Se achica cuando el sheet llega a su tope: el que scrollea es el contenido.
  contenido: { flexGrow: 0, flexShrink: 1 },
  contenidoInterno: { paddingHorizontal: espacios.xl, paddingBottom: espacios.md, gap: espacios.md },
  pie: {
    borderTopWidth: 1,
    borderTopColor: colores.superficie,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
  },
});
