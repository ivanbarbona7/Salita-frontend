import { Button, Card } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BoxArrowRight,
  Calendar3,
  CameraFill,
  CheckCircleFill,
  GeoAltFill,
  HeartPulseFill,
  HouseDoor,
  PersonFill,
} from 'react-bootstrap-icons';
import { PasoLayout } from '../components/PasoLayout';
import { cerrarSesion, esIngresoRapido } from '../components/utils/sesion';
import { formatearTurno } from '../components/utils/fecha';
import { confirmacionSchema, direccionTexto } from '../types/TurnosPaciente.types';
import styles from './TurnoConfirmado.module.scss';

// Comprobante. "Terminar y salir" cierra la sesión, para que no quede abierta en una compu compartida.
export const TurnoConfirmado = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const resultado = confirmacionSchema.safeParse(state);
  if (!resultado.success) return <Navigate to="/pacientes/inicio" replace />;
  const { especialidad, medico, horario } = resultado.data;

  const terminar = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <PasoLayout titulo="¡Turno confirmado!" sinVolver>
      <div className={styles.contenedor}>
        <div className={styles.encabezado}>
          <CheckCircleFill className={styles.iconoExito} aria-hidden="true" />
          <p className={styles.subtitulo}>Tu turno quedó reservado. Te esperamos.</p>
        </div>

        <div className={styles.aviso} role="note">
          <CameraFill className={styles.avisoIcono} aria-hidden="true" />
          <span>Anotá estos datos o sacale una foto a la pantalla.</span>
        </div>

        <Card className={styles.comprobante}>
          <div className={styles.fila}>
            <HeartPulseFill className={styles.filaIcono} aria-hidden="true" />
            <div>
              <span className={styles.etiqueta}>Especialidad</span>
              <span className={styles.valor}>{especialidad.nombre}</span>
            </div>
          </div>

          <div className={styles.fila}>
            <PersonFill className={styles.filaIcono} aria-hidden="true" />
            <div>
              <span className={styles.etiqueta}>Médico</span>
              <span className={styles.valor}>{medico.apellido}, {medico.nombre}</span>
            </div>
          </div>

          <div className={styles.fila}>
            <Calendar3 className={styles.filaIcono} aria-hidden="true" />
            <div>
              <span className={styles.etiqueta}>Cuándo</span>
              <span className={styles.valor}>{formatearTurno(horario.inicio)} hs</span>
            </div>
          </div>

          <div className={styles.fila}>
            <GeoAltFill className={styles.filaIcono} aria-hidden="true" />
            <div>
              <span className={styles.etiqueta}>Dónde</span>
              <span className={styles.valor}>{horario.consultorio.nombre}</span>
              <span className={styles.direccion}>{direccionTexto(horario.consultorio)}</span>
            </div>
          </div>
        </Card>

        <div className={styles.acciones}>
          <Button variant="none" className={styles.botonPrincipal} onClick={terminar}>
            <BoxArrowRight aria-hidden="true" /> Terminar y salir
          </Button>

          {!esIngresoRapido() && (
            <Button variant="none" className={styles.botonSecundario} onClick={() => navigate('/pacientes/turnos')}>
              <Calendar3 aria-hidden="true" /> Ver mis turnos
            </Button>
          )}

          <Button variant="none" className={styles.botonTerciario} onClick={() => navigate('/pacientes/inicio')}>
            <HouseDoor aria-hidden="true" /> Volver al inicio
          </Button>
        </div>
      </div>
    </PasoLayout>
  );
};