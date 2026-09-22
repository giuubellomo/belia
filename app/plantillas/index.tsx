import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Popup } from '@/components/Popup';
import { usePlantillas } from '@/hooks/usePlantillas';
import { es } from '@/i18n/es';
import * as plantillas from '@/repositories/plantillas';
import type { PlantillaGuardada } from '@/repositories/plantillas';
import { iconoDePlantilla, iconos } from '@/theme/iconos';
import { AREA_TOCABLE_MINIMA, colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Lista de plantillas (paso 5.1, RF-303 a RF-305).
 *
 * Las predefinidas llevan el sello «Predefinida»: se duplican, pero no se editan
 * ni se borran (el repositorio tambien lo impide). Las propias se tocan para
 * editarlas, y borrarlas pide confirmacion (RNF-6).
 */
export default function ListaDePlantillas() {
  const { plantillas: lista, cargando, mutar } = usePlantillas();
  const [aBorrar, setABorrar] = useState<PlantillaGuardada | null>(null);
  const [errorAlBorrar, setErrorAlBorrar] = useState(false);

  /** Paso 5.2: el editor todavia no existe. */
  const abrirEditor = (_id: string) => {};

  const duplicar = async (plantilla: PlantillaGuardada) => {
    const nombres = lista.map((otra) => otra.nombre);
    await mutar(() => plantillas.duplicar(plantilla.id, nombreDeCopia(plantilla.nombre, nombres)));
  };

  const borrar = async () => {
    if (aBorrar === null) return;
    try {
      await mutar(() => plantillas.borrar(aBorrar.id));
    } catch {
      setErrorAlBorrar(true);
      return;
    }
    setABorrar(null);
  };

  return (
    <View style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Card estado="punteada" onPress={() => abrirEditor('nueva')} etiqueta={es.plantilla.nueva}>
          <Text style={styles.nueva}>{`${iconos.mas}  ${es.plantilla.nueva}`}</Text>
        </Card>

        {!cargando &&
          lista.map((plantilla) => (
            <FilaDePlantilla
              key={plantilla.id}
              plantilla={plantilla}
              onEditar={() => abrirEditor(plantilla.id)}
              onDuplicar={() => void duplicar(plantilla)}
              onBorrar={() => {
                setErrorAlBorrar(false);
                setABorrar(plantilla);
              }}
            />
          ))}
      </ScrollView>

      {aBorrar !== null && (
        <Popup
          visible
          onCerrar={() => setABorrar(null)}
          etiquetaCerrar={es.comun.cerrar}
          titulo={es.plantillas.confirmarBorrarTitulo}
        >
          <Text style={styles.textoPopup}>{es.plantillas.confirmarBorrarTexto(aBorrar.nombre)}</Text>
          {errorAlBorrar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
          <View style={styles.botonesPopup}>
            <View style={styles.boton}>
              <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setABorrar(null)} />
            </View>
            <View style={styles.boton}>
              <Boton titulo={es.comun.eliminar} onPress={() => void borrar()} />
            </View>
          </View>
        </Popup>
      )}
    </View>
  );
}

interface FilaProps {
  plantilla: PlantillaGuardada;
  onEditar: () => void;
  onDuplicar: () => void;
  onBorrar: () => void;
}

function FilaDePlantilla({ plantilla, onEditar, onDuplicar, onBorrar }: FilaProps) {
  const resumen = es.plantillas.resumen(
    plantilla.reglas.length,
    plantilla.rondasIlimitadas ? null : plantilla.rondas.length,
  );

  return (
    <Card
      onPress={plantilla.esPredefinida ? undefined : onEditar}
      etiqueta={`${plantilla.nombre}. ${resumen}`}
      style={styles.card}
    >
      <View style={styles.fila}>
        <Text allowFontScaling={false} style={styles.icono}>
          {iconoDePlantilla(plantilla.icono)}
        </Text>
        <View style={styles.textos}>
          <Text style={styles.nombre}>{plantilla.nombre}</Text>
          <Text style={styles.resumen}>{resumen}</Text>
        </View>
        {plantilla.esPredefinida ? (
          <Chip texto={es.plantillas.predefinida} />
        ) : (
          <Text allowFontScaling={false} style={styles.flecha}>
            {iconos.adelante}
          </Text>
        )}
      </View>

      <View style={styles.acciones}>
        <Accion texto={es.plantillas.duplicar} onPress={onDuplicar} />
        {!plantilla.esPredefinida && <Accion texto={es.plantillas.borrar} onPress={onBorrar} />}
      </View>
    </Card>
  );
}

/** Accion de texto dentro de una card, con el area tocable de RNF-3. */
function Accion({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.accion, pressed && styles.accionPresionada]}
    >
      <Text style={styles.accionTexto}>{texto}</Text>
    </Pressable>
  );
}

/**
 * RF-304: «Karioka (copia)», y si ese nombre ya esta, «Karioka (copia 2)». La base
 * no exige nombres unicos, pero dos plantillas con el mismo nombre no se distinguen.
 */
function nombreDeCopia(nombre: string, ocupados: string[]): string {
  let numero = 1;
  while (ocupados.includes(es.plantillas.nombreCopia(nombre, numero))) numero += 1;
  return es.plantillas.nombreCopia(nombre, numero);
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacios.lg, gap: espacios.sm },
  nueva: { ...tipografia.cuerpoFuerte, color: colores.grisMedio, textAlign: 'center', paddingVertical: espacios.xs },
  card: { gap: espacios.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  icono: { fontSize: 24, color: colores.tinta },
  textos: { flex: 1, gap: espacios.xxs },
  nombre: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  resumen: { ...tipografia.secundario, color: colores.grisMedio },
  flecha: { ...tipografia.subtitulo, color: colores.tinta },
  acciones: {
    flexDirection: 'row',
    gap: espacios.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
  },
  accion: { minHeight: AREA_TOCABLE_MINIMA, justifyContent: 'center' },
  accionPresionada: { opacity: 0.6 },
  accionTexto: { ...tipografia.secundario, fontWeight: '700', color: colores.tinta },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  error: { ...tipografia.secundario, color: colores.tinta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
});
