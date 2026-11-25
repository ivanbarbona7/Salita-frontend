import { useForm } from 'react-hook-form';
import { CalendarCheck, GeoAlt, HeartPulse, PersonVcard } from 'react-bootstrap-icons';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { PasoLayout } from '../../components/PasoLayout';
import { useCrearTurnoPaciente } from '../../hooks/useTurnosApi';
import { formatearTurno } from '../../components/utils/fecha';
import { obtenerMensajeError } from '../../components/utils/obtenerMensajeError';
import { confirmacionSchema, direccionTexto } from '../../types/TurnosPaciente.types';
import styles from './PedirTurno.module.scss';

// Paso 4 de 4: confirmar. Los datos llegan por el estado de la navegación; si se recarga la página se vuelve al inicio.
export const PedirTurnoConfirmar = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const crearTurno = useCrearTurnoPaciente();
  const { handleSubmit, formState: { isSubmitting } } = useForm();

  const resultado = confirmacionSchema.safeParse(state);
  if (!resultado.success) return <Navigate to="/pacientes/turnos/nuevo" replace />;
  const { especialidad, medico, dia, horario } = resultado.data;

  const confirmar = async () => {
    try {
      await crearTurno({
        consultorio: horario.consultorio.id,
        especialidad: especialidad.id,
        medico: medico.id,
        fechaTurno: horario.inicio,
      });
      navigate('/pacientes/turnos/confirmado', { state: resultado.data, replace: true });
    } catch (error: unknown) {
      toast.error(obtenerMensajeError(error));
      // 409: otra persona tomó ese horario justo antes. Se vuelve a los horarios, que se recargan.
      if (isAxiosError(error) && error.response?.status === 409) {
        navigate(`/pacientes/turnos/nuevo/${especialidad.id}/${medico.id}?dia=${dia}`, { replace: true });
      }
    }
  };

  return (
    <PasoLayout titulo="Revisá y confirmá tu turno" paso={4}>
      <div className={styles.resumen}>
        <div className={styles.fila}>
          <span className={styles.filaIcono}><HeartPulse size={22} aria-hidden="true" /></span>
          <div>
            <span className={styles.filaEtiqueta}>Especialidad</span>
            <span className={styles.filaValor}>{especialidad.nombre}</span>
          </div>
        </div>
        <div className={styles.fila}>
          <span className={styles.filaIcono}><PersonVcard size={22} aria-hidden="true" /></span>
          <div>
            <span className={styles.filaEtiqueta}>Médico</span>
            <span className={styles.filaValor}>{medico.apellido}, {medico.nombre}</span>
          </div>
        </div>
        <div className={styles.fila}>
          <span className={styles.filaIcono}><CalendarCheck size={22} aria-hidden="true" /></span>
          <div>
            <span className={styles.filaEtiqueta}>Cuándo</span>
            <span className={styles.filaValor}>{formatearTurno(horario.inicio)} hs</span>
          </div>
        </div>
        <div className={styles.fila}>
          <span className={styles.filaIcono}><GeoAlt size={22} aria-hidden="true" /></span>
          <div>
            <span className={styles.filaEtiqueta}>Dónde</span>
            <span className={styles.filaValor}>
              {horario.consultorio.nombre}
              <small>{direccionTexto(horario.consultorio)}</small>
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(confirmar)} noValidate>
        <button type="submit" className={styles.confirmar} disabled={isSubmitting}>
          {isSubmitting ? 'Confirmando...' : 'Confirmar turno'}
        </button>
      </form>
    </PasoLayout>
  );
};