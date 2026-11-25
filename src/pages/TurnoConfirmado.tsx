import { Alert, Button, Card, ListGroup, Stack } from 'react-bootstrap';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PasoLayout } from '../components/PasoLayout';
import { cerrarSesion, esIngresoRapido } from '../components/utils/sesion';
import { formatearTurno } from '../components/utils/fecha';
import { confirmacionSchema, direccionTexto } from '../types/TurnosPaciente.types';

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
      <Alert variant="success" className="fs-5">
        Anotá estos datos o sacale una foto a la pantalla.
      </Alert>

      <Card className="mb-4">
        <ListGroup variant="flush" className="fs-5">
          <ListGroup.Item><strong>Especialidad:</strong> {especialidad.nombre}</ListGroup.Item>
          <ListGroup.Item><strong>Médico:</strong> {medico.apellido}, {medico.nombre}</ListGroup.Item>
          <ListGroup.Item><strong>Cuándo:</strong> {formatearTurno(horario.inicio)} hs</ListGroup.Item>
          <ListGroup.Item>
            <strong>Dónde:</strong> {horario.consultorio.nombre}
            <small className="d-block text-muted">{direccionTexto(horario.consultorio)}</small>
          </ListGroup.Item>
        </ListGroup>
      </Card>

      <Stack gap={3}>
        <Button size="lg" className="py-3 fs-4" onClick={terminar}>Terminar y salir</Button>
        {!esIngresoRapido() && (
          <Button variant="outline-primary" size="lg" onClick={() => navigate('/pacientes/turnos')}>Ver mis turnos</Button>
        )}
        <Button variant="link" onClick={() => navigate('/pacientes/inicio')}>Volver al inicio</Button>
      </Stack>
    </PasoLayout>
  );
};