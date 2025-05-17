import React from 'react';
import { Question } from '../../types';
import Button from '../ui/Button';

interface QuestionDisplayProps {
    question: Question;
    onAnswer: (selectedOption: 'A' | 'B' | 'C' | 'D') => void;
    disabledOptions: boolean;
    selectedOption?: string | null;
    correctOption?: string | null;
    opponentAnswer?: string | null;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    onAnswer,
    disabledOptions,
    selectedOption,
    correctOption,
    opponentAnswer,
}) => {
    const options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }> = [
        { key: 'A', text: question.optionA },
        { key: 'B', text: question.optionB },
        { key: 'C', text: question.optionC },
        { key: 'D', text: question.optionD },
    ];

    const getOptionStyle = (optionKey: string) => {
        if (correctOption) { // Runde ist vorbei, zeige Ergebnisse
            if (optionKey === correctOption) return 'bg-green-500 text-white border-green-500'; // Korrekt
            if (optionKey === selectedOption && optionKey !== correctOption) return 'bg-red-500 text-white border-red-500'; // Eigene falsche Antwort
            if (optionKey === opponentAnswer && optionKey !== correctOption) return 'bg-red-300 text-red-800 border-red-300'; // Gegnerische falsche Antwort
        } else if (selectedOption === optionKey) { // Spieler hat diese Option gewählt
            return 'bg-primary border-primary text-white ring-2 ring-primary-dark ring-offset-1';
        }
        return 'bg-neutral-light border-neutral text-textPrimary'; // Standard-Stil für unausgewählte Optionen
    };

    return (
        <div className="card animate-fadeIn w-full max-w-2xl mx-auto">
            <p className="text-sm text-accent mb-2 text-center">{question.category || 'Allgemein'}</p>
            <h2 className="text-2xl font-semibold text-center text-textPrimary mb-6 min-h-[3em] flex items-center justify-center">
                {question.text}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((opt) => (
                    <Button
                        key={opt.key}
                        onClick={() => onAnswer(opt.key)}
                        disabled={disabledOptions || !!selectedOption}
                        className={`w-full text-left justify-start py-3 px-4 text-base min-h-[3.5em] ${getOptionStyle(opt.key)}`}
                    >
                        <span className="font-bold mr-2">{opt.key}:</span> {opt.text}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default QuestionDisplay;