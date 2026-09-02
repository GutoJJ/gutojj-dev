import { useState, useRef, useCallback, useEffect } from 'react';
import { Square, X } from 'lucide-react';
import './brave.css';
import cvPdf from '../../assets/cv_augusto_jung.pdf';

const PROFILE = {
    name: 'Augusto Jung',
    role: 'Desenvolvedor Back-end | Node.js, TypeScript & Cloud AWS',
    location: 'Taquara, RS — Brasil',
    summary:
        'Desenvolvedor Back-end especializado no ecossistema Node.js, TypeScript e AWS. Ampla experiência no desenvolvimento de APIs RESTful de alta performance, arquitetura de microsserviços, integrações entre sistemas corporativos e soluções impulsionadas por IA. Foco constante em código limpo, escalabilidade e automação.',
};

const CONTACT = {
    email: 'gutojung12@hotmail.com',
    phone: '(51) 99275-3047',
    linkedin: 'linkedin.com/in/gutojj',
    github: 'github.com/gutojj',
};

const EXPERIENCES = [
    {
        company: 'KXC Tecnologia',
        role: 'Desenvolvedor Back-end / Cloud AWS',
        period: '05/2025 — 04/2026',
        status: 'concluído',
        description:
            'Desenvolvimento de integrações em TypeScript entre sistemas CRM e o AWS Partner Central, viabilizando comunicação de dados em tempo real. Gestão e arquitetura de infraestrutura em nuvem utilizando AWS ECS, EC2, RDS e S3, focando em alta disponibilidade e otimização de recursos.',
        tags: ['TypeScript', 'Node.js', 'AWS ECS', 'AWS EC2', 'AWS RDS', 'AWS S3', 'REST APIs'],
    },
    {
        company: 'Allinsys',
        role: 'Desenvolvedor Back-end',
        period: '01/2024 — 04/2025',
        status: 'concluído',
        description:
            'Construção de APIs RESTful de alta escalabilidade em Node.js para o setor de turismo. Desenvolvimento de chat com tradução em tempo real (Google Translate API) e sistema de recomendação inteligente com IA (Gemini API) para roteiros turísticos. Melhorias de performance, refatoração de código e padronização.',
        tags: ['Node.js', 'TypeScript', 'REST API', 'Google Translate API', 'Gemini API', 'SQL'],
    },
];

