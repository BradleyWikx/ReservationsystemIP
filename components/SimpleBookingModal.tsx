import React, { useState } from 'react';
import { ShowSlot, PackageOption, ReservationDetails, ReservationStatus } from '../types';

interface SimpleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<ReservationDetails, 'reservationId' | 'bookingTimestamp' | 'date' | 'time' | 'packageName'>) => Promise<{ success: boolean; status: ReservationStatus }>;
  allPackages: PackageOption[];
  availableShowSlots: ShowSlot[];
  initialShowSlotId?: string;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SimpleBookingModal: React.FC<SimpleBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allPackages,
  availableShowSlots,
  initialShowSlotId,
  showToast,
}) => {
  const [selectedShowSlotId, setSelectedShowSlotId] = useState(initialShowSlotId || '');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedSlot = availableShowSlots.find(s => s.id === selectedShowSlotId);
  const selectedPackage = allPackages.find(p => p.id === selectedPackageId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShowSlotId || !selectedPackageId || !name || !email || !phone) {
      showToast('Vul alle vereiste velden in', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalPrice = selectedPackage ? selectedPackage.price * guests : 0;
      
      const result = await onSubmit({
        showSlotId: selectedShowSlotId,
        packageId: selectedPackageId,
        guests,
        name,
        email,
        phone,
        address: { street: '', houseNumber: '', postalCode: '', city: '' },
        status: 'confirmed',
        totalPrice,
        acceptsMarketingEmails: false,
        agreedToPrivacyPolicy: true,
      });

      if (result.success) {
        showToast('Reservering succesvol gemaakt!', 'success');
        onClose();
      } else {
        showToast('Er ging iets mis bij het maken van de reservering', 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showToast('Er ging iets mis bij het maken van de reservering', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Show Reserveren</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer Show *
              </label>
              <select
                value={selectedShowSlotId}
                onChange={(e) => setSelectedShowSlotId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Selecteer een show --</option>
                {availableShowSlots.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })} - {slot.time} ({slot.capacity - slot.bookedCount} plaatsen beschikbaar)
                  </option>
                ))}
              </select>
            </div>

            {/* Package Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer Arrangement *
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Selecteer een arrangement --</option>
                {allPackages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - €{pkg.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aantal Gasten *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naam *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefoon *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Summary */}
            {selectedSlot && selectedPackage && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-900 mb-2">Overzicht Reservering:</h3>
                <p><strong>Show:</strong> {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('nl-NL')} om {selectedSlot.time}</p>
                <p><strong>Arrangement:</strong> {selectedPackage.name}</p>
                <p><strong>Aantal gasten:</strong> {guests}</p>
                <p><strong>Totaal:</strong> €{(selectedPackage.price * guests).toFixed(2)}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                disabled={isSubmitting}
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Bezig...' : 'Reservering Bevestigen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
