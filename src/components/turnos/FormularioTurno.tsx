import CampoFecha from '../utils/CampoFecha';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import type { IEspecialidad } from '../../types/Especialidad.types';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { claveLocal, etiquetaDia, formatearTurno, sumarDias } from '../utils/fecha';
import styles from '../utils/Formulario.module.scss';
import {
    CrearTurnoSchema,
    type ICrearTurnoDTO,
    type ICrearTurnoValidado,
    type IDisponibilidad,
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

    // Cada paso depende del anterior: al cambiar uno, los siguientes se limpian
    const limpiar = (...campos: CampoTexto[]) => campos.forEach((campo) => setValue(campo, ''));

    // 1) Consultorios activos
    const { data: consultorios, isLoading: cargandoConsultorios } = useFetch<IConsultorio[]>('/consultorios?activo=true');

    // 2) Médicos activos. Turno normal: los que atienden en el consultorio elegido.
    //    Urgencia: todos los de la especialidad elegida, atiendan o no en ese consultorio.
    const endpointMedicos = urgencia
        ? especialidadId ? `/medicos?especialidad=${especialidadId}&activo=true` : null
        : consultorioId ? `/medicos?consultorio=${consultorioId}&activo=true` : null;
    const { data: medicos, isLoading: cargandoMedicos } = useFetch<IMedico[]>(endpointMedicos);

    // 3) Horarios libres del médico en ese consultorio y día (solo turno normal)
    const { data: disponibilidad, isLoading: cargandoHorarios } = useFetch<IDisponibilidad>(
        !urgencia && medicoId && consultorioId && fecha
            ? `/turnos/disponibilidad?medico=${medicoId}&consultorio=${consultorioId}&fecha=${fecha}`
            : null,
    );

    // ---- Lo que se ofrece en cada paso ----
    const consultorioElegido = (consultorios ?? []).find((c) => c.id === consultorioId);
    const listaMedicos = cargandoMedicos ? [] : medicos ?? [];

    // Turno normal: solo médicos que tienen horario cargado en este consultorio
    const medicosDelConsultorio = (consultorioId ? listaMedicos : []).filter((m) =>
        (m.horarioAtencion?.franjas ?? []).some((f) => f.consultorio === consultorioId),
    );

    // Turno normal: especialidades del consultorio que tienen al menos un médico atendiendo ahí.
    // Urgencia: todas las del consultorio.
    // Un consultorio marcado "atiende todas" no tiene lista propia: en turno normal salen las de los médicos
    // que atienden ahí; en urgencia, todas las especialidades.
    const todasEnConsultorio = consultorioElegido?.todasLasEspecialidades === true;
    const { data: todasLasEsp } = useFetch<IEspecialidad[]>(urgencia && todasEnConsultorio ? '/especialidades' : null);
    const especialidadesDeMedicos = [
        ...new Map(
            medicosDelConsultorio
                .filter((m) => m.especialidad)
                .map((m) => [String(m.especialidad.id), { id: m.especialidad.id, nombre: m.especialidad.nombre }]),
        ).values(),
    ];
    const especialidadesDelConsultorio: Pick<IEspecialidad, 'id' | 'nombre'>[] = todasEnConsultorio
        ? urgencia ? todasLasEsp ?? [] : especialidadesDeMedicos
        : consultorioElegido?.especialidades ?? [];
    const especialidadesDisponibles = urgencia
        ? especialidadesDelConsultorio
        : especialidadesDelConsultorio.filter((esp) =>
              medicosDelConsultorio.some((m) => String(m.especialidad?.id) === String(esp.id)),
          );

    const medicosElegibles = urgencia
        ? especialidadId ? listaMedicos : []
        : medicosDelConsultorio.filter((m) => String(m.especialidad?.id) === especialidadId);
    const medicoElegido = medicosElegibles.find((m) => m.id === medicoId);

    // Turno normal: días de la semana en que el médico atiende en este consultorio
    const diasQueAtiende = [
        ...new Set(
            (medicoElegido?.horarioAtencion?.franjas ?? [])
                .filter((f) => f.consultorio === consultorioId)
                .map((f) => f.diaSemana),
        ),
    ];
    const nombresDias = DIAS_SEMANA.filter((d) => diasQueAtiende.includes(d.valor)).map((d) => d.etiqueta.toLowerCase());
    const diaDeLaSemana = (clave: string) => new Date(`${clave}T12:00:00`).getDay();
    const diaElegidoAtiende = !fecha || diasQueAtiende.includes(diaDeLaSemana(fecha));

    // Próximos días en que atiende, para elegir con un toque
    const proximosDias = Array.from({ length: 21 }, (_, i) => sumarDias(hoy, i))
        .filter((dia) => diasQueAtiende.includes(diaDeLaSemana(dia)))
        .slice(0, 8);

    const horarios = disponibilidad?.horarios ?? [];

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
                                    ? 'Podés usar cualquier consultorio con la especialidad y cualquier médico de ella. El horario no tiene que estar en su agenda, pero no puede superponerse con otro turno del médico.'
                                    : 'Solo se ofrecen consultorios, médicos y horarios que existen en la agenda.'}
                            </span>
                        </div>
                        <div className={`form-check form-switch ${styles.interruptor}`}>
                            <input
                                id="urgencia"
                                type="checkbox"
                                role="switch"
                                className="form-check-input"
                                {...register('urgencia', {
                                    onChange: () => limpiar('consultorio', 'especialidad', 'medico', 'fecha', 'fechaTurno', 'fechaUrgencia'),
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

                    {/* 2. CONSULTORIO -> ESPECIALIDAD -> MÉDICO */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Atención</legend>
                        <p className={styles.ayuda}>
                            Elegí en este orden: cada opción se filtra según la anterior, así no se puede cargar una
                            combinación que no existe.
                        </p>

                        <div className={styles.grilla3}>
                            <div className={styles.campo}>
                                <label htmlFor="consultorio" className={styles.label}>1. Consultorio</label>
                                <select
                                    id="consultorio"
                                    className={styles.campoInput}
                                    aria-invalid={errors.consultorio ? true : undefined}
                                    {...register('consultorio', {
                                        onChange: () => limpiar('especialidad', 'medico', 'fecha', 'fechaTurno', 'fechaUrgencia'),
                                    })}
                                >
                                    <option value="">Seleccioná...</option>
                                    {(consultorios ?? []).map((c) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                                {errors.consultorio && (
                                    <span className={styles.textError} role="alert">{errors.consultorio.message}</span>
                                )}
                            </div>

                            <div className={styles.campo}>
                                <label htmlFor="especialidad" className={styles.label}>2. Especialidad</label>
                                <select
                                    id="especialidad"
                                    className={styles.campoInput}
                                    disabled={!consultorioId || (!urgencia && cargandoMedicos)}
                                    aria-invalid={errors.especialidad ? true : undefined}
                                    {...register('especialidad', {
                                        onChange: () => limpiar('medico', 'fecha', 'fechaTurno', 'fechaUrgencia'),
                                    })}
                                >
                                    <option value="">
                                        {!consultorioId
                                            ? 'Primero el consultorio'
                                            : !urgencia && cargandoMedicos ? 'Cargando...' : 'Seleccioná...'}
                                    </option>
                                    {especialidadesDisponibles.map((esp) => (
                                        <option key={esp.id} value={String(esp.id)}>{esp.nombre}</option>
                                    ))}
                                </select>
                                {errors.especialidad && (
                                    <span className={styles.textError} role="alert">{errors.especialidad.message}</span>
                                )}
                            </div>

                            <div className={styles.campo}>
                                <label htmlFor="medico" className={styles.label}>3. Médico</label>
                                <select
                                    id="medico"
                                    className={styles.campoInput}
                                    disabled={!especialidadId || cargandoMedicos}
                                    aria-invalid={errors.medico ? true : undefined}
                                    {...register('medico', { onChange: () => limpiar('fecha', 'fechaTurno', 'fechaUrgencia') })}
                                >
                                    <option value="">
                                        {!especialidadId ? 'Primero la especialidad' : cargandoMedicos ? 'Cargando...' : 'Seleccioná...'}
                                    </option>
                                    {medicosElegibles.map((m) => (
                                        <option key={m.id} value={m.id}>{m.apellido}, {m.nombre}</option>
                                    ))}
                                </select>
                                {errors.medico && (
                                    <span className={styles.textError} role="alert">{errors.medico.message}</span>
                                )}
                            </div>
                        </div>

                        {!urgencia && consultorioId && !cargandoMedicos && especialidadesDisponibles.length === 0 && (
                            <p className={`${styles.ayuda} ${styles.separado}`}>
                                Este consultorio todavía no tiene médicos con horario cargado. Cargalo desde "Horario de
                                atención".
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
                                    {medicoElegido.apellido}, {medicoElegido.nombre} atiende en este consultorio los{' '}
                                    {nombresDias.join(', ')}.
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
                                        El médico no atiende ese día en este consultorio. Atiende: {nombresDias.join(', ')}.
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
                                                No quedan horarios libres ese día. Probá con otra fecha.
                                            </p>
                                        ) : (
                                            <div className={styles.grupoOpciones} role="radiogroup" aria-label="Horarios libres">
                                                {horarios.map((h) => (
                                                    <label key={h.inicio} className={styles.chip}>
                                                        <input type="radio" value={h.inicio} {...register('fechaTurno')} />
                                                        <span>{h.hora}</span>
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
                                    {busqueda.paciente.apellido}, {busqueda.paciente.nombre} · {consultorioElegido?.nombre} · Dr/a.{' '}
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