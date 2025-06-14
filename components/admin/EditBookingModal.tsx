




import React, { useState, useEffect, useRef } from 'react';
import { ReservationDetails, PackageOption, MerchandiseItem, OrderedMerchandiseItem, ShowSlot, Address, InvoiceDetails, SpecialAddOn, PromoCode } from '../../types';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingToEdit: ReservationDetails;
  onUpdateBooking: (updatedBooking: ReservationDetails, adminConsentsToOverbooking: boolean) => Promise<boolean>; 
  allPackages: PackageOption[];
  specialAddons: SpecialAddOn[]; 
  merchandiseItems: MerchandiseItem[];
  availableShowSlots: ShowSlot[];
  applyPromoCode: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode };
}

const CloseIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  bookingToEdit,
  onUpdateBooking,
  allPackages,
  specialAddons,
  merchandiseItems,
  availableShowSlots,
  applyPromoCode, 
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<ReservationDetails>({ 
    ...bookingToEdit,
    isPaid: bookingToEdit.isPaid || false,
    isMPL: bookingToEdit.isMPL || false,
    placementPreferenceDetails: bookingToEdit.placementPreferenceDetails || '',
    internalAdminNotes: bookingToEdit.internalAdminNotes || '',
    selectedVoorborrel: bookingToEdit.selectedVoorborrel || false,
    selectedNaborrel: bookingToEdit.selectedNaborrel || false,
    acceptsMarketingEmails: bookingToEdit.acceptsMarketingEmails || false,
    agreedToPrivacyPolicy: bookingToEdit.agreedToPrivacyPolicy || true, // Admin implies agreement or it was set
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [isPotentialOverbooking, setIsPotentialOverbooking] = useState<boolean>(false);
  const [adminConsentsToOverbooking, setAdminConsentsToOverbooking] = useState<boolean>(false);

  const [promoCodeInput, setPromoCodeInput] = useState<string>(bookingToEdit.appliedPromoCode || '');
  const [currentAppliedPromo, setCurrentAppliedPromo] = useState<string | undefined>(bookingToEdit.appliedPromoCode);
  const [currentDiscountAmount, setCurrentDiscountAmount] = useState<number | undefined>(bookingToEdit.discountAmount);
  const [promoCodeEditMessage, setPromoCodeEditMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);


  useEffect(() => {
    setFormData({ 
        ...bookingToEdit,
        isPaid: bookingToEdit.isPaid || false, 
        isMPL: bookingToEdit.isMPL || false,
        placementPreferenceDetails: bookingToEdit.placementPreferenceDetails || '',
        internalAdminNotes: bookingToEdit.internalAdminNotes || '',
        selectedVoorborrel: bookingToEdit.selectedVoorborrel || false,
        selectedNaborrel: bookingToEdit.selectedNaborrel || false,
        merchandise: bookingToEdit.merchandise || [], 
        address: bookingToEdit.address || { street: '', houseNumber: '', postalCode: '', city: '' },
        invoiceDetails: bookingToEdit.invoiceDetails || { needsInvoice: false, companyName: '', vatNumber: '', invoiceAddress: { street: '', houseNumber: '', postalCode: '', city: '' }, remarks: ''},
        acceptsMarketingEmails: bookingToEdit.acceptsMarketingEmails || false,
        agreedToPrivacyPolicy: bookingToEdit.agreedToPrivacyPolicy || true, 
    });
    setPromoCodeInput(bookingToEdit.appliedPromoCode || '');
    setCurrentAppliedPromo(bookingToEdit.appliedPromoCode);
    setCurrentDiscountAmount(bookingToEdit.discountAmount);
    setPromoCodeEditMessage(null);
    
    setErrors({});
    setFormMessage(null);
    setAdminConsentsToOverbooking(false);
    if(isOpen) modalRef.current?.focus();
  }, [isOpen, bookingToEdit]);

  useEffect(() => {
    const currentShowSlot = availableShowSlots.find(s => s.id === formData.showSlotId);
    if (currentShowSlot) {
      const oldBookingSlot = availableShowSlots.find(s => s.id === bookingToEdit.showSlotId);
      const guestChangeOnSameSlot = (currentShowSlot.id === bookingToEdit.showSlotId) ? (formData.guests - bookingToEdit.guests) : formData.guests;
      const newBookedCount = (oldBookingSlot?.id === currentShowSlot.id ? (currentShowSlot.bookedCount - bookingToEdit.guests) : currentShowSlot.bookedCount) + formData.guests;
      setIsPotentialOverbooking(newBookedCount > currentShowSlot.capacity);
    } else {
      setIsPotentialOverbooking(false);
    }
  }, [formData.guests, formData.showSlotId, availableShowSlots, bookingToEdit.guests, bookingToEdit.showSlotId]);


  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const resetPromoApplication = () => {
    setPromoCodeInput(formData.appliedPromoCode || '');
    setCurrentAppliedPromo(formData.appliedPromoCode);
    setCurrentDiscountAmount(formData.discountAmount);
    setPromoCodeEditMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormMessage(null);
    setErrors(prev => ({...prev, [name]: undefined }));
    resetPromoApplication();

    if (name === "selectedVoorborrel" || name === "selectedNaborrel" || name === "isPaid" || name === "isMPL" || name === "acceptsMarketingEmails" || name === "agreedToPrivacyPolicy") {
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "guests") {
        setFormData(prev => ({ ...prev, guests: parseInt(value, 10) || 1 }));
    } else if (name === "showSlotId"){
        const newSlotId = value;
        const newSlot = availableShowSlots.find(s => s.id === newSlotId);
        if (newSlot) {
            setFormData(prev => ({
                ...prev,
                showSlotId: newSlotId,
                date: newSlot.date,
                time: newSlot.time,
                // Reset package if not available in new slot
                packageId: newSlot.availablePackageIds.includes(prev.packageId) ? prev.packageId : (newSlot.availablePackageIds[0] || '')
            }));
        }
    } else {
        const val = type === 'number' ? parseInt(value, 10) : (type === 'checkbox' ? checked : value);
        setFormData(prev => ({ ...prev, [name]: val }));
    }
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormMessage(null);
    resetPromoApplication();
    setErrors(prev => ({...prev, [name]: undefined, [`address.${name}`]: undefined }));
    setFormData(prev => ({ ...prev, address: { ...prev.address!, [name as keyof Address]: value } }));
  };

  const handleInvoiceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormMessage(null);
    resetPromoApplication();

    const fieldNameForError = name.startsWith("invoiceDetails.") ? name : `invoiceDetails.${name}`;
    setErrors(prev => ({...prev, [fieldNameForError]: undefined }));


    if (name === "needsInvoice") {
        setFormData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails!, needsInvoice: checked } }));
    } else if (name.startsWith("invoiceAddress.")) {
        const field = name.split(".")[1] as keyof Address;
        setErrors(prev => ({...prev, [`invoiceDetails.invoiceAddress.${field}`]: undefined }));
        setFormData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails!, invoiceAddress: { ...prev.invoiceDetails?.invoiceAddress!, [field]: value } } }));
    } else {
        setFormData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails!, [name as keyof Omit<InvoiceDetails, 'needsInvoice'|'invoiceAddress'>]: value } }));
    }
  };

  const handleMerchQuantityChange = (itemId: string, quantity: number) => {
    const item = merchandiseItems.find(m => m.id === itemId);
    if (!item) return;
    setFormMessage(null);
    resetPromoApplication();
    setFormData(prev => {
      const existingMerch = prev.merchandise || [];
      const existing = existingMerch.find(oi => oi.itemId === itemId);
      if (quantity > 0) {
        if (existing) return { ...prev, merchandise: existingMerch.map(oi => oi.itemId === itemId ? { ...oi, quantity } : oi) };
        return { ...prev, merchandise: [...existingMerch, { itemId, quantity, itemName: item.name, itemPrice: item.priceInclVAT }] };
      }
      return { ...prev, merchandise: existingMerch.filter(oi => oi.itemId !== itemId) };
    });
  };

  const calculateSubtotal = () => {
    let subtotal = 0;
    const currentPackage = allPackages.find(p => p.id === formData.packageId);
    if (currentPackage) subtotal += currentPackage.price * formData.guests;

    if (formData.selectedVoorborrel) {
        const voorborrelAddon = specialAddons.find(sa => sa.id === 'voorborrel');
        if (voorborrelAddon) subtotal += voorborrelAddon.price * formData.guests;
    }
    if (formData.selectedNaborrel) {
        const naborrelAddon = specialAddons.find(sa => sa.id === 'naborrel');
        if (naborrelAddon) subtotal += naborrelAddon.price * formData.guests;
    }
    formData.merchandise?.forEach(item => subtotal += item.itemPrice * item.quantity);
    return subtotal;
  }

  const handleApplyPromoCodeButton = () => {
     if (!promoCodeInput.trim() && !currentAppliedPromo) { // No code entered, none applied
        setPromoCodeEditMessage({ type: 'info', text: 'Geen code ingevoerd.' });
        setCurrentDiscountAmount(undefined);
        return;
    }
    if (!promoCodeInput.trim() && currentAppliedPromo) { // Clearing an applied code
        setPromoCodeEditMessage({ type: 'success', text: `Code "${currentAppliedPromo}" verwijderd.` });
        setCurrentAppliedPromo(undefined);
        setCurrentDiscountAmount(undefined);
        setPromoCodeInput(''); 
        return;
    }

    const subtotal = calculateSubtotal();
    const result = applyPromoCode(promoCodeInput, subtotal);
    
    setPromoCodeEditMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success && result.appliedCodeObject && result.discountAmount !== undefined) {
      let finalDiscount = result.discountAmount;
      if (result.appliedCodeObject.type === 'gift_card') {
        finalDiscount = Math.min(result.discountAmount, subtotal);
      } else {
        finalDiscount = Math.min(result.discountAmount, subtotal);
      }
      setCurrentAppliedPromo(result.appliedCodeObject.code);
      setCurrentDiscountAmount(finalDiscount);
    } else {
      // If applying failed, revert to the original applied code of the booking if any
      setCurrentAppliedPromo(formData.appliedPromoCode);
      setCurrentDiscountAmount(formData.discountAmount);
    }
  };
  
  const calculateTotalPrice = () => {
    const subtotal = calculateSubtotal();
    let total = subtotal;
    if (currentAppliedPromo && currentDiscountAmount !== undefined) {
      total -= currentDiscountAmount;
    }
    return Math.max(0, total).toFixed(2);
  };

  const groupedMerchandise = merchandiseItems.reduce((acc, item) => {
    const category = item.category || 'Overig';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MerchandiseItem[]>);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.showSlotId) newErrors.showSlotId = "Selecteer een show."; 
    if (!formData.packageId) newErrors.packageId = "Selecteer een arrangement.";

    if (formData.guests < 1) newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.';
    
    const currentPackage = allPackages.find(p => p.id === formData.packageId);
    if (currentPackage?.minPersons && formData.guests < currentPackage.minPersons) {
      newErrors.guests = `Minimaal ${currentPackage.minPersons} gasten vereist voor ${currentPackage.name}.`;
    }
    
    if (!formData.name.trim()) newErrors.name = 'Naam is verplicht.';
    if (!formData.email.trim()) newErrors.email = 'E-mail is verplicht.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Voer een geldig e-mailadres in.';
    if (!formData.phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht.';

    if (!formData.address?.street?.trim()) newErrors.street = 'Straat is verplicht.';
    if (!formData.address?.houseNumber?.trim()) newErrors.houseNumber = 'Huisnummer is verplicht.';
    if (!formData.address?.postalCode?.trim()) newErrors.postalCode = 'Postcode is verplicht.';
    if (!formData.address?.city?.trim()) newErrors.city = 'Plaats is verplicht.';

    if (formData.invoiceDetails?.needsInvoice) {
        if (!formData.invoiceDetails.companyName?.trim()) newErrors.companyName = 'Bedrijfsnaam (factuur) is verplicht.';
        if (formData.invoiceDetails.invoiceAddress) {
           if(!formData.invoiceDetails.invoiceAddress.street?.trim()) newErrors.invoiceStreet = 'Straat (factuur) is verplicht.';
           if(!formData.invoiceDetails.invoiceAddress.houseNumber?.trim()) newErrors.invoiceHouseNumber = 'Huisnummer (factuur) is verplicht.';
           if(!formData.invoiceDetails.invoiceAddress.postalCode?.trim()) newErrors.invoicePostalCode = 'Postcode (factuur) is verplicht.';
           if(!formData.invoiceDetails.invoiceAddress.city?.trim()) newErrors.invoiceCity = 'Plaats (factuur) is verplicht.';
        }
    }
    const voorborrelAddon = specialAddons.find(sa => sa.id === 'voorborrel');
    if (formData.selectedVoorborrel && voorborrelAddon?.minPersons && formData.guests < voorborrelAddon.minPersons) {
      newErrors.voorborrel = `Minimaal ${voorborrelAddon.minPersons} gasten vereist voor Borrel Vooraf.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null); 
    if (validateForm()) {
      // Use currentAppliedPromo and currentDiscountAmount for submission
      const updatedBookingData = {
        ...formData,
        appliedPromoCode: currentAppliedPromo,
        discountAmount: currentDiscountAmount,
      };
      const success = await onUpdateBooking(updatedBookingData, adminConsentsToOverbooking);
      if (success) {
        // Modal is closed from AdminPage if successful
      } else {
        setFormMessage({ type: 'error', text: 'Bijwerken mislukt. Controleer de details of probeer opnieuw.' });
      }
    } else {
        setFormMessage({ type: 'error', text: 'Vul alle verplichte velden correct in.' });
    }
  };
  
  const availableShowSlotsSorted = [...availableShowSlots].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  const packagesForSelectedSlot = formData.showSlotId ? allPackages.filter(p => availableShowSlots.find(s => s.id === formData.showSlotId)?.availablePackageIds.includes(p.id)) : [];
  const voorborrelAddon = specialAddons.find(sa => sa.id === 'voorborrel');
  const canSelectVoorborrel = voorborrelAddon && formData.guests >= (voorborrelAddon.minPersons || 0);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[90] backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-booking-modal-title" onClick={onClose}>
      <div ref={modalRef} tabIndex={-1} className="bg-white p-5 md:p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 id="edit-booking-modal-title" className="text-xl md:text-2xl font-semibold text-blue-600">Reservering Bewerken</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Sluiten"><CloseIconSvg /></button>
        </div>

        {formMessage && (<p className={`p-3 rounded-md mb-4 text-sm ${formMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{formMessage.text}</p>)}
        
        <form onSubmit={handleSubmit} noValidate className="flex-grow overflow-y-auto mb-6 pr-2 scrollbar space-y-4">
          <p className="text-xs text-gray-500">Reservering ID: {bookingToEdit.reservationId}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="showSlotId_edit_modal" className="block text-sm font-medium text-gray-700">Show</label>
                <select name="showSlotId" id="showSlotId_edit_modal" value={formData.showSlotId} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                    {availableShowSlotsSorted.map(slot => <option key={slot.id} value={slot.id}>{new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL')} om {slot.time} ({slot.bookedCount}/{slot.capacity})</option>)}
                </select>
                {errors.showSlotId && <p className="text-red-500 text-sm mt-1">{errors.showSlotId}</p>}
            </div>
            <div>
                <label htmlFor="packageId_edit_modal" className="block text-sm font-medium text-gray-700">Arrangement</label>
                <select name="packageId" id="packageId_edit_modal" value={formData.packageId} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" disabled={packagesForSelectedSlot.length === 0}>
                    {packagesForSelectedSlot.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} - €{pkg.price.toFixed(2)}</option>)}
                </select>
                {errors.packageId && <p className="text-red-500 text-sm mt-1">{errors.packageId}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="guests_edit_modal" className="block text-sm font-medium text-gray-700">Aantal Gasten</label>
            <input type="number" name="guests" id="guests_edit_modal" value={formData.guests} onChange={handleInputChange} min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests}</p>}
          </div>
          
          {isPotentialOverbooking && (
            <div className="my-3 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={adminConsentsToOverbooking} 
                  onChange={(e) => setAdminConsentsToOverbooking(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-yellow-600 border-yellow-400 rounded focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-yellow-700">Sta overboeking toe voor deze wijziging</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name_edit_modal" className="block text-sm font-medium text-gray-700">Naam Contactpersoon</label>
              <input type="text" name="name" id="name_edit_modal" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="phone_edit_modal" className="block text-sm font-medium text-gray-700">Telefoon</label>
              <input type="tel" name="phone" id="phone_edit_modal" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="email_edit_modal" className="block text-sm font-medium text-gray-700">E-mail</label>
            <input type="email" name="email" id="email_edit_modal" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <fieldset className="border border-gray-300 p-3 rounded-md">
            <legend className="text-sm font-medium text-gray-700 px-1">Adresgegevens</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div className="md:col-span-2"><label htmlFor="street_edit" className="block text-xs font-medium text-gray-600">Straat</label><input type="text" name="street" id="street_edit" value={formData.address?.street || ''} onChange={handleAddressChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.street && <p className="text-red-500 text-xs mt-0.5">{errors.street}</p>}</div>
                <div><label htmlFor="houseNumber_edit" className="block text-xs font-medium text-gray-600">Huisnr.</label><input type="text" name="houseNumber" id="houseNumber_edit" value={formData.address?.houseNumber || ''} onChange={handleAddressChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.houseNumber && <p className="text-red-500 text-xs mt-0.5">{errors.houseNumber}</p>}</div>
                <div><label htmlFor="postalCode_edit" className="block text-xs font-medium text-gray-600">Postcode</label><input type="text" name="postalCode" id="postalCode_edit" value={formData.address?.postalCode || ''} onChange={handleAddressChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.postalCode && <p className="text-red-500 text-xs mt-0.5">{errors.postalCode}</p>}</div>
                <div className="md:col-span-2"><label htmlFor="city_edit" className="block text-xs font-medium text-gray-600">Plaats</label><input type="text" name="city" id="city_edit" value={formData.address?.city || ''} onChange={handleAddressChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.city && <p className="text-red-500 text-xs mt-0.5">{errors.city}</p>}</div>
            </div>
          </fieldset>

          <div className="mt-2"><label className="flex items-center space-x-2"><input type="checkbox" name="needsInvoice" checked={formData.invoiceDetails?.needsInvoice || false} onChange={handleInvoiceDetailsChange} className="form-checkbox h-4 w-4 text-blue-600 rounded"/><span className="text-sm text-gray-700">Factuurgegevens (indien afwijkend/bedrijf)</span></label></div>
            {formData.invoiceDetails?.needsInvoice && (
                 <fieldset className="border border-gray-300 p-3 rounded-md space-y-2">
                    <legend className="text-sm font-medium text-gray-700 px-1">Factuurdetails</legend>
                    <div><label htmlFor="companyName_edit" className="block text-xs font-medium text-gray-600">Bedrijfsnaam</label><input type="text" name="companyName" id="companyName_edit" value={formData.invoiceDetails?.companyName || ''} onChange={handleInvoiceDetailsChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.companyName && <p className="text-red-500 text-xs mt-0.5">{errors.companyName}</p>}</div>
                    <div><label htmlFor="vatNumber_edit" className="block text-xs font-medium text-gray-600">BTW-nummer</label><input type="text" name="vatNumber" id="vatNumber_edit" value={formData.invoiceDetails?.vatNumber || ''} onChange={handleInvoiceDetailsChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/></div>
                    <p className="text-xs text-gray-500">Factuuradres (indien afwijkend):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <div className="md:col-span-2"><label htmlFor="invoiceAddress.street_edit" className="block text-xs font-medium text-gray-600">Straat</label><input type="text" name="invoiceAddress.street" id="invoiceAddress.street_edit" value={formData.invoiceDetails?.invoiceAddress?.street || ''} onChange={handleInvoiceDetailsChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.invoiceStreet && <p className="text-red-500 text-xs mt-0.5">{errors.invoiceStreet}</p>}</div>
                        <div><label htmlFor="invoiceAddress.houseNumber_edit" className="block text-xs font-medium text-gray-600">Huisnr.</label><input type="text" name="invoiceAddress.houseNumber" id="invoiceAddress.houseNumber_edit" value={formData.invoiceDetails?.invoiceAddress?.houseNumber || ''} onChange={handleInvoiceDetailsChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.invoiceHouseNumber && <p className="text-red-500 text-xs mt-0.5">{errors.invoiceHouseNumber}</p>}</div>
                        <div><label htmlFor="invoiceAddress.postalCode_edit" className="block text-xs font-medium text-gray-600">Postcode</label><input type="text" name="invoiceAddress.postalCode" id="invoiceAddress.postalCode_edit" value={formData.invoiceDetails?.invoiceAddress?.postalCode || ''} onChange={handleInvoiceDetailsChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.invoicePostalCode && <p className="text-red-500 text-xs mt-0.5">{errors.invoicePostalCode}</p>}</div>
                        <div className="md:col-span-2"><label htmlFor="invoiceAddress.city_edit" className="block text-xs font-medium text-gray-600">Plaats</label><input type="text" name="invoiceAddress.city" id="invoiceAddress.city_edit" value={formData.invoiceDetails?.invoiceAddress?.city || ''} onChange={handleInvoiceDetailsChange} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/>{errors.invoiceCity && <p className="text-red-500 text-xs mt-0.5">{errors.invoiceCity}</p>}</div>
                    </div>
                    <div><label htmlFor="remarks_edit" className="block text-xs font-medium text-gray-600">Opmerkingen factuur</label><textarea name="remarks" id="remarks_edit" value={formData.invoiceDetails?.remarks || ''} onChange={handleInvoiceDetailsChange} rows={2} className="mt-0.5 block w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"/></div>
                 </fieldset>
            )}
          

          <div>
            <label htmlFor="celebrationDetails_edit_modal" className="block text-sm font-medium text-gray-700">Iets te vieren?</label>
            <input type="text" name="celebrationDetails" id="celebrationDetails_edit_modal" value={formData.celebrationDetails || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="dietaryWishes_edit_modal" className="block text-sm font-medium text-gray-700">Dieetwensen</label>
            <textarea name="dietaryWishes" id="dietaryWishes_edit_modal" value={formData.dietaryWishes || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
          </div>

          <fieldset className="border border-gray-300 p-3 rounded-md">
                <legend className="text-sm font-medium text-gray-700 px-1">Plaatsing & Opmerkingen Admin</legend>
                <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="isMPL" checked={formData.isMPL || false} onChange={handleInputChange} className="form-checkbox h-4 w-4 text-blue-600 rounded"/>
                        <span className="text-sm text-gray-700">MPL (Mooie Plaatsen)</span>
                    </label>
                    <div>
                        <label htmlFor="placementPreferenceDetails_edit" className="block text-xs font-medium text-gray-600">Plaats Voorkeur Details</label>
                        <textarea name="placementPreferenceDetails" id="placementPreferenceDetails_edit" value={formData.placementPreferenceDetails || ''} onChange={handleInputChange} rows={2} className="mt-0.5 w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Bijv. graag bij het raam..."/>
                    </div>
                     <div>
                        <label htmlFor="internalAdminNotes_edit" className="block text-xs font-medium text-gray-600">Interne Admin Opmerkingen</label>
                        <textarea name="internalAdminNotes" id="internalAdminNotes_edit" value={formData.internalAdminNotes || ''} onChange={handleInputChange} rows={2} className="mt-0.5 w-full border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Bijv. VIP..."/>
                    </div>
                     <div>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="acceptsMarketingEmails" checked={formData.acceptsMarketingEmails || false} onChange={handleInputChange} className="form-checkbox h-4 w-4 text-blue-600 rounded"/>
                            <span className="text-sm text-gray-700">Accepteert marketing e-mails</span>
                        </label>
                    </div>
                </div>
            </fieldset>
            
           <div className="pt-3 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-700 mb-2">Extra's</h3>
                <div className="space-y-2">
                    {specialAddons.find(sa => sa.id === 'voorborrel') && (
                         <div className={`p-2 border rounded-md ${formData.selectedVoorborrel ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" name="selectedVoorborrel" checked={formData.selectedVoorborrel || false} onChange={handleInputChange} 
                                    disabled={!canSelectVoorborrel && !formData.selectedVoorborrel}
                                    className="form-checkbox h-4 w-4 text-blue-600"/>
                                <div>
                                    <span className={!canSelectVoorborrel && !formData.selectedVoorborrel ? "text-gray-400" : ""}>Borrel Vooraf (€{specialAddons.find(sa => sa.id === 'voorborrel')?.price.toFixed(2)} p.p.)</span>
                                    {!canSelectVoorborrel && formData.guests < (voorborrelAddon?.minPersons || 0) && <span className="text-xs text-orange-500 block"> (Min. {specialAddons.find(sa => sa.id === 'voorborrel')?.minPersons} gasten, huidig: {formData.guests})</span>}
                                </div>
                            </label>
                             {errors.voorborrel && <p className="text-red-500 text-xs mt-1">{errors.voorborrel}</p>}
                         </div>
                    )}
                     {specialAddons.find(sa => sa.id === 'naborrel') && (
                        <div className={`p-2 border rounded-md ${formData.selectedNaborrel ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" name="selectedNaborrel" checked={formData.selectedNaborrel || false} onChange={handleInputChange} className="form-checkbox h-4 w-4 text-blue-600"/>
                            <span>AfterParty (€{specialAddons.find(sa => sa.id === 'naborrel')?.price.toFixed(2)} p.p.)</span>
                        </label>
                        </div>
                    )}
                </div>
            </div>
          
          {merchandiseItems.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-2">Merchandise</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar">
                {Object.entries(groupedMerchandise).map(([category, items]) => (
                    <div key={category}>
                        <h4 className="text-sm font-semibold text-blue-500 mb-1 sticky top-0 bg-white py-0.5">{category}</h4>
                        {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-md text-sm">
                            <div className="flex items-center">
                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded mr-2"/>}
                                <span>{item.name} (€{item.priceInclVAT.toFixed(2)})</span>
                            </div>
                            <input type="number" min="0" className="w-16 border-gray-300 rounded-md shadow-sm p-1 text-xs"
                            value={formData.merchandise?.find(oi => oi.itemId === item.id)?.quantity || 0}
                            onChange={(e) => handleMerchQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            aria-label={`Aantal ${item.name}`}/>
                        </div>
                        ))}
                    </div>
                ))}
              </div>
            </div>
          )}

           <div className="pt-3 border-t border-slate-200">
            <label htmlFor="editPromoCodeInput" className="block text-sm font-medium text-gray-700 mb-1">Kortingscode / Cadeaubon</label>
            <div className="flex items-center space-x-2">
                <input type="text" id="editPromoCodeInput" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} placeholder="Voer code in of laat leeg" className="flex-grow border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
                <button type="button" onClick={handleApplyPromoCodeButton} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors">Pas Code Toe/Verwijder</button>
            </div>
            {promoCodeEditMessage && <p className={`text-xs mt-1 p-1 rounded ${promoCodeEditMessage.type === 'success' ? 'bg-green-50 text-green-700' : promoCodeEditMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{promoCodeEditMessage.text}</p>}
          </div>

          <div className="pt-3 border-t border-gray-200">
            <label className="flex items-center space-x-2">
                <input type="checkbox" name="isPaid" checked={formData.isPaid || false} onChange={handleInputChange} className="form-checkbox h-4 w-4 text-blue-600 rounded"/>
                <span className="text-sm font-medium text-gray-700">Markeer als betaald</span>
            </label>
          </div>
           <p className="text-xs text-gray-600 mt-2">Subtotaal (voor evt. korting): €{calculateSubtotal().toFixed(2)}</p>
            {currentAppliedPromo && currentDiscountAmount !== undefined && (
                <p className="text-sm text-green-600">Toegepaste Korting ({currentAppliedPromo}): -€{currentDiscountAmount.toFixed(2)}</p>
             )}
          <p className="text-lg font-semibold mt-1 text-right">Totaal: €{calculateTotalPrice()}</p>

        </form>
        <div className="flex justify-end items-center pt-4 border-t border-gray-200 space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors text-sm">Annuleren</button>
            <button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-md transition-colors text-sm">Wijzigingen Opslaan</button>
        </div>
      </div>
    </div>
  );
};