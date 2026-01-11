import { MainLayout } from "@/components/layout";

// Mock events data
const MOCK_EVENTS = [
    {
        id: 1,
        title: "Live Session: Strategi Lolos UI 2025",
        description: "Sharing pengalaman dan tips masuk UI dari kakak tingkat yang sudah lolos",
        date: "15 Januari 2026",
        time: "19:00 - 21:00 WIB",
        type: "Zoom",
        speaker: "Kak Andi (FK UI 2024)",
        registered: 156,
        maxParticipants: 200,
        status: "upcoming",
    },
    {
        id: 2,
        title: "Review Soal UTBK 2024 - TPS",
        description: "Pembahasan lengkap soal TPS yang keluar di UTBK tahun lalu",
        date: "18 Januari 2026",
        time: "20:00 - 22:00 WIB",
        type: "Google Meet",
        speaker: "Dr. UTBK",
        registered: 89,
        maxParticipants: 150,
        status: "upcoming",
    },
    {
        id: 3,
        title: "Workshop: Manajemen Waktu UTBK",
        description: "Belajar teknik time management untuk mengerjakan soal dengan efisien",
        date: "22 Januari 2026",
        time: "15:00 - 17:00 WIB",
        type: "Zoom",
        speaker: "Kak Sarah (Psikologi UGM)",
        registered: 45,
        maxParticipants: 100,
        status: "upcoming",
    },
    {
        id: 4,
        title: "Try Out Nasional UTBK Batch 1",
        description: "Simulasi ujian dengan soal standar UTBK dan analisis hasil lengkap",
        date: "28 Januari 2026",
        time: "08:00 - 12:00 WIB",
        type: "Online",
        speaker: "Tim Pejuang PTN",
        registered: 320,
        maxParticipants: 500,
        status: "upcoming",
    },
];

const PAST_EVENTS = [
    {
        id: 5,
        title: "Kick Off: Persiapan UTBK 2025",
        date: "5 Januari 2026",
        type: "Zoom",
        participants: 245,
        recordingAvailable: true,
    },
    {
        id: 6,
        title: "Q&A: Pemilihan Jurusan",
        date: "2 Januari 2026",
        type: "Google Meet",
        participants: 189,
        recordingAvailable: true,
    },
];

export default function EventPage() {
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Event & Jadwal</h1>
                    <p className="text-sm text-gray-500 mt-1">Live session, workshop, dan try out bersama</p>
                </div>

                {/* Upcoming Events */}
                <section>
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">📅</span> Event Mendatang
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {MOCK_EVENTS.map((event) => (
                            <article key={event.id} className="card card-hover p-5">
                                <div className="flex items-start gap-4">
                                    {/* Date Badge */}
                                    <div className="flex-shrink-0 w-14 h-14 bg-[var(--color-primary)] rounded-xl flex flex-col items-center justify-center text-white">
                                        <span className="text-lg font-bold">{event.date.split(" ")[0]}</span>
                                        <span className="text-[10px] uppercase">{event.date.split(" ")[1].slice(0, 3)}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${event.type === "Zoom" ? "bg-blue-100 text-blue-700" :
                                                    event.type === "Google Meet" ? "bg-green-100 text-green-700" :
                                                        "bg-purple-100 text-purple-700"
                                                }`}>
                                                {event.type}
                                            </span>
                                            <span className="text-xs text-gray-400">{event.time}</span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{event.description}</p>

                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                            <span>👨‍🏫 {event.speaker}</span>
                                        </div>

                                        {/* Progress & CTA */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 mr-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">{event.registered} terdaftar</span>
                                                    <span className="text-gray-400">{event.maxParticipants} max</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                                                        style={{ width: `${(event.registered / event.maxParticipants) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors">
                                                Daftar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Add to Calendar Info */}
                <section className="card p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-none">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">Jangan Sampai Ketinggalan!</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Tambahkan jadwal event ke Google Calendar-mu agar tidak lupa.
                            </p>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM12 17.25a.75.75 0 01-.75-.75v-3.75H7.5a.75.75 0 010-1.5h3.75V7.5a.75.75 0 011.5 0v3.75h3.75a.75.75 0 010 1.5h-3.75v3.75a.75.75 0 01-.75.75z" />
                                </svg>
                                Add to Google Calendar
                            </button>
                        </div>
                    </div>
                </section>

                {/* Past Events */}
                <section>
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">📼</span> Event Sebelumnya
                    </h2>

                    <div className="space-y-3">
                        {PAST_EVENTS.map((event) => (
                            <div key={event.id} className="card p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
                                        <p className="text-xs text-gray-500">{event.date} • {event.participants} peserta</p>
                                    </div>
                                </div>
                                {event.recordingAvailable && (
                                    <button className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                                        Tonton Rekaman
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </MainLayout>
    );
}
