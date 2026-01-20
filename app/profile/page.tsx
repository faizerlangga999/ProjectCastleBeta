"use client";

import { MainLayout } from "@/components/layout";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface UserStats {
    totalLikes: number;
    quizzesCompleted: number;
}

interface UserProfile {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
}

interface QuizAttempt {
    id: string;
    score: number;
    completed_at: string;
    quizzes: {
        title: string;
        category: string;
    };
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats>({ totalLikes: 0, quizzesCompleted: 0 });
    const [history, setHistory] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<UserProfile>>({});
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const fetchUserData = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                router.push("/login");
                return;
            }
            setUser(user);

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setEditData(profileData);
            }

            const { data: historyData, count: quizCount } = await supabase
                .from('quiz_attempts')
                .select('*, quizzes(title, category)', { count: 'exact' })
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false });

            setHistory(historyData || []);

            const { data: threadsData } = await supabase
                .from('threads')
                .select('likes')
                .eq('author_id', user.id);

            const totalLikes = threadsData?.reduce((acc, curr) => acc + (curr.likes || 0), 0) || 0;

            setStats({
                totalLikes: totalLikes,
                quizzesCompleted: quizCount || 0
            });

        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [supabase, router]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: editData.username,
                    full_name: editData.full_name,
                    bio: editData.bio
                })
                .eq('id', user.id);

            if (error) throw error;
            setIsEditing(false);
            await fetchUserData();
            alert("Profil berhasil diperbarui!");
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("Error updating profile:", error);
            alert(error.message || "Gagal memperbarui profil.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (!user) return null;

    const displayName = profile?.full_name || user.user_metadata?.full_name || "Pejuang PTN";
    const displayEmail = user.email;
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
    const initial = displayEmail ? displayEmail.charAt(0).toUpperCase() : "?";

    return (
        <MainLayout>
            <div className="min-h-screen bg-transparent pb-24 md:pb-12">
                <div className="max-w-3xl mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden shadow-blue-100/50">
                        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                            <button
                                onClick={handleLogout}
                                className="absolute top-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                            >
                                Keluar
                            </button>
                        </div>

                        <div className="px-6 pb-8 relative">
                            <div className="-mt-16 mb-4 flex justify-between items-end">
                                <div className="relative">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500">
                                            {initial}
                                        </div>
                                    )}
                                </div>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit Profil
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditData(profile || {});
                                            }}
                                            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={submitting}
                                            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all shadow-md shadow-blue-100 disabled:opacity-50"
                                        >
                                            {submitting ? "Menyimpan..." : "Simpan"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {!isEditing ? (
                                    <>
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                                            <p className="text-gray-500 font-medium">@{profile?.username || "pejuang_ptn"}</p>
                                        </div>

                                        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bio</h3>
                                            <p className="text-gray-700 text-sm italic">
                                                &quot;{profile?.bio || "Belum ada bio. Semangat berjuang untuk PTN impian!"}&quot;
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3 animate-fade-in">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                value={editData.full_name || ""}
                                                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                                                placeholder="Nama lengkap kamu"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Username</label>
                                            <input
                                                type="text"
                                                value={editData.username || ""}
                                                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                                                placeholder="username_kamu"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bio Singkat</label>
                                            <textarea
                                                value={editData.bio || ""}
                                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] transition-all resize-none"
                                                placeholder="Apa target kamu tahun ini?"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <span className="text-3xl font-extrabold text-gray-900">{stats.totalLikes * 10}</span>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total XP</span>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                                <span className="text-2xl">📝</span>
                            </div>
                            <span className="text-3xl font-extrabold text-gray-900">{stats.quizzesCompleted}</span>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Kuis Selesai</span>
                        </div>
                    </div>

                    {/* Admin Section (Only for Admins) */}
                    {profile?.role === 'admin' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-900 px-1 flex items-center gap-2">
                                <span className="text-xl">🛠️</span> Menu Admin
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button
                                    onClick={() => router.push("/admin")}
                                    className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl text-left group hover:border-blue-300 transition-all shadow-sm"
                                >
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">Dashboard Admin</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Pusat kontrol konten UTBK.</p>
                                </button>

                                <button
                                    onClick={() => router.push("/admin/quiz/manage")}
                                    className="p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl text-left group hover:border-indigo-300 transition-all shadow-sm"
                                >
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">Kelola Kuis</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Atur kuis dan tambah soal manual/bulk.</p>
                                </button>

                                <button
                                    onClick={() => router.push("/admin/lessons")}
                                    className="p-5 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-3xl text-left group hover:border-purple-300 transition-all shadow-sm"
                                >
                                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">Kelola Video</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Atur link YouTube untuk modul pembelajaran.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quiz History */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 px-1 flex items-center gap-2">
                            <span className="text-xl">🕒</span> Riwayat Kuis Terbaru
                        </h2>

                        <div className="space-y-3">
                            {history.length > 0 ? (
                                history.map((attempt) => (
                                    <div key={attempt.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-[var(--color-primary-light)] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl font-bold text-gray-400 group-hover:text-[var(--color-primary)] transition-colors">
                                                {attempt.quizzes?.category === "TPS" ? "💡" : attempt.quizzes?.category === "Literasi" ? "📚" : "🔢"}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{attempt.quizzes?.title}</h4>
                                                <p className="text-[10px] text-gray-500 font-medium">
                                                    {new Date(attempt.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-black ${attempt.score >= 80 ? 'text-green-600' : attempt.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {attempt.score}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Skor</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm italic">Belum ada riwayat kuis. Ayo mulai latihan!</p>
                                    <button
                                        onClick={() => router.push("/quiz")}
                                        className="mt-4 text-[var(--color-primary)] text-sm font-bold hover:underline"
                                    >
                                        Ke Menu Kuis →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}
