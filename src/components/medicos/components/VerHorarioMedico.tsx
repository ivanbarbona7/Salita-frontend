import { Link } from 'react-router-dom';
import { Badge, Button, Modal, Table } from 'react-bootstrap';
import { PencilSquare } from 'react-bootstrap-icons';
import { DIAS_SEMANA } from '../../../types/Horario.types';
import type { IMedico } from '../../../types/Medico.types';

interface Props {
    medico: IMedico | null;
    onCerrar: () => void;
}

// Detalle completo del horario: un renglón por día, con cada franja y su consultorio.
// Usa los datos que ya trae la lista, sin otra consulta.
const VerHorarioMedico = ({ medico, onCerrar }: Props) => {
    const franjas = medico?.horarioAtencion?.franjas ?? [];
    const nombres = new Map((medico?.consultorios ?? []).map((c) => [c.id, c.nombre]));

    const dias = DIAS_SEMANA.map((dia) => ({
        dia,
        franjas: franjas.filter((f) => f.diaSemana === dia.valor).sort((a, b) => a.desde.localeCompare(b.desde)),
    })).filter((d) => d.franjas.length > 0);

    return (
        <Modal show={medico !== null} onHide={onCerrar} centered fullscreen="sm-down">
            <Modal.Header closeButton>
                <Modal.Title className="h5">
                    Horario de {medico?.apellido}, {medico?.nombre}
                </Modal.Title>
            </Modal.Header>

            {medico && (
                <Modal.Body>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <Badge bg="info">Turnos de {medico.horarioAtencion?.duracionTurno ?? 20} min</Badge>
                        {medico.consultorioHabitual && (
                            <Badge bg="secondary">Habitual: {medico.consultorioHabitual.nombre}</Badge>
                        )}
                    </div>

                    {dias.length === 0 ? (
                        <p className="text-muted mb-0">Este médico todavía no tiene horario cargado.</p>
                    ) : (
                        <Table size="sm" className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Día</th>
                                    <th>Horario</th>
                                    <th>Consultorio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dias.flatMap(({ dia, franjas: delDia }) =>
                                    delDia.map((f, i) => (
                                        <tr key={`${dia.valor}-${f.desde}-${i}`}>
                                            <td className="fw-semibold">{i === 0 ? dia.corto : ''}</td>
                                            <td>{f.desde}–{f.hasta}</td>
                                            <td>{(f.consultorio && nombres.get(f.consultorio)) || '—'}</td>
                                        </tr>
                                    )),
                                )}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
            )}

            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onCerrar}>Cerrar</Button>
                {medico && (
                    <Link to={`/horarios/${medico.id}`} className="btn btn-success d-inline-flex align-items-center gap-1">
                        <PencilSquare size={16} /> Editar horario
                    </Link>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default VerHorarioMedico;