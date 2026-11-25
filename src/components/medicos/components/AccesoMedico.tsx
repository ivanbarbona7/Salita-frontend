import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ICrearMedicoInput } from '../../../types/Medico.types';
import CampoFormulario from '../../utils/CampoFormulario';

interface AccesoMedicoProps {
    register: UseFormRegister<ICrearMedicoInput>;
    errores: FieldErrors<ICrearMedicoInput>;
    styles: Record<string, string>;
    esEdicion: boolean;
}

const AccesoMedico = ({ register, errores, styles, esEdicion }: AccesoMedicoProps) => {
    const base = { register, errores, styles };

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Acceso al sistema</legend>
            <p className={styles.ayuda}>
                {esEdicion
                    ? 'Solo el administrador puede cambiar estos datos. Dejá la contraseña vacía si no querés cambiarla.'
                    : 'El médico ingresará al sistema con su email, este usuario y esta contraseña.'}
            </p>
            <div className={styles.grilla}>
                <CampoFormulario {...base} name="acceso.user" etiqueta="Usuario" autoComplete="off" />
                <CampoFormulario
                    {...base}
                    name="acceso.password"
                    etiqueta="Contraseña"
                    type="password"
                    autoComplete="new-password" // evita que el navegador complete con la contraseña de quien está logueado
                    placeholder={esEdicion ? 'Dejar vacía para no cambiarla' : 'Mínimo 8 caracteres'}
                />
            </div>
        </fieldset>
    );
};

export default AccesoMedico;