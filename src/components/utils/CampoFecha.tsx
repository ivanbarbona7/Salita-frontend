import { useState } from 'react';
import { CalendarEvent, ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import { diaDeSemanaLunes, hoyDia } from './fechaDia';
import styles from './CampoFecha.module.scss';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
// La semana empieza en lunes
const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const dos = (n: number) => String(n).padStart(2, '0');
const clave = (anio: number, mes: number, dia: number) => `${anio}-${dos(mes + 1)}-${dos(dia)}`;
const diasEnMes = (anio: number, mes: number) => new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
// "2026-11-23" -> "23/11/2026"
const formatear = (dia: string) => (dia ? `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}` : '');

interface Props {
    // Día elegido como AAAA-MM-DD ('' = sin elegir)
    valor: string;
    onChange: (dia: string) => void;
    min?: string;
    max?: string;
    id?: string;
    disabled?: boolean;
    ariaLabel?: string;
    // Clases del botón que muestra la fecha (por defecto, el aspecto de un input de Bootstrap)
    className?: string;
    // Muestra el botón "Borrar"
    permitirVacio?: boolean;
    // Día en el que abre el calendario cuando todavía no hay fecha elegida (por defecto, hoy)
    vistaInicial?: string;
    // Años del más nuevo al más viejo (útil para fechas de nacimiento)
    anioDescendente?: boolean;
}

// Calendario en español, sin dependencias. Trabaja con días "AAAA-MM-DD" (igual que el resto de la app).
const CampoFecha = ({ valor, onChange, min, max, id, disabled, ariaLabel, className = 'form-control', permitirVacio, vistaInicial, anioDescendente }: Props) => {
    const hoy = hoyDia();
    const [abierto, setAbierto] = useState(false);
    // Mes que se está mirando (se reinicia al abrir)
    const [vista, setVista] = useState(() => {
        const base = valor || vistaInicial || hoy;
        return { anio: Number(base.slice(0, 4)), mes: Number(base.slice(5, 7)) - 1 };
    });

    const abrir = () => {
        const base = valor || vistaInicial || hoy;
        setVista({ anio: Number(base.slice(0, 4)), mes: Number(base.slice(5, 7)) - 1 });
        setAbierto(true);
    };

    const fueraDeRango = (dia: string) => (min !== undefined && dia < min) || (max !== undefined && dia > max);

    const elegir = (dia: string) => {
        onChange(dia);
        setAbierto(false);
    };

    const moverMes = (delta: number) => {
        const total = vista.anio * 12 + vista.mes + delta;
        setVista({ anio: Math.floor(total / 12), mes: total % 12 });
    };

    const anioActual = Number(hoy.slice(0, 4));
    const anioMin = min ? Number(min.slice(0, 4)) : anioActual - 100;
    const anioMax = max ? Number(max.slice(0, 4)) : anioActual + 5;
    const anios = Array.from({ length: anioMax - anioMin + 1 }, (_, i) => (anioDescendente ? anioMax - i : anioMin + i));

    const primerDia = clave(vista.anio, vista.mes, 1);
    const huecos = diaDeSemanaLunes(primerDia);
    const total = diasEnMes(vista.anio, vista.mes);
    const hayAnterior = !min || clave(vista.anio, vista.mes, 1) > min;
    const haySiguiente = !max || clave(vista.anio, vista.mes, total) < max;

    return (
        <div className={styles.contenedor} onKeyDown={(e) => e.key === 'Escape' && setAbierto(false)}>
            <button
                type="button"
                id={id}
                className={`${className} ${styles.boton}`}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="dialog"
                aria-expanded={abierto}
                onClick={() => (abierto ? setAbierto(false) : abrir())}
            >
                <span className={valor ? undefined : styles.vacio}>{valor ? formatear(valor) : 'dd/mm/aaaa'}</span>
                <CalendarEvent size={16} aria-hidden />
            </button>

            {abierto && (
                <>
                    {/* Cubre la pantalla: tocar afuera cierra el calendario */}
                    <div className={styles.fondo} onClick={() => setAbierto(false)} aria-hidden />

                    <div className={styles.calendario} role="dialog" aria-label="Elegir fecha">
                        <div className={styles.encabezado}>
                            <button type="button" className={styles.flecha} onClick={() => moverMes(-1)} disabled={!hayAnterior} aria-label="Mes anterior">
                                <ChevronLeft size={16} />
                            </button>
                            <select
                                className={styles.selector}
                                value={vista.mes}
                                aria-label="Mes"
                                onChange={(e) => setVista({ ...vista, mes: Number(e.target.value) })}
                            >
                                {MESES.map((nombre, i) => (
                                    <option key={nombre} value={i}>{nombre}</option>
                                ))}
                            </select>
                            <select
                                className={styles.selector}
                                value={vista.anio}
                                aria-label="Año"
                                onChange={(e) => setVista({ ...vista, anio: Number(e.target.value) })}
                            >
                                {anios.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                            <button type="button" className={styles.flecha} onClick={() => moverMes(1)} disabled={!haySiguiente} aria-label="Mes siguiente">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className={styles.grilla}>
                            {DIAS.map((d) => (
                                <span key={d} className={styles.diaSemana}>{d}</span>
                            ))}
                            {Array.from({ length: huecos }, (_, i) => (
                                <span key={`h${i}`} />
                            ))}
                            {Array.from({ length: total }, (_, i) => {
                                const dia = clave(vista.anio, vista.mes, i + 1);
                                const clases = [styles.dia, dia === valor ? styles.elegido : '', dia === hoy ? styles.hoy : ''].join(' ');
                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        className={clases}
                                        disabled={fueraDeRango(dia)}
                                        aria-pressed={dia === valor}
                                        aria-label={`${i + 1} de ${MESES[vista.mes]} de ${vista.anio}`}
                                        onClick={() => elegir(dia)}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.pie}>
                            {permitirVacio ? (
                                <button type="button" className={styles.accion} onClick={() => elegir('')}>Borrar</button>
                            ) : (
                                <span />
                            )}
                            <button type="button" className={styles.accion} disabled={fueraDeRango(hoy)} onClick={() => elegir(hoy)}>
                                Hoy
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CampoFecha;