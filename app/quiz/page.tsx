"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout";
import AuthModal from "@/components/ui/AuthModal";
import { createClient } from "@/utils/supabase/client";
import { Quiz, Question } from "@/utils/types";
import FormulaRenderer from "@/components/ui/FormulaRenderer";

interface Category {
    id: string;
    name: string;
}

export default function QuizPage() {
    const supabase = createClient();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [activeQuiz, setActiveQuiz] = useState<(Quiz & { mode: "Latihan" | "Ujian" }) | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showExplanation, setShowExplanation] = useState<boolean | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Exam confirmation modal
    const [showExamConfirm, setShowExamConfirm] = useState(false);
    const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);

    // Timer states
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState<{ score: number, total: number } | null>(null);

    useEffect(() => {
        fetchQuizzes();
        fetchCategories();
    }, [activeCategory]);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    };

    useEffect(() => {
        if (activeQuiz?.mode === "Ujian" && timeLeft !== null) {
            if (timeLeft > 0) {
                timerRef.current = setInterval(() => {
                    setTimeLeft(prev => (prev !== null ? prev - 1 : 0));
                }, 1000);
            } else {
                handleSubmitQuiz();
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeQuiz, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            let query = supabase.from("quizzes").select("*");
            if (activeCategory !== "Semua") {
                query = query.eq("category", activeCategory);
            }
            const { data, error } = await query;
            if (error) throw error;
            setQuizzes(data || []);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestions = async (quizId: string) => {
        try {
            const { data, error } = await supabase
                .from("questions")
                .select("*")
                .eq("quiz_id", quizId);
            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    const startQuiz = async (quiz: Quiz, mode: "Latihan" | "Ujian") => {
        const { data: { user } } = await supabase.auth.getUser();
        if (mode === "Ujian" && !user) {
            setIsAuthModalOpen(true);
            return;
        }

        // Show confirmation modal for exam mode
        if (mode === "Ujian") {
            setPendingQuiz(quiz);
            setShowExamConfirm(true);
            return;
        }

        await actuallyStartQuiz(quiz, mode);
    };

    const confirmStartExam = async () => {
        if (pendingQuiz) {
            setShowExamConfirm(false);
            await actuallyStartQuiz(pendingQuiz, "Ujian");
            setPendingQuiz(null);
        }
    };

    const actuallyStartQuiz = async (quiz: Quiz, mode: "Latihan" | "Ujian") => {
        await fetchQuestions(quiz.id);
        setActiveQuiz({ ...quiz, mode });
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowExplanation(null);
        setShowResult(null);

        if (mode === "Ujian") {
            setTimeLeft(quiz.duration_minutes * 60);
        } else {
            setTimeLeft(null);
        }
    };

    const handleSubmitQuiz = async () => {
        if (!activeQuiz || !questions.length) return;

        setIsSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correct_answer) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / questions.length) * 100);

        try {
            if (activeQuiz.mode === "Ujian") {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from("quiz_attempts").insert({
                        user_id: user.id,
                        quiz_id: activeQuiz.id,
                        score: score
                    });
                }
            }
            setShowResult({ score, total: questions.length });
        } catch (error) {
            console.error("Error saving quiz attempt:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setShowExplanation(null);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setShowExplanation(activeQuiz?.mode === "Latihan" && !!answers[currentQuestionIndex - 1]);
        }
    };

    const handleSelectOption = (key: string) => {
        if (!showExplanation && !showResult) {
            setAnswers(prev => ({ ...prev, [currentQuestionIndex]: key }));
        }
    };

    const handleConfirmAnswer = () => {
        setShowExplanation(true);
    };

    // RENDER: Quiz Result View
    if (showResult) {
        return (
            <MainLayout>
                <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in">
                    <div className="card p-8 text-center space-y-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl text-green-600">🏆</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Kuis Selesai!</h2>
                            <p className="text-gray-500 mt-2">Ini hasil perjuanganmu hari ini:</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-2 gap-4">
                            <div className="text-left">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Skor Akhir</p>
                                <p className="text-4xl font-extrabold text-[var(--color-primary)]">{showResult.score}</p>
                            </div>
                            <div className="text-left border-l border-gray-200 pl-4">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Benar</p>
                                <p className="text-4xl font-extrabold text-green-600">
                                    {Math.round((showResult.score / 100) * showResult.total)}/{showResult.total}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4">
                            <button
                                onClick={() => {
                                    setActiveQuiz(null);
                                    setShowResult(null);
                                }}
                                className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all"
                            >
                                Kembali ke Dashboard
                            </button>
                            {activeQuiz?.mode === "Latihan" && (
                                <p className="text-xs text-gray-400">Kamu bisa meninjau jawabanmu melalui fitur riwayat di profil (segera hadir).</p>
                            )}
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // RENDER: Quiz Taking View
    if (activeQuiz && questions.length > 0) {
        const question = questions[currentQuestionIndex];
        const selectedAnswer = answers[currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correct_answer;

        return (
            <MainLayout>
                <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0">
                    {/* Quiz Header */}
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveQuiz(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="font-bold text-gray-900">{activeQuiz.title}</h2>
                                    <p className="text-xs text-gray-500">
                                        Mode {activeQuiz.mode} • Soal {currentQuestionIndex + 1}/{questions.length}
                                    </p>
                                </div>
                            </div>
                            {activeQuiz.mode === "Ujian" && timeLeft !== null && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-bold">{formatTime(timeLeft)}</span>
                                </div>
                            )}
                        </div>

                        {/* Question Navigation */}
                        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentQuestionIndex(idx);
                                        setShowExplanation(activeQuiz.mode === "Latihan" && !!answers[idx]);
                                    }}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0 transition-all ${idx === currentQuestionIndex
                                        ? "bg-[var(--color-primary)] text-white"
                                        : answers[idx]
                                            ? "bg-green-100 text-green-700 border border-green-300"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="card p-6">
                        <div className="text-gray-900 font-medium mb-6 leading-relaxed">
                            <FormulaRenderer content={question.question_text} />
                        </div>

                        {question.question_image_url && (
                            <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-sm max-h-80 text-center">
                                <img src={question.question_image_url} alt="Question" className="inline-block max-w-full h-auto object-contain" />
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-3">
                            {Object.entries(question.options).map(([key, value]) => {
                                const isSelected = selectedAnswer === key;
                                const isCorrectOption = key === question.correct_answer;

                                let optionClass = "border-gray-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]";

                                if (showExplanation) {
                                    if (activeQuiz.mode === "Latihan") {
                                        if (isCorrectOption) optionClass = "border-green-500 bg-green-50";
                                        else if (isSelected) optionClass = "border-red-500 bg-red-50";
                                    } else {
                                        if (isSelected) optionClass = "border-[var(--color-primary)] bg-[var(--color-primary-50)]";
                                    }
                                } else if (isSelected) {
                                    optionClass = "border-[var(--color-primary)] bg-[var(--color-primary-50)]";
                                }

                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleSelectOption(key)}
                                        disabled={(activeQuiz.mode === "Latihan" && !!showExplanation) || isSubmitting}
                                        className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all ${optionClass}`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${showExplanation && activeQuiz.mode === "Latihan"
                                            ? isCorrectOption
                                                ? "bg-green-500 text-white"
                                                : isSelected
                                                    ? "bg-red-500 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                            : isSelected
                                                ? "bg-[var(--color-primary)] text-white"
                                                : "bg-gray-200 text-gray-600"
                                            }`}>
                                            {key}
                                        </span>
                                        <div className="text-sm text-gray-700 pt-0.5">
                                            <FormulaRenderer content={value as string} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Explanation (Practice Mode) */}
                    {showExplanation && activeQuiz.mode === "Latihan" && (
                        <div className={`card p-5 ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            <div className="flex items-center gap-2 mb-3">
                                {isCorrect ? (
                                    <span className="font-bold text-green-700 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Jawaban Benar! 🎉
                                    </span>
                                ) : (
                                    <span className="font-bold text-red-700 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Jawaban Salah
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed">
                                <span className="font-bold">Pembahasan:</span> <FormulaRenderer content={question.explanation_text} />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0 || isSubmitting}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Sebelumnya
                        </button>

                        {activeQuiz.mode === "Latihan" && !showExplanation ? (
                            <button
                                onClick={handleConfirmAnswer}
                                disabled={!selectedAnswer || isSubmitting}
                                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Konfirmasi
                            </button>
                        ) : currentQuestionIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Selesai ✓'}
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all"
                            >
                                Selanjutnya →
                            </button>
                        )}
                    </div>
                </div>
            </MainLayout>
        );
    }

    // RENDER: Default List View
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    title="Login untuk Mode Ujian"
                    message="Mode ujian dengan timer dan simulasi skor hanya tersedia untuk member yang sudah login. Yuk login dulu!"
                />

                {/* Exam Confirmation Modal */}
                {showExamConfirm && pendingQuiz && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-slide-up shadow-2xl">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">🎯</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Mode Ujian</h3>
                                <p className="text-gray-500 mt-2 text-sm">
                                    Kamu akan memasuki sesi ujian yang tidak bisa dijeda. Pastikan:
                                </p>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Koneksi internet stabil
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Waktu luang tersedia
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Siap mengerjakan dengan fokus
                                </li>
                            </ul>
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Waktu Pengerjaan</p>
                                <p className="text-2xl font-bold text-[var(--color-primary)]">{pendingQuiz.duration_minutes} menit</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowExamConfirm(false);
                                        setPendingQuiz(null);
                                    }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmStartExam}
                                    className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all"
                                >
                                    Mulai Ujian
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bank Soal UTBK</h1>
                    <p className="text-sm text-gray-500 mt-1">Latihan soal intensif dengan pembahasan lengkap</p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="card p-4 bg-white border-l-4 border-l-blue-500">
                        <p className="text-xs text-gray-500 font-medium">Latihan Selesai</p>
                        <p className="text-xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-l-green-500">
                        <p className="text-xs text-gray-500 font-medium">Rata-rata Skor</p>
                        <p className="text-xl font-bold text-gray-900">-</p>
                    </div>
                </div>

                {/* Quiz Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        key="semua"
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === "Semua"
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                            : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            }`}
                        onClick={() => setActiveCategory("Semua")}
                    >
                        Semua
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === cat.name
                                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                }`}
                            onClick={() => setActiveCategory(cat.name)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Quiz Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="card p-5 animate-pulse bg-gray-50 h-44"></div>
                        ))
                    ) : quizzes.length > 0 ? (
                        quizzes.map((quiz) => (
                            <article key={quiz.id} className="card p-5 hover:border-[var(--color-primary-light)] transition-colors flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${quiz.category === "TPS" ? "bg-blue-100 text-blue-700" :
                                        quiz.category === "Literasi" ? "bg-purple-100 text-purple-700" :
                                            "bg-orange-100 text-orange-700"
                                        }`}>
                                        {quiz.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                                        <span>⏱ {quiz.duration_minutes}m</span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 text-lg mb-1">{quiz.title}</h3>
                                <div className="flex items-center gap-2 mt-auto pt-4">
                                    <button
                                        onClick={() => startQuiz(quiz, "Latihan")}
                                        className="flex-1 px-3 py-2 bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors"
                                    >
                                        Latihan
                                    </button>
                                    <button
                                        onClick={() => startQuiz(quiz, "Ujian")}
                                        className="flex-1 px-3 py-2 bg-[var(--color-primary)] text-white text-sm font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Ujian
                                    </button>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center card bg-white">
                            <p className="text-gray-500">Belum ada kuis tersedia di kategori ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
