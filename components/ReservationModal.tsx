// This component (ReservationModal.tsx) is no longer actively used in the application.
// Its functionality has been replaced and enhanced by the multi-step BookingStepper.tsx component.
// It is kept here for reference or potential future reuse of specific logic, but is not imported by App.tsx.

import React, { useState, useEffect, useRef } from 'react';
import { PackageOption, ReservationDetails, ShowSlot, MerchandiseItem, OrderedMerchandiseItem } from '../types';

// Simple Close Icon for light theme
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<ReservationDetails, 'reservationId' | 'bookingTimestamp' | 'date' | 'time' | 'packageName' | 'packageId'> & { showSlotId: string, packageId: string, merchandise?: OrderedMerchandiseItem[] }) => void;
  allPackages: PackageOption[];
  selectedShowSlot: ShowSlot | null;
  merchandiseItems: MerchandiseItem[];
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allPackages,
  selectedShowSlot,
  merchandiseItems
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [dietaryWishes, setDietaryWishes] = useState<string>('');
  const [orderedMerch, setOrderedMerch] = useState<OrderedMerchandiseItem[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationDetails | 'form' | 'packageId', string>>>({});

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedShowSlot) {
      if (selectedShowSlot.availablePackageIds.length > 0) {
        if (!selectedPackageId || !selectedShowSlot.availablePackageIds.includes(selectedPackageId)) {
            setSelectedPackageId(selectedShowSlot.availablePackageIds[0]);
        }
      } else {
        setSelectedPackageId('');
      }
      setGuests(1);
      setName('');
      setEmail('');
      setPhone('');
      setDietaryWishes('');
      setOrderedMerch([]);
      setErrors({});
    }
  }, [isOpen, selectedShowSlot, selectedPackageId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      modalRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleMerchQuantityChange = (itemId: string, quantity: number) => {
    const item = merchandiseItems.find(m => m.id === itemId);
    if (!item) return;

    setOrderedMerch(prev => {
      const existing = prev.find(oi => oi.itemId === itemId);
      if (quantity > 0) {
        if (existing) {
          return prev.map(oi => oi.itemId === itemId ? { ...oi, quantity } : oi);
        }
        return [...prev, { itemId, quantity, itemName: item.name, itemPrice: item.priceInclVAT }];
      }
      return prev.filter(oi => oi.itemId !== itemId);
    });
  };
  
  const calculateTotalPrice = () => {
    let total = 0;
    const currentPackage = allPackages.find(p => p.id === selectedPackageId);
    if (currentPackage) {
        total += currentPackage.price * guests;
    }
    orderedMerch.forEach(item => {
        total += item.itemPrice * item.quantity;
    });
    return total.toFixed(2);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ReservationDetails | 'form'| 'packageId', string>> = {};
    if (!selectedShowSlot) { 
        newErrors.form = 'Geen show geselecteerd.';
        setErrors(newErrors);
        return false;
    }
    if (!selectedPackageId) newErrors.packageId = 'Selecteer een arrangement.';
    
    if (guests < 1) newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.';
    const currentPackage = allPackages.find(p => p.id === selectedPackageId);
    if (currentPackage?.minPersons && guests < currentPackage.minPersons) {
      newErrors.guests = `Minimaal ${currentPackage.minPersons} gasten vereist voor ${currentPackage.name}.`;
    }
    if (selectedShowSlot && guests > (selectedShowSlot.capacity - selectedShowSlot.bookedCount) ) {
        newErrors.guests = `Niet genoeg plaatsen beschikbaar (${selectedShowSlot.capacity - selectedShowSlot.bookedCount} over).`;
    }

    if (!name.trim()) newErrors.name = 'Naam is verplicht.';
    if (!email.trim()) {
      newErrors.email = 'E-mail is verplicht.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Voer een geldig e-mailadres in.';
    }
    if (!phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm() && selectedShowSlot) {
      onSubmit({
        showSlotId: selectedShowSlot.id,
        packageId: selectedPackageId,
        guests,
        name,
        email,
        phone,
        dietaryWishes,
        merchandise: orderedMerch,
        status: 'confirmed', 
        agreedToPrivacyPolicy: true, // Added to satisfy type, admin implies or dev placeholder
      });
    }
  };

  if (!isOpen || !selectedShowSlot) return null;

  const packagesForCurrentSlot = allPackages.filter(pkg => selectedShowSlot.availablePackageIds.includes(pkg.id));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="reservation-modal-title"
      onClick={onClose}
    >
      <div 
        ref={modalRef} tabIndex={-1}
        className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 id="reservation-modal-title" className="text-2xl font-semibold text-blue-600">
            Reservering voor {new Date(selectedShowSlot.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} om {selectedShowSlot.time}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Sluit">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label htmlFor="packageId" className="block text-sm font-medium text-gray-700 mb-1">Arrangement</label>
            <select
              id="packageId" name="packageId" value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
              aria-describedby="packageId-error" disabled={packagesForCurrentSlot.length === 0}
            >
              {packagesForCurrentSlot.length === 0 ? (
                <option value="" disabled>Geen arrangementen voor deze show</option>
              ) : (
                packagesForCurrentSlot.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name} - €{pkg.price.toFixed(2)}</option>
                ))
              )}
            </select>
            {allPackages.find(p=>p.id === selectedPackageId) && <p className="text-xs text-gray-500 mt-1">{allPackages.find(p=>p.id === selectedPackageId)?.description}</p>}
            {errors.packageId && <p id="packageId-error" className="text-red-500 text-sm mt-1">{errors.packageId}</p>}
          </div>

          <div>
            <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">Aantal Gasten (Max: {selectedShowSlot.capacity - selectedShowSlot.bookedCount} beschikbaar)</label>
            <input
              type="number" id="guests" name="guests" value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1" max={selectedShowSlot.capacity - selectedShowSlot.bookedCount}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
              aria-describedby="guests-error" required
            />
            {errors.guests && <p id="guests-error" className="text-red-500 text-sm mt-1">{errors.guests}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Volledige Naam</label>
              <input
                type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
                aria-describedby="name-error" required
              />
              {errors.name && <p id="name-error" className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
              <input
                type="tel" id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
                aria-describedby="phone-error" required
              />
              {errors.phone && <p id="phone-error" className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
            <input
              type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
              aria-describedby="email-error" required
            />
            {errors.email && <p id="email-error" className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label htmlFor="dietaryWishes" className="block text-sm font-medium text-gray-700 mb-1">Dieetwensen en speciale verzoeken</label>
            <textarea
              id="dietaryWishes" name="dietaryWishes" value={dietaryWishes} onChange={(e) => setDietaryWishes(e.target.value)}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5"
              placeholder="Bijv. vegetarisch, glutenvrij, allergieën..."
            />
          </div>

          {merchandiseItems.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Merchandise (Optioneel)</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {merchandiseItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                    <div className="flex items-center">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded mr-3"/>}
                        <div>
                            <p className="text-sm font-medium text-gray-800">{item.name} (€{item.priceInclVAT.toFixed(2)})</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      className="w-20 border-gray-300 rounded-md shadow-sm p-1.5 text-sm"
                      value={orderedMerch.find(oi => oi.itemId === item.id)?.quantity || 0}
                      onChange={(e) => handleMerchQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      aria-label={`Aantal voor ${item.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-6 border-t border-gray-200 text-right">
             <p className="text-xl font-semibold text-gray-800 mb-4">Totaal: €{calculateTotalPrice()}</p>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md text-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={!selectedPackageId || packagesForCurrentSlot.length === 0 || (selectedShowSlot.capacity - selectedShowSlot.bookedCount < 1)}
            >
              Reserveer Nu
            </button>
          </div>
          {errors.form && <p className="text-red-500 text-sm mt-2 text-center">{errors.form}</p>}
        </form>
      </div>
    </div>
  );
};