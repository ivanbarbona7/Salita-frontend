export const formatearTurno = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

export const etiquetaDia = (dia: string) =>
  new Date(`${dia}T00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

const dosDigitos = (n: number) => String(n).padStart(2, "0");

// Si la fecha viene sin hora ("2026-11-12") se toma como día local, sin corrimiento por zona horaria
export const aFecha = (iso: string): Date =>
    iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);

// "2026-11-12" en hora local
export const claveLocal = (fecha: Date): string =>
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

export const diaDelTurno = (iso: string): string => claveLocal(aFecha(iso));

export const sumarDias = (clave: string, dias: number): string => {
    const fecha = new Date(`${clave}T00:00:00`);
    fecha.setDate(fecha.getDate() + dias);
    return claveLocal(fecha);
};

export const formatearHora = (iso: string): string =>
    aFecha(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export const formatearFechaCorta = (iso: string): string =>
    aFecha(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const tituloDia = (clave: string): string =>
    new Date(`${clave}T00:00:00`).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });