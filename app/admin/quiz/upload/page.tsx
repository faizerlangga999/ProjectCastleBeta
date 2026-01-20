"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

interface Quiz {
    id: string;
    title: string;
}

export default function AdminQuizUploadPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
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
                fetchQuizzes();
            }
        };
        init();
    }, []);

    const fetchQuizzes = async () => {
        const { data } = await supabase.from("quizzes").select("id, title");
        setQuizzes(data || []);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!selectedQuizId || !file) {
            setMessage({ text: "Pilih kuis dan file CSV terlebih dahulu.", type: "error" });
            return;
        }

        setUploading(true);
        setMessage({ text: "Memproses file...", type: "info" });

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const questions = results.data.map((row: any) => ({
                        quiz_id: selectedQuizId,
                        question_text: row.question_text,
                        options: {
                            A: row.A,
                            B: row.B,
                            C: row.C,
                            D: row.D
                        },
                        correct_answer: row.correct_answer,
                        explanation_text: row.explanation_text
                    }));

                    if (questions.length === 0) {
                        throw new Error("File CSV kosong atau format tidak sesuai.");
                    }

                    const { error } = await supabase.from("questions").insert(questions);

                    if (error) throw error;

                    setMessage({ text: `Berhasil mengunggah ${questions.length} soal!`, type: "success" });
                    setFile(null);
                } catch (error: any) {
                    console.error("Upload error:", error);
                    setMessage({ text: "Gagal mengunggah soal: " + error.message, type: "error" });
                } finally {
                    setUploading(false);
                }
            },
            error: (error) => {
                setMessage({ text: "Gagal memproses CSV: " + error.message, type: "error" });
                setUploading(false);
            }
        });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Soal</h1>
                    <p className="text-gray-500 mt-1">Unggah banyak soal sekaligus menggunakan file CSV.</p>
                </div>

                <div className="card p-6 space-y-6">
                    {/* Quiz Selection */}
                    <div>
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

                    {/* File Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih File CSV</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[var(--color-primary)] transition-all cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-2">
                                <span className="text-4xl">📊</span>
                                <p className="text-sm text-gray-500">
                                    {file ? file.name : "Klik atau seret file CSV ke sini"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Template Note */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Format CSV:</h4>
                        <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                            Header harus: <code className="bg-blue-100 px-1">question_text, A, B, C, D, correct_answer, explanation_text</code>
                        </p>
                    </div>

                    {/* Message Box */}
                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" :
                                message.type === "error" ? "bg-red-50 text-red-700 border border-red-100" :
                                    "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !file || !selectedQuizId}
                        className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                    >
                        {uploading ? "Mengunggah..." : "Mulai Unggah Soal"}
                    </button>

                    <div className="text-center">
                        <button
                            onClick={() => router.push("/admin/lessons")}
                            className="text-sm text-gray-500 hover:text-[var(--color-primary)] font-medium"
                        >
                            Manajemen Video →
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
