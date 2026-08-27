import { useState, useRef, useCallback, useEffect } from 'react';
import './brave.css'
import cvPdf from '../../assets/cv_augusto_jung.pdf';

const PROFILE = {
    name: 'Augusto Jung',
    role: 'Desenvolvedor Back-end',
    location: 'Taquara, RS',
    summary:
        'Desenvolvedor Back-end com experiência em APIs, integrações entre sistemas e cloud computing. Atuação em projetos de turismo e tecnologia, usando Node.js, TypeScript e AWS para construir soluções escaláveis e automatizar processos.',
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
        role: 'Desenvolvedor Back-end / Cloud',
        period: '05/2025 — 04/2026',
        status: 'concluído',
        description:
            'Integrações em TypeScript entre CRMs de clientes e o AWS Partner Central, permitindo comunicação em tempo real sem troca de ambiente. Soluções em cloud computing com ECS, EC2, RDS e S3, além de suporte e melhorias de infraestrutura.',
        tags: ['TypeScript', 'AWS ECS', 'AWS EC2', 'AWS RDS', 'AWS S3'],
    },
    {
        company: 'Allinsys',
        role: 'Desenvolvedor Back-end',
        period: '01/2024 — 04/2025',
        status: 'concluído',
        description:
            'APIs em Node.js para o setor de turismo, integrando sistemas e otimizando a comunicação entre serviços. Criação de um chat com tradução em tempo real (Google Translate) e integração com IA (Gemini) para recomendação de destinos e atividades. Melhorias de performance, organização de código e escalabilidade.',
        tags: ['Node.js', 'REST API', 'Google Translate API', 'Gemini API'],
    },
];

const SKILL_GROUPS = [
    { label: 'Back-end', items: ['Node.js', 'TypeScript', 'Java', 'Spring Boot', 'REST API', 'Microserviços'] },
    { label: 'Front-end', items: ['Next.js', 'ReactJS', 'HTML', 'CSS', 'SASS'] },
    { label: 'Cloud & Dados', items: ['AWS', 'SQL', 'Git', 'Gemini API'] },
];

const EDUCATION = [
    { title: 'Informática', place: 'Escola Técnica Estadual Monteiro Lobato (CIMOL) · Curso Técnico', period: '2022 — 2024' },
    { title: 'Dev the Devs', place: 'PUCRS · Curso', period: '11/2021 — 05/2022' },
];

const CERTIFICATIONS = [
    {
        title: 'AWS Cloud Practitioner (CLF-C02)',
        issuer: 'AWS',
        year: '2025',
        url: 'https://www.credly.com/badges/be2f9607-f08b-4dbd-a2c2-e54e2ee00f9e',
    },
];

// ---------------------------------------------------------------------------
// Hook simples de reveal-on-scroll (respeita prefers-reduced-motion via CSS)
// ---------------------------------------------------------------------------
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
}

function BraveResumeBrowser({ onClose }: BraveResumeBrowserProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.brave-winbtn')) return;

        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: position.x,
            originY: position.y,
        };
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

    return (
        <div
            className="brave-window"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${mounted ? 1 : 0.94})`,
                opacity: mounted ? 1 : 0,
                transition: dragging
                    ? 'none'
                    : 'opacity 240ms cubic-bezier(0.22,1,0.36,1), transform 240ms cubic-bezier(0.22,1,0.36,1)',
            }}
        >
            {/* Faixa de aba — área de arrasto */}
            <div
                className="brave-tabbar"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <div className="brave-tab">
                    <span className="brave-tab-dot" />
                    <span className="brave-tab-title">Augusto Jung — Currículo</span>
                    <span className="brave-tab-close">×</span>
                </div>
                <div className="brave-winctrls">
                    {/* <button type="button" className="brave-winbtn" aria-label="Minimizar">–</button> */}
                    {/* <button type="button" className="brave-winbtn" aria-label="Maximizar">▢</button> */}
                    <button type="button" className="brave-winbtn brave-winbtn-close" aria-label="Fechar" onClick={onClose}>×</button>
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
                    <section className="hero">
                        <div className="hero-bg" aria-hidden="true" />
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
                            </div>
                        </div>
                    </section>

                    <section className="section">
                        <Reveal>
                            <span className="eyebrow">experiência</span>
                            <h2 className="section-title">Serviços em produção</h2>
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
                    </section>

                    <section className="section">
                        <Reveal>
                            <span className="eyebrow">stack</span>
                            <h2 className="section-title">Dependências principais</h2>
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
                    </section>

                    <section className="section">
                        <Reveal>
                            <span className="eyebrow">changelog</span>
                            <h2 className="section-title">Formação</h2>
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
                    </section>

                    <section className="section">
                        <Reveal>
                            <span className="eyebrow">verificado</span>
                            <h2 className="section-title">Certificações</h2>
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
                    </section>

                    <footer className="footer">
                        <Reveal>
                            <p className="footer-title">Vamos conversar?</p>
                            <div className="footer-contacts">
                                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                                <span className="footer-sep">·</span>
                                <span>{CONTACT.phone}</span>
                                <span className="footer-sep">·</span>
                                <a href={`https://${CONTACT.github}`} target="_blank" rel="noreferrer">{CONTACT.github}</a>
                                <span className="footer-sep">·</span>
                                <a download={"CV_Augusto Jung"} href={cvPdf} className="footer-download" aria-label="Baixar currículo em PDF">Baixar PDF</a>
                            </div>
                        </Reveal>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default BraveResumeBrowser;