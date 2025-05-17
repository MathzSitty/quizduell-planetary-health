// frontend/components/game/TimerDisplay.tsx
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerDisplayProps {
    initialTime: number; // in Sekunden
    onTimeout: () => void;
    isRunning: boolean;
    resetKey?: string | number; // Ändere diesen Key, um den Timer zurückzusetzen
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ initialTime, onTimeout, isRunning, resetKey }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        setTimeLeft(initialTime); // Reset bei Key-Änderung oder initialTime-Änderung
    }, [resetKey, initialTime]);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) {
            if (timeLeft <= 0 && isRunning) { // Nur einmal onTimeout auslösen
                onTimeout();
            }
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, isRunning, onTimeout]);

    const percentage = (timeLeft / initialTime) * 100;
    let progressBarColor = 'bg-secondary'; // Grün
    if (percentage < 50) progressBarColor = 'bg-yellow-400'; // Gelb
    if (percentage < 25) progressBarColor = 'bg-red-500'; // Rot

    return (
        <div className="my-6 text-center">
            <div className="flex items-center justify-center text-3xl font-bold text-accent mb-2">
                <Clock size={30} className="mr-2" />
                {timeLeft}s
            </div>
            <div className="w-full max-w-md mx-auto bg-neutral rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-300 ease-linear ${progressBarColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default TimerDisplay;