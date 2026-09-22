import { useEffect, useState } from 'react';

import type { Participante } from '@/domain/types';
import { useParticipantes } from '@/hooks/useParticipantes';
import { es } from '@/i18n/es';
import * as participantes from '@/repositories/participantes';

import { FormularioParticipante, type DatosFormularioParticipante } from './FormularioParticipante';
import { Popup } from './Popup';

interface Props {
  visible: boolean;
  /** Cancelar, la ✕, el velo o el boton atras. No guarda nada. */
  onCerrar: () => void;
  /** Si viene, el popup edita ese participante (RF-203); si no, da de alta uno nuevo (RF-201). */
  participante?: Participante;
  /** Corre despues de guardar: el armado (6.1) lo usa para preseleccionar al recien creado. */
  onGuardado?: (participante: Participante) => void;
}

/**
 * Popup «Agregar participante» del mockup (paso 4.3, RF-201 a RF-203).
 *
 * El formulario y la validacion del nombre son los del paso 4.1; lo que agrega
 * este componente es la escritura. Guarda apenas se confirma (RNF-2): no hay un
 * borrador que se pierda al cerrar.
 *
 * Lo montan el sheet de armado (6.1) y la configuracion (9.1). El error de
 * guardado lo muestra el formulario, asi que aca no se atrapa.
 */
export function PopupParticipante({ visible, onCerrar, participante, onGuardado }: Props) {
  const { participantes: activos, mutar } = useParticipantes();

  // Cada apertura monta un formulario nuevo. El Modal queda montado aunque este
  // cerrado: sin esto, al reabrirlo seguiria el nombre a medio escribir de la vez
  // anterior, o los datos del participante que se edito recien.
  const [apertura, setApertura] = useState(0);
  useEffect(() => {
    if (visible) setApertura((n) => n + 1);
  }, [visible]);

  // RF-202: el que se esta editando no tiene que chocar consigo mismo.
  const nombresOcupados = activos.filter((otro) => otro.id !== participante?.id).map((otro) => otro.nombre);

  const confirmar = async (datos: DatosFormularioParticipante) => {
    const guardado =
      participante === undefined
        ? await mutar(() => participantes.crear(datos))
        : await mutar(async () => {
            const actualizado: Participante = { ...participante, ...datos };
            await participantes.actualizar(actualizado);
            return actualizado;
          });

    onGuardado?.(guardado);
    onCerrar();
  };

  return (
    <Popup
      visible={visible}
      onCerrar={onCerrar}
      etiquetaCerrar={es.comun.cerrar}
      titulo={participante === undefined ? es.participante.agregarTitulo : es.participante.editarTitulo}
    >
      <FormularioParticipante
        key={apertura}
        nombresOcupados={nombresOcupados}
        textoConfirmar={participante === undefined ? es.comun.agregar : es.comun.guardar}
        onConfirmar={confirmar}
        onCancelar={onCerrar}
        inicial={participante}
      />
    </Popup>
  );
}
