import { Navigate, Outlet } from 'react-router-dom';
import { obtenerRol, rutaInicio } from './utils/sesion';
import { Rol } from '../types/Rol.types';

interface Props { roles: Rol[] }

export const RutaProtegida = ({ roles }: Props) => {
  const rol = obtenerRol();
  if (!rol) return <Navigate to="/" replace />;
  if (!roles.includes(rol)) return <Navigate to={rutaInicio(rol)} replace />;
  return <Outlet />;
};