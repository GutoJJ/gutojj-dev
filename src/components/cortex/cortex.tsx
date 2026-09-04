import { useState, useRef, useEffect, useCallback, type ChangeEvent, type ReactNode } from "react";
import {
    Sparkles,
    Send,
    Paperclip,
    Trash2,
    FileText,
    Zap,
    User,
    Code2,
    Brain,
    X,
    FileCode,
    ArrowRight
} from "lucide-react";
import GnomeWindow from '../generic_window/window';
import './cortex.css';

interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    content: string | null;
}

interface ChatMessage {
    id: string;
    role: "user" | "bot";
    content: string;
    streaming: boolean;
    attachments?: Attachment[];
}

type ChatAttachmentPayload = Pick<Attachment, "name" | "type" | "size" | "content">;

interface ChatPayload {
    sessionId: string;
    message: string;
    attachments: ChatAttachmentPayload[];
}

const API: { endpoint: string | null; sessionId: string } = {
    endpoint: import.meta.env.VITE_URL,
    sessionId: crypto.randomUUID(),
};

const ACCEPT = ".md,.pdf";

const isMarkdownFile = (file: File) => file.type === "text/markdown" || file.name.endsWith(".md");
const isPdfFile = (file: File) => file.type === "application/pdf" || file.name.endsWith(".pdf");

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
}

async function readAttachmentContent(file: File): Promise<string | null> {
    if (isMarkdownFile(file)) {
        return await file.text();
    }

    if (isPdfFile(file)) {
        return arrayBufferToBase64(await file.arrayBuffer());
    }

    return null;
}

