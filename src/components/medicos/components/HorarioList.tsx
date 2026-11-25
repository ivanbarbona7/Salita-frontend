import { useState } from 'react';
import { Alert, Badge, Container, Form, Tab, Table, Tabs } from 'react-bootstrap';
import { Building, ClockHistory, PersonBadge } from 'react-bootstrap-icons';
import { useFetch } from '../../../hooks/useFetch';
import ListSkeleton from '../../utils/ListSkeleton';
import BotonAccion from '../../utils/BotonAccion';
import formulario from '../../utils/Formulario.module.scss';
import styles from '../MedicoList.module.scss';
import pestanas from './HorarioList.module.scss';
import AgendaConsultorios from './AgendaConsultorio';
import VerHorarioMedico from './VerHorarioMedico';
import { DIAS_SEMANA } from '../../../types/Horario.types';
import type { IMedico } from '../../../types/Medico.types';

// Sin tildes ni mayúsculas, para que "perez" encuentre "Pérez"
const normalizar = (texto: string) =>
    texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Resumen {
    dias: string;  // "Lun a Vie" o "Lun, Mié, Vie"
    horas: string; // "08:00–12:00" o "Horarios variados"
}

// Resumen corto para la lista: el detalle completo está en el modal "Ver horario"
const resumenCorto = (medico: IMedico): Resumen | null => {
    const franjas = medico.horarioAtencion?.franjas ?? [];
    if (franjas.length === 0) return null;

    const presentes = DIAS_SEMANA.filter((d) => franjas.some((f) => f.diaSemana === d.valor));

    // Agrupa días seguidos: [Lun, Mar, Mié, Vie] -> "Lun a Mié, Vie"
    const grupos: (typeof presentes)[] = [];
    presentes.forEach((d) => {
        const ultimo = grupos[grupos.length - 1];
        const anterior = ultimo?.[ultimo.length - 1];
        if (ultimo && anterior && DIAS_SEMANA.indexOf(d) === DIAS_SEMANA.indexOf(anterior) + 1) ultimo.push(d);
        else grupos.push([d]);
    });
    const dias = grupos
        .map((g) => {
            const primero = g[0];
            const ultimo = g[g.length - 1];
            if (!primero || !ultimo) return '';
            if (g.length === 1) return primero.corto;
            return g.length === 2 ? `${primero.corto}, ${ultimo.corto}` : `${primero.corto} a ${ultimo.corto}`;
        })
        .join(', ');

    const rangos = new Set<string>(franjas.map((f) => `${f.desde}–${f.hasta}`));
    const horas = rangos.size === 1 ? Array.from(rangos)[0] ?? '' : 'Horarios variados';

    return { dias, horas };
};

const HorariosList = () => {
    const { data: medicos, isLoading, error } = useFetch<IMedico[]>('/medicos?activo=true');
    const [busqueda, setBusqueda] = useState('');
    const [idVista, setIdVista] = useState<string | null>(null);

    if (isLoading) return <ListSkeleton rows={5} />;

    const lista = medicos ?? [];
    const termino = normalizar(busqueda.trim());
    const filtrados = lista.filter((m) =>
        normalizar(`${m.nombre} ${m.apellido} ${m.especialidad?.nombre ?? ''}`).includes(termino),
    );
    const medicoVisto = lista.find((m) => m.id === idVista) ?? null;

    const horarioDe = (m: IMedico) => {
        if ((m.consultorios ?? []).length === 0) return <Badge bg="warning" text="dark">Sin consultorio asignado</Badge>;
        const resumen = resumenCorto(m);
        if (!resumen) return <Badge bg="warning" text="dark">Sin horario cargado</Badge>;
        return (
            <>
                <div className="fw-semibold">{resumen.dias}</div>
                <div className="small text-muted">{resumen.horas}</div>
            </>
        );
    };

    const Acciones = ({ m }: { m: IMedico }) => (
        <div className="d-inline-flex flex-wrap gap-2">
            <BotonAccion tipo="ver" onClick={() => setIdVista(m.id)}>Ver horario</BotonAccion>
            <BotonAccion tipo="editar" to={`/horarios/${m.id}`} />
            <BotonAccion tipo="ausencias" to={`/medicos/${m.id}/ausencias`} />
        </div>
    );

    return (
        <div className={formulario.pagina}>
            <Container fluid className={styles.contenedor}>
                <div className={styles.encabezado}>
                    <h3 className={styles.titulo}>
                        <ClockHistory size={30} />
                        Horario de atención
                    </h3>
                </div>

                <Tabs defaultActiveKey="medicos" mountOnEnter className={pestanas.pestanas}>
                    {/* Se carga por médico: días, horarios y en qué consultorio atiende cada franja */}
                    <Tab eventKey="medicos" title={<><PersonBadge size={16} /> Por médico</>}>
                        <Form.Control
                            type="search"
                            className={styles.buscador}
                            placeholder="Buscar por médico o especialidad"
                            aria-label="Buscar médico"
                            value={busqueda}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
                        />

                        {error && <Alert variant="danger">No pudimos cargar los médicos.</Alert>}

                        {filtrados.length === 0 ? (
                            <Alert variant="light" className="text-center">
                                {lista.length === 0 ? 'Todavía no hay médicos cargados.' : 'No se encontraron médicos que coincidan con la búsqueda.'}
                            </Alert>
                        ) : (
                            <>
                                {/* Escritorio: tabla */}
                                <Table responsive hover className={`d-none d-md-table align-middle ${styles.tabla}`}>
                                    <thead>
                                        <tr>
                                            <th>Médico</th>
                                            <th>Especialidad</th>
                                            <th>Atiende</th>
                                            <th>Turno</th>
                                            <th className="text-end">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrados.map((m) => (
                                            <tr key={m.id}>
                                                <td className="fw-semibold">{m.apellido}, {m.nombre}</td>
                                                <td>{m.especialidad?.nombre ?? 'Sin especialidad'}</td>
                                                <td>{horarioDe(m)}</td>
                                                <td className="text-nowrap">{m.horarioAtencion?.duracionTurno ?? 20} min</td>
                                                <td className="text-end"><Acciones m={m} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                {/* Celular: tarjetas */}
                                <div className="d-md-none d-grid gap-3">
                                    {filtrados.map((m) => (
                                        <div key={m.id} className={styles.tarjeta}>
                                            <div className={styles.tarjetaTitulo}>
                                                <strong>{m.apellido}, {m.nombre}</strong>
                                                <span className="small text-muted">{m.horarioAtencion?.duracionTurno ?? 20} min</span>
                                            </div>
                                            <div className={styles.dato}>{m.especialidad?.nombre ?? 'Sin especialidad'}</div>
                                            <div className="mb-3">{horarioDe(m)}</div>
                                            <Acciones m={m} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Tab>

                    {/* Solo para mirar: quién atiende en cada consultorio y cuándo */}
                    <Tab eventKey="consultorios" title={<><Building size={16} /> Por consultorio</>}>
                        <AgendaConsultorios />
                    </Tab>
                </Tabs>

                <VerHorarioMedico medico={medicoVisto} onCerrar={() => setIdVista(null)} />
            </Container>
        </div>
    );
};

export default HorariosList;