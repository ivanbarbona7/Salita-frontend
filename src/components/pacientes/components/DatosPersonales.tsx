import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import CampoFormulario from '../../utils/CampoFormulario';
import CampoFecha from '../../utils/CampoFecha';
import { hoyDia } from '../../utils/fechaDia';
import type { ICrearPacienteDTO } from '../../../types/Paciente.type';

interface Props {
    register: UseFormRegister<ICrearPacienteDTO>;
    control: Control<ICrearPacienteDTO>;
    errores: FieldErrors<ICrearPacienteDTO>;
    styles: Record<string, string>;
    dniSoloLectura?: boolean;
    emailSoloLectura?: boolean;
}

const DatosPersonales = ({ register, control, errores, styles, dniSoloLectura = false, emailSoloLectura = false }: Props) => {
    const base = { register, errores };
    const hoy = hoyDia();
    // Nadie nace en el futuro ni tiene más de 120 años
    const masAntigua = `${Number(hoy.slice(0, 4)) - 120}${hoy.slice(4)}`;
    // El calendario abre unos 30 años atrás: más cerca de lo que suele cargarse que "hoy"
    const vistaInicial = `${Number(hoy.slice(0, 4)) - 30}${hoy.slice(4)}`;

    return (
        <fieldset className={styles.seccion}>
            <legend className={styles.seccionTitulo}>Datos personales</legend>
            <div className={styles.grilla}>
                <CampoFormulario {...base} name="nombre" etiqueta="Nombre" placeholder="Juan" autoComplete="off" />
                <CampoFormulario {...base} name="apellido" etiqueta="Apellido" placeholder="Pérez" autoComplete="off" />
                <CampoFormulario
                    {...base}
                    name="dni"
                    etiqueta="DNI"
                    inputMode="numeric"
                    placeholder="Sin puntos"
                    soloLectura={dniSoloLectura}
                />
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
                                max={hoy}
                                vistaInicial={vistaInicial}
                                anioDescendente
                            />
                        )}
                    />
                    {errores.fechaNacimiento && (
                        <span className={styles.textError} role="alert">{errores.fechaNacimiento.message}</span>
                    )}
                </div>
                <CampoFormulario
                    {...base}
                    name="email"
                    etiqueta="Email"
                    type="email"
                    inputMode="email"
                    placeholder="ejemplo@gmail.com"
                    soloLectura={emailSoloLectura}
                />
            </div>
        </fieldset>
    );
};

export default DatosPersonales;