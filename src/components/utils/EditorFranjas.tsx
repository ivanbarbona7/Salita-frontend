import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Alert, Button } from 'react-bootstrap';
import { DIAS_LABORALES, DIAS_SEMANA } from '../../types/Horario.types';
import styles from './Formulario.module.scss';

interface CampoFranja {
    id: string;
    diaSemana: number;
}

type CampoHora = 'desde' | 'hasta';

interface EditorFranjasProps {
    franjas: CampoFranja[]; // los "fields" de useFieldArray
    registrarHora: (index: number, campo: CampoHora) => UseFormRegisterReturn;
    errorHora: (index: number, campo: CampoHora) => string | undefined;
    onAgregar: (diaSemana: number, esPrimera: boolean) => void;
    onQuitar: (index: number) => void;
    onCopiarALaborales: (diaSemana: number) => void;
    errorGeneral?: string;
    // Contenido extra al final de cada franja (por ejemplo, el consultorio en el horario de un médico)
    renderExtra?: (index: number) => ReactNode;
}

// Editor semanal: una tarjeta por día con una o varias franjas (mañana y tarde).
// Es "tonto" a propósito: no sabe de qué formulario viene, lo maneja quien lo usa.
const EditorFranjas = ({
    franjas,
    registrarHora,
    errorHora,
    onAgregar,
    onQuitar,
    onCopiarALaborales,
    errorGeneral,
    renderExtra,
}: EditorFranjasProps) => (
    <div className={styles.dias}>
        {errorGeneral && <Alert variant="danger" className="mb-0">{errorGeneral}</Alert>}

        {DIAS_SEMANA.map((dia) => {
            const delDia = franjas
                .map((campo, index) => ({ campo, index }))
                .filter(({ campo }) => campo.diaSemana === dia.valor);

            return (
                <div key={dia.valor} className={delDia.length > 0 ? styles.dia : `${styles.dia} ${styles.diaVacio}`}>
                    <div className={styles.diaEncabezado}>
                        <span className={styles.diaNombre}>
                            {dia.etiqueta}
                            {delDia.length === 0 && <span className={styles.diaSinHorario}>No atiende</span>}
                        </span>
                        <div className={styles.diaAcciones}>
                            {DIAS_LABORALES.includes(dia.valor) && delDia.length > 0 && (
                                <Button
                                    type="button"
                                    className={styles.botonChico}
                                    onClick={() => onCopiarALaborales(dia.valor)}
                                >
                                    Copiar a lunes–viernes
                                </Button>
                            )}
                            <Button
                                type="button"
                                className={styles.botonChico}
                                onClick={() => onAgregar(dia.valor, delDia.length === 0)}
                            >
                                + Agregar horario
                            </Button>
                        </div>
                    </div>

                    {delDia.map(({ campo, index }) => {
                        const errorDesde = errorHora(index, 'desde');
                        const errorHasta = errorHora(index, 'hasta');
                        return (
                            <div key={campo.id} className={styles.franja}>
                                <div className={styles.franjaHora}>
                                    <input
                                        type="time"
                                        className={styles.campoInput}
                                        aria-label={`${dia.etiqueta}: desde`}
                                        aria-invalid={errorDesde ? true : undefined}
                                        {...registrarHora(index, 'desde')}
                                    />
                                    {errorDesde && <span className={styles.textError} role="alert">{errorDesde}</span>}
                                </div>
                                <span className={styles.franjaSeparador}>a</span>
                                <div className={styles.franjaHora}>
                                    <input
                                        type="time"
                                        className={styles.campoInput}
                                        aria-label={`${dia.etiqueta}: hasta`}
                                        aria-invalid={errorHasta ? true : undefined}
                                        {...registrarHora(index, 'hasta')}
                                    />
                                    {errorHasta && <span className={styles.textError} role="alert">{errorHasta}</span>}
                                </div>
                                {renderExtra?.(index)}
                                <Button
                                    type="button"
                                    className={styles.botonChicoPeligro}
                                    aria-label={`Quitar horario del ${dia.etiqueta}`}
                                    onClick={() => onQuitar(index)}
                                >
                                    Quitar
                                </Button>
                            </div>
                        );
                    })}
                </div>
            );
        })}
    </div>
);

export default EditorFranjas;