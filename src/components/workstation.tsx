import { useEffect, useState } from 'react';
import TopBar from './topBar/topBar.tsx';
import Dock from './dock/dock.tsx';
import Terminal from './terminal/terminal.tsx';
import BraveResumeBrowser from './brave/brave.tsx';
import Discord from './discord/discord.tsx';
import Postman from './postman/postman.tsx';
import Cortex from './cortex/cortex.tsx';

type WindowName = 'terminal' | 'brave' | 'discord' | 'postman' | 'cortex';
type WindowState = Record<WindowName, boolean>;

const WINDOW_BASE_Z = 10;

const Workstation = () => {
  const [show, setShow] = useState<WindowState>({
    terminal: false,
    brave: false,
    discord: false,
    postman: false,
    cortex: false,
  });

  const [closing, setClosing] = useState<WindowState>({
    terminal: false,
    brave: false,
    discord: false,
    postman: false,
    cortex: false,
  });

  const [windowOrder, setWindowOrder] = useState<WindowName[]>([]);

  const [maximizedWindows, setMaximizedWindows] = useState<WindowState>({
    terminal: false,
    brave: false,
    discord: false,
    postman: false,
    cortex: false,
  });

  const isAnyMaximized = Object.values(maximizedWindows).some(Boolean);


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
    setMaximizedWindows((prev) => ({ ...prev, [windowName]: false }));

    setTimeout(() => {
      setShow((prev) => ({ ...prev, [windowName]: false }));
      setClosing((prev) => ({ ...prev, [windowName]: false }));
      setWindowOrder((prev) => prev.filter((item) => item !== windowName));
    }, 460);
  };

  const handlePowerOff = () => {
    setClosing((prev) => ({
      terminal: show.terminal ? true : prev.terminal,
      brave: show.brave ? true : prev.brave,
      discord: show.discord ? true : prev.discord,
      postman: show.postman ? true : prev.postman,
      cortex: show.cortex ? true : prev.cortex,
    }));
    setMaximizedWindows({ terminal: false, brave: false, discord: false, postman: false, cortex: false });

    setTimeout(() => {
      setShow({ terminal: false, brave: false, discord: false, postman: false, cortex: false });
      setClosing({ terminal: false, brave: false, discord: false, postman: false, cortex: false });
      setWindowOrder([]);
      window.triggerDesktopExit?.();
    }, 460);
  };

  useEffect(() => {
    const handleDesktopExit = () => {
      setShow({ terminal: false, brave: false, discord: false, postman: false, cortex: false });
      setClosing({ terminal: false, brave: false, discord: false, postman: false, cortex: false });
      setMaximizedWindows({ terminal: false, brave: false, discord: false, postman: false, cortex: false });
      setWindowOrder([]);
    };

    window.addEventListener('desktop-exit', handleDesktopExit);
    return () => window.removeEventListener('desktop-exit', handleDesktopExit);
  }, []);

  const renderWindow = (windowName: WindowName, isOpen: boolean, content: React.ReactNode) => {
    if (!isOpen) return null;

    return (
      <div
        key={windowName}
        className='window'
        onPointerDown={() => focusWindow(windowName)}
        style={{
          transform: closing[windowName] ? 'translate(-50%, -50%) scale(0.88)' : 'translate(-50%, -50%) scale(1)',
          zIndex: getWindowZIndex(windowName),
          opacity: closing[windowName] ? 0 : 1,
          filter: closing[windowName] ? 'blur(6px)' : 'blur(0px)',
          transition: 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1), filter 380ms cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: closing[windowName] ? 'none' : 'auto',
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <TopBar onPowerOff={handlePowerOff} />
      <Dock
        onOpenTerminal={() => openWindow('terminal')}
        onOpenBrave={() => openWindow('brave')}
        onOpenDiscord={() => openWindow('discord')}
        onOpenPostman={() => openWindow('postman')}
        onOpenCortex={() => openWindow('cortex')}
        isTerminalOpen={show.terminal}
        isBraveOpen={show.brave}
        isDiscordOpen={show.discord}
        isPostmanOpen={show.postman}
        isCortexOpen={show.cortex}
        isMaximized={isAnyMaximized}
      />

      {renderWindow(
        'terminal',
        show.terminal,
        <Terminal
          onOpenBrave={() => openWindow('brave')}
          onOpenDiscord={() => openWindow('discord')}
          onOpenPostman={() => openWindow('postman')}
          onOpenCortex={() => openWindow('cortex')}
          onClose={() => closeWindow('terminal')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, terminal: max }))}
        />,
      )}
      {renderWindow(
        'brave',
        show.brave,
        <BraveResumeBrowser
          onClose={() => closeWindow('brave')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, brave: max }))}
          onOpenCortex={() => openWindow('cortex')}
        />,
      )}
      {renderWindow('discord', show.discord, <Discord onClose={() => closeWindow('discord')} />)}
      {renderWindow(
        'postman',
        show.postman,
        <Postman
          onClose={() => closeWindow('postman')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, postman: max }))}
        />,
      )}
      {renderWindow(
        'cortex',
        show.cortex,
        <Cortex
          onClose={() => closeWindow('cortex')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, cortex: max }))}
        />,
      )}
    </div>
  );
};

export default Workstation;