import React, { useState } from 'react';
import { ShowSlot, PackageOption, ReservationDetails, ReservationStatus } from '../types';

interface SimpleBookingStepperProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<ReservationDetails, 'reservationId' | 'bookingTimestamp' | 'date' | 'time' | 'packageName'>) => Promise<{ success: boolean; status: ReservationStatus }>;
  allPackages: PackageOption[];
  availableShowSlots: ShowSlot[];
  initialData?: { selectedShowSlotId?: string };
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SimpleBookingStepper: React.FC<SimpleBookingStepperProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allPackages,
  availableShowSlots,
  initialData,
  showToast,
}) => {
  const [step, setStep] = useState(1);
  const [selectedShowSlotId, setSelectedShowSlotId] = useState(initialData?.selectedShowSlotId || '');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedShow = availableShowSlots.find(s => s.id === selectedShowSlotId);
  const selectedPackage = allPackages.find(p => p.id === selectedPackageId);
  const availablePackagesForShow = selectedShow ? allPackages.filter(p => selectedShow.availablePackageIds.includes(p.id)) : allPackages;

  const handleSubmit = async () => {
    if (!selectedShow || !selectedPackage || !name || !email || !phone || !agreedToPrivacy) {
      showToast('Vul alle verplichte velden in', 'error');
      return;
    }

    setIsSubmitting(true);
    try {      const result = await onSubmit({
        showSlotId: selectedShow.id,
        packageId: selectedPackage.id,
        guests,
        name,
        email,
        phone,
        address: { street, houseNumber, postalCode, city },
        agreedToPrivacyPolicy: agreedToPrivacy,
        totalPrice: selectedPackage.price * guests,
        status: 'confirmed' as ReservationStatus,
      });

      if (result.success) {
        showToast('Reservering succesvol gemaakt!', 'success');
        onClose();
      } else {
        showToast('Er ging iets mis bij het maken van de reservering', 'error');
      }
    } catch (error) {
      showToast('Er ging iets mis bij het maken van de reservering', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Kies Show & Arrangement' : 
             step === 2 ? 'Vul uw gegevens in' : 
             'Bevestig uw reservering'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            {/* Show Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Kies een show:</h3>
              <div className="space-y-2">
                {availableShowSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedShowSlotId(slot.id)}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                      selectedShowSlotId === slot.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">
                      {new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })} om {slot.time}
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.capacity - slot.bookedCount} plaatsen beschikbaar
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Package Selection */}
            {selectedShow && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Kies een arrangement:</h3>
                <div className="space-y-2">
                  {availablePackagesForShow.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        selectedPackageId === pkg.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{pkg.name} - €{pkg.price} per persoon</div>
                      <div className="text-sm text-gray-600">{pkg.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Guests */}
            {selectedPackage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aantal gasten:
                </label>
                <input
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedShow || !selectedPackage}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volgende
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straat
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huisnummer
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plaats
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  Ik ga akkoord met het privacybeleid *
                </span>
              </label>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Vorige
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!name || !email || !phone || !agreedToPrivacy}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bevestigen
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bevestig uw reservering:</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div><strong>Show:</strong> {selectedShow && new Date(selectedShow.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} om {selectedShow?.time}</div>
              <div><strong>Arrangement:</strong> {selectedPackage?.name}</div>
              <div><strong>Aantal gasten:</strong> {guests}</div>
              <div><strong>Naam:</strong> {name}</div>
              <div><strong>Email:</strong> {email}</div>
              <div><strong>Telefoon:</strong> {phone}</div>
              <div><strong>Totaalprijs:</strong> €{selectedPackage ? (selectedPackage.price * guests).toFixed(2) : '0.00'}</div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Vorige
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Bezig...' : 'Reservering Bevestigen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
