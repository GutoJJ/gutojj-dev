import { useState } from 'react';
import TopBar from './topBar/topBar.tsx';
import Dock from './dock/dock.tsx';
import Terminal from './terminal/terminal.tsx';
import BraveResumeBrowser from './brave/brave.tsx';

const Workstation = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [showBrave, setShowBrave] = useState(false);
  const [closing, setClosing] = useState({ terminal: false, brave: false });
  const [activeWindow, setActiveWindow] = useState<'terminal' | 'brave' | null>(null);

  const focusWindow = (windowName: 'terminal' | 'brave') => {
    setActiveWindow(windowName);
  };

  const openTerminal = () => {
    setClosing((prev) => ({ ...prev, terminal: false }));
    setShowTerminal(true);
    setActiveWindow('terminal');
  };

  const openBrave = () => {
    setClosing((prev) => ({ ...prev, brave: false }));
    setShowBrave(true);
    setActiveWindow('brave');
  };

  const closeWindow = (windowName: 'terminal' | 'brave') => {
    setClosing((prev) => ({ ...prev, [windowName]: true }));

    setTimeout(() => {
      if (windowName === 'terminal') setShowTerminal(false);
      if (windowName === 'brave') setShowBrave(false);

      setClosing((prev) => ({ ...prev, [windowName]: false }));

      if (activeWindow === windowName) {
        setActiveWindow((prev) => {
          if (prev === 'terminal' && showBrave) return 'brave';
          if (prev === 'brave' && showTerminal) return 'terminal';
          return null;
        });
      }
    }, 220);
  };

  return (
    <div className="teste" style={{ position: 'relative', minHeight: '100vh' }}>
      <TopBar />
      <Dock onOpenTerminal={openTerminal} onOpenBrave={openBrave} />

      {showTerminal && (
        <div
          onPointerDown={() => focusWindow('terminal')}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: closing.terminal ? 'translate(-50%, -50%) scale(0.9)' : 'translate(-50%, -50%) scale(1)',
            zIndex: activeWindow === 'terminal' ? 2 : 1,
            opacity: closing.terminal ? 0 : 1,
            transition: 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: 'auto',
          }}
        >
          <Terminal onClose={() => closeWindow('terminal')} />
        </div>
      )}

      {showBrave && (
        <div
          onPointerDown={() => focusWindow('brave')}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: closing.brave ? 'translate(-50%, -50%) scale(0.9)' : 'translate(-50%, -50%) scale(1)',
            zIndex: activeWindow === 'brave' ? 2 : 1,
            opacity: closing.brave ? 0 : 1,
            transition: 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: 'auto',
          }}
        >
          <BraveResumeBrowser onClose={() => closeWindow('brave')} />
        </div>
      )}
    </div>
  );
};

export default Workstation;
