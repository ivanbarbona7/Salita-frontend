import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { toast } from 'sonner';
import styles from '../utils/Formulario.module.scss';
import clientesAxios from '../../config/axios';
import DatosPersonales from './components/DatosPersonales';
import DireccionPaciente from './components/DireccionPaciente';
import ObraSocialPaciente from './components/ObraSocialPaciente';
import TelefonoPaciente from './components/TelefonoPaciente';
import CuentaPaciente from './components/CuentaPaciente';
import { crearPacienteSchema, type ICrearPacienteDTO, type IPaciente } from '../../types/Paciente.type';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import { usePermisosPaciente } from '../../hooks/usePermisoPaciente';

interface FormularioPacienteProps {
    paciente?: IPaciente; // si viene, el formulario edita; si no, crea
}

const FormularioPaciente = ({ paciente }: FormularioPacienteProps) => {
    const navigate = useNavigate();
    const permisos = usePermisosPaciente();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ICrearPacienteDTO>({
        resolver: zodResolver(crearPacienteSchema),
        // En edición, el admin recibe el usuario actual de la cuenta; la contraseña siempre arranca vacía
        defaultValues: paciente
            ? { ...paciente, user: paciente.cuenta?.user ?? '' }
            : { obraSocial: { nombre: 'NINGUNA', numeroAfiliado: '' } }, // por defecto, sin obra social
    });

    // DNI y email son datos de la cuenta: al editar, solo el admin puede cambiarlos
    const soloLecturaCuenta = Boolean(paciente) && !permisos.editarCuenta;

    const onSubmit = async (datosValidados: ICrearPacienteDTO) => {
        // Los inputs vacíos llegan como '': no se mandan al backend
        const { user, password, ...resto } = datosValidados;
        const datos = { ...resto, ...(user ? { user } : {}), ...(password ? { password } : {}) };

        try {
            if (paciente) {
                await clientesAxios.put(`/Pacientes/${paciente.id}`, datos);
                toast.success('Paciente actualizado');
                navigate(`/pacientes/${paciente.id}`);
            } else {
                await clientesAxios.post('/Pacientes', datos);
                toast.success('Paciente guardado');
                navigate('/pacientes');
            }
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    return (
        <div className={styles.pagina}>
        <div className={styles.contenedorFormulario}>
            <h3 className={styles.titulo}>{paciente ? 'Editar paciente' : 'Ingreso de nuevo paciente'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DatosPersonales
                    register={register}
                    control={control}
                    errores={errors}
                    styles={styles}
                    dniSoloLectura={soloLecturaCuenta}
                    emailSoloLectura={soloLecturaCuenta}
                />
                <DireccionPaciente register={register} errores={errors} styles={styles} />
                <TelefonoPaciente register={register} errores={errors} styles={styles} />
                <ObraSocialPaciente register={register} errores={errors} styles={styles} actual={paciente?.obraSocial?.nombre} />

                {/* Al crear la ven admin y recepción; al editar, solo el admin */}
                {(!paciente || permisos.editarCuenta) && (
                    <CuentaPaciente register={register} errores={errors} styles={styles} editando={Boolean(paciente)} />
                )}

                <div className={styles.acciones}>
                    <Button type="button" className={styles.botonSecundario} onClick={() => navigate(-1)}>
                        Cancelar
                    </Button>
                    <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando…' : paciente ? 'Guardar cambios' : 'Guardar paciente'}
                    </Button>
                </div>
            </form>
        </div>
        </div>
    );
};

export default FormularioPaciente;