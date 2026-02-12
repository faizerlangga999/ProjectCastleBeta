"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";
import FormulaRenderer from "@/components/ui/FormulaRenderer";
import Papa from "papaparse";

interface Category {
    id: string;
    name: string;
}

interface Quiz {
    id: string;
    title: string;
    category: string;
    duration_minutes: number;
}

interface QuestionForm {
    question_text: string;
    image_url: string;
    options: string[];
    correct_answer: string;
    explanation_text: string;
    explanation_image_url: string;
    manim_slides_url: string;
    type: "multiple_choice" | "short_answer";
}

interface OCRData {
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation_text: string;
}

const DEFAULT_QUESTION: QuestionForm = {
    question_text: "",
    image_url: "",
    options: ["", ""], // Default to 2 options
    correct_answer: "A",
    explanation_text: "",
    explanation_image_url: "",
    manim_slides_url: "",
    type: "multiple_choice"
};

export default function AdminQuizCreatePage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Global Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [existingQuizzes, setExistingQuizzes] = useState<Quiz[]>([]);

    // Operation Modes
    const [quizMode, setQuizMode] = useState<"new" | "existing">("new");
    const [inputMode, setInputMode] = useState<"manual" | "upload">("manual");
    const [uploadTab, setUploadTab] = useState<"csv" | "ocr">("csv");

    // Quiz settings (New)
    const [quizTitle, setQuizTitle] = useState("");
    const [quizCategory, setQuizCategory] = useState("TPS");
    const [quizDuration, setQuizDuration] = useState(10); // Default 10 minutes

    // Quiz settings (Existing)
    const [selectedQuizId, setSelectedQuizId] = useState("");

    // New category input
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Files
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [ocrFile, setOcrFile] = useState<File | null>(null);

    // Questions
    const [questions, setQuestions] = useState<QuestionForm[]>([{ ...DEFAULT_QUESTION }]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    // Validation errors & Messages
    const [errors, setErrors] = useState<string[]>([]);
    const [message, setMessage] = useState({ text: "", type: "" });

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
                fetchQuizzes();
            }
        };
        init();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    };

    const fetchQuizzes = async () => {
        const { data } = await supabase.from("quizzes").select("id, title, category, duration_minutes").order("created_at", { ascending: false });
        if (data) setExistingQuizzes(data);
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

    // --- CSV / OCR Handlers ---

    const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCsvFile(e.target.files[0]);
            setMessage({ text: "", type: "" });
        }
    };

    const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setOcrFile(e.target.files[0]);
            setMessage({ text: "", type: "" });
        }
    };

    const processCSV = () => {
        if (!csvFile) return;
        setMessage({ text: "Membaca CSV...", type: "info" });

        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const parsedQuestions: QuestionForm[] = results.data.map((row: any) => ({
                        question_text: row.question_text || "",
                        image_url: row.image_url || "",
                        options: [
                            row.A || "",
                            row.B || "" // Default to 2
                        ].concat([
                            row.C || "",
                            row.D || "",
                            row.E || ""
                        ].filter(opt => opt !== "")), // Append extra if exist
                        correct_answer: row.correct_answer || "A",
                        explanation_text: row.explanation_text || "",
                        explanation_image_url: row.explanation_image_url || "",
                        manim_slides_url: row.manim_slides_url || "",
                        type: (row.type as any) || "multiple_choice"
                    }));

                    if (parsedQuestions.length === 0) throw new Error("File CSV kosong.");

                    // Merge with existing questions or replace? 
                    // Let's replace if it's the first empty question, otherwise append
                    const currentQuestions = questions.length === 1 && !questions[0].question_text ? [] : [...questions];
                    setQuestions([...currentQuestions, ...parsedQuestions]);

                    setMessage({ text: `Berhasil memuat ${parsedQuestions.length} soal dari CSV!`, type: "success" });
                    setInputMode("manual"); // Switch to manual to review
                    setCsvFile(null);
                } catch (error: any) {
                    setMessage({ text: "Gagal memproses CSV: " + error.message, type: "error" });
                }
            },
            error: (err) => setMessage({ text: "Error CSV: " + err.message, type: "error" })
        });
    };

    const processOCR = async () => {
        if (!ocrFile) return;
        setUploading(true);
        setMessage({ text: "Sedang memproses dengan AI...", type: "info" });

        const formData = new FormData();
        formData.append("file", ocrFile);

        try {
            const res = await fetch("/api/admin/quiz/ocr", {
                method: "POST",
                body: formData,
            });

            const text = await res.text();

            if (!res.ok) {
                console.error("OCR Error Response:", text);
                throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}...`);
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("JSON Parse Error. Raw text:", text);
                throw new Error("Respon server bukan JSON valid. Cek console untuk detail.");
            }

            const ocrResults: OCRData[] = Array.isArray(data) ? data : [data];

            // Convert OCR Data (Record<string, string>) to QuestionForm (string[])
            const convertedQuestions: QuestionForm[] = ocrResults.map(q => {
                const opts = ["A", "B", "C", "D", "E"].map(key => q.options[key] || "").filter(t => t !== "");
                return {
                    question_text: q.question_text || "",
                    image_url: "",
                    options: opts.length >= 2 ? opts : ["", ""],
                    correct_answer: q.correct_answer || "A",
                    explanation_text: q.explanation_text || "",
                    explanation_image_url: "",
                    manim_slides_url: "",
                    type: "multiple_choice"
                };
            });

            const currentQuestions = questions.length === 1 && !questions[0].question_text ? [] : [...questions];
            setQuestions([...currentQuestions, ...convertedQuestions]);

            setMessage({ text: `Berhasil scan ${convertedQuestions.length} soal!`, type: "success" });
            setInputMode("manual"); // Switch to manual to review
            setOcrFile(null);
        } catch (error: any) {
            setMessage({ text: "Gagal OCR: " + error.message, type: "error" });
        } finally {
            setUploading(false);
        }
    };


    // --- Manual Editor Handlers ---

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
        setQuestions([...questions, { ...DEFAULT_QUESTION }]);
        setActiveQuestionIndex(questions.length);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            const updated = questions.filter((_, i) => i !== index);
            setQuestions(updated);
            if (activeQuestionIndex >= updated.length) {
                setActiveQuestionIndex(updated.length - 1);
            }
        } else {
            // If deleting the only question, just reset it
            setQuestions([{ ...DEFAULT_QUESTION }]);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];
        setMessage({ text: "", type: "" });

        if (quizMode === "new") {
            if (!quizTitle?.trim()) newErrors.push("Judul kuis harus diisi");
        } else {
            if (!selectedQuizId) newErrors.push("Pilih kuis tujuan");
        }

        questions.forEach((q, idx) => {
            if (!q.question_text?.trim()) {
                newErrors.push(`Soal #${idx + 1}: Teks soal harus diisi`);
            }
            if (q.type === "multiple_choice") {
                const opts = Array.isArray(q.options) ? q.options : [];
                const emptyOptions = opts.filter(opt => !opt?.trim());
                if (emptyOptions.length > 0) {
                    newErrors.push(`Soal #${idx + 1}: Semua pilihan jawaban harus diisi`);
                }
            } else {
                if (!q.correct_answer?.trim()) {
                    newErrors.push(`Soal #${idx + 1}: Kunci jawaban harus diisi`);
                }
            }
            if (!q.explanation_text?.trim()) {
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
            let targetQuizId = selectedQuizId;

            // 1. Create Quiz if New
            if (quizMode === "new") {
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
                targetQuizId = quizData.id;
            }

            // 2. Insert Questions
            const questionsToInsert = questions.map(q => {
                // Prepare contents with embedded media
                let finalQuestionText = q.question_text;
                if (q.image_url) {
                    finalQuestionText += `\n\n![Gambar Soal](${q.image_url})`;
                }

                let finalExplanationText = q.explanation_text;
                if (q.explanation_image_url) {
                    finalExplanationText += `\n\n![Gambar Pembahasan](${q.explanation_image_url})`;
                }
                if (q.manim_slides_url) {
                    finalExplanationText += `\n\n[Lihat Manim Slides](${q.manim_slides_url})`;
                }

                // Prepare options
                let finalOptions: Record<string, string> = {};
                if (q.type === "multiple_choice") {
                    finalOptions = q.options.reduce((acc, opt, idx) => {
                        acc[String.fromCharCode(65 + idx)] = opt;
                        return acc;
                    }, {} as Record<string, string>);
                }

                return {
                    quiz_id: targetQuizId,
                    question_text: finalQuestionText,
                    options: finalOptions,
                    correct_answer: q.correct_answer,
                    explanation_text: finalExplanationText
                };
            });

            const { error: questionsError } = await supabase
                .from("questions")
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            alert(`Berhasil menyimpan ${questions.length} soal ke kuis!`);
            router.push("/admin/lessons");
        } catch (error: any) {
            alert("Gagal menyimpan: " + error.message);
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
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Editor Soal & Kuis</h1>
                        <p className="text-sm text-gray-500 mt-1">Buat kuis baru atau tambah soal ke kuis yang sudah ada.</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-gray-500 hover:text-[var(--color-primary)] font-medium"
                    >
                        ← Kembali
                    </button>
                </div>

                {/* MODE SELECTION: New vs Existing */}
                <div className="grid grid-cols-2 gap-4 p-1 bg-gray-200 rounded-2xl">
                    <button
                        onClick={() => setQuizMode("new")}
                        className={`py-3 rounded-xl font-bold transition-all ${quizMode === "new" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        📝 Buat Kuis Baru
                    </button>
                    <button
                        onClick={() => {
                            setQuizMode("existing");
                            if (existingQuizzes.length === 0) fetchQuizzes();
                        }}
                        className={`py-3 rounded-xl font-bold transition-all ${quizMode === "existing" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        📂 Pilih Kuis Existing
                    </button>
                </div>

                {/* QUIZ CONFIGURATION */}
                <div className="card p-6 space-y-4 border-l-4 border-[var(--color-primary)]">
                    {quizMode === "new" ? (
                        <>
                            <h2 className="font-bold text-gray-900">Pengaturan Kuis Baru</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Kuis</label>
                                    <input
                                        type="text"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        placeholder="Contoh: Latihan TPS - Penalaran Umum"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Durasi (menit)</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setQuizDuration(Math.max(1, quizDuration - 1))}
                                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center text-gray-600"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={quizDuration}
                                            onChange={(e) => setQuizDuration(parseInt(e.target.value) || 10)}
                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all text-center font-bold"
                                        />
                                        <button
                                            onClick={() => setQuizDuration(quizDuration + 1)}
                                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold flex items-center justify-center text-gray-600"
                                        >
                                            +
                                        </button>
                                    </div>
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
                                        <button onClick={handleAddCategory} className="btn-primary px-4">Simpan</button>
                                        <button onClick={() => setShowAddCategory(false)} className="btn-secondary px-4">Batal</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            value={quizCategory}
                                            onChange={(e) => setQuizCategory(e.target.value)}
                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                        >
                                            {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                        <button onClick={() => setShowAddCategory(true)} className="text-sm font-bold text-[var(--color-primary)] hover:underline whitespace-nowrap px-2">+ Kategori</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="font-bold text-gray-900">Pilih Kuis Tujuan</h2>
                            <select
                                value={selectedQuizId}
                                onChange={(e) => setSelectedQuizId(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all"
                            >
                                <option value="">-- Pilih Kuis --</option>
                                {existingQuizzes.map((q) => (
                                    <option key={q.id} value={q.id}>{q.title} ({q.category})</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>

                {/* INPUT METHOD TOGGLE */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setInputMode("manual")}
                        className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${inputMode === "manual" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        ✍️ Input Manual
                    </button>
                    <button
                        onClick={() => setInputMode("upload")}
                        className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${inputMode === "upload" ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                    >
                        📤 Upload / Scan (CSV & OCR)
                    </button>
                </div>

                {/* UPLOAD SECTION */}
                {inputMode === "upload" && (
                    <div className="card p-6 space-y-6 animate-fade-in">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setUploadTab("csv")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${uploadTab === "csv" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                                Via CSV
                            </button>
                            <button
                                onClick={() => setUploadTab("ocr")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${uploadTab === "ocr" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                                Via Scan AI (Image/PDF)
                            </button>
                        </div>

                        {uploadTab === "csv" ? (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] transition-all relative">
                                    <input type="file" accept=".csv" onChange={handleCsvFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="space-y-2">
                                        <span className="text-4xl">📊</span>
                                        <p className="text-sm text-gray-500">{csvFile ? csvFile.name : "Klik / Drag file CSV"}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={processCSV}
                                    disabled={!csvFile}
                                    className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    Proses CSV & Masuk ke Editor
                                </button>
                                <p className="text-xs text-center text-gray-400">Header: question_text, A, B, C, D, correct_answer, explanation_text</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] transition-all relative">
                                    <input type="file" accept="image/*,.pdf" onChange={handleOcrFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="space-y-2">
                                        <span className="text-4xl">📸</span>
                                        <p className="text-sm text-gray-500">{ocrFile ? ocrFile.name : "Klik / Drag Gambar atau PDF"}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={processOCR}
                                    disabled={!ocrFile || uploading}
                                    className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? "Memproses AI..." : "Scan AI & Masuk ke Editor"}
                                </button>
                            </div>
                        )}

                        {message.text && (
                            <div className={`p-3 rounded-lg text-sm text-center font-medium ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                )}

                {/* MANUAL EDITOR SECTION (Always render questions if they exist, or if mode is manual) */}
                {(inputMode === "manual" || questions.length > 0) && (
                    <>
                        {/* Validation Errors */}
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                                <h3 className="font-bold text-red-700 mb-2">Perbaiki kesalahan berikut:</h3>
                                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                    {errors.map((err, idx) => <li key={idx}>{err}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Question Navigation */}
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-bold text-gray-900">
                                    Daftar Soal
                                    <span className="ml-2 text-sm font-normal text-gray-500">({questions.length} soal)</span>
                                </h2>
                                <button onClick={() => setShowPreview(!showPreview)} className="text-sm text-[var(--color-primary)] font-bold hover:underline">
                                    {showPreview ? "✏️ Mode Edit" : "👁️ Preview LaTeX"}
                                </button>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {questions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveQuestionIndex(idx)}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${idx === activeQuestionIndex ? "bg-[var(--color-primary)] text-white" : questions[idx].question_text.trim() ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                <button onClick={addQuestion} className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all flex items-center justify-center" title="Tambah Soal">
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Question Editor */}
                        <div className="card p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">
                                    Edit Soal #{activeQuestionIndex + 1}
                                </h2>
                                {questions.length > 1 && (
                                    <button onClick={() => removeQuestion(activeQuestionIndex)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                                        Hapus Soal Ini
                                    </button>
                                )}
                            </div>

                            {/* Question Type Toggle */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => updateQuestion(activeQuestionIndex, "type", "multiple_choice")}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${activeQuestion.type === "multiple_choice" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-400"}`}
                                >
                                    Pilihan Ganda
                                </button>
                                <button
                                    onClick={() => updateQuestion(activeQuestionIndex, "type", "short_answer")}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${activeQuestion.type === "short_answer" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-400"}`}
                                >
                                    Isian Singkat
                                </button>
                            </div>

                            {/* Question Text */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Teks Soal <span className="text-gray-400 normal-case">(mendukung LaTeX: $x^2$)</span>
                                    </label>
                                    {showPreview ? (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]">
                                            <FormulaRenderer content={activeQuestion.question_text || "..."} />
                                            {activeQuestion.image_url && (
                                                <div className="mt-4">
                                                    <img src={activeQuestion.image_url} alt="Soal" className="max-w-full h-auto rounded-xl shadow-sm" />
                                                </div>
                                            )}
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

                                {/* Question Image URL */}
                                {!showPreview && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Gambar Soal (Optional)</label>
                                        <input
                                            type="text"
                                            value={activeQuestion.image_url}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, "image_url", e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Options or Short Answer */}
                            <div>
                                {activeQuestion.type === "multiple_choice" ? (
                                    <>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilihan Jawaban</label>
                                        <div className="space-y-3">
                                            {activeQuestion.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-start gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuestion(activeQuestionIndex, "correct_answer", getOptionLetter(optIdx))}
                                                        className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold transition-all ${activeQuestion.correct_answer === getOptionLetter(optIdx) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                                        title="Klik untuk set jawaban benar"
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
                                                        <button onClick={() => removeOption(activeQuestionIndex, optIdx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {activeQuestion.options.length < 5 && !showPreview && (
                                            <button onClick={() => addOption(activeQuestionIndex)} className="mt-3 text-sm text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1">
                                                + Tambah Pilihan
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kunci Jawaban</label>
                                        <input
                                            type="text"
                                            value={activeQuestion.correct_answer}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, "correct_answer", e.target.value)}
                                            placeholder="Masukkan teks jawaban benar..."
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Explanation and Media */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Pembahasan <span className="text-gray-400 normal-case">(mendukung LaTeX)</span>
                                    </label>
                                    {showPreview ? (
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[80px]">
                                            <FormulaRenderer content={activeQuestion.explanation_text || "..."} />
                                            {activeQuestion.explanation_image_url && (
                                                <div className="mt-4">
                                                    <img src={activeQuestion.explanation_image_url} alt="Pembahasan" className="max-w-full h-auto rounded-xl shadow-sm" />
                                                </div>
                                            )}
                                            {activeQuestion.manim_slides_url && (
                                                <div className="mt-2 text-xs text-blue-600 font-bold hover:underline">
                                                    🔗 Manim Slides: {activeQuestion.manim_slides_url}
                                                </div>
                                            )}
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

                                {!showPreview && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Gambar Pembahasan</label>
                                            <input
                                                type="text"
                                                value={activeQuestion.explanation_image_url}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, "explanation_image_url", e.target.value)}
                                                placeholder="https://example.com/pembahasan.jpg"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Manim Slides</label>
                                            <input
                                                type="text"
                                                value={activeQuestion.manim_slides_url}
                                                onChange={(e) => updateQuestion(activeQuestionIndex, "manim_slides_url", e.target.value)}
                                                placeholder="https://example.com/slides"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4 border-t border-gray-200">
                            <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-1">Pastikan semua soal sudah benar sebelum menyimpan.</p>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                                >
                                    {submitting ? "Menyimpan..." : `Simpan ${questions.length} Soal ${quizMode === "new" ? "ke Kuis Baru" : "ke Kuis Existing"}`}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}
