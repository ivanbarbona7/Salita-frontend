interface TelefonoParcial {
    codigoArea?: string | undefined;
    numero?: string | undefined;
}

// "(3777) 500032". Si falta el código de área (pacientes viejos de ingreso rápido) muestra solo el número,
// sin el "undefined" de antes.
export const formatearTelefono = (telefono?: TelefonoParcial | null): string => {
    if (!telefono?.numero) return '—';
    return telefono.codigoArea ? `(${telefono.codigoArea}) ${telefono.numero}` : telefono.numero;
};