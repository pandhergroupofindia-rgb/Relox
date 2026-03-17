import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Relox | Express Yourself',
  description: 'A modern short-form video platform built for creators.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#050505]">
        <AuthProvider>
          <div className="max-w-[430px] mx-auto h-[100dvh] relative bg-black text-white overflow-hidden shadow-2xl sm:border-x sm:border-gray-800">
            <main className="h-full w-full pb-16">
              {children}
            </main>
            <BottomNav />
            <Toaster />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
