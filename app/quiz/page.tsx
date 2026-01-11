"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import AuthModal from "@/components/ui/AuthModal";

// Mock quiz data
const MOCK_QUIZZES = [
    {
        id: 1,
        title: "TPS - Penalaran Umum",
        description: "Latihan soal penalaran logis, analitis, dan kritis",
        questions: 30,
        duration: 30,
        difficulty: "Sedang",
        category: "TPS",
        icon: "🧠",
    },
    {
        id: 2,
        title: "Literasi Bahasa Indonesia",
        description: "Pemahaman bacaan, kosa kata, dan tata bahasa",
        questions: 25,
        duration: 25,
        difficulty: "Mudah",
        category: "Literasi",
        icon: "📖",
    },
    {
        id: 3,
        title: "Penalaran Matematika",
        description: "Aljabar, geometri, statistika, dan logika matematika",
        questions: 20,
        duration: 30,
        difficulty: "Sulit",
        category: "Matematika",
        icon: "📐",
    },
    {
        id: 4,
        title: "Literasi Bahasa Inggris",
        description: "Reading comprehension dan vocabulary",
        questions: 20,
        duration: 20,
        difficulty: "Sedang",
        category: "Literasi",
        icon: "🌍",
    },
    {
        id: 5,
        title: "Penalaran Kuantitatif",
        description: "Numerik, pola bilangan, dan perhitungan cepat",
        questions: 15,
        duration: 15,
        difficulty: "Sulit",
        category: "TPS",
        icon: "🔢",
    },
];

// Mock questions for demo
const MOCK_QUESTIONS = [
    {
        id: 1,
        question: "Jika semua kucing adalah hewan, dan beberapa hewan bisa terbang, maka kesimpulan yang PASTI benar adalah...",
        options: {
            A: "Semua kucing bisa terbang",
            B: "Beberapa kucing bisa terbang",
            C: "Tidak ada kucing yang bisa terbang",
            D: "Tidak dapat disimpulkan apakah kucing bisa terbang",
            E: "Semua yang bisa terbang adalah kucing",
        },
        correctAnswer: "D",
        explanation: "Dari premis 'semua kucing adalah hewan' dan 'beberapa hewan bisa terbang', kita tidak bisa menyimpulkan apakah kucing termasuk dalam kelompok hewan yang bisa terbang atau tidak.",
    },
    {
        id: 2,
        question: "Pola bilangan: 2, 6, 12, 20, 30, ... Bilangan selanjutnya adalah...",
        options: {
            A: "40",
            B: "42",
            C: "44",
            D: "46",
            E: "48",
        },
        correctAnswer: "B",
        explanation: "Pola: selisih antar bilangan adalah 4, 6, 8, 10, ... (naik 2). Jadi selisih berikutnya adalah 12. 30 + 12 = 42.",
    },
    {
        id: 3,
        question: "Sebuah toko memberikan diskon 20% untuk semua produk. Jika harga setelah diskon adalah Rp 160.000, berapakah harga sebelum diskon?",
        options: {
            A: "Rp 180.000",
            B: "Rp 192.000",
            C: "Rp 200.000",
            D: "Rp 210.000",
            E: "Rp 220.000",
        },
        correctAnswer: "C",
        explanation: "Harga setelah diskon = 80% dari harga awal. Jadi harga awal = 160.000 / 0.8 = Rp 200.000.",
    },
];

const CATEGORIES = ["Semua", "TPS", "Literasi", "Matematika"];

export default function QuizPage() {
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [activeQuiz, setActiveQuiz] = useState<(typeof MOCK_QUIZZES[0] & { mode: "Latihan" | "Ujian" }) | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showExplanation, setShowExplanation] = useState<boolean | null>(null);

    // State for Auth Modal
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Fungsi untuk memulai kuis
    const startQuiz = (quiz: typeof MOCK_QUIZZES[0], mode: "Latihan" | "Ujian") => {
        if (mode === "Ujian") {
            setIsAuthModalOpen(true);
            return;
        }
        setActiveQuiz({
            ...quiz,
            mode,
        });
        // Reset state kuis
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowExplanation(null);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
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
        if (!showExplanation) {
            setAnswers(prev => ({ ...prev, [currentQuestionIndex]: key }));
        }
    };

    const handleConfirmAnswer = () => {
        setShowExplanation(true);
    };


    // RENDER: Quiz Taking View
    if (activeQuiz) {
        const question = MOCK_QUESTIONS[currentQuestionIndex];
        const selectedAnswer = answers[currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;

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
                                        Mode {activeQuiz.mode} • Soal {currentQuestionIndex + 1}/{MOCK_QUESTIONS.length}
                                    </p>
                                </div>
                            </div>
                            {activeQuiz.mode === "Ujian" && (
                                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-bold">29:45</span>
                                </div>
                            )}
                        </div>

                        {/* Question Navigation */}
                        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                            {MOCK_QUESTIONS.map((_, idx) => (
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
                        <p className="text-gray-900 font-medium mb-6 leading-relaxed">
                            {question.question}
                        </p>

                        {/* Options */}
                        <div className="space-y-3">
                            {Object.entries(question.options).map(([key, value]) => {
                                const isSelected = selectedAnswer === key;
                                const isCorrectOption = key === question.correctAnswer;

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
                                        disabled={activeQuiz.mode === "Latihan" && !!showExplanation}
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
                                        <span className="text-sm text-gray-700 pt-0.5">{value}</span>
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
                                    <>
                                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-bold text-green-700">Jawaban Benar! 🎉</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-bold text-red-700">Jawaban Salah</span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                <span className="font-semibold">Pembahasan:</span> {question.explanation}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Sebelumnya
                        </button>

                        {activeQuiz.mode === "Latihan" && !showExplanation ? (
                            <button
                                onClick={handleConfirmAnswer}
                                disabled={!selectedAnswer}
                                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Konfirmasi
                            </button>
                        ) : currentQuestionIndex === MOCK_QUESTIONS.length - 1 ? (
                            <button
                                onClick={() => setActiveQuiz(null)}
                                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                            >
                                Selesai ✓
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
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
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === cat
                                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                }`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Quiz Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOCK_QUIZZES.map((quiz) => (
                        <article key={quiz.id} className="card p-5 hover:border-[var(--color-primary-light)] transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${quiz.category === "TPS" ? "bg-blue-100 text-blue-700" :
                                    quiz.category === "Literasi" ? "bg-purple-100 text-purple-700" :
                                        "bg-orange-100 text-orange-700"
                                    }`}>
                                    {quiz.category}
                                </span>
                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                                    <span>⏱ {quiz.duration}m</span>
                                    <span>•</span>
                                    <span>{quiz.questions} Soal</span>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-1">{quiz.title}</h3>
                            <p className="text-xs text-gray-500 mb-4">{quiz.description}</p>

                            <div className="flex items-center gap-2 mt-auto">
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
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
