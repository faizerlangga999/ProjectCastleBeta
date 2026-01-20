"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";
import FormulaRenderer from "@/components/ui/FormulaRenderer";

interface Category {
    id: string;
    name: string;
}

interface QuestionForm {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation_text: string;
}

const DEFAULT_QUESTION: QuestionForm = {
    question_text: "",
    options: ["", ""],
    correct_answer: "A",
    explanation_text: ""
};

export default function AdminQuizCreatePage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Quiz settings
    const [quizTitle, setQuizTitle] = useState("");
    const [quizCategory, setQuizCategory] = useState("TPS");
    const [quizDuration, setQuizDuration] = useState(30);

    // New category input
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Questions
    const [questions, setQuestions] = useState<QuestionForm[]>([{ ...DEFAULT_QUESTION }]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState<string[]>([]);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const admin = await isAdmin();
            if (!admin) {
                router.push("/");
            } else {
                setLoading(false);
                fetchCategories();
            }
        };
        init();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const { data, error } = await supabase
                .from("categories")
                .insert([{ name: newCategoryName.trim() }])
                .select()
                .single();
            if (error) throw error;
            setCategories([...categories, data]);
            setQuizCategory(data.name);
            setNewCategoryName("");
            setShowAddCategory(false);
        } catch (error: any) {
            alert("Gagal menambahkan kategori: " + error.message);
        }
    };

    const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex] = value;
        setQuestions(updated);
    };

    const addOption = (qIndex: number) => {
        const updated = [...questions];
        if (updated[qIndex].options.length < 5) {
            updated[qIndex].options.push("");
            setQuestions(updated);
        }
    };

    const removeOption = (qIndex: number, optIndex: number) => {
        const updated = [...questions];
        if (updated[qIndex].options.length > 2) {
            updated[qIndex].options.splice(optIndex, 1);
            // Adjust correct answer if needed
            const maxLetter = String.fromCharCode(65 + updated[qIndex].options.length - 1);
            if (updated[qIndex].correct_answer > maxLetter) {
                updated[qIndex].correct_answer = "A";
            }
            setQuestions(updated);
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, { ...DEFAULT_QUESTION, options: ["", ""] }]);
        setActiveQuestionIndex(questions.length);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            const updated = questions.filter((_, i) => i !== index);
            setQuestions(updated);
            if (activeQuestionIndex >= updated.length) {
                setActiveQuestionIndex(updated.length - 1);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        if (!quizTitle.trim()) {
            newErrors.push("Judul kuis harus diisi");
        }

        questions.forEach((q, idx) => {
            if (!q.question_text.trim()) {
                newErrors.push(`Soal #${idx + 1}: Teks soal harus diisi`);
            }

            const emptyOptions = q.options.filter(opt => !opt.trim());
            if (emptyOptions.length > 0) {
                newErrors.push(`Soal #${idx + 1}: Semua pilihan jawaban harus diisi`);
            }

            if (!q.explanation_text.trim()) {
                newErrors.push(`Soal #${idx + 1}: Pembahasan harus diisi`);
            }
        });

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            // Create quiz
            const { data: quizData, error: quizError } = await supabase
                .from("quizzes")
                .insert([{
                    title: quizTitle,
                    category: quizCategory,
                    duration_minutes: quizDuration
                }])
                .select()
                .single();

            if (quizError) throw quizError;

            // Create questions
            const questionsToInsert = questions.map(q => ({
                quiz_id: quizData.id,
                question_text: q.question_text,
                options: q.options.reduce((acc, opt, idx) => {
                    acc[String.fromCharCode(65 + idx)] = opt;
                    return acc;
                }, {} as Record<string, string>),
                correct_answer: q.correct_answer,
                explanation_text: q.explanation_text
            }));

            const { error: questionsError } = await supabase
                .from("questions")
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            alert(`Berhasil membuat kuis "${quizTitle}" dengan ${questions.length} soal!`);
            router.push("/admin/lessons");
        } catch (error: any) {
            alert("Gagal membuat kuis: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getOptionLetter = (index: number) => String.fromCharCode(65 + index);
    const activeQuestion = questions[activeQuestionIndex];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Buat Soal Manual</h1>
                        <p className="text-sm text-gray-500 mt-1">Buat kuis dan soal dengan dukungan LaTeX</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-gray-500 hover:text-[var(--color-primary)] font-medium"
                    >
                        ← Kembali
                    </button>
                </div>

                {/* Quiz Settings */}
                <div className="card p-6 space-y-4">
                    <h2 className="font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">Pengaturan Kuis</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Kuis</label>
                            <input
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="Contoh: Latihan TPS - Penalaran Umum"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Waktu (menit)</label>
                            <input
                                type="number"
                                min={1}
                                value={quizDuration}
                                onChange={(e) => setQuizDuration(parseInt(e.target.value) || 30)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                        {showAddCategory ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Nama kategori baru..."
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                                >
                                    Simpan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddCategory(false);
                                        setNewCategoryName("");
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select
                                    value={quizCategory}
                                    onChange={(e) => setQuizCategory(e.target.value)}
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCategory(true)}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-all whitespace-nowrap"
                                >
                                    + Kategori Baru
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Question Navigation */}
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-900">Daftar Soal</h2>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-sm text-[var(--color-primary)] font-bold hover:underline"
                        >
                            {showPreview ? "Mode Edit" : "Preview LaTeX"}
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveQuestionIndex(idx)}
                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${idx === activeQuestionIndex
                                        ? "bg-[var(--color-primary)] text-white"
                                        : questions[idx].question_text.trim()
                                            ? "bg-green-100 text-green-700 border border-green-300"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button
                            onClick={addQuestion}
                            className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all flex items-center justify-center"
                            title="Tambah Soal"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Question Editor */}
                <div className="card p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">
                            Soal #{activeQuestionIndex + 1}
                        </h2>
                        {questions.length > 1 && (
                            <button
                                onClick={() => removeQuestion(activeQuestionIndex)}
                                className="text-sm text-red-500 hover:text-red-700 font-medium"
                            >
                                Hapus Soal Ini
                            </button>
                        )}
                    </div>

                    {/* Question Text */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Teks Soal <span className="text-gray-400 normal-case">(mendukung LaTeX: $x^2$)</span>
                        </label>
                        {showPreview ? (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]">
                                <FormulaRenderer content={activeQuestion.question_text || "..."} />
                            </div>
                        ) : (
                            <textarea
                                value={activeQuestion.question_text}
                                onChange={(e) => updateQuestion(activeQuestionIndex, "question_text", e.target.value)}
                                placeholder="Tulis soal di sini. Gunakan $...$ untuk LaTeX inline atau $$...$$ untuk block."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all resize-none font-mono text-sm"
                                rows={4}
                            />
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilihan Jawaban</label>
                        <div className="space-y-3">
                            {activeQuestion.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updateQuestion(activeQuestionIndex, "correct_answer", getOptionLetter(optIdx))}
                                        className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold transition-all ${activeQuestion.correct_answer === getOptionLetter(optIdx)
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                        title={activeQuestion.correct_answer === getOptionLetter(optIdx) ? "Jawaban benar" : "Klik untuk set sebagai jawaban benar"}
                                    >
                                        {getOptionLetter(optIdx)}
                                    </button>
                                    {showPreview ? (
                                        <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[44px]">
                                            <FormulaRenderer content={opt || "..."} />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => updateOption(activeQuestionIndex, optIdx, e.target.value)}
                                            placeholder={`Pilihan ${getOptionLetter(optIdx)}`}
                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
                                        />
                                    )}
                                    {activeQuestion.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(activeQuestionIndex, optIdx)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {activeQuestion.options.length < 5 && (
                            <button
                                type="button"
                                onClick={() => addOption(activeQuestionIndex)}
                                className="mt-3 text-sm text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Pilihan
                            </button>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            Klik huruf untuk menandai jawaban benar. Jawaban benar saat ini: <span className="font-bold text-green-600">{activeQuestion.correct_answer}</span>
                        </p>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Pembahasan <span className="text-gray-400 normal-case">(mendukung LaTeX)</span>
                        </label>
                        {showPreview ? (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[80px]">
                                <FormulaRenderer content={activeQuestion.explanation_text || "..."} />
                            </div>
                        ) : (
                            <textarea
                                value={activeQuestion.explanation_text}
                                onChange={(e) => updateQuestion(activeQuestionIndex, "explanation_text", e.target.value)}
                                placeholder="Tulis pembahasan di sini..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all resize-none font-mono text-sm"
                                rows={3}
                            />
                        )}
                    </div>
                </div>

                {/* Validation Errors */}
                {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="font-bold text-red-700 mb-2">Mohon perbaiki kesalahan berikut:</h3>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                            {errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                    >
                        {submitting ? "Menyimpan..." : `Simpan Kuis (${questions.length} Soal)`}
                    </button>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Tips LaTeX</h4>
                    <div className="text-xs text-blue-600 space-y-1">
                        <p>• Gunakan <code className="bg-blue-100 px-1 rounded">$...$</code> untuk formula inline</p>
                        <p>• Gunakan <code className="bg-blue-100 px-1 rounded">$$...$$</code> untuk formula block</p>
                        <p>• Contoh: <code className="bg-blue-100 px-1 rounded">$x^2 + y^2 = z^2$</code> → akan tampil sebagai formula matematika</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
