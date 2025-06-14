
import React, { useState, useEffect, useRef } from 'react';
import { WaitingListEntry, ShowSlot, PackageOption } from '../../types';

interface BookFromWaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  waitingListEntry: WaitingListEntry;
  showSlot?: ShowSlot;
  allPackages: PackageOption[];
  onSubmit: (waitingListEntryId: string, packageId: string) => Promise<boolean>; // Changed to Promise<boolean>
}

const CloseIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const BookFromWaitingListModal: React.FC<BookFromWaitingListModalProps> = ({
  isOpen,
  onClose,
  waitingListEntry,
  showSlot,
  allPackages,
  onSubmit,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  const packagesForSlot = showSlot ? allPackages.filter(p => showSlot.availablePackageIds.includes(p.id)) : [];

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (packagesForSlot.length > 0) {
        setSelectedPackageId(packagesForSlot[0].id);
      } else {
        setSelectedPackageId('');
      }
      modalRef.current?.focus();
    }
  }, [isOpen, packagesForSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 

    if (!selectedPackageId) {
      setError('Selecteer een arrangement.');
      return;
    }
    if (!showSlot) {
        setError('Show informatie niet gevonden. Kan boeking niet verwerken.');
        return;
    }
    try {
        const success = await onSubmit(waitingListEntry.id, selectedPackageId);
        if (!success) {
            // App.tsx should handle specific alerts.
            // This modal can show a generic error if needed, but often App.tsx handles it.
            // setError('Kon boeking niet verwerken. Controleer capaciteit of show status (indien niet geannuleerd).');
        }
        // If successful, App.tsx should close the modal and show a success alert.
    } catch (err) {
        console.error("Error submitting booking from waiting list:", err);
        setError('Er is een onverwachte fout opgetreden bij het verwerken van de boeking.');
    }
  };

  if (!isOpen || !showSlot) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[90] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-wl-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 id="book-wl-modal-title" className="text-xl font-semibold text-blue-600">
            Boek van Wachtlijst
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Sluiten">
            <CloseIconSvg />
          </button>
        </div>

        <div className="text-sm text-gray-700 mb-4">
          <p><strong>Naam:</strong> {waitingListEntry.name}</p>
          <p><strong>Contact:</strong> {waitingListEntry.email} / {waitingListEntry.phone}</p>
          <p><strong>Aantal Gasten:</strong> {waitingListEntry.guests}</p>
          <p><strong>Show:</strong> {new Date(showSlot.date + 'T00:00:00').toLocaleDateString('nl-NL')} om {showSlot.time}</p>
          <p className="mt-1">Huidige bezetting: {showSlot.bookedCount}/{showSlot.capacity} {showSlot.isManuallyClosed ? <span className="text-orange-600">(Gesloten)</span> : ''}</p>
        </div>

        {error && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="wl-packageId" className="block text-sm font-medium text-gray-700 mb-1">
              Selecteer Arrangement
            </label>
            <select
              id="wl-packageId"
              value={selectedPackageId}
              onChange={(e) => { setSelectedPackageId(e.target.value); setError(''); }} // Clear error on change
              className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500"
              disabled={packagesForSlot.length === 0}
            >
              {packagesForSlot.length === 0 ? (
                <option value="" disabled>Geen arrangementen voor deze show</option>
              ) : (
                packagesForSlot.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - €{pkg.price.toFixed(2)}
                  </option>
                ))
              )}
            </select>
            {allPackages.find(p => p.id === selectedPackageId) && (
              <p className="text-xs text-gray-500 mt-1">
                {allPackages.find(p => p.id === selectedPackageId)?.description}
              </p>
            )}
          </div>
          <div className="pt-3 text-right">
            <button
              type="submit"
              disabled={!selectedPackageId || packagesForSlot.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-5 rounded-md transition-colors disabled:bg-gray-300"
            >
              Bevestig Boeking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
