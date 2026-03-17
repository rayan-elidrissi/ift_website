import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const GATE_PASSWORD = import.meta.env.VITE_GATE_PASSWORD ?? '';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? '';

export const isGateConfigured = () =>
  import.meta.env.VITE_ENABLE_PASSWORD_GATE !== 'false' &&
  !!GATE_PASSWORD && !!ADMIN_EMAIL;

export const PasswordGate = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GATE_PASSWORD || !ADMIN_EMAIL) {
      setError('Gate not configured. Set VITE_GATE_PASSWORD and VITE_ADMIN_EMAIL in .env');
      return;
    }
    if (password.trim() !== GATE_PASSWORD) {
      setError('Mot de passe incorrect.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      sessionStorage.setItem('ift_local_admin', '1');
      window.dispatchEvent(new Event('ift_auth_change'));
      setPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection error.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-50 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 md:p-12 shadow-2xl border border-neutral-200"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">IFT Portal</h1>
          <p className="text-sm text-neutral-500 font-sans">Entrez le mot de passe pour accéder au site</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="••••••••"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-4 uppercase text-xs font-bold tracking-widest hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Accéder'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </section>
  );
};
