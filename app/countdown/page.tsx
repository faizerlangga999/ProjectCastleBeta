"use client";

import { MainLayout } from "@/components/layout";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CountdownPage() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // Target date: 21 April 2026
    const targetDate = new Date("2026-04-21T07:30:00").getTime();

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const milestones = [
        { date: "12 Januari – 07 April 2026", event: "Registrasi Akun SNPMB Siswa", status: "target" },
        { date: "25 Maret - 07 April 2026", event: "Pendaftaran UTBK-SNBT", status: "upcoming" },
        { date: "21 - 30 April 2026", event: "Pelaksanaan UTBK", status: "upcoming" },
        { date: "25 Mei 2026", event: "Pengumuman Hasil SNBT", status: "upcoming" },
    ];

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 md:pb-0">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors font-semibold text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Beranda
                </Link>

                {/* Hero Countdown */}
                <div className="gradient-hero rounded-[2rem] p-8 md:p-12 text-white text-center shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white rounded-full"></div>
                        <div className="absolute bottom-10 right-10 w-32 h-32 border-8 border-white rounded-full opacity-20"></div>
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold mb-8 opacity-90 uppercase tracking-widest">UTBK 2026 DIMULAI DALAM</h1>

                    <div className="grid grid-cols-4 gap-2 md:gap-6 relative z-10">
                        {[
                            { label: "HARI", value: timeLeft.days },
                            { label: "JAM", value: timeLeft.hours },
                            { label: "MENIT", value: timeLeft.minutes },
                            { label: "DETIK", value: timeLeft.seconds },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl py-4 md:py-6 border border-white/20 shadow-inner">
                                    <span className="text-3xl md:text-6xl font-black">{String(item.value).padStart(2, '0')}</span>
                                </div>
                                <span className="text-[10px] md:text-xs font-bold mt-2 opacity-70 tracking-tighter">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Motivational Card */}
                <div className="card p-6 border-l-8 border-l-[var(--color-primary)]">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">"Waktu terbaik untuk menanam pohon adalah 20 tahun yang lalu. Waktu terbaik kedua adalah hari ini"</h2>
                    <p className="text-gray-600 leading-relaxed italic">
                        -Warren Buffett
                        {/*Jangan hitung hari-harinya, biarkan hari-harinya diperhitungkan. Tetap konsisten latihan dan berdiskusi di forum!*/}
                    </p>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 px-2">Timeline Penting</h3>
                    <div className="space-y-3">
                        {milestones.map((item, i) => (
                            <div key={i} className={`card p-4 flex items-center justify-between ${item.status === 'target' ? 'ring-2 ring-[var(--color-primary)] bg-blue-50' : ''}`}>
                                <div>
                                    <p className={`text-xs font-bold uppercase ${item.status === 'target' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                                        {item.date}
                                    </p>
                                    <p className="font-bold text-gray-800">{item.event}</p>
                                </div>
                                {item.status === 'target' && (
                                    <span className="bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                                        H-DAY
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to action */}
                <div className="grid grid-cols-2 gap-4 pb-4">
                    <Link href="/quiz" className="card p-5 text-center hover:bg-blue-50 transition-all group">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <span className="text-xl">📝</span>
                        </div>
                        <p className="font-bold text-gray-900">Latihan Soal</p>
                        <p className="text-xs text-gray-500 mt-1">Gunakan sisa waktu!</p>
                    </Link>
                    <Link href="/forum" className="card p-5 text-center hover:bg-purple-50 transition-all group">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <span className="text-xl">💬</span>
                        </div>
                        <p className="font-bold text-gray-900">Tanya Mentor</p>
                        <p className="text-xs text-gray-500 mt-1">Pecahkan keraguan</p>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}

