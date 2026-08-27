import './dock.css';

import braveIcon from '../../assets/dock/brave.svg';
import discordIcon from '../../assets/dock/discord.svg';
import spotifyIcon from '../../assets/dock/spotify-client.svg';
import steamIcon from '../../assets/dock/steam.svg';
import vscodeIcon from '../../assets/dock/vscode.svg';
import intellijIcon from '../../assets/dock/intellij-idea-ce.svg';
import nautilusIcon from '../../assets/dock/nautilus_org.gnome.Nautilus.png';
import terminalIcon from '../../assets/dock/gnome-console_org.gnome.Console.png';
import trashIcon from '../../assets/dock/user-trash-symbolic.svg';
import appGrid from '../../assets/dock/view-app-grid-symbolic.svg';

interface DockProps {
  onOpenTerminal?: () => void;
  onOpenBrave?: () => void;
  isTerminalOpen?: boolean;
  isBraveOpen?: boolean;
}

function Dock({ onOpenTerminal, onOpenBrave, isTerminalOpen, isBraveOpen }: DockProps) {
  return (
    <div className="dock">
      <div className="dock-apps">
        <div className="dock-app">
          <button
            type="button"
            onClick={onOpenBrave}
            className="dock-button"
            aria-label="Abrir Brave"
          >
            <img src={braveIcon} alt="Brave" width={55} height={55} />
          </button>
          {isBraveOpen && <span className="dock-indicator" />}
        </div>

        <img src={discordIcon} alt="Discord" width={55} height={55} />
        <img src={spotifyIcon} alt="Spotify" width={55} height={55} />
        <img src={steamIcon} alt="Steam" width={55} height={55} />
        <img src={vscodeIcon} alt="VS Code" width={55} height={55} />
        <img src={intellijIcon} alt="IntelliJ IDEA" width={55} height={55} />
        <img src={nautilusIcon} alt="Nautilus" width={55} height={55} />

        <div className="dock-app">
          <button
            type="button"
            onClick={onOpenTerminal}
            className="dock-button"
            aria-label="Abrir terminal"
          >
            <img src={terminalIcon} alt="Terminal" width={55} height={55} />
          </button>
          {isTerminalOpen && <span className="dock-indicator" />}
        </div>
      </div>

      <div className="dock-line" />

      <div className="dock-apps dock-mobile">
        <img src={trashIcon} alt="Lixeira" width={55} height={55} />
        <img
          src={appGrid}
          alt="Grade de Aplicativos"
          width={55}
          height={55}
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>
    </div>
  );
}

export default Dock;