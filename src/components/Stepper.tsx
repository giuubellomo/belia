import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { iconos } from '@/theme/iconos';
import { colores, espacios, numerales, radios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';

interface Props {
  valor: number;
  onCambiar: (valor: number) => void;
  /** Lo que lee el lector de pantalla en cada boton. */
  etiquetaRestar: string;
  etiquetaSumar: string;
  paso?: number;
  minimo?: number;
  maximo?: number;
  /** Como se muestra el numero; por ejemplo con signo: «+100». */
  formato?: (valor: number) => string;
  /**
   * grande: numero enorme y botones de 48 (popup de carga).
   * mediano: dentro de una caja con borde (editar regla).
   * compacto: en una fila (ajuste por ronda).
   */
  tamano?: 'grande' | 'mediano' | 'compacto';
  /**
   * Tocar el numero abre el teclado numerico para escribirlo (popup de carga,
   * cambio 76). Se escribe sin signo: vale para `minimo` 0 o mas.
   */
  escribible?: boolean;
  /** Lo que lee el lector de pantalla en el numero cuando es escribible. */
  etiquetaEscribir?: string;
  /** Fijo: sin botones ni teclado, en gris (el que corto, en el popup de carga). */
  deshabilitado?: boolean;
}

export function Stepper({
  valor,
  onCambiar,
  etiquetaRestar,
  etiquetaSumar,
  paso = 1,
  minimo = -Infinity,
  maximo = Infinity,
  formato = String,
  tamano = 'mediano',
  escribible = false,
  etiquetaEscribir,
  deshabilitado = false,
}: Props) {
  // null: se muestra el numero con su formato. Un texto: se esta escribiendo.
  const [escrito, setEscrito] = useState<string | null>(null);
  const boton = tamano === 'grande' ? 48 : tamano === 'mediano' ? 36 : 28;
  const texto =
    tamano === 'grande' ? tipografia.numeroGrande : tamano === 'mediano' ? tipografia.subtitulo : tipografia.cuerpoFuerte;

  const estiloDelNumero = [texto, numerales, styles.valor, tamano !== 'compacto' && styles.valorAncho];

  /**
   * Cada digito ya cambia el valor: asi GUARDAR toma lo escrito aunque el
   * teclado siga abierto. Vacio vale el minimo, y nada se pasa del maximo.
   */
  function escribir(texto: string) {
    const digitos = texto.replace(/[^0-9]/g, '');
    setEscrito(digitos);
    const numero = digitos === '' ? minimo : Number(digitos);
    onCambiar(Math.min(maximo, Math.max(minimo, numero)));
  }

  function terminarDeEscribir() {
    if (escrito === null) return;
    Keyboard.dismiss();
    setEscrito(null);
  }

  return (
    <View
      style={[styles.fila, tamano === 'mediano' && styles.caja, tamano === 'compacto' && styles.compacto]}
    >
      <BotonIcono
        icono={iconos.menos}
        etiqueta={etiquetaRestar}
        tamano={boton}
        deshabilitado={deshabilitado || valor - paso < minimo}
        onPress={() => {
          terminarDeEscribir();
          onCambiar(valor - paso);
        }}
      />
      {escrito !== null ? (
        <TextInput
          autoFocus
          value={escrito}
          keyboardType="number-pad"
          maxLength={String(maximo).length}
          accessibilityLabel={etiquetaEscribir}
          onChangeText={escribir}
          onBlur={() => setEscrito(null)}
          style={[estiloDelNumero, styles.escribiendo]}
        />
      ) : escribible && !deshabilitado ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={etiquetaEscribir}
          accessibilityValue={{ text: formato(valor) }}
          onPress={() => setEscrito(String(valor))}
          style={styles.valorAncho}
        >
          <Text style={[texto, numerales, styles.valor]}>{formato(valor)}</Text>
        </Pressable>
      ) : (
        <Text accessibilityLiveRegion="polite" style={[estiloDelNumero, deshabilitado && styles.apagado]}>
          {formato(valor)}
        </Text>
      )}
      <BotonIcono
        icono={iconos.mas}
        etiqueta={etiquetaSumar}
        tamano={boton}
        deshabilitado={deshabilitado || valor + paso > maximo}
        onPress={() => {
          terminarDeEscribir();
          onCambiar(valor + paso);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caja: {
    borderWidth: 1.5,
    borderColor: colores.linea,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs,
  },
  compacto: { gap: espacios.xs },
  valor: { color: colores.tinta, textAlign: 'center', minWidth: 56 },
  valorAncho: { flex: 1 },
  apagado: { color: colores.grisMedio },
  // Subrayado mientras se escribe, para que se note que es un campo.
  escribiendo: { borderBottomWidth: 2, borderBottomColor: colores.tinta, paddingVertical: 0 },
});
