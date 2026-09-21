import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    MoreVertical,
    Grid2X2,
    List,
    Star,
    Clock,
    Home,
    Wifi,
    Trash2,
    FolderOpen,
    Music,
    Image,
    Video,
    Download,
    FileText,
    Folder,
    File,
    X,
    Square,
    ChevronRight as BreadcrumbArrow,
} from 'lucide-react';
import {
    USER,
    getNodeAtPath,
    saveFileSystem,
    notifyFsChange,
    subscribeFsChanges,
    type DirNode,
    type FsNode,
} from '../../fileSystemStore';
import './nautilus.css';

// ── Types ─────────────────────────────────────────────────────────────────

interface NautilusProps {
    onClose?: () => void;
    onMaximizeChange?: (v: boolean) => void;
    onOpenTextEditor?: (filePath: string[], fileName: string, content: string) => void;
}

interface FsEntry {
    name: string;
    node: FsNode;
}

interface SidebarItem {
    label: string;
    icon: React.ReactNode;
    path: string[];
    virtual?: boolean;
}

const SIDEBAR_PINNED: SidebarItem[] = [
    { label: 'Pasta pessoal', icon: <Home size={15} />, path: ['home', USER] },
    { label: 'Recentes',      icon: <Clock size={15} />, path: ['home', USER], virtual: true },
    { label: 'Favoritos',     icon: <Star size={15} />,  path: ['home', USER], virtual: true },
    { label: 'Rede',          icon: <Wifi size={15} />,  path: ['home', USER], virtual: true },
    { label: 'Lixeira',       icon: <Trash2 size={15} />, path: ['home', USER], virtual: true },
];

const SIDEBAR_PLACES: SidebarItem[] = [
    { label: 'Documentos', icon: <FolderOpen size={15} />, path: ['home', USER, 'Documentos'] },
    { label: 'Músicas',    icon: <Music size={15} />,      path: ['home', USER, 'Músicas'] },
    { label: 'Imagens',    icon: <Image size={15} />,      path: ['home', USER, 'Imagens'] },
    { label: 'Vídeos',     icon: <Video size={15} />,      path: ['home', USER, 'Vídeos'] },
    { label: 'Downloads',  icon: <Download size={15} />,   path: ['home', USER, 'Downloads'] },
];

// ── Icon helpers ──────────────────────────────────────────────────────────

function EntryIcon({ entry, size = 40 }: { entry: FsEntry; size?: number }) {
    if (entry.node.type === 'dir') return <Folder size={size} className="ni ni--dir" />;
    const n = entry.name.toLowerCase();
    if (n.endsWith('.txt') || n.endsWith('.md'))   return <FileText size={size} className="ni ni--text" />;
    if (n.endsWith('.pdf'))                         return <FileText size={size} className="ni ni--pdf" />;
    if (n.endsWith('.mp3') || n.endsWith('.wav'))   return <Music size={size} className="ni ni--audio" />;
    if (n.endsWith('.mp4') || n.endsWith('.mkv'))   return <Video size={size} className="ni ni--video" />;
    if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.webp'))
        return <Image size={size} className="ni ni--image" />;
    return <File size={size} className="ni ni--file" />;
}

// ── Context Menu ──────────────────────────────────────────────────────────

interface CtxMenu {
    x: number;
    y: number;
    kind: 'background' | 'entry';
    entry?: FsEntry;
}

// ── Main Component ────────────────────────────────────────────────────────

