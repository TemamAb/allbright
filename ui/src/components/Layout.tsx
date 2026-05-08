import React from 'react';
// Import the standardized Sidebar component
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#111217]"> {/* Use the ash-black background from the theme */}
      {/* Render the standardized Sidebar component */}
      <Sidebar />

      {/* Main content area, shifted by the sidebar's width (w-64) */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}