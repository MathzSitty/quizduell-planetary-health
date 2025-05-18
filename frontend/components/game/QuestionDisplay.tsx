import React from 'react';
import { Question } from '../../types';
import Button from '../ui/Button';
import { CheckCircle, XCircle } from 'lucide-react';

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
            if (optionKey === correctOption) 
                return 'bg-green-50 !text-green-700 border-2 border-green-500 font-medium'; // Korrekte Antwort
            if (optionKey === selectedOption && optionKey !== correctOption) 
                return 'bg-red-50 !text-red-700 border-2 border-red-500 font-medium'; // Eigene falsche Antwort
            if (optionKey === opponentAnswer && optionKey !== correctOption) 
                return 'bg-red-50/70 !text-red-500 border-2 border-red-300'; // Gegnerische falsche Antwort
            // Andere Optionen leicht ausgrauen
            return 'bg-gray-50 !text-gray-500 border border-gray-300 opacity-70'; 
        } else if (selectedOption === optionKey) { // Spieler hat diese Option gewählt
            return 'bg-primary/5 !text-textPrimary border-2 border-primary';
        }
        return 'bg-white !text-textPrimary border border-textPrimary hover:border-primary transition-colors'; // Standard-Stil
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
                        variant="outline"
                        className={`w-full text-left justify-start py-3 px-4 text-base min-h-[3.5em] relative ${getOptionStyle(opt.key)}`}
                    >
                        <span className="font-bold mr-2">{opt.key}:</span> {opt.text}
                        
                        {/* Icons für richtige/falsche Antworten */}
                        {correctOption && (
                            <>
                                {opt.key === correctOption && (
                                    <span className="absolute right-3 text-green-500">
                                        <CheckCircle size={20} />
                                    </span>
                                )}
                                {opt.key === selectedOption && opt.key !== correctOption && (
                                    <span className="absolute right-3 text-red-500">
                                        <XCircle size={20} />
                                    </span>
                                )}
                            </>
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default QuestionDisplay;