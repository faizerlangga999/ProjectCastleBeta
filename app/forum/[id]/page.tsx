"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import AuthModal from "@/components/ui/AuthModal";
import { createClient } from "@/utils/supabase/client";
import { isAdmin as checkIsAdmin } from "@/utils/supabase/admin";
import { Thread, Profile } from "@/utils/types";
import FormulaRenderer from "@/components/ui/FormulaRenderer";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    profiles: Profile;
    author_id: string;
}

export default function ThreadDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [thread, setThread] = useState<Thread | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // User & State
    const [userId, setUserId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState("");

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const adminStatus = await checkIsAdmin();
                setIsAdmin(adminStatus);
                checkIfLiked(user.id);
            }
        };
        init();
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchThreadData();

            // Real-time subscription for new comments
            const channel = supabase
                .channel(`comments_${id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'comments', filter: `thread_id=eq.${id}` },
                    async (payload) => {
                        const { data } = await supabase.from('profiles').select('*').eq('id', payload.new.author_id).single();
                        const commentWithProfile = { ...payload.new, profiles: data } as Comment;
                        setComments(prev => [commentWithProfile, ...prev]);
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'comments', filter: `thread_id=eq.${id}` },
                    (payload) => {
                        setComments(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'comments', filter: `thread_id=eq.${id}` },
                    async (payload) => {
                        setComments(prev => prev.map(c => c.id === payload.new.id ? { ...c, content: payload.new.content } : c));
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [id]);

    const checkIfLiked = async (uid: string) => {
        const { data } = await supabase
            .from("thread_likes")
            .select("id")
            .eq("thread_id", id)
            .eq("user_id", uid)
            .single();
        setIsLiked(!!data);
    };

    const fetchThreadData = async () => {
        setLoading(true);
        try {
            const { data: threadData, error: threadError } = await supabase
                .from("threads")
                .select("*, profiles(*)")
                .eq("id", id)
                .single();

            if (threadError) throw threadError;
            setThread(threadData);

            const { data: commentsData, error: commentsError } = await supabase
                .from("comments")
                .select("*, profiles(*)")
                .eq("thread_id", id)
                .order("created_at", { ascending: false });

            if (commentsError) throw commentsError;
            setComments(commentsData || []);
        } catch (error: any) {
            console.error("Error fetching thread details:", error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!thread) return;
        if (!userId) {
            setIsAuthModalOpen(true);
            return;
        }

        const newIsLiked = !isLiked;
        const newLikes = newIsLiked ? thread.likes + 1 : thread.likes - 1;

        setIsLiked(newIsLiked);
        setThread({ ...thread, likes: newLikes });

        try {
            if (newIsLiked) {
                await supabase.from("thread_likes").insert({ thread_id: id, user_id: userId });
                await supabase.from("threads").update({ likes: newLikes }).eq("id", id);
            } else {
                await supabase.from("thread_likes").delete().eq("thread_id", id).eq("user_id", userId);
                await supabase.from("threads").update({ likes: newLikes }).eq("id", id);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            fetchThreadData(); // Revert
            checkIfLiked(userId);
        }
    };

    const handleDeleteThread = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus diskusi ini? Tindakan ini tidak dapat dibatalkan.")) return;
        try {
            const { error } = await supabase.from("threads").delete().eq("id", id);
            if (error) throw error;
            router.push("/forum");
        } catch (error: any) {
            alert("Gagal menghapus thread: " + error.message);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        if (!userId) {
            setIsAuthModalOpen(true);
            return;
        }

        setSubmitting(true);
        try {
            const { error: insertError } = await supabase.from("comments").insert({
                thread_id: id,
                author_id: userId,
                content: newComment
            });

            if (insertError) throw insertError;

            // Update comment count on thread
            const newCount = (thread?.comments_count || 0) + 1;
            await supabase.from("threads").update({ comments_count: newCount }).eq("id", id);
            if (thread) setThread({ ...thread, comments_count: newCount });

            setNewComment("");
        } catch (error: any) {
            console.error("Error submitting comment:", error?.message || error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Hapus komentar ini?")) return;
        try {
            const { error } = await supabase.from("comments").delete().eq("id", commentId);
            if (error) throw error;

            // Update comment count on thread
            const newCount = Math.max(0, (thread?.comments_count || 0) - 1);
            await supabase.from("threads").update({ comments_count: newCount }).eq("id", id);
            if (thread) setThread({ ...thread, comments_count: newCount });

            // UI update handled by realtime or fetch
        } catch (error: any) {
            alert("Gagal menghapus komentar: " + error.message);
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editCommentText.trim()) return;
        try {
            const { error } = await supabase
                .from("comments")
                .update({ content: editCommentText })
                .eq("id", commentId);
            if (error) throw error;
            setEditingCommentId(null);
            setEditCommentText("");
        } catch (error: any) {
            alert("Gagal mengedit komentar: " + error.message);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium tracking-wide">Memuat diskusi...</p>
                </div>
            </MainLayout>
        );
    }

    if (!thread) {
        return (
            <MainLayout>
                <div className="text-center py-20">
                    <p className="text-gray-500">Thread tidak ditemukan.</p>
                    <button onClick={() => router.push("/forum")} className="mt-4 text-[var(--color-primary)] font-bold">Kembali ke Forum</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20 md:pb-0" onClick={() => setActiveCommentMenu(null)}>
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    title="Aksi Memerlukan Login"
                    message="Kamu perlu login terlebih dahulu untuk berinteraksi di forum pejuang UTBK."
                />

                {/* header logic same as before... */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors font-medium text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Forum
                    </button>
                    {(isAdmin || userId === thread.author_id) && (
                        <button
                            onClick={handleDeleteThread}
                            className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                            Hapus Thread
                        </button>
                    )}
                </div>

                {/* Thread Detail Card */}
                <article className="card p-6 md:p-8">
                    {/* User Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <img
                            src={thread.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.profiles?.username || 'Guest'}`}
                            alt={thread.profiles?.username}
                            className="w-12 h-12 rounded-full border-2 border-gray-100"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-gray-900">{thread.profiles?.username || 'Anonim'}</h1>
                                {thread.profiles?.role === "mentor" && (
                                    <span className="bg-blue-100 text-[var(--color-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Mentor</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                {new Date(thread.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} • di <span className="font-semibold">{thread.category}</span>
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4 leading-tight">
                        {thread.title}
                    </h2>

                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                        <FormulaRenderer content={thread.content} />
                    </div>

                    {thread.image_url && (
                        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-6">
                            <img src={thread.image_url} alt="Thread image" className="w-full h-auto" />
                        </div>
                    )}

                    <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        >
                            <svg className={`w-6 h-6 ${isLiked ? 'fill-red-500' : 'group-hover:fill-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="font-bold">{thread.likes}</span>
                        </button>
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="font-bold">{thread.comments_count}</span>
                        </div>
                    </div>
                </article>

                {/* Comment Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[var(--color-primary)] pl-3">Komentar</h3>

                    {/* Add Comment */}
                    <form onSubmit={handleSubmitComment} className="card p-4">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tulis pendapatmu atau bantu jawab..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all resize-none text-sm"
                            rows={3}
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="px-6 py-2 bg-[var(--color-primary)] text-white font-bold rounded-lg hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 text-sm shadow-md shadow-blue-100"
                            >
                                {submitting ? "Mengirim..." : "Kirim Komentar"}
                            </button>
                        </div>
                    </form>

                    {/* Comment List */}
                    <div className="space-y-4">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="card p-4 flex gap-4 animate-slide-up group relative">
                                    <img
                                        src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username || 'Guest'}`}
                                        alt={comment.profiles?.username}
                                        className="w-10 h-10 rounded-full flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-sm text-gray-900">{comment.profiles?.username || 'Anonim'}</h4>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(comment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        {editingCommentId === comment.id ? (
                                            <div className="mt-2">
                                                <textarea
                                                    value={editCommentText}
                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={() => setEditingCommentId(null)}
                                                        className="text-xs text-gray-500 font-bold px-3 py-1 hover:bg-gray-100 rounded"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditComment(comment.id)}
                                                        className="text-xs text-white bg-[var(--color-primary)] font-bold px-3 py-1 rounded hover:bg-blue-700"
                                                    >
                                                        Simpan
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                <FormulaRenderer content={comment.content} />
                                            </div>
                                        )}
                                    </div>

                                    {/* 3-Dot Menu */}
                                    {(isAdmin || userId === comment.author_id) && !editingCommentId && (
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id);
                                                }}
                                                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>

                                            {activeCommentMenu === comment.id && (
                                                <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 animate-fade-in origin-top-right">
                                                    {userId === comment.author_id && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditCommentText(comment.content);
                                                                setActiveCommentMenu(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-gray-50"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 card bg-gray-50 border-dashed">
                                <p className="text-gray-400 text-sm italic">Belum ada komentar. Jadi yang pertama berkomentar!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
