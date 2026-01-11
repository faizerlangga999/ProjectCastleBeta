"use client";

import { MainLayout } from "@/components/layout";
import AuthModal from "@/components/ui/AuthModal";
import { useState } from "react";

// Mock data for forum threads
const MOCK_THREADS = [
    {
        id: 1,
        author: {
            name: "Andi_Pejuang",
            role: "Member",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi",
        },
        title: "Tips ngerjain soal Penalaran Kuantitatif dalam 30 detik?",
        content: "Halo guys, ada yang punya trik cepat buat ngerjain soal PK tipe pola bilangan ga? Kemarin coba try out masih sering kehabisan waktu di bagian ini. Share dong tips kalian!",
        category: "TPS",
        likes: 24,
        comments: 12,
        createdAt: "2 jam yang lalu",
    },
    {
        id: 2,
        author: {
            name: "Sarah_UI_2024",
            role: "Mentor",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        },
        title: "Pembahasan Soal Literasi Bahasa Inggris UTBK 2024",
        content: "Ini aku drop pembahasan lengkap soal literasi B.Inggris paket A kemarin ya. Fokus utama ada di reading comprehension dan vocabulary context. Jangan lupa latihan scanning teks panjang!",
        category: "Literasi",
        likes: 156,
        comments: 45,
        createdAt: "5 jam yang lalu",
    },
    {
        id: 3,
        author: {
            name: "Rizky_Matematika",
            role: "Member",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rizky",
        },
        title: "Bedah Materi Matriks dan Determinan",
        content: "Sharing catatanku tentang matriks nih. Ada rumus cepat determinan ordo 3x3 juga. Semoga membantu teman-teman yang masih bingung konsep dasarnya.",
        category: "Matematika",
        likes: 89,
        comments: 34,
        createdAt: "1 hari yang lalu",
    },
    {
        id: 4,
        author: {
            name: "Budi_Sbmptn",
            role: "Member",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
        },
        title: "Info Passing Grade Fasilkom UI 2025",
        content: "Ada yang tau prediksi passing grade aman buat masuk Fasilkom UI tahun ini ga? Katanya persaingan makin ketat ya?",
        category: "Umum",
        likes: 42,
        comments: 88,
        createdAt: "2 hari yang lalu",
    },
    {
        id: 5,
        author: {
            name: "Dinda_Kedokteran",
            role: "Member",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dinda",
        },
        title: "Strategi Belajar Biologi: Sistem Organ",
        content: "Buat yang mau ambil Saintek (eh TKA Biologi UTBK ga ada ya, tapi buat Ujian Mandiri deh), ini mindmap sistem pencernaan manusia yang aku buat.",
        category: "Saintek",
        likes: 67,
        comments: 21,
        createdAt: "3 hari yang lalu",
    },
];

const CATEGORIES = ["Semua", "TPS", "Literasi", "Matematika", "Saintek", "Soshum", "Umum"];

export default function ForumPage() {
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    title="Login untuk Buat Thread"
                    message="Kamu perlu login terlebih dahulu untuk membuat diskusi baru dan berinteraksi dengan member lain."
                />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Forum Diskusi</h1>
                        <p className="text-sm text-gray-500 mt-1">Ruang diskusi pejuang PTN se-Indonesia</p>
                    </div>
                    <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full md:w-auto px-6 py-2.5 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-sm hover:bg-[var(--color-primary-dark)] hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Thread
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="sticky top-16 z-30 bg-[#F9FAFB]/95 backdrop-blur-sm py-2 space-y-4 md:top-0 md:bg-transparent">
                    {/* Search Bar */}
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari topik diskusi..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-50)] transition-all shadow-sm"
                        />
                    </div>

                    {/* Categories - Horizontal Scroll Fix */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:mx-0 md:px-0">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === cat
                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thread List */}
                <div className="space-y-4">
                    {MOCK_THREADS.map((thread) => (
                        <article key={thread.id} className="card p-5 hover:border-[var(--color-primary-light)] transition-colors cursor-pointer group">
                            {/* Thread Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <img src={thread.author.avatar} alt={thread.author.name} className="w-10 h-10 rounded-full bg-gray-100" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 text-sm">{thread.author.name}</h3>
                                            {thread.author.role === "Mentor" && (
                                                <span className="bg-blue-100 text-[var(--color-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded">MENTOR</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{thread.createdAt} • di <span className="font-semibold text-gray-700">{thread.category}</span></p>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Thread Content - Text Wrapping Fix */}
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                                    {thread.title}
                                </h2>
                                <p className="text-sm text-gray-600 line-clamp-3 break-words whitespace-pre-wrap leading-relaxed">
                                    {thread.content}
                                </p>
                            </div>

                            {/* Thread Stats */}
                            <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                                <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group/like">
                                    <svg className="w-5 h-5 group-hover/like:fill-red-500 group-hover/like:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="text-xs font-semibold">{thread.likes}</span>
                                </button>
                                <div className="flex items-center gap-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-xs font-semibold">{thread.comments}</span>
                                </div>
                                <button className="ml-auto text-gray-400 hover:text-[var(--color-primary)]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Load More */}
                <div className="text-center pt-4">
                    <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all text-sm">
                        Muat Lebih Banyak
                    </button>
                </div>
            </div>
        </MainLayout>
    );
}
