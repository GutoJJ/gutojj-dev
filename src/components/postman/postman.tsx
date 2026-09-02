import GnomeWindow from '../generic_window/window';
import './postman.css'


import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Send, Code2, Clock } from 'lucide-react';

interface ApiResponse {
    status: number;
    timeMs: number;
    body: string;
}

interface ApiRequest {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body?: string;
    response: ApiResponse;
}

interface ApiCollection {
    id: string;
    name: string;
    repoUrl?: string;
    requests: ApiRequest[];
}

interface ApiCollectionsExplorerProps {
    collections?: ApiCollection[];
    onOpenVSCode?: (collection: ApiCollection) => void;
}

const METHOD_COLOR: Record<ApiRequest['method'], string> = {
    GET: '#60a5fa',
    POST: '#ffb454',
    PUT: '#a78bfa',
    DELETE: '#f87171',
    PATCH: '#4ade80',
};

const DEFAULT_COLLECTIONS: ApiCollection[] = [
    {
        id: 'recomendador',
        name: 'Recomendador de Destinos',
        repoUrl: 'https://github.com/gutojj/recomendador-destinos',
        requests: [
            {
                id: 'r1',
                name: 'Gerar recomendação',
                method: 'POST',
                url: 'https://api.gutojj.dev/v1/recomendacao',
                body: '{\n  "orcamento": "medio",\n  "clima": "quente"\n}',
                response: { status: 200, timeMs: 186, body: '{\n  "destino": "Florianópolis",\n  "score": 0.94\n}' },
            },
            {
                id: 'r2',
                name: 'Histórico de buscas',
                method: 'GET',
                url: 'https://api.gutojj.dev/v1/recomendacao/historico',
                response: { status: 200, timeMs: 74, body: '{\n  "total": 12,\n  "itens": []\n}' },
            },
        ],
    },
    {
        id: 'integracoes',
        name: 'Hub de Integrações',
        repoUrl: 'https://github.com/gutojj/hub-integracoes',
        requests: [
            {
                id: 'r3',
                name: 'Receber webhook',
                method: 'POST',
                url: 'https://api.gutojj.dev/v1/webhooks/entrada',
                body: '{\n  "evento": "novo_lead",\n  "origem": "crm"\n}',
                response: { status: 202, timeMs: 41, body: '{\n  "recebido": true\n}' },
            },
            {
                id: 'r4',
                name: 'Reprocessar falha',
                method: 'PUT',
                url: 'https://api.gutojj.dev/v1/webhooks/{id}/reprocessar',
                response: { status: 200, timeMs: 98, body: '{\n  "status": "reprocessado"\n}' },
            },
        ],
    },
];

function highlightJson(json: string) {
    return json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"([^"]+)":/g, '<span class="ace-key">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="ace-string">"$1"</span>')
        .replace(/: (\d+(\.\d+)?)/g, ': <span class="ace-number">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="ace-literal">$1</span>');
}


function ApiCollectionsExplorer({ collections = DEFAULT_COLLECTIONS, onOpenVSCode }: ApiCollectionsExplorerProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set([collections[0]?.id]));
    const [activeReqId, setActiveReqId] = useState<string>(collections[0]?.requests[0]?.id ?? '');
    const [sending, setSending] = useState(false);
    const [showResponse, setShowResponse] = useState(true);

    const activeCollection = collections.find((c) => c.requests.some((r) => r.id === activeReqId)) ?? collections[0];
    const activeRequest = activeCollection?.requests.find((r) => r.id === activeReqId) ?? activeCollection?.requests[0];

    const toggleCollection = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectRequest = (id: string) => {
        setActiveReqId(id);
        setShowResponse(true);
    };

    const handleSend = () => {
        setSending(true);
        setShowResponse(false);
        setTimeout(() => {
            setSending(false);
            setShowResponse(true);
        }, 650);
    };

    if (!activeRequest) return null;

    return (
        <div className="ace-shell">
            <aside className="ace-sidebar">
                {collections.map((col) => (
                    <div key={col.id} className="ace-collection">
                        <div className="ace-collection-head">
                            <button type="button" className="ace-collection-toggle" onClick={() => toggleCollection(col.id)}>
                                {expanded.has(col.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                <Folder size={13} strokeWidth={2} />
                                <span className="ace-collection-name">{col.name}</span>
                            </button>
                            <button
                                type="button"
                                className="ace-vscode-btn"
                                title="Abrir no VS Code"
                                onClick={() => onOpenVSCode?.(col)}
                            >
                                <Code2 size={13} strokeWidth={2} />
                            </button>
                        </div>

                        {expanded.has(col.id) && (
                            <div className="ace-request-list">
                                {col.requests.map((req) => (
                                    <button
                                        key={req.id}
                                        type="button"
                                        className={`ace-request-item ${req.id === activeReqId ? 'ace-request-item--active' : ''}`}
                                        onClick={() => selectRequest(req.id)}
                                    >
                                        <span className="ace-method-tag" style={{ color: METHOD_COLOR[req.method] }}>
                                            {req.method}
                                        </span>
                                        <span className="ace-request-name">{req.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </aside>

            <section className="ace-main">
                <div className="ace-request-bar">
                    <span className="ace-method-badge" style={{ background: METHOD_COLOR[activeRequest.method] }}>
                        {activeRequest.method}
                    </span>
                    <span className="ace-url">{activeRequest.url}</span>
                    <button type="button" className="ace-send-btn" onClick={handleSend} disabled={sending}>
                        <Send size={12} strokeWidth={2.4} color='#14181d'/>
                        {sending ? 'Enviando...' : 'Send'}
                    </button>
                </div>

                {activeRequest.body && (
                    <div className="ace-panel">
                        <p className="ace-panel-title">Body</p>
                        <pre className="ace-code" dangerouslySetInnerHTML={{ __html: highlightJson(activeRequest.body) }} />
                    </div>
                )}

                <div className={`ace-response ${showResponse ? 'ace-response--visible' : ''}`}>
                    {sending ? (
                        <div className="ace-loading">
                            <span className="ace-spinner" />
                            aguardando resposta...
                        </div>
                    ) : (
                        <>
                            <div className="ace-response-head">
                                <span
                                    className="ace-status"
                                    style={{ color: activeRequest.response.status < 300 ? '#4ade80' : '#f87171' }}
                                >
                                    <span
                                        className="ace-status-dot"
                                        style={{ background: activeRequest.response.status < 300 ? '#4ade80' : '#f87171' }}
                                    />
                                    {activeRequest.response.status}
                                </span>
                                <span className="ace-time">
                                    <Clock size={11} strokeWidth={2} /> {activeRequest.response.timeMs} ms
                                </span>
                            </div>
                            <div className="ace-panel ace-panel--response">
                                <pre
                                    className="ace-code"
                                    dangerouslySetInnerHTML={{ __html: highlightJson(activeRequest.response.body) }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}


interface PostmanProps {
    onClose?: () => void;
    onMaximizeChange?: (isMaximized: boolean) => void;
}

function Postman({ onClose, onMaximizeChange }: PostmanProps) {
    return (
        <GnomeWindow
            title="API Collections"
            width={800}
            onClose={onClose}
            showExtraControls={false}
            allowFullscreen={true}
            onMaximizeChange={onMaximizeChange}
        >   
            <ApiCollectionsExplorer  />
        </GnomeWindow>
    );
}

export default Postman;
export type { ApiCollection, ApiRequest };