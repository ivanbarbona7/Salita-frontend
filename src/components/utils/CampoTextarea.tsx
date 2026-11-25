import { get, type FieldError, type FieldErrors, type FieldValues, type Path, type UseFormRegister } from 'react-hook-form';
import styles from './Formulario.module.scss';

interface Props<T extends FieldValues> {
    register: UseFormRegister<T>;
    errores: FieldErrors<T>;
    name: Path<T>;
    etiqueta: string;
    ayuda?: string;
    placeholder?: string;
    filas?: number;
    maxLength?: number;
    ancho?: boolean;
}

// Etiqueta + área de texto + error, con el mismo aspecto que CampoFormulario.
const CampoTextarea = <T extends FieldValues>({
    register,
    errores,
    name,
    etiqueta,
    ayuda,
    placeholder,
    filas = 3,
    maxLength,
    ancho = true,
}: Props<T>) => {
    const error = get(errores, name) as FieldError | undefined;

    return (
        <div className={`${styles.campo} ${ancho ? styles.campoAncho : ''}`}>
            <label htmlFor={name} className={styles.label}>{etiqueta}</label>
            <textarea
                id={name}
                rows={filas}
                maxLength={maxLength}
                className={styles.campoInput}
                placeholder={placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${name}-error` : undefined}
                {...register(name)}
            />
            {ayuda && !error && <span className={styles.ayuda} style={{ margin: '6px 0 0' }}>{ayuda}</span>}
            {error && (
                <span id={`${name}-error`} className={styles.textError} role="alert">{error.message}</span>
            )}
        </div>
    );
};

export default CampoTextarea;