import React, { useState, useEffect, useRef } from 'react';
import { ShowSlot, PackageOption, MerchandiseItem, OrderedMerchandiseItem, BookingData, ReservationDetails, Address, InvoiceDetails, ReservationStatus, SpecialAddOn, PromoCode, Customer } from '../../types';
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
  allPackages: PackageOption[];
  specialAddons: SpecialAddOn[];
  availableShowSlots: ShowSlot[];
  merchandiseItems: MerchandiseItem[];
  initialData?: Partial<BookingData>;
  onOpenWaitingListModal: (slotId: string) => void;
  applyPromoCode: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode };
  loggedInCustomer: Customer | null;
  onLogout: () => void;
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
  allPackages,
  specialAddons,
  availableShowSlots,
  merchandiseItems,
  initialData,
  onOpenWaitingListModal,
  applyPromoCode,
  loggedInCustomer,
  showInfoModal,
}) => {
  // State variables
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedShowSlotId, setSelectedShowSlotId] = useState<string | undefined>(undefined);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<Address>({ street: '', houseNumber: '', postalCode: '', city: '' });
  const [merchandise, setMerchandise] = useState<OrderedMerchandiseItem[]>([]);
  const [selectedVoorborrel, setSelectedVoorborrel] = useState(false);
  const [selectedNaborrel, setSelectedNaborrel] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(false);
  const [acceptsMarketingEmails, setAcceptsMarketingEmails] = useState(false);
  
  // Additional fields
  const [celebrationDetails, setCelebrationDetails] = useState('');
  const [dietaryWishes, setDietaryWishes] = useState('');
  const [placementPreferenceDetails, setPlacementPreferenceDetails] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    needsInvoice: false,
    companyName: '',
    vatNumber: '',
    invoiceAddress: undefined,
    remarks: ''
  });
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>(undefined);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingPromoCode, setIsApplyingPromoCode] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const modalRef = useRef<HTMLDivElement>(null);
  const selectedShowSlot = availableShowSlots.find(s => s.id === selectedShowSlotId);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedShowSlotId(initialData?.selectedShowSlotId);
      setSelectedPackageId(undefined);
      setGuests(1);
      setName(loggedInCustomer?.name || '');
      setEmail(loggedInCustomer?.email || '');
      setPhone(loggedInCustomer?.phone || '');
      setAddress(loggedInCustomer?.address || { street: '', houseNumber: '', postalCode: '', city: '' });
      setMerchandise([]);
      setSelectedVoorborrel(false);
      setSelectedNaborrel(false);
      setAgreedToPrivacyPolicy(false);
      setAcceptsMarketingEmails(false);
      setCelebrationDetails('');
      setDietaryWishes('');
      setPlacementPreferenceDetails('');
      setInvoiceDetails({
        needsInvoice: false,
        companyName: '',
        vatNumber: '',
        invoiceAddress: undefined,
        remarks: ''
      });
      setPromoCodeInput('');
      setAppliedPromoCode(undefined);
      setDiscountAmount(0);
      setIsApplyingPromoCode(false);
      setErrors({});
      
      if (initialData?.selectedShowSlotId) {
        const slot = availableShowSlots.find(s => s.id === initialData.selectedShowSlotId);
        if (slot) {
          setCalendarSelectedDate(slot.date);
        }
      }
    }
  }, [isOpen, initialData, availableShowSlots, loggedInCustomer]);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!selectedShowSlotId) {
          newErrors.showSlotId = 'Selecteer een beschikbare showtijd.';
        }
        break;
      case 2:
        if (!selectedPackageId) {
          newErrors.packageId = 'Selecteer een arrangement.';
        }
        break;
      case 3:
        // Extra options validation
        const voorborrelAddon = specialAddons.find(a => a.id === 'voorborrel');
        if (selectedVoorborrel && voorborrelAddon?.minPersons && guests < voorborrelAddon.minPersons) {
          newErrors.voorborrel = `Borrel vooraf vereist minimaal ${voorborrelAddon.minPersons} gasten.`;
        }
        if (invoiceDetails.needsInvoice && !invoiceDetails.companyName?.trim()) {
          newErrors.companyName = 'Bedrijfsnaam is verplicht voor factuur.';
        }
        break;
      case 5:
        // Personal information validation
        if (!name.trim()) newErrors.name = 'Naam is verplicht.';
        if (!email.trim()) newErrors.email = 'E-mail is verplicht.';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Voer een geldig e-mailadres in.';
        if (!phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht.';
        if (guests < 1) newErrors.guests = 'Aantal gasten moet minimaal 1 zijn.';
        if (!address.street.trim()) newErrors.street = 'Straat is verplicht.';
        if (!address.houseNumber.trim()) newErrors.houseNumber = 'Huisnummer is verplicht.';
        if (!address.postalCode.trim()) newErrors.postalCode = 'Postcode is verplicht.';
        if (!address.city.trim()) newErrors.city = 'Plaats is verplicht.';
        if (!agreedToPrivacyPolicy) {
          newErrors.agreedToPrivacyPolicy = 'U dient akkoord te gaan met het privacybeleid.';
        }
        break;
      case 6:
        // Final validation
        if (!name.trim() || !email.trim() || !phone.trim()) {
          newErrors.final = 'Controleer of alle verplichte velden zijn ingevuld.';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
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
    if (!validateStep() || !selectedShowSlot || !selectedPackageId) return;

    const totalPrice = calculateTotalPrice();

    try {
      console.log('Submitting booking with data:', {
        showSlotId: selectedShowSlot.id,
        packageId: selectedPackageId,
        guests,
        name,
        email,
        phone,
        address,
        totalPrice
      });

      const result = await onSubmit({
        showSlotId: selectedShowSlot.id,
        packageId: selectedPackageId,
        guests,
        name,
        email,
        phone,
        address,
        merchandise,
        selectedVoorborrel,
        selectedNaborrel,
        ...(celebrationDetails && { celebrationDetails }),
        ...(dietaryWishes && { dietaryWishes }),
        ...(placementPreferenceDetails && { placementPreferenceDetails }),
        totalPrice,
        customerId: loggedInCustomer?.id,
        agreedToPrivacyPolicy,
        acceptsMarketingEmails,
        invoiceDetails,
        discountAmount,
        ...(appliedPromoCode && { appliedPromoCode }),
        status: 'pending' as ReservationStatus
      });      console.log('Booking result:', result);

      if (result.success) {
        // Don't show a simple modal here - the parent component will show the confirmation modal
        onClose();
      } else {
        showInfoModal('Fout', 'Er ging iets mis bij het verwerken van de boeking.', 'error');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      showInfoModal('Fout', `Er is een fout opgetreden bij het verwerken van uw boeking: ${error}`, 'error');
    }
  };

  const handleDateSelect = (dateString: string) => {
    setCalendarSelectedDate(dateString);
    setSelectedShowSlotId(undefined);
    setSelectedPackageId(undefined);
    setErrors({});
    
    const slotsOnSelectedDate = availableShowSlots.filter(slot => slot.date === dateString);
    if (slotsOnSelectedDate.length === 1) {
      const singleSlot = slotsOnSelectedDate[0];
      const isBookable = !(singleSlot.bookedCount >= singleSlot.capacity || singleSlot.isManuallyClosed);
      if (isBookable) {
        setSelectedShowSlotId(singleSlot.id);
      }
    }
  };

  const handleTimeSelect = (slotId: string) => {
    setSelectedShowSlotId(slotId);
    setSelectedPackageId(undefined);
    setErrors({});
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    setErrors({});
  };

  const handleMerchandiseQuantityChange = (itemId: string, quantity: number) => {
    const item = merchandiseItems.find(m => m.id === itemId);
    if (!item) return;

    setMerchandise(prev => {
      const existing = prev.find(m => m.itemId === itemId);
      if (existing) {
        return prev.map(m => m.itemId === itemId ? { ...m, quantity } : m);
      } else if (quantity > 0) {
        return [...prev, { itemId, itemName: item.name, itemPrice: item.priceInclVAT, quantity }];
      }
      return prev;
    });
  };

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;

    setIsApplyingPromoCode(true);
    try {
      const currentSubtotal = calculateSubtotal();
      const result = applyPromoCode(promoCodeInput.trim(), currentSubtotal);
      
      if (result.success && result.discountAmount && result.appliedCodeObject) {
        setAppliedPromoCode(result.appliedCodeObject.code);
        setDiscountAmount(result.discountAmount);
        showInfoModal('Promocode Toegepast', result.message, 'success');
      } else {
        showInfoModal('Promocode Fout', result.message, 'error');
      }
    } catch (error) {
      showInfoModal('Fout', 'Er is een fout opgetreden bij het toepassen van de promocode.', 'error');
    } finally {
      setIsApplyingPromoCode(false);
    }
  };

  const calculateSubtotal = (): number => {
    const selectedPackage = allPackages.find(p => p.id === selectedPackageId);
    const packagePrice = selectedPackage ? selectedPackage.price * guests : 0;
    
    let addOnPrice = 0;
    if (selectedVoorborrel) {
      const voorborrelAddon = specialAddons.find(a => a.id === 'voorborrel');
      addOnPrice += (voorborrelAddon?.price || 15) * guests;
    }
    if (selectedNaborrel) {
      const naborrelAddon = specialAddons.find(a => a.id === 'naborrel');
      addOnPrice += (naborrelAddon?.price || 15) * guests;
    }
    
    const merchandisePrice = merchandise.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
    return packagePrice + addOnPrice + merchandisePrice;
  };

  const calculateTotalPrice = (): number => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - discountAmount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
            aria-label="Sluit modal"
          >
            <CloseIconSvg />
          </button>
          <h2 id="booking-modal-title" className="text-2xl font-bold mb-4">
            Reservering maken
          </h2>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'
                }`}>
                  {step.icon}
                </div>
                <span className={`ml-2 text-sm ${currentStep >= step.id ? 'text-white' : 'text-indigo-200'}`}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-white' : 'bg-indigo-500'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Left Panel - Form */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Step 1: Date & Time */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Selecteer Datum & Tijd</h3>
                <CalendarView
                  showSlots={availableShowSlots}
                  onDateSelect={handleDateSelect}
                  selectedDate={calendarSelectedDate}
                />
                
                {/* Time slots for selected date */}
                {calendarSelectedDate && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Beschikbare tijden voor {calendarSelectedDate}:</h4>
                    <div className="grid gap-2">
                      {availableShowSlots
                        .filter(slot => slot.date === calendarSelectedDate)
                        .map(slot => {
                          const isBookable = !(slot.bookedCount >= slot.capacity || slot.isManuallyClosed);
                          const availableSpots = slot.capacity - slot.bookedCount;
                          
                          return (
                            <div key={slot.id} className="flex items-center justify-between">
                              <button
                                onClick={() => handleTimeSelect(slot.id)}
                                disabled={!isBookable}
                                className={`flex-1 p-3 text-left border rounded-lg transition-colors ${
                                  selectedShowSlotId === slot.id 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : isBookable 
                                      ? 'border-gray-200 hover:border-gray-300'
                                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className={`font-medium ${!isBookable ? 'text-gray-400' : ''}`}>
                                    {slot.time}
                                  </span>
                                  <span className={`text-sm ${!isBookable ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {isBookable ? `${availableSpots} plaatsen beschikbaar` : 'Uitverkocht'}
                                  </span>
                                </div>
                              </button>
                              {!isBookable && (
                                <button
                                  onClick={() => onOpenWaitingListModal(slot.id)}
                                  className="ml-2 px-3 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600"
                                >
                                  Wachtlijst
                                </button>
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
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
                <h3 className="text-xl font-semibold mb-4">Kies uw Arrangement</h3>
                {selectedShowSlot && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Gekozen show: <strong>{selectedShowSlot.date} om {selectedShowSlot.time}</strong>
                    </p>
                    {selectedShowSlot.name && (
                      <p className="text-sm text-blue-700">{selectedShowSlot.name}</p>
                    )}
                  </div>
                )}
                <div className="grid gap-4">
                  {allPackages
                    .filter(pkg => !selectedShowSlot || selectedShowSlot.availablePackageIds.includes(pkg.id))
                    .map(pkg => (
                    <div 
                      key={pkg.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPackageId === pkg.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      } ${pkg.colorCode ? `${pkg.colorCode} text-white` : ''}`}
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className={`font-medium text-lg ${pkg.colorCode ? 'text-white' : ''}`}>
                            {pkg.name}
                          </h4>
                          <p className={`text-sm mt-1 ${pkg.colorCode ? 'text-gray-100' : 'text-gray-600'}`}>
                            {pkg.description}
                          </p>
                          {pkg.days && (
                            <p className={`text-xs mt-1 ${pkg.colorCode ? 'text-gray-200' : 'text-gray-500'}`}>
                              {pkg.days}
                            </p>
                          )}
                          {pkg.details && pkg.details.length > 0 && (
                            <div className="mt-2">
                              <p className={`text-xs font-medium ${pkg.colorCode ? 'text-gray-200' : 'text-gray-600'}`}>
                                Inclusief:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {pkg.details.map(detail => (
                                  <span 
                                    key={detail} 
                                    className={`text-xs px-2 py-1 rounded ${
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
                            <p className={`text-xs mt-2 ${pkg.colorCode ? 'text-yellow-200' : 'text-orange-600'}`}>
                              Minimaal {pkg.minPersons} personen
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-xl font-bold ${pkg.colorCode ? 'text-white' : 'text-indigo-600'}`}>
                            €{pkg.price}
                          </p>
                          <p className={`text-sm ${pkg.colorCode ? 'text-gray-200' : 'text-gray-500'}`}>
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
              </div>
            )}

            {/* Step 3: Extra Options */}
            {currentStep === 3 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Extra Opties</h3>
                
                {/* Add-ons */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-lg">Toevoegingen</h4>
                  {specialAddons.map(addon => (
                    <div key={addon.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium">{addon.name}</h5>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{addon.timing}</p>
                        {addon.minPersons && (
                          <p className="text-xs text-orange-600 mt-1">
                            Minimaal {addon.minPersons} personen
                          </p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-4 font-medium">€{addon.price} p.p.</span>
                        <input
                          type="checkbox"
                          checked={addon.id === 'voorborrel' ? selectedVoorborrel : selectedNaborrel}
                          onChange={(e) => {
                            if (addon.id === 'voorborrel') {
                              setSelectedVoorborrel(e.target.checked);
                            } else {
                              setSelectedNaborrel(e.target.checked);
                            }
                          }}
                          disabled={addon.minPersons ? guests < addon.minPersons : false}
                          className="w-4 h-4 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {errors.voorborrel && (
                    <p className="text-red-600 text-sm">{errors.voorborrel}</p>
                  )}
                </div>

                {/* Invoice Section */}
                <div className="border-t pt-6 mb-6">
                  <h4 className="font-medium text-lg mb-3">Factuurgegevens</h4>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="needs-invoice"
                      checked={invoiceDetails.needsInvoice}
                      onChange={(e) => setInvoiceDetails(prev => ({ ...prev, needsInvoice: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="needs-invoice" className="text-sm text-gray-700">
                      Ik heb een factuur nodig voor deze boeking
                    </label>
                  </div>

                  {invoiceDetails.needsInvoice && (
                    <div className="space-y-3 pl-6 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bedrijfsnaam *
                        </label>
                        <input
                          type="text"
                          value={invoiceDetails.companyName}
                          onChange={(e) => setInvoiceDetails(prev => ({ ...prev, companyName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.companyName && <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BTW-nummer (optioneel)
                        </label>
                        <input
                          type="text"
                          value={invoiceDetails.vatNumber}
                          onChange={(e) => setInvoiceDetails(prev => ({ ...prev, vatNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Opmerkingen voor factuur (optioneel)
                        </label>
                        <textarea
                          value={invoiceDetails.remarks}
                          onChange={(e) => setInvoiceDetails(prev => ({ ...prev, remarks: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Promo Code Section */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-lg mb-3">Promocode</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Voer uw promocode in"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={!!appliedPromoCode}
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      disabled={!promoCodeInput.trim() || isApplyingPromoCode || !!appliedPromoCode}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApplyingPromoCode ? 'Toepassen...' : 'Toepassen'}
                    </button>
                  </div>
                  {appliedPromoCode && (
                    <p className="text-green-600 text-sm mt-2">
                      Promocode "{appliedPromoCode}" toegepast! Korting: €{discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Merchandise */}
            {currentStep === 4 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Merchandise</h3>
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
                      <h4 className="font-medium text-lg mb-3 text-indigo-600">{category}</h4>
                      <div className="grid gap-4">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              {item.imageUrl && (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <h5 className="font-medium">{item.name}</h5>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                <p className="text-lg font-bold text-indigo-600">€{item.priceInclVAT.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <label className="mr-2 text-sm">Aantal:</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={merchandise.find(m => m.itemId === item.id)?.quantity || 0}
                                onChange={(e) => handleMerchandiseQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {merchandiseItems.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      Momenteel geen merchandise beschikbaar.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Personal Information */}
            {currentStep === 5 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Persoonlijke Gegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aantal gasten *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.guests && <p className="text-red-600 text-sm mt-1">{errors.guests}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Straat *</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Huisnummer *</label>
                    <input
                      type="text"
                      value={address.houseNumber}
                      onChange={(e) => setAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.houseNumber && <p className="text-red-600 text-sm mt-1">{errors.houseNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plaats *</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>
                </div>

                {/* Optional fields */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Viering details (optioneel)
                    </label>
                    <textarea
                      value={celebrationDetails}
                      onChange={(e) => setCelebrationDetails(e.target.value)}
                      placeholder="Vertel ons over de speciale gelegenheid die u viert..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dieetwensen (optioneel)
                    </label>
                    <textarea
                      value={dietaryWishes}
                      onChange={(e) => setDietaryWishes(e.target.value)}
                      placeholder="Heeft u speciale dieetwensen of allergieën?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plaatsingsvoorkeur (optioneel)
                    </label>
                    <textarea
                      value={placementPreferenceDetails}
                      onChange={(e) => setPlacementPreferenceDetails(e.target.value)}
                      placeholder="Heeft u speciale wensen voor de plaatsing (bijv. dichtbij het podium, toegankelijk)?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Privacy Section */}
                <div className="border-t pt-6 mt-6">
                  <h4 className="font-medium mb-3">Privacy & Marketing</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="privacy-agreement"
                        checked={agreedToPrivacyPolicy}
                        onChange={(e) => setAgreedToPrivacyPolicy(e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      <label htmlFor="privacy-agreement" className="text-sm text-gray-700">
                        Ik ga akkoord met het privacybeleid en de algemene voorwaarden *
                      </label>
                    </div>
                    {errors.agreedToPrivacyPolicy && (
                      <p className="text-red-600 text-sm">{errors.agreedToPrivacyPolicy}</p>
                    )}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="marketing-emails"
                        checked={acceptsMarketingEmails}
                        onChange={(e) => setAcceptsMarketingEmails(e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      <label htmlFor="marketing-emails" className="text-sm text-gray-700">
                        Ik wil graag nieuwsbrieven en marketing e-mails ontvangen
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Overview & Confirmation */}
            {currentStep === 6 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Overzicht & Bevestiging</h3>
                
                {/* Personal Information Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">Persoonlijke Gegevens</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Naam:</strong> {name}</div>
                    <div><strong>E-mail:</strong> {email}</div>
                    <div><strong>Telefoon:</strong> {phone}</div>
                    <div><strong>Gasten:</strong> {guests}</div>
                    <div className="col-span-2">
                      <strong>Adres:</strong> {address.street} {address.houseNumber}, {address.postalCode} {address.city}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {(celebrationDetails || dietaryWishes || placementPreferenceDetails || invoiceDetails.needsInvoice) && (
                  <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                    <h5 className="font-medium mb-2">Aanvullende informatie:</h5>
                    {celebrationDetails && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Viering:</span> {celebrationDetails}
                      </div>
                    )}
                    {dietaryWishes && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Dieetwensen:</span> {dietaryWishes}
                      </div>
                    )}
                    {placementPreferenceDetails && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Plaatsingsvoorkeur:</span> {placementPreferenceDetails}
                      </div>
                    )}
                    {invoiceDetails.needsInvoice && (
                      <div className="text-sm">
                        <span className="font-medium">Factuur:</span> Ja, voor {invoiceDetails.companyName}
                      </div>
                    )}
                  </div>
                )}

                {/* Confirmation Notice */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Let op:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Na bevestiging ontvangt u een e-mail met alle details</li>
                    <li>• Betaling kan ter plaatse of via factuur (indien aangevraagd)</li>
                    <li>• Voor wijzigingen kunt u contact opnemen via info@inspirationpoint.nl</li>
                    <li>• Annulering is mogelijk tot 48 uur voor de voorstelling</li>
                  </ul>
                </div>

                {errors.final && (
                  <p className="text-red-600 text-sm mt-2">{errors.final}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Summary */}
          <div className="w-80 bg-gray-50 p-6 border-l">
            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-2 text-indigo-800">Reservering Overzicht</h4>
              <div className="space-y-1 text-sm">
                {selectedShowSlot && (
                  <div className="flex justify-between">
                    <span>Show:</span>
                    <span className="font-medium">{selectedShowSlot.date} om {selectedShowSlot.time}</span>
                  </div>
                )}
                {selectedPackageId && (
                  <div className="flex justify-between">
                    <span>Arrangement:</span>
                    <span className="font-medium">{allPackages.find(p => p.id === selectedPackageId)?.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Aantal gasten:</span>
                  <span className="font-medium">{guests}</span>
                </div>
                {selectedPackageId && (
                  <div className="flex justify-between">
                    <span>Arrangementsprijs:</span>
                    <span>€{((allPackages.find(p => p.id === selectedPackageId)?.price || 0) * guests).toFixed(2)}</span>
                  </div>
                )}
                
                {selectedVoorborrel && (
                  <div className="flex justify-between">
                    <span>Borrel Vooraf:</span>
                    <span>€{((specialAddons.find(a => a.id === 'voorborrel')?.price || 15) * guests).toFixed(2)}</span>
                  </div>
                )}
                {selectedNaborrel && (
                  <div className="flex justify-between">
                    <span>Borrel Naderhand:</span>
                    <span>€{((specialAddons.find(a => a.id === 'naborrel')?.price || 15) * guests).toFixed(2)}</span>
                  </div>
                )}
                
                {merchandise.length > 0 && (
                  <>
                    <div className="text-xs text-gray-600 mt-2 mb-1">Merchandise:</div>
                    {merchandise.map(item => (
                      <div key={item.itemId} className="flex justify-between text-xs">
                        <span>{item.itemName} ({item.quantity}x):</span>
                        <span>€{(item.itemPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {selectedPackageId && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Subtotaal:</span>
                      <span>€{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Korting ({appliedPromoCode}):</span>
                        <span>-€{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg text-indigo-600">
                      <span>Totaal te betalen:</span>
                      <span>€{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vorige
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {currentStep === STEPS.length ? 'Bevestigen' : 'Volgende'}
          </button>
        </div>
      </div>
    </div>  );
};
