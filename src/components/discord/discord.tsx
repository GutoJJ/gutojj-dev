import { Pencil, ChevronRight, UserRound, Plus, Star, Shield, Sparkle, Gem, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import GnomeWindow from '../generic_window/window';
import './discord.css'

import dpfp from '../../assets/dpfp.jpg'


const CALM_PHRASES = [
    'Cada toque é um passo, mesmo que pequeno.',
    'Progresso não precisa ser barulhento para ser real.',
    'Cuide do que é seu, no seu próprio ritmo.',
    'Nem toda jornada precisa de pressa.',
    'O silêncio também é uma forma de avançar.',
    'Um passo simples ainda é um passo à frente.',
    'Respire fundo: o tempo certo é o seu.',
    'Sem pressa, apenas com constância.',
    'O essencial se constrói aos poucos.',
    'Respeite o tempo do seu próprio processo.',
    'Calma também é direção.',
    'Mãos em movimento, mente em paz.',
    'Tudo o que é sincero leva tempo.',
    'Apenas continue, no seu próprio tom.',
];

const BADGES = [Star, Shield, Sparkle, Gem, Leaf];

interface ProfileShowcaseCardProps {
    name?: string;
    tagline?: string;
    avatarUrl?: string;
    collectionIcons?: string[];
    extraCollectionCount?: number;
}


function ProfileShowcaseCard({
    name = 'Nome',
    tagline = 'usuario',
    avatarUrl,
    collectionIcons = [],
    extraCollectionCount = 0,
}: ProfileShowcaseCardProps) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setPhraseIndex((i) => (i + 1) % CALM_PHRASES.length);
                setVisible(true);
            }, 500);
        }, 4500);
        return () => clearInterval(interval);
    }, []);

    const nextPhrase = () => {
        setVisible(false);
        setTimeout(() => {
            setPhraseIndex((i) => (i + 1) % CALM_PHRASES.length);
            setVisible(true);
        }, 500);
    };

    return (
        <div className="psc-card">
            <div
                className="psc-banner"
            >
                <div className="psc-avatar-wrap">
                    <div
                        className="psc-avatar"
                        style={{ background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : undefined }}
                    >
                        {!avatarUrl && <UserRound size={26} strokeWidth={1.6} className="psc-avatar-icon" />}
                    </div>
                    <span className="psc-status-dot" />
                </div>

                <button type="button" className="psc-bubble" onClick={nextPhrase} aria-label="Próxima frase">
                    <span className="psc-bubble-icon"><Plus size={13} strokeWidth={2.6} /></span>
                    <span className={`psc-bubble-text ${visible ? 'psc-bubble-text--visible' : ''}`}>
                        {CALM_PHRASES[phraseIndex]}
                    </span>
                </button>
            </div>

            <div className="psc-body">
                <p className="psc-name">{name}</p>
                <div className="psc-badge-row">
                    <span className="psc-tagline">{tagline}</span>
                    {BADGES.map((Icon, i) => (
                        <span key={i} className="psc-badge">
                            <Icon size={12} strokeWidth={2} />
                        </span>
                    ))}
                </div>

                <div className="psc-panel">
                    <p className="psc-panel-title">Coleção</p>
                    <div className="psc-collection-row">
                        {collectionIcons.length > 0
                            ? collectionIcons.map((src, i) => (
                                <span key={i} className="psc-collection-item" style={{ backgroundImage: `url(${src})` }} />
                            ))
                            : Array.from({ length: 3 }).map((_, i) => <span key={i} className="psc-collection-item psc-collection-placeholder" />)}
                        {extraCollectionCount > 0 && <span className="psc-collection-more">+{extraCollectionCount}</span>}
                    </div>
                </div>

                <div className="psc-list">
                    <button type="button" className="psc-list-item">
                        <span className="psc-list-icon"><Pencil size={15} strokeWidth={2} /></span>
                        <span className="psc-list-label">Editar perfil</span>
                        {/* <span className="psc-badge-new">NOVO</span> */}
                    </button>

                    <button type="button" className="psc-list-item">
                        <span className="psc-status-dot psc-status-dot--inline" />
                        <span className="psc-list-label">Disponível</span>
                        <ChevronRight size={16} className="psc-chevron" />
                    </button>

                    <button type="button" className="psc-list-item">
                        <span className="psc-list-icon"><UserRound size={15} strokeWidth={2} /></span>
                        <span className="psc-list-label">Mudar de conta</span>
                        <ChevronRight size={16} className="psc-chevron" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface DiscordProps {
    onClose?: () => void;
}

function Discord({ onClose }: DiscordProps) {
    return (
        <GnomeWindow
            title="Discord"
            width={340}
            onClose={onClose}
            showExtraControls={false}
        >
            <ProfileShowcaseCard
                name="Lord Augustus"
                tagline=".naydrus"
                avatarUrl={dpfp}
            />
        </GnomeWindow>
    );
}

export default Discord;
