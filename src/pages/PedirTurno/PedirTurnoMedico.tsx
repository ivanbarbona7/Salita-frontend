import { Alert, Button } from 'react-bootstrap';
import { CalendarEvent, ChevronRight } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { PasoLayout } from '../../components/PasoLayout';
import { CargandoBotones } from '../../components/CargandoBotones';
import { useFetch } from '../../hooks/useFetch';
import { formatearTurno } from '../../components/utils/fecha';
import type { IMedicosDeEspecialidad } from '../../types/TurnosPaciente.types';
import styles from './PedirTurno.module.scss';

// Paso 2 de 4: ¿Con qué médico? (solo los que tienen turnos libres, el que atiende antes primero)
export const PedirTurnoMedico = () => {
  const { especialidad } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useFetch<IMedicosDeEspecialidad>(
    especialidad ? `/turnos/paciente/medicos?especialidad=${especialidad}` : null,
  );

  return (
    <PasoLayout titulo={data ? `Médicos de ${data.especialidad.nombre}` : '¿Con qué médico?'} paso={2}>
      {error && (
        <Alert variant="danger">
          No pudimos cargar los médicos.
          <Button variant="link" onClick={() => void refetch()}>Reintentar</Button>
        </Alert>
      )}

      {isLoading && <CargandoBotones cantidad={3} />}

      {!isLoading && data && data.medicos.length === 0 && (
        <Alert variant="info" className="fs-5">
          No hay turnos libres para esta especialidad por ahora. Probá más adelante o acercate a la salita.
        </Alert>
      )}

      <div className={styles.lista}>
        {(data?.medicos ?? []).map((medico) => (
          <button
            key={medico.id}
            type="button"
            className={styles.opcion}
            onClick={() => navigate(`/pacientes/turnos/nuevo/${especialidad}/${medico.id}`)}
          >
            <span className={styles.avatar} aria-hidden="true">
              {medico.nombre.charAt(0)}{medico.apellido.charAt(0)}
            </span>
            <span className={styles.opcionTexto}>
              <span className={styles.opcionTitulo}>{medico.apellido}, {medico.nombre}</span>
              <span className={styles.chip}>
                <CalendarEvent size={14} aria-hidden="true" />
                Próximo turno: {formatearTurno(medico.proximoTurno)}
              </span>
            </span>
            <ChevronRight size={22} className={styles.flecha} aria-hidden="true" />
          </button>
        ))}
      </div>
    </PasoLayout>
  );
};