import { useEffect, useRef, useState } from 'react';
import Teste from './components/workstation';
import './app.css';
import { Eye } from 'lucide-react';

const PASSWORD_LENGTH = 11;

function App() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [screen, setScreen] = useState<'clock' | 'user'>('clock');
  const [typedBalls, setTypedBalls] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const dragStartY = useRef<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detecta se o dispositivo tem suporte a toque
    const hasTouch = typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
    setIsTouchDevice(Boolean(hasTouch));

    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);

      const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const dayName = days[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];
      setDate(`${dayName}, ${dayNum} de ${monthName}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTyping = () => {
    if (isUnlocked || isTransitioning) return;
    setTypedBalls(0);
    setIsTyping(true);
  };

  useEffect(() => {
    if (screen !== 'user') {
      setIsTyping(false);
      setTypedBalls(0);
      return;
    }

    setTypedBalls(0);
    setIsTyping(false);
  }, [screen]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isUnlocked || isTransitioning) return;

      if (event.deltaY < 0) {
        setScreen('user');
      } else if (event.deltaY > 0) {
        setScreen('clock');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isUnlocked || isTransitioning) return;

      if (event.key === 'Escape' || event.key === 'Backspace') {
        setScreen('clock');
        return;
      }

      if (event.key === 'Enter' && screen === 'clock') {
        setScreen('user');
      }

      if (event.key === 'Enter' || (event.code === 'Space' || event.key === ' ') && screen === 'user') {
        startTyping();
      }

      if ((event.code === 'Space' || event.key === ' ') && screen === 'clock') {
        setScreen('user');
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUnlocked, isTransitioning, screen]);

  useEffect(() => {
    if (!isTyping) return;

    const interval = setInterval(() => {
      setTypedBalls((current) => {
        const nextValue = current + 1;
        if (nextValue >= PASSWORD_LENGTH) {
          clearInterval(interval);
          return PASSWORD_LENGTH;
        }

        return nextValue;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    if (typedBalls < PASSWORD_LENGTH) return;

    setIsTransitioning(true);
    const timeout = setTimeout(() => setIsUnlocked(true), 950);
    return () => clearTimeout(timeout);
  }, [typedBalls]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || isUnlocked || isTransitioning) return;

    const deltaY = event.clientY - dragStartY.current;
    if (Math.abs(deltaY) > 40) {
      setScreen(deltaY < 0 ? 'user' : 'clock');
      dragStartY.current = null;
    }
  };

  const handlePointerUp = () => {
    dragStartY.current = null;
  };

  const handleTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isUnlocked || isTransitioning) return;

    // Não alternar se o usuário clicou em um botão/elemento interativo
    const target = event.target as HTMLElement | null;
    if (target && target.closest('button, input, .fake-input')) return;

    setScreen((prev) => (prev === 'clock' ? 'user' : 'clock'));
  };

  

  const desktopHandlers = !isTouchDevice ? { onClick: handleTap } : {};

  // Fallback para dispositivos que não disparam PointerEvents corretamente
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    dragStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || isUnlocked || isTransitioning) return;

    const deltaY = event.touches[0]?.clientY - dragStartY.current;
    if (Math.abs(deltaY) > 40) {
      setScreen(deltaY < 0 ? 'user' : 'clock');
      dragStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    dragStartY.current = null;
  };

  // Handlers agrupados para spread condicional
  const mobileHandlers = isTouchDevice
    ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      }
    : {};

  if (isUnlocked) {
    return <Teste />;
  }

  return (
    <div className={`lock-screen ${isTransitioning ? 'unlocking' : ''}`}>
      <div
        className={`screen-stage ${screen === 'user' ? 'user-visible' : ''} ${isTouchDevice ? 'touch-enabled' : ''}`}
        {...mobileHandlers}
        {...desktopHandlers}
      >
        <div className="clock-panel">
          <div className="time">{time}</div>
          <div className="date">{date}</div>
        </div>

        <div className="user-panel">
          <div className="pfp" />
          <div className="username">Augusto Jung</div>

          <button
            type="button"
            className="fake-input"
            onClick={startTyping}
            aria-label="Digite a senha"
          >
            {typedBalls === 0 ? (
              <span className="password-placeholder">Senha</span>
            ) : (
              Array.from({ length: PASSWORD_LENGTH }).map((_, index) => (
                <span
                  key={index}
                  className={`bolas ${index < typedBalls ? 'filled' : ''}`}
                  style={{ transitionDelay: `${index * 28}ms` }}
                />
              ))
            )}
            <Eye size={18} className="password-eye-icon" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;