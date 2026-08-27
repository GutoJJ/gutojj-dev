import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, LayoutGrid, Menu, X } from 'lucide-react';
import './window.css'

interface GnomeWindowProps {
    title: string;
    subtitle?: string;
    width?: number;
    children: React.ReactNode;
    onClose?: () => void;
    showExtraControls?: boolean;
}


function Window({
    title,
    subtitle,
    width = 640,
    children,
    onClose,
    showExtraControls = true,
}: GnomeWindowProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.gwin-btn')) return;

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
        setPosition({
            x: dragState.current.originX + (e.clientX - dragState.current.startX),
            y: dragState.current.originY + (e.clientY - dragState.current.startY),
        });
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragState.current = null;
        setDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    return (
        <div
            className="gwin-window"
            style={{
                width,
                transform: `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.94})`,
                opacity: mounted ? 1 : 0,
                transition: dragging
                    ? 'none'
                    : 'opacity 220ms cubic-bezier(0.22,1,0.36,1), transform 220ms cubic-bezier(0.22,1,0.36,1)',
            }}
        >
            <div
                className="gwin-titlebar"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="gwin-titlebar-side">
                    {showExtraControls && (
                        <button type="button" className="gwin-btn gwin-btn-icon" aria-label="Nova aba">
                            <Plus size={15} strokeWidth={2.4} />
                        </button>
                    )}
                </div>

                <div className="gwin-titlebar-center">
                    <span className="gwin-title">{title}</span>
                    {subtitle && <span className="gwin-subtitle">{subtitle}</span>}
                </div>

                <div className="gwin-titlebar-side gwin-titlebar-side--right">
                    {showExtraControls && (
                        <>
                            <button type="button" className="gwin-btn gwin-btn-icon" aria-label="Visão geral">
                                <LayoutGrid size={15} strokeWidth={2.4} />
                            </button>
                            <button type="button" className="gwin-btn gwin-btn-icon" aria-label="Menu">
                                <Menu size={15} strokeWidth={2.4} />
                            </button>
                        </>
                    )}
                    <button type="button" className="gwin-btn gwin-btn-close" aria-label="Fechar" onClick={onClose}>
                        <X size={13} strokeWidth={2.6} />
                    </button>
                </div>
            </div>

            <div className="gwin-body">{children}</div>

        </div>
    );
}

export default Window;
