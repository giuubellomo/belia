import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { estadoBase } from '@/db/client';
import { listar as listarPlantillas } from '@/repositories/plantillas';

/**
 * Placeholder. El Home de verdad es el paso 4.2.
 * El cartel de la base es temporal: es el checkpoint de los pasos 2.2 y 2.4 y se va con el 4.2.
 * Llama a un repositorio directo porque los hooks recien llegan en el 2.5.
 */
export default function Home() {
  const [estado, setEstado] = useState('abriendo la base...');
  const [plantillas, setPlantillas] = useState('');

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
    listarPlantillas()
      .then((lista) => {
        if (vigente) {
          setPlantillas(
            lista
              .map((p) => `${p.nombre}: ${p.reglas.length} reglas, ${p.rondasIlimitadas ? 'ilimitadas' : `${p.rondas.length} rondas`}`)
              .join('\n'),
          );
        }
      })
      .catch((error: unknown) => {
        if (vigente) setPlantillas(`error: ${String(error)}`);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.texto}>BELIA</Text>
      <Text style={styles.estado}>{estado}</Text>
      <Text style={styles.estado}>{plantillas}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  texto: { fontSize: 24 },
  estado: { fontSize: 13, color: '#9A9AA0', textAlign: 'center' },
});
