import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)] flex">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* Header - Mobile */}
                <header className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex justify-between items-center z-50 h-16 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-inner">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </div>
                        <h1 className="text-lg font-bold text-[var(--color-primary)] tracking-tight">Pejuang PTN</h1>
                    </div>

                    {/* Notification Bell */}
                    <button className="relative p-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors rounded-full hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 lg:p-10 pb-24 md:pb-8 pt-20 md:pt-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    );
}
