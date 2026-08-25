import { useState, useRef, useCallback, useEffect } from 'react';
import { SquarePlus, LayoutGrid, Menu, X } from 'lucide-react';
import './terminal.css';

interface TerminalProps {
    user?: string;
    host?: string;
    cwd?: string;
    onClose?: () => void;
}

// Janela de terminal estilo GNOME: arrastável pela barra de título,
// com a animação de entrada (fade + scale) igual à do gnome-shell ao abrir uma janela.
function Terminal({
    user = 'gutojf',
    host = 'fedora',
    cwd = '~',
    onClose,
}: TerminalProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    // Dispara a animação de entrada assim que o componente monta.
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Evita iniciar arraste ao clicar nos botões da barra de título.
        if ((e.target as HTMLElement).closest('.gterm-btn')) return;

        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: position.x,
            originY: position.y,
        };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [position]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragState.current) return;
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        setPosition({
            x: dragState.current.originX + dx,
            y: dragState.current.originY + dy,
        });
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragState.current = null;
        setDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    return (
        <div
            className="gterm-window"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.92})`,
                opacity: mounted ? 1 : 0,
                transition: dragging
                    ? 'none'
                    : 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
        >
            <div
                className="gterm-titlebar"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="gterm-titlebar-left">
                    <button type="button" className="gterm-btn gterm-btn-icon" aria-label="Nova aba">
                        <SquarePlus size={16} strokeWidth={2.4} />
                    </button>
                </div>

                <div className="gterm-titlebar-center">
                    <span className="gterm-title">{user}@{host}:{cwd}</span>
                    <span className="gterm-subtitle">{cwd}</span>
                </div>

                <div className="gterm-titlebar-right">
                    <button type="button" className="gterm-btn gterm-btn-icon" aria-label="Visão geral">
                        <LayoutGrid size={16} strokeWidth={2.4} />
                    </button>
                    <button type="button" className="gterm-btn gterm-btn-icon" aria-label="Menu">
                        <Menu size={16} strokeWidth={2.4} />
                    </button>
                    <button
                        type="button"
                        className="gterm-btn gterm-btn-close"
                        aria-label="Fechar"
                        onClick={onClose}
                    >
                        <X size={14} strokeWidth={2.6} />
                    </button>
                </div>
            </div>

            <div className="gterm-body">
                <div className="gterm-line">
                    <span className="gterm-prompt">{user}@{host}</span>
                    <span className="gterm-colon">:</span>
                    <span className="gterm-path">{cwd}</span>
                    <span className="gterm-dollar">$</span>
                    <span className="gterm-cursor" />
                </div>
            </div>

            
        </div>
    );
}

export default Terminal;