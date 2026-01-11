import { MainLayout } from "@/components/layout";

// Mock learning modules data
const MOCK_MODULES = [
    {
        id: 1,
        title: "Konsep Dasar Logika Matematika",
        description: "Pelajari dasar-dasar logika proposisi, implikasi, dan kontra posisi",
        type: "Video",
        duration: "15:20",
        mentor: "Kak Zaki",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        videoId: "dQw4w9WgXcQ",
        category: "TPS",
        views: "2.5K",
    },
    {
        id: 2,
        title: "Strategi Cepat Kuantitatif",
        description: "Teknik hitung cepat dan pola bilangan untuk soal kuantitatif",
        type: "Video",
        duration: "22:45",
        mentor: "Dr. UTBK",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        videoId: "dQw4w9WgXcQ",
        category: "TPS",
        views: "4.1K",
    },
    {
        id: 3,
        title: "Analisis Wacana Bahasa Indonesia",
        description: "Cara efektif memahami dan menganalisis teks bacaan panjang",
        type: "Video",
        duration: "18:30",
        mentor: "Kak Sarah",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        videoId: "dQw4w9WgXcQ",
        category: "Literasi",
        views: "3.2K",
    },
    {
        id: 4,
        title: "Reading Comprehension Tips",
        description: "Strategi menjawab soal reading bahasa Inggris dengan cepat dan tepat",
        type: "Video",
        duration: "20:15",
        mentor: "Kak Budi",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        videoId: "dQw4w9WgXcQ",
        category: "Literasi",
        views: "1.8K",
    },
    {
        id: 5,
        title: "Penalaran Induktif & Deduktif",
        description: "Memahami perbedaan dan cara mengerjakan soal penalaran",
        type: "Video",
        duration: "25:00",
        mentor: "Kak Zaki",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        videoId: "dQw4w9WgXcQ",
        category: "TPS",
        views: "5.3K",
    },
    {
        id: 6,
        title: "Geometri Ruang untuk UTBK",
        description: "Rumus cepat dan visualisasi bangun ruang",
        type: "Video",
        duration: "30:10",
        mentor: "Dr. UTBK",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        videoId: "dQw4w9WgXcQ",
        category: "Matematika",
        views: "2.9K",
    },
];

const CATEGORIES = ["Semua", "TPS", "Literasi", "Matematika"];

export default function BelajarPage() {
    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
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
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-50)] transition-all"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${idx === 0
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {MOCK_MODULES.map((module) => (
                        <article key={module.id} className="card card-hover overflow-hidden group">
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-red-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2 z-20 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded">
                                    {module.duration}
                                </div>
                                <div className="absolute bottom-2 left-2 z-20">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${module.category === "TPS" ? "bg-blue-500 text-white" :
                                        module.category === "Literasi" ? "bg-purple-500 text-white" :
                                            "bg-green-500 text-white"
                                        }`}>
                                        {module.category}
                                    </span>
                                </div>
                                {/* Placeholder gradient for thumbnail */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                    {module.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-[var(--color-primary-50)] rounded-full flex items-center justify-center">
                                            <span className="text-xs">👨‍🏫</span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">{module.mentor}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {module.views}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* YouTube Embed Example */}
                <div className="card p-6">
                    <h2 className="font-bold text-gray-900 mb-4">🎬 Video Pilihan Minggu Ini</h2>
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            title="Video Pembelajaran"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-gray-900">Pengenalan UTBK 2025: Apa yang Berubah?</h3>
                        <p className="text-sm text-gray-500 mt-1">Oleh: Tim Pejuang PTN • 10K views</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