export default function Nautilus({ onClose, onMaximizeChange, onOpenTextEditor }: NautilusProps) {
    // Window state
    const [position, setPosition]     = useState({ x: 0, y: 0 });
    const [mounted, setMounted]       = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [dragging, setDragging]     = useState(false);
    const windowRef  = useRef<HTMLDivElement>(null);
    const dragState  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

    // FS / navigation state
    const [currentPath, setCurrentPath] = useState<string[]>(['home', USER]);
    const [navHistory, setNavHistory]   = useState<string[][]>([['home', USER]]);
    const [histIdx, setHistIdx]         = useState(0);
    const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen]   = useState(false);
    const [, forceUpdate]               = useState(0);
    const [ctxMenu, setCtxMenu]         = useState<CtxMenu | null>(null);
    const [renaming, setRenaming]       = useState<{ name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [selected, setSelected]       = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const renameRef   = useRef<HTMLInputElement>(null);
    const searchRef   = useRef<HTMLInputElement>(null);
    const ctxRef      = useRef<HTMLDivElement>(null);

    // ── Mount animation ──────────────────────────────────────────────────
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // ── Maximize callback ────────────────────────────────────────────────
    const onMaxRef = useRef(onMaximizeChange);
    useEffect(() => { onMaxRef.current = onMaximizeChange; });
    useEffect(() => { onMaxRef.current?.(isMaximized); }, [isMaximized]);

    // ── FS subscription ──────────────────────────────────────────────────
    useEffect(() => subscribeFsChanges(() => forceUpdate(n => n + 1)), []);

    // ── Context menu close on outside click ──────────────────────────────
    useEffect(() => {
        if (!ctxMenu) return;
        const close = (e: MouseEvent) => {
            if (!ctxRef.current?.contains(e.target as Node)) setCtxMenu(null);
        };
        window.addEventListener('mousedown', close);
        return () => window.removeEventListener('mousedown', close);
    }, [ctxMenu]);

    // ── Auto-focus inputs ────────────────────────────────────────────────
    useEffect(() => {
        if (renaming) setTimeout(() => { renameRef.current?.focus(); renameRef.current?.select(); }, 30);
    }, [renaming]);
    useEffect(() => {
        if (searchOpen) setTimeout(() => searchRef.current?.focus(), 30);
    }, [searchOpen]);

    // ── Drag ─────────────────────────────────────────────────────────────
    const onTitlebarPointerDown = useCallback((e: React.PointerEvent) => {
        if (isMaximized || (e.target as HTMLElement).closest('.naut-btn')) return;
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
        if ((e.target as HTMLElement).closest('.naut-btn')) return;
        toggleMaximize();
    }, [toggleMaximize]);

    // ── Navigation ───────────────────────────────────────────────────────
    const navigate = useCallback((path: string[]) => {
        setNavHistory(prev => {
            const next = [...prev.slice(0, histIdx + 1), path];
            setHistIdx(next.length - 1);
            return next;
        });
        setCurrentPath(path);
        setSelected(null);
        setSearchQuery('');
        setSearchOpen(false);
    }, [histIdx]);

    const goBack = () => {
        if (histIdx > 0) {
            setHistIdx(i => i - 1);
            setCurrentPath(navHistory[histIdx - 1]);
            setSelected(null);
        }
    };

    const goForward = () => {
        if (histIdx < navHistory.length - 1) {
            setHistIdx(i => i + 1);
            setCurrentPath(navHistory[histIdx + 1]);
            setSelected(null);
        }
    };

    // ── Entries ──────────────────────────────────────────────────────────
    const currentNode = getNodeAtPath(currentPath);
    const allEntries: FsEntry[] = currentNode?.type === 'dir'
        ? Object.entries(currentNode.children)
            .map(([name, node]) => ({ name, node }))
            .sort((a, b) => {
                if (a.node.type !== b.node.type) return a.node.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name, 'pt-BR');
            })
        : [];

    const entries = searchQuery
        ? allEntries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : allEntries;

    // ── Breadcrumb ───────────────────────────────────────────────────────
    const crumbs = currentPath.map((seg, i) => ({
        label: (seg === USER && i === 1) ? 'Pasta pessoal' : seg,
        path: currentPath.slice(0, i + 1),
    }));

    // ── Actions ──────────────────────────────────────────────────────────
    const openEntry = (entry: FsEntry) => {
        if (entry.node.type === 'dir') {
            navigate([...currentPath, entry.name]);
        } else if (entry.node.type === 'file') {
            onOpenTextEditor?.([...currentPath, entry.name], entry.name, entry.node.content);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, entry?: FsEntry) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY, kind: entry ? 'entry' : 'background', entry });
    };

    const createFolder = (targetPath = currentPath) => {
        console.log('[Nautilus] createFolder called, targetPath:', targetPath, 'currentPath:', currentPath);
        setCtxMenu(null);
        const node = getNodeAtPath(targetPath) as DirNode | null;
        console.log('[Nautilus] target node:', node);
        if (!node || node.type !== 'dir') {
            console.warn('[Nautilus] createFolder: target is not a dir or null');
            return;
        }
        let name = 'Nova pasta'; let i = 2;
        while (node.children[name]) name = `Nova pasta ${i++}`;
        node.children[name] = { type: 'dir', children: {} };
        saveFileSystem(); notifyFsChange();
        if (targetPath.join('/') !== currentPath.join('/')) {
            console.log('[Nautilus] createFolder: navigating to', targetPath);
            navigate(targetPath);
            setTimeout(() => {
                forceUpdate(n => n + 1);
                setRenaming({ name }); setRenameValue(name); setSelected(name);
            }, 50);
        } else {
            forceUpdate(n => n + 1);
            setRenaming({ name }); setRenameValue(name); setSelected(name);
        }
    };

    const createTextFile = (targetPath = currentPath) => {
        console.log('[Nautilus] createTextFile called, targetPath:', targetPath, 'currentPath:', currentPath);
        setCtxMenu(null);
        const node = getNodeAtPath(targetPath) as DirNode | null;
        console.log('[Nautilus] target node:', node);
        if (!node || node.type !== 'dir') {
            console.warn('[Nautilus] createTextFile: target is not a dir or null');
            return;
        }
        let name = 'Novo documento.txt'; let i = 2;
        while (node.children[name]) name = `Novo documento ${i++}.txt`;
        node.children[name] = { type: 'file', content: '' };
        saveFileSystem(); notifyFsChange();
        if (targetPath.join('/') !== currentPath.join('/')) {
            console.log('[Nautilus] createTextFile: navigating to', targetPath);
            navigate(targetPath);
            setTimeout(() => {
                forceUpdate(n => n + 1);
                setRenaming({ name }); setRenameValue(name); setSelected(name);
            }, 50);
        } else {
            forceUpdate(n => n + 1);
            setRenaming({ name }); setRenameValue(name); setSelected(name);
        }
    };

    const deleteEntry = (entry: FsEntry) => {
        setCtxMenu(null);
        const parent = getNodeAtPath(currentPath) as DirNode | null;
        if (!parent || parent.type !== 'dir') return;
        delete parent.children[entry.name];
        saveFileSystem(); notifyFsChange(); forceUpdate(n => n + 1);
        if (selected === entry.name) setSelected(null);
    };

    const startRename = (entry: FsEntry) => {
        setCtxMenu(null);
        setRenaming({ name: entry.name });
        setRenameValue(entry.name);
        setSelected(entry.name);
    };

    const commitRename = () => {
        if (!renaming) return;
        const newName = renameValue.trim();
        if (!newName || newName === renaming.name) { setRenaming(null); return; }
        const parent = getNodeAtPath(currentPath) as DirNode | null;
        if (!parent || parent.type !== 'dir' || parent.children[newName]) { setRenaming(null); return; }
        parent.children[newName] = parent.children[renaming.name];
        delete parent.children[renaming.name];
        saveFileSystem(); notifyFsChange(); forceUpdate(n => n + 1);
        setSelected(newName); setRenaming(null);
    };

    // ── Window style — same pattern as generic_window ────────────────────
    const windowStyle: React.CSSProperties = {
        width: isMaximized ? undefined : 860,
        height: isMaximized ? undefined : 540,
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
            className={`naut-win ${isMaximized ? 'naut-win--max' : ''}`}
            style={windowStyle}
        >
            {/* ── Titlebar ── */}
            <div
                className="naut-titlebar"
                onPointerDown={onTitlebarPointerDown}
                onPointerMove={onTitlebarPointerMove}
                onPointerUp={onTitlebarPointerUp}
                onDoubleClick={onTitlebarDblClick}
            >
                {/* Left: nav arrows */}
                <div className="naut-titlebar-side">
                    <button type="button" className="naut-btn naut-btn--icon" onClick={goBack}
                        disabled={histIdx <= 0} aria-label="Voltar">
                        <ChevronLeft size={16} />
                    </button>
                    <button type="button" className="naut-btn naut-btn--icon" onClick={goForward}
                        disabled={histIdx >= navHistory.length - 1} aria-label="Avançar">
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Center: breadcrumb / search */}
                <div className="naut-titlebar-center">
                    {searchOpen ? (
                        <div className="naut-search">
                            <Search size={13} className="naut-search-icon" />
                            <input ref={searchRef} className="naut-search-input"
                                placeholder="Pesquisar arquivos…" value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); } }}
                            />
                            {searchQuery && (
                                <button type="button" className="naut-btn naut-btn--icon naut-btn--sm"
                                    onClick={() => setSearchQuery('')}>
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="naut-breadcrumb">
                            {crumbs.map((c, i) => (
                                <span key={c.path.join('/')} className="naut-breadcrumb-seg">
                                    {i > 0 && <BreadcrumbArrow size={12} className="naut-breadcrumb-sep" />}
                                    <button type="button"
                                        className={`naut-breadcrumb-btn ${i === crumbs.length - 1 ? 'active' : ''}`}
                                        onClick={() => navigate(c.path)}>
                                        {c.label}
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: actions + window controls */}
                <div className="naut-titlebar-side naut-titlebar-side--right">
                    <button type="button" className={`naut-btn naut-btn--icon ${searchOpen ? 'active' : ''}`}
                        onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearchQuery(''); }}
                        aria-label="Pesquisar">
                        <Search size={15} />
                    </button>
                    <button type="button" className="naut-btn naut-btn--icon"
                        onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
                        aria-label="Alternar visualização">
                        {viewMode === 'grid' ? <List size={15} /> : <Grid2X2 size={15} />}
                    </button>
                    <button type="button" className={`naut-btn naut-btn--icon ${sidebarOpen ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(v => !v)} aria-label="Painel lateral">
                        <MoreVertical size={15} />
                    </button>
                    <div className="naut-titlebar-divider" />
                    <button type="button" className="naut-btn naut-btn--icon" aria-label="Tela cheia"
                        onClick={toggleMaximize}>
                        <Square size={13} strokeWidth={2.2} />
                    </button>
                    <button type="button" className="naut-btn naut-btn--close" aria-label="Fechar"
                        onClick={onClose}>
                        <X size={13} strokeWidth={2.6} />
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="naut-body">
                {/* Sidebar */}
                <aside className={`naut-sidebar ${sidebarOpen ? '' : 'naut-sidebar--closed'}`}>
                    <nav className="naut-sidebar-nav">
                        <div className="naut-sidebar-group">
                            {SIDEBAR_PINNED.map(item => (
                                <button key={item.label} type="button"
                                    className={`naut-sidebar-item ${!item.virtual && currentPath.join('/') === item.path.join('/') ? 'active' : ''}`}
                                    onClick={() => !item.virtual && navigate(item.path)}>
                                    <span className="naut-sidebar-item-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="naut-sidebar-group">
                            <span className="naut-sidebar-heading">Locais</span>
                            {SIDEBAR_PLACES.map(item => (
                                <button key={item.label} type="button"
                                    className={`naut-sidebar-item ${currentPath.join('/') === item.path.join('/') ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}>
                                    <span className="naut-sidebar-item-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>
                </aside>

                {/* Content */}
                <div
                    className={`naut-content naut-content--${viewMode}`}
                    onContextMenu={e => { e.stopPropagation(); handleContextMenu(e); }}
                    onClick={e => { if (!(e.target as HTMLElement).closest('.naut-entry')) setSelected(null); }}
                >
                    {entries.length === 0 && (
                        <div className="naut-empty">
                            {searchQuery ? 'Nenhum resultado.' : 'Esta pasta está vazia.'}
                        </div>
                    )}

                    {entries.map(entry => {
                        const isSel = selected === entry.name;
                        const isRen = renaming?.name === entry.name;
                        return (
                            <div key={entry.name}
                                className={`naut-entry naut-entry--${viewMode} ${isSel ? 'naut-entry--sel' : ''}`}
                                onContextMenu={e => { e.stopPropagation(); handleContextMenu(e, entry); }}
                                onClick={e => { e.stopPropagation(); setSelected(entry.name); }}
                                onDoubleClick={() => openEntry(entry)}>
                                <div className="naut-entry-icon">
                                    <EntryIcon entry={entry} size={viewMode === 'grid' ? 40 : 20} />
                                </div>
                                {isRen ? (
                                    <input ref={renameRef} className="naut-rename-input"
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onBlur={commitRename}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') commitRename();
                                            if (e.key === 'Escape') setRenaming(null);
                                            e.stopPropagation();
                                        }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="naut-entry-name">{entry.name}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Status bar ── */}
            <div className="naut-statusbar">
                <span>{entries.length} {entries.length === 1 ? 'item' : 'itens'}</span>
                {selected && <span className="naut-statusbar-sel">· {selected}</span>}
            </div>
        </div>

        {/* ── Context menu — rendered via portal so overflow:hidden não corta ── */}
        {ctxMenu && (() => {
            const menuEntry = ctxMenu.entry;
            const menuPath = menuEntry ? [...currentPath, menuEntry.name] : currentPath;
            return createPortal(
                <div ref={ctxRef} className="naut-ctx"
                    style={{ left: ctxMenu.x, top: ctxMenu.y }}
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={e => e.stopPropagation()}>
                    {ctxMenu.kind === 'background' && (
                        <>
                            <button type="button" className="naut-ctx-item"
                                onClick={() => createFolder(currentPath)}>
                                <Folder size={15} /> Nova pasta
                            </button>
                            <button type="button" className="naut-ctx-item"
                                onClick={() => createTextFile(currentPath)}>
                                <FileText size={15} /> Novo documento de texto
                            </button>
                        </>
                    )}
                    {ctxMenu.kind === 'entry' && menuEntry && (
                        <>
                            {menuEntry.node.type === 'dir' ? (
                                <>
                                    <button type="button" className="naut-ctx-item"
                                        onClick={() => { openEntry(menuEntry); setCtxMenu(null); }}>
                                        <FolderOpen size={15} /> Abrir
                                    </button>
                                    <div className="naut-ctx-sep" />
                                    <button type="button" className="naut-ctx-item"
                                        onClick={() => {
                                            console.log('[Nautilus CTX] Nova pasta aqui clicked, menuPath:', menuPath);
                                            createFolder(menuPath);
                                        }}>
                                        <Folder size={15} /> Nova pasta aqui
                                    </button>
                                    <button type="button" className="naut-ctx-item"
                                        onClick={() => {
                                            console.log('[Nautilus CTX] Criar arquivo clicked, menuPath:', menuPath);
                                            createTextFile(menuPath);
                                        }}>
                                        <FileText size={15} /> Criar arquivo de texto
                                    </button>
                                    <div className="naut-ctx-sep" />
                                </>
                            ) : (
                                <>
                                    <button type="button" className="naut-ctx-item"
                                        onClick={() => { openEntry(menuEntry); setCtxMenu(null); }}>
                                        <FileText size={15} /> Abrir
                                    </button>
                                    <div className="naut-ctx-sep" />
                                </>
                            )}
                            <button type="button" className="naut-ctx-item"
                                onClick={() => startRename(menuEntry)}>
                                <FileText size={15} /> Renomear
                            </button>
                            <button type="button" className="naut-ctx-item naut-ctx-item--danger"
                                onClick={() => deleteEntry(menuEntry)}>
                                <Trash2 size={15} /> Mover para lixeira
                            </button>
                        </>
                    )}
                </div>,
                document.body,
            );
        })()}
    </>
    );
}
