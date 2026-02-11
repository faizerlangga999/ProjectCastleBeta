import { useState, useEffect } from "react";
import FormulaRenderer from "@/components/ui/FormulaRenderer";

interface OCRData {
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation_text: string;
}

interface OCRUploadPreviewProps {
    data: OCRData[];
    onSave: (data: OCRData[]) => void;
    onCancel: () => void;
}

export default function OCRUploadPreview({ data, onSave, onCancel }: OCRUploadPreviewProps) {
    const [questions, setQuestions] = useState<OCRData[]>(data);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [previewMode, setPreviewMode] = useState(true);

    // Update state when props change
    useEffect(() => {
        setQuestions(data);
    }, [data]);

    const activeQuestion = questions[activeQuestionIndex];

    const updateQuestion = (field: keyof OCRData, value: any) => {
        const updated = [...questions];
        updated[activeQuestionIndex] = { ...updated[activeQuestionIndex], [field]: value };
        setQuestions(updated);
    };

    const updateOption = (key: string, value: string) => {
        const updated = [...questions];
        updated[activeQuestionIndex].options = {
            ...updated[activeQuestionIndex].options,
            [key]: value
        };
        setQuestions(updated);
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

    const addNewQuestion = () => {
        setQuestions([...questions, {
            question_text: "",
            options: { "A": "", "B": "", "C": "", "D": "" },
            correct_answer: "A",
            explanation_text: ""
        }]);
        setActiveQuestionIndex(questions.length);
    };

    if (!activeQuestion) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Question Navigation (Sidebar-like) */}
            <div className="card p-4 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-900">Daftar Soal ({questions.length})</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${previewMode
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {previewMode ? "👁️ Preview On" : "✏️ Edit Mode"}
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {questions.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveQuestionIndex(idx)}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${idx === activeQuestionIndex
                                ? "bg-[var(--color-primary)] text-white"
                                : q.question_text
                                    ? "bg-green-100 text-green-700 border border-green-300"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                    <button
                        onClick={addNewQuestion}
                        className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all flex items-center justify-center"
                        title="Tambah Soal Manual"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Question Editor */}
            <div className="card p-6 bg-white border border-gray-200 rounded-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">
                        Edit Soal #{activeQuestionIndex + 1}
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
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Teks Soal <span className="text-gray-400 normal-case">(LaTeX: $...$)</span>
                    </label>
                    {previewMode ? (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                            <FormulaRenderer content={activeQuestion.question_text || "..."} />
                        </div>
                    ) : (
                        <textarea
                            value={activeQuestion.question_text}
                            onChange={(e) => updateQuestion("question_text", e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all resize-none font-mono text-sm"
                            rows={5}
                            placeholder="Tulis soal di sini..."
                        />
                    )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilihan Jawaban</label>
                    <div className="grid gap-3">
                        {Object.entries(activeQuestion.options).map(([key, value]) => (
                            <div key={key} className="flex gap-3 items-start">
                                <div
                                    onClick={() => updateQuestion("correct_answer", key)}
                                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold cursor-pointer transition-colors ${activeQuestion.correct_answer === key
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                    title="Klik untuk set jawaban benar"
                                >
                                    {key}
                                </div>
                                <div className="flex-1">
                                    {previewMode ? (
                                        <div className={`p-3 rounded-xl border ${activeQuestion.correct_answer === key ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                                            } min-h-[46px]`}>
                                            <FormulaRenderer content={value || "..."} />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => updateOption(key, e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all"
                                            placeholder={`Pilihan ${key}`}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Pembahasan <span className="text-gray-400 normal-case">(LaTeX: $...$)</span>
                    </label>
                    {previewMode ? (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                            <FormulaRenderer content={activeQuestion.explanation_text || "(Tidak ada pembahasan)"} />
                        </div>
                    ) : (
                        <textarea
                            value={activeQuestion.explanation_text}
                            onChange={(e) => updateQuestion("explanation_text", e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all resize-none font-mono text-sm"
                            rows={3}
                            placeholder="Tulis pembahasan di sini..."
                        />
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    onClick={onCancel}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                    Batalkan
                </button>
                <button
                    onClick={() => onSave(questions)}
                    className="flex-1 py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    Simpan Semua Soal ({questions.length})
                </button>
            </div>
        </div>
    );
}
