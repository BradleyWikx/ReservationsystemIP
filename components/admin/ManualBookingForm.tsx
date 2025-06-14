import React, { useState, useEffect, useMemo } from 'react';
import { ShowSlot, PackageOption, MerchandiseItem, OrderedMerchandiseItem, Address, InvoiceDetails, SpecialAddOn, PromoCode, ManualBookingPayload } from '../../types';
import { CalendarView } from '../CalendarView'; 

interface ManualBookingFormProps {
  availableShowSlots: ShowSlot[];
  allPackages: PackageOption[];
  specialAddons: SpecialAddOn[]; 
  merchandiseItems: MerchandiseItem[];
  onSubmit: (details: ManualBookingPayload) => Promise<boolean>; // Updated to use ManualBookingPayload
  applyPromoCode: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode };
}

export const ManualBookingForm: React.FC<ManualBookingFormProps> = ({
  availableShowSlots,
  allPackages,
  specialAddons,
  merchandiseItems,
  onSubmit,
  applyPromoCode,
}) => {
  const initialAddress: Address = { street: '', houseNumber: '', postalCode: '', city: '' };
  // Corrected initialInvoiceDetails to align with type definition
  const initialInvoiceDetails: InvoiceDetails = { generateInvoice: false, sendInvoice: false, companyName: '', vatNumber: '', address: { ...initialAddress }, remarks: '' };

  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [selectedShowSlotId, setSelectedShowSlotId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<Address>({ ...initialAddress });
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({...initialInvoiceDetails});
  const [dietaryWishes, setDietaryWishes] = useState<string>('');
  const [celebrationDetails, setCelebrationDetails] = useState<string>('');
  const [selectedVoorborrel, setSelectedVoorborrel] = useState<boolean>(false); 
  const [selectedNaborrel, setSelectedNaborrel] = useState<boolean>(false); 
  const [isPaid, setIsPaid] = useState<boolean>(false); 
  const [isMPL, setIsMPL] = useState<boolean>(false);
  const [placementPreferenceDetails, setPlacementPreferenceDetails] = useState<string>('');
  const [internalAdminNotes, setInternalAdminNotes] = useState<string>('');
  const [orderedMerch, setOrderedMerch] = useState<OrderedMerchandiseItem[]>([]);
  
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromoCodeString, setAppliedPromoCodeString] = useState<string | undefined>(undefined);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number | undefined>(undefined);
  const [promoCodeMessage, setPromoCodeMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [acceptsMarketingEmails, setAcceptsMarketingEmails] = useState<boolean>(false); // New state for marketing emails

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showsForCalendarDate = useMemo(() => {
    if (!calendarSelectedDate) return [];
    return availableShowSlots
      .filter(slot => slot.date === calendarSelectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [calendarSelectedDate, availableShowSlots]);

  const selectedShowSlot = availableShowSlots.find(s => s.id === selectedShowSlotId);
  const packagesForCurrentSlot = selectedShowSlot ? allPackages.filter(pkg => selectedShowSlot.availablePackageIds.includes(pkg.id)) : [];

  useEffect(() => {
    if (selectedShowSlot && packagesForCurrentSlot.length > 0) {
        if (!selectedPackageId || !packagesForCurrentSlot.find(p => p.id === selectedPackageId)) {
            setSelectedPackageId(packagesForCurrentSlot[0].id);
        }
    } else if (!selectedShowSlot) {
        setSelectedPackageId('');
    }
    setAppliedPromoCodeString(undefined);
    setAppliedDiscountAmount(undefined);
    setPromoCodeMessage(null);
    setPromoCodeInput('');
  }, [selectedShowSlotId, selectedShowSlot, packagesForCurrentSlot, selectedPackageId]);

  const handleDateSelect = (date: string) => {
    setCalendarSelectedDate(date);
    setSelectedShowSlotId(''); 
    setSelectedPackageId(''); 
  };

  const handleDataChangeAndResetPromo = (setter: Function, value: any) => {
    setter(value);
    setAppliedPromoCodeString(undefined);
    setAppliedDiscountAmount(undefined);
    setPromoCodeMessage(null);
  }

  const handleMerchQuantityChange = (itemId: string, quantity: number) => {
    const item = merchandiseItems.find(m => m.id === itemId);
    if (!item) return;
    setOrderedMerch(prev => {
      const existing = prev.find(oi => oi.itemId === itemId);
      if (quantity > 0) {
        if (existing) return prev.map(oi => oi.itemId === itemId ? { ...oi, quantity, itemName: item.name, itemPrice: item.priceInclVAT } : oi); // Ensure itemName and itemPrice are updated/set
        return [...prev, { itemId, quantity, itemName: item.name, itemPrice: item.priceInclVAT }]; 
      }
      return prev.filter(oi => oi.itemId !== itemId);
    });
    setAppliedPromoCodeString(undefined);
    setAppliedDiscountAmount(undefined);
    setPromoCodeMessage(null);
  };
  
  const calculateSubtotal = () => {
    let total = 0;
    const currentPackage = allPackages.find(p => p.id === selectedPackageId);
    if (currentPackage && currentPackage.price) total += currentPackage.price * guests; // Check for currentPackage.price

    if (selectedVoorborrel) {
        const voorborrelAddon = specialAddons.find(sa => sa.id === 'voorborrel');
        if (voorborrelAddon) total += voorborrelAddon.price * guests;
    }
    if (selectedNaborrel) {
        const naborrelAddon = specialAddons.find(sa => sa.id === 'naborrel');
        if (naborrelAddon) total += naborrelAddon.price * guests;
    }
    orderedMerch.forEach(item => total += item.itemPrice * item.quantity);
    return total;
  }

  const handleApplyPromoCodeButton = () => {
    if (!promoCodeInput.trim()) {
      setPromoCodeMessage({ type: 'error', text: 'Voer een code in.' });
      setAppliedPromoCodeString(undefined);
      setAppliedDiscountAmount(undefined);
      return;
    }
    const subtotal = calculateSubtotal();
    const result = applyPromoCode(promoCodeInput, subtotal);
    
    setPromoCodeMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success && result.appliedCodeObject && result.discountAmount !== undefined) {
      let finalDiscount = result.discountAmount;
       if (result.appliedCodeObject.type === 'gift_card') {
        finalDiscount = Math.min(result.discountAmount, subtotal); 
      } else {
        finalDiscount = Math.min(result.discountAmount, subtotal);
      }
      setAppliedPromoCodeString(result.appliedCodeObject.code);
      setAppliedDiscountAmount(finalDiscount);
    } else {
      setAppliedPromoCodeString(undefined);
      setAppliedDiscountAmount(undefined);
    }
  };
  
  const calculateTotalPrice = () => {
    const subtotal = calculateSubtotal();
    let total = subtotal;
    if (appliedPromoCodeString && appliedDiscountAmount !== undefined) {
      total -= appliedDiscountAmount;
    }
    return Math.max(0, total).toFixed(2); 
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleInvoiceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; // Removed unused 'type'
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "generateInvoice" || name === "sendInvoice") { // Added sendInvoice
        setInvoiceDetails(prev => ({ ...prev, [name]: checked }));
    } else if (name.startsWith("address.")) { // Corrected to use invoiceDetails.address
        const field = name.split(".")[1] as keyof Address;
        const currentInvoiceAddress = invoiceDetails.address || { ...initialAddress }; // Use initialAddress as fallback
        setInvoiceDetails(prev => ({ 
            ...prev, 
            address: { 
                ...currentInvoiceAddress, 
                [field]: value 
            } 
        }));
    } else {
        // Ensure name is a valid key of InvoiceDetails excluding boolean flags and address object
        setInvoiceDetails(prev => ({ ...prev, [name as keyof Omit<InvoiceDetails, 'generateInvoice'|'sendInvoice'|'address'>]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedShowSlotId) newErrors.showSlotId = 'Selecteer een show.';
    if (!selectedPackageId) newErrors.packageId = 'Selecteer een arrangement.';
    if (guests < 1) newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.';
    const currentPackage = allPackages.find(p => p.id === selectedPackageId);
    if (currentPackage?.minPersons && guests < currentPackage.minPersons) {
      newErrors.guests = `Minimaal ${currentPackage.minPersons} gasten vereist voor ${currentPackage.name}.`;
    }
    const currentShowSlot = availableShowSlots.find(s => s.id === selectedShowSlotId);
    if (currentShowSlot && currentShowSlot.isManuallyClosed) {
        newErrors.showSlotId = 'Deze show is handmatig gesloten en kan niet geboekt worden.';
    } else if (currentShowSlot && guests > (currentShowSlot.capacity - currentShowSlot.bookedCount)) {
        // For manual booking, this becomes a warning, admin can overbook via confirm in App.tsx
    }

    if (!name.trim()) newErrors.name = 'Naam is verplicht.';
    if (!email.trim()) newErrors.email = 'E-mail is verplicht.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Voer een geldig e-mailadres in.';
    if (!phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht.';
    if (!address.street.trim()) newErrors.street = 'Straat is verplicht.';
    if (!address.houseNumber.trim()) newErrors.houseNumber = 'Huisnummer is verplicht.';
    if (!address.postalCode.trim()) newErrors.postalCode = 'Postcode is verplicht.';
    if (!address.city.trim()) newErrors.city = 'Plaats is verplicht.';
    
    if (invoiceDetails.generateInvoice) { // Changed from needsInvoice
        if (!invoiceDetails.companyName?.trim()) newErrors.companyName = 'Bedrijfsnaam (factuur) is verplicht.';
        if (invoiceDetails.address) { // Changed from invoiceAddress
           if(!invoiceDetails.address.street?.trim()) newErrors.invoiceStreet = 'Straat (factuur) is verplicht.';
           if(!invoiceDetails.address.houseNumber?.trim()) newErrors.invoiceHouseNumber = 'Huisnummer (factuur) is verplicht.';
           if(!invoiceDetails.address.postalCode?.trim()) newErrors.invoicePostalCode = 'Postcode (factuur) is verplicht.';
           if(!invoiceDetails.address.city?.trim()) newErrors.invoiceCity = 'Plaats (factuur) is verplicht.';
        }
    }
    const voorborrelAddon = specialAddons.find(sa => sa.id === 'voorborrel');
    if (selectedVoorborrel && voorborrelAddon?.minPersons && guests < voorborrelAddon.minPersons) {
      newErrors.voorborrel = `Minimaal ${voorborrelAddon.minPersons} gasten vereist voor Borrel Vooraf.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMessage(null);
    if (validateForm()) {
      const success = await onSubmit({
        showSlotId: selectedShowSlotId,
        packageId: selectedPackageId,
        guests, name, email, phone, address,
        invoiceDetails, dietaryWishes, celebrationDetails,
        selectedVoorborrel, selectedNaborrel,
        merchandise: orderedMerch,
        isPaid, isMPL, placementPreferenceDetails, internalAdminNotes,
        appliedPromoCode: appliedPromoCodeString,
        discountAmount: appliedDiscountAmount,
        acceptsMarketingEmails, 
        totalPrice: parseFloat(calculateTotalPrice()), // Ensure totalPrice is passed
        // customerId is not passed here, as it's for guest bookings or handled in App.tsx if a customer is selected/created
      });
      if (success) {
        setFormMessage({ type: 'success', text: 'Boeking succesvol toegevoegd!' });
        setCalendarSelectedDate(null);
        setSelectedShowSlotId(''); setSelectedPackageId('');
        setGuests(1); setName(''); setEmail(''); setPhone('');
        setAddress({ ...initialAddress }); setInvoiceDetails({...initialInvoiceDetails});
        setDietaryWishes(''); setCelebrationDetails('');
        setSelectedVoorborrel(false); setSelectedNaborrel(false);
        setOrderedMerch([]); setIsPaid(false); setIsMPL(false);
        setPlacementPreferenceDetails(''); setInternalAdminNotes('');
        setPromoCodeInput(''); setAppliedPromoCodeString(undefined); setAppliedDiscountAmount(undefined); setPromoCodeMessage(null);
        setAcceptsMarketingEmails(false); // Reset marketing email
        setErrors({});
      } else {
        setFormMessage({ type: 'error', text: 'Kon boeking niet toevoegen. Controleer capaciteit of andere invoer.' });
      }
    } else {
        setFormMessage({ type: 'error', text: 'Vul alle verplichte velden correct in.' });
    }
  };
  
  const groupedMerchandise = merchandiseItems.reduce((acc, item) => {
    const category = item.category || 'Overig'; 
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MerchandiseItem[]>);

  const voorborrelAddon = specialAddons.find(sa => sa.id === 'voorborrel');
  const canSelectVoorborrel = voorborrelAddon && guests >= (voorborrelAddon.minPersons || 0);

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Handmatige Boeking</h2>
      {formMessage && (<p className={`p-3 rounded-md mb-4 text-sm ${formMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{formMessage.text}</p>)}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">1. Selecteer Datum</label>
                <CalendarView 
                    showSlots={availableShowSlots} 
                    selectedDate={calendarSelectedDate} 
                    onDateSelect={handleDateSelect}
                    className="bg-slate-50 p-3 rounded-lg shadow-sm border border-slate-200"
                />
            </div>
            <div>
                <label htmlFor="showSlotId" className="block text-sm font-medium text-slate-700 mb-1">2. Selecteer Show Tijdslot</label>
                <select id="showSlotId" name="showSlotId" value={selectedShowSlotId} onChange={(e) => handleDataChangeAndResetPromo(setSelectedShowSlotId, e.target.value)} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" disabled={!calendarSelectedDate || showsForCalendarDate.length === 0}>
                    <option value="" disabled>{!calendarSelectedDate ? "Selecteer eerst een datum" : (showsForCalendarDate.length === 0 ? "Geen shows op deze datum" : "Kies een tijdslot...")}</option>
                    {showsForCalendarDate.map(slot => (
                        <option key={slot.id} value={slot.id} disabled={slot.isManuallyClosed}>
                        {slot.time} ({slot.isManuallyClosed ? 'Gesloten' : `${slot.bookedCount}/${slot.capacity}`})
                        </option>
                    ))}
                </select>
                {errors.showSlotId && <p className="text-red-600 text-xs mt-1">{errors.showSlotId}</p>}
                
                {selectedShowSlot && (
                    <div className="mt-3">
                        <label htmlFor="packageId" className="block text-sm font-medium text-slate-700 mb-1">3. Selecteer Arrangement</label>
                        <select id="packageId" name="packageId" value={selectedPackageId} onChange={(e) => handleDataChangeAndResetPromo(setSelectedPackageId, e.target.value)} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" disabled={packagesForCurrentSlot.length === 0}>
                            <option value="" disabled>{packagesForCurrentSlot.length === 0 ? "Geen arrangementen" : "Kies een arrangement..."}</option>
                            {packagesForCurrentSlot.map(pkg => (<option key={pkg.id} value={pkg.id}>{pkg.name} - €{pkg.price?.toFixed(2) || 'N/A'}</option>))}
                        </select>
                        {errors.packageId && <p className="text-red-600 text-xs mt-1">{errors.packageId}</p>}
                    </div>
                )}
            </div>
        </div>

        <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
            <legend className="text-md font-semibold text-indigo-600 px-2">Gast- & Contactgegevens</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-slate-700 mb-1">Aantal Gasten</label>
                    <input type="number" id="guests" name="guests" value={guests} onChange={(e) => handleDataChangeAndResetPromo(setGuests, parseInt(e.target.value, 10) || 1)} min="1" required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    {selectedShowSlot && guests > (selectedShowSlot.capacity - selectedShowSlot.bookedCount) && !selectedShowSlot.isManuallyClosed && <p className="text-xs text-orange-500 mt-1">Let op: overboeking (capaciteit: {selectedShowSlot.capacity - selectedShowSlot.bookedCount} vrij)</p>}
                    {errors.guests && <p className="text-red-600 text-xs mt-1">{errors.guests}</p>}
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Naam Contactpersoon</label>
                    <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefoon</label>
                    <input type="tel" id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                </div>
            </div>
            <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input type="text" name="street" placeholder="Straat" value={address.street} onChange={handleAddressChange} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                    <input type="text" name="houseNumber" placeholder="Huisnr." value={address.houseNumber} onChange={handleAddressChange} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                    <input type="text" name="postalCode" placeholder="Postcode" value={address.postalCode} onChange={handleAddressChange} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                    <input type="text" name="city" placeholder="Plaats" value={address.city} onChange={handleAddressChange} required className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {errors.street && <p className="text-red-600 text-xs mt-0.5 md:col-start-1">{errors.street}</p>}
                    {errors.houseNumber && <p className="text-red-600 text-xs mt-0.5 md:col-start-2">{errors.houseNumber}</p>}
                    {errors.postalCode && <p className="text-red-600 text-xs mt-0.5 md:col-start-3">{errors.postalCode}</p>}
                    {errors.city && <p className="text-red-600 text-xs mt-0.5 md:col-start-4">{errors.city}</p>}
                </div>
            </div>
        </fieldset>

        <details className="border border-slate-300 p-3 rounded-lg shadow-sm group" open={invoiceDetails.generateInvoice}> {/* Changed from needsInvoice */}
            <summary className="text-md font-semibold text-indigo-600 cursor-pointer list-none group-open:mb-2">Factuurgegevens (Optioneel)</summary>
            <label className="flex items-center space-x-2 mb-2"> <input type="checkbox" name="generateInvoice" checked={invoiceDetails.generateInvoice} onChange={handleInvoiceDetailsChange} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-400 focus:ring-indigo-500"/> <span className="text-sm text-slate-700">Factuur genereren/nodig (afwijkende gegevens/bedrijf)</span> </label> {/* Changed from needsInvoice */}
            {invoiceDetails.generateInvoice && ( /* Changed from needsInvoice */
                <div className="space-y-3">
                    <input type="text" name="companyName" placeholder="Bedrijfsnaam" value={invoiceDetails.companyName || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/> {errors.companyName && <p className="text-red-600 text-xs mt-0.5">{errors.companyName}</p>}
                    <input type="text" name="vatNumber" placeholder="BTW-nummer (optioneel)" value={invoiceDetails.vatNumber || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                    <p className="text-xs text-slate-500">Factuuradres (indien afwijkend van hoofdreservering):</p> {/* Clarified text */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input type="text" name="address.street" placeholder="Straat (Factuur)" value={invoiceDetails.address?.street || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                        <input type="text" name="address.houseNumber" placeholder="Huisnr. (Factuur)" value={invoiceDetails.address?.houseNumber || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                        <input type="text" name="address.postalCode" placeholder="Postcode (Factuur)" value={invoiceDetails.address?.postalCode || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                        <input type="text" name="address.city" placeholder="Plaats (Factuur)" value={invoiceDetails.address?.city || ''} onChange={handleInvoiceDetailsChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"/>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {errors.invoiceStreet && <p className="text-red-600 text-xs mt-0.5 md:col-start-1">{errors.invoiceStreet}</p>}
                        {errors.invoiceHouseNumber && <p className="text-red-600 text-xs mt-0.5 md:col-start-2">{errors.invoiceHouseNumber}</p>}
                        {errors.invoicePostalCode && <p className="text-red-600 text-xs mt-0.5 md:col-start-3">{errors.invoicePostalCode}</p>}
                        {errors.invoiceCity && <p className="text-red-600 text-xs mt-0.5 md:col-start-4">{errors.invoiceCity}</p>}
                    </div>
                    <textarea name="remarks" placeholder="Opmerkingen voor factuur (bijv. referentie)" value={invoiceDetails.remarks || ''} onChange={handleInvoiceDetailsChange} rows={2} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                </div>
            )}
        </details>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="dietaryWishes" className="block text-sm font-medium text-slate-700 mb-1">Dieetwensen</label><textarea id="dietaryWishes" name="dietaryWishes" value={dietaryWishes} onChange={(e) => setDietaryWishes(e.target.value)} rows={2} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/></div>
            <div><label htmlFor="celebrationDetails" className="block text-sm font-medium text-slate-700 mb-1">Iets te vieren?</label><input type="text" id="celebrationDetails" name="celebrationDetails" value={celebrationDetails} onChange={(e) => setCelebrationDetails(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">Extra's</h4>
                <div className="space-y-2">
                     {specialAddons.find(sa => sa.id === 'voorborrel') && (
                         <label className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer ${selectedVoorborrel ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                            <input type="checkbox" name="selectedVoorborrel" checked={selectedVoorborrel} onChange={(e) => handleDataChangeAndResetPromo(setSelectedVoorborrel, e.target.checked)} disabled={!canSelectVoorborrel && !selectedVoorborrel} className="form-checkbox h-4 w-4 text-indigo-600"/>
                            <span className={!canSelectVoorborrel && !selectedVoorborrel ? "text-slate-400 text-xs" : "text-xs"}>Borrel Vooraf (€{specialAddons.find(sa => sa.id === 'voorborrel')?.price.toFixed(2)} p.p.){!canSelectVoorborrel && guests < (voorborrelAddon?.minPersons || 0) && ` (Min. ${voorborrelAddon?.minPersons}p)`}</span>
                        </label>
                     )}
                     {errors.voorborrel && <p className="text-red-600 text-xs mt-0.5">{errors.voorborrel}</p>}
                     {specialAddons.find(sa => sa.id === 'naborrel') && (
                        <label className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer ${selectedNaborrel ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                            <input type="checkbox" name="selectedNaborrel" checked={selectedNaborrel} onChange={(e) => handleDataChangeAndResetPromo(setSelectedNaborrel, e.target.checked)} className="form-checkbox h-4 w-4 text-indigo-600"/>
                            <span className="text-xs">AfterParty (€{specialAddons.find(sa => sa.id === 'naborrel')?.price.toFixed(2)} p.p.)</span>
                        </label>
                     )}
                </div>
            </div>
            <div>
                <h4 className="text-sm font-medium text-slate-700 mb-1">Merchandise</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {Object.entries(groupedMerchandise).map(([category, items]) => (
                    <div key={category} className="mb-1">
                        <h5 className="text-xs font-semibold text-indigo-500 mb-0.5 sticky top-0 bg-slate-50 py-0.5">{category}</h5>
                        {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-1.5 border border-slate-200 rounded text-xs bg-white">
                            <div className="flex items-center flex-grow mr-2">
                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-6 h-6 object-cover rounded mr-1.5 flex-shrink-0"/>}
                                <span className="truncate" title={item.name}>{item.name} (€{item.priceInclVAT.toFixed(2)})</span>
                            </div>
                            <input type="number" min="0" aria-label={`Aantal ${item.name}`} className="w-12 border-slate-300 rounded shadow-sm p-1 text-[10px]"
                            value={orderedMerch.find(oi => oi.itemId === item.id)?.quantity || 0}
                            onChange={(e) => handleMerchQuantityChange(item.id, parseInt(e.target.value) || 0)}/>
                        </div>
                        ))}
                    </div>
                ))}
                </div>
            </div>
        </div>

        <fieldset className="border border-slate-300 p-4 rounded-lg shadow-sm">
            <legend className="text-md font-semibold text-indigo-600 px-2">Admin Instellingen</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="placementPreferenceDetails" className="block text-sm font-medium text-slate-700 mb-1">Plaats Voorkeur (Details)</label>
                    <textarea id="placementPreferenceDetails" name="placementPreferenceDetails" value={placementPreferenceDetails} onChange={(e) => setPlacementPreferenceDetails(e.target.value)} rows={2} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                </div>
                <div>
                    <label htmlFor="internalAdminNotes" className="block text-sm font-medium text-slate-700 mb-1">Interne Notities</label>
                    <textarea id="internalAdminNotes" name="internalAdminNotes" value={internalAdminNotes} onChange={(e) => setInternalAdminNotes(e.target.value)} rows={2} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                </div>
            </div>
            <div className="mt-3 space-x-4">
                 <label className="inline-flex items-center space-x-2"> <input type="checkbox" name="isPaid" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-400 focus:ring-indigo-500"/> <span className="text-sm text-slate-700">Betaald</span> </label>
                 <label className="inline-flex items-center space-x-2"> <input type="checkbox" name="isMPL" checked={isMPL} onChange={(e) => setIsMPL(e.target.checked)} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-400 focus:ring-indigo-500"/> <span className="text-sm text-slate-700">MPL</span> </label>
                 <label className="inline-flex items-center space-x-2"> <input type="checkbox" name="acceptsMarketingEmails" checked={acceptsMarketingEmails} onChange={(e) => setAcceptsMarketingEmails(e.target.checked)} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-400 focus:ring-indigo-500"/> <span className="text-sm text-slate-700">Klant wil marketing emails</span> </label>
            </div>
        </fieldset>

        <div className="pt-3 border-t border-slate-200">
            <label htmlFor="manualPromoCodeInput" className="block text-sm font-medium text-slate-700 mb-1">Kortingscode / Cadeaubon</label>
            <div className="flex items-center space-x-2">
                <input type="text" id="manualPromoCodeInput" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} placeholder="Voer code in" className="flex-grow p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                <button type="button" onClick={handleApplyPromoCodeButton} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors shadow-sm">Toepassen</button>
            </div>
            {promoCodeMessage && <p className={`text-xs mt-1 p-1.5 rounded ${promoCodeMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{promoCodeMessage.text}</p>}
        </div>

        <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-600">Subtotaal (voor evt. korting): €{calculateSubtotal().toFixed(2)}</p>
            {appliedPromoCodeString && appliedDiscountAmount !== undefined && (
                <p className="text-sm text-green-600">Toegepaste Korting ({appliedPromoCodeString}): -€{appliedDiscountAmount.toFixed(2)}</p>
             )}
            <p className="text-xl font-semibold text-indigo-700 mt-1">Totaal: €{calculateTotalPrice()}</p>
            <button type="submit" className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all text-md">
                Boeking Toevoegen
            </button>
        </div>
      </form>
    </div>
  );
};