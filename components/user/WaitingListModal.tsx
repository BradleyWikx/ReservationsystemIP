// Placeholder for WaitingListModal component
import React, { useState, useEffect, useRef } from 'react';
import { ShowSlot, Customer } from '../../types'; // Adjust path as necessary

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { name: string; email: string; phone: string; guests: number; notes?: string; showSlotId: string }) => Promise<boolean>; // Returns promise for async handling
  showSlotId: string | null; // Can be null if no slot is selected yet
  showSlotInfo?: ShowSlot | null;
  loggedInCustomer: Customer | null;
}

export const WaitingListModal: React.FC<WaitingListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  showSlotId,
  showSlotInfo,
  loggedInCustomer,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(loggedInCustomer?.name || '');
      setEmail(loggedInCustomer?.email || '');
      setPhone(loggedInCustomer?.phone || '');
      setGuests(1);
      setNotes('');
      setError('');
      modalRef.current?.focus(); 
    }
  }, [isOpen, loggedInCustomer]);

  if (!isOpen || !showSlotId) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !phone.trim() || guests < 1) {
      setError('Vul alle verplichte velden correct in.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Voer een geldig e-mailadres in.');
        return;
    }

    const success = await onSubmit({
      name,
      email,
      phone,
      guests,
      notes,
      showSlotId,
    });
    if (success) {
      onClose(); // Close modal on successful submission (handled by App.tsx)
    }
    // If not successful, App.tsx should show a toast, error can be set here if needed too
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waiting-list-modal-title"
        onClick={onClose} // Close on overlay click
    >
      <div 
        ref={modalRef}
        tabIndex={-1} // Make it focusable
        className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-lg w-full m-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h2 id="waiting-list-modal-title" className="text-xl font-semibold text-gray-800">
                Inschrijven Wachtlijst
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Sluiten">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {showSlotInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <p>U schrijft zich in voor de wachtlijst van de show op:</p>
            <p className="font-semibold">{new Date(showSlotInfo.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} om {showSlotInfo.time}</p>
            {showSlotInfo.name && <p className="text-xs">({showSlotInfo.name})</p>}
          </div>
        )}

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="wl-name" className="block text-sm font-medium text-gray-700 mb-1">Naam <span className="text-red-500">*</span></label>
            <input type="text" id="wl-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="wl-email" className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-red-500">*</span></label>
            <input type="email" id="wl-email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="wl-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer <span className="text-red-500">*</span></label>
            <input type="tel" id="wl-phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="wl-guests" className="block text-sm font-medium text-gray-700 mb-1">Aantal gasten <span className="text-red-500">*</span></label>
            <input type="number" id="wl-guests" name="guests" value={guests} onChange={(e) => setGuests(parseInt(e.target.value, 10) || 1)} min="1" required className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="wl-notes" className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen (optioneel)</label>
            <textarea id="wl-notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
          <div className="pt-3 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
                type="button" 
                onClick={onClose} 
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Annuleren
            </button>
            <button 
                type="submit" 
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Verstuur naar Wachtlijst
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
