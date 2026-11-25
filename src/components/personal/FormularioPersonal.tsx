import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Placeholder } from 'react-bootstrap';
import { toast } from 'sonner';
import clientesAxios from '../../config/axios';
import { useFetch } from '../../hooks/useFetch';
import CampoFormulario from '../utils/CampoFormulario';
import CampoFecha from '../utils/CampoFecha';
import { hoyDia } from '../utils/fechaDia';
import { obtenerMensajeError } from '../utils/obtenerMensajeError';
import styles from '../utils/Formulario.module.scss';
import {
    ETIQUETA_ROL,
    ETIQUETA_TURNO,
    TURNOS_LABORALES,
    nacimientoMasRecientePersonal,
    personalFormSchema,
    type IPersonal,
    type IPersonalForm,
} from '../../types/Personal.types';

const schemaCrear = personalFormSchema(false);
const schemaEditar = personalFormSchema(true);

const aValoresFormulario = (p: IPersonal): IPersonalForm => ({
    nombre: p.nombre,
    apellido: p.apellido,
    dni: p.dni ?? '',
    fechaNacimiento: p.fechaNacimiento ?? '',
    telefono: { codigoArea: p.telefono?.codigoArea ?? '', numero: p.telefono?.numero ?? '' },
    email: p.email,
    rol: p.rol,
    turno: p.turno ?? '',
    fechaIngreso: p.fechaIngreso ?? '',
    user: p.user ?? '',
    password: '',
});

interface FormProps {
    persona?: IPersonal; // si viene, edita; si no, crea
}

const Formulario = ({ persona }: FormProps) => {
    const navigate = useNavigate();
    const esEdicion = persona !== undefined;

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<IPersonalForm>({
        resolver: zodResolver(esEdicion ? schemaEditar : schemaCrear),
        defaultValues: persona ? aValoresFormulario(persona) : { rol: 'RECEPCIONISTA', turno: '', fechaIngreso: '', telefono: { codigoArea: '', numero: '' } },
    });

    const hoy = hoyDia();
    const masReciente = nacimientoMasRecientePersonal();
    const masAntigua = `${Number(hoy.slice(0, 4)) - 100}${hoy.slice(4)}`;
    const base = { register, errores: errors };

    const onSubmit = async (datos: IPersonalForm) => {
        const { turno, fechaIngreso, user, password, rol, ...resto } = datos;
        try {
            if (persona) {
                // Al editar: vacío en turno o ingreso = borrar el dato (null); usuario y contraseña vacíos = no cambiar. El rol no se cambia.
                await clientesAxios.put(`/personal/${persona.id}`, {
                    ...resto,
                    turno: turno || null,
                    fechaIngreso: fechaIngreso || null,
                    ...(user ? { user } : {}),
                    ...(password ? { password } : {}),
                });
                toast.success('Datos actualizados');
                navigate(`/personal/${persona.id}`);
            } else {
                await clientesAxios.post('/personal', {
                    ...resto,
                    rol,
                    user,
                    password,
                    ...(turno ? { turno } : {}),
                    ...(fechaIngreso ? { fechaIngreso } : {}),
                });
                toast.success('Personal cargado correctamente');
                navigate('/personal');
            }
        } catch (error: unknown) {
            toast.error(obtenerMensajeError(error));
        }
    };

    return (
        <div className={styles.pagina}>
            <div className={styles.contenedorFormulario}>
                <h3 className={styles.titulo}>{persona ? 'Editar personal' : 'Ingreso de nuevo personal'}</h3>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Datos personales</legend>
                        <div className={styles.grilla}>
                            <CampoFormulario {...base} name="nombre" etiqueta="Nombre" autoComplete="off" />
                            <CampoFormulario {...base} name="apellido" etiqueta="Apellido" autoComplete="off" />
                            <CampoFormulario {...base} name="dni" etiqueta="DNI" inputMode="numeric" placeholder="Sin puntos" />
                            <div className={styles.campo}>
                                <label htmlFor="fechaNacimiento" className={styles.label}>Fecha de nacimiento</label>
                                <Controller
                                    control={control}
                                    name="fechaNacimiento"
                                    render={({ field }) => (
                                        <CampoFecha
                                            id="fechaNacimiento"
                                            className={styles.campoInput}
                                            valor={field.value ?? ''}
                                            onChange={field.onChange}
                                            min={masAntigua}
                                            max={masReciente}
                                            vistaInicial={masReciente}
                                            anioDescendente
                                        />
                                    )}
                                />
                                {errors.fechaNacimiento && (
                                    <span className={styles.textError} role="alert">{errors.fechaNacimiento.message}</span>
                                )}
                            </div>
                            <CampoFormulario {...base} name="email" etiqueta="Email" type="email" inputMode="email" ancho />
                        </div>
                    </fieldset>

                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Teléfono</legend>
                        <div className={styles.grilla}>
                            <CampoFormulario {...base} name="telefono.codigoArea" etiqueta="Código de área" inputMode="numeric" placeholder="3777" />
                            <CampoFormulario {...base} name="telefono.numero" etiqueta="Número" inputMode="numeric" placeholder="123456" />
                        </div>
                    </fieldset>

                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Datos laborales</legend>
                        <div className={styles.grilla}>
                            <div className={styles.campo}>
                                <label htmlFor="rol" className={styles.label}>Rol</label>
                                <select id="rol" className={styles.campoInput} disabled={esEdicion} {...register('rol')}>
                                    <option value="RECEPCIONISTA">{ETIQUETA_ROL.RECEPCIONISTA}</option>
                                    <option value="ADMIN">{ETIQUETA_ROL.ADMIN}</option>
                                </select>
                                <span className={styles.ayuda} style={{ margin: '6px 0 0' }}>
                                    {esEdicion
                                        ? 'El rol no se puede cambiar desde acá.'
                                        : 'El administrador tiene acceso a todo el sistema.'}
                                </span>
                            </div>
                            <div className={styles.campo}>
                                <label htmlFor="turno" className={styles.label}>Turno en que trabaja (opcional)</label>
                                <select id="turno" className={styles.campoInput} {...register('turno')}>
                                    <option value="">Sin definir</option>
                                    {TURNOS_LABORALES.map((t) => (
                                        <option key={t} value={t}>{ETIQUETA_TURNO[t]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.campo}>
                                <label htmlFor="fechaIngreso" className={styles.label}>Fecha de ingreso (opcional)</label>
                                <Controller
                                    control={control}
                                    name="fechaIngreso"
                                    render={({ field }) => (
                                        <CampoFecha
                                            id="fechaIngreso"
                                            className={styles.campoInput}
                                            valor={field.value ?? ''}
                                            onChange={field.onChange}
                                            max={hoy}
                                            permitirVacio
                                        />
                                    )}
                                />
                                {errors.fechaIngreso && (
                                    <span className={styles.textError} role="alert">{errors.fechaIngreso.message}</span>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className={styles.seccion}>
                        <legend className={styles.seccionTitulo}>Acceso al sistema</legend>
                        <p className={styles.ayuda}>
                            {esEdicion
                                ? 'Dejá la contraseña vacía para no cambiarla. Si escribís una, reemplaza a la actual.'
                                : 'La persona ingresará al sistema con su email, este usuario y esta contraseña.'}
                        </p>
                        <div className={styles.grilla}>
                            <CampoFormulario {...base} name="user" etiqueta="Usuario" autoComplete="off" />
                            <CampoFormulario
                                {...base}
                                name="password"
                                etiqueta={esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                                type="password"
                                autoComplete="new-password"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                    </fieldset>

                    <div className={styles.acciones}>
                        <Button type="button" className={styles.botonSecundario} onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" className={styles.botonPrincipal} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando…' : persona ? 'Guardar cambios' : 'Guardar personal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Al editar, el formulario se monta recién cuando llegaron los datos (así los valores iniciales son los correctos)
const FormularioPersonal = () => {
    const { id } = useParams<{ id: string }>();
    const { data: persona, isLoading, error } = useFetch<IPersonal>(id ? `/personal/${id}` : null);

    if (!id) return <Formulario />;

    if (isLoading) {
        return (
            <div className={styles.pagina} aria-busy="true">
                <div className={styles.contenedorFormulario}>
                    {Array.from({ length: 3 }, (_, i) => (
                        <Placeholder key={i} as="div" animation="glow" className="mb-3">
                            <Placeholder xs={12} style={{ height: '8rem', borderRadius: 12 }} />
                        </Placeholder>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !persona) {
        return (
            <div className={styles.pagina}>
                <div className={styles.contenedorFormulario}>
                    <Alert variant="danger">No encontramos a esa persona.</Alert>
                    <Link to="/personal" className={`btn ${styles.botonSecundario}`}>Volver al personal</Link>
                </div>
            </div>
        );
    }

    return <Formulario key={persona.id} persona={persona} />;
};

export default FormularioPersonal;