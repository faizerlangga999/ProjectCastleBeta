"use client";

import { MainLayout } from "@/components/layout";
import AuthModal from "@/components/ui/AuthModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Thread } from "@/utils/types";

interface Category {
    id: string;
    name: string;
}

export default function ForumPage() {
    const supabase = createClient();
    const router = useRouter();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [likedThreadIds, setLikedThreadIds] = useState<Set<string>>(new Set());
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            fetchUserLikes(user.id);
        }
    };

    const fetchUserLikes = async (uid: string) => {
        const { data } = await supabase
            .from("thread_likes")
            .select("thread_id")
            .eq("user_id", uid);

        if (data) {
            setLikedThreadIds(new Set(data.map(item => item.thread_id)));
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [activeCategory]);

    // Listen to auth changes
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUserId(session.user.id);
                fetchUserLikes(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUserId(null);
                setLikedThreadIds(new Set());
            }
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
    };

    useEffect(() => {
        const channel = supabase
            .channel('threads_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'threads' },
                (payload) => {
                    setThreads(currentThreads =>
                        currentThreads.map(thread =>
                            thread.id === payload.new.id
                                ? { ...thread, ...payload.new }
                                : thread
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchThreads = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("threads")
                .select("*, profiles(*)")
                .order("created_at", { ascending: false });

            if (activeCategory !== "Semua") {
                query = query.eq("category", activeCategory);
            }

            const { data, error } = await query;

            if (error) throw error;
            setThreads(data || []);
        } catch (error) {
            console.error("Error fetching threads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }
        router.push("/forum/create");
    };

    const handleLike = async (threadId: string, currentLikes: number) => {
        if (!userId) {
            setIsAuthModalOpen(true);
            return;
        }

        const isLiked = likedThreadIds.has(threadId);
        const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;

        // Optimistic update
        setThreads(current =>
            current.map(t => t.id === threadId ? { ...t, likes: newLikes } : t)
        );

        setLikedThreadIds(prev => {
            const newSet = new Set(prev);
            if (isLiked) newSet.delete(threadId);
            else newSet.add(threadId);
            return newSet;
        });

        try {
            if (isLiked) {
                // Unlike
                await supabase.from("thread_likes").delete().eq("thread_id", threadId).eq("user_id", userId);
            } else {
                // Like
                await supabase.from("thread_likes").insert({ thread_id: threadId, user_id: userId });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert state on error could be implemented here, but keeping it simple for now
            fetchThreads(); // Refresh to ensure consistency
            fetchUserLikes(userId);
        }
    };

    const filteredThreads = threads.filter(thread =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    title="Aksi Memerlukan Login"
                    message="Kamu perlu login terlebih dahulu untuk berinteraksi di forum pejuang UTBK."
                />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Forum Diskusi</h1>
                        <p className="text-sm text-gray-500 mt-1">Ruang diskusi pejuang PTN se-Indonesia</p>
                    </div>
                    <button
                        onClick={handleCreateThread}
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-50)] transition-all shadow-sm"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:mx-0 md:px-0">
                        <button
                            key="semua"
                            onClick={() => setActiveCategory("Semua")}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === "Semua"
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
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === cat.name
                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thread List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium tracking-wide">Memuat diskusi...</p>
                        </div>
                    ) : filteredThreads.length > 0 ? (
                        filteredThreads.map((thread) => (
                            <article
                                key={thread.id}
                                onClick={() => router.push(`/forum/${thread.id}`)}
                                className="card p-5 hover:border-[var(--color-primary-light)] transition-colors cursor-pointer group"
                            >
                                {/* Thread Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={thread.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.profiles?.username || 'Guest'}`}
                                            alt={thread.profiles?.username}
                                            className="w-10 h-10 rounded-full bg-gray-100"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm">{thread.profiles?.username || 'Anonim'}</h3>
                                                {thread.profiles?.role === "mentor" && (
                                                    <span className="bg-blue-100 text-[var(--color-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded">MENTOR</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(thread.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • di <span className="font-semibold text-gray-700">{thread.category}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Thread Content */}
                                <div className="mb-4">
                                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                                        {thread.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 line-clamp-3 break-words whitespace-pre-wrap leading-relaxed">
                                        {thread.content}
                                    </p>
                                    {thread.image_url && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm max-h-60">
                                            <img src={thread.image_url} alt="Thread content" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Thread Stats */}
                                <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLike(thread.id, thread.likes);
                                        }}
                                        className={`flex items-center gap-2 transition-colors group/like ${likedThreadIds.has(thread.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                    >
                                        <svg className={`w-5 h-5 transition-colors ${likedThreadIds.has(thread.id) ? 'fill-red-500 text-red-500' : 'group-hover/like:fill-red-500 group-hover/like:text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <span className="text-xs font-semibold">{thread.likes}</span>
                                    </button>
                                    <div className="flex items-center gap-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <span className="text-xs font-semibold">{thread.comments_count}</span>
                                    </div>
                                    <button className="ml-auto text-gray-400 hover:text-[var(--color-primary)]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                    </button>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="text-center py-20 card bg-white">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">Belum ada diskusi di kategori ini.</p>
                            <button
                                onClick={() => setActiveCategory("Semua")}
                                className="mt-4 text-[var(--color-primary)] font-bold text-sm hover:underline"
                            >
                                Lihat Semua Diskusi
                            </button>
                        </div>
                    )}
                </div>

                {/* Load More */}
                {!loading && filteredThreads.length > 5 && (
                    <div className="text-center pt-4">
                        <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all text-sm">
                            Muat Lebih Banyak
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
