import { useState, type ReactNode } from 'react';
import { Button, Modal } from 'react-bootstrap';

interface Props {
    show: boolean;
    titulo: string;
    mensaje: ReactNode;
    textoConfirmar?: string;
    textoCancelar?: string;
    variante?: 'danger' | 'primary' | 'success' | 'warning';
    onConfirmar: () => Promise<void> | void;
    onCancelar: () => void;
}

// Confirmación reutilizable (eliminar, cancelar, desactivar...). Mientras se ejecuta la acción,
// los botones quedan deshabilitados para evitar un doble clic.
const ModalConfirmar = ({
    show,
    titulo,
    mensaje,
    textoConfirmar = 'Sí, confirmar',
    textoCancelar = 'Cancelar',
    variante = 'danger',
    onConfirmar,
    onCancelar,
}: Props) => {
    const [enCurso, setEnCurso] = useState(false);

    const confirmar = async () => {
        setEnCurso(true);
        try {
            await onConfirmar();
        } finally {
            setEnCurso(false);
        }
    };

    return (
        <Modal show={show} onHide={enCurso ? undefined : onCancelar} centered>
            <Modal.Header closeButton={!enCurso}>
                <Modal.Title className="h5">{titulo}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{mensaje}</Modal.Body>
            <Modal.Footer className="flex-column flex-sm-row">
                <Button variant="secondary" className="w-100 w-sm-auto" disabled={enCurso} onClick={onCancelar}>
                    {textoCancelar}
                </Button>
                <Button variant={variante} className="w-100 w-sm-auto" disabled={enCurso} onClick={confirmar}>
                    {enCurso ? 'Procesando...' : textoConfirmar}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalConfirmar;