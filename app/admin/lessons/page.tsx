"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";

interface Lesson {
    id: string;
    title: string;
    youtube_url: string;
    category: string;
    sort_order: number;
}

interface Category {
    id: string;
    name: string;
}

export default function AdminLessonsPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [newData, setNewData] = useState({ title: "", youtube_url: "", category: "TPS", sort_order: 0 });
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [draggedItem, setDraggedItem] = useState<Lesson | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const admin = await isAdmin();
            if (!admin) {
                router.push("/");
            } else {
                // Fetch everything before stopping loading
                await Promise.all([fetchLessons(), fetchCategories()]);
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchLessons();
        }
    }, [activeCategory]);

    const fetchLessons = async () => {
        try {
            let query = supabase.from("lessons").select("*").order("sort_order", { ascending: true });
            if (activeCategory !== "Semua") {
                query = query.eq("category", activeCategory);
            }
            const { data, error } = await query;
            if (error) throw error;
            setLessons(data || []);
        } catch (error: any) {
            console.error("Error fetching lessons:", error);
            alert("Gagal mengambil data video: " + error.message);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from("categories").select("*").order("name");
            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            console.error("Error fetching categories:", error);
        }
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
            setNewData({ ...newData, category: data.name });
            setNewCategoryName("");
            setShowAddCategory(false);
        } catch (error: any) {
            alert("Gagal menambahkan kategori: " + error.message);
        }
    };

    const handleAddLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from("lessons").insert([newData]);
            if (error) throw error;
            setNewData({ title: "", youtube_url: "", category: "TPS", sort_order: 0 });
            setShowAddForm(false);
            fetchLessons();
            alert("Video berhasil ditambahkan!");
        } catch (error: any) {
            alert("Gagal menambahkan video: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditLesson = async () => {
        if (!editingLesson) return;
        try {
            const { error } = await supabase
                .from("lessons")
                .update({
                    title: editingLesson.title,
                    youtube_url: editingLesson.youtube_url,
                    category: editingLesson.category,
                    sort_order: editingLesson.sort_order
                })
                .eq("id", editingLesson.id);
            if (error) throw error;
            setEditingLesson(null);
            fetchLessons();
        } catch (error: any) {
            alert("Gagal menyimpan: " + error.message);
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (!confirm("Hapus video ini?")) return;
        try {
            const { error } = await supabase.from("lessons").delete().eq("id", id);
            if (error) throw error;
            fetchLessons();
        } catch (error: any) {
            alert("Gagal menghapus video: " + error.message);
        }
    };

    const handleDragStart = (lesson: Lesson) => {
        setDraggedItem(lesson);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetLesson: Lesson) => {
        if (!draggedItem || draggedItem.id === targetLesson.id) return;

        const newLessons = [...lessons];
        const draggedIndex = newLessons.findIndex(l => l.id === draggedItem.id);
        const targetIndex = newLessons.findIndex(l => l.id === targetLesson.id);

        // Remove dragged item and insert at target position
        newLessons.splice(draggedIndex, 1);
        newLessons.splice(targetIndex, 0, draggedItem);

        // Update sort_order for all items
        const updates = newLessons.map((lesson, index) => ({
            id: lesson.id,
            sort_order: index
        }));

        setLessons(newLessons);
        setDraggedItem(null);

        // Save to database
        try {
            for (const update of updates) {
                await supabase
                    .from("lessons")
                    .update({ sort_order: update.sort_order })
                    .eq("id", update.id);
            }
        } catch (error: any) {
            alert("Gagal menyimpan urutan: " + error.message);
            fetchLessons(); // Reload on error
        }
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen Video Belajar</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola dan atur urutan video pembelajaran</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push("/admin")}
                            className="px-4 py-2 text-gray-500 hover:text-[var(--color-primary)] font-medium"
                        >
                            ← Kembali
                        </button>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="px-4 py-2 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all"
                        >
                            {showAddForm ? "Batal" : "+ Tambah Video"}
                        </button>
                    </div>
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

                {/* Add Form */}
                {showAddForm && (
                    <div className="card p-6 bg-blue-50 border-blue-100 animate-slide-up">
                        <form onSubmit={handleAddLesson} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Video</label>
                                    <input
                                        required
                                        type="text"
                                        value={newData.title}
                                        onChange={(e) => setNewData({ ...newData, title: e.target.value })}
                                        placeholder="Contoh: Logika Matematika Dasar"
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL YouTube</label>
                                    <input
                                        required
                                        type="url"
                                        value={newData.youtube_url}
                                        onChange={(e) => setNewData({ ...newData, youtube_url: e.target.value })}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                                    {showAddCategory ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Nama kategori baru..."
                                                className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
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
                                                value={newData.category}
                                                onChange={(e) => setNewData({ ...newData, category: e.target.value })}
                                                className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
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
                                <div className="w-32">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Urutan</label>
                                    <input
                                        type="number"
                                        value={newData.sort_order}
                                        onChange={(e) => setNewData({ ...newData, sort_order: parseInt(e.target.value) || 0 })}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                                <button
                                    disabled={submitting || showAddCategory}
                                    type="submit"
                                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                                >
                                    {submitting ? "Menyimpan..." : "Simpan Video"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Video Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">
                            Daftar Video ({lessons.length})
                        </h2>
                        <p className="text-xs text-gray-500">💡 Drag & drop untuk mengatur urutan</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lessons.length > 0 ? (
                            lessons.map((lesson) => {
                                const videoId = getYouTubeId(lesson.youtube_url);
                                return (
                                    <article
                                        key={lesson.id}
                                        draggable
                                        onDragStart={() => handleDragStart(lesson)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(lesson)}
                                        className={`card overflow-hidden border border-gray-100 cursor-move group ${draggedItem?.id === lesson.id ? "opacity-50" : ""
                                            }`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video bg-gray-900">
                                            {videoId && (
                                                <img
                                                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                    alt={lesson.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button
                                                    onClick={() => setEditingLesson(lesson)}
                                                    className="p-1.5 bg-white/90 text-blue-600 rounded-lg hover:bg-white transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="p-1.5 bg-white/90 text-red-600 rounded-lg hover:bg-white transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2">
                                                <span className="px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
                                                    #{lesson.sort_order}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Content */}
                                        <div className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${lesson.category === "TPS" ? "bg-blue-100 text-blue-700" :
                                                lesson.category === "Literasi" ? "bg-purple-100 text-purple-700" :
                                                    "bg-orange-100 text-orange-700"
                                                }`}>
                                                {lesson.category}
                                            </span>
                                            <h3 className="font-bold text-gray-900 mt-2 line-clamp-2">{lesson.title}</h3>
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-12 card border-dashed">
                                <p className="text-gray-400">Belum ada video. Silakan tambah video baru.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Modal */}
                {editingLesson && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-slide-up">
                            <h3 className="text-lg font-bold text-gray-900">Edit Video</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul</label>
                                <input
                                    type="text"
                                    value={editingLesson.title}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL YouTube</label>
                                <input
                                    type="url"
                                    value={editingLesson.youtube_url}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, youtube_url: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                                <select
                                    value={editingLesson.category}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, category: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Urutan</label>
                                <input
                                    type="number"
                                    value={editingLesson.sort_order}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: parseInt(e.target.value) || 0 })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingLesson(null)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleEditLesson}
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
