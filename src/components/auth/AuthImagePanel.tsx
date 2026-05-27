import React from 'react';
import { ScanText, Sparkles } from 'lucide-react';

interface AuthImagePanelProps {
  /** Path to the image inside /public, e.g. '/filescan.png' */
  imageSrc: string;
  /** Alt text for the image */
  imageAlt: string;
  /** Tagline shown on the floating card at the bottom */
  tagline?: string;
  /** Title shown on the tagline card (defaults to 'Digital Fluidity') */
  taglineTitle?: string;
  /** Whether to show the bottom tagline card */
  showTagline?: boolean;
}

/**
 * Left-side decorative panel shared by Login and Register pages.
 * Hidden on mobile (md:flex).
 */
const AuthImagePanel: React.FC<AuthImagePanelProps> = ({
  imageSrc,
  imageAlt,
  tagline = 'Transforming manual chaos into structured, elegant digital data with surgical precision.',
  taglineTitle = 'Digital Fluidity',
  showTagline = true,
}) => {
  return (
    <section
      aria-hidden="true"
      className="hidden md:flex md:w-1/2 h-full relative items-center justify-center overflow-hidden bg-surface-container-lowest border-r border-white/5"
    >
      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-app-bg/50 to-transparent mix-blend-overlay" />
      <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(16,20,21,0.75)]" />

      {/* ── Hero image ── */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[20s] ease-out hover:scale-105"
      />

      {/* ── Brand badge (top-left) ── */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-2 auth-glass-card px-4 py-2 rounded-full">
        <ScanText className="w-5 h-5 text-primary" strokeWidth={1.75} />
        <span className="text-headline-md font-semibold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Transcribe Imágenes
        </span>
      </div>

      {/* ── Floating tagline card (bottom-left) ── */}
      {showTagline && (
        <div className="absolute bottom-8 left-8 right-8 z-20 auth-glass-card p-5 rounded-xl max-w-md border-l-4 border-l-primary/50">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-label-md font-semibold text-primary mb-1 uppercase tracking-widest">
                {taglineTitle}
              </p>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {tagline}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuthImagePanel;
