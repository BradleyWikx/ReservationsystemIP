
import React, { useState, useEffect, useRef } from 'react';
import { WaitingListEntry, ShowSlot } from '../types';

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entryData: Omit<WaitingListEntry, 'id' | 'timestamp' | 'showInfo'>) => void;
  showSlotId: string;
  showSlotInfo?: ShowSlot; // For displaying date/time
}

const CloseIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const WaitingListModal: React.FC<WaitingListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  showSlotId,
  showSlotInfo,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setGuests(1);
      setErrors({});
      modalRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Naam is verplicht.';
    if (!email.trim()) {
      newErrors.email = 'E-mail is verplicht.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Voer een geldig e-mailadres in.';
    }
    if (!phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht.';
    if (guests < 1) newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ showSlotId, name, email, phone, guests });
    }
  };

  if (!isOpen) return null; // Changed from 'return;' to 'return null;'

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[80] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waiting-list-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
          <h2 id="waiting-list-modal-title" className="text-xl font-semibold text-indigo-700">
            Plaats op Wachtlijst
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 p-1 rounded-full" aria-label="Sluiten">
            <CloseIconSvg />
          </button>
        </div>

        {showSlotInfo && (
          <div className="mb-5 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-center">
            <p className="text-sm font-medium text-indigo-600">
              U wordt op de wachtlijst geplaatst voor de show op:
            </p>
            <p className="text-md font-semibold text-indigo-800">
              {new Date(showSlotInfo.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} om {showSlotInfo.time}
            </p>
          </div>
        )}

        {errors.form && <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm mb-4">{errors.form}</p>}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="wl-name" className="block text-sm font-medium text-slate-700">Volledige Naam</label>
            <input
              type="text" id="wl-name" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border-slate-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wl-email" className="block text-sm font-medium text-slate-700">E-mailadres</label>
              <input
                type="email" id="wl-email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border-slate-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="wl-phone" className="block text-sm font-medium text-slate-700">Telefoonnummer</label>
              <input
                type="tel" id="wl-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border-slate-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="wl-guests" className="block text-sm font-medium text-slate-700">Aantal Personen</label>
            <input
              type="number" id="wl-guests" value={guests} onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              className="mt-1 w-full border-slate-300 rounded-md shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.guests && <p className="text-red-500 text-xs mt-1">{errors.guests}</p>}
          </div>

          <div className="pt-4 text-right">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-md shadow-md hover:shadow-lg transition-colors"
            >
              Plaats op Wachtlijst
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
