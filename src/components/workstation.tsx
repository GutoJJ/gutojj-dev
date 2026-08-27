import { useState } from 'react';
import TopBar from './topBar/topBar.tsx';
import Dock from './dock/dock.tsx';
import Terminal from './terminal/terminal.tsx';
import BraveResumeBrowser from './brave/brave.tsx';
import Discord from './discord/discord.tsx';

type WindowName = 'terminal' | 'brave' | 'discord';
type WindowState = Record<WindowName, boolean>;

const WINDOW_BASE_Z = 10;

const Workstation = () => {
  const [show, setShow] = useState<WindowState>({
    terminal: false,
    brave: false,
    discord: false,
  });

  const [closing, setClosing] = useState<WindowState>({
    terminal: false,
    brave: false,
    discord: false,
  });

  const [windowOrder, setWindowOrder] = useState<WindowName[]>([]);

  const focusWindow = (windowName: WindowName) => {
    setWindowOrder((prev) => {
      const next = prev.filter((item) => item !== windowName);
      return [...next, windowName];
    });
  };

  const getWindowZIndex = (windowName: WindowName) => {
    const index = windowOrder.indexOf(windowName);
    return index === -1 ? 0 : WINDOW_BASE_Z + index;
  };

  const openWindow = (windowName: WindowName) => {
    setShow((prev) => ({ ...prev, [windowName]: true }));
    setClosing((prev) => ({ ...prev, [windowName]: false }));
    focusWindow(windowName);
  };

  const closeWindow = (windowName: WindowName) => {
    setClosing((prev) => ({ ...prev, [windowName]: true }));

    setTimeout(() => {
      setShow((prev) => ({ ...prev, [windowName]: false }));
      setClosing((prev) => ({ ...prev, [windowName]: false }));
      setWindowOrder((prev) => prev.filter((item) => item !== windowName));
    }, 220);
  };

  const renderWindow = (windowName: WindowName, isOpen: boolean, content: React.ReactNode) => {
    if (!isOpen) return null;

    return (
      <div
        key={windowName}
        onPointerDown={() => focusWindow(windowName)}
        style={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '0px',
          left: '50%',
          top: '50%',
          transform: closing[windowName] ? 'translate(-50%, -50%) scale(0.9)' : 'translate(-50%, -50%) scale(1)',
          zIndex: getWindowZIndex(windowName),
          opacity: closing[windowName] ? 0 : 1,
          transition: 'opacity 220ms ease, transform 220ms ease',
          pointerEvents: 'auto',
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <TopBar />
      <Dock
        onOpenTerminal={() => openWindow('terminal')}
        onOpenBrave={() => openWindow('brave')}
        onOpenDiscord={() => openWindow('discord')}
        isTerminalOpen={show.terminal}
        isBraveOpen={show.brave}
        isDiscordOpen={show.discord}
      />

      {renderWindow(
        'terminal',
        show.terminal,
        <Terminal
          onOpenBrave={() => openWindow('brave')}
          onOpenDiscord={() => openWindow('discord')}
          onClose={() => closeWindow('terminal')}
        />,
      )}
      {renderWindow('brave', show.brave, <BraveResumeBrowser onClose={() => closeWindow('brave')} />)}
      {renderWindow('discord', show.discord, <Discord onClose={() => closeWindow('discord')} />)}
    </div>
  );
};

export default Workstation;