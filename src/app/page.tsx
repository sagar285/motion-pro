'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="text-center z-10 space-y-8">
        {/* Logo and brand */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl rotate-45 animate-spin-slow"></div>
            <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MP
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Motion-Pro
          </h1>
          <p className="text-xl text-blue-200 animate-fade-in-delay">
            Complete Management System
          </p>
        </div>

        {/* Loading animation */}
        <div className="flex justify-center items-center space-x-2 mt-12">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce animation-delay-400"></div>
        </div>

        <p className="text-blue-300 text-sm animate-pulse mt-8">
          Initializing your workspace...
        </p>
      </div>
    </div>
  );
}