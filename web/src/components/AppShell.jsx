import React, { useState } from 'react';
import {
  Home,
  Eye,
  FileText,
  Mic,
  Clock,
  Sliders,
  HelpCircle,
  Square,
  VolumeX,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AppShell({ children }) {
  const {
    currentRoute,
    navigateTo,
    audioState,
    stopSpeech,
    announcement,
    settings
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, shortcut: 'H' },
    { id: 'vision', label: 'AI Vision', icon: Eye, shortcut: 'V' },
    { id: 'reader', label: 'Smart Reader', icon: FileText, shortcut: 'R' },
    { id: 'assistant', label: 'Voice Assistant', icon: Mic, shortcut: 'A' },
    { id: 'activity', label: 'Recent Activity', icon: Clock, shortcut: 'C' },
    { id: 'settings', label: 'Accessibility Settings', icon: Sliders, shortcut: 'S' },
    { id: 'help', label: 'Privacy & Help', icon: HelpCircle, shortcut: '?' }
  ];

  const handleNavClick = (id) => {
    navigateTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#202821] flex flex-col md:flex-row antialiased">
      {/* Skip to Main Content Link for Keyboard / Screen Readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#204C3A] focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ARIA Live Region for dynamic announcements */}
      <div
        className="sr-only"
        aria-live={announcement.priority || 'polite'}
        aria-atomic="true"
      >
        {announcement.message}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR (md:flex) */}
      {/* ------------------------------------------------------------- */}
      <aside
        aria-label="Main Navigation"
        className={`hidden md:flex flex-col justify-between bg-[#EFECE2] border-r border-[#DDD8CB] p-4 transition-all duration-200 z-30 shrink-0 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand & Collapse Header */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-[#DDD8CB] mb-4">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204C3A] rounded-lg p-1"
              aria-label="Avis home"
            >
              <div className="w-10 h-10 rounded-xl bg-[#204C3A] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                A
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="font-black text-xl tracking-wider text-[#204C3A] block leading-none">
                    AVIS
                  </span>
                  <span className="text-[11px] font-medium text-[#535E56] block mt-0.5">
                    Assistive Vision
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-[#535E56] hover:bg-[#E2DDD0] transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5" role="navigation">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = currentRoute === id;
              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                    isActive
                      ? 'bg-[#204C3A] text-white shadow-sm'
                      : 'text-[#202821] hover:bg-[#E5DFD1]'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Audio Stop & Status */}
        <div className="pt-4 border-t border-[#DDD8CB] space-y-2">
          {audioState.isPlaying && (
            <button
              onClick={stopSpeech}
              aria-label="Stop speech output immediately"
              className="w-full min-h-[48px] bg-[#A62C2C] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm animate-pulse"
            >
              <Square size={16} fill="white" />
              {!sidebarCollapsed && <span>STOP SPEECH</span>}
            </button>
          )}

          {!sidebarCollapsed && (
            <div className="bg-[#E5DFD1] rounded-xl p-2.5 text-[11px] text-[#535E56] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#204C3A] shrink-0" />
              <span>100% on-device vision. Privacy guaranteed.</span>
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE TOP BAR (md:hidden) */}
      {/* ------------------------------------------------------------- */}
      <header className="md:hidden bg-[#EFECE2] border-b border-[#DDD8CB] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2"
          aria-label="Avis home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#204C3A] text-white flex items-center justify-center font-black text-base shadow-sm">
            A
          </div>
          <div>
            <span className="font-black text-lg tracking-wider text-[#204C3A] leading-none block">
              AVIS
            </span>
            <span className="text-[10px] text-[#535E56] font-medium leading-none">
              Understand your world
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {audioState.isPlaying && (
            <button
              onClick={stopSpeech}
              aria-label="Stop speaking"
              className="px-3 py-1.5 bg-[#A62C2C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 animate-pulse"
            >
              <VolumeX size={14} />
              <span>STOP</span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-lg text-[#202821] hover:bg-[#E5DFD1]"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="md:hidden fixed inset-x-0 top-[60px] bottom-0 bg-[#F7F5EE] z-50 p-6 overflow-y-auto space-y-2 border-t border-[#DDD8CB]"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[#535E56] mb-3">
            Menu Navigation
          </p>
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentRoute === id;
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`w-full min-h-[52px] flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-base text-left ${
                  isActive
                    ? 'bg-[#204C3A] text-white'
                    : 'bg-[#EFECE2] text-[#202821]'
                }`}
              >
                <Icon size={22} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <main
        id="main-content"
        tabIndex="-1"
        className="flex-1 flex flex-col focus:outline-none min-w-0 pb-20 md:pb-6"
      >
        <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden) */}
      {/* ------------------------------------------------------------- */}
      <nav
        aria-label="Mobile Bottom Bar"
        className="md:hidden fixed bottom-0 inset-x-0 bg-[#EFECE2] border-t border-[#DDD8CB] grid grid-cols-5 z-40 px-1 py-1 shadow-lg"
      >
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'vision', label: 'Vision', icon: Eye },
          { id: 'reader', label: 'Reader', icon: FileText },
          { id: 'assistant', label: 'Voice', icon: Mic },
          { id: 'settings', label: 'Settings', icon: Sliders }
        ].map(({ id, label, icon: Icon }) => {
          const isActive = currentRoute === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              aria-label={`${label} tab`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition-all ${
                isActive
                  ? 'text-[#204C3A] bg-[#DDD8CB]'
                  : 'text-[#535E56] hover:text-[#202821]'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : ''} />
              <span className="mt-1 truncate max-w-full">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
