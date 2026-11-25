import axios from 'axios';

interface CuerpoError { message?: string; mensaje?: string }

// Lee el mensaje venga como "message" (ingreso rápido) o como "mensaje" (respuestaEstandar)
export const obtenerMensajeError = (error: unknown): string => {
    if (axios.isAxiosError<CuerpoError>(error)) {
        return error.response?.data?.message ?? error.response?.data?.mensaje ?? 'Error del servidor';
    }
    return 'El servidor está apagado o no responde';
};