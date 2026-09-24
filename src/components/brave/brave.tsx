import { useState, useRef, useCallback, useEffect } from 'react';
import { Square, X, Mail, Download, ExternalLink, Briefcase, Code2, GraduationCap, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { NeatGradient, type NeatConfig } from '@firecms/neat';
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

const PROJECTS = [
    {
        title: 'Cortex',
        period: '2026',
        description: 'Assistente inteligente integrado ao desktop do portfólio, capaz de conversar, interpretar documentos e analisar seu conteúdo de acordo com as instruções fornecidas.',
        tags: ['Node.js', 'Express', 'Gemini API'],
        githubUrl: `https://${CONTACT.github}/genai-chat-api`,
        githubLabel: 'Ver no GitHub',
        actionLabel: 'Abrir Cortex',
        hasAction: true,
    },
    {
        title: 'Vem mais por aí',
        period: '2026',
        description: 'Atualmente estou trabalhando em um novo projeto para analise de curriculos e perfis de linkedin, utilizando o Cortex com Gemini para fornecer insights e recomendações personalizadas.',
        tags: ['Next.js', 'Node.js', 'Express', 'Gemini API'],
        githubUrl: `https://${CONTACT.github}`,
        githubLabel: 'Ver no GitHub',
        actionLabel: 'Abrir Site',
        hasAction: false,
    },
];

const SKILL_GROUPS = [
    { label: 'Back-end', items: ['Node.js', 'TypeScript', 'Java', 'Spring Boot', 'REST APIs', 'Microsserviços', 'Express ', 'NestJS'] },
    { label: 'Cloud & Dados', items: ['AWS (ECS, EC2, RDS, S3)', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Git', 'GitHub', 'Gemini API'] },
    { label: 'Front-end & Ferramentas', items: ['React.js', 'Next.js', 'HTML5', 'CSS3 ', 'SASS', 'Tailwind CSS', 'Postman', 'Linux / Bash'] },
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

const heroGradientConfig: NeatConfig = {
    colors: [
        { color: '#1A1C30', enabled: true },
        { color: '#2A3A45', enabled: true },
        { color: '#46675B', enabled: true },
        { color: '#002027', enabled: true },
        { color: '#242438', enabled: true },
        { color: '#1e9a54', enabled: false },
    ],
    speed: 1.5,
    horizontalPressure: 3,
    verticalPressure: 5,
    waveFrequencyX: 1,
    waveFrequencyY: 3,
    waveAmplitude: 8,
    shadows: 0,
    highlights: 2,
    colorBrightness: 1,
    colorSaturation: 6,
    wireframe: false,
    antialias: false,
    colorBlending: 7,
    backgroundColor: '#003FFF',
    backgroundAlpha: 1,
    grainIntensity: 0,
    resolution: 0.25,
    //@ts-expect-error
    renderScale: 0.25,
    yOffset: 0,
    yOffsetWaveMultiplier: 1.8,
    yOffsetColorMultiplier: 2,
    yOffsetFlowMultiplier: 2.2,
    flowDistortionA: 3.7,
    flowDistortionB: 1.4,
    flowScale: 2.9,
    flowEase: 0.32,
    flowEnabled: false,
    enableProceduralTexture: false,
    transparentTextureVoid: false,
    textureVoidLikelihood: 0.27,
    textureVoidWidthMin: 60,
    textureVoidWidthMax: 420,
    textureBandDensity: 1.2,
    textureColorBlending: 0.06,
    textureSeed: 333,
    textureEase: 0.8,
    proceduralBackgroundColor: '#0E0707',
    textureShapeTriangles: 20,
    textureShapeCircles: 15,
    textureShapeBars: 15,
    textureShapeSquiggles: 10,
    domainWarpEnabled: false,
    domainWarpIntensity: 0,
    domainWarpScale: 3,
    vignetteIntensity: 0,
    vignetteRadius: 0.8,
    fresnelEnabled: false,
    fresnelPower: 2,
    fresnelIntensity: 0.5,
    fresnelColor: '#FFFFFF',
    iridescenceEnabled: false,
    iridescenceIntensity: 0.5,
    iridescenceSpeed: 1,
    bloomIntensity: 0,
    bloomThreshold: 0.7,
    chromaticAberration: 0,
    shapeType: 'plane',
    shapeRotationX: 0,
    shapeRotationY: 0,
    shapeRotationZ: 0,
    shapeAutoRotateSpeedX: 0,
    shapeAutoRotateSpeedY: 0,
    sphereRadius: 15,
    torusRadius: 15,
    torusTube: 5,
    cylinderRadius: 10,
    cylinderHeight: 40,
    planeBend: 0,
    planeTwist: 0,
    silhouetteFade: 0.25,
    cylinderFade: 0.08,
    ribbonFade: 0.05,
    flatShading: true,
    cameraLock: true,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 0,
    cameraRotationX: 0,
    cameraRotationY: 0,
    cameraRotationZ: 0,
    cameraZoom: 1,

};


interface BraveResumeBrowserProps {
    onClose?: () => void;
    onMaximizeChange?: (isMaximized: boolean) => void;
    onOpenCortex?: () => void;
}

function HeroGradient() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gradientRef = useRef<NeatGradient | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const supportsWebGL = !!(
            canvas.getContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
        );

        if (!supportsWebGL) return;

        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            ...heroGradientConfig,
        } as NeatConfig & { ref: HTMLCanvasElement });

        return () => {
            gradientRef.current?.destroy();
            gradientRef.current = null;
        };
    }, []);

    return <canvas className="hero-gradient-canvas" ref={canvasRef} />;
}

function BraveResumeBrowser({ onClose, onMaximizeChange, onOpenCortex }: BraveResumeBrowserProps) {
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
                <div className="portfolio-modern">

                    {/* Hero Section com Neat Gradient */}
                    <section className="hero-modern">
                        <div className="hero-gradient-wrapper">
                            <HeroGradient />
                        </div>

                        <div className="hero-content-modern">
                            <motion.div
                                className="hero-badge"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="pulse-dot" />
                                Disponível para trabalho
                            </motion.div>

                            <motion.h1
                                className="hero-title-modern"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                {PROFILE.name}
                            </motion.h1>

                            <motion.p
                                className="hero-subtitle-modern"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                {PROFILE.role}
                            </motion.p>

                            <motion.p
                                className="hero-description-modern"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            >
                                {PROFILE.summary}
                            </motion.p>

                            <motion.div
                                className="hero-actions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                            >
                                <a href={`mailto:${CONTACT.email}`} className="btn-primary">
                                    <Mail size={18} color="#0a0e14" strokeWidth={2.5} />
                                    Falar comigo
                                </a>
                                <a href={`https://${CONTACT.github}`} target="_blank" rel="noreferrer" className="btn-secondary">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                    </svg>
                                    GitHub
                                </a>
                                <a href={`https://${CONTACT.linkedin}`} target="_blank" rel="noreferrer" className="btn-secondary">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                        <rect x="2" y="9" width="4" height="12" />
                                        <circle cx="4" cy="4" r="2" />
                                    </svg>
                                    LinkedIn
                                </a>
                                <a download="CV_Augusto_Jung.pdf" href={cvPdf} className="btn-secondary">
                                    <Download size={18} />
                                    CV
                                </a>
                            </motion.div>
                        </div>
                    </section>

                    {/* Bento Grid Layout */}
                    <div className="bento-container">

                        {/* Experiência */}
                        <motion.section
                            className="bento-card bento-large"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="bento-header">
                                <Briefcase className="bento-icon" size={24} />
                                <h2 className="bento-title">Experiência</h2>
                            </div>
                            <div className="timeline">
                                {EXPERIENCES.map((exp, i) => (
                                    <motion.div
                                        key={exp.company}
                                        className="timeline-item"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                    >
                                        <div className="timeline-marker" />
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <h3 className="timeline-company">{exp.company}</h3>
                                                <span className="timeline-period">{exp.period}</span>
                                            </div>
                                            <p className="timeline-role">{exp.role}</p>
                                            <p className="timeline-desc">{exp.description}</p>
                                            <div className="tag-list">
                                                {exp.tags.map((tag) => (
                                                    <span key={tag} className="tag-modern">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Projetos */}
                        <motion.section
                            className="bento-card bento-medium"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="bento-header">
                                <Sparkles className="bento-icon" size={24} />
                                <h2 className="bento-title">Projetos</h2>
                            </div>
                            <div className="projects-scroll">
                                {PROJECTS.map((project) => (
                                    <div key={project.title} className="project-card-modern">
                                        <h3 className="project-title-modern">{project.title}</h3>
                                        <p className="project-desc-modern">{project.description}</p>
                                        <div className="tag-list">
                                            {project.tags.map((tag) => (
                                                <span key={tag} className="tag-modern">{tag}</span>
                                            ))}
                                        </div>
                                        <div className="project-actions">
                                            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="project-link">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                                </svg>
                                                GitHub
                                            </a>
                                            {project.hasAction && (
                                                <button onClick={() => onOpenCortex?.()} className="project-link project-link-primary">
                                                    <ExternalLink size={16} />
                                                    {project.actionLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Skills */}
                        <motion.section
                            className="bento-card bento-medium"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="bento-header">
                                <Code2 className="bento-icon" size={24} />
                                <h2 className="bento-title">Stack</h2>
                            </div>
                            <div className="skills-modern">
                                {SKILL_GROUPS.map((group, i) => (
                                    <motion.div
                                        key={group.label}
                                        className="skill-group-modern"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: i * 0.1 }}
                                    >
                                        <h3 className="skill-label-modern">{group.label}</h3>
                                        <div className="tag-list">
                                            {group.items.map((item) => (
                                                <span key={item} className="tag-modern tag-outline">{item}</span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Educação */}
                        <motion.section
                            className="bento-card bento-small"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="bento-header">
                                <GraduationCap className="bento-icon" size={24} />
                                <h2 className="bento-title">Formação</h2>
                            </div>
                            <div className="education-list">
                                {EDUCATION.map((edu) => (
                                    <div key={edu.title} className="education-item">
                                        <p className="education-title">{edu.title}</p>
                                        <p className="education-place">{edu.place}</p>
                                        <p className="education-period">{edu.period}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Certificações */}
                        <motion.section
                            className="bento-card bento-small"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="bento-header">
                                <Award className="bento-icon" size={24} />
                                <h2 className="bento-title">Certificações</h2>
                            </div>
                            {CERTIFICATIONS.map((cert) => (
                                <a key={cert.title} href={cert.url} target="_blank" rel="noreferrer" className="cert-modern">
                                    <div className="cert-badge-modern">✓</div>
                                    <div>
                                        <p className="cert-title-modern">{cert.title}</p>
                                        <p className="cert-meta-modern">{cert.issuer} · {cert.year}</p>
                                    </div>
                                </a>
                            ))}
                        </motion.section>

                    </div>

                    {/* Footer Minimal */}
                    <footer className="footer-modern">
                        <p>© 2026 Augusto Jung — Desenvolvedor Back-end</p>
                        <div className="footer-links">
                            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                            <span>·</span>
                            <span>{CONTACT.phone}</span>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    );
}

export default BraveResumeBrowser;