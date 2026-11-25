import { Card } from 'react-bootstrap';
import { formatearTurno } from '../components/utils/fecha';

interface Props { especialidad: string; medico: string; fecha: string }

export const ResumenTurno = ({ especialidad, medico, fecha }: Props) => (
  <Card body className="fs-5">
    <div><strong>Especialidad:</strong> {especialidad}</div>
    <div><strong>Médico:</strong> {medico}</div>
    <div><strong>Día y hora:</strong> {formatearTurno(fecha)}</div>
  </Card>
);