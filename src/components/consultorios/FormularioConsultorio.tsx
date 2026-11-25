import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import CampoFormulario from '../utils/CampoFormulario';
import EditorFranjas from '../utils/EditorFranjas';
import styles from '../utils/Formulario.module.scss';
import {
    crearConsultorioSchema,
    type IConsultorio,
    type ICrearConsultorioDTO,
    type ICrearConsultorioInput,
} from '../../types/Consultorio.types';
import { DIAS_LABORALES } from '../../types/Horario.types';
import { TipoTelefono, type IMedico } from '../../types/Medico.types';
import type { IEspecialidad } from '../../types/Especialidad.types';

// El backend devuelve objetos anidados; el formulario trabaja con IDs
const aValoresFormulario = (consultorio: IConsultorio): ICrearConsultorioInput => ({
    nombre: consultorio.nombre,
    especialidades: consultorio.especialidades.map((esp) => String(esp.id)),
    todasLasEspecialidades: consultorio.todasLasEspecialidades === true,
    profesionalResponsable: consultorio.profesionalResponsable?.id ?? '',
    direccion: {
        calle: consultorio.direccion.calle,
        numero: consultorio.direccion.numero,
        piso: consultorio.direccion.piso ?? '',
        departamento: consultorio.direccion.departamento ?? '',
        barrio: consultorio.direccion.barrio ?? '',
    },
    ciudad: consultorio.ciudad ?? '',
    telefono: consultorio.telefono,
    correoElectronico: consultorio.correoElectronico,
    horarioAtencion: { franjas: consultorio.horarioAtencion?.franjas ?? [] },
    activo: consultorio.activo !== false,
});

