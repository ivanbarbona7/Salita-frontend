import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import {
    diaDeSemanaLunes,
    diasDelMes,
    diasDelRango,
    hoyDia,
    nombreMes,
    sumarDias,
    sumarMeses,
    formatoDia,
} from '../utils/fechaDia';
import { MAX_DIAS_ADELANTE } from '../../types/Rango.types';

export interface Marcado {
    desde: string;
    hasta: string;
    tipo: 'ausencia' | 'cierre';
    etiqueta: string;
}

export interface Seleccion {
    desde: string;
    hasta: string;
}

interface Props {
    marcados: Marcado[];
    seleccion: Seleccion | null;
    maxDias: number;
    onSeleccionar: (seleccion: Seleccion | null) => void;
}

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const COLOR = {
    ausencia: { fondo: 'var(--bs-danger-bg-subtle)', borde: 'var(--bs-danger-border-subtle)' },
    cierre: { fondo: 'var(--bs-warning-bg-subtle)', borde: 'var(--bs-warning-border-subtle)' },
};

// Almanaque mensual para elegir un rango de días (hasta `maxDias` seguidos).
// Primer clic: el día de inicio. Segundo clic: el último día. Un tercer clic empieza de nuevo.
const Almanaque = ({ marcados, seleccion, maxDias, onSeleccionar }: Props) => {
    const hoy = hoyDia();
    const limite = sumarDias(hoy, MAX_DIAS_ADELANTE);
    const [mes, setMes] = useState(() => hoy.slice(0, 7));

    const primerDia = `${mes}-01`;
    const huecos = diaDeSemanaLunes(primerDia);
    const dias = Array.from({ length: diasDelMes(mes) }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);

    const marcaDe = (dia: string) => marcados.find((m) => dia >= m.desde && dia <= m.hasta);

    const elegir = (dia: string) => {
        if (!seleccion || seleccion.desde !== seleccion.hasta) {
            onSeleccionar({ desde: dia, hasta: dia });
        } else if (dia < seleccion.desde || diasDelRango(seleccion.desde, dia) > maxDias) {
            onSeleccionar({ desde: dia, hasta: dia }); // vuelve a empezar desde este día
        } else {
            onSeleccionar({ desde: seleccion.desde, hasta: dia });
        }
    };

    const puedeAtras = mes > hoy.slice(0, 7);
    const puedeAdelante = mes < limite.slice(0, 7);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
                <Button variant="outline-secondary" size="sm" disabled={!puedeAtras} onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">
                    <ChevronLeft />
                </Button>
                <strong className="text-capitalize">{nombreMes(mes)}</strong>
                <Button variant="outline-secondary" size="sm" disabled={!puedeAdelante} onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">
                    <ChevronRight />
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }} role="grid" aria-label={`Almanaque de ${nombreMes(mes)}`}>
                {DIAS.map((d, i) => (
                    <div key={i} className="text-center small text-muted" role="columnheader">{d}</div>
                ))}
                {Array.from({ length: huecos }, (_, i) => <div key={`h${i}`} />)}
                {dias.map((dia) => {
                    const deshabilitado = dia < hoy || dia > limite;
                    const marca = marcaDe(dia);
                    const elegido = seleccion !== null && dia >= seleccion.desde && dia <= seleccion.hasta;
                    const esHoy = dia === hoy;
                    return (
                        <button
                            key={dia}
                            type="button"
                            role="gridcell"
                            disabled={deshabilitado}
                            aria-pressed={elegido}
                            aria-label={`${formatoDia(dia)}${marca ? `, ${marca.etiqueta}` : ''}`}
                            title={marca?.etiqueta}
                            onClick={() => elegir(dia)}
                            className="btn btn-sm p-0"
                            style={{
                                height: 38,
                                background: elegido ? 'var(--bs-primary)' : marca ? COLOR[marca.tipo].fondo : 'transparent',
                                color: elegido ? '#fff' : undefined,
                                border: `1px solid ${elegido ? 'var(--bs-primary)' : marca ? COLOR[marca.tipo].borde : 'var(--bs-border-color)'}`,
                                fontWeight: esHoy ? 700 : 400,
                                textDecoration: esHoy ? 'underline' : undefined,
                                opacity: deshabilitado ? 0.35 : 1,
                            }}
                        >
                            {Number(dia.slice(8))}
                        </button>
                    );
                })}
            </div>

            <div className="d-flex flex-wrap gap-3 small text-muted mt-3">
                <span><span className="d-inline-block me-1 rounded" style={{ width: 12, height: 12, background: 'var(--bs-primary)' }} />Elegido</span>
                <span><span className="d-inline-block me-1 rounded" style={{ width: 12, height: 12, background: COLOR.ausencia.fondo, border: `1px solid ${COLOR.ausencia.borde}` }} />Ausencia cargada</span>
                <span><span className="d-inline-block me-1 rounded" style={{ width: 12, height: 12, background: COLOR.cierre.fondo, border: `1px solid ${COLOR.cierre.borde}` }} />Consultorio cerrado</span>
            </div>
        </div>
    );
};

export default Almanaque;