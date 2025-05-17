// frontend/components/admin/QuestionForm.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { Question } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Save, PlusCircle, XCircle } from 'lucide-react';

interface QuestionFormProps {
    onSubmit: (questionData: Partial<Question>) => Promise<void>;
    initialData?: Question | null;
    isLoading?: boolean;
    onCancel?: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
                                                       onSubmit,
                                                       initialData,
                                                       isLoading = false,
                                                       onCancel,
                                                   }) => {
    const [text, setText] = useState('');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [optionC, setOptionC] = useState('');
    const [optionD, setOptionD] = useState('');
    const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [category, setCategory] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (initialData) {
            setText(initialData.text || '');
            setOptionA(initialData.optionA || '');
            setOptionB(initialData.optionB || '');
            setOptionC(initialData.optionC || '');
            setOptionD(initialData.optionD || '');
            setCorrectOption((initialData.correctOption as 'A' | 'B' | 'C' | 'D') || 'A');
            setCategory(initialData.category || '');
        } else {
            // Reset form for new question
            setText('');
            setOptionA('');
            setOptionB('');
            setOptionC('');
            setOptionD('');
            setCorrectOption('A');
            setCategory('');
        }
    }, [initialData]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!text || !optionA || !optionB || !optionC || !optionD) {
            setFormError('Bitte alle Fragen- und Optionsfelder ausfüllen.');
            return;
        }
        const questionData: Partial<Question> = {
            id: initialData?.id, // Wichtig für Update
            text,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            category: category || undefined, // Send undefined if empty, not null
        };
        await onSubmit(questionData);
        // Formular-Reset wird extern gehandhabt oder durch initialData-Änderung
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-surface shadow-md rounded-lg">
            <h3 className="text-xl font-semibold text-textPrimary">
                {initialData ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
            </h3>
            {formError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{formError}</p>}

            <div>
                <label htmlFor="q-text" className="form-label">Fragetext</label>
                <textarea
                    id="q-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    className="form-input min-h-[80px]"
                    placeholder="Gib hier den vollständigen Fragetext ein..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input id="q-optA" label="Option A" value={optionA} onChange={(e) => setOptionA(e.target.value)} required placeholder="Antwortmöglichkeit A" />
                <Input id="q-optB" label="Option B" value={optionB} onChange={(e) => setOptionB(e.target.value)} required placeholder="Antwortmöglichkeit B" />
                <Input id="q-optC" label="Option C" value={optionC} onChange={(e) => setOptionC(e.target.value)} required placeholder="Antwortmöglichkeit C" />
                <Input id="q-optD" label="Option D" value={optionD} onChange={(e) => setOptionD(e.target.value)} required placeholder="Antwortmöglichkeit D" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="q-correct" className="form-label">Korrekte Option</label>
                    <select
                        id="q-correct"
                        value={correctOption}
                        onChange={(e) => setCorrectOption(e.target.value as 'A' | 'B' | 'C' | 'D')}
                        className="form-input"
                    >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>
                <Input id="q-category" label="Kategorie (optional)" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Klima, Ernährung" />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} leftIcon={<XCircle size={18} />}>
                        Abbrechen
                    </Button>
                )}
                <Button type="submit" isLoading={isLoading} disabled={isLoading} leftIcon={initialData ? <Save size={18}/> : <PlusCircle size={18}/>}>
                    {initialData ? 'Änderungen speichern' : 'Frage hinzufügen'}
                </Button>
            </div>
        </form>
    );
};

export default QuestionForm;