const FormularioConsultorio = () => {
    const { id } = useParams<{ id: string }>();
    const esEdicion = id !== undefined;
    const navigate = useNavigate();

    // null = no pedir nada (modo crear)
    const {
        data: consultorio,
        isLoading: cargandoConsultorio,
        error: errorConsultorio,
    } = useFetch<IConsultorio>(esEdicion ? `/consultorios/${id}` : null);
    const { data: especialidades, isLoading: cargandoEspecialidades } = useFetch<IEspecialidad[]>('/especialidades');
    const { data: medicos, isLoading: cargandoMedicos } = useFetch<IMedico[]>('/medicos?activo=true');

    const {
        register,
        control,
        handleSubmit,
        getValues,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ICrearConsultorioInput, unknown, ICrearConsultorioDTO>({
        resolver: zodResolver(crearConsultorioSchema),
        defaultValues: {
            especialidades: [],
            todasLasEspecialidades: false,
            activo: true,
            telefono: { tipo: TipoTelefono.CELULAR },
            horarioAtencion: { franjas: [] },
        },
        values: consultorio ? aValoresFormulario(consultorio) : undefined,
    });

    // Todas las franjas viven en un solo arreglo; el editor las agrupa por día
    const { fields, append, remove, replace } = useFieldArray({ control, name: 'horarioAtencion.franjas' });

    // Copia las franjas de un día a lunes–viernes (reemplaza lo que hubiera en esos días)
    const copiarALaborales = (dia: number) => {
        const actuales = getValues('horarioAtencion.franjas');
        const base = actuales.filter((f) => f.diaSemana === dia);
        const resto = actuales.filter((f) => !DIAS_LABORALES.includes(f.diaSemana));
        replace([...resto, ...DIAS_LABORALES.flatMap((d) => base.map((f) => ({ ...f, diaSemana: d })))]);
    };

    const onSubmit = async (datos: ICrearConsultorioDTO) => {
        try {
            if (esEdicion) {
                await clientesAxios.put(`/consultorios/${id}`, datos);
                toast.success('Consultorio actualizado correctamente');
            } else {
                await clientesAxios.post('/consultorios', datos);
                toast.success('Consultorio creado correctamente');
            }
            navigate('/consultorios');
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    // Se espera a tener todas las listas antes de dibujar el formulario: si un select se arma sin opciones,
    // no puede mostrar el valor que ya tiene el consultorio.
    if (cargandoConsultorio || cargandoEspecialidades || cargandoMedicos) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
                    <Placeholder as="h3" animation="glow" className="text-center">
                        <Placeholder xs={6} />
                    </Placeholder>
                    {Array.from({ length: 4 }, (_, i) => (
                        <Placeholder key={i} as="div" animation="glow" className="mb-3">
                            <Placeholder xs={12} style={{ height: '7rem', borderRadius: 12 }} />
                        </Placeholder>
                    ))}
                </div>
            </div>
        );
    }

    if (esEdicion && (errorConsultorio || !consultorio)) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="danger">No encontramos el consultorio que querés editar.</Alert>
                    <Link to="/consultorios" className={`btn ${styles.botonSecundario}`}>
                        Volver a consultorios
                    </Link>
                </div>
            </div>
        );
    }

    // Solo médicos activos. Si el responsable actual fue desactivado, se mantiene en la lista para no perderlo al editar.
    const activos = medicos ?? [];
    const responsableActual = consultorio?.profesionalResponsable;
    const opcionesResponsable =
        responsableActual && !activos.some((m) => m.id === responsableActual.id)
            ? [...activos, responsableActual]
            : activos;

    const estaActivo = watch('activo');
    const todasLasEspecialidades = watch('todasLasEspecialidades');
    const errorHorario =
        errors.horarioAtencion?.franjas?.root?.message ?? errors.horarioAtencion?.franjas?.message;

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h3 className={styles.titulo}>{esEdicion ? 'Modificar consultorio' : 'Nuevo consultorio'}</h3>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* ESTADO: solo al editar, para desactivar o volver a activar */}
                    {esEdicion && (
                        <div className={estaActivo ? styles.estado : `${styles.estado} ${styles.estadoInactivo}`}>
                            <div className={styles.estadoTexto}>
                                <strong>Estado del consultorio: {estaActivo ? 'Activo' : 'Inactivo'}</strong>
                                <span>
                                    {estaActivo
                                        ? 'Está habilitado para atender.'
                                        : 'No está habilitado. Activalo para volver a usarlo.'}
                                </span>
                            </div>
                            <div className={`form-check form-switch ${styles.interruptor}`}>
                                <input
                                    id="consultorio-activo"
                                    type="checkbox"
                                    role="switch"
                                    className="form-check-input"
                                    {...register('activo')}
                                />
                                <label htmlFor="consultorio-activo" className="form-check-label">
                                    Consultorio activo
                                </label>
                            </div>
                        </div>
                    )}

                    {/* DATOS DEL CONSULTORIO */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Datos del consultorio</legend>
                        <div className={styles.grilla}>
                            <CampoFormulario
                                register={register}
                                errores={errors}
                                name="nombre"
                                etiqueta="Nombre"
                                placeholder="Ej: Consultorio 1"
                                autoComplete="off"
                            />
                            <div className={styles.campo}>
                                <label htmlFor="profesionalResponsable" className={styles.label}>
                                    Profesional responsable
                                </label>
                                <select
                                    id="profesionalResponsable"
                                    className={styles.campoInput}
                                    aria-invalid={errors.profesionalResponsable ? true : undefined}
                                    {...register('profesionalResponsable')}
                                >
                                    <option value="">Seleccioná un profesional...</option>
                                    {opcionesResponsable.map((medico) => (
                                        <option key={medico.id} value={medico.id}>
                                            {medico.apellido}, {medico.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.profesionalResponsable && (
                                    <span className={styles.textError} role="alert">
                                        {errors.profesionalResponsable.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={`${styles.campo} ${styles.separado}`}>
                            <span className={styles.label}>Especialidades</span>
                            <label className={styles.chip}>
                                <input
                                    type="checkbox"
                                    {...register('todasLasEspecialidades', {
                                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (e.target.checked) setValue('especialidades', []);
                                        },
                                    })}
                                />
                                <span>Atiende todas las especialidades</span>
                            </label>
                            <Controller
                                name="especialidades"
                                control={control}
                                render={({ field }) => {
                                    const seleccionadas = field.value ?? [];
                                    return (
                                        <div className={styles.grupoOpciones} role="group" aria-label="Especialidades">
                                            {(especialidades ?? []).map((esp) => {
                                                // El formulario trabaja con textos; el id de la especialidad puede ser numérico
                                                const valor = String(esp.id);
                                                return (
                                                    <label key={esp.id} className={styles.chip}>
                                                        <input
                                                            type="checkbox"
                                                            checked={seleccionadas.includes(valor)}
                                                            disabled={todasLasEspecialidades}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                field.onChange(
                                                                    e.target.checked
                                                                        ? [...seleccionadas, valor]
                                                                        : seleccionadas.filter((v) => v !== valor),
                                                                )
                                                            }
                                                        />
                                                        <span>{esp.nombre}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    );
                                }}
                            />
                            {errors.especialidades && (
                                <span className={styles.textError} role="alert">
                                    {errors.especialidades.message}
                                </span>
                            )}
                        </div>
                    </fieldset>

                    {/* MÉDICOS: solo al editar y solo lectura. Se asignan desde el formulario de cada médico */}
                    {esEdicion && (
                        <fieldset className={styles.seccion}>
                            <legend className={styles.seccionTitulo}>Médicos que atienden</legend>
                            <p className={styles.ayuda}>
                                Un consultorio puede tener varios médicos. Se asignan desde el formulario de cada
                                médico; acá solo se muestran.
                            </p>
                            {(consultorio?.medicos ?? []).length === 0 ? (
                                <p className={styles.ayuda}>Todavía no hay médicos asignados a este consultorio.</p>
                            ) : (
                                <div className={styles.grupoOpciones}>
                                    {consultorio?.medicos?.map((medico) => (
                                        <span key={medico.id} className={styles.etiqueta}>
                                            {medico.apellido}, {medico.nombre}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </fieldset>
                    )}

                    {/* DIRECCIÓN */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Dirección</legend>
                        <div className={styles.grilla}>
                            <CampoFormulario register={register} errores={errors} name="direccion.calle" etiqueta="Calle" autoComplete="off" />
                            <CampoFormulario register={register} errores={errors} name="direccion.numero" etiqueta="Número" inputMode="numeric" />
                        </div>
                        <div className={`${styles.grilla3} ${styles.separado}`}>
                            <CampoFormulario register={register} errores={errors} name="direccion.piso" etiqueta="Piso" />
                            <CampoFormulario register={register} errores={errors} name="direccion.departamento" etiqueta="Departamento" />
                            <CampoFormulario register={register} errores={errors} name="direccion.barrio" etiqueta="Barrio" />
                        </div>
                        <div className={`${styles.grilla} ${styles.separado}`}>
                            <CampoFormulario register={register} errores={errors} name="ciudad" etiqueta="Ciudad" autoComplete="off" />
                        </div>
                    </fieldset>

                    {/* CONTACTO */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Contacto</legend>
                        <div className={styles.filaTelefono}>
                            <div className={styles.campo}>
                                <label htmlFor="telefono.tipo" className={styles.label}>
                                    Tipo
                                </label>
                                <select id="telefono.tipo" className={styles.campoInput} {...register('telefono.tipo')}>
                                    <option value={TipoTelefono.CELULAR}>Celular</option>
                                    <option value={TipoTelefono.FIJO}>Fijo</option>
                                    <option value={TipoTelefono.TRABAJO}>Trabajo</option>
                                </select>
                            </div>
                            <CampoFormulario register={register} errores={errors} name="telefono.codigoArea" etiqueta="Código de área" inputMode="numeric" placeholder="3777" />
                            <CampoFormulario register={register} errores={errors} name="telefono.numero" etiqueta="Número" inputMode="numeric" placeholder="123456" />
                        </div>
                        <div className={`${styles.grilla} ${styles.separado}`}>
                            <CampoFormulario
                                register={register}
                                errores={errors}
                                name="correoElectronico"
                                etiqueta="Correo electrónico"
                                type="email"
                                inputMode="email"
                                ancho
                            />
                        </div>
                    </fieldset>

                    {/* HORARIO SEMANAL */}
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Horario de atención</legend>
                        <p className={styles.ayuda}>
                            Es obligatorio y se carga una sola vez; después podés editarlo. Los horarios de los médicos
                            tienen que quedar dentro de este horario.
                        </p>
                        <EditorFranjas
                            franjas={fields}
                            registrarHora={(index, campo) => register(`horarioAtencion.franjas.${index}.${campo}`)}
                            errorHora={(index, campo) => errors.horarioAtencion?.franjas?.[index]?.[campo]?.message}
                            onAgregar={(dia, esPrimera) =>
                                append(
                                    esPrimera
                                        ? { diaSemana: dia, desde: '08:00', hasta: '12:00' }
                                        : { diaSemana: dia, desde: '15:00', hasta: '18:00' },
                                )
                            }
                            onQuitar={remove}
                            onCopiarALaborales={copiarALaborales}
                            errorGeneral={errorHorario}
                        />
                    </fieldset>

                    <div className={styles.acciones}>
                        <Link to="/consultorios" className={`btn ${styles.botonSecundario}`}>
                            Cancelar
                        </Link>
                        <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear consultorio'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioConsultorio;