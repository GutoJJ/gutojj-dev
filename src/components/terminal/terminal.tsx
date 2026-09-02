import { useState, useRef, useCallback, useEffect } from 'react';
import { SquarePlus, LayoutGrid, Menu, X } from 'lucide-react';
import './terminal.css';

// ---------------------------------------------------------------------------
// Dados usados pelo neofetch / comandos de info
// ---------------------------------------------------------------------------
const USER = 'gutojj';
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

// ---------------------------------------------------------------------------
// Sistema de arquivos em memória persistido via localStorage
// ---------------------------------------------------------------------------
interface FileNode {
    type: 'file';
    content: string;
}

interface DirNode {
    type: 'dir';
    children: Record<string, FileNode | DirNode>;
}

const STORAGE_KEY = 'gutojj_terminal_fs_v1';

const INITIAL_FS: DirNode = {
    type: 'dir',
    children: {
        'home': {
            type: 'dir',
            children: {
                [USER]: {
                    type: 'dir',
                    children: {
                        'sobre.txt': {
                            type: 'file',
                            content: 'Desenvolvedor Back-end especializado no ecossistema Node.js, TypeScript e AWS (ECS, EC2, RDS, S3). Foco em APIs RESTful de alta performance, microsserviços e integração entre sistemas corporativos.',
                        },
                        'curriculo.pdf': {
                            type: 'file',
                            content: '[binário] use o comando "cv" ou "brave" para abrir o currículo.',
                        },
                        'contato.txt': {
                            type: 'file',
                            content: 'gutojung12@hotmail.com · (51) 99275-3047 · github.com/gutojj · linkedin.com/in/gutojj',
                        },
                        'projetos': {
                            type: 'dir',
                            children: {
                                'filmes-diego.txt': {
                                    type: 'file',
                                    content: 'Recomendador de filmes em forma de terminal. Digite "goold" para abrir.',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

function loadFileSystem(): DirNode {
    if (typeof window === 'undefined') return INITIAL_FS;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Fallback para INITIAL_FS em caso de erro no parse
    }
    return INITIAL_FS;
}

function saveFileSystem(fs: DirNode) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
    } catch {
        // ignore storage quota errors
    }
}

let fileSystem: DirNode = loadFileSystem();

// Resolve caminho (absoluto ou relativo ao home / diretório atual)
function parseAbsolutePath(pathStr: string): string[] {
    if (pathStr === '~') return ['home', USER];
    if (pathStr.startsWith('~/')) return ['home', USER, ...pathStr.slice(2).split('/').filter(Boolean)];
    return pathStr.split('/').filter(Boolean);
}

function normalizePath(cwd: string, targetPath: string): string[] {
    let raw = targetPath.trim();
    if (!raw || raw === '.') return parseAbsolutePath(cwd);

    let absoluteStr = '';
    if (raw.startsWith('~')) {
        absoluteStr = `/home/${USER}` + raw.slice(1);
    } else if (raw.startsWith('/')) {
        absoluteStr = raw;
    } else {
        const cwdAbsoluteStr = cwd === '~' ? `/home/${USER}` : cwd.startsWith('~/') ? `/home/${USER}` + cwd.slice(1) : cwd;
        absoluteStr = cwdAbsoluteStr + '/' + raw;
    }

    const parts = absoluteStr.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(part);
        }
    }
    return stack;
}

function getNodeAtPath(pathParts: string[]): DirNode | FileNode | null {
    let current: DirNode | FileNode = fileSystem;
    for (const part of pathParts) {
        if (current.type !== 'dir') return null;
        if (!current.children[part]) return null;
        current = current.children[part];
    }
    return current;
}

function pathToString(parts: string[]): string {
    const full = '/' + parts.join('/');
    const homePrefix = `/home/${USER}`;
    if (full === homePrefix) return '~';
    if (full.startsWith(homePrefix + '/')) return '~' + full.slice(homePrefix.length);
    return full;
}

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
    '  uname -a      informações do "sistema"',
    '  history       histórico de comandos',
    '  cv / brave    abre o navegador de currículo',
    '  discord       abre o Discord',
    '  github        abre o GitHub',
    '  linkedin      abre o LinkedIn',
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
            saveFileSystem(fileSystem);
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
            saveFileSystem(fileSystem);
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
                saveFileSystem(fileSystem);
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
            saveFileSystem(fileSystem);
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
    user?: string;
    host?: string;
    cwd?: string;
    onOpenBrave?: () => void;
    onOpenDiscord?: () => void;
    onOpenPostman?: () => void;
    onClose?: () => void;
    allowFullscreen?: boolean;
    onMaximizeChange?: (isMaximized: boolean) => void;
}

function NeofetchTerminal({ host = HOST, cwd: initialCwd = '~', onOpenBrave, onOpenPostman, onOpenDiscord, onClose, allowFullscreen = false, onMaximizeChange }: NeofetchTerminalProps) {
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
    useEffect(() => {
        onMaximizeChangeRef.current = onMaximizeChange;
    });

    useEffect(() => {
        onMaximizeChangeRef.current?.(isMaximized);
    }, [isMaximized]);

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

        runCommand(cmdLine, cwd, setCwd, { print, clear, history: historyRef.current, onOpenBrave, onOpenDiscord, onOpenPostman, onClose });
        setInput('');
    }, [input, host, cwd, setCwd, print, clear, onOpenBrave, onOpenDiscord, onOpenPostman, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeCurrentInput();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeCurrentInput();
            return;
        }
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
            if (idx >= hist.length) {
                setHistoryIndex(null);
                setInput('');
            } else {
                setHistoryIndex(idx);
                setInput(hist[idx]);
            }
        }
    };

    return (
        <div
            ref={windowRef}
            className={`nfterm-window ${isMaximized ? 'maximized' : ''}`}
            style={{
                width: isMaximized ? undefined : undefined,
                transform: isMaximized
                    ? 'none'
                    : `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.88})`,
                opacity: mounted ? 1 : 0,
                filter: mounted ? 'blur(0px)' : 'blur(10px)',
                transition: dragging
                    ? 'none'
                    : 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), width 460ms cubic-bezier(0.16, 1, 0.3, 1), height 460ms cubic-bezier(0.16, 1, 0.3, 1), top 460ms cubic-bezier(0.16, 1, 0.3, 1), left 460ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1), filter 380ms cubic-bezier(0.16, 1, 0.3, 1)',
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