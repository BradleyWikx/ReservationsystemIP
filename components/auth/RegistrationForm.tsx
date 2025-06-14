import React, { useState } from 'react';
import { auth, db } from '../../src/firebaseConfig'; // Adjusted path
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface RegistrationFormProps {
  onNavigateToLogin: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onSuccess?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onNavigateToLogin, showToast, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null); // Using showToast instead
    if (password !== confirmPassword) {
      showToast("Wachtwoorden komen niet overeen.", 'error');
      return;
    }
    if (password.length < 6) {
        showToast('Wachtwoord moet minimaal 6 karakters lang zijn.', 'error');
        return;
    }
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        showToast("Registratie succesvol! Welkom.", 'success');

        await setDoc(doc(db, "customers", user.uid), {
            name: name,
            email: email,
            phone: phone, // Added phone
            // role: 'customer', // Role can be managed by backend or default in Firestore rules
            creationTimestamp: new Date().toISOString(), // Renamed createdAt to creationTimestamp
            lastUpdateTimestamp: new Date().toISOString(), // Added lastUpdateTimestamp
        });
        
        if (onSuccess) {
            onSuccess(); // Close modal or navigate
        }

    } catch (error: any) {
        console.error("Fout bij registreren:", error);
        if (error.code === 'auth/email-already-in-use') {
            showToast('Dit e-mailadres is al in gebruik.', 'error');
        } else {
            showToast('Er is een fout opgetreden bij de registratie.', 'error');
        }
    }
    setIsLoading(false);
  };
  
  const commonInputClass = "mt-1 block w-full border-slate-600 bg-slate-700 text-white rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400";
  const commonLabelClass = "block text-sm font-medium text-slate-300";

  return (
    <form onSubmit={handleRegister} className="space-y-5 max-w-md mx-auto">
      <div>
        <label htmlFor="register-name" className={commonLabelClass}>Volledige Naam</label>
        <input
          type="text"
          id="register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={commonInputClass}
          placeholder="Uw Naam"
          aria-describedby="name-error-register"
        />
      </div>
      <div>
        <label htmlFor="register-email" className={commonLabelClass}>E-mailadres</label>
        <input
          type="email"
          id="register-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={commonInputClass}
          placeholder="uwemail@voorbeeld.nl"
          aria-describedby="email-error-register"
        />
      </div>
      <div>
        <label htmlFor="register-phone" className={commonLabelClass}>Telefoonnummer (optioneel)</label>
        <input
          type="tel"
          id="register-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={commonInputClass}
          placeholder="Uw Telefoonnummer"
        />
      </div>
      <div>
        <label htmlFor="register-password" className={commonLabelClass}>Wachtwoord (min. 6 karakters)</label>
        <input
          type="password"
          id="register-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={commonInputClass}
          placeholder="••••••••"
          aria-describedby="password-error-register"
        />
      </div>
      <div>
        <label htmlFor="register-confirm-password" className={commonLabelClass}>Bevestig Wachtwoord</label>
        <input
          type="password"
          id="register-confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={commonInputClass}
          placeholder="••••••••"
          aria-describedby="confirm-password-error-register"
        />
      </div>
      <div className="flex flex-col space-y-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70"
        >
          {isLoading ? 'Bezig met registreren...' : 'Registreer Account'}
        </button>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="w-full text-center text-sm text-amber-400 hover:text-amber-300 hover:underline"
        >
          Al een account? Log hier in.
        </button>
      </div>
    </form>
  );
};
