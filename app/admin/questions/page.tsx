"use client";

import { useState, useEffect, Suspense } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter, useSearchParams } from "next/navigation";
import FormulaRenderer from "@/components/ui/FormulaRenderer";

interface Question {
    id: string;
    quiz_id: string;
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation_text: string;
    question_image_url: string | null;
    explanation_image_url: string | null;
}

interface Quiz {
    id: string;
    title: string;
}

function AdminQuestionsContent() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuizId, setSelectedQuizId] = useState<string>("");
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [editForm, setEditForm] = useState<Partial<Question>>({});
    const [showPreview, setShowPreview] = useState(false);

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const init = async () => {
            const admin = await isAdmin();
            if (!admin) {
                router.push("/");
            } else {
                setLoading(false);
                fetchQuizzes();
                const quizParam = searchParams.get("quiz");
                if (quizParam) {
                    setSelectedQuizId(quizParam);
                }
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedQuizId) {
            fetchQuestions();
        }
    }, [selectedQuizId]);

    const fetchQuizzes = async () => {
        const { data } = await supabase.from("quizzes").select("id, title").order("title");
        setQuizzes(data || []);
    };

    const fetchQuestions = async () => {
        const { data } = await supabase
            .from("questions")
            .select("*")
            .eq("quiz_id", selectedQuizId);
        setQuestions(data || []);
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setEditForm({
            question_text: question.question_text,
            options: { ...question.options },
            correct_answer: question.correct_answer,
            explanation_text: question.explanation_text,
            question_image_url: question.question_image_url,
            explanation_image_url: question.explanation_image_url
        });
    };

    const handleUpdateOption = (key: string, value: string) => {
        setEditForm({
            ...editForm,
            options: { ...editForm.options, [key]: value }
        });
    };

    const handleSaveEdit = async () => {
        if (!editingQuestion) return;
        try {
            const { error } = await supabase
                .from("questions")
                .update({
                    question_text: editForm.question_text,
                    options: editForm.options,
                    correct_answer: editForm.correct_answer,
                    explanation_text: editForm.explanation_text,
                    question_image_url: editForm.question_image_url || null,
                    explanation_image_url: editForm.explanation_image_url || null
                })
                .eq("id", editingQuestion.id);
            if (error) throw error;
            setEditingQuestion(null);
            fetchQuestions();
        } catch (error: any) {
            alert("Gagal menyimpan: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus soal ini?")) return;
        try {
            const { error } = await supabase.from("questions").delete().eq("id", id);
            if (error) throw error;
            fetchQuestions();
        } catch (error: any) {
            alert("Gagal menghapus: " + error.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kelola Soal</h1>
                        <p className="text-sm text-gray-500 mt-1">Edit dan hapus soal kuis</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin")}
                        className="text-sm text-gray-500 hover:text-[var(--color-primary)] font-medium"
                    >
                        ← Kembali
                    </button>
                </div>

                {/* Quiz Selector */}
                <div className="card p-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Kuis</label>
                    <select
                        value={selectedQuizId}
                        onChange={(e) => setSelectedQuizId(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                    >
                        <option value="">-- Pilih Kuis --</option>
                        {quizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                        ))}
                    </select>
                </div>

                {/* Questions List */}
                {selectedQuizId && (
                    <div className="space-y-4">
                        <h2 className="font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">
                            Daftar Soal ({questions.length})
                        </h2>
                        {questions.map((question, idx) => (
                            <div key={question.id} className="card p-5 border border-gray-100">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                                        Soal #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(question)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(question.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-700 mb-3">
                                    <FormulaRenderer content={question.question_text.substring(0, 200) + (question.question_text.length > 200 ? "..." : "")} />
                                </div>
                                {question.question_image_url && (
                                    <div className="mb-3">
                                        <img src={question.question_image_url} alt="Question" className="max-h-32 rounded-lg" />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Jawaban: <span className="font-bold text-green-600">{question.correct_answer}</span></span>
                                    <span>•</span>
                                    <span>{Object.keys(question.options).length} pilihan</span>
                                </div>
                            </div>
                        ))}

                        {questions.length === 0 && (
                            <div className="text-center py-12 card border-dashed">
                                <p className="text-gray-400">Belum ada soal di kuis ini.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit Modal */}
                {editingQuestion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4 animate-slide-up my-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Edit Soal</h3>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="text-sm text-[var(--color-primary)] font-bold"
                                >
                                    {showPreview ? "Mode Edit" : "Preview"}
                                </button>
                            </div>

                            {/* Question Text */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teks Soal</label>
                                {showPreview ? (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[80px]">
                                        <FormulaRenderer content={editForm.question_text || ""} />
                                    </div>
                                ) : (
                                    <textarea
                                        value={editForm.question_text}
                                        onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] font-mono text-sm"
                                        rows={4}
                                    />
                                )}
                            </div>

                            {/* Question Image URL */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Gambar Soal (opsional)</label>
                                <input
                                    type="url"
                                    value={editForm.question_image_url || ""}
                                    onChange={(e) => setEditForm({ ...editForm, question_image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                                {editForm.question_image_url && (
                                    <img src={editForm.question_image_url} alt="Preview" className="mt-2 max-h-32 rounded-lg" />
                                )}
                            </div>

                            {/* Options */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilihan Jawaban</label>
                                <div className="space-y-2">
                                    {editForm.options && Object.entries(editForm.options).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, correct_answer: key })}
                                                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm ${editForm.correct_answer === key
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {key}
                                            </button>
                                            {showPreview ? (
                                                <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                                    <FormulaRenderer content={value} />
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleUpdateOption(key, e.target.value)}
                                                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)]"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Explanation */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pembahasan</label>
                                {showPreview ? (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[60px]">
                                        <FormulaRenderer content={editForm.explanation_text || ""} />
                                    </div>
                                ) : (
                                    <textarea
                                        value={editForm.explanation_text}
                                        onChange={(e) => setEditForm({ ...editForm, explanation_text: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] font-mono text-sm"
                                        rows={3}
                                    />
                                )}
                            </div>

                            {/* Explanation Image URL */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Gambar Pembahasan (opsional)</label>
                                <input
                                    type="url"
                                    value={editForm.explanation_image_url || ""}
                                    onChange={(e) => setEditForm({ ...editForm, explanation_image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingQuestion(null)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default function AdminQuestionsPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
                </div>
            </MainLayout>
        }>
            <AdminQuestionsContent />
        </Suspense>
    );
}
