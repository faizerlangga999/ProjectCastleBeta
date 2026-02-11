"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import OCRUploadPreview from "@/components/admin/OCRUploadPreview";

interface Quiz {
    id: string;
    title: string;
}

interface OCRData {
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation_text: string;
}

export default function AdminQuizUploadPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [activeTab, setActiveTab] = useState<"csv" | "ocr">("csv");

    // CSV State
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // OCR State
    const [ocrFile, setOcrFile] = useState<File | null>(null);
    const [questionsData, setQuestionsData] = useState<OCRData[] | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const admin = await isAdmin();
            if (!admin) {
                router.push("/");
            } else {
                setLoading(false);
                fetchQuizzes();
            }
        };
        init();
    }, []);

    const fetchQuizzes = async () => {
        const { data } = await supabase.from("quizzes").select("id, title");
        setQuizzes(data || []);
    };

    const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCsvFile(e.target.files[0]);
        }
    };

    const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setOcrFile(e.target.files[0]);
            setQuestionsData(null);
        }
    };

    const handleAndPreviewCSV = () => {
        if (!csvFile) return;

        setMessage({ text: "Membaca file CSV...", type: "info" });

        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const parsedQuestions: OCRData[] = results.data.map((row: any) => ({
                        question_text: row.question_text,
                        options: {
                            A: row.A || "",
                            B: row.B || "",
                            C: row.C || "",
                            D: row.D || ""
                        },
                        correct_answer: row.correct_answer,
                        explanation_text: row.explanation_text || ""
                    }));

                    if (parsedQuestions.length === 0) {
                        throw new Error("File CSV kosong atau format tidak sesuai.");
                    }

                    // Go to preview mode
                    setQuestionsData(parsedQuestions);
                    setMessage({ text: "", type: "" });

                } catch (error: any) {
                    setMessage({ text: "Gagal memproses CSV: " + error.message, type: "error" });
                }
            },
            error: (error) => {
                setMessage({ text: "Gagal membaca CSV: " + error.message, type: "error" });
            }
        });
    };

    const handleOcrProcess = async () => {
        if (!ocrFile) return;

        setUploading(true);
        setMessage({ text: "Sedang memproses dengan AI (Gemini 2.5 Flash-Lite)...", type: "info" });

        const formData = new FormData();
        formData.append("file", ocrFile);

        try {
            const res = await fetch("/api/admin/quiz/ocr", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Gagal memproses gambar");

            // Ensure data is array
            const questionsArray = Array.isArray(data) ? data : [data];

            setQuestionsData(questionsArray);
            setMessage({ text: "", type: "" });
        } catch (error: any) {
            console.error("OCR Error:", error);
            setMessage({ text: "Gagal memproses OCR: " + error.message, type: "error" });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAll = async (verifiedData: OCRData[]) => {
        if (!selectedQuizId) {
            alert("Pilih kuis tujuan terlebih dahulu!");
            return;
        }

        setUploading(true);
        try {
            const questionsToInsert = verifiedData.map(q => ({
                quiz_id: selectedQuizId,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation_text: q.explanation_text
            }));

            const { error } = await supabase.from("questions").insert(questionsToInsert);

            if (error) throw error;

            setMessage({ text: `Berhasil menyimpan ${verifiedData.length} soal!`, type: "success" });
            setQuestionsData(null);
            setOcrFile(null);
            setCsvFile(null);
        } catch (error: any) {
            setMessage({ text: "Gagal menyimpan soal: " + error.message, type: "error" });
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setQuestionsData(null);
        setOcrFile(null);
        setCsvFile(null);
        setMessage({ text: "", type: "" });
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in pb-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Upload Soal</h1>
                    <p className="text-gray-500 mt-1">Unggah soal via CSV atau Scan Gambar/PDF dengan AI.</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => { setActiveTab("csv"); setQuestionsData(null); }}
                        className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${activeTab === "csv"
                                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Bulk Upload (CSV)
                    </button>
                    <button
                        onClick={() => { setActiveTab("ocr"); setQuestionsData(null); }}
                        className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-all ${activeTab === "ocr"
                                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Scan AI (OCR & LaTeX)
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Quiz Selection (Always Visible) */}
                    <div className="card p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Kuis Tujuan</label>
                        <select
                            value={selectedQuizId}
                            onChange={(e) => setSelectedQuizId(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-all"
                        >
                            <option value="">-- Pilih Kuis --</option>
                            {quizzes.map((quiz) => (
                                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Editor / Preview Mode */}
                    {questionsData ? (
                        <OCRUploadPreview
                            data={questionsData}
                            onSave={handleSaveAll}
                            onCancel={handleCancel}
                        />
                    ) : (
                        // Upload Forms
                        <div className="card p-6 space-y-6 animate-fade-in">
                            {/* CSV Upload Section */}
                            {activeTab === "csv" && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih File CSV</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] transition-all cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleCsvFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="space-y-2">
                                                <span className="text-4xl">📊</span>
                                                <p className="text-sm text-gray-500">
                                                    {csvFile ? csvFile.name : "Klik atau seret file CSV ke sini"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAndPreviewCSV}
                                        disabled={!csvFile}
                                        className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                                    >
                                        Preview & Edit CSV
                                    </button>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Format CSV:</h4>
                                        <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                                            Header harus: <code className="bg-blue-100 px-1">question_text, A, B, C, D, correct_answer, explanation_text</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* OCR Upload Section */}
                            {activeTab === "ocr" && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Upload Gambar / PDF Soal</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] transition-all cursor-pointer relative bg-gray-50">
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleOcrFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="space-y-2">
                                                <span className="text-4xl">📸</span>
                                                <p className="text-sm text-gray-500">
                                                    {ocrFile ? ocrFile.name : "Upload screenshot soal atau PDF"}
                                                </p>
                                                <p className="text-xs text-gray-400">Support: JPG, PNG, PDF (Multi-page supported)</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleOcrProcess}
                                        disabled={uploading || !ocrFile}
                                        className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Memproses AI...
                                            </>
                                        ) : (
                                            <>
                                                <span>✨</span> Proses dengan AI
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Message Box */}
                            {message.text && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" :
                                        message.type === "error" ? "bg-red-50 text-red-700 border border-red-100" :
                                            "bg-blue-50 text-blue-700 border border-blue-100"
                                    }`}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
