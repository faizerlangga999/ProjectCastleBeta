import { MainLayout } from "@/components/layout";
import Link from 'next/link';

// Mock data
const MOCK_STATS = {
  totalUsers: "2.5K+",
  totalQuizzes: "150+",
  totalThreads: "500+",
};

const MOCK_UPCOMING_EVENTS = [
  { id: 1, title: "Live: Strategi Lolos UI", date: "15 Jan, 19:00", type: "Zoom" },
  { id: 2, title: "Review Soal TPS 2024", date: "18 Jan, 20:00", type: "Meet" },
];

const MOCK_POPULAR_QUIZZES = [
  { id: 1, title: "TPS Penalaran Umum", questions: 30, difficulty: "Sedang" },
  { id: 2, title: "Literasi Bahasa Indonesia", questions: 25, difficulty: "Mudah" },
  { id: 3, title: "Penalaran Matematika", questions: 20, difficulty: "Sulit" },
];

export default function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Hero Section */}
        <section className="gradient-hero rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 max-w-lg">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
              🔥 UTBK 2026 tinggal 120 hari lagi!
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight">
              Semangat Belajar,<br />Pejuang PTN! 🚀
            </h1>
            <p className="text-blue-100 text-sm md:text-base mb-6 opacity-90 leading-relaxed">
              Platform komunitas dan belajar mandiri untuk siswa SMA. Forum diskusi, modul video, dan simulasi kuis yang dioptimalkan untuk HP.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/quiz" className="btn-primary bg-white text-[var(--color-primary)] hover:bg-blue-50 px-6 py-3 rounded-full font-bold text-sm shadow-lg">
                Mulai Kuis
              </Link>
              <Link href="/belajar" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-white/30 transition-colors">
                Materi Belajar
              </Link>
            </div>
          </div>

          {/* Decorative Icon */}
          <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 opacity-20">
            <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)]">{MOCK_STATS.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Pejuang Aktif</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)]">{MOCK_STATS.totalQuizzes}</p>
            <p className="text-xs text-gray-500 mt-1">Bank Soal</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)]">{MOCK_STATS.totalThreads}</p>
            <p className="text-xs text-gray-500 mt-1">Diskusi</p>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Popular Quizzes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">🎯 Kuis Populer</h2>
              <Link href="/quiz" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                Lihat Semua →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_POPULAR_QUIZZES.map((quiz) => (
                <div key={quiz.id} className="card card-hover p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[var(--color-primary-50)] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${quiz.difficulty === "Mudah" ? "bg-green-100 text-green-700" :
                      quiz.difficulty === "Sedang" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{quiz.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">{quiz.questions} Soal</p>
                  <button className="w-full py-2.5 bg-[var(--color-bg-tertiary)] text-gray-700 text-sm font-bold rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all">
                    Mulai Latihan
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">📅 Event Mendatang</h2>
              <Link href="/event" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                Lihat Selengkapnya →
              </Link>
            </div>
            <div className="card p-5 space-y-4">
              {MOCK_UPCOMING_EVENTS.map((event) => (
                <div key={event.id} className="border-l-4 border-[var(--color-primary)] pl-4 py-1">
                  <p className="font-bold text-sm text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                  <button className="mt-2 text-xs bg-[var(--color-primary-50)] text-[var(--color-primary)] px-3 py-1.5 rounded-full font-bold hover:bg-[var(--color-primary-100)] transition-colors">
                    Gabung {event.type}
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Access */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3">⚡ Akses Cepat</h3>
              <div className="space-y-2">
                <Link href="/forum" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Forum Diskusi</p>
                    <p className="text-xs text-gray-500">Tanya jawab soal</p>
                  </div>
                </Link>
                <Link href="/belajar" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Video Materi</p>
                    <p className="text-xs text-gray-500">Belajar dari mentor</p>
                  </div>
                </Link>
                <Link href="/event" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Jadwal Event</p>
                    <p className="text-xs text-gray-500">Webinar & Tryout</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
