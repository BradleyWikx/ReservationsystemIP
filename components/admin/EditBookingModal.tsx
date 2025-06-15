import React, { useState, useEffect, useCallback } from 'react';
import { ReservationDetails, PackageOption, MerchandiseItem, ShowSlot, Address, InvoiceDetails, AppSettings, Customer, SpecialAddOn, PromoCode } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { calculatePrice } from '../../utils/pricingUtils'; 

export interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ReservationDetails | null;
  onSave: (updatedBooking: ReservationDetails, originalShowSlotId?: string) => void; // Modified to include originalShowSlotId
  packages: PackageOption[];
  merchandiseItems: MerchandiseItem[];
  showSlots: ShowSlot[];
  appSettings?: AppSettings; 
  customers?: Customer[]; // Added customers
  onUpdateCustomer?: (updatedCustomer: Customer) => Promise<boolean>; // Added onUpdateCustomer
  specialAddons?: SpecialAddOn[]; // Added specialAddons
  applyPromoCode?: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode }; // Added applyPromoCode
}

const initialAddressState: Address = { street: '', houseNumber: '', postalCode: '', city: '', zipCode: '', country: '' };
const initialInvoiceDetailsState: InvoiceDetails = { generateInvoice: false, sendInvoice: false, address: { ...initialAddressState } };

const getInitialFormData = (booking: ReservationDetails | null): Partial<ReservationDetails> => {
  if (!booking) return { 
    guests: 1, 
    merchandise: [], 
    specialRequests: '', 
    internalNotes: '', // Added
    paymentDetails: { method: '', transactionId: '', amount: 0, status: 'pending' }, 
    invoiceDetails: { ...initialInvoiceDetailsState },
    address: { ...initialAddressState },
    agreedToPrivacyPolicy: true, // Default for existing bookings being edited
    totalPrice: 0,
    appliedPromoCode: '', // Added
    discountAmount: 0, // Added
  };

  return {
    ...booking,
    address: booking.address ? { ...booking.address } : { ...initialAddressState },
    invoiceDetails: booking.invoiceDetails ? { ...booking.invoiceDetails, address: booking.invoiceDetails.address ? { ...booking.invoiceDetails.address } : { ...initialAddressState } } : { ...initialInvoiceDetailsState },
    merchandise: booking.merchandise ? [...booking.merchandise] : [],
    specialRequests: booking.specialRequests || '', // Added
    internalNotes: booking.internalNotes || '', // Added
    appliedPromoCode: booking.appliedPromoCode || '', // Added
    discountAmount: booking.discountAmount || 0, // Added
  };
};


