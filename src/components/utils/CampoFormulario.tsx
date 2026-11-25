import { useState } from 'react';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import {
    get,
    type FieldError,
    type FieldErrors,
    type FieldValues,
    type Path,
    type UseFormRegister,
} from 'react-hook-form';
import styles from './Formulario.module.scss';

interface CampoFormularioProps<T extends FieldValues> {
    register: UseFormRegister<T>;
    errores: FieldErrors<T>;
    name: Path<T>;
    etiqueta: string;
    type?: 'text' | 'email' | 'password';
    placeholder?: string;
    autoComplete?: string;
    inputMode?: 'text' | 'numeric' | 'email';
    ancho?: boolean;
    soloLectura?: boolean;
    // id de un <datalist> con sugerencias
    list?: string;
    // Se ve en mayúsculas mientras se escribe (el valor real lo normaliza el esquema)
    mayusculas?: boolean;
}

// Etiqueta + input + mensaje de error, con el mismo aspecto en todos los formularios.
// Sirve para cualquier formulario de react-hook-form.
// "get" permite leer errores anidados como telefono.numero o direccion.calle.
const CampoFormulario = <T extends FieldValues>({
    register,
    errores,
    name,
    etiqueta,
    type = 'text',
    placeholder,
    autoComplete,
    inputMode,
    ancho = false,
    soloLectura = false,
    list,
    mayusculas = false,
}: CampoFormularioProps<T>) => {
    const error = get(errores, name) as FieldError | undefined;
    const [ver, setVer] = useState(false); // solo se usa en los campos de contraseña
    const esPassword = type === 'password';

    return (
        <div className={ancho ? `${styles.campo} ${styles.campoAncho}` : styles.campo}>
            <label htmlFor={name} className={styles.label}>
                {etiqueta}
            </label>
            <div style={esPassword ? { position: 'relative' } : undefined}>
                <input
                    id={name}
                    type={esPassword && ver ? 'text' : type}
                    className={styles.campoInput}
                    style={{ ...(esPassword ? { paddingRight: '2.75rem' } : {}), ...(mayusculas ? { textTransform: 'uppercase' as const } : {}) }}
                    readOnly={soloLectura}
                    list={list}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${name}-error` : undefined}
                    {...register(name)}
                />
                {esPassword && (
                    <button
                        type="button"
                        onClick={() => setVer((v) => !v)}
                        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={ver}
                        title={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            height: '100%',
                            width: '2.75rem',
                            border: 0,
                            background: 'transparent',
                            color: 'inherit',
                            opacity: 0.7,
                        }}
                    >
                        {ver ? <EyeSlash /> : <Eye />}
                    </button>
                )}
            </div>
            {error && (
                <span id={`${name}-error`} className={styles.textError} role="alert">
                    {error.message}
                </span>
            )}
        </div>
    );
};

export default CampoFormulario;