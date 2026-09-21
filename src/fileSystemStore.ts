// ---------------------------------------------------------------------------
// Shared in-memory file system — used by Terminal and Nautilus
// ---------------------------------------------------------------------------

export interface FileNode {
    type: 'file';
    content: string;
}

export interface DirNode {
    type: 'dir';
    children: Record<string, FileNode | DirNode>;
}

export type FsNode = FileNode | DirNode;

const USER = 'gutojj';
export { USER };

const STORAGE_KEY = 'gutojj_terminal_fs_v1';

const INITIAL_FS: DirNode = {
    type: 'dir',
    children: {
        home: {
            type: 'dir',
            children: {
                [USER]: {
                    type: 'dir',
                    children: {
                        'sobre.txt': {
                            type: 'file',
                            content:
                                'Desenvolvedor Back-end especializado no ecossistema Node.js, TypeScript e AWS (ECS, EC2, RDS, S3). Foco em APIs RESTful de alta performance, microsserviços e integração entre sistemas corporativos.',
                        },
                        'curriculo.pdf': {
                            type: 'file',
                            content:
                                '[binário] use o comando "cv" ou "brave" para abrir o currículo.',
                        },
                        'contato.txt': {
                            type: 'file',
                            content:
                                'gutojung12@hotmail.com · (51) 99275-3047 · github.com/gutojj · linkedin.com/in/gutojj',
                        },
                        projetos: {
                            type: 'dir',
                            children: {
                                'filmes-diego.txt': {
                                    type: 'file',
                                    content:
                                        'Recomendador de filmes em forma de terminal. Digite "goold" para abrir.',
                                },
                                'cortex.txt': {
                                    type: 'file',
                                    content:
                                        'Cortex — Assistente experimental de chat, leitura e análise de documentos. Digite "cortex" para abrir dentro deste portfolio.',
                                },
                            },
                        },
                        Documentos: { type: 'dir', children: {} },
                        Músicas: { type: 'dir', children: {} },
                        Imagens: { type: 'dir', children: {} },
                        Vídeos: { type: 'dir', children: {} },
                        Downloads: { type: 'dir', children: {} },
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
            const parsed = JSON.parse(saved) as DirNode;
            // Ensure the standard GNOME folders exist
            const homeNode = parsed?.children?.home;
            const userDir = (homeNode?.type === 'dir' ? homeNode.children[USER] : undefined) as DirNode | undefined;
            if (userDir?.type === 'dir') {
                for (const folder of ['Documentos', 'Músicas', 'Imagens', 'Vídeos', 'Downloads']) {
                    if (!userDir.children[folder]) {
                        userDir.children[folder] = { type: 'dir', children: {} };
                    }
                }
            }
            return parsed;
        }
    } catch {
        // fall through
    }
    return INITIAL_FS;
}

export let fileSystem: DirNode = loadFileSystem();

export function saveFileSystem() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileSystem));
    } catch {
        // ignore quota errors
    }
}

// ── Path helpers ──────────────────────────────────────────────────────────

export function parseAbsolutePath(pathStr: string): string[] {
    if (pathStr === '~') return ['home', USER];
    if (pathStr.startsWith('~/')) return ['home', USER, ...pathStr.slice(2).split('/').filter(Boolean)];
    return pathStr.split('/').filter(Boolean);
}

export function normalizePath(cwd: string, targetPath: string): string[] {
    let raw = (targetPath ?? '').trim();
    if (!raw || raw === '.') return parseAbsolutePath(cwd);

    let absoluteStr = '';
    if (raw.startsWith('~')) {
        absoluteStr = `/home/${USER}` + raw.slice(1);
    } else if (raw.startsWith('/')) {
        absoluteStr = raw;
    } else {
        const cwdAbsoluteStr =
            cwd === '~'
                ? `/home/${USER}`
                : cwd.startsWith('~/')
                ? `/home/${USER}` + cwd.slice(1)
                : cwd;
        absoluteStr = cwdAbsoluteStr + '/' + raw;
    }

    const parts = absoluteStr.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') { if (stack.length > 0) stack.pop(); }
        else stack.push(part);
    }
    return stack;
}

export function getNodeAtPath(pathParts: string[]): FsNode | null {
    let current: FsNode = fileSystem;
    for (const part of pathParts) {
        if (current.type !== 'dir') return null;
        if (!current.children[part]) return null;
        current = current.children[part];
    }
    return current;
}

export function pathToString(parts: string[]): string {
    const full = '/' + parts.join('/');
    const homePrefix = `/home/${USER}`;
    if (full === homePrefix) return '~';
    if (full.startsWith(homePrefix + '/')) return '~' + full.slice(homePrefix.length);
    return full;
}

// ── Mutation helpers (also save to localStorage) ──────────────────────────

export function mkdirFs(pathStr: string, cwd: string): string | null {
    const targetParts = normalizePath(cwd, pathStr);
    const parentParts = targetParts.slice(0, -1);
    const dirName = targetParts[targetParts.length - 1];
    const parentNode = getNodeAtPath(parentParts);
    if (!parentNode || parentNode.type !== 'dir') return `mkdir: pai não encontrado`;
    if (parentNode.children[dirName]) return `mkdir: já existe`;
    parentNode.children[dirName] = { type: 'dir', children: {} };
    saveFileSystem();
    return null;
}

export function touchFs(pathStr: string, cwd: string, content = ''): string | null {
    const targetParts = normalizePath(cwd, pathStr);
    const parentParts = targetParts.slice(0, -1);
    const fileName = targetParts[targetParts.length - 1];
    const parentNode = getNodeAtPath(parentParts);
    if (!parentNode || parentNode.type !== 'dir') return `touch: diretório pai não encontrado`;
    if (!parentNode.children[fileName]) {
        parentNode.children[fileName] = { type: 'file', content };
    } else {
        const node = parentNode.children[fileName];
        if (node.type === 'file') node.content = content;
    }
    saveFileSystem();
    return null;
}

export function writeFileFs(pathParts: string[], content: string): void {
    const parentParts = pathParts.slice(0, -1);
    const fileName = pathParts[pathParts.length - 1];
    const parentNode = getNodeAtPath(parentParts);
    if (!parentNode || parentNode.type !== 'dir') return;
    parentNode.children[fileName] = { type: 'file', content };
    saveFileSystem();
}

export function rmFs(pathStr: string, cwd: string, recursive = false): string | null {
    const targetParts = normalizePath(cwd, pathStr);
    const parentParts = targetParts.slice(0, -1);
    const name = targetParts[targetParts.length - 1];
    const parentNode = getNodeAtPath(parentParts);
    const node = getNodeAtPath(targetParts);
    if (!node || !parentNode || parentNode.type !== 'dir') return `rm: não encontrado`;
    if (node.type === 'dir' && !recursive) return `rm: é um diretório (use -r)`;
    delete parentNode.children[name];
    saveFileSystem();
    return null;
}

// Listeners so Nautilus can react when the terminal mutates the FS
type FsListener = () => void;
const listeners = new Set<FsListener>();

export function subscribeFsChanges(fn: FsListener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

export function notifyFsChange() {
    for (const fn of listeners) fn();
}
