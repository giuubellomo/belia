import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
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

/**
 * Sube desde abajo sobre un velo oscuro. Se cierra tocando el velo, con el boton
 * atras de Android o con la ✕. No se arrastra con el dedo: haria falta una
 * libreria de gestos que el plan no incluye. La manija de arriba es solo visual.
 */
export function BottomSheet({ visible, onCerrar, titulo, children, pie, etiquetaCerrar, accionEncabezado }: Props) {
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const progreso = useRef(new Animated.Value(0)).current;
  // Se desmonta recien cuando termina de bajar, no apenas `visible` pasa a false.
  const [montado, setMontado] = useState(visible);

  useEffect(() => {
    if (visible) {
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
  }, [visible, progreso]);

  const translateY = progreso.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

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
    paddingTop: espacios.xs,
    maxHeight: '90%',
  },
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
