import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { es } from '@/i18n/es';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Configuracion (paso 9.1, cambio 82). Sin perfil ni participantes que
 * administrar: por ahora solo la version y DeBello, abajo. El selector de tema
 * claro/oscuro va aca cuando llegue la fase 2.
 */
export default function PantallaDeConfiguracion() {
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView edges={['bottom']} style={styles.pantalla}>
      <View style={styles.pie}>
        {version !== undefined && <Text style={styles.version}>{es.config.version(version)}</Text>}
        <Text style={styles.empresa}>{es.config.empresa}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, justifyContent: 'flex-end' },
  pie: { alignItems: 'center', gap: espacios.xxs, padding: espacios.xl },
  version: { ...tipografia.chico, color: colores.grisOscuro },
  empresa: { ...tipografia.cuerpoFuerte, color: colores.tinta },
});
