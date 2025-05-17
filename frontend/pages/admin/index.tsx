// frontend/pages/admin/index.tsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import apiClient from '../../lib/apiClient';
import { Question, ApiResponse } from '../../types';
import QuestionForm from '../../components/admin/QuestionForm';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Edit3, Trash2, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
    useRequireAuth({ requireAdmin: true }); // Schützt die Seite

    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);

    const fetchQuestions = async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<ApiResponse<Question[]>>(`/questions?page=${page}&limit=${ITEMS_PER_PAGE}`);
            if (response.data.status === 'success' && response.data.questions) {
                setQuestions(response.data.questions);
                setTotalPages(response.data.totalPages || 1);
                setTotalQuestions(response.data.total || 0);
                setCurrentPage(response.data.currentPage || 1);
            } else {
                throw new Error(response.data.message || 'Fragen konnten nicht geladen werden.');
            }
        } catch (err: any) {
            console.error("Fehler beim Laden der Fragen:", err);
            setError(err.message || 'Ein Fehler ist aufgetreten.');
            toast.error(err.message || 'Fehler beim Laden der Fragen.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions(currentPage);
    }, [currentPage]);

    const handleFormSubmit = async (questionData: Partial<Question>) => {
        setFormSubmitting(true);
        try {
            if (editingQuestion && editingQuestion.id) { // Update
                await apiClient.put(`/questions/${editingQuestion.id}`, questionData);
                toast.success('Frage erfolgreich aktualisiert!');
            } else { // Create
                await apiClient.post('/questions', questionData);
                toast.success('Frage erfolgreich erstellt!');
            }
            setShowForm(false);
            setEditingQuestion(null);
            fetchQuestions(editingQuestion ? currentPage : 1); // Bei neuer Frage zur ersten Seite
        } catch (err: any) {
            console.error("Fehler beim Speichern der Frage:", err);
            toast.error(err.response?.data?.message || err.message || 'Fehler beim Speichern.');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Zum Formular scrollen
    };

    const handleDelete = async (questionId: string) => {
        if (window.confirm('Sicher, dass du diese Frage löschen möchtest? Dies kann nicht rückgängig gemacht werden.')) {
            try {
                await apiClient.delete(`/questions/${questionId}`);
                toast.success('Frage erfolgreich gelöscht!');
                setQuestions(prev => prev.filter(q => q.id !== questionId));
                // Optional: Wenn die aktuelle Seite leer wird, zur vorherigen Seite springen
                if (questions.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchQuestions(currentPage); // Um Paginierungsinfos neu zu laden
                }
            } catch (err: any) {
                console.error("Fehler beim Löschen der Frage:", err);
                toast.error(err.response?.data?.message || err.message || 'Fehler beim Löschen.');
            }
        }
    };

    const openNewQuestionForm = () => {
        setEditingQuestion(null);
        setShowForm(true);
    };

    return (
        <>
            <Head>
                <title>Admin: Fragenverwaltung - QuizDuell</title>
            </Head>
            <div className="main-container">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-textPrimary">Fragenverwaltung</h1>
                    <Button onClick={openNewQuestionForm} leftIcon={<PlusCircle size={20}/>} disabled={showForm && !editingQuestion}>
                        Neue Frage
                    </Button>
                </div>

                {showForm && (
                    <div className="mb-10">
                        <QuestionForm
                            onSubmit={handleFormSubmit}
                            initialData={editingQuestion}
                            isLoading={formSubmitting}
                            onCancel={() => { setShowForm(false); setEditingQuestion(null); }}
                        />
                    </div>
                )}

                {isLoading && <Spinner className="my-10" size="lg" />}
                {error && <p className="text-center text-red-500 my-10 bg-red-100 p-4 rounded-md">{error}</p>}

                {!isLoading && !error && questions.length === 0 && !showForm && (
                    <p className="text-center text-textSecondary my-10">
                        Keine Fragen gefunden. Erstelle die erste Frage!
                    </p>
                )}

                {!isLoading && !error && questions.length > 0 && (
                    <div className="bg-surface shadow-lg rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral">
                                <thead className="bg-neutral-light">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">Fragetext (gekürzt)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">Kategorie</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">Autor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">Aktionen</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral">
                                {questions.map((q) => (
                                    <tr key={q.id} className="hover:bg-neutral-light/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary max-w-sm truncate" title={q.text}>
                                            {q.text.substring(0, 60)}{q.text.length > 60 && '...'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">{q.category || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">{q.author?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(q)} title="Bearbeiten">
                                                <Edit3 size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-700 hover:bg-red-100" title="Löschen">
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="px-6 py-3 border-t border-neutral flex items-center justify-between">
                                <p className="text-sm text-textSecondary">
                                    Seite {currentPage} von {totalPages} (Gesamt: {totalQuestions} Fragen)
                                </p>
                                <div className="space-x-2">
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        size="sm"
                                        variant="outline"
                                        leftIcon={<ChevronLeft size={16}/>}
                                    >
                                        Vorherige
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        size="sm"
                                        variant="outline"
                                        rightIcon={<ChevronRight size={16}/>}
                                    >
                                        Nächste
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}