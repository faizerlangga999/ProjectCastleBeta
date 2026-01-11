"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function AuthModal({ isOpen, onClose, title = "Fitur Terbatas", message = "Silakan login terlebih dahulu untuk mengakses fitur ini." }: AuthModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slide-up overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <svg className="h-6 w-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {message}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Nanti Saja
                        </button>
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full px-4 py-2 bg-[var(--color-primary)] border border-transparent rounded-xl text-sm font-bold text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            Login Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