const SKILL_GROUPS = [
    { label: 'Back-end', items: ['Node.js', 'TypeScript', 'Java', 'Spring Boot', 'REST APIs', 'Microsserviços', 'Express / NestJS'] },
    { label: 'Cloud & Dados', items: ['AWS (ECS, EC2, RDS, S3)', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Git / GitHub', 'Gemini API'] },
    { label: 'Front-end & Ferramentas', items: ['React.js', 'Next.js', 'HTML5', 'CSS3 / SASS', 'Tailwind CSS', 'Postman', 'Linux / Bash'] },
];

const EDUCATION = [
    { title: 'Técnico em Informática', place: 'Escola Técnica Estadual Monteiro Lobato (CIMOL)', period: '2022 — 2024' },
    { title: 'Dev the Devs', place: 'Pontifícia Universidade Católica do Rio Grande do Sul (PUCRS)', period: '2021 — 2022' },
];

const CERTIFICATIONS = [
    {
        title: 'AWS Certified Cloud Practitioner (CLF-C02)',
        issuer: 'Amazon Web Services (AWS)',
        year: '2025',
        url: 'https://www.credly.com/badges/be2f9607-f08b-4dbd-a2c2-e54e2ee00f9e',
    },
];


function useReveal<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, visible } = useReveal<HTMLDivElement>();
    return (
        <div
            ref={ref}
            className={`reveal ${visible ? 'reveal--visible' : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

interface BraveResumeBrowserProps {
    onClose?: () => void;
    onMaximizeChange?: (isMaximized: boolean) => void;
}

function BraveResumeBrowser({ onClose, onMaximizeChange }: BraveResumeBrowserProps) {
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
        setIsMaximized((prev) => !prev);
    }, []);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.brave-winbtn, .brave-tab-close')) return;
        toggleMaximize();
    }, [toggleMaximize]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isMaximized || (e.target as HTMLElement).closest('.brave-winbtn, .brave-tab-close')) return;

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
            className={`brave-window ${isMaximized ? 'maximized' : ''}`}
            style={{
                width: isMaximized ? undefined : undefined,
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
            {/* Faixa de aba — área de arrasto */}
            <div
                className="brave-tabbar"
                onDoubleClick={handleDoubleClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="brave-tab">
                    <span className="brave-tab-dot" />
                    <span className="brave-tab-title">Augusto Jung — Currículo</span>
                    <span className="brave-tab-close"><X size={11} strokeWidth={2.4} /></span>
                </div>
                <div className="brave-winctrls">
                    <button
                        type="button"
                        className="brave-winbtn brave-winbtn-max"
                        aria-label={isMaximized ? "Restaurar" : "Tela Cheia"}
                        onClick={toggleMaximize}
                    >
                        <Square size={13} strokeWidth={2.2} />
                    </button>
                    <button
                        type="button"
                        className="brave-winbtn brave-winbtn-close"
                        aria-label="Fechar"
                        onClick={onClose}
                    >
                        <X size={13} strokeWidth={2.6} />
                    </button>
                </div>
            </div>

            {/* Barra de ferramentas / endereço */}
            <div className="brave-toolbar">
                <div className="brave-navbtns">
                    <span className="brave-navbtn">‹</span>
                    <span className="brave-navbtn">›</span>
                    <span className="brave-navbtn">⟳</span>
                </div>
                <div className="brave-address">
                    <span className="brave-shield" aria-hidden="true" />
                    <span className="brave-url">gutojj.dev/curriculo</span>
                </div>
            </div>

            {/* Viewport — o "site" em si */}
            <div className="brave-viewport">
                <div className="resume-site">

                    {/* Hero */}
                    <section className="hero">
                        <div className="hero-bg" aria-hidden="true" />
                        <div className="resume-inner">
                            <div className="hero-content">
                                <span className="eyebrow">curriculum vitae</span>
                                <h1 className="hero-name">{PROFILE.name}</h1>
                                <p className="hero-role">{PROFILE.role}</p>

                                <div className="status-row">
                                    <span className="status-pill">
                                        <span className="status-dot" /> disponível
                                    </span>
                                    <span className="status-meta">{PROFILE.location}</span>
                                </div>

                                <p className="hero-summary">{PROFILE.summary}</p>

                                <div className="hero-links">
                                    <a className="hero-link hero-link--primary" href={`mailto:${CONTACT.email}`}>Falar comigo</a>
                                    <a className="hero-link" href={`https://${CONTACT.github}`} target="_blank" rel="noreferrer">GitHub</a>
                                    <a className="hero-link" href={`https://${CONTACT.linkedin}`} target="_blank" rel="noreferrer">LinkedIn</a>
                                    <a className="hero-link" download="CV_Augusto_Jung.pdf" href={cvPdf} target="_blank" rel="noreferrer">Baixar PDF</a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Experiência */}
                    <section className="section">
                        <div className="resume-inner">
                            <Reveal>
                                <span className="eyebrow">trajetória</span>
                                <h2 className="section-title">Experiência Profissional</h2>
                            </Reveal>

                            <div className="service-list">
                                {EXPERIENCES.map((exp, i) => (
                                    <Reveal key={exp.company} delay={i * 90}>
                                        <article className="service-card">
                                            <div className="service-card-head">
                                                <span className={`service-status service-status--${exp.status === 'ativo' ? 'active' : 'done'}`}>
                                                    <span className="service-status-dot" />
                                                    {exp.status}
                                                </span>
                                                <span className="service-period">{exp.period}</span>
                                            </div>
                                            <h3 className="service-name">{exp.company}</h3>
                                            <p className="service-role">{exp.role}</p>
                                            <p className="service-desc">{exp.description}</p>
                                            <div className="tag-row">
                                                {exp.tags.map((tag) => (
                                                    <span key={tag} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        </article>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Stack */}
                    <section className="section">
                        <div className="resume-inner">
                            <Reveal>
                                <span className="eyebrow">tecnologias</span>
                                <h2 className="section-title">Stack & Competências</h2>
                            </Reveal>

                            <div className="skills-grid">
                                {SKILL_GROUPS.map((group, i) => (
                                    <Reveal key={group.label} delay={i * 90}>
                                        <div className="skills-group">
                                            <h3 className="skills-group-title">{group.label}</h3>
                                            <div className="tag-row">
                                                {group.items.map((item) => (
                                                    <span key={item} className="tag tag--outline">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Formação */}
                    <section className="section">
                        <div className="resume-inner">
                            <Reveal>
                                <span className="eyebrow">formação</span>
                                <h2 className="section-title">Formação Acadêmica</h2>
                            </Reveal>

                            <ul className="changelog">
                                {EDUCATION.map((edu, i) => (
                                    <Reveal key={edu.title} delay={i * 90}>
                                        <li className="changelog-item">
                                            <span className="changelog-period">{edu.period}</span>
                                            <div>
                                                <p className="changelog-title">{edu.title}</p>
                                                <p className="changelog-place">{edu.place}</p>
                                            </div>
                                        </li>
                                    </Reveal>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Certificações */}
                    <section className="section">
                        <div className="resume-inner">
                            <Reveal>
                                <span className="eyebrow">certificações</span>
                                <h2 className="section-title">Certificações Reconhecidas</h2>
                            </Reveal>

                            <div className="cert-list">
                                {CERTIFICATIONS.map((cert) => (
                                    <Reveal key={cert.title}>
                                        <a className="cert-card" href={cert.url} target="_blank" rel="noreferrer">
                                            <span className="cert-badge">✓</span>
                                            <div>
                                                <p className="cert-title">{cert.title}</p>
                                                <p className="cert-meta">{cert.issuer} · {cert.year}</p>
                                            </div>
                                        </a>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="footer">
                        <div className="resume-inner">
                            <Reveal>
                                <p className="footer-title">Vamos conversar?</p>
                                <div className="footer-contacts">
                                    <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                                    <span className="footer-sep">·</span>
                                    <span>{CONTACT.phone}</span>
                                    <span className="footer-sep">·</span>
                                    <a href={`https://${CONTACT.github}`} target="_blank" rel="noreferrer">{CONTACT.github}</a>
                                    <span className="footer-sep">·</span>
                                    <a download="CV_Augusto_Jung.pdf" href={cvPdf} className="footer-download" aria-label="Baixar currículo em PDF">Baixar PDF</a>
                                </div>
                            </Reveal>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    );
}

export default BraveResumeBrowser;