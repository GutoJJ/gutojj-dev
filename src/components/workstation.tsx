import { useEffect, useState } from 'react';
import TopBar from './topBar/topBar.tsx';
import Dock from './dock/dock.tsx';
import Terminal from './terminal/terminal.tsx';
import BraveResumeBrowser from './brave/brave.tsx';
import Discord from './discord/discord.tsx';
import Postman from './postman/postman.tsx';
import Cortex from './cortex/cortex.tsx';
import Nautilus from './nautilus/nautilus.tsx';
import TextEditor from './text_editor/textEditor.tsx';

// ── Window types ─────────────────────────────────────────────────────────

type SingletonWindow = 'terminal' | 'brave' | 'discord' | 'postman' | 'cortex' | 'nautilus';

// Text editor instances are keyed by their file path (or a uuid for new docs)
interface TextEditorInstance {
  id: string;          // unique key, e.g. file path joined or uuid
  filePath: string[] | null;
  fileName: string;
  initialContent: string;
}

type WindowId = SingletonWindow | string; // string for editor instance ids

const SINGLETON_NAMES: SingletonWindow[] = ['terminal', 'brave', 'discord', 'postman', 'cortex', 'nautilus'];

const WINDOW_BASE_Z = 10;

// ── Helpers ───────────────────────────────────────────────────────────────

function makeEditorId(filePath: string[] | null): string {
  return filePath ? filePath.join('/') : `editor-${crypto.randomUUID()}`;
}

// ── Workstation ───────────────────────────────────────────────────────────

