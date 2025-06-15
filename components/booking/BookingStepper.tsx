import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShowSlot, PackageOption, MerchandiseItem, OrderedMerchandiseItem, BookingData, ReservationDetails, Address, InvoiceDetails, ReservationStatus, SpecialAddOn, PromoCode, Customer, AppSettings } from '../../types';
import { CalendarView } from '../CalendarView';

const CloseIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-500 hover:text-slate-700">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface BookingStepperProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: Omit<ReservationDetails, 'reservationId' | 'bookingTimestamp' | 'date' | 'time' | 'packageName'>) => Promise<{ success: boolean; status: ReservationStatus }>;
  showPackages: PackageOption[];
  specialAddons: SpecialAddOn[];
  availableShowSlots: ShowSlot[];
  merchandiseItems: MerchandiseItem[];
  appSettings: AppSettings;
  initialData?: Partial<BookingData>;
  onOpenWaitingListModal: (slotId: string) => void; // Ensure this is correctly passed and used
  applyPromoCode: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode };
  loggedInCustomer: Customer | null;
  onLogout?: () => void;
  showInfoModal: (title: string, message: React.ReactNode, status?: 'success' | 'error' | 'info' | 'warning') => void;
}

const STEPS = [
  { id: 1, title: 'Datum & Tijd', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>) },
  { id: 2, title: 'Arrangement', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a25.628 25.628 0 011.17 5.228m-6.75 3a6.726 6.726 0 01-2.748 1.35m0 0V3.375c0-.621.504-1.125 1.125-1.125h.872M10.5 9.728V4.5a2.25 2.25 0 114.5 0v5.228M10.5 9.728a25.628 25.628 0 01-1.17 5.228" /></svg>) },
  { id: 3, title: 'Extra opties', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>) },
  { id: 4, title: 'Merchandise', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>) },
  { id: 5, title: 'Persoonlijke gegevens', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>) },
  { id: 6, title: 'Overzicht & Bevestiging', icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
];

