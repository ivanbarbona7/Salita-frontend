import { Link } from 'react-router-dom';
import { Accordion, Alert, Badge } from 'react-bootstrap';
import { useFetch } from '../../../hooks/useFetch';
import ListSkeleton from '../../utils/ListSkeleton';
import styles from './AgendaConsultorios.module.scss';
import { DIAS_SEMANA, type IAgendaConsultorio } from '../../../types/Horario.types';

// "Lun a Vie · 08:00–12:00": resumen corto para el encabezado de cada consultorio
const resumenAbre = (franjas: { diaSemana: number; desde: string; hasta: string }[]): string => {
    if (franjas.length === 0) return 'Sin horario de apertura';

    const presentes = DIAS_SEMANA.filter((d) => franjas.some((f) => f.diaSemana === d.valor));
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
    const horas = rangos.size === 1 ? Array.from(rangos)[0] ?? '' : 'horarios variados';
    return `Abre ${dias} · ${horas}`;
};

// Vista por consultorio: qué médico atiende cada día y a qué hora.
// Es solo para mirar: los horarios se cargan por médico (cada uno con su consultorio).
const AgendaConsultorios = () => {
    const { data: agenda, isLoading, error } = useFetch<IAgendaConsultorio[]>('/consultorios/agenda');

    if (isLoading) return <ListSkeleton rows={3} />;
    if (error) return <Alert variant="danger">No pudimos cargar la agenda de los consultorios.</Alert>;
    if (!agenda || agenda.length === 0) {
        return <Alert variant="light" className="text-center">Todavía no hay consultorios cargados.</Alert>;
    }

    return (
        // Cada consultorio es un acordeón: cerrado muestra solo el resumen; el primero arranca abierto
        <Accordion alwaysOpen defaultActiveKey={agenda[0]?.id} className={styles.acordeon}>
            {agenda.map((consultorio) => {
                const medicos = new Set(consultorio.franjas.map((f) => f.medico.id)).size;

                return (
                    <Accordion.Item key={consultorio.id} eventKey={consultorio.id}>
                        <Accordion.Header>
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 w-100 me-2">
                                <div className={styles.cabecera}>
                                    <span className={styles.nombre}>{consultorio.nombre}</span>
                                    <span className={styles.resumen}>{resumenAbre(consultorio.horarioConsultorio)}</span>
                                </div>
                                <Badge bg={medicos > 0 ? 'info' : 'secondary'}>
                                    {medicos === 0 ? 'Sin médicos' : `${medicos} ${medicos === 1 ? 'médico' : 'médicos'}`}
                                </Badge>
                            </div>
                        </Accordion.Header>

                        <Accordion.Body>
                            {consultorio.franjas.length === 0 ? (
                                <p className={styles.vacio}>Ningún médico tiene horarios cargados en este consultorio.</p>
                            ) : (
                                DIAS_SEMANA.map((dia) => {
                                    const delDia = consultorio.franjas
                                        .filter((f) => f.diaSemana === dia.valor)
                                        .sort((a, b) => a.desde.localeCompare(b.desde));
                                    if (delDia.length === 0) return null;
                                    return (
                                        <div key={dia.valor} className={styles.dia}>
                                            <span className={styles.diaNombre}>{dia.corto}</span>
                                            <div className={styles.franjas}>
                                                {delDia.map((f) => (
                                                    <Link
                                                        key={`${f.medico.id}-${f.desde}`}
                                                        to={`/horarios/${f.medico.id}`}
                                                        className={styles.franja}
                                                        title="Editar el horario de este médico"
                                                    >
                                                        <span className={styles.hora}>{f.desde}–{f.hasta}</span>
                                                        <span>{f.medico.apellido}, {f.medico.nombre}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                );
            })}
        </Accordion>
    );
};

export default AgendaConsultorios;