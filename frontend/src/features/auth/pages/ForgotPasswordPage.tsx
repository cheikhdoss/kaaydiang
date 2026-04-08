import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import AuthLayout from '@/shared/components/layout/AuthLayout';

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email) {
      setLocalError('Veuillez entrer votre email');
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      setLocalError(message);
    }
  };

  const displayError = localError || error;

  if (success) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#1ed760]/15"
          >
            <Mail className="h-10 w-10 text-[#1ed760]" />
          </motion.div>
          <h2 className="mb-2 text-2xl font-bold text-white">Email envoyé!</h2>
          <p className="mb-4 text-white/65">
            Vérifiez votre boîte de réception à <strong>{email}</strong>
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 font-medium text-[#9db0ff] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6 text-center">
          <p className="text-white/70">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-red-100"
            >
              {displayError}
            </motion.div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black/40 py-3 pl-10 pr-4 text-white placeholder:text-white/30 transition-all focus:border-[#3054ff] focus:outline-none focus:ring-1 focus:ring-[#3054ff]"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#3054ff] to-[#4e6eff] px-4 py-3 font-medium text-white transition-all hover:from-[#2445e8] hover:to-[#3054ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                Envoyer le lien
              </>
            )}
          </motion.button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
