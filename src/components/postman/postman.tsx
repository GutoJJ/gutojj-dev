import GnomeWindow from '../generic_window/window';
import './postman.css'

interface PostmanProps {
    onClose?: () => void;
}

function Postman({ onClose }: PostmanProps) {
    return (
        <GnomeWindow
            title="Postman"
            width={800}
            onClose={onClose}
            showExtraControls={false}
        >   
            <div className="postm-body">
               🚧 | Atualmente em construção | 🚧
            </div>
        </GnomeWindow>
    );
}

export default Postman;