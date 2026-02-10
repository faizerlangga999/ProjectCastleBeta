import { useState } from "react";

interface ManimSlideViewerProps {
    src: string;
    className?: string;
}

/**
 * Responsive iframe wrapper for Manim Slides HTML presentations.
 * Maintains 16:9 aspect ratio and provides mobile-friendly controls and fallbacks.
 */
export default function ManimSlideViewer({ src, className = "" }: ManimSlideViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <div className={`relative w-full overflow-hidden ${className}`}>
            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 rounded-xl border border-gray-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mb-2"></div>
                    <p className="text-xs text-gray-500 font-medium">Memuat Slides...</p>
                </div>
            )}

            {/* Error or Mobile Fallback Hint */}
            {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 z-20 rounded-xl border border-red-200 p-4 text-center">
                    <p className="text-sm text-red-600 font-bold mb-2">Gagal memuat slides</p>
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary text-xs"
                    >
                        Buka di Tab Baru ↗
                    </a>
                </div>
            )}

            {/* 16:9 Aspect Ratio Container */}
            <div className="relative w-full shadow-lg rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%", minHeight: "200px" }}>
                <iframe
                    src={src}
                    className="absolute inset-0 w-full h-full border-none"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    title="Pembahasan Manim Slides"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setHasError(true)}
                />
            </div>

            {/* Controls & Hints */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-3 gap-3">
                <p className="text-[10px] md:text-xs text-gray-500 font-medium italic">
                    <span className="md:hidden">👆 Tap untuk navigasi</span>
                    <span className="hidden md:inline">⌨️ Gunakan panah ← → untuk navigasi</span>
                </p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setIsLoading(true);
                            const iframe = document.querySelector('iframe[title="Pembahasan Manim Slides"]') as HTMLIFrameElement;
                            if (iframe) {
                                const currentSrc = iframe.src;
                                iframe.src = '';
                                iframe.src = currentSrc;
                            }
                        }}
                        className="text-[10px] md:text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                    >
                        🔄 Muat Ulang
                    </button>
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] md:text-xs text-[var(--color-primary)] hover:underline font-bold flex items-center gap-1"
                    >
                        Buka Fullscreen ⛶
                    </a>
                </div>
            </div>
        </div>
    );
}
