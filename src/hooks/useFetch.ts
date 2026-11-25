import { useState, useEffect, useCallback } from 'react';
import clientesAxios from '../config/axios';
import { toast } from 'sonner';

export const useFetch = <T,>(endpoint: string | null) => {
    const [response, setResponse] = useState<{ data: T } | null>(null);
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(endpoint !== null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (endpoint === null) return;
        setIsLoading(true);
        try {
            const respuesta = await clientesAxios.get<{ data: T }>(endpoint);
            setResponse(respuesta.data);
            setData(respuesta.data.data);
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    return { response, data, setData, isLoading, error, refetch: fetchData };
};