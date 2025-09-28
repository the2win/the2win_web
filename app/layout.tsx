import './globals.css';
import React from 'react';
import { LeftSidebar } from '../components/LeftSidebar';
import { Providers } from '../components/Providers';
import { AuthBootstrap } from '../components/AuthBootstrap';
import { NavBar } from '../components/NavBar';

export const metadata = { title: 'The2Win Platform', description: 'Mini games betting platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        {/* Skip link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-slate-800 text-white px-3 py-2 rounded">Skip to content</a>

        {/* Top NavBar visible on mobile, optionally on all sizes */}
        <div className="md:hidden sticky top-0 z-40">
          <NavBar />
        </div>

        <div className="flex min-h-screen">
          {/* Sidebar hidden on small screens */}
          <div className="hidden md:block">
            <LeftSidebar />
          </div>
          <main id="main-content" className="flex-1 w-full md:ml-64 transition-all duration-300">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
              <Providers>
                <AuthBootstrap />
                {children}
              </Providers>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
