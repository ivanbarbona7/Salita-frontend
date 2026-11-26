import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import clientesAxios from "../config/axios";
import { Button, InputGroup, Form } from "react-bootstrap";
import { ArrowLeft, Envelope, Eye, EyeSlash, HeartPulseFill, Lock, Person } from "react-bootstrap-icons";
import { isAxiosError } from "axios";
import { obtenerRol, rutaInicio  } from "../components/utils/sesion.tsx";
import formulario from "../components/utils/Formulario.module.scss";
import styles from "./login.module.scss";

const loginSchema = z.object({
    email: z.email("Formato de email invalido"),
    user: z.string().min(1, "El Usuario es obligatorio"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginDTO = z.infer<typeof loginSchema>;

const Login = () => {
    const navigate = useNavigate();
    const [verPassword, setVerPassword] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginDTO>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (datos: LoginDTO) => {
    try {
        const { data } = await clientesAxios.post<{ data: { token: string } }>('/auth/login', datos);
        localStorage.setItem('token', data.data.token);

        toast.success("Ingreso fue exitoso");
        const rol = obtenerRol();
        navigate(rol ? rutaInicio(rol) : '/', { replace: true });
    } catch (error) {
        // El backend responde { ok, message }; se acepta también "mensaje" por si algún endpoint lo usa
        const respuesta = isAxiosError<{ message?: string; mensaje?: string }>(error) ? error.response?.data : undefined;
        toast.error(respuesta?.message ?? respuesta?.mensaje ?? "Error al iniciar sesión");
    }
   };

    return (
        <div className={styles.pagina}>
            <div className={styles.tarjeta}>
                <header className={styles.marca}>
                    <span className={styles.logo}><HeartPulseFill size={30} aria-hidden="true" /></span>
                    <h1 className={styles.nombre}>Salita Municipal</h1>
                    <p className={styles.subtitulo}>Ingreso al sistema</p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className={styles.campo}>
                        <InputGroup className={styles.grupo}>
                            <InputGroup.Text><Envelope aria-hidden="true" /></InputGroup.Text>
                            <Form.Control
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                aria-label="Email"
                                isInvalid={Boolean(errors.email)}
                                {...register('email')}
                            />
                        </InputGroup>
                        {errors.email && <small className={styles.error}>{errors.email.message}</small>}
                    </div>

                    <div className={styles.campo}>
                        <InputGroup className={styles.grupo}>
                            <InputGroup.Text><Person aria-hidden="true" /></InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Usuario"
                                autoComplete="username"
                                aria-label="Usuario"
                                isInvalid={Boolean(errors.user)}
                                {...register('user')}
                            />
                        </InputGroup>
                        {errors.user && <small className={styles.error}>{errors.user.message}</small>}
                    </div>

                    <div className={styles.campo}>
                        <InputGroup className={styles.grupo}>
                            <InputGroup.Text><Lock aria-hidden="true" /></InputGroup.Text>
                            <Form.Control
                                type={verPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                autoComplete="current-password"
                                aria-label="Contraseña"
                                isInvalid={Boolean(errors.password)}
                                {...register('password')}
                            />
                            <Button
                                type="button"
                                onClick={() => setVerPassword((v) => !v)}
                                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                aria-pressed={verPassword}
                                title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {verPassword ? <EyeSlash /> : <Eye />}
                            </Button>
                        </InputGroup>
                        {errors.password && <small className={styles.error}>{errors.password.message}</small>}
                    </div>

                    <Button type="submit" className={`${formulario.botonPrincipal} ${styles.enviar}`} disabled={isSubmitting}>
                        {isSubmitting ? "Ingresando..." : "Ingresar"}
                    </Button>
                    <Link to="/" className={styles.volver}>
                        <ArrowLeft size={14} aria-hidden="true" /> Volver al inicio
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default Login;