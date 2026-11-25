import { Alert, Button } from 'react-bootstrap';
import { ChevronRight, HeartPulse } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { PasoLayout } from '../../components/PasoLayout';
import { CargandoBotones } from '../../components/CargandoBotones';
import { useFetch } from '../../hooks/useFetch';
import type { IEspecialidadPaciente } from '../../types/TurnosPaciente.types';
import styles from './PedirTurno.module.scss';

// Paso 1 de 4: ¿Con qué especialidad?
export const PedirTurnoEspecialidad = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useFetch<IEspecialidadPaciente[]>('/turnos/paciente/especialidades');

  return (
    <PasoLayout titulo="¿Qué especialidad necesitás?" paso={1}>
      {error && (
        <Alert variant="danger">
          No pudimos cargar las especialidades.
          <Button variant="link" onClick={() => void refetch()}>Reintentar</Button>
        </Alert>
      )}

      {isLoading && <CargandoBotones />}

      {!isLoading && data && data.length === 0 && (
        <Alert variant="info" className="fs-5">
          Por ahora no hay turnos para pedir desde acá. Acercate a la salita y te ayudamos.
        </Alert>
      )}

      <div className={styles.lista}>
        {(data ?? []).map((esp) => (
          <button
            key={esp.id}
            type="button"
            className={styles.opcion}
            onClick={() => navigate(`/pacientes/turnos/nuevo/${esp.id}`)}
          >
            <span className={styles.opcionIcono}><HeartPulse size={26} aria-hidden="true" /></span>
            <span className={styles.opcionTexto}>
              <span className={styles.opcionTitulo}>{esp.nombre}</span>
            </span>
            <ChevronRight size={22} className={styles.flecha} aria-hidden="true" />
          </button>
        ))}
      </div>
    </PasoLayout>
  );
};