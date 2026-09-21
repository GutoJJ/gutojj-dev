import { useState, useRef, useCallback, useEffect } from 'react';
import { SquarePlus, LayoutGrid, Menu, X } from 'lucide-react';
import './terminal.css';
import {
    USER,
    fileSystem,
    saveFileSystem,
    normalizePath,
    getNodeAtPath,
    pathToString,
    notifyFsChange,
} from '../../fileSystemStore';

// ---------------------------------------------------------------------------
// Dados usados pelo neofetch / comandos de info
// ---------------------------------------------------------------------------
const HOST = 'fedora';

const NEOFETCH_INFO: Array<[string, string]> = [
    ['OS', 'GutoJJ OS 46 x86_64'],
    ['Host', 'Portfolio Desktop'],
    ['Kernel', 'Node.js + TypeScript'],
    ['Uptime', '2 anos, 4 meses (carreira)'],
    ['Packages', '18 (skills)'],
    ['Shell', 'bash 5.3.9'],
    ['Resolution', 'Back End & Cloud'],
    ['DE', 'GNOME 50.4'],
    ['WM', 'Mutter (Wayland)'],
    ['Terminal', 'gutojj'],
    ['CPU', 'AWS (ECS / EC2 / RDS / S3)'],
    ['GPU', 'Gemini API'],
    ['Memory', 'Back-end · Cloud · REST APIs'],
];

const ASCII_LOGO = [
    'ㅤㅤㅤㅤㅤㅤ██╗',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤㅤㅤㅤㅤㅤ██║',
    'ㅤ██ㅤㅤㅤ██║',
    'ㅤ╚██████╔╝',
    'ㅤㅤ╚═════╝',
];

const HELP_TEXT = [
    'Comandos disponíveis:',
    '  neofetch      mostra as specs do sistema',
    '  whoami        quem sou eu',
    '  about         resumo profissional',
    '  skills        stack técnica',
    '  experience    experiência profissional',
    '  projects      projetos e links',
    '  contact       formas de contato',
    '  ls [dir]      lista arquivos e diretórios',
    '  cd <dir>      navega entre pastas (suporta ~, .., ./, caminhos absolutos e relativos)',
    '  pwd           mostra o diretório atual',
    '  mkdir <dir>   cria uma nova pasta (salva no localStorage)',
    '  rmdir <dir>   remove uma pasta vazia',
    '  touch <file>  cria um arquivo vazio ou atualiza data',
    '  rm <file>     remove um arquivo ou pasta (-r / -rf)',
    '  cat <arquivo> mostra o conteúdo de um arquivo',
    '  gedit <file>  abre um arquivo no editor de texto',
    '  nano <file>   abre um arquivo no editor de texto',
    '  uname -a      informações do "sistema"',
    '  history       histórico de comandos',
    '  cv / brave    abre o navegador de currículo',
    '  discord       abre o Discord',
    '  github        abre o GitHub',
    '  linkedin      abre o LinkedIn',
    '  cortex        abre o Cortex',
    '  nautilus      abre o gerenciador de arquivos',
    '  goold         abre o site de recomendação de filmes',
    '  banner        mostra o logo em ASCII',
    '  date          data e hora atual',
    '  echo <texto>  repete o texto',
    '  clear         limpa o terminal',
    '  exit          fecha esta janela',
    '  help          mostra esta lista',
];

interface Line {
    id: number;
    kind: 'input' | 'output' | 'error';
    content: string | React.ReactNode;
}

let lineId = 0;
const nextId = () => ++lineId;

