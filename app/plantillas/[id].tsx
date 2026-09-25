import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { CampoTexto } from '@/components/CampoTexto';
import { Etiqueta } from '@/components/Etiqueta';
import { ListaDeReglas } from '@/components/ListaDeReglas';
import { ListaDeRondas } from '@/components/ListaDeRondas';
import { Popup } from '@/components/Popup';
import { Segmented } from '@/components/Segmented';
import { SheetDeRegla } from '@/components/SheetDeRegla';
import { SheetDeRonda } from '@/components/SheetDeRonda';
import type { CriterioVictoria, ModoPuntos, Regla, RondaDefinida } from '@/domain/types';
import { useBorradorDePlantilla } from '@/hooks/useBorradorDePlantilla';
import { es } from '@/i18n/es';
import { ICONOS_PLANTILLA, iconoDePlantilla, iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, radios, tipografia } from '@/theme/tokens';

/** Largo del nombre de una plantilla: entra en la card de la grilla del armado (6.1). */
const LARGO_MAXIMO_NOMBRE = 30;

/**
 * Editor de plantilla: datos generales (paso 5.2, RF-302), reglas (5.3) y
 * rondas (5.4).
 *
 * El editor trabaja sobre un borrador en memoria y escribe entero al tocar
 * GUARDAR PLANTILLA, como el mockup (ver registro, cambio 54): por eso volver
 * con cambios sin guardar pregunta antes de descartarlos.
 */
export default function EditorDePlantilla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    borrador,
    esNueva,
    sucio,
    cargando,
    cambiar: cambiarBorrador,
    guardarRegla,
    borrarRegla,
    moverRegla,
    guardarRonda,
    borrarRonda,
    moverRonda,
    guardar: escribir,
  } = useBorradorDePlantilla(id);

  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState(false);
  // null = sheet cerrado. Con una regla se edita esa; con 'nueva', se da de alta.
  const [reglaEnEdicion, setReglaEnEdicion] = useState<Regla | 'nueva' | null>(null);
  // Igual, para el sheet de una ronda.
  const [rondaEnEdicion, setRondaEnEdicion] = useState<RondaDefinida | 'nueva' | null>(null);

  // Las de todas las rondas van en «REGLAS»; las de una sola, en su ronda.
  // Memorizadas porque el sheet de ronda se reinicia si cambian.
  const reglas = borrador?.reglas;
  const numeroEnEdicion =
    rondaEnEdicion === 'nueva' ? (borrador?.rondas.length ?? 0) + 1 : (rondaEnEdicion?.numero ?? null);
  const generales = useMemo(() => (reglas ?? []).filter((regla) => regla.soloEnRonda === undefined), [reglas]);
  const propiasEnEdicion = useMemo(
    () => (reglas ?? []).filter((regla) => regla.soloEnRonda !== undefined && regla.soloEnRonda === numeroEnEdicion),
    [reglas, numeroEnEdicion],
  );
  // Mientras el sheet baja, `rondaEnEdicion` ya es null: el titulo sigue con la ultima.
  const ultimoNumero = useRef(1);
  if (numeroEnEdicion !== null) ultimoNumero.current = numeroEnEdicion;

  const volver = () => {
    if (sucio) {
      setConfirmandoSalida(true);
      return;
    }
    router.back();
  };

  // Android: el boton atras del sistema pasa por la misma confirmacion. En iOS el
  // gesto de arrastrar esta apagado en `_layout`, asi que la unica salida es la ‹.
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      volver();
      return true;
    });
    return () => suscripcion.remove();
  });

  const guardar = async () => {
    try {
      await escribir();
    } catch {
      setErrorAlGuardar(true);
      return;
    }
    router.back();
  };

  // Sin borrador todavia no hay nada que dibujar: o esta leyendo, o el id no existe.
  if (borrador === null) return <View style={styles.pantalla} />;

  const cambiar: typeof cambiarBorrador = (cambio) => {
    setErrorAlGuardar(false);
    cambiarBorrador(cambio);
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.encabezado}>
        <BotonIcono icono={iconos.atras} etiqueta={es.comun.volver} tamano={36} onPress={volver} />
        <Text accessibilityRole="header" style={styles.titulo}>
          {esNueva ? es.plantilla.nueva : es.plantilla.editar}
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.pantalla}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.seccion}>
            <Etiqueta texto={es.plantilla.nombreEIcono} />
            <View style={styles.fila}>
              <SelectorDeIcono valor={borrador.icono} onCambiar={(icono) => cambiar({ icono })} />
              <View style={styles.campo}>
                <CampoTexto
                  valor={borrador.nombre}
                  onCambiar={(nombre) => cambiar({ nombre })}
                  accessibilityLabel={es.plantilla.nombreEIcono}
                  placeholder={es.plantilla.nombreEjemplo}
                  maxLength={LARGO_MAXIMO_NOMBRE}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <View style={styles.seccion}>
            <Etiqueta texto={es.plantilla.puntosDeCadaRonda} />
            <Segmented<ModoPuntos>
              opciones={[
                { valor: 'suma', etiqueta: es.plantilla.seSuman, icono: iconos.mas },
                { valor: 'resta', etiqueta: es.plantilla.seRestan, icono: iconos.menos },
              ]}
              seleccionado={borrador.modoPuntos}
              onCambiar={(modoPuntos) => cambiar({ modoPuntos })}
            />
          </View>

          <View style={styles.seccion}>
            <Etiqueta texto={es.plantilla.gana} />
            <Segmented<CriterioVictoria>
              opciones={[
                { valor: 'menor', etiqueta: es.plantilla.menosPuntos, icono: iconos.abajo },
                { valor: 'mayor', etiqueta: es.plantilla.masPuntos, icono: iconos.arriba },
              ]}
              seleccionado={borrador.criterioVictoria}
              onCambiar={(criterioVictoria) => cambiar({ criterioVictoria })}
            />
            <Text style={styles.ayuda}>
              {es.plantilla.ayudaPuntos(borrador.modoPuntos, borrador.criterioVictoria)}
            </Text>
          </View>

          <ListaDeReglas
            reglas={generales}
            onEditar={setReglaEnEdicion}
            onAgregar={() => setReglaEnEdicion('nueva')}
            onMover={moverRegla}
          />

          <ListaDeRondas
            plantilla={{ id, ...borrador }}
            onEditar={setRondaEnEdicion}
            onAgregar={() => setRondaEnEdicion('nueva')}
            onMover={moverRonda}
          />
        </ScrollView>

        <View style={styles.pie}>
          {errorAlGuardar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
          <Boton
            titulo={es.plantilla.guardar}
            deshabilitado={borrador.nombre.trim().length === 0 || cargando}
            onPress={() => void guardar()}
          />
        </View>
      </KeyboardAvoidingView>

      <SheetDeRegla
        visible={reglaEnEdicion !== null}
        onCerrar={() => setReglaEnEdicion(null)}
        regla={reglaEnEdicion === 'nueva' || reglaEnEdicion === null ? undefined : reglaEnEdicion}
        onGuardar={(datos) => {
          setErrorAlGuardar(false);
          guardarRegla(datos);
        }}
        onBorrar={
          reglaEnEdicion === 'nueva' || reglaEnEdicion === null
            ? undefined
            : () => {
                borrarRegla(reglaEnEdicion.id);
                setReglaEnEdicion(null);
              }
        }
      />

      <SheetDeRonda
        visible={rondaEnEdicion !== null}
        onCerrar={() => setRondaEnEdicion(null)}
        numero={numeroEnEdicion ?? ultimoNumero.current}
        ronda={rondaEnEdicion === 'nueva' || rondaEnEdicion === null ? undefined : rondaEnEdicion}
        reglasGenerales={generales}
        reglasPropias={propiasEnEdicion}
        onGuardar={(datos) => {
          setErrorAlGuardar(false);
          guardarRonda(rondaEnEdicion === 'nueva' || rondaEnEdicion === null ? null : rondaEnEdicion.numero, datos);
        }}
        onBorrar={
          rondaEnEdicion === 'nueva' || rondaEnEdicion === null
            ? undefined
            : () => {
                borrarRonda(rondaEnEdicion.numero);
                setRondaEnEdicion(null);
              }
        }
      />

      <Popup
        visible={confirmandoSalida}
        onCerrar={() => setConfirmandoSalida(false)}
        etiquetaCerrar={es.comun.cerrar}
        titulo={es.plantilla.salirTitulo}
      >
        <Text style={styles.textoPopup}>{es.plantilla.salirTexto}</Text>
        <View style={styles.botonesPopup}>
          <View style={styles.boton}>
            <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setConfirmandoSalida(false)} />
          </View>
          <View style={styles.boton}>
            <Boton
              titulo={es.plantilla.salir}
              onPress={() => {
                setConfirmandoSalida(false);
                router.back();
              }}
            />
          </View>
        </View>
      </Popup>
    </SafeAreaView>
  );
}

