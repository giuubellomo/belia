import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.texto}>BELIA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texto: { fontSize: 24 },
});
