import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Tab, Tabs } from 'react-bootstrap';
import { toast } from 'sonner';
import { PasoLayout } from '../components/PasoLayout';
import { CargandoBotones } from '../components/CargandoBotones';
import { useFetch } from '../hooks/useFetch';
import { useCancelarTurno } from '../hooks/useTurnosApi';
import ModalConfirmar from '../components/utils/ModalConfirmar';
import DetalleMiTurnoModal from '../components/turnos/DetalleMiTurnoModal';
import { esIngresoRapido } from '../components/utils/sesion';
import { obtenerMensajeError } from '../components/utils/obtenerMensajeError';
import { direccionTexto, type IMiTurno } from '../types/TurnosPaciente.types';
import styles from './MisTurnos.module.scss';

const ZONA = 'America/Argentina/Buenos_Aires';

// Partes de la fecha para el bloque grande: "mié" / "26" / "nov" y la hora "09:30"
const partesFecha = (iso: string) => {
    const fecha = new Date(iso);
    return {
        diaSemana: fecha.toLocaleDateString('es-AR', { weekday: 'short', timeZone: ZONA }).replace('.', ''),
        dia: fecha.toLocaleDateString('es-AR', { day: 'numeric', timeZone: ZONA }),
        mes: fecha.toLocaleDateString('es-AR', { month: 'short', timeZone: ZONA }).replace('.', ''),
        hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA }),
    };
};

const claseEstado = (estado: IMiTurno['estado']) =>
    estado === 'atendido' ? styles.atendido
        : estado === 'cancelado' ? styles.cancelado
            : estado === 'no_asistio' ? styles.noAsistio
                : '';

interface TarjetaProps {
    turno: IMiTurno;
    esElProximo: boolean; // el primero de "Próximos": se destaca
    onDetalle: (id: string) => void;
    onReprogramar: (id: string) => void;
    onCancelar: (id: string) => void;
}

