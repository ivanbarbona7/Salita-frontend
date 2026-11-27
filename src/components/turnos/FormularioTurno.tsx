import CampoFecha from '../utils/CampoFecha';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { claveLocal, etiquetaDia, formatearTurno, sumarDias } from '../utils/fecha';
import styles from '../utils/Formulario.module.scss';
import {
    CrearTurnoSchema,
    type ICrearTurnoDTO,
    type ICrearTurnoValidado,
} from '../../types/Turno.Types';
import { DIAS_SEMANA } from '../../types/Horario.types';
import type { IConsultorio } from '../../types/Consultorio.types';
import type { IMedico } from '../../types/Medico.types';
import type { IPacienteLista, IPaginado } from '../../types/Paciente.type';

type BusquedaPaciente =
    | { estado: 'inicial' }
    | { estado: 'buscando' }
    | { estado: 'encontrado'; paciente: IPacienteLista }
    | { estado: 'error'; mensaje: string };

// Horarios libres de un médico en un día, de todos sus consultorios (GET /turnos/horarios-medico)
interface IHorarioMedico {
    inicio: string; // ISO en UTC: se envía tal cual al crear el turno
    hora: string;   // "08:20", en hora argentina
    consultorio: { id: string; nombre: string };
}
interface IDisponibilidadMedico {
    duracionTurno: number;
    horarios: IHorarioMedico[];
}

type CampoTexto = 'consultorio' | 'especialidad' | 'medico' | 'fecha' | 'fechaTurno' | 'fechaUrgencia';

