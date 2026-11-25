import type { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { PersonVcard, Telephone } from 'react-bootstrap-icons';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PasoLayout } from '../components/PasoLayout';
import { useIngresoRapido } from '../hooks/useTurnosApi';
import { ingresoSchema, type IIngresoDTO } from '../types/Paciente.type';
import styles from './IngresoRapido.module.scss';

const soloNumeros = (e: ChangeEvent<HTMLInputElement>) => {
  e.target.value = e.target.value.replace(/\D/g, '');
};

const campos = [
  {
    name: 'nombre',
    label: '¿Cuál es tu nombre?',
    ayuda: 'Ejemplo: Martín',
    inputMode: 'text',
    autoComplete: 'given-name',
    maxLength: 40,
    numerico: false,
  },
  {
    name: 'apellido',
    label: '¿Cuál es tu apellido?',
    ayuda: 'Ejemplo: Alcaraz',
    inputMode: 'text',
    autoComplete: 'family-name',
    maxLength: 40,
    numerico: false,
  },
  {
    name: 'dni',
    label: '¿Cuál es tu DNI?',
    ayuda: 'Solo números, sin puntos. Ejemplo: 43207090',
    inputMode: 'numeric',
    autoComplete: 'off',
    maxLength: 8,
    numerico: true,
  },
] as const;

export const IngresoRapido = () => {
  const navigate = useNavigate();
  const ingresar = useIngresoRapido();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<IIngresoDTO>({ resolver: zodResolver(ingresoSchema) });

  const onSubmit = async (datos: IIngresoDTO) => {
    try {
      const { token } = await ingresar(datos);
      localStorage.setItem('token', token); // misma clave que usa tu login
      navigate('/pacientes/inicio');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 429) {
        toast.error('Hiciste muchos intentos. Probá de nuevo en un rato.');
        return;
      }
      toast.error('No pudimos continuar. Intentá de nuevo.');
    }
  };

  return (
    <PasoLayout titulo="Pedí tu turno">
      <p className={styles.intro}>Completá estos 4 datos para pedir tu turno.</p>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className={styles.bloque}>
          <h2 className={styles.bloqueTitulo}>
            <span className={styles.bloqueIcono}><PersonVcard size={20} aria-hidden="true" /></span>
            Tus datos
          </h2>
          <div className={styles.grilla}>
            {campos.map(({ name, label, ayuda, inputMode, autoComplete, maxLength, numerico }) => (
              <Form.Group key={name} className={styles.campo} controlId={`ingreso-${name}`}>
                <Form.Label className={styles.label}>{label}</Form.Label>
                <Form.Control
                  size="lg"
                  type="text"
                  inputMode={inputMode}
                  autoComplete={autoComplete}
                  maxLength={maxLength}
                  isInvalid={!!errors[name]}
                  {...register(name, numerico ? { onChange: soloNumeros } : {})}
                />
                <Form.Control.Feedback type="invalid">{errors[name]?.message}</Form.Control.Feedback>
                <small className={styles.ayuda}>{ayuda}</small>
              </Form.Group>
            ))}
          </div>
        </section>

        <section className={styles.bloque}>
          <h2 className={styles.bloqueTitulo}>
            <span className={styles.bloqueIcono}><Telephone size={20} aria-hidden="true" /></span>
            Tu contacto
          </h2>
          <Form.Group className={styles.campo} controlId="ingreso-telefono">
            <Form.Label className={styles.label}>¿Cuál es tu número de celular?</Form.Label>
            <InputGroup size="lg" hasValidation>
              <InputGroup.Text>+54 9</InputGroup.Text>
              <Form.Control
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="3794907810"
                maxLength={10}
                isInvalid={!!errors.telefono}
                {...register('telefono', { onChange: soloNumeros })}
              />
              <Form.Control.Feedback type="invalid">{errors.telefono?.message}</Form.Control.Feedback>
            </InputGroup>
            <small className={styles.ayuda}>
              Código de área y número, sin 0 ni 15. Ejemplo: 3794907810
            </small>
          </Form.Group>
        </section>

        <Button type="submit" size="lg" className={styles.boton} disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Continuar'}
        </Button>
      </Form>

      <div className={styles.pie}>
        <p>¿Necesitás ayuda? Acercate a la salita y te ayudamos a sacar el turno.</p>
        <Link to="/login">Ya tengo usuario y contraseña</Link>
      </div>
    </PasoLayout>
  );
};