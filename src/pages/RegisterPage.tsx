import React from 'react';
import AuthImagePanel from '../components/auth/AuthImagePanel';
import RegisterForm from '../components/auth/RegisterForm';

/**
 * Register page — split-screen layout.
 * Left: decorative image panel (hidden on mobile).
 * Right: RegisterForm with glassmorphism card.
 */
const RegisterPage: React.FC = () => {
  return (
    <div className="relative h-screen overflow-hidden bg-app-bg flex">
      {/* Ambient background orbs */}
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      {/* ── Left panel: image + brand (50% width) ── */}
      <AuthImagePanel
        imageSrc="/screenscan.png"
        imageAlt="Escaneo de pantalla con transcripción digital"
        tagline="Tus notas manuscritas convertidas en texto limpio y organizado al instante."
        taglineTitle="Fluidez Digital"
      />

      {/* ── Right panel: form (50% width, centered, no scroll) ── */}
      <main className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 md:px-10 py-10 relative z-10 overflow-y-auto">
        <RegisterForm />
      </main>
    </div>
  );
};

export default RegisterPage;