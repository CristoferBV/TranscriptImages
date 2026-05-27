import React from 'react';
import AuthImagePanel from '../components/auth/AuthImagePanel';
import LoginForm from '../components/auth/LoginForm';

/**
 * Login page — split-screen layout.
 * Left: decorative image panel (hidden on mobile).
 * Right: LoginForm with glassmorphism card.
 */
const LoginPage: React.FC = () => {
  return (
    <div className="relative h-screen overflow-hidden bg-app-bg flex">
      {/* Ambient background orbs */}
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      {/* ── Left panel: image + brand (50% width) ── */}
      <AuthImagePanel
        imageSrc="/filescan.png"
        imageAlt="Documento siendo digitalizado por un sistema de IA"
        showTagline={false}
      />

      {/* ── Right panel: form (50% width, centered, no scroll) ── */}
      <main className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 md:px-10 py-10 relative z-10 overflow-y-auto">
        <LoginForm />
      </main>
    </div>
  );
};

export default LoginPage;