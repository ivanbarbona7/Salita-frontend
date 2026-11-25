import { useState, type ComponentProps } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

type Props = Omit<ComponentProps<typeof Form.Control>, 'type'> & {
    // Si se pasa, el mensaje de error se muestra debajo (dentro del grupo, que es donde Bootstrap lo permite)
    error?: string | undefined;
};

// Campo de contraseña con el ojito para verla u ocultarla. Se usa igual que <Form.Control>,
// incluso con {...register('campo')}. La contraseña siempre arranca oculta.
const InputPassword = ({ error, ...props }: Props) => {
    const [ver, setVer] = useState(false);

    return (
        <InputGroup hasValidation>
            <Form.Control {...props} type={ver ? 'text' : 'password'} />
            <Button
                type="button"
                variant="outline-secondary"
                onClick={() => setVer((v) => !v)}
                aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={ver}
                title={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {ver ? <EyeSlash /> : <Eye />}
            </Button>
            {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
        </InputGroup>
    );
};

export default InputPassword;