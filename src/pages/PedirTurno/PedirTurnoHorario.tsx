import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { ArrowClockwise, CalendarEvent, Clock } from 'react-bootstrap-icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PasoLayout } from '../../components/PasoLayout';
import { CargandoBotones } from '../../components/CargandoBotones';
import { useFetch } from '../../hooks/useFetch';
import { etiquetaDia } from '../../components/utils/fecha';
import type { IConfirmacion, IDiasDeMedico, IHorarioPaciente } from '../../types/TurnosPaciente.types';
import styles from './PedirTurno.module.scss';

interface HorariosProps {
  medicoId: string;
  dia: string;
  onElegir: (horario: IHorarioPaciente) => void;
}

// Se monta de nuevo (con key) cada vez que cambia el día o se pide actualizar: así nunca se ven horarios de otro día
const HorariosDelDia = ({ medicoId, dia, onElegir }: HorariosProps) => {
  const { data, isLoading, error } = useFetch<IHorarioPaciente[]>(
    `/turnos/paciente/horarios?medico=${medicoId}&fecha=${dia}`,
  );
  const horarios = data ?? [];
  const variosConsultorios = new Set(horarios.map((h) => h.consultorio.id)).size > 1;

  return (
    <>
      <h2 className={styles.seccionTitulo}><Clock size={22} aria-hidden="true" /> ¿A qué hora?</h2>
      {isLoading && <CargandoBotones cantidad={3} />}
      {error && <Alert variant="danger">No pudimos cargar los horarios de ese día.</Alert>}

      {!isLoading && !error && horarios.length === 0 && (
        <Alert variant="warning" className="fs-5">
          Ese día ya no tiene horarios libres. Elegí otro día.
        </Alert>
      )}

      <div className={styles.horas}>
        {horarios.map((h) => (
          <button key={h.inicio} type="button" className={styles.hora} onClick={() => onElegir(h)}>
            {h.hora}
            {variosConsultorios && <small>{h.consultorio.nombre}</small>}
          </button>
        ))}
      </div>
    </>
  );
};

// Paso 3 de 4: ¿Qué día y a qué hora? Solo aparecen días y horarios libres, cargados en "Horario de atención".
// El día elegido vive en la URL (?dia=AAAA-MM-DD): si el turno se ocupa, se vuelve acá y se recarga.
export const PedirTurnoHorario = () => {
  const { medico: medicoId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const dia = params.get('dia');

  const { data: info, isLoading, error, refetch } = useFetch<IDiasDeMedico>(
    medicoId ? `/turnos/paciente/dias?medico=${medicoId}` : null,
  );

  const actualizar = () => {
    void refetch();
    setVersion((v) => v + 1);
  };

  const elegirHorario = (horario: IHorarioPaciente) => {
    if (!info || !dia) return;
    const confirmacion: IConfirmacion = { especialidad: info.especialidad, medico: info.medico, dia, horario };
    navigate('/pacientes/turnos/confirmar', { state: confirmacion });
  };

  return (
    <PasoLayout titulo={info ? `${info.medico.apellido}, ${info.medico.nombre}` : 'Elegí día y hora'} paso={3}>
      {error && <Alert variant="danger">No pudimos cargar los días disponibles.</Alert>}
      {isLoading && <CargandoBotones cantidad={3} />}

      {!isLoading && info && info.dias.length === 0 && (
        <Alert variant="info" className="fs-5">
          Este médico no tiene turnos libres por ahora. Volvé y elegí otro, o acercate a la salita.
        </Alert>
      )}

      {!isLoading && info && info.dias.length > 0 && (
        <>
          <h2 className={styles.seccionTitulo}><CalendarEvent size={22} aria-hidden="true" /> ¿Qué día?</h2>
          <div className={styles.dias}>
            {info.dias.map((d) => (
              <button
                key={d.fecha}
                type="button"
                aria-pressed={d.fecha === dia}
                className={`${styles.dia} ${d.fecha === dia ? styles.diaActivo : ''}`}
                onClick={() => setParams({ dia: d.fecha }, { replace: true })}
              >
                {etiquetaDia(d.fecha)}
                <small>{d.libres} {d.libres === 1 ? 'turno' : 'turnos'}</small>
              </button>
            ))}
          </div>
        </>
      )}

      {medicoId && dia && (
        <HorariosDelDia key={`${dia}-${version}`} medicoId={medicoId} dia={dia} onElegir={elegirHorario} />
      )}

      {info && (
        <div className={styles.actualizarFila}>
          <button type="button" className={styles.actualizar} onClick={actualizar}>
            <ArrowClockwise size={18} aria-hidden="true" /> Actualizar horarios
          </button>
        </div>
      )}
    </PasoLayout>
  );
};