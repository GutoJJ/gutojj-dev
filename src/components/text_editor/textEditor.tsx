import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Plus,
    Menu,
    Info,
    X,
    Square,
    ChevronDown,
    FolderOpen,
    Save,
    FileText,
    Folder,
    ChevronRight,
    ChevronLeft,
    File,
} from 'lucide-react';
import {
    USER,
    getNodeAtPath,
    writeFileFs,
    notifyFsChange,
    saveFileSystem,
    subscribeFsChanges,
    type DirNode,
    type FsNode,
} from '../../fileSystemStore';
import './textEditor.css';

// ── File-picker dialog ────────────────────────────────────────────────────

interface FilePickerProps {
    mode: 'open' | 'save';
    defaultName?: string;
    onConfirm: (path: string[], name: string) => void;
    onCancel: () => void;
}

function FilePicker({ mode, defaultName = 'Novo documento.txt', onConfirm, onCancel }: FilePickerProps) {
    const [currentPath, setCurrentPath] = useState<string[]>(['home', USER]);
    const [navHistory, setNavHistory]   = useState<string[][]>([['home', USER]]);
    const [histIdx, setHistIdx]         = useState(0);
    const [selected, setSelected]       = useState<string | null>(null);
    const [saveName, setSaveName]       = useState(defaultName);
    const [, forceUpdate] = useState(0);

    // ── FS subscription ──────────────────────────────────────────────────
    useEffect(() => subscribeFsChanges(() => forceUpdate(n => n + 1)), []);

    const navigate = (path: string[]) => {
        const next = [...navHistory.slice(0, histIdx + 1), path];
        setNavHistory(next);
        setHistIdx(next.length - 1);
        setCurrentPath(path);
        setSelected(null);
    };

    const goBack = () => {
        if (histIdx > 0) {
            const idx = histIdx - 1;
            setHistIdx(idx);
            setCurrentPath(navHistory[idx]);
            setSelected(null);
        }
    };

    const node = getNodeAtPath(currentPath);
    type Entry = { name: string; node: FsNode };
    const entries: Entry[] = node?.type === 'dir'
        ? Object.entries(node.children)
            .map(([name, n]) => ({ name, node: n }))
            .sort((a, b) => {
                if (a.node.type !== b.node.type) return a.node.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name, 'pt-BR');
            })
        : [];

    const crumbs = currentPath.map((seg, i) => ({
        label: seg === USER && i === 1 ? 'Início' : seg,
        path: currentPath.slice(0, i + 1),
    }));

    const handleConfirm = () => {
        if (mode === 'open') {
            if (!selected) return;
            const sel = entries.find(e => e.name === selected);
            if (!sel || sel.node.type !== 'file') return;
            onConfirm([...currentPath, selected], selected);
        } else {
            const name = saveName.trim();
            if (!name) return;
            onConfirm(currentPath, name);
        }
    };

    const handleEntryClick = (e: Entry) => {
        if (e.node.type === 'dir') {
            navigate([...currentPath, e.name]);
        } else {
            setSelected(e.name);
            if (mode === 'save') setSaveName(e.name);
        }
    };

    return (
        <div className="fpicker-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="fpicker-dialog">
                {/* Header */}
                <div className="fpicker-header">
                    <span className="fpicker-title">
                        {mode === 'open' ? 'Abrir arquivo' : 'Salvar como'}
                    </span>
                    <button type="button" className="fpicker-close" onClick={onCancel}><X size={13} /></button>
                </div>

                {/* Nav */}
                <div className="fpicker-nav">
                    <button type="button" className="fpicker-nav-btn" onClick={goBack} disabled={histIdx <= 0}>
                        <ChevronLeft size={15} />
                    </button>
                    <div className="fpicker-breadcrumb">
                        {crumbs.map((c, i) => (
                            <span key={c.path.join('/')} className="fpicker-crumb">
                                {i > 0 && <ChevronRight size={11} style={{ opacity: 0.35 }} />}
                                <button type="button"
                                    className={`fpicker-crumb-btn ${i === crumbs.length - 1 ? 'active' : ''}`}
                                    onClick={() => navigate(c.path)}>
                                    {c.label}
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* File list */}
                <div className="fpicker-list">
                    {entries.length === 0 && (
                        <div className="fpicker-empty">Pasta vazia</div>
                    )}
                    {entries.map(e => (
                        <button key={e.name} type="button"
                            className={`fpicker-entry ${selected === e.name ? 'fpicker-entry--sel' : ''} ${mode === 'open' && e.node.type === 'dir' ? '' : ''}`}
                            onClick={() => handleEntryClick(e)}
                            onDoubleClick={() => {
                                if (e.node.type === 'dir') navigate([...currentPath, e.name]);
                                else if (mode === 'open') onConfirm([...currentPath, e.name], e.name);
                            }}>
                            {e.node.type === 'dir'
                                ? <Folder size={17} className="fpicker-icon fpicker-icon--dir" />
                                : <File size={17} className="fpicker-icon fpicker-icon--file" />}
                            <span className="fpicker-entry-name">{e.name}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="fpicker-footer">
                    {mode === 'save' && (
                        <input
                            className="fpicker-name-input"
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            placeholder="Nome do arquivo…"
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                            autoFocus
                        />
                    )}
                    <div className="fpicker-actions">
                        <button type="button" className="fpicker-btn fpicker-btn--cancel" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="button" className="fpicker-btn fpicker-btn--confirm"
                            onClick={handleConfirm}
                            disabled={mode === 'open' ? !selected : !saveName.trim()}>
                            {mode === 'open' ? 'Abrir' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── TextEditor props ──────────────────────────────────────────────────────

interface TextEditorProps {
    filePath: string[] | null;
    fileName: string;
    initialContent?: string;
    onClose?: () => void;
    onMaximizeChange?: (v: boolean) => void;
}

// ── Main Component ────────────────────────────────────────────────────────

export default function TextEditor({
    filePath,
    fileName: initialFileName,
    initialContent = '',
    onClose,
    onMaximizeChange,
}: TextEditorProps) {
    // Window state
    const [position, setPosition]     = useState({ x: 0, y: 0 });
    const [mounted, setMounted]       = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [dragging, setDragging]     = useState(false);
    const windowRef  = useRef<HTMLDivElement>(null);
    const dragState  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

    // Document state
    const [content, setContent]         = useState(initialContent);
    const [savedContent, setSavedContent] = useState(initialContent);
    const [fileName, setFileName]       = useState(initialFileName);
    const [currentPath, setCurrentPath] = useState<string[] | null>(filePath);
    const [cursorPos, setCursorPos]     = useState({ line: 1, col: 1 });
    const [picker, setPicker]           = useState<'open' | 'save' | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isDirty    = content !== savedContent;
    const lineCount  = content.split('\n').length;
    const displayTitle = isDirty ? `${fileName} *` : fileName;

    // ── Mount animation ──────────────────────────────────────────────────
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // ── Maximize callback ────────────────────────────────────────────────
    const onMaxRef = useRef(onMaximizeChange);
    useEffect(() => { onMaxRef.current = onMaximizeChange; });
    useEffect(() => { onMaxRef.current?.(isMaximized); }, [isMaximized]);

    // Re-sync when filePath prop changes
    useEffect(() => {
        setContent(initialContent);
        setSavedContent(initialContent);
        setFileName(initialFileName);
        setCurrentPath(filePath);
    }, [filePath?.join('/')]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Drag ─────────────────────────────────────────────────────────────
    const onTitlebarPointerDown = useCallback((e: React.PointerEvent) => {
        if (isMaximized || (e.target as HTMLElement).closest('.txed-btn')) return;
        dragState.current = { sx: e.clientX, sy: e.clientY, ox: position.x, oy: position.y };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [isMaximized, position]);

    const onTitlebarPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragState.current || isMaximized) return;
        const rect = windowRef.current?.getBoundingClientRect();
        const topEdge = rect ? rect.top : 33;
        const minY = position.y + (33 - topEdge);
        const maxY = window.innerHeight / 2 - 40;
        const maxX = window.innerWidth / 2 - 40;
        const minX = -(window.innerWidth / 2 - 40);
        setPosition({
            x: Math.min(maxX, Math.max(minX, dragState.current.ox + e.clientX - dragState.current.sx)),
            y: Math.max(minY, Math.min(maxY, dragState.current.oy + e.clientY - dragState.current.sy)),
        });
    }, [isMaximized, position]);

    const onTitlebarPointerUp = useCallback((e: React.PointerEvent) => {
        dragState.current = null;
        setDragging(false);
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /**/ }
    }, []);

    const toggleMaximize = useCallback(() => setIsMaximized(v => !v), []);

    const onTitlebarDblClick = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.txed-btn')) return;
        toggleMaximize();
    }, [toggleMaximize]);

    // ── Document actions ─────────────────────────────────────────────────
    const save = useCallback(() => {
        if (!currentPath) { setPicker('save'); return; }
        writeFileFs(currentPath, content);
        notifyFsChange();
        setSavedContent(content);
    }, [currentPath, content]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); return; }
        if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const next = content.substring(0, start) + '  ' + content.substring(end);
            setContent(next);
            requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
        }
    };

    const updateCursor = (el: HTMLTextAreaElement) => {
        const before = el.value.substring(0, el.selectionStart);
        const lines = before.split('\n');
        setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
    };

    // Open dialog confirm
    const handleOpenConfirm = (path: string[], name: string) => {
        const node = getNodeAtPath(path);
        if (node?.type !== 'file') return;
        setContent(node.content);
        setSavedContent(node.content);
        setFileName(name);
        setCurrentPath(path);
        setPicker(null);
    };

    // Save-as dialog confirm
    const handleSaveAsConfirm = (dirPath: string[], name: string) => {
        const fullPath = [...dirPath, name];
        // Ensure .txt extension if no extension given
        const finalName = name.includes('.') ? name : name + '.txt';
        const finalPath = [...dirPath, finalName];
        const dirNode = getNodeAtPath(dirPath) as DirNode | null;
        if (!dirNode || dirNode.type !== 'dir') return;
        dirNode.children[finalName] = { type: 'file', content };
        saveFileSystem();
        notifyFsChange();
        setCurrentPath(finalPath);
        setFileName(finalName);
        setSavedContent(content);
        setPicker(null);
        void fullPath; // suppress unused
    };

    // New document
    const newDocument = () => {
        setContent('');
        setSavedContent('');
        setFileName('Novo documento');
        setCurrentPath(null);
        setCursorPos({ line: 1, col: 1 });
    };

    // ── Window style ──────────────────────────────────────────────────────
    // ── Window style — same pattern as generic_window ────────────────────
    const windowStyle: React.CSSProperties = {
        width: isMaximized ? undefined : 680,
        height: isMaximized ? undefined : 520,
        transform: isMaximized
            ? 'translate(0, 0) scale(1)'
            : `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.88})`,
        opacity: mounted ? 1 : 0,
        filter: mounted ? 'blur(0px)' : 'blur(10px)',
        transition: dragging
            ? 'none'
            : 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), width 460ms cubic-bezier(0.16, 1, 0.3, 1), height 460ms cubic-bezier(0.16, 1, 0.3, 1), top 460ms cubic-bezier(0.16, 1, 0.3, 1), left 460ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1), filter 380ms cubic-bezier(0.16, 1, 0.3, 1)',
    };

    return (
        <>
            <div
                ref={windowRef}
                className={`txed-win ${isMaximized ? 'txed-win--max' : ''}`}
                style={windowStyle}
            >
                {/* ── Titlebar ── */}
                <div
                    className="txed-titlebar"
                    onPointerDown={onTitlebarPointerDown}
                    onPointerMove={onTitlebarPointerMove}
                    onPointerUp={onTitlebarPointerUp}
                    onDoubleClick={onTitlebarDblClick}
                >
                    {/* Left: Open / New */}
                    <div className="txed-titlebar-side">
                        <button type="button" className="txed-btn txed-btn--open"
                            onClick={() => setPicker('open')} aria-label="Abrir">
                            <FolderOpen size={14} />
                            <span>Abrir</span>
                            <ChevronDown size={12} style={{ opacity: 0.6 }} />
                        </button>
                        <button type="button" className="txed-btn txed-btn--icon"
                            onClick={newDocument} aria-label="Novo documento">
                            <Plus size={15} strokeWidth={2.3} />
                        </button>
                    </div>

                    {/* Center: doc title */}
                    <div className="txed-titlebar-center" style={{ pointerEvents: 'none' }}>
                        <FileText size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                        <span className="txed-doc-title">{displayTitle}</span>
                    </div>

                    {/* Right: actions + window controls */}
                    <div className="txed-titlebar-side txed-titlebar-side--right">
                        <button type="button" className="txed-btn txed-btn--icon" aria-label="Informações">
                            <Info size={14} strokeWidth={2} />
                        </button>
                        <button type="button" className="txed-btn txed-btn--icon" aria-label="Menu">
                            <Menu size={14} strokeWidth={2} />
                        </button>
                        <div className="txed-titlebar-divider" />
                        <button type="button" className="txed-btn txed-btn--icon"
                            onClick={toggleMaximize} aria-label="Tela cheia">
                            <Square size={12} strokeWidth={2.2} />
                        </button>
                        <button type="button" className="txed-btn txed-btn--close"
                            onClick={onClose} aria-label="Fechar">
                            <X size={13} strokeWidth={2.6} />
                        </button>
                    </div>
                </div>

                {/* ── Unsaved banner ── */}
                {isDirty && (
                    <div className="txed-banner">
                        <span>Alterações não salvas</span>
                        <div className="txed-banner-actions">
                            <button type="button" className="txed-banner-btn" onClick={save}>
                                <Save size={13} /> Salvar
                            </button>
                            {!currentPath && (
                                <button type="button" className="txed-banner-btn" onClick={() => setPicker('save')}>
                                    Salvar como…
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Editor ── */}
                <div className="txed-editor-wrap">
                    {/* Gutter */}
                    <div className="txed-gutter" aria-hidden="true">
                        {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i} className={`txed-gutter-num ${cursorPos.line === i + 1 ? 'active' : ''}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        className="txed-textarea"
                        value={content}
                        onChange={e => { setContent(e.target.value); updateCursor(e.target); }}
                        onKeyDown={handleKeyDown}
                        onClick={e => updateCursor(e.currentTarget)}
                        onKeyUp={e => updateCursor(e.currentTarget)}
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="Comece a digitar…"
                    />
                </div>

                {/* ── Status bar ── */}
                <div className="txed-statusbar">
                    <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                    <span className="txed-sb-sep" />
                    <span>{lineCount} {lineCount === 1 ? 'linha' : 'linhas'}</span>
                    {currentPath && (
                        <>
                            <span className="txed-sb-sep" />
                            <span className="txed-sb-path">{currentPath.slice(-2).join('/')}</span>
                        </>
                    )}
                    {isDirty && <><span className="txed-sb-sep" /><span className="txed-sb-modified">modificado</span></>}
                    <span style={{ flex: 1 }} />
                    <span>UTF-8</span>
                </div>
            </div>

            {/* ── File picker dialog ── */}
            {picker === 'open' && (
                <FilePicker mode="open" onConfirm={handleOpenConfirm} onCancel={() => setPicker(null)} />
            )}
            {picker === 'save' && (
                <FilePicker mode="save" defaultName={fileName} onConfirm={handleSaveAsConfirm} onCancel={() => setPicker(null)} />
            )}
        </>
    );
}
