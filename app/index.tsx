import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { estadoBase } from '@/db/client';

/**
 * Placeholder. El Home de verdad es el paso 4.2.
 * El cartel de la base es temporal: es el checkpoint del paso 2.2 y se va con el 4.2.
 */
export default function Home() {
  const [estado, setEstado] = useState('abriendo la base...');

  useEffect(() => {
    let vigente = true;
    estadoBase()
      .then((base) => {
        if (vigente) {
          setEstado(
            `${base.nombre} · user_version ${base.version} de ${base.versionObjetivo} · ${base.tablas} tablas`,
          );
        }
      })
      .catch((error: unknown) => {
        if (vigente) setEstado(`error: ${String(error)}`);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.texto}>BELIA</Text>
      <Text style={styles.estado}>{estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  texto: { fontSize: 24 },
  estado: { fontSize: 13, color: '#9A9AA0', textAlign: 'center' },
});
