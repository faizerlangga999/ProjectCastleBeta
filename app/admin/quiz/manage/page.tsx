"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";

interface Quiz {
    id: string;
    title: string;
    category: string;
    duration_minutes: number;
    created_at: string;
    question_count?: number;
}

interface Category {
    id: string;
    name: string;
}

export default function AdminQuizManagePage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [editForm, setEditForm] = useState({ title: "", category: "", duration_minutes: 30 });

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

    useEffect(() => {
        fetchQuizzes();
    }, [activeCategory]);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    };

    const fetchQuizzes = async () => {
        let query = supabase.from("quizzes").select("*").order("created_at", { ascending: false });
        if (activeCategory !== "Semua") {
            query = query.eq("category", activeCategory);
        }
        const { data } = await query;

        // Get question counts
        if (data) {
            const quizzesWithCounts = await Promise.all(
                data.map(async (quiz) => {
                    const { count } = await supabase
                        .from("questions")
                        .select("id", { count: "exact", head: true })
                        .eq("quiz_id", quiz.id);
                    return { ...quiz, question_count: count || 0 };
                })
            );
            setQuizzes(quizzesWithCounts);
        }
    };

    const handleEdit = (quiz: Quiz) => {
        setEditingQuiz(quiz);
        setEditForm({
            title: quiz.title,
            category: quiz.category,
            duration_minutes: quiz.duration_minutes
        });
    };

    const handleSaveEdit = async () => {
        if (!editingQuiz) return;
        try {
            const { error } = await supabase
                .from("quizzes")
                .update(editForm)
                .eq("id", editingQuiz.id);
            if (error) throw error;
            setEditingQuiz(null);
            fetchQuizzes();
        } catch (error: any) {
            alert("Gagal menyimpan: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus kuis ini? Semua soal di dalamnya juga akan terhapus.")) return;
        try {
            const { error } = await supabase.from("quizzes").delete().eq("id", id);
            if (error) throw error;
            fetchQuizzes();
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
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kelola Kuis</h1>
                        <p className="text-sm text-gray-500 mt-1">Edit dan hapus kuis</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin")}
                        className="text-sm text-gray-500 hover:text-[var(--color-primary)] font-medium"
                    >
                        ← Kembali
                    </button>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setActiveCategory("Semua")}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === "Semua"
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                            : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            }`}
                    >
                        Semua
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === cat.name
                                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Quiz Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizzes.map((quiz) => (
                        <article key={quiz.id} className="card p-5 border border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${quiz.category === "TPS" ? "bg-blue-100 text-blue-700" :
                                        quiz.category === "Literasi" ? "bg-purple-100 text-purple-700" :
                                            "bg-orange-100 text-orange-700"
                                    }`}>
                                    {quiz.category}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(quiz)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(quiz.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Hapus"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{quiz.title}</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>⏱ {quiz.duration_minutes} menit</span>
                                <span>📝 {quiz.question_count} soal</span>
                            </div>
                            <button
                                onClick={() => router.push(`/admin/questions?quiz=${quiz.id}`)}
                                className="mt-3 w-full py-2 text-sm font-medium text-[var(--color-primary)] bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                            >
                                Lihat Soal →
                            </button>
                        </article>
                    ))}
                </div>

                {quizzes.length === 0 && (
                    <div className="text-center py-12 card border-dashed">
                        <p className="text-gray-400">Belum ada kuis di kategori ini.</p>
                    </div>
                )}

                {/* Edit Modal */}
                {editingQuiz && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-slide-up">
                            <h3 className="text-lg font-bold text-gray-900">Edit Kuis</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                                <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Durasi (menit)</label>
                                <input
                                    type="number"
                                    value={editForm.duration_minutes}
                                    onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) || 30 })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingQuiz(null)}
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
