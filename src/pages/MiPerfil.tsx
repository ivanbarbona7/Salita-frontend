import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { toast } from 'sonner';
import clientesAxios from '../config/axios';
import { useFetch } from '../hooks/useFetch';
import { obtenerMensajeError } from '../components/utils/obtenerMensajeError';
import CampoFormulario from '../components/utils/CampoFormulario';
import styles from '../components/utils/Formulario.module.scss';
import { TipoTelefono, type IMedico } from '../types/Medico.types';
import { passwordSchema, perfilSchema, type IPasswordInput, type IPerfilInput } from '../types/MiPerfil.types';

const DatoFijo = ({ etiqueta, valor }: { etiqueta: string; valor: string }) => (
    <div className={styles.campo}>
        <span className={styles.label}>{etiqueta}</span>
        <div className={styles.campoInput} aria-readonly="true" style={{ background: 'rgba(0,0,0,.04)' }}>
            {valor}
        </div>
    </div>
);

const FormTelefono = ({ medico, onGuardado }: { medico: IMedico; onGuardado: () => void }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<IPerfilInput>({
        resolver: zodResolver(perfilSchema),
        defaultValues: { telefono: { tipo: medico.telefono.tipo, codigoArea: medico.telefono.codigoArea, numero: medico.telefono.numero } },
    });

    const guardar = async (datos: IPerfilInput) => {
        try {
            await clientesAxios.put('/medicos/yo', datos);
            toast.success('Teléfono actualizado');
            onGuardado();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(guardar)} noValidate>
            <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>Teléfono</legend>
                <div className={styles.filaTelefono}>
                    <div className={styles.campo}>
                        <label htmlFor="telefono.tipo" className={styles.label}>Tipo</label>
                        <select id="telefono.tipo" className={styles.campoInput} {...register('telefono.tipo')}>
                            <option value={TipoTelefono.CELULAR}>Celular</option>
                            <option value={TipoTelefono.FIJO}>Fijo</option>
                            <option value={TipoTelefono.TRABAJO}>Trabajo</option>
                        </select>
                    </div>
                    <CampoFormulario register={register} errores={errors} name="telefono.codigoArea" etiqueta="Código de área" inputMode="numeric" />
                    <CampoFormulario register={register} errores={errors} name="telefono.numero" etiqueta="Número" inputMode="numeric" />
                </div>
            </fieldset>
            <div className={styles.acciones}>
                <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar teléfono'}
                </Button>
            </div>
        </form>
    );
};

const FormPassword = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<IPasswordInput>({ resolver: zodResolver(passwordSchema) });

    const guardar = async ({ passwordActual, passwordNueva }: IPasswordInput) => {
        try {
            await clientesAxios.patch('/medicos/yo/password', { passwordActual, passwordNueva });
            toast.success('Contraseña actualizada');
            reset();
        } catch (error) {
            toast.error(obtenerMensajeError(error));
        }
    };

    const base = { register, errores: errors };
    return (
        <form onSubmit={handleSubmit(guardar)} noValidate>
            <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>Cambiar contraseña</legend>
                <CampoFormulario {...base} name="passwordActual" etiqueta="Contraseña actual" type="password" autoComplete="current-password" />
                <CampoFormulario {...base} name="passwordNueva" etiqueta="Contraseña nueva" type="password" autoComplete="new-password" />
                <CampoFormulario {...base} name="repetir" etiqueta="Repetí la contraseña nueva" type="password" autoComplete="new-password" />
            </fieldset>
            <div className={styles.acciones}>
                <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
                </Button>
            </div>
        </form>
    );
};

const MiPerfil = () => {
    const { data: medico, isLoading, error, refetch } = useFetch<IMedico>('/medicos/yo');

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h1 className={styles.titulo}>Mi perfil</h1>
                {isLoading && (
                    <Placeholder animation="glow" aria-busy="true">
                        <Placeholder xs={12} style={{ height: '8rem', borderRadius: 12 }} className="mb-3" />
                        <Placeholder xs={12} style={{ height: '6rem', borderRadius: 12 }} />
                    </Placeholder>
                )}
                {!isLoading && (error || !medico) && <Alert variant="danger">No se pudo cargar tu perfil.</Alert>}
                {medico && (
                    <>
                        <fieldset className={styles.seccion}>
                            <legend className={styles.seccionTitulo}>Datos profesionales</legend>
                            <DatoFijo etiqueta="Nombre" valor={`${medico.nombre} ${medico.apellido}`} />
                            <DatoFijo etiqueta="Matrícula" valor={String(medico.matricula)} />
                            <DatoFijo etiqueta="Especialidad" valor={medico.especialidad.nombre} />
                            <DatoFijo etiqueta="Email" valor={medico.email} />
                            <p className={styles.ayuda}>
                                Para modificar estos datos, comunicate con la administración.
                            </p>
                        </fieldset>
                        <FormTelefono key={`${medico.telefono.codigoArea}-${medico.telefono.numero}`} medico={medico} onGuardado={refetch} />
                        <FormPassword />
                    </>
                )}
            </div>
        </div>
    );
};

export default MiPerfil;