const FormularioTurno = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dniRef = useRef<HTMLInputElement>(null);
    const [busqueda, setBusqueda] = useState<BusquedaPaciente>({ estado: 'inicial' });
    const hoy = claveLocal(new Date());

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ICrearTurnoDTO, unknown, ICrearTurnoValidado>({
        resolver: zodResolver(CrearTurnoSchema),
        defaultValues: {
            paciente: '',
            consultorio: '',
            especialidad: '',
            medico: '',
            fecha: '',
            fechaTurno: '',
            urgencia: false,
            fechaUrgencia: '',
            observaciones: '',
        },
    });

    const urgencia = watch('urgencia');
    const consultorioId = watch('consultorio');
    const especialidadId = watch('especialidad');
    const medicoId = watch('medico');
    const fecha = watch('fecha');
    const fechaTurno = watch('fechaTurno');

    // Turno normal: el consultorio es solo un filtro opcional (para quien sabe dónde atiende el médico).
    // Si no se elige, el consultorio lo define el horario que se elija.
    const [filtroConsultorio, setFiltroConsultorio] = useState('');

    // Cada paso depende del anterior: al cambiar uno, los siguientes se limpian
    const limpiar = (...campos: CampoTexto[]) => campos.forEach((campo) => setValue(campo, ''));

    // Consultorios activos
    const { data: consultorios, isLoading: cargandoConsultorios } = useFetch<IConsultorio[]>('/consultorios?activo=true');

    // Médicos activos. De acá salen las especialidades y los médicos de cada una.
    const { data: todosLosMedicos, isLoading: cargandoMedicos } = useFetch<IMedico[]>('/medicos?activo=true');

    // Horarios libres del médico en ese día, de todos sus consultorios (solo turno normal)
    const { data: disponibilidad, isLoading: cargandoHorarios } = useFetch<IDisponibilidadMedico>(
        !urgencia && medicoId && fecha ? `/turnos/horarios-medico?medico=${medicoId}&fecha=${fecha}` : null,
    );

    // ---- Lo que se ofrece en cada paso ----
    const nombreConsultorio = new Map((consultorios ?? []).map((c) => [c.id, c.nombre]));
    const franjasDe = (m: IMedico) =>
        (m.horarioAtencion?.franjas ?? []).filter((f) => nombreConsultorio.has(f.consultorio));

    // Turno normal: solo médicos con horario cargado en algún consultorio activo. Urgencia: todos.
    const medicosDisponibles = (todosLosMedicos ?? []).filter((m) => urgencia || franjasDe(m).length > 0);

    const especialidadesDisponibles = [
        ...new Map(
            medicosDisponibles
                .filter((m) => m.especialidad)
                .map((m) => [String(m.especialidad.id), { id: String(m.especialidad.id), nombre: m.especialidad.nombre }]),
        ).values(),
    ].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const medicosElegibles = medicosDisponibles
        .filter((m) => String(m.especialidad?.id) === especialidadId)
        .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'));
    const medicoElegido = medicosElegibles.find((m) => m.id === medicoId);

    // Turno normal: consultorios donde atiende el médico elegido (para el filtro opcional)
    const consultoriosDelMedico = medicoElegido
        ? [...new Set(franjasDe(medicoElegido).map((f) => f.consultorio))]
              .map((id) => ({ id, nombre: nombreConsultorio.get(id) ?? '' }))
              .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        : [];
    const variosConsultorios = consultoriosDelMedico.length > 1;

    // Urgencia: cualquier consultorio que atienda la especialidad elegida
    const consultoriosUrgencia = (consultorios ?? []).filter(
        (c) =>
            c.todasLasEspecialidades === true ||
            (c.especialidades ?? []).some((esp) => String(esp.id) === especialidadId),
    );

    // Turno normal: días de la semana en que el médico atiende (en el consultorio filtrado, si se eligió uno)
    const franjasConsiderar = medicoElegido
        ? franjasDe(medicoElegido).filter((f) => !filtroConsultorio || f.consultorio === filtroConsultorio)
        : [];
    const diasQueAtiende = [...new Set(franjasConsiderar.map((f) => f.diaSemana))];
    const nombresDias = DIAS_SEMANA.filter((d) => diasQueAtiende.includes(d.valor)).map((d) => d.etiqueta.toLowerCase());
    const diaDeLaSemana = (clave: string) => new Date(`${clave}T12:00:00`).getDay();
    const diaElegidoAtiende = !fecha || diasQueAtiende.includes(diaDeLaSemana(fecha));

    // Próximos días en que atiende, para elegir con un toque
    const proximosDias = Array.from({ length: 21 }, (_, i) => sumarDias(hoy, i))
        .filter((dia) => diasQueAtiende.includes(diaDeLaSemana(dia)))
        .slice(0, 8);

    // Si se filtró por consultorio, solo sus horarios
    const horarios = (disponibilidad?.horarios ?? []).filter(
        (h) => !filtroConsultorio || h.consultorio.id === filtroConsultorio,
    );
    const horarioElegido = horarios.find((h) => h.inicio === fechaTurno);
    // Turno normal: el consultorio sale del horario elegido. Urgencia: el que se eligió en la lista.
    const consultorioResumen = urgencia ? nombreConsultorio.get(consultorioId) : horarioElegido?.consultorio.nombre;

    // ---- Búsqueda del paciente por DNI ----
    const buscarPaciente = async () => {
        const dni = dniRef.current?.value.trim() ?? '';
        setValue('paciente', '');

        if (!/^\d{7,8}$/.test(dni)) {
            setBusqueda({ estado: 'error', mensaje: 'El DNI debe tener 7 u 8 números, sin puntos' });
            return;
        }

        setBusqueda({ estado: 'buscando' });
        try {
            const { data } = await clientesAxios.get<{ data: IPaginado<IPacienteLista> }>('/Pacientes', {
                params: { dni },
            });
            const paciente = data.data.items[0];
            if (!paciente) {
                setBusqueda({ estado: 'error', mensaje: 'No existe un paciente registrado con ese DNI' });
                return;
            }
            setValue('paciente', paciente.id, { shouldValidate: true });
            setBusqueda({ estado: 'encontrado', paciente });
        } catch (error: unknown) {
            setBusqueda({ estado: 'error', mensaje: obtenerMensajeError(error) });
        }
    };

    // Urgencia: pone la fecha y hora actuales
    const ponerAhora = () => {
        const ahora = new Date();
        ahora.setSeconds(0, 0);
        const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setValue('fechaUrgencia', local);
        setValue('fechaTurno', ahora.toISOString(), { shouldValidate: true });
    };

    const onSubmit = async (datos: ICrearTurnoValidado) => {
        const { paciente, consultorio, especialidad, medico, fechaTurno: inicio, observaciones, urgencia: esUrgente } = datos;
        try {
            await clientesAxios.post(esUrgente ? '/turnos?urgencia=true' : '/turnos', {
                paciente,
                consultorio,
                especialidad,
                medico,
                fechaTurno: inicio,
                observaciones,
            });
            toast.success(esUrgente ? 'Urgencia registrada correctamente' : 'Turno guardado correctamente');
            navigate('/recepcion');
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    // La edición de turnos todavía no está disponible (el botón del dashboard apunta a /turnos/:id)
    if (id !== undefined) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="info">
                        Por ahora los turnos no se pueden modificar. Si hay que cambiarlo, eliminá este turno y creá uno nuevo.
                    </Alert>
                    <Link to="/recepcion" className={`btn ${styles.botonSecundario}`}>
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    if (cargandoConsultorios) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
                    <Placeholder as="h3" animation="glow" className="text-center">
                        <Placeholder xs={6} />
                    </Placeholder>
                    {Array.from({ length: 3 }, (_, i) => (
                        <Placeholder key={i} as="div" animation="glow" className="mb-3">
                            <Placeholder xs={12} style={{ height: '7rem', borderRadius: 12 }} />
                        </Placeholder>
                    ))}
                </div>
            </div>
        );
    }

    const observacionesEscritas = (watch('observaciones') ?? '').length;

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h3 className={styles.titulo}>{urgencia ? 'Nueva urgencia' : 'Nuevo turno'}</h3>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* TIPO: turno normal o urgencia */}
                    <div className={urgencia ? `${styles.estado} ${styles.estadoUrgente}` : styles.estado}>
                        <div className={styles.estadoTexto}>
                            <strong>{urgencia ? 'Urgencia (ingreso por guardia)' : 'Turno programado'}</strong>
                            <span>
                                {urgencia
                                    ? 'Podés elegir cualquier médico de la especialidad y cualquier consultorio que la atienda. El horario no tiene que estar en su agenda, pero no puede superponerse con otro turno del médico.'
                                    : 'Solo se ofrecen médicos y horarios que existen en la agenda. El consultorio lo define el horario elegido.'}
                            </span>
                        </div>
                        <div className={`form-check form-switch ${styles.interruptor}`}>
                            <input
                                id="urgencia"
                                type="checkbox"
                                role="switch"
                                className="form-check-input"
                                {...register('urgencia', {
                                    onChange: () => {
                                        limpiar('consultorio', 'especialidad', 'medico', 'fecha', 'fechaTurno', 'fechaUrgencia');
                                        setFiltroConsultorio('');
                                    },
                                })}
                            />
                            <label htmlFor="urgencia" className="form-check-label">
                                Es una urgencia
                            </label>
                        </div>
                    </div>

                    {/* 1. PACIENTE */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Paciente</legend>
                        <div className={styles.campo}>
                            <label htmlFor="dni-paciente" className={styles.label}>
                                DNI del paciente
                            </label>
                            <div className="d-flex gap-2">
                                <input
                                    id="dni-paciente"
                                    ref={dniRef}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    placeholder="Ej: 12345678"
                                    className={styles.campoInput}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            void buscarPaciente();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    className={styles.botonSecundario}
                                    onClick={() => void buscarPaciente()}
                                    disabled={busqueda.estado === 'buscando'}
                                >
                                    {busqueda.estado === 'buscando' ? 'Buscando...' : 'Buscar'}
                                </Button>
                            </div>
                            {busqueda.estado === 'error' && (
                                <span className={styles.textError} role="alert">{busqueda.mensaje}</span>
                            )}
                            {errors.paciente && busqueda.estado !== 'error' && (
                                <span className={styles.textError} role="alert">{errors.paciente.message}</span>
                            )}
                        </div>

                        {busqueda.estado === 'encontrado' && (
                            <div className={`${styles.estado} ${styles.separado}`}>
                                <div className={styles.estadoTexto}>
                                    <strong>
                                        {busqueda.paciente.apellido}, {busqueda.paciente.nombre}
                                    </strong>
                                    <span>DNI {busqueda.paciente.dni}</span>
                                </div>
                            </div>
                        )}
                    </fieldset>

                    {/* 2. ESPECIALIDAD -> MÉDICO -> CONSULTORIO */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Atención</legend>
                        <p className={styles.ayuda}>
                            {urgencia
                                ? 'Elegí la especialidad, el médico y el consultorio donde se atiende.'
                                : 'Elegí la especialidad y el médico. El consultorio es opcional: si no lo sabés, se define con el horario que elijas.'}
                        </p>

                        <div className={styles.grilla3}>
                            <div className={styles.campo}>
                                <label htmlFor="especialidad" className={styles.label}>1. Especialidad</label>
                                <select
                                    id="especialidad"
                                    className={styles.campoInput}
                                    disabled={cargandoMedicos}
                                    aria-invalid={errors.especialidad ? true : undefined}
                                    {...register('especialidad', {
                                        onChange: () => {
                                            limpiar('medico', 'consultorio', 'fecha', 'fechaTurno', 'fechaUrgencia');
                                            setFiltroConsultorio('');
                                        },
                                    })}
                                >
                                    <option value="">{cargandoMedicos ? 'Cargando...' : 'Seleccioná...'}</option>
                                    {especialidadesDisponibles.map((esp) => (
                                        <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                                    ))}
                                </select>
                                {errors.especialidad && (
                                    <span className={styles.textError} role="alert">{errors.especialidad.message}</span>
                                )}
                            </div>

                            <div className={styles.campo}>
                                <label htmlFor="medico" className={styles.label}>2. Médico</label>
                                <select
                                    id="medico"
                                    className={styles.campoInput}
                                    disabled={!especialidadId}
                                    aria-invalid={errors.medico ? true : undefined}
                                    {...register('medico', {
                                        onChange: () => {
                                            limpiar('consultorio', 'fecha', 'fechaTurno', 'fechaUrgencia');
                                            setFiltroConsultorio('');
                                        },
                                    })}
                                >
                                    <option value="">{!especialidadId ? 'Primero la especialidad' : 'Seleccioná...'}</option>
                                    {medicosElegibles.map((m) => (
                                        <option key={m.id} value={m.id}>{m.apellido}, {m.nombre}</option>
                                    ))}
                                </select>
                                {errors.medico && (
                                    <span className={styles.textError} role="alert">{errors.medico.message}</span>
                                )}
                            </div>

                            {urgencia ? (
                                <div className={styles.campo}>
                                    <label htmlFor="consultorio" className={styles.label}>3. Consultorio</label>
                                    <select
                                        id="consultorio"
                                        className={styles.campoInput}
                                        disabled={!medicoId}
                                        aria-invalid={errors.consultorio ? true : undefined}
                                        {...register('consultorio')}
                                    >
                                        <option value="">{!medicoId ? 'Primero el médico' : 'Seleccioná...'}</option>
                                        {consultoriosUrgencia.map((c) => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                    {errors.consultorio && (
                                        <span className={styles.textError} role="alert">{errors.consultorio.message}</span>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.campo}>
                                    <label htmlFor="filtro-consultorio" className={styles.label}>3. Consultorio (opcional)</label>
                                    <select
                                        id="filtro-consultorio"
                                        className={styles.campoInput}
                                        disabled={!medicoId}
                                        value={filtroConsultorio}
                                        onChange={(e) => {
                                            setFiltroConsultorio(e.target.value);
                                            limpiar('fecha', 'fechaTurno');
                                        }}
                                    >
                                        <option value="">
                                            {!medicoId ? 'Primero el médico' : variosConsultorios ? 'Cualquiera' : 'Se define con el horario'}
                                        </option>
                                        {variosConsultorios &&
                                            consultoriosDelMedico.map((c) => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {!urgencia && !cargandoMedicos && especialidadesDisponibles.length === 0 && (
                            <p className={`${styles.ayuda} ${styles.separado}`}>
                                Todavía no hay médicos con horario cargado. Cargalo desde "Horario de atención".
                            </p>
                        )}
                    </fieldset>

                    {/* 3. DÍA Y HORARIO */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Día y horario</legend>

                        {!medicoElegido ? (
                            <p className={styles.ayuda}>
                                {urgencia
                                    ? 'Elegí primero el médico para indicar la fecha y hora.'
                                    : 'Elegí primero el médico para ver los días y horarios en que atiende.'}
                            </p>
                        ) : urgencia ? (
                            /* Urgencia: la fecha y hora se escriben a mano */
                            <div className={styles.campo} style={{ maxWidth: 360 }}>
                                <label htmlFor="fechaUrgencia" className={styles.label}>Fecha y hora de la urgencia</label>
                                <div className="d-flex gap-2">
                                    <input
                                        id="fechaUrgencia"
                                        type="datetime-local"
                                        className={styles.campoInput}
                                        aria-invalid={errors.fechaTurno ? true : undefined}
                                        {...register('fechaUrgencia', {
                                            onChange: (e: { target: { value: string } }) =>
                                                setValue(
                                                    'fechaTurno',
                                                    e.target.value ? new Date(e.target.value).toISOString() : '',
                                                    { shouldValidate: true },
                                                ),
                                        })}
                                    />
                                    <Button type="button" className={styles.botonChico} onClick={ponerAhora}>
                                        Ahora
                                    </Button>
                                </div>
                                {errors.fechaTurno && (
                                    <span className={styles.textError} role="alert">{errors.fechaTurno.message}</span>
                                )}
                            </div>
                        ) : (
                            <>
                                <p className={styles.ayuda}>
                                    {medicoElegido.apellido}, {medicoElegido.nombre} atiende los {nombresDias.join(', ')}
                                    {filtroConsultorio ? ` en ${nombreConsultorio.get(filtroConsultorio) ?? 'ese consultorio'}` : ''}.
                                </p>

                                <div className={styles.grupoOpciones} aria-label="Próximos días disponibles">
                                    {proximosDias.map((dia) => (
                                        <Button
                                            key={dia}
                                            type="button"
                                            className={styles.botonChico}
                                            onClick={() => {
                                                setValue('fecha', dia, { shouldValidate: true });
                                                limpiar('fechaTurno');
                                            }}
                                        >
                                            {etiquetaDia(dia)}
                                        </Button>
                                    ))}
                                </div>

                                <div className={`${styles.campo} ${styles.separado}`} style={{ maxWidth: 260 }}>
                                    <label htmlFor="fecha" className={styles.label}>O elegí otra fecha</label>
                                    <CampoFecha
                                        id="fecha"
                                        min={hoy}
                                        className={styles.campoInput}
                                        valor={fecha ?? ''}
                                        onChange={(dia) => {
                                            setValue('fecha', dia, { shouldValidate: true });
                                            limpiar('fechaTurno');
                                        }}
                                    />
                                </div>

                                {fecha && !diaElegidoAtiende && (
                                    <Alert variant="warning" className={styles.separado}>
                                        El médico no atiende ese día{filtroConsultorio ? ' en ese consultorio' : ''}. Atiende: {nombresDias.join(', ')}.
                                    </Alert>
                                )}

                                {fecha && diaElegidoAtiende && (
                                    <div className={`${styles.campo} ${styles.separado}`}>
                                        <span className={styles.label}>Horarios libres</span>
                                        {cargandoHorarios ? (
                                            <Placeholder animation="glow">
                                                <Placeholder xs={8} size="lg" />
                                            </Placeholder>
                                        ) : horarios.length === 0 ? (
                                            <p className={styles.ayuda}>
                                                No quedan horarios libres ese día{filtroConsultorio ? ' en ese consultorio' : ''}. Probá con otra fecha.
                                            </p>
                                        ) : (
                                            <div className={styles.grupoOpciones} role="radiogroup" aria-label="Horarios libres">
                                                {horarios.map((h) => (
                                                    <label key={h.inicio} className={styles.chip}>
                                                        <input
                                                            type="radio"
                                                            value={h.inicio}
                                                            {...register('fechaTurno', {
                                                                // El consultorio del turno es el del horario elegido
                                                                onChange: () => setValue('consultorio', h.consultorio.id, { shouldValidate: true }),
                                                            })}
                                                        />
                                                        <span>
                                                            {h.hora}
                                                            {variosConsultorios && <small> · {h.consultorio.nombre}</small>}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {errors.fechaTurno && (
                                    <span className={styles.textError} role="alert">{errors.fechaTurno.message}</span>
                                )}
                            </>
                        )}
                    </fieldset>

                    {/* 4. OBSERVACIONES */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Observaciones</legend>
                        <div className={styles.campo}>
                            <label htmlFor="observaciones" className={styles.label}>Opcional</label>
                            <textarea
                                id="observaciones"
                                rows={3}
                                maxLength={500}
                                className={styles.campoInput}
                                placeholder="Observaciones opcionales..."
                                aria-invalid={errors.observaciones ? true : undefined}
                                {...register('observaciones')}
                            />
                            <small className="text-muted text-end">{observacionesEscritas}/500</small>
                            {errors.observaciones && (
                                <span className={styles.textError} role="alert">{errors.observaciones.message}</span>
                            )}
                        </div>
                    </fieldset>

                    {/* RESUMEN */}
                    {fechaTurno && busqueda.estado === 'encontrado' && medicoElegido && (
                        <div className={styles.estado}>
                            <div className={styles.estadoTexto}>
                                <strong>{urgencia ? 'Resumen de la urgencia' : 'Resumen del turno'}</strong>
                                <span>
                                    {busqueda.paciente.apellido}, {busqueda.paciente.nombre} · {consultorioResumen ?? 'Consultorio'} · Dr/a.{' '}
                                    {medicoElegido.apellido} · {formatearTurno(fechaTurno)} hs
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={styles.acciones}>
                        <Link to="/recepcion" className={`btn ${styles.botonSecundario}`}>
                            Cancelar
                        </Link>
                        <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : urgencia ? 'Registrar urgencia' : 'Guardar turno'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioTurno;