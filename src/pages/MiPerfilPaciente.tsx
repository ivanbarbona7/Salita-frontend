import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form } from 'react-bootstrap';
import {
  CalendarHeart,
  Envelope,
  House,
  KeyFill,
  PersonVcard,
  ShieldPlus,
  Telephone,
  type Icon,
} from 'react-bootstrap-icons';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import clientesAxios from '../config/axios';
import { PasoLayout } from '../components/PasoLayout';
import { CargandoBotones } from '../components/CargandoBotones';
import { useFetch } from '../hooks/useFetch';
import { esIngresoRapido } from '../components/utils/sesion';
import { obtenerMensajeError } from '../components/utils/obtenerMensajeError';
import { TipoTelefono } from '../types/Paciente.type';
import { OBRA_SOCIAL_POR_DEFECTO, type IObraSocialItem } from '../types/ObraSocial.types';
import { perfilPacienteSchema, type IMiPerfil, type IPerfilPacienteForm } from '../types/PerfilPaciente.types';
import { passwordSchema, type IPasswordInput } from '../types/MiPerfil.types';
import InputPassword from '../components/utils/InputPassword';
import { formatoNacimiento, textoEdad } from '../components/utils/Edad';
import styles from './MiPerfilPaciente.module.scss';

const Campo = ({ etiqueta, error, children }: { etiqueta: string; error?: string | undefined; children: React.ReactNode }) => (
  <Form.Group className="mb-3">
    <Form.Label className="fs-6">{etiqueta}</Form.Label>
    {children}
    {error && <Form.Text className="text-danger" role="alert">{error}</Form.Text>}
  </Form.Group>
);

const DatoFijo = ({ etiqueta, valor, Icono }: { etiqueta: string; valor: string; Icono: Icon }) => (
  <div className={styles.dato}>
    <Icono size={24} className={styles.datoIcono} aria-hidden="true" />
    <div>
      <span className={styles.datoEtiqueta}>{etiqueta}</span>
      <span className={styles.datoValor}>{valor}</span>
    </div>
  </div>
);

const Seccion = ({ titulo, Icono, clave, children }: { titulo: string; Icono: Icon; clave?: boolean; children: React.ReactNode }) => (
  <section className={`${styles.seccion} ${clave ? styles.seccionClave : ''}`}>
    <div className={styles.seccionCab}>
      <span className={styles.icono}><Icono size={22} aria-hidden="true" /></span>
      <h2 className={styles.seccionTitulo}>{titulo}</h2>
    </div>
    <div className={styles.seccionCuerpo}>{children}</div>
  </section>
);

const FormContacto = ({ perfil, onGuardado }: { perfil: IMiPerfil; onGuardado: () => void }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IPerfilPacienteForm>({
    resolver: zodResolver(perfilPacienteSchema),
    defaultValues: {
      telefono: perfil.telefono,
      direccion: {
        calle: perfil.direccion?.calle ?? '',
        numero: perfil.direccion?.numero ?? '',
        piso: perfil.direccion?.piso ?? '',
        departamento: perfil.direccion?.departamento ?? '',
        barrio: perfil.direccion?.barrio ?? '',
      },
      obraSocial: {
        nombre: perfil.obraSocial?.nombre ?? OBRA_SOCIAL_POR_DEFECTO,
        numeroAfiliado: perfil.obraSocial?.numeroAfiliado ?? '',
      },
    },
  });

  // La lista sale del catálogo. "NINGUNA" y la que ya tiene el paciente siempre están, aunque la hayan desactivado.
  const { data: catalogo } = useFetch<IObraSocialItem[]>('/obras-sociales');
  const nombresObraSocial = Array.from(
    new Set([OBRA_SOCIAL_POR_DEFECTO, perfil.obraSocial?.nombre ?? OBRA_SOCIAL_POR_DEFECTO, ...(catalogo ?? []).map((o) => o.nombre)]),
  );

  const guardar = async (datos: IPerfilPacienteForm) => {
    try {
      await clientesAxios.put('/pacientes/yo', datos);
      toast.success('Datos actualizados');
      onGuardado();
    } catch (err: unknown) {
      toast.error(obtenerMensajeError(err));
    }
  };

  return (
    <Seccion titulo="Mis datos de contacto" Icono={Telephone}>
        <Form onSubmit={handleSubmit(guardar)} noValidate>
          <h3 className={styles.subtitulo}><Telephone size={18} aria-hidden="true" /> Teléfono</h3>
          <Campo etiqueta="Tipo">
            <Form.Select {...register('telefono.tipo')}>
              <option value={TipoTelefono.CELULAR}>Celular</option>
              <option value={TipoTelefono.FIJO}>Fijo</option>
              <option value={TipoTelefono.TRABAJO}>Trabajo</option>
            </Form.Select>
          </Campo>
          <Campo etiqueta="Código de área" error={errors.telefono?.codigoArea?.message}>
            <Form.Control inputMode="numeric" isInvalid={!!errors.telefono?.codigoArea} {...register('telefono.codigoArea')} />
          </Campo>
          <Campo etiqueta="Número" error={errors.telefono?.numero?.message}>
            <Form.Control inputMode="numeric" isInvalid={!!errors.telefono?.numero} {...register('telefono.numero')} />
          </Campo>

          <h3 className={styles.subtitulo}><House size={18} aria-hidden="true" /> Dirección</h3>
          <Campo etiqueta="Calle" error={errors.direccion?.calle?.message}>
            <Form.Control isInvalid={!!errors.direccion?.calle} {...register('direccion.calle')} />
          </Campo>
          <Campo etiqueta="Número" error={errors.direccion?.numero?.message}>
            <Form.Control isInvalid={!!errors.direccion?.numero} {...register('direccion.numero')} />
          </Campo>
          <Campo etiqueta="Piso (opcional)"><Form.Control {...register('direccion.piso')} /></Campo>
          <Campo etiqueta="Departamento (opcional)"><Form.Control {...register('direccion.departamento')} /></Campo>
          <Campo etiqueta="Barrio (opcional)"><Form.Control {...register('direccion.barrio')} /></Campo>

          <h3 className={styles.subtitulo}><ShieldPlus size={18} aria-hidden="true" /> Obra social</h3>
          <Campo etiqueta="Obra social" error={errors.obraSocial?.nombre?.message}>
            <Form.Select {...register('obraSocial.nombre')}>
              {nombresObraSocial.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </Form.Select>
          </Campo>
          <Campo etiqueta="Número de afiliado (opcional)"><Form.Control {...register('obraSocial.numeroAfiliado')} /></Campo>

          <Button type="submit" size="lg" className={styles.botonGuardar} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Form>
    </Seccion>
  );
};

const FormPassword = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<IPasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  const guardar = async ({ passwordActual, passwordNueva }: IPasswordInput) => {
    try {
      await clientesAxios.patch('/pacientes/yo/password', { passwordActual, passwordNueva });
      toast.success('Contraseña actualizada');
      reset();
    } catch (err: unknown) {
      toast.error(obtenerMensajeError(err));
    }
  };

  return (
    <Seccion titulo="Cambiar contraseña" Icono={KeyFill} clave>
        <Form onSubmit={handleSubmit(guardar)} noValidate>
          <Campo etiqueta="Contraseña actual" error={errors.passwordActual?.message}>
            <InputPassword autoComplete="current-password" isInvalid={!!errors.passwordActual} {...register('passwordActual')} />
          </Campo>
          <Campo etiqueta="Contraseña nueva (mínimo 8 caracteres)" error={errors.passwordNueva?.message}>
            <InputPassword autoComplete="new-password" isInvalid={!!errors.passwordNueva} {...register('passwordNueva')} />
          </Campo>
          <Campo etiqueta="Repetí la contraseña nueva" error={errors.repetir?.message}>
            <InputPassword autoComplete="new-password" isInvalid={!!errors.repetir} {...register('repetir')} />
          </Campo>
          <Button type="submit" size="lg" variant="outline-warning" className={styles.botonClave} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </Form>
    </Seccion>
  );
};

export const MiPerfilPaciente = () => {
  const { data: perfil, isLoading, error, refetch } = useFetch<IMiPerfil>(esIngresoRapido() ? null : '/pacientes/yo');

  // El perfil muestra datos personales: no está disponible con el ingreso rápido
  if (esIngresoRapido()) return <Navigate to="/pacientes/inicio" replace />;

  return (
    <PasoLayout titulo="Mi perfil">
      {isLoading && <CargandoBotones cantidad={3} />}
      {!isLoading && (error || !perfil) && <Alert variant="danger">No pudimos cargar tu perfil.</Alert>}

      {perfil && (
        <>
          <div className={styles.hero}>
            <div className={styles.avatar} aria-hidden="true">
              {perfil.nombre.charAt(0)}{perfil.apellido.charAt(0)}
            </div>
            <div className={styles.heroTexto}>
              <h2 className={styles.heroNombre}>{perfil.nombre} {perfil.apellido}</h2>
              <p className={styles.heroSub}>{perfil.email}</p>
            </div>
          </div>

          <Seccion titulo="Mis datos" Icono={PersonVcard}>
            <div className={styles.datos}>
              <DatoFijo etiqueta="Nombre" valor={`${perfil.nombre} ${perfil.apellido}`} Icono={PersonVcard} />
              <DatoFijo etiqueta="DNI" valor={perfil.dni} Icono={PersonVcard} />
              {perfil.fechaNacimiento && (
                <DatoFijo
                  etiqueta="Fecha de nacimiento"
                  valor={`${formatoNacimiento(perfil.fechaNacimiento)} (${textoEdad(perfil.fechaNacimiento)})`}
                  Icono={CalendarHeart}
                />
              )}
              <DatoFijo etiqueta="Email (con el que ingresás)" valor={perfil.email} Icono={Envelope} />
            </div>
            <small className={styles.aviso}>
              Para corregir estos datos o cambiar tu email, acercate a la salita.
            </small>
          </Seccion>
          <FormContacto perfil={perfil} onGuardado={refetch} />
          <FormPassword />
        </>
      )}
    </PasoLayout>
  );
};