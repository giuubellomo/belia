import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Regla, RondaDefinida } from '@/domain/types';
import type { DatosRegla, DatosRonda } from '@/hooks/useBorradorDePlantilla';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, radios, tipografia } from '@/theme/tokens';

import { BottomSheet } from './BottomSheet';
import { Boton } from './Boton';
import { CampoTexto } from './CampoTexto';
import { Card } from './Card';
import { Chip } from './Chip';
import { Etiqueta } from './Etiqueta';
import { SheetDeRegla } from './SheetDeRegla';
import { Stepper } from './Stepper';

/** Los mismos topes que el puntaje base de una regla (SheetDeRegla, cambio 59). */
const PASO = 5;
const MINIMO = 5;
const MAXIMO = 500;

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** El numero que se muestra en el titulo: el de la ronda, o el siguiente si es nueva. */
  numero: number;
  /** Si viene, se edita esa ronda; si no, es una ronda nueva. */
  ronda?: RondaDefinida;
  /** Las reglas de todas las rondas: cada una con su stepper. Memorizadas: si cambian, el sheet se reinicia. */
  reglasGenerales: Regla[];
  /** Las que existen solo en esta ronda. Memorizadas, igual que las generales. */
  reglasPropias: Regla[];
  onGuardar: (datos: DatosRonda) => void;
  /** Solo al editar: saca la ronda del borrador. */
  onBorrar?: () => void;
}

/**
 * Editar una ronda de la plantilla (paso 5.4, RF-501 a RF-505).
 *
 * Todo queda en el sheet hasta GUARDAR RONDA: objetivo, puntajes y reglas
 * propias. Cerrar sin guardar no toca el borrador. Si el puntaje de una regla
 * difiere del base, se guarda como ajuste de esta ronda; si vuelve al base,
 * el ajuste se va.
 */
export function SheetDeRonda({
  visible,
  onCerrar,
  numero,
  ronda,
  reglasGenerales,
  reglasPropias,
  onGuardar,
  onBorrar,
}: Props) {
  const [objetivo, setObjetivo] = useState('');
  // reglaId -> puntaje con signo en esta ronda
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [propias, setPropias] = useState<DatosRegla[]>([]);
  // null = sheet de regla cerrado. Con un indice se edita esa propia; con 'nueva', se da de alta.
  const [propiaEnEdicion, setPropiaEnEdicion] = useState<number | 'nueva' | null>(null);

  // Cada apertura arranca de los datos de la ronda, o en blanco si es nueva.
  useEffect(() => {
    if (!visible) return;
    setObjetivo(ronda?.objetivo ?? '');
    setPuntajes(
      Object.fromEntries(reglasGenerales.map((regla) => [regla.id, ronda?.ajustes[regla.id] ?? regla.puntajeBase])),
    );
    setPropias(reglasPropias.map(({ orden: _orden, soloEnRonda: _ronda, ...regla }) => regla));
    setPropiaEnEdicion(null);
  }, [visible, ronda, reglasGenerales, reglasPropias]);

  const guardar = () => {
    const limpio = objetivo.trim();
    onGuardar({
      objetivo: limpio.length === 0 ? undefined : limpio,
      ajustes: Object.fromEntries(
        reglasGenerales
          .filter((regla) => puntajes[regla.id] !== undefined && puntajes[regla.id] !== regla.puntajeBase)
          .map((regla) => [regla.id, puntajes[regla.id]!]),
      ),
      reglasPropias: propias,
    });
    onCerrar();
  };

  const propiaAbierta = typeof propiaEnEdicion === 'number' ? propias[propiaEnEdicion] : undefined;
  // Memorizada: el sheet de regla se reinicia si le llega otra regla.
  const reglaAbierta = useMemo(() => (propiaAbierta === undefined ? undefined : aRegla(propiaAbierta)), [propiaAbierta]);

  return (
    <BottomSheet
      visible={visible}
      onCerrar={onCerrar}
      titulo={es.ronda.titulo(numero)}
      etiquetaCerrar={es.comun.cerrar}
      pie={<Boton titulo={es.ronda.guardar} onPress={guardar} />}
    >
      <CampoTexto
        etiqueta={es.ronda.objetivo}
        valor={objetivo}
        onCambiar={setObjetivo}
        placeholder={es.ronda.objetivoEjemplo}
        maxLength={40}
        autoCapitalize="sentences"
        returnKeyType="done"
      />

      <View style={styles.seccion}>
        <Etiqueta texto={es.ronda.puntajeDeLasReglas} />

        {reglasGenerales.map((regla) => (
          <FilaDeAjuste
            key={regla.id}
            regla={regla}
            valor={puntajes[regla.id] ?? regla.puntajeBase}
            onCambiar={(valor) => setPuntajes((previos) => ({ ...previos, [regla.id]: valor }))}
          />
        ))}

        {propias.map((regla, i) => (
          <Card
            key={regla.id ?? `nueva-${i}`}
            onPress={() => setPropiaEnEdicion(i)}
            etiqueta={`${regla.titulo}. ${es.comun.puntos(regla.puntajeBase)}`}
            style={styles.fila}
          >
            <View style={styles.textos}>
              <Text style={styles.titulo}>{regla.titulo}</Text>
              <Alcance
                alcance={regla.alcance}
                texto={
                  regla.alcance === 'todas'
                    ? es.ronda.soloEnEstaRonda
                    : `${es.ronda.soloEnEstaRonda} · ${es.regla.opcional}`
                }
              />
            </View>
            <Chip valor={conSigno(regla.puntajeBase)} variante="borde" />
          </Card>
        ))}

        <Card estado="punteada" onPress={() => setPropiaEnEdicion('nueva')} etiqueta={es.ronda.reglaSoloParaEstaRonda}>
          <Text style={styles.agregar}>{`${iconos.mas}  ${es.ronda.reglaSoloParaEstaRonda}`}</Text>
        </Card>

        {reglasGenerales.length > 0 && <Text style={styles.ayuda}>{es.ronda.ayudaAjuste(numero)}</Text>}
      </View>

      {/* Al editar: saca la ronda del borrador. Como en el sheet de regla, va al
          pie y no en el encabezado, que es de la ✕ (cambio 59). */}
      {onBorrar !== undefined && (
        <Pressable accessibilityRole="button" onPress={onBorrar} style={styles.eliminar}>
          <Text style={styles.eliminarTexto}>{es.comun.eliminar}</Text>
        </Pressable>
      )}

      {/* Va adentro del sheet de la ronda y no al lado: en iOS un Modal solo se
          puede abrir encima de otro si esta anidado en él. */}
      <SheetDeRegla
        visible={propiaEnEdicion !== null}
        onCerrar={() => setPropiaEnEdicion(null)}
        regla={reglaAbierta}
        deUnaRonda
        onGuardar={(datos) =>
          setPropias((previas) =>
            typeof propiaEnEdicion === 'number'
              ? previas.map((otra, i) => (i === propiaEnEdicion ? { ...datos, id: otra.id } : otra))
              : [...previas, datos],
          )
        }
        onBorrar={
          typeof propiaEnEdicion === 'number'
            ? () => {
                setPropias((previas) => previas.filter((_otra, i) => i !== propiaEnEdicion));
                setPropiaEnEdicion(null);
              }
            : undefined
        }
      />
    </BottomSheet>
  );
}

