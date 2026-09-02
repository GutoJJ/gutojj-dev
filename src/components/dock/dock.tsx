import { useState, useEffect, useRef } from 'react';
import './dock.css';

import braveIcon from '../../assets/dock/brave.svg';
import discordIcon from '../../assets/dock/discord.svg';
import spotifyIcon from '../../assets/dock/spotify-client.svg';
import vscodeIcon from '../../assets/dock/vscode.svg';
import intellijIcon from '../../assets/dock/intellij-idea-ce.svg';
import nautilusIcon from '../../assets/dock/nautilus_org.gnome.Nautilus.png';
import terminalIcon from '../../assets/dock/gnome-console_org.gnome.Console.png';
import trashIcon from '../../assets/dock/user-trash-symbolic.svg';
import appGrid from '../../assets/dock/view-app-grid-symbolic.svg';

interface DockProps {
  onOpenTerminal?: () => void;
  onOpenBrave?: () => void;
  onOpenDiscord?: () => void;
  onOpenPostman?: () => void;
  isTerminalOpen?: boolean;
  isBraveOpen?: boolean;
  isDiscordOpen?: boolean;
  isPostmanOpen?: boolean;
  isMaximized?: boolean;
}

function Dock({
  onOpenTerminal,
  onOpenBrave,
  onOpenDiscord,
  isTerminalOpen,
  isBraveOpen,
  isDiscordOpen,
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
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, []);

  const isHiddenOnDesktop = isMaximized && !isHoverRevealed;
  const isHiddenOnMobile = isMaximized && !isMobileOpen;

  return (
    <>
      {/* Zona de detecção do mouse na parte inferior da tela (Desktop) */}
      {isMaximized && (
        <div
          className="dock-hover-trigger"
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
            setIsHoverRevealed(true);
          }}
          onMouseLeave={() => {
            // start hide timeout when leaving the trigger area
            hideTimeoutRef.current = window.setTimeout(() => {
              setIsHoverRevealed(false);
              hideTimeoutRef.current = null;
            }, 180);
          }}
        />
      )}

      {/* Botão interativo no mobile (exibido quando em tela cheia) */}
      {isMaximized && (
        <button
          type="button"
          className={`mobile-dock-btn ${isMobileOpen ? 'active' : ''}`}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label="Alternar Dock de Aplicativos"
        >
          <img
            src={appGrid}
            alt=""
            width={14}
            height={14}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span>{isMobileOpen ? 'Fechar' : 'Aplicativos'}</span>
        </button>
      )}

      {/* Overlay escuro para fechar ao clicar fora no celular */}
      {isMaximized && isMobileOpen && (
        <div
          className="mobile-dock-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`dock ${isHiddenOnDesktop ? 'dock--desktop-hidden' : ''} ${isHiddenOnMobile ? 'dock--mobile-hidden' : ''}`}
        onMouseEnter={() => {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
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
          <div className="dock-app">
            <button
              type="button"
              onClick={() => {
                onOpenBrave?.();
                if (isMaximized) setIsMobileOpen(false);
              }}
              className="dock-button"
              aria-label="Abrir Brave"
            >
              <img src={braveIcon} alt="Brave" width={appSize} height={appSize} />
            </button>
            {isBraveOpen && <span className="dock-indicator" />}
          </div>

          <div className="dock-app">
            <button
              type="button"
              onClick={() => {
                onOpenDiscord?.();
                if (isMaximized) setIsMobileOpen(false);
              }}
              className="dock-button"
              aria-label="Abrir Discord"
            >
              <img src={discordIcon} alt="Discord" width={appSize} height={appSize} />
            </button>
            {isDiscordOpen && <span className="dock-indicator" />}
          </div>

          <img src={spotifyIcon} alt="Spotify" width={appSize} height={appSize} />


          {/* Postman temporariamente desabilitado */}

          <img src={vscodeIcon} alt="VS Code" width={appSize} height={appSize} />
          <img src={intellijIcon} alt="IntelliJ IDEA" width={appSize} height={appSize} />
          <img src={nautilusIcon} alt="Nautilus" width={appSize} height={appSize} />

          <div className="dock-app">
            <button
              type="button"
              onClick={() => {
                onOpenTerminal?.();
                if (isMaximized) setIsMobileOpen(false);
              }}
              className="dock-button"
              aria-label="Abrir terminal"
            >
              <img src={terminalIcon} alt="Terminal" width={appSize} height={appSize} />
            </button>
            {isTerminalOpen && <span className="dock-indicator" />}
          </div>
        </div>

        <div className="dock-line" />

        <div className="dock-apps dock-mobile">
          <img src={trashIcon} alt="Lixeira" width={appSize} height={appSize} />
          <img
            src={appGrid}
            alt="Grade de Aplicativos"
            width={appSize}
            height={appSize}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </div>
    </>
  );
}

export default Dock;