import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { DEFAULT_ALLOWED_EMAIL } from '../utils/auth';
import { Wallet, ShieldCheck, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogleCredential, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState<string>(DEFAULT_ALLOWED_EMAIL);
  const [name, setName] = useState<string>('Rattajak N');
  const [showDirectInput, setShowDirectInput] = useState<boolean>(true);

  const googleClientId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '';

  // Initialize official Google Identity Services button if Client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            if (response.credential) {
              await loginWithGoogleCredential(response.credential);
            }
          },
        });

        const btnContainer = document.getElementById('google-btn-official');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'pill',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [googleClientId, loginWithGoogleCredential]);

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await loginWithEmail(email, name);
  };

  const handleQuickGoogleSignIn = async () => {
    clearError();
    // Quick one-click sign in with the authorized Google email
    await loginWithEmail(DEFAULT_ALLOWED_EMAIL, 'Rattajak N');
  };

  return (
    <div className="min-h-screen bg-simplicity-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-simplicity-teal/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-simplicity-teal text-white shadow-lg shadow-simplicity-teal/30 mb-4 transform hover:rotate-3 transition-transform">
          <Wallet size={28} className="stroke-[2.5]" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-simplicity-text">
          SIMPLICITY<span className="text-simplicity-teal">.</span>
        </h2>
        <p className="mt-1 text-sm font-medium text-simplicity-muted">
          Personal Wealth Vault &amp; Multi-Wallet Dashboard
        </p>

        {/* Authorized User Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Authorized: {DEFAULT_ALLOWED_EMAIL}</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-simplicity rounded-2xl border border-simplicity-border/80">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-fadeIn">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Official GIS Button container (if Client ID present) */}
          {googleClientId ? (
            <div className="space-y-4">
              <div className="flex justify-center" id="google-btn-official" />
              <div className="relative my-4 text-center">
                <span className="bg-white px-2 text-xs text-simplicity-muted uppercase font-bold tracking-wider">
                  Or use Direct Sign In
                </span>
              </div>
            </div>
          ) : (
            /* Styled Google Sign In Button */
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleQuickGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-white hover:bg-slate-50 transition-all font-semibold text-slate-700 text-sm active:scale-[0.99] disabled:opacity-60"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google ({DEFAULT_ALLOWED_EMAIL})</span>
              </button>
            </div>
          )}

          {/* Collapsible Direct Input Form */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-simplicity-muted uppercase tracking-wider">
                Google Account Details
              </span>
              <button
                type="button"
                onClick={() => setShowDirectInput(!showDirectInput)}
                className="text-xs text-simplicity-teal hover:underline font-semibold"
              >
                {showDirectInput ? 'Hide' : 'Custom Email'}
              </button>
            </div>

            {showDirectInput && (
              <form onSubmit={handleDirectLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-simplicity-text mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rattajak.n@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-simplicity-border bg-slate-50/50 text-sm font-medium text-simplicity-text focus:outline-none focus:ring-2 focus:ring-simplicity-teal/40 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-simplicity-text mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rattajak N"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-simplicity-border bg-slate-50/50 text-sm font-medium text-simplicity-text focus:outline-none focus:ring-2 focus:ring-simplicity-teal/40 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-simplicity-teal hover:bg-simplicity-teal-hover text-white text-sm font-bold shadow-md shadow-simplicity-teal/25 transition-all transform active:scale-95 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Sign In to Vault</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Security Footprint */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-simplicity-muted font-medium">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Edge D1 Isolation
            </span>
            <span>•</span>
            <span>Single-Owner Whitelist</span>
            <span>•</span>
            <span>Zero Egress</span>
          </div>
        </div>
      </div>
    </div>
  );
};
