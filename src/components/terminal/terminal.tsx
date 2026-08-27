import { useState, useRef, useCallback, useEffect } from 'react';
import { SquarePlus, LayoutGrid, Menu, X } from 'lucide-react';
import './terminal.css';

// ---------------------------------------------------------------------------
// Dados usados pelo neofetch / comandos de info
// ---------------------------------------------------------------------------
const USER = 'gutojf';
const HOST = 'fedora';

const NEOFETCH_INFO: Array<[string, string]> = [
    ['OS', 'Augusto Jung OS 44 x86_64'],
    ['Host', 'Portfolio Desktop'],
    ['Kernel', 'Node.js + TypeScript'],
    ['Uptime', '2 anos, 4 meses (carreira)'],
    ['Packages', '15 (skills)'],
    ['Shell', 'zsh 5.9'],
    ['Resolution', 'Full Stack'],
    ['DE', 'GNOME 50'],
    ['WM', 'Mutter'],
    ['Terminal', 'gutojf-term'],
    ['CPU', 'AWS (ECS / EC2 / RDS / S3)'],
    ['GPU', 'Gemini API'],
    ['Memory', 'Back-end · Cloud · Integrações'],
];

// Logo em ASCII — um "J" estilizado, no lugar do logo de distro que o neofetch normalmente mostra.
const ASCII_LOGO = [
    '              ########',
    '                    ##',
    '                    ##',
    '                    ##',
    '                    ##',
    '                    ##',
    '                    ##',
    '                    ##',
    '   ##               ##',
    '   ##               ##',
    '    ##             ##',
    '     ##           ##',
    '      #############',
    '        #########',
];

const FILES: Record<string, string> = {
    'sobre.txt':
        'Desenvolvedor Back-end com experiência em APIs, integrações entre sistemas e cloud computing.',
    'curriculo.pdf': '[binário] use o comando "cv" para abrir o currículo.',
    'contato.txt': 'gutojung12@hotmail.com · (51) 99275-3047 · github.com/gutojj',
};

const HELP_TEXT = [
    'Comandos disponíveis:',
    '  neofetch      mostra as specs do sistema',
    '  whoami        quem sou eu',
    '  about         resumo profissional',
    '  skills        stack técnica',
    '  experience    experiência profissional',
    '  projects      projetos e links',
    '  contact       formas de contato',
    '  ls            lista arquivos do diretório',
    '  cat <arquivo> mostra o conteúdo de um arquivo',
    '  pwd           mostra o diretório atual',
    '  uname -a      informações do "sistema"',
    '  history       histórico de comandos',
    '  cv            abre/baixa o currículo',
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
    helpers: {
        print: (c: React.ReactNode, kind?: Line['kind']) => void;
        clear: () => void;
        history: string[];
        onOpenBrave?: () => void;
        onClose?: () => void;
    },
) {
    const trimmed = raw.trim();
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(' ');

    const openLink = (url: string) => {
        if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    };

    switch (cmd) {
        case '':
            return;
        case 'help':
            HELP_TEXT.forEach((l) => helpers.print(l));
            return;
        case 'neofetch':
        case 'fastfetch':
            helpers.print(<Neofetch />);
            return;
        case 'banner':
            helpers.print(<pre className="neofetch-ascii">{ASCII_LOGO.join('\n')}</pre>);
            return;
        case 'whoami':
            helpers.print('gutojf — Augusto Jung, Desenvolvedor Back-end');
            return;
        case 'pwd':
            helpers.print(cwd);
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
        case 'ls':
            helpers.print(Object.keys(FILES).join('   '));
            return;
        case 'cat': {
            if (!arg) {
                helpers.print('uso: cat <arquivo>', 'error');
                return;
            }
            const content = FILES[arg];
            if (!content) {
                helpers.print(`cat: ${arg}: arquivo não encontrado`, 'error');
                return;
            }
            helpers.print(content);
            return;
        }
        case 'about':
            helpers.print(
                'Desenvolvedor Back-end com experiência em APIs, integrações entre sistemas e cloud computing. ' +
                'Atuação em turismo e tecnologia, usando Node.js, TypeScript e AWS para construir soluções escaláveis.',
            );
            return;
        case 'skills':
            helpers.print('Back-end:    Node.js · TypeScript · Java · Spring Boot · REST API · Microserviços');
            helpers.print('Front-end:   Next.js · ReactJS · HTML · CSS · SASS');
            helpers.print('Cloud/Dados: AWS · SQL · Git · Gemini API');
            return;
        case 'experience':
            helpers.print('KXC Tecnologia — Desenvolvedor Back-end / Cloud (05/2025 — 04/2026)');
            helpers.print('  Integrações TypeScript entre CRMs e AWS Partner Central. Cloud com ECS/EC2/RDS/S3.');
            helpers.print('Allinsys — Desenvolvedor Back-end (01/2024 — 04/2025)');
            helpers.print('  APIs Node.js para turismo, chat com tradução em tempo real e IA (Gemini).');
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
            helpers.print('Abrindo currículo no Brave...');
            helpers.onOpenBrave?.();
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
    onClose?: () => void;
}

function NeofetchTerminal({ host = HOST, cwd = '~', onOpenBrave, onClose }: NeofetchTerminalProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [dragging, setDragging] = useState(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [lines]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.nfterm-btn')) return;
        dragState.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
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

    // Execução centralizada — chamada tanto pelo submit do form quanto pelo Enter explícito.
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

        runCommand(cmdLine, cwd, { print, clear, history: historyRef.current, onOpenBrave, onClose });
        setInput('');
    }, [input, host, cwd, print, clear, onOpenBrave, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeCurrentInput();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // Garante o envio mesmo se o submit do form for interceptado em algum ambiente.
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
            className="nfterm-window"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.92})`,
                opacity: mounted ? 1 : 0,
                transition: dragging
                    ? 'none'
                    : 'opacity 220ms cubic-bezier(0.22,1,0.36,1), transform 220ms cubic-bezier(0.22,1,0.36,1)',
            }}
            onClick={() => inputRef.current?.focus()}
        >
            <div
                className="nfterm-titlebar"
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
                    />
                </form>
            </div>
        </div>
    );
}

export default NeofetchTerminal;