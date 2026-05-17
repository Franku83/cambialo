// apps/web/src/app/(auth)/layout.tsx
import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cambialo
            </h1>
          </Link>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
