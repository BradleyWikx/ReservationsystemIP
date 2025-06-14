import React, { useState } from 'react';
import { auth } from '../../src/firebaseConfig'; // Adjusted path
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginFormProps {
  // onLogin: (email: string, password?: string) => Promise<boolean>; // Removed, handled internally
  onNavigateToRegister: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void; // Added showToast
  onSuccess?: () => void; // Added onSuccess for modal closing
}

export const LoginForm: React.FC<LoginFormProps> = ({ onNavigateToRegister, showToast, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState<string | null>(null); // Removed, using showToast
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => { // Renamed handleSubmit to handleLogin
    e.preventDefault();
    // setError(null); // Using showToast instead
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Succesvol ingelogd!", 'success');
        if (onSuccess) {
            onSuccess(); // Close modal or navigate
        }
    } catch (error: any) {
        console.error("Fout bij inloggen:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showToast('Ongeldige e-mail of wachtwoord.', 'error');
        } else {
            showToast('Er is een fout opgetreden bij het inloggen.', 'error');
        }
    }
    setIsLoading(false);
  };

  const commonInputClass = "mt-1 block w-full border-slate-600 bg-slate-700 text-white rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400";
  const commonLabelClass = "block text-sm font-medium text-slate-300";
  // const errorTextClass = "text-red-400 text-xs mt-1"; // Removed, not used

  return (
    <form onSubmit={handleLogin} className="space-y-5 max-w-md mx-auto"> {/* Changed handleSubmit to handleLogin */}
      {/* {error && <p className="text-red-400 bg-red-900 bg-opacity-30 p-3 rounded-md text-sm text-center">{error}</p>} */}{/* Removed error display, using toasts */}
      <div>
        <label htmlFor="login-email" className={commonLabelClass}>E-mailadres</label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={commonInputClass}
          placeholder="uwemail@voorbeeld.nl"
          aria-describedby="email-error-login"
        />
      </div>
      <div>
        <label htmlFor="login-password" className={commonLabelClass}>Wachtwoord</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={commonInputClass}
          placeholder="••••••••"
          aria-describedby="password-error-login"
        />
      </div>
      <div className="flex flex-col space-y-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70"
        >
          {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
        </button>
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="w-full text-center text-sm text-amber-400 hover:text-amber-300 hover:underline"
        >
          Nog geen account? Registreer hier.
        </button>
      </div>
    </form>
  );
};
