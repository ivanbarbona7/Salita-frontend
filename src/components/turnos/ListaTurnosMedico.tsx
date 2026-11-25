import { useState } from 'react';
import { Alert, Badge, Button, Table } from 'react-bootstrap';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import ModalConfirmar from '../utils/ModalConfirmar';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { nombreObraSocial } from '../utils/ObraSocial';
import type { ITurnoMedico } from '../../types/TurnoMedico.types';

interface Props {
    turnos: ITurnoMedico[];
    onCambio: () => void;
}

const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });

const ESTADO = { pendiente: ['warning', 'Pendiente'], atendido: ['success', 'Atendido'], cancelado: ['secondary', 'Cancelado'], no_asistio: ['dark', 'No asistió'] } as const;

// Lista de turnos propios del médico, con la acción "marcar como atendido"
const ListaTurnosMedico = ({ turnos, onCambio }: Props) => {
    const [aAtender, setAAtender] = useState<ITurnoMedico | null>(null);

    if (turnos.length === 0) return <Alert variant="light">No hay turnos para mostrar.</Alert>;

    const atender = async () => {
        if (!aAtender) return;
        try {
            await clientesAxios.patch(`/turnos/medico/${aAtender.id}/atendido`);
            toast.success('Turno marcado como atendido');
            onCambio();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        } finally {
            setAAtender(null);
        }
    };

    return (
        <>
            <Table responsive hover className="align-middle">
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>DNI</th>
                        <th>Consultorio</th>
                        <th>Estado</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {turnos.map((t) => {
                        const [bg, texto] = ESTADO[t.estado];
                        return (
                            <tr key={t.id}>
                                <td>{hora(t.fechaTurno)}</td>
                                <td>
                                    {t.paciente.apellido ? `${t.paciente.apellido}, ` : ''}
                                    {t.paciente.nombre}
                                    {t.paciente.obraSocial?.nombre && (
                                        <small className="d-block text-muted">{nombreObraSocial(t.paciente.obraSocial)}</small>
                                    )}
                                </td>
                                <td>{t.paciente.dni}</td>
                                <td>{t.consultorio?.nombre ?? '—'}</td>
                                <td><Badge bg={bg}>{texto}</Badge></td>
                                <td className="text-end">
                                    {t.estado === 'pendiente' && (
                                        <Button size="sm" variant="outline-success" onClick={() => setAAtender(t)}>
                                            Marcar atendido
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
            <ModalConfirmar
                show={aAtender !== null}
                titulo="Marcar como atendido"
                mensaje={aAtender ? `¿Confirmás que atendiste a ${aAtender.paciente.nombre}?` : ''}
                textoConfirmar="Sí, atendido"
                variante="success"
                onConfirmar={atender}
                onCancelar={() => setAAtender(null)}
            />
        </>
    );
};

export default ListaTurnosMedico;