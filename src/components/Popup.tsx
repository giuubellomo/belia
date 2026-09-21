import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { iconos } from '@/theme/iconos';
import { colores, espacios, radios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';

interface Props {
  visible: boolean;
  /** Tocar afuera, el boton atras de Android o la ✕. */
  onCerrar: () => void;
  /** Texto para el lector de pantalla en la ✕. */
  etiquetaCerrar: string;
  /** Titulo simple: «Agregar participante». */
  titulo?: string;
  /** En lugar del titulo, un encabezado propio: el avatar y el nombre del popup de carga. */
  encabezado?: ReactNode;
  children: ReactNode;
}

/** Tarjeta centrada sobre un velo oscuro. Para lo corto: alta de participante, carga de puntaje. */
export function Popup({ visible, onCerrar, etiquetaCerrar, titulo, encabezado, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={[StyleSheet.absoluteFill, styles.velo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessible={false} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centro}
        pointerEvents="box-none"
      >
        <View style={styles.tarjeta} accessibilityViewIsModal>
          <View style={styles.encabezado}>
            <View style={styles.encabezadoContenido}>
              {encabezado ??
                (titulo !== undefined && (
                  <Text accessibilityRole="header" style={styles.titulo}>
                    {titulo}
                  </Text>
                ))}
            </View>
            <BotonIcono icono={iconos.cerrar} etiqueta={etiquetaCerrar} tamano={32} onPress={onCerrar} />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { backgroundColor: colores.velo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacios.xl },
  tarjeta: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colores.fondo,
    borderRadius: radios.xl,
    padding: espacios.xl,
    gap: espacios.md,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  encabezadoContenido: { flex: 1 },
  titulo: { ...tipografia.tituloChico, color: colores.tinta },
});