const Workstation = () => {
  // Singleton windows
  const [show, setShow] = useState<Record<SingletonWindow, boolean>>({
    terminal: false,
    brave: false,
    discord: false,
    postman: false,
    cortex: false,
    nautilus: false,
  });

  const [closing, setClosing] = useState<Record<SingletonWindow, boolean>>({
    terminal: false,
    brave: false,
    discord: false,
    postman: false,
    cortex: false,
    nautilus: false,
  });

  const [maximizedWindows, setMaximizedWindows] = useState<Record<SingletonWindow, boolean>>({
    terminal: false,
    brave: false,
    discord: false,
    postman: false,
    cortex: false,
    nautilus: false,
  });

  // Text editor instances (multiple can be open)
  const [editors, setEditors] = useState<TextEditorInstance[]>([]);
  const [closingEditors, setClosingEditors] = useState<Set<string>>(new Set());
  const [maximizedEditors, setMaximizedEditors] = useState<Record<string, boolean>>({});

  // Unified z-order stack
  const [windowOrder, setWindowOrder] = useState<WindowId[]>([]);

  const isAnyMaximized = Object.values(maximizedWindows).some(Boolean) || Object.values(maximizedEditors).some(Boolean);

  // ── Z-order ─────────────────────────────────────────────────────────────

  const focusWindow = (id: WindowId) => {
    setWindowOrder((prev) => [...prev.filter((w) => w !== id), id]);
  };

  const getWindowZIndex = (id: WindowId) => {
    const idx = windowOrder.indexOf(id);
    return idx === -1 ? WINDOW_BASE_Z : WINDOW_BASE_Z + idx;
  };

  // ── Singleton open / close ───────────────────────────────────────────────

  const openWindow = (name: SingletonWindow) => {
    setShow((prev) => ({ ...prev, [name]: true }));
    setClosing((prev) => ({ ...prev, [name]: false }));
    focusWindow(name);
  };

  const closeWindow = (name: SingletonWindow) => {
    setClosing((prev) => ({ ...prev, [name]: true }));
    setMaximizedWindows((prev) => ({ ...prev, [name]: false }));
    setTimeout(() => {
      setShow((prev) => ({ ...prev, [name]: false }));
      setClosing((prev) => ({ ...prev, [name]: false }));
      setWindowOrder((prev) => prev.filter((w) => w !== name));
    }, 460);
  };

  // ── Text editor open / close ─────────────────────────────────────────────

  const openTextEditor = (filePath: string[] | null, fileName: string, content: string) => {
    const id = makeEditorId(filePath);

    // If a file is already open, focus it instead of creating a duplicate
    const existing = editors.find((e) => e.id === id);
    if (existing) {
      focusWindow(id);
      return;
    }

    setEditors((prev) => [...prev, { id, filePath, fileName, initialContent: content }]);
    focusWindow(id);
  };

  const closeTextEditor = (id: string) => {
    setClosingEditors((prev) => new Set(prev).add(id));
    setMaximizedEditors((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    setTimeout(() => {
      setEditors((prev) => prev.filter((e) => e.id !== id));
      setClosingEditors((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setWindowOrder((prev) => prev.filter((w) => w !== id));
    }, 460);
  };

  // ── Power off ────────────────────────────────────────────────────────────

  const handlePowerOff = () => {
    const allSingletons = SINGLETON_NAMES.reduce(
      (acc, n) => ({ ...acc, [n]: show[n] ? true : closing[n] }),
      {} as Record<SingletonWindow, boolean>,
    );
    setClosing(allSingletons);
    setMaximizedWindows(
      SINGLETON_NAMES.reduce((acc, n) => ({ ...acc, [n]: false }), {} as Record<SingletonWindow, boolean>),
    );
    // Close all editors
    setClosingEditors(new Set(editors.map((e) => e.id)));
    setMaximizedEditors({});

    setTimeout(() => {
      setShow(
        SINGLETON_NAMES.reduce((acc, n) => ({ ...acc, [n]: false }), {} as Record<SingletonWindow, boolean>),
      );
      setClosing(
        SINGLETON_NAMES.reduce((acc, n) => ({ ...acc, [n]: false }), {} as Record<SingletonWindow, boolean>),
      );
      setEditors([]);
      setClosingEditors(new Set());
      setWindowOrder([]);
      window.triggerDesktopExit?.();
    }, 460);
  };

  // ── Desktop-exit event ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => {
      setShow(
        SINGLETON_NAMES.reduce((acc, n) => ({ ...acc, [n]: false }), {} as Record<SingletonWindow, boolean>),
      );
      setClosing(
        SINGLETON_NAMES.reduce((acc, n) => ({ ...acc, [n]: false }), {} as Record<SingletonWindow, boolean>),
      );
      setMaximizedWindows(
        SINGLETON_NAMES.reduce((acc, n) => ({ ...acc, [n]: false }), {} as Record<SingletonWindow, boolean>),
      );
      setEditors([]);
      setClosingEditors(new Set());
      setMaximizedEditors({});
      setWindowOrder([]);
    };
    window.addEventListener('desktop-exit', handler);
    return () => window.removeEventListener('desktop-exit', handler);
  }, []);

  // ── Render helper ────────────────────────────────────────────────────────

  const wrapWindow = (id: WindowId, isClosing: boolean, content: React.ReactNode) => (
    <div
      key={id}
      className="window"
      onPointerDown={() => focusWindow(id)}
      style={{
        transform: isClosing ? 'translate(-50%, -50%) scale(0.88)' : 'translate(-50%, -50%) scale(1)',
        zIndex: getWindowZIndex(id),
        opacity: isClosing ? 0 : 1,
        filter: isClosing ? 'blur(6px)' : 'blur(0px)',
        transition: 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms cubic-bezier(0.16, 1, 0.3, 1), filter 380ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isClosing ? 'none' : 'auto',
      }}
    >
      {content}
    </div>
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <TopBar onPowerOff={handlePowerOff} />
      <Dock
        onOpenTerminal={() => openWindow('terminal')}
        onOpenBrave={() => openWindow('brave')}
        onOpenDiscord={() => openWindow('discord')}
        onOpenPostman={() => openWindow('postman')}
        onOpenCortex={() => openWindow('cortex')}
        onOpenNautilus={() => openWindow('nautilus')}
        isTerminalOpen={show.terminal}
        isBraveOpen={show.brave}
        isDiscordOpen={show.discord}
        isPostmanOpen={show.postman}
        isCortexOpen={show.cortex}
        isNautilusOpen={show.nautilus}
        isMaximized={isAnyMaximized}
      />

      {/* ── Singleton windows ── */}
      {show.terminal && wrapWindow(
        'terminal', closing.terminal,
        <Terminal
          onOpenBrave={() => openWindow('brave')}
          onOpenDiscord={() => openWindow('discord')}
          onOpenPostman={() => openWindow('postman')}
          onOpenCortex={() => openWindow('cortex')}
          onOpenNautilus={() => openWindow('nautilus')}
          onOpenTextEditor={(filePath, fileName, content) => openTextEditor(filePath, fileName, content)}
          onClose={() => closeWindow('terminal')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, terminal: max }))}
        />,
      )}

      {show.brave && wrapWindow(
        'brave', closing.brave,
        <BraveResumeBrowser
          onClose={() => closeWindow('brave')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, brave: max }))}
          onOpenCortex={() => openWindow('cortex')}
        />,
      )}

      {show.discord && wrapWindow(
        'discord', closing.discord,
        <Discord onClose={() => closeWindow('discord')} />,
      )}

      {show.postman && wrapWindow(
        'postman', closing.postman,
        <Postman
          onClose={() => closeWindow('postman')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, postman: max }))}
        />,
      )}

      {show.cortex && wrapWindow(
        'cortex', closing.cortex,
        <Cortex
          onClose={() => closeWindow('cortex')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, cortex: max }))}
        />,
      )}

      {show.nautilus && wrapWindow(
        'nautilus', closing.nautilus,
        <Nautilus
          onClose={() => closeWindow('nautilus')}
          onMaximizeChange={(max) => setMaximizedWindows((prev) => ({ ...prev, nautilus: max }))}
          onOpenTextEditor={(filePath, fileName, content) => openTextEditor(filePath, fileName, content)}
        />,
      )}

      {/* ── Text editor instances ── */}
      {editors.map((ed) =>
        wrapWindow(
          ed.id,
          closingEditors.has(ed.id),
          <TextEditor
            key={ed.id}
            filePath={ed.filePath}
            fileName={ed.fileName}
            initialContent={ed.initialContent}
            onClose={() => closeTextEditor(ed.id)}
            onMaximizeChange={(max) => setMaximizedEditors((prev) => ({ ...prev, [ed.id]: max }))}
          />,
        ),
      )}
    </div>
  );
};

export default Workstation;