/** Los iconos de plantilla del sistema de diseño, en cuadrados que se tocan. */
function SelectorDeIcono({ valor, onCambiar }: { valor: string; onCambiar: (clave: string) => void }) {
  return (
    <View accessibilityRole="radiogroup" style={styles.iconos}>
      {Object.keys(ICONOS_PLANTILLA).map((clave) => (
        <Pressable
          key={clave}
          accessibilityRole="radio"
          accessibilityState={{ checked: clave === valor }}
          accessibilityLabel={es.plantilla.icono(clave)}
          onPress={() => onCambiar(clave)}
          style={[styles.cuadrado, clave === valor && styles.cuadradoElegido]}
        >
          <Text allowFontScaling={false} style={styles.glifo}>
            {iconoDePlantilla(clave)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  titulo: { ...tipografia.subtitulo, color: colores.tinta },
  contenido: { padding: espacios.lg, gap: espacios.xl },
  seccion: { gap: espacios.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  campo: { flex: 1 },
  iconos: { flexDirection: 'row', gap: espacios.xs },
  cuadrado: {
    width: AREA_TOCABLE_MINIMA + 6,
    height: AREA_TOCABLE_MINIMA + 6,
    borderRadius: radios.sm,
    borderWidth: 1.5,
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuadradoElegido: { borderColor: colores.tinta, borderWidth: 2, backgroundColor: colores.superficie },
  glifo: { fontSize: 22, color: colores.tinta },
  ayuda: { ...tipografia.secundario, color: colores.grisMedio },
  pie: {
    gap: espacios.xs,
    paddingHorizontal: espacios.lg,
    paddingTop: espacios.sm,
    paddingBottom: espacios.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
  },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
});
