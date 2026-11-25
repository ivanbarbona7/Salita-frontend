import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarPlus, PersonCircle } from 'react-bootstrap-icons';
import { PasoLayout } from '../components/PasoLayout';
import { useFetch } from '../hooks/useFetch';
import { esIngresoRapido } from '../components/utils/sesion';
import { direccionTexto, type IMiTurno } from '../types/TurnosPaciente.types';
import styles from './InicioPaciente.module.scss';

const ZONA = 'America/Argentina/Buenos_Aires';

const diaClave = (fecha: Date) => fecha.toLocaleDateString('en-CA', { timeZone: ZONA }); // AAAA-MM-DD

// Cuántos días faltan (0 = hoy), comparando días calendario en hora argentina
const diasHasta = (iso: string) => {
    const [a, m, d] = diaClave(new Date(iso)).split('-').map(Number);
    const [ha, hm, hd] = diaClave(new Date()).split('-').map(Number);
    return Math.round((Date.UTC(a ?? 0, (m ?? 1) - 1, d ?? 1) - Date.UTC(ha ?? 0, (hm ?? 1) - 1, hd ?? 1)) / 86_400_000);
};

const textoCuando = (dias: number) => (dias <= 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`);

// "Cerrar sesión" ya está arriba a la derecha en PasoLayout
export const InicioPaciente = () => {
    const navigate = useNavigate();
    const rapido = esIngresoRapido();
    // Con el ingreso rápido no se piden turnos propios (datos de salud)
    const { data } = useFetch<IMiTurno[]>(rapido ? null : '/turnos/paciente');
    const proximo = (data ?? []).filter((t) => t.proximo).sort((a, b) => a.fechaTurno.localeCompare(b.fechaTurno))[0];

    const dias = proximo ? diasHasta(proximo.fechaTurno) : 0;
    const esHoy = proximo !== undefined && dias <= 0;
    const fecha = proximo ? new Date(proximo.fechaTurno) : null;

    return (
        <PasoLayout titulo="¿Qué querés hacer?" sinVolver>
            <div className={styles.contenedor}>
                {proximo && fecha && (
                    <section className={`${styles.turno} ${esHoy ? styles.turnoHoy : ''}`} aria-label="Tu próximo turno">
                        <div className={styles.fecha} aria-hidden="true">
                            <span className={styles.diaSemana}>
                                {fecha.toLocaleDateString('es-AR', { weekday: 'short', timeZone: ZONA }).replace('.', '')}
                            </span>
                            <span className={styles.diaNumero}>
                                {fecha.toLocaleDateString('es-AR', { day: 'numeric', timeZone: ZONA })}
                            </span>
                            <span className={styles.mes}>
                                {fecha.toLocaleDateString('es-AR', { month: 'short', timeZone: ZONA }).replace('.', '')}
                            </span>
                        </div>

                        <div className={styles.cuerpo}>
                            <p className={styles.cuando}>{esHoy ? 'Tenés turno hoy' : `Tu próximo turno · ${textoCuando(dias)}`}</p>
                            <p className={styles.hora}>
                                {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA })} hs
                            </p>
                            <p className={styles.especialidad}>{proximo.especialidad.nombre}</p>
                            <p className={styles.medico}>{proximo.medico.apellido}, {proximo.medico.nombre}</p>
                            <p className={styles.lugar}>{proximo.consultorio.nombre} — {direccionTexto(proximo.consultorio)}</p>
                            <Button
                                variant={esHoy ? 'light' : 'outline-primary'}
                                className={styles.verDetalle}
                                onClick={() => navigate('/pacientes/turnos')}
                            >
                                Ver detalle
                            </Button>
                        </div>
                    </section>
                )}

                <div className={styles.acciones}>
                    <button type="button" className={`${styles.accion} ${styles.pedir}`} onClick={() => navigate('/pacientes/turnos/nuevo')}>
                        <span className={styles.accionIcono}><CalendarPlus size={30} aria-hidden="true" /></span>
                        <span className={styles.accionTexto}>
                            Pedir un turno
                            <small>Elegí especialidad, médico y horario</small>
                        </span>
                    </button>

                    {rapido ? (
                        <Alert variant="light" className="text-center mb-0">
                            Para ver, reprogramar o cancelar tus turnos ingresá con tu usuario y contraseña, o acercate a la salita.
                        </Alert>
                    ) : (
                        <>
                            <button type="button" className={`${styles.accion} ${styles.secundaria}`} onClick={() => navigate('/pacientes/turnos')}>
                                <span className={styles.accionIcono}><CalendarCheck size={30} aria-hidden="true" /></span>
                                <span className={styles.accionTexto}>
                                    Mis turnos
                                    <small>Ver, reprogramar o cancelar</small>
                                </span>
                            </button>
                            <button type="button" className={`${styles.accion} ${styles.perfil}`} onClick={() => navigate('/pacientes/perfil')}>
                                <span className={styles.accionIcono}><PersonCircle size={26} aria-hidden="true" /></span>
                                <span className={styles.accionTexto}>Mi perfil</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </PasoLayout>
    );
};