function Neofetch() {
    return (
        <div className="neofetch-block">
            <pre className="neofetch-ascii">{ASCII_LOGO.join('\n')}</pre>
            <div className="neofetch-info">
                <p className="neofetch-user">{USER}@{HOST}</p>
                <p className="neofetch-rule">{'-'.repeat(USER.length + HOST.length + 1)}</p>
                {NEOFETCH_INFO.map(([label, value]) => (
                    <p key={label}>
                        <span className="neofetch-label">{label}:</span> {value}
                    </p>
                ))}
                <p className="neofetch-swatches">
                    {['#e05252', '#54d68a', '#ffb454', '#5ac8fa', '#b48ead', '#8a93a0'].map((c) => (
                        <span key={c} style={{ background: c }} className="neofetch-swatch" />
                    ))}
                </p>
            </div>
        </div>
    );
}

function runCommand(
    raw: string,
    cwd: string,
    setCwd: (newCwd: string) => void,
    helpers: {
        print: (c: React.ReactNode, kind?: Line['kind']) => void;
        clear: () => void;
        history: string[];
        onOpenBrave?: () => void;
        onOpenDiscord?: () => void;
        onOpenPostman?: () => void;
        onOpenCortex?: () => void;
        onOpenNautilus?: () => void;
        onOpenTextEditor?: (filePath: string[], fileName: string, content: string) => void;
        onClose?: () => void;
    },
) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(' ');

    const openLink = (url: string) => {
        if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    };

    switch (cmd) {
        case 'help':
            HELP_TEXT.forEach((l) =>
                helpers.print(
                    <pre className="nfterm-help-line" style={{ margin: 0 }}>
                        {l}
                    </pre>,
                ),
            );
            return;
        case 'neofetch':
        case 'fastfetch':
            helpers.print(<Neofetch />);
            return;
        case 'banner':
            helpers.print(<pre className="neofetch-ascii">{ASCII_LOGO.join('\n')}</pre>);
            return;
        case 'whoami':
            helpers.print('gutojj — Augusto Jung, Desenvolvedor Back-end (Node.js / TypeScript / AWS)');
            return;
        case 'pwd':
            helpers.print(pathToString(normalizePath(cwd, '.')));
            return;
        case 'uname':
            helpers.print('AugustoJungOS 44.0-node #1 SMP x86_64 GNU/Linux');
            return;
        case 'history':
            if (helpers.history.length === 0) {
                helpers.print('(vazio)');
            } else {
                helpers.history.forEach((h, i) => helpers.print(`  ${i + 1}  ${h}`));
            }
            return;
        case 'cd': {
            const target = arg || '~';
            const targetParts = normalizePath(cwd, target);
            const node = getNodeAtPath(targetParts);
            if (!node) {
                helpers.print(`cd: ${arg}: Arquivo ou diretório não encontrado`, 'error');
                return;
            }
            if (node.type !== 'dir') {
                helpers.print(`cd: ${arg}: Não é um diretório`, 'error');
                return;
            }
            setCwd(pathToString(targetParts));
            return;
        }
        case 'ls': {
            const targetParts = arg ? normalizePath(cwd, arg) : normalizePath(cwd, '.');
            const node = getNodeAtPath(targetParts);
            if (!node) {
                helpers.print(`ls: impossível acessar '${arg}': Arquivo ou diretório não encontrado`, 'error');
                return;
            }
            if (node.type === 'file') {
                helpers.print(targetParts[targetParts.length - 1]);
                return;
            }
            const entries = Object.keys(node.children).map((name) => {
                const isDir = node.children[name].type === 'dir';
                return isDir ? `${name}/` : name;
            });
            helpers.print(entries.join('   ') || '(diretório vazio)');
            return;
        }
        case 'cat': {
            if (!arg) {
                helpers.print('uso: cat <arquivo>', 'error');
                return;
            }
            const targetParts = normalizePath(cwd, arg);
            const node = getNodeAtPath(targetParts);
            if (!node) {
                helpers.print(`cat: ${arg}: Arquivo ou diretório não encontrado`, 'error');
                return;
            }
            if (node.type === 'dir') {
                helpers.print(`cat: ${arg}: É um diretório`, 'error');
                return;
            }
            helpers.print(node.content);
            return;
        }
        case 'gedit':
        case 'nano': {
            if (!arg) {
                helpers.print(`uso: ${cmd} <arquivo>`, 'error');
                return;
            }
            const targetParts = normalizePath(cwd, arg);
            const node = getNodeAtPath(targetParts);
            
            if (node && node.type === 'dir') {
                helpers.print(`${cmd}: ${arg}: É um diretório`, 'error');
                return;
            }
            
            // Se o arquivo não existe, cria um novo vazio
            if (!node) {
                const parentParts = targetParts.slice(0, -1);
                const fileName = targetParts[targetParts.length - 1];
                const parentNode = getNodeAtPath(parentParts);
                
                if (!parentNode || parentNode.type !== 'dir') {
                    helpers.print(`${cmd}: impossível abrir '${arg}': Diretório pai não encontrado`, 'error');
                    return;
                }
                
                // Cria o arquivo no sistema
                parentNode.children[fileName] = { type: 'file', content: '' };
                saveFileSystem();
                notifyFsChange();
            }
            
            // Abre o editor
            const fileNode = getNodeAtPath(targetParts);
            if (fileNode && fileNode.type === 'file') {
                helpers.print(`Abrindo '${arg}' no editor de texto...`);
                helpers.onOpenTextEditor?.(targetParts, targetParts[targetParts.length - 1], fileNode.content);
            }
            return;
        }
        case 'mkdir': {
            if (!arg) {
                helpers.print('uso: mkdir <diretório>', 'error');
                return;
            }
            const targetParts = normalizePath(cwd, arg);
            const parentParts = targetParts.slice(0, -1);
            const dirName = targetParts[targetParts.length - 1];
            const parentNode = getNodeAtPath(parentParts);
            if (!parentNode || parentNode.type !== 'dir') {
                helpers.print(`mkdir: impossível criar o diretório '${arg}': Diretório pai não encontrado`, 'error');
                return;
            }
            if (parentNode.children[dirName]) {
                helpers.print(`mkdir: impossível criar o diretório '${arg}': Arquivo ou diretório já existe`, 'error');
                return;
            }
            parentNode.children[dirName] = { type: 'dir', children: {} };
            saveFileSystem();
            notifyFsChange();
            helpers.print(`Diretório '${arg}' criado com sucesso.`);
            return;
        }
        case 'rmdir': {
            if (!arg) {
                helpers.print('uso: rmdir <diretório>', 'error');
                return;
            }
            const targetParts = normalizePath(cwd, arg);
            const parentParts = targetParts.slice(0, -1);
            const dirName = targetParts[targetParts.length - 1];
            const parentNode = getNodeAtPath(parentParts);
            const node = getNodeAtPath(targetParts);
            if (!node || !parentNode || parentNode.type !== 'dir') {
                helpers.print(`rmdir: falha ao remover '${arg}': Arquivo ou diretório não encontrado`, 'error');
                return;
            }
            if (node.type !== 'dir') {
                helpers.print(`rmdir: falha ao remover '${arg}': Não é um diretório`, 'error');
                return;
            }
            if (Object.keys(node.children).length > 0) {
                helpers.print(`rmdir: falha ao remover '${arg}': Diretório não vazio (use rm -r)`, 'error');
                return;
            }
            delete parentNode.children[dirName];
            saveFileSystem();
            notifyFsChange();
            helpers.print(`Diretório '${arg}' removido.`);
            return;
        }
        case 'touch': {
            if (!arg) {
                helpers.print('uso: touch <arquivo>', 'error');
                return;
            }
            const targetParts = normalizePath(cwd, arg);
            const parentParts = targetParts.slice(0, -1);
            const fileName = targetParts[targetParts.length - 1];
            const parentNode = getNodeAtPath(parentParts);
            if (!parentNode || parentNode.type !== 'dir') {
                helpers.print(`touch: impossível tocar '${arg}': Diretório pai não encontrado`, 'error');
                return;
            }
            if (!parentNode.children[fileName]) {
                parentNode.children[fileName] = { type: 'file', content: '' };
                saveFileSystem();
                notifyFsChange();
                helpers.print(`Arquivo '${arg}' criado.`);
            } else {
                helpers.print(`Data de modificação de '${arg}' atualizada.`);
            }
            return;
        }
        case 'rm': {
            if (!arg) {
                helpers.print('uso: rm [-r|-rf] <arquivo/diretório>', 'error');
                return;
            }
            const isRecursive = rest.includes('-r') || rest.includes('-rf') || rest.includes('-fr');
            const pathArg = rest.filter((r) => !r.startsWith('-')).join(' ');
            if (!pathArg) {
                helpers.print('uso: rm [-r|-rf] <arquivo/diretório>', 'error');
                return;
            }
            const targetParts = normalizePath(cwd, pathArg);
            const parentParts = targetParts.slice(0, -1);
            const name = targetParts[targetParts.length - 1];
            const parentNode = getNodeAtPath(parentParts);
            const node = getNodeAtPath(targetParts);
            if (!node || !parentNode || parentNode.type !== 'dir') {
                helpers.print(`rm: não foi possível remover '${pathArg}': Arquivo ou diretório não encontrado`, 'error');
                return;
            }
            if (node.type === 'dir' && !isRecursive) {
                helpers.print(`rm: não foi possível remover '${pathArg}': É um diretório (use -r)`, 'error');
                return;
            }
            delete parentNode.children[name];
            saveFileSystem();
            notifyFsChange();
            helpers.print(`'${pathArg}' removido com sucesso.`);
            return;
        }
        case 'about':
            helpers.print(
                'Desenvolvedor Back-end especializado em Node.js, TypeScript e AWS. ' +
                'Experiência em construção de APIs RESTful de alta performance, microsserviços e integração entre sistemas corporativos.',
            );
            return;
        case 'skills':
            helpers.print('Back-end:    Node.js · TypeScript · Java · Spring Boot · REST APIs · Microsserviços · Express / NestJS');
            helpers.print('Cloud/Dados: AWS (ECS, EC2, RDS, S3) · PostgreSQL · MySQL · Redis · Docker · Git · Gemini API');
            helpers.print('Front-end:   React.js · Next.js · HTML5 · CSS3 / SASS · Tailwind CSS · Postman');
            return;
        case 'experience':
            helpers.print('KXC Tecnologia — Desenvolvedor Back-end / Cloud AWS (05/2025 — 04/2026)');
            helpers.print('  Integrações TypeScript entre CRMs e AWS Partner Central. Infraestrutura AWS ECS, EC2, RDS e S3.');
            helpers.print('Allinsys — Desenvolvedor Back-end (01/2024 — 04/2025)');
            helpers.print('  APIs RESTful Node.js para turismo, chat com tradução em tempo real (Google Translate) e IA (Gemini).');
            return;
        case 'projects':
            helpers.print('FilmesDiego — recomendador de filmes em forma de terminal');
            helpers.print('  → digite "goold" para abrir');
            helpers.print('Cortex — assistente experimental de chat e automações embutido no desktop');
            helpers.print('  → digite "cortex" para abrir');
            return;
        case 'contact':
            helpers.print('email:    gutojung12@hotmail.com');
            helpers.print('telefone: (51) 99275-3047');
            helpers.print('github:   github.com/gutojj');
            helpers.print('linkedin: linkedin.com/in/gutojj');
            return;
        case 'cv':
        case 'brave':
            helpers.print('Abrindo currículo no Brave...');
            helpers.onOpenBrave?.();
            return;
        case 'discord':
            helpers.print('Abrindo Discord...');
            helpers.onOpenDiscord?.();
            return;
        case 'postman':
            helpers.print('Abrindo Postman...');
            helpers.onOpenPostman?.();
            return;
        case 'cortex':
            helpers.print('Abrindo Cortex...');
            helpers.onOpenCortex?.();
            return;
        case 'nautilus':
        case 'files':
            helpers.print('Abrindo Arquivos...');
            helpers.onOpenNautilus?.();
            return;
        case 'github':
            helpers.print('Abrindo github.com/gutojj ...');
            openLink('https://github.com/gutojj');
            return;
        case 'linkedin':
            helpers.print('Abrindo linkedin.com/in/gutojj ...');
            openLink('https://linkedin.com/in/gutojj');
            return;
        case 'goold':
            helpers.print('Abrindo https://gutojj.github.io/FilmesDiego/ ...');
            openLink('https://gutojj.github.io/FilmesDiego/');
            return;
        case 'date':
            helpers.print(new Date().toString());
            return;
        case 'echo':
            helpers.print(arg);
            return;
        case 'sudo':
            helpers.print(`${USER} não está no arquivo sudoers. Este incidente será reportado.`, 'error');
            return;
        case 'clear':
            helpers.clear();
            return;
        case 'exit':
            helpers.onClose?.();
            return;
        default:
            helpers.print(`comando não encontrado: ${cmd} (digite "help")`, 'error');
    }
}

