import { Rol } from '../../types/Rol.types';

export const rutaInicio = (rol: Rol): string => {
  if (rol === 'PACIENTE') return '/pacientes/inicio';
  if (rol === 'MEDICO') return '/inicio';
  return '/recepcion';
};

// Cierra la sesión: el token es lo único que se guarda
export const cerrarSesion = () => localStorage.removeItem('token');

interface PayloadToken { rol?: Rol; exp?: number; ingreso?: 'rapido'; nombre?: string; apellido?: string }

const leerPayload = (): PayloadToken | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: PayloadToken = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const obtenerRol = (): Rol | null => leerPayload()?.rol ?? null;

// true si entró con el ingreso rápido (sin usuario y contraseña): no puede ver ni cancelar turnos
export const esIngresoRapido = (): boolean => leerPayload()?.ingreso === 'rapido';

// "Nombre Apellido" de quien está conectado, si el token lo trae (se agrega en el login). Si no, null.
export const obtenerNombre = (): string | null => {
  const payload = leerPayload();
  const nombre = [payload?.nombre, payload?.apellido].filter(Boolean).join(' ').trim();
  return nombre === '' ? null : nombre;
};