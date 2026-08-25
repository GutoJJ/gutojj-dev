import { Power, Gauge, Volume2, Bluetooth, Thermometer, MemoryStick, Gpu, Network } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import './topBar.css';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
};

const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = MONTHS[date.getMonth()];

    return `${day} de ${month}`;
};


function useDriftingValue(initial: number, min: number, max: number, maxStep: number) {
    const [value, setValue] = useState(initial);
    const ref = useRef(initial);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const step = (Math.random() * 2 - 1) * maxStep;
            let next = ref.current + step;

            if (next < min) next = min + Math.random() * maxStep;
            if (next > max) next = max - Math.random() * maxStep;

            ref.current = next;
            setValue(next);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [min, max, maxStep]);

    return value;
}

function TopBar() {
    const [now, setNow] = useState<Date>(new Date());

    const memory = useDriftingValue(42, 30, 60, 6);
    const temperature = useDriftingValue(38, 34, 46, 2);
    const gpu = useDriftingValue(20, 8, 35, 5);

    useEffect(() => {
        const updateNow = () => setNow(new Date());

        updateNow();

        const intervalId = window.setInterval(updateNow, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <div className="topBar">
            <div className="topBar-left">
                <div className="screens">
                    <div className="dash"></div>
                    <div className="dots"></div>
                </div>
            </div>
            <div className="topBar-center">
                <span className="topBar-date">{formatDate(now)}</span>
                <span className="topBar-time">{formatTime(now)}</span>
            </div>
            <div className="topBar-right">
                <div className="topBar-usage">
                    <span className="topBar-stat">
                        <MemoryStick strokeWidth={3} size={18} />
                        {Math.round(memory)}%
                    </span>
                    <span className="topBar-stat">
                        <Thermometer strokeWidth={3} size={18} />
                        {Math.round(temperature)}°C
                    </span>
                    <span className="topBar-stat" style={{ marginLeft: '6px' }}>
                        <Gpu strokeWidth={3} size={18} />
                        {Math.round(gpu)}%
                    </span>
                </div>
                <div className="topBar-lang">
                    <span>pt</span>
                </div>
                <div
                    className="topBar-sys-icons"
                    onClick={() => window.location.reload()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            window.location.reload();
                        }
                    }}
                >
                    <Network strokeWidth={3} size={17} />
                    <Bluetooth strokeWidth={3} size={17} />
                    <Volume2 strokeWidth={3} size={17} />
                    <Gauge strokeWidth={3} size={17} />
                    <Power strokeWidth={3} size={17} />
                </div>
            </div>
        </div>
    );
}

export default TopBar;