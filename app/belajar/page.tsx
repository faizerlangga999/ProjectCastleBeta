"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";

interface Category {
    id: string;
    name: string;
}

interface Lesson {
    id: string;
    title: string;
    description: string;
    youtube_url: string;
    category: string;
}

export default function BelajarPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchLessons();
    }, [activeCategory]);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    };

    const fetchLessons = async () => {
        setLoading(true);
        try {
            let query = supabase.from("lessons").select("*").order("created_at", { ascending: false });
            if (activeCategory !== "Semua") {
                query = query.eq("category", activeCategory);
            }
            const { data, error } = await query;
            if (error) throw error;
            setLessons(data || []);
        } catch (error: any) {
            console.error("Error fetching lessons:", error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const filteredLessons = lessons.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const featuredLesson = lessons[0];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-20 md:pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Modul Belajar</h1>
                        <p className="text-sm text-gray-500 mt-1">Video pembelajaran dari mentor terbaik</p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari materi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-50)] transition-all"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        key="semua"
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

                {/* Featured Video */}
                {featuredLesson && (
                    <div className="card p-6 bg-gradient-to-br from-white to-gray-50">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-red-600">🎬</span> Video Pilihan Minggu Ini
                        </h2>
                        <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${getYouTubeId(featuredLesson.youtube_url)}`}
                                title={featuredLesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="mt-5">
                            <span className="px-2 py-1 bg-[var(--color-primary-50)] text-[var(--color-primary)] text-[10px] font-bold rounded uppercase tracking-wider mb-2 inline-block">
                                {featuredLesson.category}
                            </span>
                            <h3 className="font-bold text-gray-900 text-xl">{featuredLesson.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{featuredLesson.description}</p>
                        </div>
                    </div>
                )}

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="card p-5 animate-pulse bg-gray-50 h-56"></div>
                        ))
                    ) : filteredLessons.length > 0 ? (
                        filteredLessons.map((lesson) => {
                            const videoId = getYouTubeId(lesson.youtube_url);
                            return (
                                <article key={lesson.id} className="card card-hover overflow-hidden group border border-gray-100">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gray-900">
                                        <img
                                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                            alt={lesson.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6 text-red-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 left-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${lesson.category === "TPS" ? "bg-blue-500 text-white" :
                                                lesson.category === "Literasi" ? "bg-purple-500 text-white" :
                                                    "bg-green-500 text-white"
                                                }`}>
                                                {lesson.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 h-8">
                                            {lesson.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">
                                                    📺
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Video Materi</span>
                                            </div>
                                            <button
                                                onClick={() => window.open(lesson.youtube_url, '_blank')}
                                                className="text-[var(--color-primary)] text-xs font-bold hover:underline"
                                            >
                                                Tonton →
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center card bg-white border-dashed">
                            <p className="text-gray-500 italic">Tidak ada materi yang ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
