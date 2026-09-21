import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormularioParticipante } from '@/components/FormularioParticipante';
import { useDueno } from '@/hooks/useDueno';
import { es } from '@/i18n/es';
import * as participantes from '@/repositories/participantes';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Alta del dueño del dispositivo (paso 4.1, RF-205). Aparece sola en el primer
 * arranque: `_layout.tsx` solo deja entrar aca mientras no haya dueño. Al
 * guardarlo, `mutar` recarga `useDueno`, el guard cambia y el router pasa al Home
 * borrando esta pantalla del historial. Por eso aca no se navega a mano.
 */
export default function Bienvenida() {
  const { mutar } = useDueno();

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.pantalla}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.marca}>
            <Text style={styles.titulo}>{es.home.titulo}</Text>
            <Text style={styles.subtitulo}>{es.home.subtitulo}</Text>
          </View>

          <View style={styles.formulario}>
            <View style={styles.encabezado}>
              <Text accessibilityRole="header" style={styles.bienvenida}>
                {es.bienvenida.titulo}
              </Text>
              <Text style={styles.texto}>{es.bienvenida.texto}</Text>
            </View>

            <FormularioParticipante
              nombresOcupados={[]}
              textoConfirmar={es.bienvenida.continuar}
              onConfirmar={async (datos) => {
                await mutar(() => participantes.crear(datos, { esDueno: true }));
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { flexGrow: 1, justifyContent: 'space-between', padding: espacios.xl, gap: espacios.xxl },
  marca: { alignItems: 'center', gap: espacios.xxs, paddingTop: espacios.xxl },
  titulo: { ...tipografia.marca, color: colores.tinta },
  subtitulo: { ...tipografia.secundario, color: colores.grisMedio },
  formulario: { gap: espacios.xl },
  encabezado: { gap: espacios.xs },
  bienvenida: { ...tipografia.subtitulo, color: colores.tinta },
  texto: { ...tipografia.secundario, color: colores.grisOscuro },
});
