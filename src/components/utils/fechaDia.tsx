// Operaciones con días en formato "AAAA-MM-DD" (hora argentina), sin zonas horarias de por medio.
const DIA_MS = 24 * 60 * 60 * 1000;

const aUTC = (dia: string) => Date.parse(`${dia}T00:00:00Z`);

export const hoyDia = (): string =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

export const sumarDias = (dia: string, n: number): string => new Date(aUTC(dia) + n * DIA_MS).toISOString().slice(0, 10);

// Cantidad de días entre dos fechas, contando ambas (mismo día = 1)
export const diasDelRango = (desde: string, hasta: string): number => Math.round((aUTC(hasta) - aUTC(desde)) / DIA_MS) + 1;

// 0 = lunes ... 6 = domingo (el almanaque empieza en lunes)
export const diaDeSemanaLunes = (dia: string): number => (new Date(aUTC(dia)).getUTCDay() + 6) % 7;

export const formatoDia = (dia: string): string =>
    new Date(`${dia}T12:00:00-03:00`).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
    });

export const formatoRango = (desde: string, hasta: string): string =>
    desde === hasta ? formatoDia(desde) : `del ${formatoDia(desde)} al ${formatoDia(hasta)}`;

export const nombreMes = (mes: string): string =>
    new Date(`${mes}-15T12:00:00-03:00`).toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
    });

// Suma meses a "AAAA-MM"
export const sumarMeses = (mes: string, n: number): string => {
    const [anio, m] = mes.split('-').map(Number) as [number, number];
    const total = anio * 12 + (m - 1) + n;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
};

export const diasDelMes = (mes: string): number => {
    const [anio, m] = mes.split('-').map(Number) as [number, number];
    return new Date(Date.UTC(anio, m, 0)).getUTCDate();
};