interface NeofetchTerminalProps {
    host?: string;
    cwd?: string;
    onOpenBrave?: () => void;
    onOpenDiscord?: () => void;
    onOpenPostman?: () => void;
    onOpenCortex?: () => void;
    onOpenNautilus?: () => void;
    onOpenTextEditor?: (filePath: string[], fileName: string, content: string) => void;
    onClose?: () => void;
    allowFullscreen?: boolean;
    onMaximizeChange?: (isMaximized: boolean) => void;
}

function NeofetchTerminal({
    host = HOST,
    cwd: initialCwd = '~',
    onOpenBrave,
    onOpenPostman,
    onOpenDiscord,
    onOpenCortex,
    onOpenNautilus,
    onOpenTextEditor,
    onClose,
    allowFullscreen = false,
    onMaximizeChange,
}: NeofetchTerminalProps) {
    const [cwd, setCwd] = useState(initialCwd);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const windowRef = useRef<HTMLDivElement | null>(null);
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

    const [lines, setLines] = useState<Line[]>([]);
    const [input, setInput] = useState('');
    const historyRef = useRef<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    const print = useCallback((content: React.ReactNode, kind: Line['kind'] = 'output') => {
        setLines((prev) => [...prev, { id: nextId(), kind, content }]);
    }, []);

    const clear = useCallback(() => setLines([]), []);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [lines]);

    const onMaximizeChangeRef = useRef(onMaximizeChange);
    useEffect(() => { onMaximizeChangeRef.current = onMaximizeChange; });
    useEffect(() => { onMaximizeChangeRef.current?.(isMaximized); }, [isMaximized]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (!allowFullscreen || (e.target as HTMLElement).closest('.nfterm-btn')) return;
        setIsMaximized((prev) => !prev);
    }, [allowFullscreen]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isMaximized || (e.target as HTMLElement).closest('.nfterm-btn')) return;
        dragState.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [position, isMaximized]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragState.current || isMaximized) return;
        const rect = windowRef.current?.getBoundingClientRect();
        const currentTop = rect ? rect.top : 33;
        const minY = position.y + (33 - currentTop);
        const maxY = window.innerHeight / 2 - 40;
        const maxX = window.innerWidth / 2 - 40;
        const minX = -(window.innerWidth / 2 - 40);
        const newX = dragState.current.originX + (e.clientX - dragState.current.startX);
        const newY = dragState.current.originY + (e.clientY - dragState.current.startY);
        setPosition({ x: Math.min(maxX, Math.max(minX, newX)), y: Math.max(minY, Math.min(maxY, newY)) });
    }, [isMaximized, position]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragState.current = null;
        setDragging(false);
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }, []);

    const executeCurrentInput = useCallback(() => {
        const cmdLine = input;
        print(
            <span>
                <span className="nfterm-prompt">{USER}@{host}</span>
                <span className="nfterm-colon">:</span>
                <span className="nfterm-path">{cwd}</span>
                <span className="nfterm-dollar">$ </span>
                {cmdLine}
            </span>,
            'input',
        );
        if (cmdLine.trim()) historyRef.current = [...historyRef.current, cmdLine];
        setHistoryIndex(null);
        runCommand(cmdLine, cwd, setCwd, {
            print, clear, history: historyRef.current,
            onOpenBrave, onOpenDiscord, onOpenPostman, onOpenCortex, onOpenNautilus, onOpenTextEditor, onClose,
        });
        setInput('');
    }, [input, host, cwd, setCwd, print, clear, onOpenBrave, onOpenDiscord, onOpenPostman, onOpenCortex, onOpenNautilus, onClose]);

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); executeCurrentInput(); };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); executeCurrentInput(); return; }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const hist = historyRef.current;
            if (hist.length === 0) return;
            const idx = historyIndex === null ? hist.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(idx);
            setInput(hist[idx]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const hist = historyRef.current;
            if (historyIndex === null) return;
            const idx = historyIndex + 1;
            if (idx >= hist.length) { setHistoryIndex(null); setInput(''); }
            else { setHistoryIndex(idx); setInput(hist[idx]); }
        }
    };

    // keep fileSystem ref so the FS module var is always the shared one
    void fileSystem;

    return (
        <div
            ref={windowRef}
            className={`nfterm-window ${isMaximized ? 'maximized' : ''}`}
            style={{
                transform: isMaximized
                    ? 'none'
                    : `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.88})`,
                opacity: mounted ? 1 : 0,
                filter: mounted ? 'blur(0px)' : 'blur(10px)',
                transition: dragging
                    ? 'none'
                    : 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), width 460ms cubic-bezier(0.16, 1, 0.3, 1), height 460ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1), filter 380ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={() => inputRef.current?.focus()}
        >
            <div
                className="nfterm-titlebar"
                onDoubleClick={handleDoubleClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="nfterm-titlebar-left">
                    <button type="button" className="nfterm-btn nfterm-btn-icon" aria-label="Nova aba">
                        <SquarePlus size={15} strokeWidth={2.4} />
                    </button>
                </div>
                <div className="nfterm-titlebar-center">
                    <span className="nfterm-title">{USER}@{host}:{cwd}</span>
                    <span className="nfterm-subtitle">{cwd}</span>
                </div>
                <div className="nfterm-titlebar-right">
                    <button type="button" className="nfterm-btn nfterm-btn-icon" aria-label="Visão geral">
                        <LayoutGrid size={15} strokeWidth={2.4} />
                    </button>
                    <button type="button" className="nfterm-btn nfterm-btn-icon" aria-label="Menu">
                        <Menu size={15} strokeWidth={2.4} />
                    </button>
                    <button type="button" className="nfterm-btn nfterm-btn-close" aria-label="Fechar" onClick={onClose}>
                        <X size={13} strokeWidth={2.6} />
                    </button>
                </div>
            </div>

            <div className="nfterm-body" ref={bodyRef}>
                {lines.map((line) => (
                    <div key={line.id} className={`nfterm-line ${line.kind === 'error' ? 'nfterm-line--error' : ''}`}>
                        {line.content}
                    </div>
                ))}
                <form onSubmit={handleSubmit} className="nfterm-inputrow">
                    <span className="nfterm-prompt">{USER}@{host}</span>
                    <span className="nfterm-colon">:</span>
                    <span className="nfterm-path">{cwd}</span>
                    <span className="nfterm-dollar">$</span>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="nfterm-input"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="none"
                    />
                </form>
            </div>
        </div>
    );
}

export default NeofetchTerminal;