/** Una regla de todas las rondas, con lo que vale en esta. Mantiene el signo de la regla. */
function FilaDeAjuste({ regla, valor, onCambiar }: { regla: Regla; valor: number; onCambiar: (valor: number) => void }) {
  const signo = valor < 0 ? -1 : 1;
  const alcance = regla.alcance === 'todas' ? es.regla.enTodasLasRondas : es.regla.opcional;
  const ajustado = valor !== regla.puntajeBase;

  return (
    <View style={[styles.fila, styles.caja]}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{regla.titulo}</Text>
        <Alcance
          alcance={regla.alcance}
          texto={ajustado ? `${alcance} · ${es.ronda.ajustado(regla.puntajeBase)}` : alcance}
        />
      </View>
      <Stepper
        valor={Math.abs(valor)}
        onCambiar={(magnitud) => onCambiar(signo * magnitud)}
        etiquetaRestar={`${es.comun.restar}, ${regla.titulo}`}
        etiquetaSumar={`${es.comun.sumar}, ${regla.titulo}`}
        paso={PASO}
        minimo={MINIMO}
        maximo={MAXIMO}
        formato={(magnitud) => conSigno(signo * magnitud)}
        tamano="compacto"
      />
    </View>
  );
}

/** ● o ○ y el texto chico de abajo del titulo, como en la lista de reglas. */
function Alcance({ alcance, texto }: { alcance: Regla['alcance']; texto: string }) {
  return (
    <View style={styles.alcance}>
      <View style={[styles.punto, alcance === 'opcional' && styles.puntoVacio]} />
      <Text style={styles.alcanceTexto}>{texto}</Text>
    </View>
  );
}

/** El sheet de regla pide una Regla para editar; el orden y la ronda los pone el borrador. */
function aRegla(datos: DatosRegla): Regla {
  return { ...datos, id: datos.id ?? '', orden: 0 };
}

const styles = StyleSheet.create({
  seccion: { gap: espacios.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  caja: {
    borderWidth: 1.5,
    borderColor: colores.linea,
    borderRadius: radios.lg,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.sm,
  },
  textos: { flex: 1, gap: espacios.xxs },
  titulo: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  alcance: { flexDirection: 'row', alignItems: 'center', gap: espacios.xxs + 2 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.tinta },
  puntoVacio: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colores.grisMedio },
  alcanceTexto: { ...tipografia.chico, color: colores.grisOscuro, flexShrink: 1 },
  agregar: { ...tipografia.cuerpoFuerte, color: colores.grisMedio, textAlign: 'center', paddingVertical: espacios.xs },
  ayuda: { ...tipografia.secundario, color: colores.grisMedio },
  eliminar: { minHeight: AREA_TOCABLE_MINIMA, alignItems: 'center', justifyContent: 'center' },
  eliminarTexto: { ...tipografia.secundario, fontWeight: '700', color: colores.tinta },
});
