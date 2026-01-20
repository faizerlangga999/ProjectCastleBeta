"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/supabase/admin";
import { useRouter } from "next/navigation";

interface Stats {
    totalVideos: number;
    totalQuizzes: number;
    totalQuestions: number;
}

const ADMIN_FEATURES = [
    {
        id: "videos",
        title: "Kelola Video",
        description: "Tambah, edit, dan atur urutan video pembelajaran",
        icon: "📺",
        href: "/admin/lessons",
        color: "bg-red-100 text-red-600"
    },
    {
        id: "quiz-manage",
        title: "Kelola Kuis",
        description: "Manajemen kuis: edit, hapus, dan atur kategori",
        icon: "📋",
        href: "/admin/quiz/manage",
        color: "bg-blue-100 text-blue-600"
    },
    {
        id: "questions",
        title: "Kelola Soal",
        description: "Edit dan hapus soal dari semua kuis",
        icon: "❓",
        href: "/admin/questions",
        color: "bg-purple-100 text-purple-600"
    },
    {
        id: "quiz-create",
        title: "Buat Soal Manual",
        description: "Buat kuis dan soal dengan dukungan LaTeX",
        icon: "✏️",
        href: "/admin/quiz/create",
        color: "bg-green-100 text-green-600"
    },
    {
        id: "quiz-upload",
        title: "Bulk Upload Soal",
        description: "Upload banyak soal sekaligus via CSV",
        icon: "📤",
        href: "/admin/quiz/upload",
        color: "bg-orange-100 text-orange-600"
    }
];

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ totalVideos: 0, totalQuizzes: 0, totalQuestions: 0 });
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const admin = await isAdmin();
            if (!admin) {
                router.push("/");
            } else {
                setLoading(false);
                fetchStats();
            }
        };
        init();
    }, []);

    const fetchStats = async () => {
        const [videosRes, quizzesRes, questionsRes] = await Promise.all([
            supabase.from("lessons").select("id", { count: "exact", head: true }),
            supabase.from("quizzes").select("id", { count: "exact", head: true }),
            supabase.from("questions").select("id", { count: "exact", head: true })
        ]);

        setStats({
            totalVideos: videosRes.count || 0,
            totalQuizzes: quizzesRes.count || 0,
            totalQuestions: questionsRes.count || 0
        });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola konten pembelajaran dan kuis</p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="card p-4 bg-white border-l-4 border-l-red-500">
                        <p className="text-xs text-gray-500 font-medium">Total Video</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-l-blue-500">
                        <p className="text-xs text-gray-500 font-medium">Total Kuis</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-l-purple-500">
                        <p className="text-xs text-gray-500 font-medium">Total Soal</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                    </div>
                </div>

                {/* Feature Cards Grid */}
                <div>
                    <h2 className="font-bold text-gray-900 mb-4 border-l-4 border-[var(--color-primary)] pl-3">Menu Admin</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ADMIN_FEATURES.map((feature) => (
                            <article
                                key={feature.id}
                                onClick={() => router.push(feature.href)}
                                className="card card-hover p-5 border border-gray-100 cursor-pointer group"
                            >
                                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {feature.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
