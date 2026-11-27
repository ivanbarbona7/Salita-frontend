import { useState } from 'react';
import { Badge, Button, Table } from 'react-bootstrap';
import { CheckLg } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import ModalConfirmar from '../utils/ModalConfirmar';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { nombreObraSocial } from '../utils/ObraSocial';
import type { ITurnoMedico } from '../../types/TurnoMedico.types';
import styles from './ListaTurnosMedico.module.scss';

interface Props {
    turnos: ITurnoMedico[];
    onCambio: () => void;
}

type Estado = ITurnoMedico['estado'];

const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });

// [color de la etiqueta, texto, color del texto]
const ESTADO = {
    pendiente: ['warning', 'Pendiente', 'dark'],
    atendido: ['success', 'Atendido', undefined],
    cancelado: ['secondary', 'Cancelado', undefined],
    no_asistio: ['dark', 'No asistió', undefined],
} as const;

const claseFila = (estado: Estado) =>
    estado === 'atendido' ? styles.filaAtendida
        : estado === 'no_asistio' ? styles.filaNoAsistio
            : estado === 'cancelado' ? styles.filaCancelada
                : styles.filaPendiente;

const claseTarjeta = (estado: Estado) =>
    estado === 'atendido' ? `${styles.tarjeta} ${styles.tarjetaAtendida}`
        : estado === 'no_asistio' ? `${styles.tarjeta} ${styles.tarjetaNoAsistio}`
            : estado === 'cancelado' ? `${styles.tarjeta} ${styles.tarjetaCancelada}`
                : styles.tarjeta;

// Lista de turnos propios del médico, con la acción "marcar como atendido"
const ListaTurnosMedico = ({ turnos, onCambio }: Props) => {
    const [aAtender, setAAtender] = useState<ITurnoMedico | null>(null);

    if (turnos.length === 0) return <div className={styles.vacio}>No hay turnos para mostrar.</div>;

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

    const estadoDe = (t: ITurnoMedico) => {
        const [bg, texto, textoColor] = ESTADO[t.estado];
        return <Badge bg={bg} text={textoColor}>{texto}</Badge>;
    };

    const accionDe = (t: ITurnoMedico) =>
        t.estado === 'pendiente' ? (
            <Button
                size="sm"
                variant="outline-success"
                className="d-inline-flex align-items-center gap-1"
                onClick={() => setAAtender(t)}
            >
                <CheckLg aria-hidden="true" /> Marcar atendido
            </Button>
        ) : null;

    const nombrePaciente = (t: ITurnoMedico) => `${t.paciente.apellido ? `${t.paciente.apellido}, ` : ''}${t.paciente.nombre}`;

    const datosPaciente = (t: ITurnoMedico) => (
        <>
            <div className={styles.principal}>{nombrePaciente(t)}</div>
            <div className={styles.secundario}>
                DNI {t.paciente.dni}
                {t.paciente.obraSocial?.nombre ? ` · ${nombreObraSocial(t.paciente.obraSocial)}` : ''}
            </div>
        </>
    );

    return (
        <>
            {/* Escritorio: tabla */}
            <Table hover responsive className={`d-none d-md-table align-middle ${styles.tabla}`}>
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>Consultorio</th>
                        <th>Estado</th>
                        <th className="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {turnos.map((t) => (
                        <tr key={t.id} className={claseFila(t.estado)}>
                            <td className="text-nowrap"><span className={styles.hora}>{hora(t.fechaTurno)}</span></td>
                            <td>{datosPaciente(t)}</td>
                            <td>{t.consultorio?.nombre ?? '—'}</td>
                            <td className="text-nowrap">{estadoDe(t)}</td>
                            <td className="text-end text-nowrap">{accionDe(t)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Celular: tarjetas */}
            <div className="d-md-none d-grid gap-3">
                {turnos.map((t) => (
                    <div key={t.id} className={claseTarjeta(t.estado)}>
                        <div className={styles.tarjetaCabecera}>
                            <span className={styles.hora}>{hora(t.fechaTurno)}</span>
                            <span>{estadoDe(t)}</span>
                        </div>
                        <div className={styles.tarjetaFila}>{datosPaciente(t)}</div>
                        <div className={styles.secundario}>{t.consultorio?.nombre ?? 'Sin consultorio'}</div>
                        {t.estado === 'pendiente' && <div className="mt-3">{accionDe(t)}</div>}
                    </div>
                ))}
            </div>

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