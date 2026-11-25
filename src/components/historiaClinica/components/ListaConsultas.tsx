import formulario from '../../utils/Formulario.module.scss';
import styles from '../HistoriaClinica.module.scss';
import type { IConsulta } from '../../../types/HistoriaClinica.types';

const formatoFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
    });

const Bloque = ({ etiqueta, texto }: { etiqueta: string; texto: string }) =>
    texto ? (
        <>
            <span className={styles.etiqueta}>{etiqueta}</span>
            <p className={styles.texto}>{texto}</p>
        </>
    ) : null;

// Las más nuevas primero (así las ordena el servidor). Solo lectura: las consultas no se editan.
const ListaConsultas = ({ consultas }: { consultas: IConsulta[] }) => (
    <fieldset className={formulario.seccion}>
        <legend className={formulario.seccionTitulo}>Consultas ({consultas.length})</legend>

        {consultas.length === 0 ? (
            <p className={styles.vacio}>Todavía no hay consultas registradas.</p>
        ) : (
            <div className="d-grid gap-3">
                {consultas.map((c) => (
                    <article key={c.id} className={styles.consulta}>
                        <div className={styles.cabecera}>
                            <span className={styles.fecha}>{formatoFecha(c.fecha)}</span>
                            <span className={styles.medico}>
                                {c.medico
                                    ? `${c.medico.apellido}, ${c.medico.nombre}${c.medico.matricula ? ` · Mat. ${c.medico.matricula}` : ''}`
                                    : 'Médico no disponible'}
                            </span>
                        </div>
                        <Bloque etiqueta="Motivo de consulta" texto={c.motivoConsulta} />
                        {c.sintomas.length > 0 && (
                            <>
                                <span className={styles.etiqueta}>Síntomas</span>
                                <div>
                                    {c.sintomas.map((s, i) => (
                                        <span key={`${s}-${i}`} className={styles.chip}>{s}</span>
                                    ))}
                                </div>
                            </>
                        )}
                        <Bloque etiqueta="Diagnóstico" texto={c.diagnostico} />
                        <Bloque etiqueta="Tratamiento" texto={c.tratamiento} />
                        <Bloque etiqueta="Observaciones" texto={c.observaciones} />
                    </article>
                ))}
            </div>
        )}
    </fieldset>
);

export default ListaConsultas;