import { hoyDia } from './fechaDia';

// Todo con días "AAAA-MM-DD" (hora argentina), sin zonas horarias de por medio.

// "2026-11-23" -> "23/11/2026"
export const formatoNacimiento = (nacimiento: string): string =>
    `${nacimiento.slice(8, 10)}/${nacimiento.slice(5, 7)}/${nacimiento.slice(0, 4)}`;

// Años cumplidos a la fecha dada (por defecto, hoy)
export const calcularEdad = (nacimiento: string, hoy: string = hoyDia()): number => {
    const anios = Number(hoy.slice(0, 4)) - Number(nacimiento.slice(0, 4));
    const mes = Number(hoy.slice(5, 7)) - Number(nacimiento.slice(5, 7));
    const dia = Number(hoy.slice(8, 10)) - Number(nacimiento.slice(8, 10));
    return mes < 0 || (mes === 0 && dia < 0) ? anios - 1 : anios;
};

// "34 años"; para menores de 2 años se cuenta en meses ("8 meses"), que es lo que importa en pediatría
export const textoEdad = (nacimiento: string, hoy: string = hoyDia()): string => {
    const anios = calcularEdad(nacimiento, hoy);
    if (anios >= 2) return `${anios} años`;

    let meses = (Number(hoy.slice(0, 4)) - Number(nacimiento.slice(0, 4))) * 12 + Number(hoy.slice(5, 7)) - Number(nacimiento.slice(5, 7));
    if (Number(hoy.slice(8, 10)) < Number(nacimiento.slice(8, 10))) meses -= 1;
    if (meses < 1) return 'menos de 1 mes';
    return meses < 12 ? `${meses} ${meses === 1 ? 'mes' : 'meses'}` : `${anios} ${anios === 1 ? 'año' : 'años'}`;
};