const TarjetaTurno = ({ turno, esElProximo, onDetalle, onReprogramar, onCancelar }: TarjetaProps) => {
    const { diaSemana, dia, mes, hora } = partesFecha(turno.fechaTurno);

    return (
        <article className={`${styles.tarjeta} ${claseEstado(turno.estado)} ${esElProximo ? styles.proximoDestacado : ''}`}>
            <div className={styles.fecha} aria-hidden="true">
                <span className={styles.diaSemana}>{diaSemana}</span>
                <span className={styles.diaNumero}>{dia}</span>
                <span className={styles.mes}>{mes}</span>
            </div>

            <div className={styles.cuerpo}>
                {esElProximo && <p className={styles.etiquetaProximo}>Tu próximo turno</p>}

                <div className={styles.cabecera}>
                    <h3 className={styles.hora}>{hora} hs</h3>
                    <div className={styles.insignias}>
                        {turno.reprogramado && <Badge bg="info">Reprogramado</Badge>}
                        {turno.estado === 'atendido' && <Badge bg="success">Atendido</Badge>}
                        {turno.estado === 'cancelado' && <Badge bg="secondary">Cancelado</Badge>}
                        {turno.estado === 'no_asistio' && <Badge bg="dark">No asistió</Badge>}
                    </div>
                </div>

                <p className={styles.especialidad}>{turno.especialidad.nombre}</p>
                <p className={styles.medico}>{turno.medico.apellido}, {turno.medico.nombre}</p>
                <p className={styles.lugar}>{turno.consultorio.nombre} — {direccionTexto(turno.consultorio)}</p>

                <div className={styles.acciones}>
                    <Button variant="outline-secondary" onClick={() => onDetalle(turno.id)}>Ver detalle</Button>
                    {turno.proximo && (
                        <>
                            {/* Deshabilitado, pero con el motivo a la vista */}
                            <Button variant="outline-primary" disabled={!turno.puedeReprogramar} onClick={() => onReprogramar(turno.id)}>
                                Reprogramar
                            </Button>
                            {turno.puedeCancelar && (
                                <Button variant="outline-danger" onClick={() => onCancelar(turno.id)}>Cancelar turno</Button>
                            )}
                            {turno.motivoNoReprogramar && <p className={styles.nota}>{turno.motivoNoReprogramar}</p>}
                            {!turno.puedeCancelar && !turno.motivoNoReprogramar && (
                                <p className={styles.nota}>Para cancelar este turno comunicate con la salita.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

export const MisTurnos = () => {
    const navigate = useNavigate();
    const { data, setData, isLoading, error } = useFetch<IMiTurno[]>(esIngresoRapido() ? null : '/turnos/paciente');
    const cancelarTurno = useCancelarTurno();
    const [turnoACancelar, setTurnoACancelar] = useState<string | null>(null);
    const [idDetalle, setIdDetalle] = useState<string | null>(null);

    // Con el ingreso rápido no se muestran turnos (datos de salud): el servidor también lo rechaza
    if (esIngresoRapido()) return <Navigate to="/pacientes/inicio" replace />;

    const lista = data ?? [];
    const proximos = lista.filter((t) => t.proximo).sort((a, b) => a.fechaTurno.localeCompare(b.fechaTurno));
    const historial = lista.filter((t) => !t.proximo);
    const turnoVisto = lista.find((t) => t.id === idDetalle) ?? null;

    const confirmarCancelacion = async () => {
        if (!turnoACancelar) return;
        try {
            await cancelarTurno(turnoACancelar);
            setData(lista.filter((t) => t.id !== turnoACancelar));
            toast.success('Turno cancelado');
        } catch (err: unknown) {
            toast.error(obtenerMensajeError(err));
        } finally {
            setTurnoACancelar(null);
        }
    };

    const tarjetas = (turnos: IMiTurno[], destacarPrimero: boolean) => (
        <div className={styles.lista}>
            {turnos.map((t, i) => (
                <TarjetaTurno
                    key={t.id}
                    turno={t}
                    esElProximo={destacarPrimero && i === 0}
                    onDetalle={setIdDetalle}
                    onReprogramar={(id) => navigate(`/pacientes/turnos/${id}/reprogramar`)}
                    onCancelar={setTurnoACancelar}
                />
            ))}
        </div>
    );

    return (
        <PasoLayout titulo="Mis turnos">
            {error && <Alert variant="danger">No pudimos cargar tus turnos.</Alert>}
            {isLoading && <CargandoBotones cantidad={3} />}

            {!isLoading && data && lista.length === 0 && (
                <Alert variant="info" className="fs-5">Todavía no tenés turnos.</Alert>
            )}

            {lista.length > 0 && (
                <Tabs defaultActiveKey="proximos" className="fs-5">
                    <Tab eventKey="proximos" title={`Próximos (${proximos.length})`}>
                        {proximos.length === 0
                            ? <Alert variant="light" className="mt-3">No tenés turnos próximos.</Alert>
                            : tarjetas(proximos, true)}
                    </Tab>
                    <Tab eventKey="historial" title={`Historial (${historial.length})`}>
                        {historial.length === 0
                            ? <Alert variant="light" className="mt-3">Todavía no tenés turnos anteriores.</Alert>
                            : tarjetas(historial, false)}
                    </Tab>
                </Tabs>
            )}

            <DetalleMiTurnoModal turno={turnoVisto} onCerrar={() => setIdDetalle(null)} />

            <ModalConfirmar
                show={turnoACancelar !== null}
                titulo="Cancelar turno"
                mensaje={<span className="fs-5">¿Seguro que querés cancelar este turno?</span>}
                textoConfirmar="Sí, cancelar"
                textoCancelar="No, volver"
                onConfirmar={confirmarCancelacion}
                onCancelar={() => setTurnoACancelar(null)}
            />
        </PasoLayout>
    );
};