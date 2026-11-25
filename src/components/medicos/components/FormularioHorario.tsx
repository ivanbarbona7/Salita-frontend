import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { toast } from 'sonner';
import clientesAxios from '../../../config/axios';
import { useFetch } from '../../../hooks/useFetch';
import { obtenerMensajeError } from '../../utils/obtenerMensajeError';
import EditorFranjas from '../../utils/EditorFranjas';
import styles from '../../utils/Formulario.module.scss';
import { DIAS_LABORALES, horarioSchema, type IHorarioForm, type IOcupacion } from '../../../types/Horario.types';
import type { IMedico } from '../../../types/Medico.types';
import type { IConsultorio } from '../../../types/Consultorio.types';

interface FormularioHorarioProps {
    medico: IMedico;
    // Ruta base de la API: "/medicos/<id>" (admin y recepción) o "/medicos/yo" (el propio médico)
    base: string;
    // A dónde se vuelve al guardar o cancelar
    rutaVolver: string;
}

type FranjaForm = IHorarioForm['franjas'][number];

const FormularioHorario = ({ medico, base, rutaVolver }: FormularioHorarioProps) => {
    const navigate = useNavigate();
    // Se puede elegir cualquier consultorio activo que tenga la especialidad del médico
    const { data: consultoriosData, isLoading: cargandoConsultorios } = useFetch<IConsultorio[]>(
        `/consultorios?activo=true&especialidad=${medico.especialidad.id}`,
    );
    const consultorios = consultoriosData ?? [];
    // Cada horario nuevo viene con el consultorio habitual del médico (o con el único que tiene)
    const consultorioPorDefecto = medico.consultorioHabitual?.id ?? (consultorios.length === 1 ? consultorios[0].id : '');

    // Horarios que otros médicos ya tienen en los consultorios de este médico: un consultorio no puede
    // tener dos médicos a la misma hora
    const { data: ocupacion } = useFetch<IOcupacion[]>(`${base}/ocupacion`);
    const ocupados = ocupacion ?? [];

    const {
        register,
        control,
        handleSubmit,
        getValues,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<IHorarioForm>({
        resolver: zodResolver(horarioSchema),
        defaultValues: {
            duracionTurno: medico.horarioAtencion?.duracionTurno ?? 20,
            franjas: medico.horarioAtencion?.franjas ?? [],
        },
    });

    // Todas las franjas viven en un solo arreglo; el editor las agrupa por día
    const { fields, append, remove, replace } = useFieldArray({ control, name: 'franjas' });
    const franjasActuales = watch('franjas') ?? [];

    // Otro médico que ya atiende en ese consultorio, ese día, a esa hora
    const choqueDe = (franja: FranjaForm | undefined) =>
        franja
            ? ocupados.find(
                  (o) =>
                      o.consultorio === franja.consultorio &&
                      o.diaSemana === franja.diaSemana &&
                      o.desde < franja.hasta &&
                      franja.desde < o.hasta,
              )
            : undefined;

    // Copia las franjas de un día (con su consultorio) a lunes–viernes
    const copiarALaborales = (dia: number) => {
        const actuales = getValues('franjas');
        const base = actuales.filter((f) => f.diaSemana === dia);
        const resto = actuales.filter((f) => !DIAS_LABORALES.includes(f.diaSemana));
        replace([...resto, ...DIAS_LABORALES.flatMap((d) => base.map((f) => ({ ...f, diaSemana: d })))]);
    };

    const onSubmit = async (datos: IHorarioForm) => {
        // Se avisa acá para no hacer el viaje al servidor; el backend lo controla igual
        const conChoque = datos.franjas.find((f) => choqueDe(f));
        const choque = choqueDe(conChoque);
        if (choque) {
            toast.error(
                `Ese consultorio ya está ocupado a esa hora por ${choque.medico.apellido}, ${choque.medico.nombre} (${choque.desde}–${choque.hasta}).`,
            );
            return;
        }

        try {
            await clientesAxios.put(`${base}/horario`, datos);
            toast.success('Horario guardado');
            navigate(rutaVolver);
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    if (cargandoConsultorios) {
        return (
            <Placeholder animation="glow" aria-busy="true">
                <Placeholder xs={12} style={{ height: '5rem', borderRadius: 12 }} className="mb-3" />
                <Placeholder xs={12} style={{ height: '9rem', borderRadius: 12 }} />
            </Placeholder>
        );
    }

    // Sin consultorios no hay dónde asignar el horario
    if (consultorios.length === 0) {
        return (
            <Alert variant="warning">
                No hay consultorios activos que atiendan la especialidad {medico.especialidad.nombre}. Pedile a la
                administración que cargue uno.
            </Alert>
        );
    }

    const errorGeneral = errors.franjas?.root?.message ?? errors.franjas?.message;

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>Duración del turno</legend>
                <div className={styles.campo} style={{ maxWidth: 280 }}>
                    <label htmlFor="duracionTurno" className={styles.label}>
                        Minutos por turno
                    </label>
                    <input
                        id="duracionTurno"
                        type="number"
                        min={5}
                        max={120}
                        step={5}
                        className={styles.campoInput}
                        aria-invalid={errors.duracionTurno ? true : undefined}
                        {...register('duracionTurno', { valueAsNumber: true })}
                    />
                    {errors.duracionTurno && (
                        <span className={styles.textError} role="alert">
                            {errors.duracionTurno.message}
                        </span>
                    )}
                </div>
            </fieldset>

            <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>Días, horarios y consultorio</legend>
                <p className={styles.ayuda}>
                    Cada horario se asigna a un consultorio activo de la especialidad y tiene que quedar dentro del
                    horario de ese consultorio. Un consultorio puede tener varios médicos, pero no a la misma hora: si
                    otro médico ya lo usa en ese horario, se avisa acá. No se puede quitar ni acortar un horario que
                    tenga turnos pendientes.
                    {medico.consultorioHabitual && <> Consultorio habitual: <strong>{medico.consultorioHabitual.nombre}</strong>.</>}
                </p>
                <EditorFranjas
                    franjas={fields}
                    registrarHora={(index, campo) => register(`franjas.${index}.${campo}`)}
                    errorHora={(index, campo) => errors.franjas?.[index]?.[campo]?.message}
                    onAgregar={(dia, esPrimera) =>
                        append(
                            esPrimera
                                ? { diaSemana: dia, desde: '08:00', hasta: '12:00', consultorio: consultorioPorDefecto }
                                : { diaSemana: dia, desde: '15:00', hasta: '18:00', consultorio: consultorioPorDefecto },
                        )
                    }
                    onQuitar={remove}
                    onCopiarALaborales={copiarALaborales}
                    errorGeneral={errorGeneral}
                    renderExtra={(index) => {
                        const error = errors.franjas?.[index]?.consultorio?.message;
                        const choque = choqueDe(franjasActuales[index]);
                        return (
                            <div className={styles.franjaConsultorio}>
                                <select
                                    className={styles.campoInput}
                                    aria-label="Consultorio"
                                    aria-invalid={error || choque ? true : undefined}
                                    {...register(`franjas.${index}.consultorio`)}
                                >
                                    <option value="">Consultorio...</option>
                                    {consultorios.map((consultorio) => (
                                        <option key={consultorio.id} value={consultorio.id}>
                                            {consultorio.nombre}
                                        </option>
                                    ))}
                                </select>
                                {error && (
                                    <span className={styles.textError} role="alert">
                                        {error}
                                    </span>
                                )}
                                {choque && (
                                    <span className={styles.textError} role="alert">
                                        Ocupado por {choque.medico.apellido}, {choque.medico.nombre} ({choque.desde}–{choque.hasta})
                                    </span>
                                )}
                            </div>
                        );
                    }}
                />
            </fieldset>

            <div className={styles.acciones}>
                <Button type="button" className={styles.botonSecundario} onClick={() => navigate(rutaVolver)}>
                    Cancelar
                </Button>
                <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar horario'}
                </Button>
            </div>
        </form>
    );
};

export default FormularioHorario;