export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSave,
  packages,
  merchandiseItems,
  showSlots,
  // appSettings, // Not directly used in this simplified version yet
  // customers, // Not directly used yet
  // onUpdateCustomer, // Not directly used yet
  // specialAddons, // Not directly used yet
  // applyPromoCode, // Not directly used yet
}) => {
  const [formData, setFormData] = useState<Partial<ReservationDetails>>(getInitialFormData(booking));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [originalShowSlotId, setOriginalShowSlotId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setFormData(getInitialFormData(booking));
    if (booking) {
      setOriginalShowSlotId(booking.showSlotId); // Store the initial showSlotId
    }
  }, [booking]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Naam is verplicht.';
    if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Ongeldig e-mailadres.';
    if (!formData.phone?.trim()) newErrors.phone = 'Telefoonnummer is verplicht.';
    if (!formData.showSlotId) newErrors.showSlotId = 'Showslot is verplicht.';
    if (!formData.packageId) newErrors.packageId = 'Pakket is verplicht.';
    if (!formData.guests || formData.guests < 1) newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.';
    
    if (formData.invoiceDetails?.generateInvoice) {
        if (!formData.invoiceDetails.address?.street?.trim()) newErrors['invoiceDetails.address.street'] = 'Straat (factuur) is verplicht.';
        if (!formData.invoiceDetails.address?.houseNumber?.trim()) newErrors['invoiceDetails.address.houseNumber'] = 'Huisnummer (factuur) is verplicht.';
        if (!formData.invoiceDetails.address?.postalCode?.trim()) newErrors['invoiceDetails.address.postalCode'] = 'Postcode (factuur) is verplicht.';
        if (!formData.invoiceDetails.address?.city?.trim()) newErrors['invoiceDetails.address.city'] = 'Plaats (factuur) is verplicht.';
        if (!formData.invoiceDetails.address?.zipCode) newErrors['invoiceDetails.address.zipCode'] = 'Postcode (factuur) is verplicht.';
        if (!formData.invoiceDetails.address?.country) newErrors['invoiceDetails.address.country'] = 'Land (factuur) is verplicht.';
    }
    // Basic address validation (optional, depending on requirements)
    if (formData.address) {
        if (formData.address.street && !formData.address.houseNumber) newErrors['address.houseNumber'] = 'Huisnummer is verplicht als straat is ingevuld.';
        // Add more specific address validations if needed
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  useEffect(() => {
    // Recalculate price when relevant fields change
    const selectedPackage = packages.find(p => p.id === formData.packageId);
    const selectedShowSlot = showSlots.find(s => s.id === formData.showSlotId); // Get selected show slot
    
    const currentPrice = calculatePrice({
        selectedPackage,
        selectedShowSlot, // Pass selectedShowSlot
        guests: formData.guests || 0,
        merchandise: formData.merchandise || [],
        merchandiseItems: merchandiseItems, // Pass full merchandiseItems list
        // vatRate: appSettings?.vatRates?.standard, // Example: pass VAT rate if available from appSettings
    });
    setCalculatedPrice(currentPrice);
    setFormData(prev => ({ ...prev, totalPrice: currentPrice }));

  }, [formData.packageId, formData.showSlotId, formData.guests, formData.merchandise, packages, merchandiseItems, formData.appliedPromoCode, formData.discountAmount, showSlots]); // Added showSlots to dependency array


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; // Keep 'type' if it was intended for other logic, otherwise remove
    const typeAttribute = e.target.type;
    const checked = (e.target as HTMLInputElement).checked;
  
    if (typeAttribute === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (typeAttribute === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...(prev.address || initialAddressState),
        [name]: value,
      },
    }));
  };

  const handleInvoiceAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      invoiceDetails: {
        ...(prev.invoiceDetails || initialInvoiceDetailsState),
        address: {
          ...(prev.invoiceDetails?.address || initialAddressState),
          [name]: value,
        },
      },
    }));
  };
  
  const handleInvoiceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'generateInvoice' || name === 'sendInvoice') {
        setFormData(prev => ({
            ...prev,
            invoiceDetails: {
                ...(prev.invoiceDetails || initialInvoiceDetailsState),
                [name]: checked,
            }
        }));
    } else if (name.startsWith('address.')) { // Should not happen due to handleInvoiceAddressChange
        // This case is handled by handleInvoiceAddressChange, but as a fallback:
        const field = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            invoiceDetails: {
                ...(prev.invoiceDetails || initialInvoiceDetailsState),
                address: {
                    ...(prev.invoiceDetails?.address || initialAddressState),
                    [field]: value,
                }
            }
        }));
    } else {
         setFormData(prev => ({
            ...prev,
            invoiceDetails: {
                ...(prev.invoiceDetails || initialInvoiceDetailsState),
                [name]: value,
            }
        }));
    }
  };


  const handleMerchandiseChange = (itemId: string, quantity: number) => {
    const existingItem = formData.merchandise?.find(m => m.itemId === itemId);
    const itemDetails = merchandiseItems.find(mi => mi.id === itemId);
    if (!itemDetails) return;

    let updatedMerchandise = [...(formData.merchandise || [])];

    if (quantity <= 0) {
      updatedMerchandise = updatedMerchandise.filter(m => m.itemId !== itemId);
    } else {
      if (existingItem) {
        updatedMerchandise = updatedMerchandise.map(m =>
          m.itemId === itemId ? { ...m, quantity, itemName: itemDetails.name, itemPrice: itemDetails.priceInclVAT } : m
        );
      } else {
        updatedMerchandise.push({ itemId, quantity, itemName: itemDetails.name, itemPrice: itemDetails.priceInclVAT });
      }
    }
    setFormData(prev => ({ ...prev, merchandise: updatedMerchandise }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submissionData: ReservationDetails = {
      ...(booking as ReservationDetails), // Base with original booking to keep IDs etc.
      ...(formData as Partial<ReservationDetails>), // Apply all changed fields
      id: booking!.id, // Ensure original ID is preserved
      reservationId: booking!.reservationId, // Ensure original reservationId is preserved
      lastModifiedTimestamp: Timestamp.now().toDate().toISOString(),
      totalPrice: calculatedPrice, // Use the dynamically calculated price
      packageName: packages.find(p => p.id === formData.packageId)?.name || booking!.packageName,
      date: showSlots.find(s => s.id === formData.showSlotId)?.date || booking!.date,
      time: showSlots.find(s => s.id === formData.showSlotId)?.time || booking!.time,
      status: formData.status || booking!.status, // Keep original status if not changed
      bookingTimestamp: booking!.bookingTimestamp, // Preserve original booking timestamp
      agreedToPrivacyPolicy: formData.agreedToPrivacyPolicy === undefined ? booking!.agreedToPrivacyPolicy : formData.agreedToPrivacyPolicy,
    };
    
    // Pass originalShowSlotId if it has changed
    const hasShowSlotChanged = originalShowSlotId !== submissionData.showSlotId;
    onSave(submissionData, hasShowSlotChanged ? originalShowSlotId : undefined);
    onClose();
  };

  if (!isOpen) return null;

  const currentShowSlot = showSlots.find(s => s.id === formData.showSlotId);
  // const selectedPackageDetails = packages.find(p => p.id === formData.packageId); // Declared but not used

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6 text-slate-700">Boeking Bewerken: {booking?.reservationId}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Customer Details */}
          <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
            <legend className="text-lg font-medium text-slate-600 px-2">Klantgegevens</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Naam</label>
                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefoon</label>
                <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </fieldset>

          {/* Booking Details */}
          <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
            <legend className="text-lg font-medium text-slate-600 px-2">Reserveringsdetails</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="showSlotId" className="block text-sm font-medium text-slate-700 mb-1">Show Slot</label>
                <select name="showSlotId" id="showSlotId" value={formData.showSlotId || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Selecteer Show Slot</option>
                  {showSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>
                      {new Date(slot.date).toLocaleDateString('nl-NL')} {slot.time} - {slot.name || 'Reguliere Show'} (Cap: {slot.capacity}, Geb: {slot.bookedCount})
                    </option>
                  ))}
                </select>
                {errors.showSlotId && <p className="text-red-500 text-xs mt-1">{errors.showSlotId}</p>}
              </div>
              <div>
                <label htmlFor="packageId" className="block text-sm font-medium text-slate-700 mb-1">Pakket</label>
                <select 
                    name="packageId" 
                    id="packageId" 
                    value={formData.packageId || ''} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!currentShowSlot}
                >
                  <option value="">Selecteer Pakket</option>
                  {currentShowSlot && packages
                    .filter(pkg => currentShowSlot.availablePackageIds?.includes(pkg.id))
                    .map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name} (€{pkg.price?.toFixed(2) || 'N/A'})</option>
                  ))}
                </select>
                {errors.packageId && <p className="text-red-500 text-xs mt-1">{errors.packageId}</p>}
              </div>
              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-slate-700 mb-1">Aantal Gasten</label>
                <input type="number" name="guests" id="guests" value={formData.guests || 1} onChange={handleInputChange} min="1" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                {errors.guests && <p className="text-red-500 text-xs mt-1">{errors.guests}</p>}
              </div>
               <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select name="status" id="status" value={formData.status || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="confirmed">Bevestigd</option>
                    <option value="pending_approval">Wacht op goedkeuring</option>
                    <option value="waitlisted">Wachtlijst</option>
                    <option value="cancelled">Geannuleerd</option>
                    <option value="completed">Voltooid</option>
                    <option value="pending_payment">Wacht op betaling</option>
                </select>
              </div>
            </div>
          </fieldset>
          
          {/* Address Details (Optional) */}
            <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
                <legend className="text-lg font-medium text-slate-600 px-2">Adresgegevens (Optioneel)</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="address.street" className="block text-sm font-medium text-slate-700 mb-1">Straat</label>
                        <input type="text" name="street" id="address.street" value={formData.address?.street || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="address.houseNumber" className="block text-sm font-medium text-slate-700 mb-1">Huisnummer</label>
                        <input type="text" name="houseNumber" id="address.houseNumber" value={formData.address?.houseNumber || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        {errors['address.houseNumber'] && <p className="text-red-500 text-xs mt-1">{errors['address.houseNumber']}</p>}
                    </div>
                    <div>
                        <label htmlFor="address.postalCode" className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                        <input type="text" name="postalCode" id="address.postalCode" value={formData.address?.postalCode || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="address.city" className="block text-sm font-medium text-slate-700 mb-1">Plaats</label>
                        <input type="text" name="city" id="address.city" value={formData.address?.city || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="address.zipCode" className="block text-sm font-medium text-slate-700 mb-1">ZIP Code (Optioneel)</label>
                        <input type="text" name="zipCode" id="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 rounded-md text-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="address.country" className="block text-sm font-medium text-slate-700 mb-1">Land (Optioneel)</label>
                        <input type="text" name="country" id="address.country" value={formData.address?.country || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 rounded-md text-slate-700" />
                    </div>
                </div>
            </fieldset>

          {/* Special Requests & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="specialRequests" className="block text-sm font-medium text-slate-700 mb-1">Speciale Verzoeken</label>
              <textarea name="specialRequests" id="specialRequests" value={formData.specialRequests || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            <div>
              <label htmlFor="internalNotes" className="block text-sm font-medium text-slate-700 mb-1">Interne Notities</label>
              <textarea name="internalNotes" id="internalNotes" value={formData.internalNotes || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
          </div>
          
          {/* Merchandise */}
          <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
            <legend className="text-lg font-medium text-slate-600 px-2">Merchandise</legend>
            <div className="space-y-3">
              {merchandiseItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="text-sm text-slate-500 ml-2">(€{item.priceInclVAT.toFixed(2)})</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.merchandise?.find(m => m.itemId === item.id)?.quantity || 0}
                    onChange={(e) => handleMerchandiseChange(item.id, parseInt(e.target.value, 10))}
                    className="w-20 p-1 border border-gray-300 rounded-md shadow-sm text-center"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Invoice Details */}
            <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
                <legend className="text-lg font-medium text-slate-600 px-2">Factuurgegevens</legend>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <input type="checkbox" name="generateInvoice" id="generateInvoice" checked={formData.invoiceDetails?.generateInvoice || false} onChange={handleInvoiceDetailsChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <label htmlFor="generateInvoice" className="ml-2 block text-sm text-slate-700">Factuur genereren?</label>
                    </div>
                    {formData.invoiceDetails?.generateInvoice && (
                        <div className="space-y-4 pl-6 border-l-2 border-indigo-200 py-2">
                             <div>
                                <label htmlFor="invoiceDetails.companyName" className="block text-sm font-medium text-slate-700 mb-1">Bedrijfsnaam (Factuur)</label>
                                <input type="text" name="companyName" id="invoiceDetails.companyName" value={formData.invoiceDetails?.companyName || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="invoiceDetails.vatNumber" className="block text-sm font-medium text-slate-700 mb-1">BTW-nummer (Factuur)</label>
                                <input type="text" name="vatNumber" id="invoiceDetails.vatNumber" value={formData.invoiceDetails?.vatNumber || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="invoiceDetails.address.street" className="block text-sm font-medium text-slate-700 mb-1">Straat (Factuur)</label>
                                    <input type="text" name="street" id="invoiceDetails.address.street" value={formData.invoiceDetails?.address?.street || ''} onChange={handleInvoiceAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    {errors['invoiceDetails.address.street'] && <p className="text-red-500 text-xs mt-1">{errors['invoiceDetails.address.street']}</p>}
                                </div>
                                <div>
                                    <label htmlFor="invoiceDetails.address.houseNumber" className="block text-sm font-medium text-slate-700 mb-1">Huisnummer (Factuur)</label>
                                    <input type="text" name="houseNumber" id="invoiceDetails.address.houseNumber" value={formData.invoiceDetails?.address?.houseNumber || ''} onChange={handleInvoiceAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    {errors['invoiceDetails.address.houseNumber'] && <p className="text-red-500 text-xs mt-1">{errors['invoiceDetails.address.houseNumber']}</p>}
                                </div>
                                <div>
                                    <label htmlFor="invoiceDetails.address.postalCode" className="block text-sm font-medium text-slate-700 mb-1">Postcode (Factuur)</label>
                                    <input type="text" name="postalCode" id="invoiceDetails.address.postalCode" value={formData.invoiceDetails?.address?.postalCode || ''} onChange={handleInvoiceAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    {errors['invoiceDetails.address.postalCode'] && <p className="text-red-500 text-xs mt-1">{errors['invoiceDetails.address.postalCode']}</p>}
                                </div>
                                <div>
                                    <label htmlFor="invoiceDetails.address.city" className="block text-sm font-medium text-slate-700 mb-1">Plaats (Factuur)</label>
                                    <input type="text" name="city" id="invoiceDetails.address.city" value={formData.invoiceDetails?.address?.city || ''} onChange={handleInvoiceAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    {errors['invoiceDetails.address.city'] && <p className="text-red-500 text-xs mt-1">{errors['invoiceDetails.address.city']}</p>}
                                </div>
                                 <div>
                                    <label htmlFor="invoiceDetails.address.zipCode" className="block text-sm font-medium text-slate-700 mb-1">ZIP Code (Factuur)</label>
                                    <input type="text" name="zipCode" id="invoiceDetails.address.zipCode" value={formData.invoiceDetails?.address?.zipCode || ''} onChange={handleInvoiceAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    {errors['invoiceDetails.address.zipCode'] && <p className="text-red-500 text-xs mt-1">{errors['invoiceDetails.address.zipCode']}</p>}
                                </div>
                                <div>
                                    <label htmlFor="invoiceDetails.address.country" className="block text-sm font-medium text-slate-700 mb-1">Land (Factuur)</label>
                                    <input type="text" name="country" id="invoiceDetails.address.country" value={formData.invoiceDetails?.address?.country || ''} onChange={handleInvoiceAddressChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    {errors['invoiceDetails.address.country'] && <p className="text-red-500 text-xs mt-1">{errors['invoiceDetails.address.country']}</p>}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="invoiceDetails.remarks" className="block text-sm font-medium text-slate-700 mb-1">Opmerkingen (Factuur)</label>
                                <textarea name="remarks" id="invoiceDetails.remarks" value={formData.invoiceDetails?.remarks || ''} onChange={handleInvoiceDetailsChange} rows={2} className="w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                            </div>
                        </div>
                    )}
                </div>
            </fieldset>
            
            {/* Promo Code & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                    <label htmlFor="appliedPromoCode" className="block text-sm font-medium text-slate-700 mb-1">Toegepaste Promocode</label>
                    <input 
                        type="text" 
                        name="appliedPromoCode" 
                        id="appliedPromoCode" 
                        value={formData.appliedPromoCode || ''} 
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-slate-50"
                        // readOnly // Or make it editable if admin can change it
                    />
                    {/* Add logic to apply/validate promo code if editable */}
                </div>
                <div className="text-right">
                    <p className="text-lg font-semibold text-slate-700">Totaalprijs: €{calculatedPrice.toFixed(2)}</p>
                    {formData.discountAmount && formData.discountAmount > 0 && (
                        <p className="text-sm text-green-600">Korting: €{formData.discountAmount.toFixed(2)}</p>
                    )}
                </div>
            </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Annuleren
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};