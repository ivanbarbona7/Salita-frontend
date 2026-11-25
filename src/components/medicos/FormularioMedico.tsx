import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import styles from '../utils/Formulario.module.scss';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import DatosPersonales from './components/DatosPersonales';
import DatosProfesionales from './components/DatosProfesionales';
import TelefonoMedico from './components/TelefonoMedico';
import AccesoMedico from './components/AccesoMedico';
import EstadoMedico from './components/EstadoMedico';
import ConsultoriosMedico from './components/ConsultorioMedico';
import {
    medicoFormSchema,
    TipoTelefono,
    type ICrearMedicoDTO,
    type ICrearMedicoInput,
    type IMedico,
} from '../../types/Medico.types';
import type { IEspecialidad } from '../../types/Especialidad.types';
import type { IConsultorio } from '../../types/Consultorio.types';

const schemaCrear = medicoFormSchema(false);
const schemaEditar = medicoFormSchema(true);

// Convierte el médico que llega de la API en los valores del formulario
const aValoresFormulario = (medico: IMedico): ICrearMedicoInput => ({
    nombre: medico.nombre,
    apellido: medico.apellido,
    dni: medico.dni,
    fechaNacimiento: medico.fechaNacimiento ?? '',
    especialidad: medico.especialidad ? String(medico.especialidad.id) : '',
    matricula: medico.matricula ?? '',
    consultorioHabitual: medico.consultorioHabitual?.id ?? '',
    // El habitual se elige aparte; acá quedan los otros consultorios
    consultorios: (medico.consultorios ?? []).map((c) => c.id).filter((id) => id !== medico.consultorioHabitual?.id),
    telefono: {
        tipo: medico.telefono?.tipo ?? TipoTelefono.CELULAR,
        codigoArea: medico.telefono?.codigoArea ?? '',
        numero: medico.telefono?.numero ?? '',
    },
    email: medico.email,
    activo: medico.activo !== false,
    // El usuario llega solo si quien edita es admin; la contraseña siempre arranca vacía
    acceso: { user: medico.cuenta?.user ?? '', password: '' },
});

const FormularioMedico = () => {
    const { id } = useParams<{ id: string }>();
    const esEdicion = id !== undefined;
    const navigate = useNavigate();

    // null = no pedir nada (modo crear)
    const { data: medico, isLoading: cargandoMedico, error: errorMedico } = useFetch<IMedico>(
        esEdicion ? `/medicos/${id}` : null,
    );
    const { data: especialidades, isLoading: cargandoEspecialidades } = useFetch<IEspecialidad[]>('/especialidades');
    const { data: consultorios, isLoading: cargandoConsultorios } = useFetch<IConsultorio[]>('/consultorios');

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ICrearMedicoInput, unknown, ICrearMedicoDTO>({
        resolver: zodResolver(esEdicion ? schemaEditar : schemaCrear),
        defaultValues: {
            activo: true,
            consultorioHabitual: '',
            consultorios: [],
            telefono: { tipo: TipoTelefono.CELULAR },
            acceso: { user: '', password: '' },
        },
        // Cuando llegan los datos del médico, RHF actualiza el formulario solo (sin useEffect)
        values: medico ? aValoresFormulario(medico) : undefined,
    });

    const onSubmit = async (datos: ICrearMedicoDTO) => {
        // Los campos de acceso vacíos no se envían: al editar significa "no cambiar"
        const { acceso, consultorioHabitual, consultorios: otrosConsultorios, ...datosMedico } = datos;
        // El consultorio habitual también es uno de los consultorios del médico
        const consultorios = [...new Set([...(consultorioHabitual ? [consultorioHabitual] : []), ...otrosConsultorios])];
        // Al editar, vacío significa "sin consultorio habitual" (null); al crear, simplemente no se envía
        const resto = { ...datosMedico, consultorios, consultorioHabitual: consultorioHabitual || (esEdicion ? null : undefined) };
        const accesoLimpio = {
            ...(acceso?.user ? { user: acceso.user } : {}),
            ...(acceso?.password ? { password: acceso.password } : {}),
        };
        const payload = Object.keys(accesoLimpio).length > 0 ? { ...resto, acceso: accesoLimpio } : resto;

        try {
            if (esEdicion) {
                await clientesAxios.put(`/medicos/${id}`, payload);
                toast.success('Médico actualizado correctamente');
            } else {
                await clientesAxios.post('/medicos', payload);
                toast.success('Médico guardado correctamente');
            }
            navigate('/medicos');
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    // Las especialidades se esperan antes de dibujar el formulario: si el select se arma sin opciones,
    // no puede mostrar la especialidad que ya tiene el médico.
    if (cargandoMedico || cargandoEspecialidades || cargandoConsultorios) {
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

    if (esEdicion && (errorMedico || !medico)) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="danger">No encontramos al médico que querés editar.</Alert>
                    <Link to="/medicos" className={`btn ${styles.botonSecundario}`}>
                        Volver a médicos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h3 className={styles.titulo}>{esEdicion ? 'Modificar médico' : 'Ingreso de nuevo médico'}</h3>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {esEdicion && <EstadoMedico register={register} activo={watch('activo')} styles={styles} />}

                    <DatosPersonales register={register} control={control} errores={errors} styles={styles} />
                    <DatosProfesionales
                        register={register}
                        errores={errors}
                        styles={styles}
                        especialidades={especialidades ?? []}
                        // Al cambiar la especialidad se limpian los consultorios: cada uno tiene que tener la del médico
                        alCambiarEspecialidad={() => {
                            setValue('consultorios', []);
                            setValue('consultorioHabitual', '');
                        }}
                    />
                    <ConsultoriosMedico
                        register={register}
                        control={control}
                        errores={errors}
                        styles={styles}
                        especialidadId={watch('especialidad') ?? ''}
                        habitualId={watch('consultorioHabitual') ?? ''}
                        consultorios={consultorios ?? []}
                    />
                    <TelefonoMedico register={register} errores={errors} styles={styles} />
                    <AccesoMedico register={register} errores={errors} styles={styles} esEdicion={esEdicion} />

                    <div className={styles.acciones}>
                        <Link to="/medicos" className={`btn ${styles.botonSecundario}`}>
                            Cancelar
                        </Link>
                        <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar médico'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioMedico;