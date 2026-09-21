import { useState, useEffect, useRef } from 'react';
import './dock.css';

import braveIcon from '../../assets/dock/brave.svg';
import discordIcon from '../../assets/dock/discord.svg';
import spotifyIcon from '../../assets/dock/spotify-client.svg';
import vscodeIcon from '../../assets/dock/vscode.svg';
import intellijIcon from '../../assets/dock/intellij-idea-ce.svg';
import nautilusIcon from '../../assets/dock/nautilus_org.gnome.Nautilus.png';
import terminalIcon from '../../assets/dock/gnome-console_org.gnome.Console.png';
import antigIcon from '../../assets/dock/antig.jpeg';
import postmanIcon from '../../assets/dock/postman.svg';
import trashIcon from '../../assets/dock/user-trash-symbolic.svg';
import appGrid from '../../assets/dock/view-app-grid-symbolic.svg';
interface DockProps {
  onOpenTerminal?: () => void;
  onOpenBrave?: () => void;
  onOpenDiscord?: () => void;
  onOpenPostman?: () => void;
  onOpenCortex?: () => void;
  onOpenNautilus?: () => void;
  isTerminalOpen?: boolean;
  isBraveOpen?: boolean;
  isDiscordOpen?: boolean;
  isPostmanOpen?: boolean;
  isCortexOpen?: boolean;
  isNautilusOpen?: boolean;
  isMaximized?: boolean;
}

function Dock({
  onOpenTerminal,
  onOpenBrave,
  onOpenDiscord,
  onOpenCortex,
  onOpenNautilus,
  isTerminalOpen,
  isBraveOpen,
  isDiscordOpen,
  isCortexOpen,
  isNautilusOpen,
  isMaximized = false,
}: DockProps) {
  const [isHoverRevealed, setIsHoverRevealed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const appSize = 52;

  useEffect(() => {
    if (!isMaximized) {
      setIsHoverRevealed(false);
      setIsMobileOpen(false);
    }
  }, [isMaximized]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const isHiddenOnDesktop = isMaximized && !isHoverRevealed;
  const isHiddenOnMobile = isMaximized && !isMobileOpen;

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Desktop hover trigger zone */}
      {isMaximized && (
        <div
          className="dock-hover-trigger"
          onMouseEnter={() => {
            if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
            setIsHoverRevealed(true);
          }}
          onMouseLeave={() => {
            hideTimeoutRef.current = window.setTimeout(() => {
              setIsHoverRevealed(false);
              hideTimeoutRef.current = null;
            }, 180);
          }}
        />
      )}

      {/* Mobile toggle button */}
      {isMaximized && (
        <button
          type="button"
          className={`mobile-dock-btn ${isMobileOpen ? 'active' : ''}`}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label="Alternar Dock de Aplicativos"
        >
          <img src={appGrid} alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} />
          <span>{isMobileOpen ? 'Fechar' : 'Aplicativos'}</span>
        </button>
      )}

      {/* Mobile backdrop */}
      {isMaximized && isMobileOpen && (
        <div className="mobile-dock-backdrop" onClick={closeMobile} />
      )}

      <div
        className={`dock ${isHiddenOnDesktop ? 'dock--desktop-hidden' : ''} ${isHiddenOnMobile ? 'dock--mobile-hidden' : ''}`}
        onMouseEnter={() => {
          if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
          if (isMaximized) setIsHoverRevealed(true);
        }}
        onMouseLeave={() => {
          if (isMaximized) {
            hideTimeoutRef.current = window.setTimeout(() => {
              setIsHoverRevealed(false);
              hideTimeoutRef.current = null;
            }, 180);
          }
        }}
      >
        <div className="dock-apps">

          {/* Brave */}
          <div className="dock-app">
            <button type="button" onClick={() => { onOpenBrave?.(); closeMobile(); }} className="dock-button" aria-label="Abrir Brave">
              <img src={braveIcon} alt="Brave" width={appSize} height={appSize} />
            </button>
            {isBraveOpen && <span className="dock-indicator" />}
          </div>

          {/* Discord */}
          <div className="dock-app">
            <button type="button" onClick={() => { onOpenDiscord?.(); closeMobile(); }} className="dock-button" aria-label="Abrir Discord">
              <img src={discordIcon} alt="Discord" width={appSize} height={appSize} />
            </button>
            {isDiscordOpen && <span className="dock-indicator" />}
          </div>

          {/* Spotify – decorative */}
          <img src={spotifyIcon} alt="Spotify" width={appSize} height={appSize} />

          {/* Postman – decorative */}
          <img src={postmanIcon} alt="Postman" width={appSize} height={appSize} />

          {/* VSCode – decorative */}
          <img src={vscodeIcon} alt="Visual Studio Code" width={appSize} height={appSize} />

          {/* Cortex */}
          <div className="dock-app">
            <button type="button" onClick={() => { onOpenCortex?.(); closeMobile(); }} className="dock-button" aria-label="Abrir Cortex">
              <img src={antigIcon} alt="Cortex" width={appSize} height={appSize} style={{ borderRadius: '20px' }} />
            </button>
            {isCortexOpen && <span className="dock-indicator" />}
          </div>

          {/* IntelliJ – decorative */}
          <img src={intellijIcon} alt="IntelliJ IDEA" width={appSize} height={appSize} />

          {/* Nautilus (Files) */}
          <div className="dock-app">
            <button type="button" onClick={() => { onOpenNautilus?.(); closeMobile(); }} className="dock-button" aria-label="Abrir Arquivos">
              <img src={nautilusIcon} alt="Arquivos" width={appSize} height={appSize} />
            </button>
            {isNautilusOpen && <span className="dock-indicator" />}
          </div>

          {/* Terminal */}
          <div className="dock-app">
            <button type="button" onClick={() => { onOpenTerminal?.(); closeMobile(); }} className="dock-button" aria-label="Abrir Terminal">
              <img src={terminalIcon} alt="Terminal" width={appSize} height={appSize} />
            </button>
            {isTerminalOpen && <span className="dock-indicator" />}
          </div>
        </div>

        <div className="dock-line" />

        <div className="dock-apps">
          <img src={trashIcon} alt="Lixeira" width={appSize} height={appSize} />
          <img src={appGrid} alt="Grade de Aplicativos" width={appSize} height={appSize} style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
      </div>
    </>
  );
}

export default Dock;
