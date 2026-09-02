import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, LayoutGrid, Menu, X, Square } from 'lucide-react';
import './window.css';

interface GnomeWindowProps {
    title: string;
    subtitle?: string;
    width?: number;
    children: React.ReactNode;
    onClose?: () => void;
    showExtraControls?: boolean;
    allowFullscreen?: boolean;
    onMaximizeChange?: (isMaximized: boolean) => void;
}

function Window({
    title,
    subtitle,
    width = 640,
    children,
    onClose,
    showExtraControls = true,
    allowFullscreen = false,
    onMaximizeChange,
}: GnomeWindowProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const windowRef = useRef<HTMLDivElement | null>(null);
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const onMaximizeChangeRef = useRef(onMaximizeChange);
    useEffect(() => {
        onMaximizeChangeRef.current = onMaximizeChange;
    });

    useEffect(() => {
        onMaximizeChangeRef.current?.(isMaximized);
    }, [isMaximized]);

    const toggleMaximize = useCallback(() => {
        if (!allowFullscreen) return;
        setIsMaximized((prev) => !prev);
    }, [allowFullscreen]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (!allowFullscreen || (e.target as HTMLElement).closest('.gwin-btn')) return;
        toggleMaximize();
    }, [allowFullscreen, toggleMaximize]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isMaximized || (e.target as HTMLElement).closest('.gwin-btn')) return;

        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: position.x,
            originY: position.y,
        };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [position, isMaximized]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragState.current || isMaximized) return;

        const rect = windowRef.current?.getBoundingClientRect();
        // Calculate current top edge of the window element relative to viewport
        // If rect is present, currentTop is rect.top
        // We want currentTop + (newY - position.y) >= 33 (topBar height)
        // Therefore, (newY - position.y) >= 33 - currentTop
        // => newY >= position.y + (33 - currentTop)
        const currentTop = rect ? rect.top : 33;
        const minY = position.y + (33 - currentTop);

        const maxY = window.innerHeight / 2 - 40;
        const maxX = window.innerWidth / 2 - 40;
        const minX = -(window.innerWidth / 2 - 40);

        const newX = dragState.current.originX + (e.clientX - dragState.current.startX);
        const newY = dragState.current.originY + (e.clientY - dragState.current.startY);

        setPosition({
            x: Math.min(maxX, Math.max(minX, newX)),
            y: Math.max(minY, Math.min(maxY, newY)),
        });
    }, [isMaximized, position]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragState.current = null;
        setDragging(false);
        if ((e.target as HTMLElement).releasePointerCapture) {
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        }
    }, []);

    return (
        <div
            ref={windowRef}
            className={`gwin-window ${isMaximized ? 'maximized' : ''}`}
            style={{
                width: isMaximized ? undefined : width,
                transform: isMaximized
                    ? 'translate(0, 0) scale(1)'
                    : `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.88})`,
                opacity: mounted ? 1 : 0,
                filter: mounted ? 'blur(0px)' : 'blur(10px)',
                transition: dragging
                    ? 'none'
                    : 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), width 460ms cubic-bezier(0.16, 1, 0.3, 1), height 460ms cubic-bezier(0.16, 1, 0.3, 1), top 460ms cubic-bezier(0.16, 1, 0.3, 1), left 460ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1), filter 380ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <div
                className="gwin-titlebar"
                onDoubleClick={handleDoubleClick}
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
                    {allowFullscreen && (
                        <button
                            type="button"
                            className="gwin-btn gwin-btn-icon"
                            aria-label={isMaximized ? "Restaurar" : "Tela Cheia"}
                            onClick={toggleMaximize}
                        >
                            <Square size={13} strokeWidth={2.2} />
                        </button>
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