export const BookingStepper: React.FC<BookingStepperProps> = ({
  isOpen,
  onClose,
  onSubmit,
  showPackages,
  specialAddons,
  availableShowSlots,
  merchandiseItems,
  appSettings,
  initialData,
  onOpenWaitingListModal,
  applyPromoCode,
  loggedInCustomer,
  showInfoModal,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedShowSlotId, setSelectedShowSlotId] = useState<string | undefined>(initialData?.selectedShowSlotId);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(initialData?.selectedPackageId);
  const [guests, setGuests] = useState(initialData?.guests || 1);
  const [name, setName] = useState(loggedInCustomer?.name || initialData?.name || '');
  const [email, setEmail] = useState(loggedInCustomer?.email || initialData?.email || '');
  const [phone, setPhone] = useState(loggedInCustomer?.phone || initialData?.phone || '');
  const [address, setAddress] = useState<Address>(loggedInCustomer?.address || initialData?.address || { street: '', houseNumber: '', postalCode: '', city: '' });
  const [merchandise, setMerchandise] = useState<OrderedMerchandiseItem[]>(initialData?.merchandise || []);
  const [selectedVoorborrel, setSelectedVoorborrel] = useState(initialData?.selectedVoorborrel || false);
  const [selectedNaborrel, setSelectedNaborrel] = useState(initialData?.selectedNaborrel || false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(initialData?.calendarSelectedDate || new Date().toISOString().split('T')[0]);
  const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(initialData?.agreedToPrivacyPolicy || false);
  const [acceptsMarketingEmails, setAcceptsMarketingEmails] = useState(initialData?.acceptsMarketingEmails || false);
  const [celebrationDetails, setCelebrationDetails] = useState(initialData?.celebrationDetails || '');
  const [dietaryWishes, setDietaryWishes] = useState(initialData?.dietaryWishes || '');
  const [placementPreferenceDetails, setPlacementPreferenceDetails] = useState(''); // Not in initialData typically
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(initialData?.invoiceDetails || {
    generateInvoice: false,
    sendInvoice: false,
    companyName: '',
    vatNumber: '',
    address: undefined,
    remarks: ''
  });
  const [showDifferentInvoiceAddress, setShowDifferentInvoiceAddress] = useState(false);
  const [invoiceAddress, setInvoiceAddress] = useState<Address>({ street: '', houseNumber: '', postalCode: '', city: '' });

  const [promoCodeInput, setPromoCodeInput] = useState(initialData?.promoCodeInput || '');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>(initialData?.appliedPromoCode);
  const [discountAmount, setDiscountAmount] = useState(initialData?.discountAmount || 0);
  const [isApplyingPromoCode, setIsApplyingPromoCode] = useState(false);
  const [currentTotalPrice, setCurrentTotalPrice] = useState(0);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStepValid, setIsStepValid] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const selectedShowSlot = availableShowSlots.find(s => s.id === selectedShowSlotId);
  const selectedPackage = showPackages.find(p => p.id === selectedPackageId);
  const isShowFull = selectedShowSlot ? (selectedShowSlot.bookedCount >= selectedShowSlot.capacity || selectedShowSlot.availableSlots <= 0) : false;

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setSelectedShowSlotId(initialData?.selectedShowSlotId);
    setSelectedPackageId(initialData?.selectedPackageId);
    setGuests(initialData?.guests || 1);
    setName(loggedInCustomer?.name || initialData?.name || '');
    setEmail(loggedInCustomer?.email || initialData?.email || '');
    setPhone(loggedInCustomer?.phone || initialData?.phone || '');
    setAddress(loggedInCustomer?.address || initialData?.address || { street: '', houseNumber: '', postalCode: '', city: '' });
    setMerchandise(initialData?.merchandise || []);
    setSelectedVoorborrel(initialData?.selectedVoorborrel || false);
    setSelectedNaborrel(initialData?.selectedNaborrel || false);
    setAgreedToPrivacyPolicy(initialData?.agreedToPrivacyPolicy || false);
    setAcceptsMarketingEmails(initialData?.acceptsMarketingEmails || false);
    setCelebrationDetails(initialData?.celebrationDetails || '');
    setDietaryWishes(initialData?.dietaryWishes || '');
    setPlacementPreferenceDetails('');
    setInvoiceDetails(initialData?.invoiceDetails || {
      generateInvoice: false,
      sendInvoice: false,
      companyName: '',
      vatNumber: '',
      address: undefined,
      remarks: ''
    });
    setShowDifferentInvoiceAddress(false);
    setInvoiceAddress({ street: '', houseNumber: '', postalCode: '', city: '' });
    setPromoCodeInput(initialData?.promoCodeInput || '');
    setAppliedPromoCode(initialData?.appliedPromoCode);
    setDiscountAmount(initialData?.discountAmount || 0);
    setIsApplyingPromoCode(false);
    setErrors({});
    if (initialData?.selectedShowSlotId) {
      const slot = availableShowSlots.find(s => s.id === initialData.selectedShowSlotId);
      if (slot) setCalendarSelectedDate(slot.date);
    } else {
      setCalendarSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, availableShowSlots, loggedInCustomer]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Populate fields when loggedInCustomer changes
  useEffect(() => {
    if (loggedInCustomer) {
      setName(loggedInCustomer.name || '');
      setEmail(loggedInCustomer.email || '');
      setPhone(loggedInCustomer.phone || '');
      setAddress(loggedInCustomer.address || { street: '', houseNumber: '', postalCode: '', city: '' });
    }
  }, [loggedInCustomer]);

  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    switch (currentStep) {
      case 1: // Datum & Tijd
        if (!selectedShowSlotId) {
          newErrors.showSlotId = 'Selecteer een beschikbare showtijd.';
          isValid = false;
        }
        break;
      case 2: // Arrangement
        if (!selectedPackageId) {
          newErrors.packageId = 'Selecteer een arrangement.';
          isValid = false;
        }
        if (selectedPackage?.minPersons && guests < selectedPackage.minPersons) {
          newErrors.guests = `Dit arrangement vereist minimaal ${selectedPackage.minPersons} gasten.`;
          isValid = false;
        }
        break;
      case 3: // Extra opties
        const voorborrelAddon = specialAddons.find(a => a.id === 'voorborrel');
        if (selectedVoorborrel && voorborrelAddon?.minPersons && guests < voorborrelAddon.minPersons) {
          newErrors.voorborrel = `Borrel vooraf vereist minimaal ${voorborrelAddon.minPersons} gasten.`;
          // This might not make the step invalid if it's just a warning or handled by disabling checkbox
        }
        if (invoiceDetails.generateInvoice) {
          if (!invoiceDetails.companyName?.trim()) {
            newErrors.companyName = 'Bedrijfsnaam is verplicht voor factuur.';
            isValid = false;
          }
          if (showDifferentInvoiceAddress) {
            if (!invoiceAddress.street.trim()) { newErrors.invoiceStreet = 'Straat (factuur) is verplicht.'; isValid = false; }
            if (!invoiceAddress.houseNumber.trim()) { newErrors.invoiceHouseNumber = 'Huisnummer (factuur) is verplicht.'; isValid = false; }
            if (!invoiceAddress.postalCode.trim()) { newErrors.invoicePostalCode = 'Postcode (factuur) is verplicht.'; isValid = false; }
            if (!invoiceAddress.city.trim()) { newErrors.invoiceCity = 'Plaats (factuur) is verplicht.'; isValid = false; }
          }
        }
        break;
      case 4: // Merchandise - Usually no strict validation to proceed
        break;
      case 5: // Persoonlijke gegevens
        if (!name.trim()) { newErrors.name = 'Naam is verplicht.'; isValid = false; }
        if (!email.trim()) { newErrors.email = 'E-mail is verplicht.'; isValid = false; }
        else if (!/\S+@\S+\.\S+/.test(email)) { newErrors.email = 'Voer een geldig e-mailadres in.'; isValid = false; }
        if (!phone.trim()) { newErrors.phone = 'Telefoonnummer is verplicht.'; isValid = false; }
        if (guests < 1) { newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.'; isValid = false; }
        
        // Main address validation
        if (!address.street.trim()) { newErrors.street = 'Straat is verplicht.'; isValid = false; }
        if (!address.houseNumber.trim()) { newErrors.houseNumber = 'Huisnummer is verplicht.'; isValid = false; }
        if (!address.postalCode.trim()) { newErrors.postalCode = 'Postcode is verplicht.'; isValid = false; }
        if (!address.city.trim()) { newErrors.city = 'Plaats is verplicht.'; isValid = false; }

        if (!agreedToPrivacyPolicy) {
          newErrors.agreedToPrivacyPolicy = 'U dient akkoord te gaan met het privacybeleid.';
          isValid = false;
        }
        break;
      case 6: // Overzicht & Bevestiging - All previous steps should be valid
        // This step itself doesn't add new inputs, so it's valid if previous ones are.
        // However, a final check can be reiterated here if needed.
        if (!selectedShowSlotId || !selectedPackageId || !name.trim() || !email.trim() || !phone.trim() || !agreedToPrivacyPolicy) {
          newErrors.final = 'Controleer of alle verplichte velden in eerdere stappen correct zijn ingevuld.';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    setIsStepValid(isValid);
    return isValid;
  }, [currentStep, selectedShowSlotId, selectedPackageId, guests, name, email, phone, address, agreedToPrivacyPolicy, invoiceDetails, showDifferentInvoiceAddress, invoiceAddress, selectedPackage, specialAddons]);

  // Validate step whenever relevant state changes
  useEffect(() => {
    validateStep();
  }, [validateStep, currentStep, selectedShowSlotId, selectedPackageId, guests, name, email, phone, address, agreedToPrivacyPolicy, invoiceDetails, showDifferentInvoiceAddress, invoiceAddress]);

  const calculateCurrentTotalPrice = useCallback(() => {
    const packagePrice = selectedPackage?.price ? selectedPackage.price * guests : 0;
    let addOnPrice = 0;
    if (selectedVoorborrel) {
      const voorborrelAddon = specialAddons.find(a => a.id === 'voorborrel');
      addOnPrice += (voorborrelAddon?.price || 0) * guests;
    }
    if (selectedNaborrel) {
      const naborrelAddon = specialAddons.find(a => a.id === 'naborrel');
      addOnPrice += (naborrelAddon?.price || 0) * guests;
    }
    const merchandisePrice = merchandise.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
    const subtotal = packagePrice + addOnPrice + merchandisePrice;
    return Math.max(0, subtotal - discountAmount);
  }, [selectedPackage, guests, selectedVoorborrel, selectedNaborrel, merchandise, discountAmount, specialAddons]);

  useEffect(() => {
    setCurrentTotalPrice(calculateCurrentTotalPrice());
  }, [calculateCurrentTotalPrice]);

  const nextStep = () => {
    if (validateStep()) { // Re-validate before proceeding
      if (currentStep === 1 && isShowFull && selectedShowSlotId) { // Check for full show at step 1
        // Option to join waiting list if show is full, handled by button change below
        return; 
      }
      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation across all critical fields before submission
    const finalValidationErrors: Record<string, string> = {};
    if (!selectedShowSlotId) finalValidationErrors.showSlotId = 'Show selectie is verplicht.';
    if (!selectedPackageId) finalValidationErrors.packageId = 'Arrangement selectie is verplicht.';
    if (!name.trim()) finalValidationErrors.name = 'Naam is verplicht.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) finalValidationErrors.email = 'Geldig e-mailadres is verplicht.';
    if (!phone.trim()) finalValidationErrors.phone = 'Telefoonnummer is verplicht.';
    if (!address.street.trim() || !address.houseNumber.trim() || !address.postalCode.trim() || !address.city.trim()) finalValidationErrors.address = 'Volledig adres is verplicht.';
    if (!agreedToPrivacyPolicy) finalValidationErrors.agreedToPrivacyPolicy = 'Akkoord met privacybeleid is vereist.';
    if (invoiceDetails.generateInvoice) {
        if (!invoiceDetails.companyName?.trim()) finalValidationErrors.companyName = 'Bedrijfsnaam is verplicht voor factuur.';
        if (showDifferentInvoiceAddress) {
            if (!invoiceAddress.street.trim() || !invoiceAddress.houseNumber.trim() || !invoiceAddress.postalCode.trim() || !invoiceAddress.city.trim()) finalValidationErrors.invoiceAddress = 'Volledig factuuradres is verplicht.';
        }
    }

    if (Object.keys(finalValidationErrors).length > 0) {
        setErrors(finalValidationErrors);
        // Optionally, navigate to the first step with an error or show a general message
        showInfoModal('Validatiefout', 'Controleer alstublieft alle gemarkeerde velden.', 'error');
        // Attempt to navigate to the step with the first error
        if (finalValidationErrors.showSlotId || finalValidationErrors.packageId) setCurrentStep(1);
        else if (finalValidationErrors.companyName || finalValidationErrors.invoiceAddress) setCurrentStep(3);
        else if (finalValidationErrors.name || finalValidationErrors.email || finalValidationErrors.phone || finalValidationErrors.address || finalValidationErrors.agreedToPrivacyPolicy) setCurrentStep(5);
        return;
    }

    const finalTotalPrice = calculateCurrentTotalPrice();
    const finalInvoiceDetails = {
      ...invoiceDetails,
      address: showDifferentInvoiceAddress ? invoiceAddress : address, // Use main address if not different invoice address
    };

    try {
      const result = await onSubmit({
        showSlotId: selectedShowSlotId!,
        packageId: selectedPackageId!,
        guests,
        name,
        email,
        phone,
        address, // This is the primary address for the customer
        merchandise,
        selectedVoorborrel,
        selectedNaborrel,
        ...(celebrationDetails && { celebrationDetails }),
        ...(dietaryWishes && { dietaryWishes }),
        ...(placementPreferenceDetails && { placementPreferenceDetails }),
        totalPrice: finalTotalPrice,
        customerId: loggedInCustomer?.id,
        agreedToPrivacyPolicy,
        acceptsMarketingEmails,
        invoiceDetails: finalInvoiceDetails, // This contains the correct invoice address
        discountAmount,
        ...(appliedPromoCode && { appliedPromoCode }),
        status: 'pending' as ReservationStatus 
      });

      if (result.success) {
        onClose(); 
      } else {
        showInfoModal('Fout bij boeking', 'Er ging iets mis bij het verwerken van de boeking. Probeer het later opnieuw.', 'error');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      showInfoModal('Onverwachte Fout', `Er is een onverwachte fout opgetreden: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const handleDateSelect = (dateString: string) => {
    setCalendarSelectedDate(dateString);
    setSelectedShowSlotId(undefined); // Reset dependent selections
    setSelectedPackageId(undefined);
    setErrors({}); // Clear previous errors
    // Auto-select if only one slot
    const slotsOnSelectedDate = availableShowSlots.filter(slot => slot.date === dateString);
    if (slotsOnSelectedDate.length === 1) {
      const singleSlot = slotsOnSelectedDate[0];
      const isBookable = !(singleSlot.bookedCount >= singleSlot.capacity || singleSlot.isManuallyClosed);
      if (isBookable) {
        setSelectedShowSlotId(singleSlot.id);
      }
    }
    // validateStep(); // Will be called by useEffect
  };

  const handleTimeSelect = (slotId: string) => {
    setSelectedShowSlotId(slotId);
    setSelectedPackageId(undefined); // Reset package if time changes
    setErrors({});
    // validateStep();
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    setErrors({});
    // validateStep();
  };

  const handleMerchandiseQuantityChange = (itemId: string, quantity: number) => {
    const item = merchandiseItems.find(m => m.id === itemId);
    if (!item) return;

    setMerchandise(prev => {
      const existingIndex = prev.findIndex(m => m.itemId === itemId);
      if (quantity <= 0) {
        if (existingIndex > -1) return prev.filter(m => m.itemId !== itemId);
        return prev;
      }
      if (existingIndex > -1) {
        return prev.map(m => m.itemId === itemId ? { ...m, quantity } : m);
      }
      return [...prev, { itemId, itemName: item.name, itemPrice: item.priceInclVAT, quantity }];
    });
    // Price recalculation will happen via useEffect on `merchandise`
  };
  
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim() || appliedPromoCode) return;

    setIsApplyingPromoCode(true);
    try {
      // Recalculate subtotal without existing discount for promo code application
      const packagePrice = selectedPackage?.price ? selectedPackage.price * guests : 0;
      let addOnPrice = 0;
      if (selectedVoorborrel) {
        const voorborrelAddon = specialAddons.find(a => a.id === 'voorborrel');
        addOnPrice += (voorborrelAddon?.price || 0) * guests;
      }
      if (selectedNaborrel) {
        const naborrelAddon = specialAddons.find(a => a.id === 'naborrel');
        addOnPrice += (naborrelAddon?.price || 0) * guests;
      }
      const merchandisePrice = merchandise.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
      const currentSubtotalForPromo = packagePrice + addOnPrice + merchandisePrice;

      const result = applyPromoCode(promoCodeInput.trim(), currentSubtotalForPromo);
      
      if (result.success && result.discountAmount && result.appliedCodeObject) {
        setAppliedPromoCode(result.appliedCodeObject.code);
        setDiscountAmount(result.discountAmount);
        showInfoModal('Promocode Toegepast', result.message, 'success');
      } else {
        setAppliedPromoCode(undefined); // Clear if previously applied but now invalid
        setDiscountAmount(0);
        showInfoModal('Promocode Fout', result.message, 'error');
      }
    } catch (error) {
      setAppliedPromoCode(undefined);
      setDiscountAmount(0);
      showInfoModal('Fout', 'Er is een fout opgetreden bij het toepassen van de promocode.', 'error');
    } finally {
      setIsApplyingPromoCode(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Header */}
        <div className="bg-indigo-600 text-white p-5 relative rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-indigo-200 hover:text-white transition-colors"
            aria-label="Sluit modal"
          >
            <CloseIconSvg />
          </button>
          <h2 id="booking-modal-title" className="text-xl lg:text-2xl font-semibold mb-3">
            Maak uw reservering
          </h2>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center min-w-max">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  currentStep === step.id ? 'bg-white text-indigo-600 ring-2 ring-offset-2 ring-offset-indigo-600 ring-white' : currentStep > step.id ? 'bg-green-400 text-white' : 'bg-indigo-500 text-indigo-200'
                }`}>
                  {currentStep > step.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  ) : step.icon}
                </div>
                <span className={`ml-1.5 sm:ml-2 text-xs sm:text-sm transition-colors duration-300 ${currentStep >= step.id ? 'text-white font-medium' : 'text-indigo-200'}`}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`flex-auto h-0.5 mx-2 sm:mx-3 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-green-400' : 'bg-indigo-500'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content & Summary Split */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Panel - Form */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[calc(95vh-220px)] md:max-h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Step 1: Date & Time */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Selecteer Datum & Tijd</h3>
                <CalendarView
                  showSlots={availableShowSlots}
                  onDateSelect={handleDateSelect}
                  selectedDate={calendarSelectedDate}
                />
                
                {calendarSelectedDate && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 text-gray-700">Beschikbare tijden voor {new Date(calendarSelectedDate + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:</h4>
                    {availableShowSlots.filter(slot => slot.date === calendarSelectedDate).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableShowSlots
                            .filter(slot => slot.date === calendarSelectedDate)
                            .sort((a,b) => a.time.localeCompare(b.time)) // Sort by time
                            .map(slot => {
                            const isBookable = !(slot.bookedCount >= slot.capacity || slot.isManuallyClosed);
                            const availableSpots = slot.capacity - slot.bookedCount;
                            
                            return (
                                <div key={slot.id} className="flex items-stretch">
                                <button
                                    onClick={() => handleTimeSelect(slot.id)}
                                    disabled={!isBookable}
                                    className={`flex-1 p-3.5 text-left border rounded-lg transition-all duration-150 ease-in-out focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${
                                    selectedShowSlotId === slot.id 
                                        ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-500' 
                                        : isBookable 
                                        ? 'border-gray-300 hover:border-indigo-400 hover:shadow-sm'
                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                    <span className={`font-semibold text-base ${!isBookable ? 'text-gray-400' : 'text-indigo-700'}`}>
                                        {slot.time}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${!isBookable ? 'text-gray-400 bg-gray-200' : 'text-green-700 bg-green-100'}`}>
                                        {isBookable ? `${availableSpots} vrij` : 'Vol'}
                                    </span>
                                    </div>
                                    {slot.name && <p className="text-xs text-gray-500 mt-1">{slot.name}</p>}
                                </button>
                                {!isBookable && (
                                    <button
                                    onClick={() => onOpenWaitingListModal(slot.id)}
                                    className="ml-2 px-3 py-2 bg-amber-500 text-white text-xs font-medium rounded-md hover:bg-amber-600 transition-colors whitespace-nowrap self-center"
                                    >
                                    Wachtlijst
                                    </button>
                                )}
                                </div>
                            );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 mt-3">Geen shows beschikbaar op deze datum.</p>
                    )}
                  </div>
                )}
                {errors.showSlotId && (
                  <p className="text-red-600 text-sm mt-2">{errors.showSlotId}</p>
                )}
              </div>
            )}

            {/* Step 2: Package Selection */}
            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Kies uw Arrangement</h3>
                {selectedShowSlot && (
                  <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Gekozen show: <strong className="font-semibold">{selectedShowSlot.date} om {selectedShowSlot.time}</strong>
                      {selectedShowSlot.name && <span className="italic"> ({selectedShowSlot.name})</span>}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {showPackages
                    .filter(pkg => !selectedShowSlot || (selectedShowSlot.availablePackageIds && selectedShowSlot.availablePackageIds.includes(pkg.id)))
                    .map(pkg => (
                    <div 
                      key={pkg.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-indigo-500 ${
                        selectedPackageId === pkg.id ? 'border-indigo-600 bg-indigo-50 shadow-lg ring-2 ring-indigo-500' : 'border-gray-300 hover:border-indigo-400'
                      } ${pkg.colorCode ? `${pkg.colorCode} text-white` : 'bg-white'}`}
                      onClick={() => handlePackageSelect(pkg.id)}
                      tabIndex={0} // Make it focusable
                      onKeyPress={(e) => e.key === 'Enter' && handlePackageSelect(pkg.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className={`font-semibold text-lg ${pkg.colorCode ? 'text-white' : 'text-gray-800'}`}>
                            {pkg.name}
                          </h4>
                          <p className={`text-sm mt-1 ${pkg.colorCode ? 'text-indigo-100' : 'text-gray-600'}`}>
                            {pkg.description}
                          </p>
                          {pkg.days && (
                            <p className={`text-xs mt-1 ${pkg.colorCode ? 'text-indigo-200' : 'text-gray-500'}`}>
                              {pkg.days}
                            </p>
                          )}
                          {pkg.details && pkg.details.length > 0 && (
                            <div className="mt-2.5">
                              <p className={`text-xs font-medium ${pkg.colorCode ? 'text-indigo-100' : 'text-gray-600'}`}>
                                Inclusief:
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {pkg.details.map(detail => (
                                  <span 
                                    key={detail} 
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      pkg.colorCode 
                                        ? 'bg-white bg-opacity-20 text-white' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {detail}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {pkg.minPersons && (
                            <p className={`text-xs mt-2 ${pkg.colorCode ? 'text-yellow-300' : 'text-orange-600 font-medium'}`}>
                              Minimaal {pkg.minPersons} personen
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className={`text-xl font-bold ${pkg.colorCode ? 'text-white' : 'text-indigo-600'}`}>
                            {appSettings.currencySymbol}{pkg.price !== undefined ? pkg.price.toFixed(2) : 'N/A'}
                          </p>
                          <p className={`text-xs ${pkg.colorCode ? 'text-indigo-200' : 'text-gray-500'}`}>
                            per persoon
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.packageId && (
                  <p className="text-red-600 text-sm mt-2">{errors.packageId}</p>
                )}
                {errors.guests && (
                  <p className="text-red-600 text-sm mt-2">{errors.guests}</p>
                )}
              </div>
            )}

            {/* Step 3: Extra Options */}
            {currentStep === 3 && (
              <div>
                <h3 className="text-xl font-semibold mb-5 text-gray-800">Extra Opties & Korting</h3>
                
                <div className="space-y-5 mb-6">
                  <h4 className="font-medium text-lg text-gray-700">Arrangement Toevoegingen</h4>
                  {specialAddons.map(addon => {
                    const isDisabled = addon.minPersons ? guests < addon.minPersons : false;
                    return (
                        <div key={addon.id} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isDisabled ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
                        <div className="flex-1">
                            <h5 className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-800'}`}>{addon.name}</h5>
                            <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>{addon.description}</p>
                            <p className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{addon.timing}</p>
                            {addon.minPersons && (
                            <p className={`text-xs ${isDisabled ? 'text-orange-400' : 'text-orange-600'} mt-1`}>
                                Minimaal {addon.minPersons} personen (huidig: {guests})
                            </p>
                            )}
                        </div>
                        <div className="flex items-center ml-4">
                            <span className={`mr-4 font-medium ${isDisabled ? 'text-gray-500' : 'text-indigo-600'}`}>{appSettings.currencySymbol}{addon.price.toFixed(2)} p.p.</span>
                            <input
                            type="checkbox"
                            checked={addon.id === 'voorborrel' ? selectedVoorborrel : selectedNaborrel}
                            onChange={(e) => {
                                if (addon.id === 'voorborrel') setSelectedVoorborrel(e.target.checked);
                                else setSelectedNaborrel(e.target.checked);
                            }}
                            disabled={isDisabled}
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                            />
                        </div>
                        </div>
                    );
                  })}
                  {errors.voorborrel && (
                    <p className="text-red-600 text-sm">{errors.voorborrel}</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h4 className="font-medium text-lg mb-3 text-gray-700">Factuurgegevens (Optioneel)</h4>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="generate-invoice-checkbox"
                      checked={invoiceDetails.generateInvoice}
                      onChange={(e) => setInvoiceDetails(prev => ({ ...prev, generateInvoice: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2 cursor-pointer"
                    />
                    <label htmlFor="generate-invoice-checkbox" className="text-sm text-gray-700 cursor-pointer">
                      Ik wil graag een factuur ontvangen voor deze boeking.
                    </label>
                  </div>

                  {invoiceDetails.generateInvoice && (
                    <div className="space-y-3 pl-5 border-l-2 border-indigo-200 ml-1 py-3 bg-gray-50 p-4 rounded-md">
                      <div>
                        <label htmlFor="companyNameInput" className="block text-xs font-medium text-gray-600 mb-0.5">Bedrijfsnaam *</label>
                        <input
                          id="companyNameInput"
                          type="text"
                          value={invoiceDetails.companyName}
                          onChange={(e) => setInvoiceDetails(prev => ({ ...prev, companyName: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                      </div>
                      <div>
                        <label htmlFor="vatNumberInput" className="block text-xs font-medium text-gray-600 mb-0.5">BTW-nummer (optioneel)</label>
                        <input
                          id="vatNumberInput"
                          type="text"
                          value={invoiceDetails.vatNumber}
                          onChange={(e) => setInvoiceDetails(prev => ({ ...prev, vatNumber: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                      {/* Checkbox for different invoice address */}
                      <div className="flex items-center mt-3 mb-2">
                        <input
                          type="checkbox"
                          id="show-different-invoice-address"
                          checked={showDifferentInvoiceAddress}
                          onChange={(e) => setShowDifferentInvoiceAddress(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2 cursor-pointer"
                        />
                        <label htmlFor="show-different-invoice-address" className="text-sm text-gray-700 cursor-pointer">
                          Factuuradres is anders dan het hoofdadres
                        </label>
                      </div>
                      {showDifferentInvoiceAddress && (
                        <div className="space-y-3 pl-5 border-l-2 border-amber-300 ml-1 py-3 bg-amber-50 p-3 rounded-md">
                          <p className="text-xs text-amber-700 font-medium mb-2">Afwijkend Factuuradres:</p>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Straat & Huisnummer *</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Straatnaam" value={invoiceAddress.street} onChange={(e) => setInvoiceAddress(prev => ({ ...prev, street: e.target.value }))} className="w-2/3 px-3 py-1.5 text-sm border-gray-300 rounded-md" />
                                <input type="text" placeholder="Nr." value={invoiceAddress.houseNumber} onChange={(e) => setInvoiceAddress(prev => ({ ...prev, houseNumber: e.target.value }))} className="w-1/3 px-3 py-1.5 text-sm border-gray-300 rounded-md" />
                            </div>
                            {errors.invoiceStreet && <p className="text-red-500 text-xs mt-1">{errors.invoiceStreet}</p>}
                            {errors.invoiceHouseNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceHouseNumber}</p>}
                          </div>
                           <div>
                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Postcode & Plaats *</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Postcode" value={invoiceAddress.postalCode} onChange={(e) => setInvoiceAddress(prev => ({ ...prev, postalCode: e.target.value }))} className="w-1/3 px-3 py-1.5 text-sm border-gray-300 rounded-md" />
                                <input type="text" placeholder="Plaats" value={invoiceAddress.city} onChange={(e) => setInvoiceAddress(prev => ({ ...prev, city: e.target.value }))} className="w-2/3 px-3 py-1.5 text-sm border-gray-300 rounded-md" />
                            </div>
                            {errors.invoicePostalCode && <p className="text-red-500 text-xs mt-1">{errors.invoicePostalCode}</p>}
                            {errors.invoiceCity && <p className="text-red-500 text-xs mt-1">{errors.invoiceCity}</p>}
                          </div>
                        </div>
                      )}
                      <div>
                        <label htmlFor="invoiceRemarksInput" className="block text-xs font-medium text-gray-600 mb-0.5">Extra opmerkingen voor factuur (optioneel)</label>
                        <textarea
                          id="invoiceRemarksInput"
                          value={invoiceDetails.remarks}
                          onChange={(e) => setInvoiceDetails(prev => ({ ...prev, remarks: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-lg mb-3 text-gray-700">Promocode</h4>
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Voer uw promocode in"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
                      disabled={!!appliedPromoCode || isApplyingPromoCode}
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      disabled={!promoCodeInput.trim() || isApplyingPromoCode || !!appliedPromoCode}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {isApplyingPromoCode ? 'Checken...' : (appliedPromoCode ? 'Toegepast' : 'Toepassen')}
                    </button>
                  </div>
                  {appliedPromoCode && (
                    <p className="text-green-600 text-sm mt-2">
                      Code "<span className="font-semibold">{appliedPromoCode}</span>" toegepast! Korting: {appSettings.currencySymbol}{discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Merchandise */}
            {currentStep === 4 && (
              <div>
                <h3 className="text-xl font-semibold mb-5 text-gray-800">Merchandise (Optioneel)</h3>
                {merchandiseItems.length > 0 ? (
                    <div className="space-y-6">
                    {Object.entries(
                        merchandiseItems.reduce((acc, item) => {
                        const category = item.category || 'Overig';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(item);
                        return acc;
                        }, {} as Record<string, MerchandiseItem[]>)
                    ).map(([category, items]) => (
                        <div key={category}>
                        <h4 className="font-medium text-base mb-3 text-indigo-600 border-b border-indigo-200 pb-1.5">{category}</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {items.map(item => (
                            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                                {item.imageUrl && (
                                    <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                                <div className="flex-1">
                                    <h5 className="font-medium text-gray-800">{item.name}</h5>
                                    <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                    <p className="text-sm font-semibold text-indigo-600 mt-0.5">{appSettings.currencySymbol}{item.priceInclVAT.toFixed(2)}</p>
                                </div>
                                </div>
                                <div className="flex items-center self-end sm:self-center">
                                <label htmlFor={`merch-${item.id}`} className="mr-2 text-xs text-gray-600">Aantal:</label>
                                <input
                                    id={`merch-${item.id}`}
                                    type="number"
                                    min="0"
                                    max="20" // Sensible max
                                    value={merchandise.find(m => m.itemId === item.id)?.quantity || 0}
                                    onChange={(e) => handleMerchandiseQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-10">
                        Momenteel is er geen merchandise beschikbaar.
                    </p>
                )}
              </div>
            )}

            {/* Step 5: Personal Information */}
            {currentStep === 5 && (
              <div>
                <h3 className="text-xl font-semibold mb-5 text-gray-800">Uw Gegevens</h3>
                
                <div className="bg-blue-50 p-4 rounded-md mb-5 border border-blue-200">
                    <p className="text-sm text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        Deze gegevens worden gebruikt voor uw reservering en eventuele communicatie hierover.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label htmlFor="nameInput" className="block text-sm font-medium text-gray-700 mb-1">Volledige Naam *</label>
                    <input id="nameInput" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="emailInput" className="block text-sm font-medium text-gray-700 mb-1">E-mailadres *</label>
                    <input id="emailInput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phoneInput" className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer *</label>
                    <input id="phoneInput" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.phone ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="guestsInput" className="block text-sm font-medium text-gray-700 mb-1">Aantal gasten *</label>
                    <input id="guestsInput" type="number" min="1" max={selectedShowSlot ? selectedShowSlot.capacity - selectedShowSlot.bookedCount : 100} value={guests} onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.guests ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                    {errors.guests && <p className="text-red-500 text-xs mt-1">{errors.guests}</p>}
                  </div>
                  
                  <div className="md:col-span-2 mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Adresgegevens *</p>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="streetInput" className="block text-xs font-medium text-gray-600 mb-0.5">Straat *</label>
                        <input id="streetInput" type="text" value={address.street} onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.street ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                        {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                    </div>
                    <div>
                        <label htmlFor="houseNumberInput" className="block text-xs font-medium text-gray-600 mb-0.5">Huisnummer *</label>
                        <input id="houseNumberInput" type="text" value={address.houseNumber} onChange={(e) => setAddress(prev => ({ ...prev, houseNumber: e.target.value }))} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.houseNumber ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                        {errors.houseNumber && <p className="text-red-500 text-xs mt-1">{errors.houseNumber}</p>}
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                    <div>
                        <label htmlFor="postalCodeInput" className="block text-xs font-medium text-gray-600 mb-0.5">Postcode *</label>
                        <input id="postalCodeInput" type="text" value={address.postalCode} onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.postalCode ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                        {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="cityInput" className="block text-xs font-medium text-gray-600 mb-0.5">Plaats *</label>
                        <input id="cityInput" type="text" value={address.city} onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))} className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 ${errors.city ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                  </div>
                  {errors.address && <p className="text-red-500 text-xs mt-1 md:col-span-2">{errors.address}</p>} 
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="text-base font-medium text-gray-700 mb-2">Aanvullende Informatie (Optioneel)</h4>
                  <div>
                    <label htmlFor="celebrationDetailsInput" className="block text-sm font-medium text-gray-700 mb-1">Viering details</label>
                    <textarea id="celebrationDetailsInput" value={celebrationDetails} onChange={(e) => setCelebrationDetails(e.target.value)} placeholder="Bijv. verjaardag, jubileum, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" rows={2} />
                  </div>
                  <div>
                    <label htmlFor="dietaryWishesInput" className="block text-sm font-medium text-gray-700 mb-1">Dieetwensen / Allergieën</label>
                    <textarea id="dietaryWishesInput" value={dietaryWishes} onChange={(e) => setDietaryWishes(e.target.value)} placeholder="Bijv. vegetarisch, glutenvrij, notenallergie..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" rows={2} />
                  </div>
                  <div>
                    <label htmlFor="placementPreferenceDetailsInput" className="block text-sm font-medium text-gray-700 mb-1">Plaatsingsvoorkeur</label>
                    <textarea id="placementPreferenceDetailsInput" value={placementPreferenceDetails} onChange={(e) => setPlacementPreferenceDetails(e.target.value)} placeholder="Bijv. bij het raam, rustige plek..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" rows={2} />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-base font-medium text-gray-700 mb-3">Privacy & Marketing</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input type="checkbox" id="privacy-agreement" checked={agreedToPrivacyPolicy} onChange={(e) => setAgreedToPrivacyPolicy(e.target.checked)} className="mt-0.5 mr-2.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" />
                      <label htmlFor="privacy-agreement" className="text-sm text-gray-700 cursor-pointer">
                        Ik ga akkoord met het <a href="/privacy" target="_blank" className="text-indigo-600 hover:underline">privacybeleid</a> en de <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">algemene voorwaarden</a>. *
                      </label>
                    </div>
                    {errors.agreedToPrivacyPolicy && <p className="text-red-500 text-xs ml-6">{errors.agreedToPrivacyPolicy}</p>}

                    <div className="flex items-start">
                      <input type="checkbox" id="marketing-emails" checked={acceptsMarketingEmails} onChange={(e) => setAcceptsMarketingEmails(e.target.checked)} className="mt-0.5 mr-2.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" />
                      <label htmlFor="marketing-emails" className="text-sm text-gray-700 cursor-pointer">
                        Ja, ik wil graag nieuwsbrieven en speciale aanbiedingen ontvangen.
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Overview & Confirmation */}
            {currentStep === 6 && (
              <div>
                <h3 className="text-xl font-semibold mb-5 text-gray-800">Overzicht & Bevestiging</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Persoonlijke Gegevens</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div><strong>Naam:</strong> {name}</div>
                    <div><strong>E-mail:</strong> {email}</div>
                    <div><strong>Telefoon:</strong> {phone}</div>
                    <div><strong>Aantal Gasten:</strong> {guests}</div>
                    <div className="sm:col-span-2"><strong>Adres:</strong> {address.street} {address.houseNumber}, {address.postalCode} {address.city}</div>
                  </div>
                </div>

                {(celebrationDetails || dietaryWishes || placementPreferenceDetails || invoiceDetails.generateInvoice) && (
                  <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                    <h5 className="font-semibold text-yellow-800 mb-2">Aanvullende Informatie</h5>
                    <div className="space-y-1 text-sm text-yellow-700">
                        {celebrationDetails && <div><strong>Viering:</strong> {celebrationDetails}</div>}
                        {dietaryWishes && <div><strong>Dieetwensen:</strong> {dietaryWishes}</div>}
                        {placementPreferenceDetails && <div><strong>Plaatsingsvoorkeur:</strong> {placementPreferenceDetails}</div>}
                        {invoiceDetails.generateInvoice && (
                            <div>
                                <strong>Factuur:</strong> Ja, voor {invoiceDetails.companyName}
                                {showDifferentInvoiceAddress && invoiceDetails.address && (
                                    <span className="block pl-4 text-xs">Factuuradres: {invoiceDetails.address.street} {invoiceDetails.address.houseNumber}, {invoiceDetails.address.postalCode} {invoiceDetails.address.city}</span>
                                )}
                            </div>
                        )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">Belangrijk:</h5>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Na bevestiging ontvangt u een e-mail met alle details van uw reservering.</li>
                    <li>Betaling vindt plaats conform de voorwaarden (ter plaatse of via factuur indien aangevraagd en goedgekeurd).</li>
                    <li>Voor wijzigingen of annuleringen, neem tijdig contact op. Annuleringsvoorwaarden zijn van toepassing.</li>
                  </ul>
                </div>

                {errors.final && (
                  <p className="text-red-600 text-sm mt-3">{errors.final}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Summary */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-50 p-5 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
            <div className="sticky top-5">
              <h4 className="text-lg font-semibold mb-3 text-slate-800">Reservering Overzicht</h4>
              <div className="space-y-1.5 text-sm text-slate-700">
                {selectedShowSlot ? (
                  <div className="flex justify-between">
                    <span>Show:</span>
                    <span className="font-medium text-right">{selectedShowSlot.date} <br className="sm:hidden"/>om {selectedShowSlot.time}</span>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Selecteer een show...</p>
                )}
                
                {selectedPackage ? (
                  <div className="flex justify-between">
                    <span>Arrangement:</span>
                    <span className="font-medium text-right">{selectedPackage.name}</span>
                  </div>
                ) : (
                    selectedShowSlotId && <p className="text-slate-500 italic">Selecteer een arrangement...</p>
                )}

                <div className="flex justify-between">
                  <span>Aantal gasten:</span>
                  <span className="font-medium">{guests}</span>
                </div>

                {selectedPackage && selectedPackage.price !== undefined && (
                  <div className="flex justify-between">
                    <span>Arrangement totaal:</span>
                    <span>{appSettings.currencySymbol}{(selectedPackage.price * guests).toFixed(2)}</span>
                  </div>
                )}
                
                {selectedVoorborrel && specialAddons.find(a => a.id === 'voorborrel') && (
                  <div className="flex justify-between">
                    <span>Borrel Vooraf:</span>
                    <span>{appSettings.currencySymbol}{((specialAddons.find((a: SpecialAddOn) => a.id === 'voorborrel')?.price || 0) * guests).toFixed(2)}</span>
                  </div>
                )}
                {selectedNaborrel && specialAddons.find(a => a.id === 'naborrel') && (
                  <div className="flex justify-between">
                    <span>Borrel Naderhand:</span>
                    <span>{appSettings.currencySymbol}{((specialAddons.find((a: SpecialAddOn) => a.id === 'naborrel')?.price || 0) * guests).toFixed(2)}</span>
                  </div>
                )}
                
                {merchandise.length > 0 && (
                  <>
                    <div className="text-xs text-slate-500 pt-1.5 mt-1.5 border-t border-slate-200">Merchandise:</div>
                    {merchandise.map(item => (
                      item.quantity > 0 && <div key={item.itemId} className="flex justify-between text-xs">
                        <span className="truncate max-w-[150px]">{item.itemName} ({item.quantity}x)</span>
                        <span>{appSettings.currencySymbol}{(item.itemPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {(selectedPackage || merchandise.length > 0 || selectedVoorborrel || selectedNaborrel) && (
                  <div className="border-t border-slate-300 pt-2.5 mt-2.5">
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Korting ({appliedPromoCode}):</span>
                        <span>-{appSettings.currencySymbol}{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg text-indigo-700 mt-1">
                      <span>Totaal:</span>
                      <span>{appSettings.currencySymbol}{currentTotalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-gray-100"
          >
            Vorige
          </button>
          <button
            onClick={nextStep}
            disabled={!isStepValid} // Controlled by validation
            className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out shadow-sm hover:shadow-md"
          >
            {currentStep === STEPS.length ? 'Boeking Bevestigen' : 'Volgende'}
          </button>
        </div>
      </div>
    </div>
  );
};
