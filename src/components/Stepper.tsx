import { StyleSheet, Text, View } from 'react-native';

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
}: Props) {
  const boton = tamano === 'grande' ? 48 : tamano === 'mediano' ? 36 : 28;
  const texto =
    tamano === 'grande' ? tipografia.numeroGrande : tamano === 'mediano' ? tipografia.subtitulo : tipografia.cuerpoFuerte;

  return (
    <View
      style={[styles.fila, tamano === 'mediano' && styles.caja, tamano === 'compacto' && styles.compacto]}
    >
      <BotonIcono
        icono={iconos.menos}
        etiqueta={etiquetaRestar}
        tamano={boton}
        deshabilitado={valor - paso < minimo}
        onPress={() => onCambiar(valor - paso)}
      />
      <Text
        accessibilityLiveRegion="polite"
        style={[texto, numerales, styles.valor, tamano !== 'compacto' && styles.valorAncho]}
      >
        {formato(valor)}
      </Text>
      <BotonIcono
        icono={iconos.mas}
        etiqueta={etiquetaSumar}
        tamano={boton}
        deshabilitado={valor + paso > maximo}
        onPress={() => onCambiar(valor + paso)}
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
});