/* ---------- Formatação Markdown ---------- */
function renderInlineMarkdown(source: string): ReactNode[] {
    if (!source) return [""];

    const children: ReactNode[] = [];
    const pattern = /(`[^`\n]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\((https?:[^)\s]+)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(source)) !== null) {
        const token = match[0];

        if (match.index > lastIndex) {
            children.push(source.slice(lastIndex, match.index));
        }

        const linkMatch = token.match(/^\[([^\]]+)\]\((https?:[^)\s]+)\)$/);
        if (linkMatch) {
            children.push(
                <a key={`link-${match.index}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
                    {linkMatch[1]}
                </a>
            );
        } else if (token.startsWith("**")) {
            children.push(<strong key={`bold-${match.index}`}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith("*")) {
            children.push(<em key={`italic-${match.index}`}>{token.slice(1, -1)}</em>);
        } else if (token.startsWith("`")) {
            children.push(<code key={`inline-code-${match.index}`} className="chat-inline-code">{token.slice(1, -1)}</code>);
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < source.length) {
        children.push(source.slice(lastIndex));
    }

    return children;
}

function MarkdownCodeBlock({ code, language }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        const success = await copyTextToClipboard(code);
        setCopied(success);

        if (success) {
            window.setTimeout(() => setCopied(false), 1800);
        }
    };

    const currentLanguage = language && language.trim() ? language.trim() : "code";

    return (
        <div className="chat-code-wrapper">
            <div className="chat-code-header">
                <span className="chat-code-lang">
                    <span className="chat-code-dot"></span>
                    {currentLanguage}
                </span>
                <button
                    type="button"
                    className={`chat-copy-code-btn ${copied ? "copied" : ""}`}
                    aria-label="Copiar código"
                    onClick={copy}
                >
                    <span className="chat-copy-inline">
                        {copied ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12.5 9.5 17 19 7.5" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="9" y="9" width="11" height="11" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        )}
                    </span>
                    <span>{copied ? "Copiado" : "Copiar"}</span>
                </button>
            </div>
            <pre>
                <code className={`language-${currentLanguage}`}>{code}</code>
            </pre>
        </div>
    );
}

function md(src: string): ReactNode {
    if (!src) return null;

    const codeBlocks: { code: string; language: string }[] = [];
    const processed = src.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang: string, code: string) => {
        const index = codeBlocks.length;
        codeBlocks.push({
            code: code.replace(/\n$/, ""),
            language: (lang || "code").trim() || "code",
        });
        return `__CODE_BLOCK_${index}__`;
    });

    const parts = processed.split(/(__CODE_BLOCK_\d+__)/g).filter((part) => part.length > 0);

    const renderParagraph = (lines: string[], keyPrefix: string): ReactNode => {
        const content = lines.map((line) => line.trim()).join(" ").replace(/\s+/g, " ").trim();
        if (!content) return null;
        return <p key={keyPrefix}>{renderInlineMarkdown(content)}</p>;
    };

    const output: ReactNode[] = [];

    parts.forEach((part, outerIndex) => {
        const normalized = part.trim();
        if (!normalized) return;

        if (/^__CODE_BLOCK_(\d+)__$/.test(normalized)) {
            const index = Number(normalized.match(/^__CODE_BLOCK_(\d+)__$/)?.[1] ?? "-1");
            const block = codeBlocks[index];
            if (!block) return;

            output.push(
                <MarkdownCodeBlock
                    key={`code-block-${outerIndex}-${index}`}
                    code={block.code}
                    language={block.language}
                />
            );
            return;
        }

        const lines = normalized.split(/\n/);
        let cursor = 0;

        while (cursor < lines.length) {
            const current = lines[cursor]?.trim();
            if (!current) {
                cursor += 1;
                continue;
            }

            const headingMatch = current.match(/^(#{1,4})\s+(.*)$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const content = headingMatch[2].trim();
                if (level === 1) {
                    output.push(<h1 key={`h1-${outerIndex}-${cursor}`}>{renderInlineMarkdown(content)}</h1>);
                } else if (level === 2) {
                    output.push(<h2 key={`h2-${outerIndex}-${cursor}`}>{renderInlineMarkdown(content)}</h2>);
                } else if (level === 3) {
                    output.push(<h3 key={`h3-${outerIndex}-${cursor}`}>{renderInlineMarkdown(content)}</h3>);
                } else {
                    output.push(<h4 key={`h4-${outerIndex}-${cursor}`}>{renderInlineMarkdown(content)}</h4>);
                }
                cursor += 1;
                continue;
            }

            if (/^---+$/.test(current) || /^\*{3,}$/.test(current) || /^_{3,}$/.test(current)) {
                output.push(<hr key={`hr-${outerIndex}-${cursor}`} />);
                cursor += 1;
                continue;
            }

            if (/^[-*]\s+/.test(current)) {
                const items: string[] = [];
                while (cursor < lines.length) {
                    const item = lines[cursor]?.trim();
                    if (!item || !/^[-*]\s+/.test(item)) break;
                    items.push(item.replace(/^[-*]\s+/, ""));
                    cursor += 1;
                }
                output.push(
                    <ul key={`ul-${outerIndex}-${cursor}`}>
                        {items.map((item, itemIndex) => (
                            <li key={`ul-item-${outerIndex}-${cursor}-${itemIndex}`}>
                                {renderInlineMarkdown(item)}
                            </li>
                        ))}
                    </ul>
                );
                continue;
            }

            if (/^\d+\.\s+/.test(current)) {
                const items: string[] = [];
                while (cursor < lines.length) {
                    const item = lines[cursor]?.trim();
                    if (!item || !/^\d+\.\s+/.test(item)) break;
                    items.push(item.replace(/^\d+\.\s+/, ""));
                    cursor += 1;
                }
                output.push(
                    <ol key={`ol-${outerIndex}-${cursor}`}>
                        {items.map((item, itemIndex) => (
                            <li key={`ol-item-${outerIndex}-${cursor}-${itemIndex}`}>
                                {renderInlineMarkdown(item)}
                            </li>
                        ))}
                    </ol>
                );
                continue;
            }

            if (/^>\s?/.test(current)) {
                const quoteLines: string[] = [];
                while (cursor < lines.length) {
                    const item = lines[cursor]?.trim();
                    if (!item || !/^>\s?/.test(item)) break;
                    quoteLines.push(item.replace(/^>\s?/, ""));
                    cursor += 1;
                }
                output.push(
                    <blockquote key={`blockquote-${outerIndex}-${cursor}`}>
                        {quoteLines.map((item, itemIndex) => (
                            <div key={`blockquote-item-${outerIndex}-${cursor}-${itemIndex}`}>
                                {renderInlineMarkdown(item)}
                            </div>
                        ))}
                    </blockquote>
                );
                continue;
            }

            const paragraphLines: string[] = [];
            while (cursor < lines.length) {
                const next = lines[cursor]?.trim();
                if (!next) break;
                if (
                    /^#{1,3}\s+/.test(next) ||
                    /^---+$/.test(next) ||
                    /^\*{3,}$/.test(next) ||
                    /^_{3,}$/.test(next) ||
                    /^[-*]\s+/.test(next) ||
                    /^\d+\.\s+/.test(next) ||
                    /^>\s?/.test(next)
                ) {
                    break;
                }
                paragraphLines.push(next);
                cursor += 1;
            }
            output.push(renderParagraph(paragraphLines, `paragraph-${outerIndex}-${cursor}`));
        }
    });

    return <>{output}</>;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const copyTextToClipboard = async (text: string) => {
    if (!text) return false;

    // Garante foco no documento antes de tentar a Clipboard API
    window.focus();

    try {
        if (navigator.clipboard && window.isSecureContext && document.hasFocus()) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (err) {
       // Se falhar, vamos tentar o fallback abaixo
    }

    // Fallback: cria e foca um textarea explicitamente
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
    } catch (err) {
        document.body.removeChild(textarea);
        return false;
    }
};
const fmtSize = (b: number): string =>
    b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

const SUGGESTIONS = [
    {
        icon: Sparkles,
        title: "O que você faz?",
        desc: "Conheça os recursos do assistente",
        prompt: "Explique o que você faz e quais são suas principais funcionalidades.",
    },
    {
        icon: Code2,
        title: "Exemplo em TypeScript",
        desc: "Gere um snippet com integração à API",
        prompt: "Me mostre um exemplo de endpoint em TypeScript.",
    },
    {
        icon: Zap,
        title: "Resposta em tempo real",
        desc: "Veja como a resposta chega em blocos enquanto é gerada",
        prompt: "Como funciona a resposta em tempo real e o streaming de tokens?",
    },
    {
        icon: FileText,
        title: "Leitura de Arquivos",
        desc: "Anexe documentos .md ou .pdf para análise",
        prompt: "Como posso anexar arquivos Markdown (.md) e PDF para você analisar?",
    },
];

async function callAPI(payload: ChatPayload): Promise<string> {
    if (!API.endpoint) {
        throw new Error("Endpoint não configurado.");
    }

    let res: Response;

    try {
        res = await fetch(API.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao conectar com o servidor.";
        throw new Error(message);
    }

    let data: any = {};
    const rawText = await res.text();

    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch {
            throw new Error("Resposta do servidor em formato inválido.");
        }
    }

    if (!res.ok) {
        const normalized = typeof data?.details === "string" ? data.details : data?.error ?? res.statusText;
        const friendlyMessage =
            normalized ===
            "[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite:generateContent: [503 Service Unavailable] This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later."
                ? "O modelo está em alta demanda, tente novamente mais tarde."
                : normalized || "Erro ao processar a resposta do servidor.";

        throw new Error(friendlyMessage);
    }

    if (typeof data === "string") {
        return data || "Sem resposta.";
    }

    return data.reply ?? data.message ?? "Sem resposta.";
}

function ChatWidget({ className = "" }: { className?: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const autoScrollRef = useRef(true);

    const scrollBottom = useCallback((force = false) => {
        const container = messagesRef.current;
        if (!container) return;

        const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
        const nearBottom = distanceFromBottom < 140;

        if (!force && !nearBottom && !autoScrollRef.current) return;

        container.scrollTo({
            top: container.scrollHeight,
            behavior: force ? "auto" : "smooth",
        });
    }, []);

    useEffect(() => {
        const container = messagesRef.current;
        if (!container) return;

        const handleScroll = () => {
            const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
            autoScrollRef.current = distanceFromBottom < 180;
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (typing || messages.length > 0) {
            requestAnimationFrame(() => scrollBottom(false));
        }
    }, [messages, typing, attachments, scrollBottom]);

    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 160) + "px";
    };

    const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
        const list: Attachment[] = [];
        const files = Array.from(e.target.files ?? []);

        for (const file of files) {
            const isMd = isMarkdownFile(file);
            const isPdf = isPdfFile(file);
            if (!isMd && !isPdf) continue;
            if (file.size > 10 * 1024 * 1024) continue;

            list.push({
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: isPdf ? "application/pdf" : "text/markdown",
                content: await readAttachmentContent(file),
            });
        }
        setAttachments((current) => [...current, ...list]);
        e.target.value = "";
    };

    const streamBotReply = async (botId: string, full: string) => {
        setMessages((current) => [...current, { id: botId, role: "bot", content: "", streaming: true }]);

        let out = "";
        for (let i = 0; i < full.length; i++) {
            out += full[i];
            const snapshot = out;
            const done = i === full.length - 1;

            setMessages((current) =>
                current.map((msg) =>
                    msg.id === botId ? { ...msg, content: snapshot, streaming: !done } : msg
                )
            );

            scrollBottom();

            let d = 1 + Math.random() * 4;
            if (full[i] === "\n") d += 6;
            if (".!?".includes(full[i])) d += 8;
            await delay(d);
        }
    };

    const send = async (textOverride?: string) => {
        const text = (textOverride !== undefined ? textOverride : input).trim();
        if ((!text && !attachments.length) || sending) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            streaming: false,
            attachments: [...attachments],
        };

        const payload: ChatPayload = {
            sessionId: API.sessionId,
            message: text,
            attachments: attachments.map(({ name, type, size, content }) => ({ name, type, size, content })),
        };

        setMessages((current) => [...current, userMsg]);
        setInput("");
        setAttachments([]);
        setSending(true);
        setTyping(true);

        if (textareaRef.current) textareaRef.current.style.height = "auto";

        let full = "";
        try {
            full = await callAPI(payload)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro inesperado.";
            full = `⚠️ Erro de conexão: ${message}`;
        }

        setTyping(false);
        await streamBotReply(crypto.randomUUID(), full);
        setSending(false);
        textareaRef.current?.focus();
    };

    const clear = () => {
        setMessages([]);
        setAttachments([]);
        setInput("");
        setTyping(false);
        setSending(false);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    return (
        <div className={`chat-app ${className}`}>
            <main className="chat-messages" ref={messagesRef}>
                {messages.length > 0 && (
                    <div className="chat-floating-actions">
                        <button
                            type="button"
                            className="chat-clear-floating-btn"
                            onClick={clear}
                            title="Limpar histórico"
                        >
                            <Trash2 size={13} />
                            <span>Limpar chat</span>
                        </button>
                    </div>
                )}

                {messages.length === 0 && !typing && (
                    <div className="chat-empty">
                        <div className="chat-empty-header">
                            <div className="chat-empty-logo">
                                <Sparkles size={32} className="chat-empty-sparkle" />
                            </div>
                            <h2>Como posso ajudar?</h2>
                            <div className="chat-model-pill">
                                <Zap size={12} className="chat-zap-blue" />
                                <span>Gemini Flash Lite</span>
                            </div>
                        </div>

                        <div className="chat-suggestions-grid">
                            {SUGGESTIONS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.title}
                                        type="button"
                                        className="chat-suggestion-card"
                                        onClick={() => {
                                            send(item.prompt);
                                        }}
                                    >
                                        <div className="chat-suggestion-header">
                                            <div className="chat-suggestion-icon">
                                                <Icon size={16} />
                                            </div>
                                            <ArrowRight size={14} className="chat-suggestion-arrow" />
                                        </div>
                                        <div className="chat-suggestion-title">{item.title}</div>
                                        <div className="chat-suggestion-desc">{item.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`chat-msg ${m.role}`}>
                        <div className="chat-avatar">
                            {m.role === "user" ? (
                                <User size={15} />
                            ) : (
                                <Sparkles size={15} className="bot-avatar-sparkle" />
                            )}
                        </div>
                        <div className="chat-bubble-container">
                            {m.role === "bot" && (
                                <div className="chat-msg-meta">
                                    <span className="chat-msg-author">Cortex</span>
                                    <span className="chat-msg-badge">Gemini Flash Lite</span>
                                </div>
                            )}
                            <div className="chat-bubble">
                                {md(m.content)}
                                {m.streaming && <span className="chat-cursor" />}
                            </div>

                            {m.role === "user" && m.attachments && m.attachments.length > 0 && (
                                <div className="chat-user-attachments">
                                    {m.attachments.map((a) => (
                                        <span key={a.id} className="chat-user-attachment-pill">
                                            <span className="pill-icon">
                                                {a.type === "application/pdf" ? <FileText size={12} /> : <FileCode size={12} />}
                                            </span>
                                            <span className="pill-name">{a.name}</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {typing && (
                    <div className="chat-msg bot chat-typing">
                        <div className="chat-avatar">
                            <Sparkles size={15} className="bot-avatar-sparkle spin" />
                        </div>
                        <div className="chat-bubble-container">
                            <div className="chat-msg-meta">
                                <span className="chat-msg-author">Cortex</span>
                                <span className="chat-msg-badge">Gemini Flash Lite</span>
                            </div>
                            <div className="chat-bubble typing-bubble">
                                <div className="chat-typing-content">
                                    <Brain className="chat-thinking-icon" size={14} />
                                    <span className="chat-typing-label">Gemini está processando</span>
                                    <div className="chat-dots">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </main>

            {attachments.length > 0 && (
                <div className="chat-attachments">
                    {attachments.map((a) => (
                        <div key={a.id} className="chat-attachment-chip">
                            <div className="chat-attachment-icon-wrapper">
                                {a.type === "application/pdf" ? (
                                    <FileText size={14} className="pdf-icon" />
                                ) : (
                                    <FileCode size={14} className="md-icon" />
                                )}
                            </div>
                            <div className="chat-attachment-info">
                                <span className="chat-attachment-name" title={a.name}>
                                    {a.name}
                                </span>
                                <span className="chat-attachment-size">{fmtSize(a.size)}</span>
                            </div>
                            <button
                                type="button"
                                className="chat-attachment-remove"
                                onClick={() =>
                                    setAttachments((current) => current.filter((item) => item.id !== a.id))
                                }
                                title="Remover anexo"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <footer className="chat-composer">
                <div className="chat-composer-inner">
                    <button
                        type="button"
                        className="chat-icon-btn attach-btn"
                        onClick={() => fileRef.current?.click()}
                        title="Anexar arquivo (.md, .pdf)"
                    >
                        <Paperclip size={18} />
                        {attachments.length > 0 && (
                            <span className="attach-count">{attachments.length}</span>
                        )}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept={ACCEPT}
                        multiple
                        hidden
                        onChange={onFiles}
                    />
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        placeholder="Pergunte algo ao Cortex (Gemini Flash Lite)..."
                        onChange={(e) => {
                            setInput(e.target.value);
                            autoGrow();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="chat-send-btn"
                        onClick={() => send()}
                        disabled={sending || (!input.trim() && !attachments.length)}
                        title="Enviar mensagem"
                    >
                        {sending ? <span className="chat-spinner" /> : <Send size={16} />}
                    </button>
                </div>
                <div className="chat-composer-footer-hint">
                    <span>Gemini Flash Lite</span>
                    <span className="dot-sep">•</span>
                    <span>Enter para enviar</span>
                    <span className="dot-sep">•</span>
                    <span>Shift + Enter para nova linha</span>
                </div>
            </footer>
        </div>
    );
}

interface CortexProps {
    onClose?: () => void;
    onMaximizeChange?: (isMaximized: boolean) => void;
}

export default function Cortex({ onClose, onMaximizeChange }: CortexProps) {
    return (
        <GnomeWindow
            title="Cortex"
            width={920}
            height={720}
            onClose={onClose}
            onMaximizeChange={onMaximizeChange}
            showExtraControls={false}
            allowFullscreen={true}
        >
            <div style={{ width: "100%", height: "100%" }}>
                <ChatWidget />
            </div>
        </GnomeWindow>
    );
}