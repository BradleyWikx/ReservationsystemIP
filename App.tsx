import React, { useState, useEffect, useCallback } from 'react';
import { AdminPage } from './components/admin/AdminPage';
import { UserBookingPage } from './components/UserBookingPage';
import { BookingStepper } from './components/booking/BookingStepper';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { WaitingListModal } from './components/WaitingListModal';
import { ToastContainer, ToastMessage } from './components/shared/ToastNotifications';
import { sendBookingConfirmationEmail, sendBookingConfirmationToAdmin, BookingEmailData } from './services/emailService';
import { AppSettings, ReservationDetails, ShowSlot, MerchandiseItem, PromoCode, StaffMember, Customer, Invoice, WaitingListEntry, AuditLogEntry, ScheduledShift, BookingData, ReservationStatus } from './types';
import { db } from './src/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { SHOW_PACKAGES, SPECIAL_ADDONS } from './constants';


const defaultAppSettings: AppSettings = {
  companyDetails: {
    name: "Inspiration Point Valkenswaard",
    addressLine1: "Showstraat 1",
    addressLine2: "1234 AB Showdorp",
    phone: "040-1234567",
    email: "info@inspirationpoint.nl",
    vatNumber: "NL000000000B01",
    kvkNumber: "00000000",
    bankAccountNumber: "NL00BANK0000000000",
    bankName: "Productie Bank",
    logoUrl: "./logo-ip.png",
  },
  lastInvoiceNumber: 0,
  invoiceDueDays: 14,
  vatRateHigh: 21,
  vatRateLow: 9,
  invoiceNrPrefix: "INV-",
  defaultShowId: undefined,
  defaultPackageId: undefined,
  paymentInstructions: '',
  currencySymbol: '€',
};


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [availableShowSlots, setAvailableShowSlots] = useState<ShowSlot[]>([]);
  const [allBookings, setAllBookings] = useState<ReservationDetails[]>([]);
  const [waitingListEntries, setWaitingListEntries] = useState<WaitingListEntry[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [merchandiseItems, setMerchandiseItems] = useState<MerchandiseItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [view, setView] = useState<'admin' | 'user'>('admin');
  
  // Booking modal states
  const [isBookingStepperOpen, setIsBookingStepperOpen] = useState(false);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [waitingListModalSlotId, setWaitingListModalSlotId] = useState<string | null>(null);
  const [initialBookingData, setInitialBookingData] = useState<Partial<BookingData>>({});
  
  // Booking confirmation modal state
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    reservationId: string;
    customerName: string;
    customerEmail: string;
    showDate: string;
    showTime: string;
    packageName: string;
    totalPrice: number;
    guests: number;
  } | null>(null);


  // --- DATA LOADING (Firebase) ---
  useEffect(() => {
    const unsubShows = onSnapshot(collection(db, "shows"), (snapshot) => {
      const shows = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ShowSlot));
      console.log('Loaded shows from Firebase:', shows);
      setAvailableShowSlots(shows);
      
      // Als er geen shows zijn, maak test data
      if (shows.length === 0) {
        console.log('No shows found, creating test data...');
        createTestData();
      }
    });
    const unsubMerch = onSnapshot(collection(db, "merchandise"), snapshot => {
      const merch = snapshot.docs.map(d => ({id: d.id, ...d.data() } as MerchandiseItem));
      console.log('Loaded merchandise from Firebase:', merch);
      setMerchandiseItems(merch);
    });
    const unsubPromo = onSnapshot(collection(db, "promoCodes"), snapshot => setPromoCodes(snapshot.docs.map(d => ({id: d.id, ...d.data() } as PromoCode))));
    const unsubBookings = onSnapshot(collection(db, "bookings"), snapshot => setAllBookings(snapshot.docs.map(d => ({id: d.id, ...d.data() } as any))));
    const unsubCustomers = onSnapshot(collection(db, "customers"), snapshot => setCustomers(snapshot.docs.map(d => ({id: d.id, ...d.data() } as Customer))));
    const unsubWaiting = onSnapshot(collection(db, "waitingList"), snapshot => setWaitingListEntries(snapshot.docs.map(d => ({id: d.id, ...d.data() } as WaitingListEntry))));
    const unsubInvoices = onSnapshot(collection(db, "invoices"), snapshot => setInvoices(snapshot.docs.map(d => ({id: d.id, ...d.data() } as Invoice))));
    const unsubAudit = onSnapshot(collection(db, "auditLog"), snapshot => setAuditLogs(snapshot.docs.map(d => ({id: d.id, ...d.data() } as AuditLogEntry))));
    const unsubStaff = onSnapshot(collection(db, "staff"), snapshot => setStaffMembers(snapshot.docs.map(d => ({id: d.id, ...d.data() } as StaffMember))));
    const unsubShifts = onSnapshot(collection(db, "scheduledShifts"), snapshot => setScheduledShifts(snapshot.docs.map(d => ({id: d.id, ...d.data() } as ScheduledShift))));
    const unsubSettings = onSnapshot(collection(db, "appSettings"), snapshot => {
      if (!snapshot.empty) setAppSettings({ ...(snapshot.docs[0].data() as AppSettings) });
    });
    return () => {
      unsubShows();
      unsubMerch();
      unsubPromo();
      unsubBookings();
      unsubCustomers();
      unsubWaiting();
      unsubInvoices();
      unsubAudit();
      unsubStaff();
      unsubShifts();
      unsubSettings();
    };
  }, []);

  // Functie om test data te maken
  const createTestData = async () => {
    try {
      // Maak een test show
      const testShow = {
        name: "Test Show",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Morgen
        time: "20:00",
        availablePackageIds: ["vrijdag-zaterdag-80", "vrijdag-zaterdag-95"],
        capacity: 100,
        bookedCount: 0,
        availableSlots: 100,
        isManuallyClosed: false,
        showType: "REGULAR"
      };
      
      await addDoc(collection(db, "shows"), testShow);
      console.log('Test show created');
      
      // Maak test merchandise
      const testMerch = {
        name: "Test Merchandise",
        description: "Een test item voor merchandise",
        priceInclVAT: 10.00,
        category: "Test",
        vatRate: 21
      };
      
      await addDoc(collection(db, "merchandise"), testMerch);
      console.log('Test merchandise created');
      
      showToast('Test data aangemaakt!', 'success');
    } catch (error) {
      console.error('Error creating test data:', error);
      showToast('Fout bij aanmaken test data', 'error');
    }
  };


  // Toast helpers
  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const removeToast = (id: string) => setToasts(prev => prev.filter(toast => toast.id !== id));


  // --- HANDLERS FIRESTORE ---
  // Shows
  const handleAddShowSlot = async (newSlotData: Omit<ShowSlot, 'id' | 'bookedCount' | 'isManuallyClosed' | 'availableSlots'>) => {
    await addDoc(collection(db, 'shows'), { ...newSlotData, bookedCount: 0, isManuallyClosed: false, availableSlots: newSlotData.capacity }); // availableSlots initieel gelijk aan capacity
    showToast('Show toegevoegd!', 'success');
  };
  const handleRemoveShowSlot = async (slotId: string) => {
    await deleteDoc(doc(db, 'shows', slotId));
    showToast('Show verwijderd!', 'success');
  };
  const handleUpdateShowSlot = (updatedSlot: ShowSlot) => {
    const { id, ...data } = updatedSlot;
    updateDoc(doc(db, 'shows', id), data);
    showToast('Show bijgewerkt!', 'success');
  };
  // Merchandise
  const handleAddMerchandise = (itemData: Omit<MerchandiseItem, 'id'>) => {
    addDoc(collection(db, 'merchandise'), itemData);
    showToast('Merchandise toegevoegd!', 'success');
  };
  const handleUpdateMerchandise = (updatedItem: MerchandiseItem) => {
    const { id, ...data } = updatedItem;
    updateDoc(doc(db, 'merchandise', id), data);
    showToast('Merchandise bijgewerkt!', 'success');
  };
  const handleDeleteMerchandise = async (itemId: string) => {
    await deleteDoc(doc(db, 'merchandise', itemId));
    showToast('Merchandise verwijderd!', 'success');
  };
  // Customers
  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'creationTimestamp' | 'lastUpdateTimestamp'>) => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'customers'), { ...customerData, creationTimestamp: now, lastUpdateTimestamp: now });
    showToast('Klant toegevoegd!', 'success');
    return { id: docRef.id, ...customerData, creationTimestamp: now, lastUpdateTimestamp: now };
  };
  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    const { id, ...data } = updatedCustomer;
    await updateDoc(doc(db, 'customers', id), { ...data, lastUpdateTimestamp: new Date().toISOString() });
    showToast('Klant bijgewerkt!', 'success');
    return true;
  };
  const handleDeleteCustomer = async (customerId: string) => {
    await deleteDoc(doc(db, 'customers', customerId));
    showToast('Klant verwijderd!', 'success');
    return true;
  };
  // Promo codes
  const handleAddPromoCode = (codeData: Omit<PromoCode, 'id' | 'timesUsed'>) => {
    const data = { ...codeData, timesUsed: 0 };
    addDoc(collection(db, 'promoCodes'), data);
    showToast('Kortingscode toegevoegd!', 'success');
    return null;
  };
  const handleUpdatePromoCode = (updatedCode: PromoCode) => {
    const { id, ...data } = updatedCode;
    updateDoc(doc(db, 'promoCodes', id), data);
    showToast('Kortingscode bijgewerkt!', 'success');
    return true;
  };
  const handleDeletePromoCode = async (codeId: string) => {
    await deleteDoc(doc(db, 'promoCodes', codeId));
    showToast('Kortingscode verwijderd!', 'success');
    return true;
  };
  const applyPromoCode = (codeString: string, currentBookingSubtotal: number): { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode } => {
    const promoCode = promoCodes.find(pc => pc.code === codeString && pc.isActive);
    if (!promoCode) {
      return { success: false, message: 'Kortingscode niet gevonden of niet actief.' };
    }
    if (promoCode.expirationDate && new Date(promoCode.expirationDate) < new Date()) {
      return { success: false, message: 'Kortingscode is verlopen.' };
    }
    if (promoCode.usageLimit && promoCode.timesUsed >= promoCode.usageLimit) {
      return { success: false, message: 'Kortingscode heeft zijn gebruikslimiet bereikt.' };
    }
    if (promoCode.minBookingAmount && currentBookingSubtotal < promoCode.minBookingAmount) {
      return { success: false, message: `Minimaal boekingsbedrag van ${appSettings.currencySymbol}${promoCode.minBookingAmount} niet bereikt.` };
    }

    let discountAmount = 0;
    if (promoCode.type === 'percentage') {
      discountAmount = currentBookingSubtotal * (promoCode.value / 100);
    } else if (promoCode.type === 'fixed_amount') {
      discountAmount = promoCode.value;
    } else if (promoCode.type === 'gift_card') {
      // Voor gift cards, de waarde is het tegoed. Kan niet meer zijn dan het subtotaal.
      discountAmount = Math.min(promoCode.value, currentBookingSubtotal);
    }
    
    // Zorg ervoor dat de korting niet hoger is dan het subtotaal
    discountAmount = Math.min(discountAmount, currentBookingSubtotal);

    showToast('Kortingscode succesvol toegepast!', 'success');
    return { success: true, discountAmount, message: 'Kortingscode toegepast!', appliedCodeObject: promoCode };
  };
  // Bookings
  const handleUpdateBooking = async (updatedBooking: ReservationDetails /*, adminConsentsToOverbooking: boolean = false*/) => {
    const { id, ...data } = updatedBooking as any;
    await updateDoc(doc(db, 'bookings', id), data);
    showToast('Boeking bijgewerkt!', 'success');
    return true;
  };
  const handleManualBookingSubmit = async (details: any) => {
    const bookingData = {
      ...details,
      reservationId: `MANUAL_${Date.now()}`,
      bookingTimestamp: new Date().toISOString(),
      status: 'confirmed',
      customerId: details.customerId || 'manual_customer',
      agreedToPrivacyPolicy: true
    };
    await addDoc(collection(db, 'bookings'), bookingData);
    showToast('Handmatige boeking toegevoegd!', 'success');
    return true;
  };
  // Waiting list
  const handleRemoveWaitingListEntry = async (entryId: string) => {
    await deleteDoc(doc(db, 'waitingList', entryId));
    showToast('Wachtlijst entry verwijderd!', 'success');
  };
  // Staff
  const handleAddStaffMember = (data: Omit<StaffMember, 'id'>) => {
    addDoc(collection(db, 'staff'), data);
    showToast('Personeel toegevoegd!', 'success');
    return { ...data, id: '' };
  };
  const handleUpdateStaffMember = (updatedStaffMember: StaffMember) => {
    const { id, ...data } = updatedStaffMember;
    updateDoc(doc(db, 'staff', id), data);
    showToast('Personeel bijgewerkt!', 'success');
    return true;
  };
  const handleDeleteStaffMember = async (staffMemberId: string) => {
    await deleteDoc(doc(db, 'staff', staffMemberId));
    showToast('Personeel verwijderd!', 'success');
    return true;
  };
  const handleScheduleStaff = (shiftData: Omit<ScheduledShift, 'id'>) => {
    addDoc(collection(db, 'scheduledShifts'), shiftData);
    showToast('Shift gepland!', 'success');
    return null;
  };
  const handleUnscheduleStaff = async (shiftId: string) => {
    await deleteDoc(doc(db, 'scheduledShifts', shiftId));
    showToast('Shift verwijderd!', 'success');
    return true;
  };
  // Facturen
  const handleGenerateInvoice = async (reservationId: string): Promise<Invoice | null> => {
    const booking = allBookings.find(b => b.reservationId === reservationId);
    if (!booking) {
      showToast('Boeking niet gevonden voor factuur generatie.', 'error');
      return null;
    }
    // Placeholder: In een echte implementatie zou hier een factuur object worden aangemaakt
    // en mogelijk opgeslagen in Firebase, en een PDF worden gegenereerd.
    const newInvoice: Invoice = {
      id: `INV_${Date.now()}`,
      reservationId: reservationId,
      customerId: booking.customerId || 'N/A',
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + (appSettings.invoiceDueDays || 14) * 86400000).toISOString(),
      totalAmount: booking.totalPrice,
      status: 'pending_payment',
      items: [
        { description: `Reservering ${booking.packageName}`, quantity: 1, unitPrice: booking.totalPrice, totalPrice: booking.totalPrice, vatRate: appSettings.vatRateHigh || 21 }
      ],
      customerDetails: {
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        address: booking.address,
        companyName: booking.invoiceDetails?.companyName,
        vatNumber: booking.invoiceDetails?.vatNumber,
      },
      companyDetails: appSettings.companyDetails,
      invoiceNumber: `${appSettings.invoiceNrPrefix}${appSettings.lastInvoiceNumber + 1}`,
      paymentDetails: appSettings.paymentInstructions,
    };
    // Simuleer opslaan en updaten van appSettings (in een echte app zou dit een transactie zijn)
    try {
      const invRef = await addDoc(collection(db, 'invoices'), newInvoice);
      await updateDoc(doc(db, 'bookings', booking.id!), { invoiceId: invRef.id }); // Assuming booking.id is the Firestore doc ID
      await updateDoc(doc(db, 'appSettings', 'main'), { lastInvoiceNumber: appSettings.lastInvoiceNumber + 1 });
      showToast('Factuur succesvol aangemaakt (placeholder).', 'success');
      // Return the created invoice with its new ID
      return { ...newInvoice, id: invRef.id };
    } catch (error) {
      console.error("Error creating invoice (placeholder):", error);
      showToast('Fout bij aanmaken factuur (placeholder).', 'error');
      return null;
    }
  };
  const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status'], paymentDetails?: string) => {
    updateDoc(doc(db, 'invoices', invoiceId), { status, paymentDetails });
    showToast('Factuurstatus bijgewerkt!', 'success');
  };
  const handleGenerateInvoicesForDay = async (/*selectedDate: string*/) => { // Commented out unused param
    showToast('Dagfacturatie nog niet geïmplementeerd', 'info');
    return { successCount: 0, failCount: 0, alreadyExistsCount: 0 };
  };
  const handleCreateCreditNote = async (originalInvoiceId: string): Promise<Invoice | null> => {
    const originalInvoice = invoices.find(inv => inv.id === originalInvoiceId);
    if (!originalInvoice) {
      showToast('Originele factuur niet gevonden voor creditnota.', 'error');
      return null;
    }
    // Placeholder: Logica voor creditnota
    const creditNote: Invoice = {
      ...originalInvoice,
      id: `CN_${Date.now()}`,
      invoiceNumber: `CN-${originalInvoice.invoiceNumber}`,
      status: 'credited',
      totalAmount: -originalInvoice.totalAmount, // Negatief bedrag
      items: originalInvoice.items.map(item => ({ ...item, unitPrice: -item.unitPrice, totalPrice: -item.totalPrice })),
      invoiceDate: new Date().toISOString(),
      // dueDate: new Date().toISOString(), // Creditnota's hebben meestal geen vervaldatum
    };
    try {
      const cnRef = await addDoc(collection(db, 'invoices'), creditNote);
      // Optioneel: update de originele factuur status
      await updateDoc(doc(db, 'invoices', originalInvoiceId), { status: 'credited', creditedByInvoiceId: cnRef.id });
      showToast('Creditnota succesvol aangemaakt (placeholder).', 'success');
      return { ...creditNote, id: cnRef.id };
    } catch (error) {
      console.error("Error creating credit note (placeholder):", error);
      showToast('Fout bij aanmaken creditnota (placeholder).', 'error');
      return null;
    }
  };
  const handleSplitInvoice = async (originalInvoiceId: string, splitType: 'equalParts' | 'byAmount', splitValue: number): Promise<boolean> => {
    const originalInvoice = invoices.find(inv => inv.id === originalInvoiceId);
    if (!originalInvoice) {
      showToast('Originele factuur niet gevonden om te splitsen.', 'error');
      return false;
    }
    if (originalInvoice.status === 'paid' || originalInvoice.status === 'credited') {
        showToast(`Factuur ${originalInvoice.invoiceNumber} kan niet gesplitst worden omdat deze al betaald of gecrediteerd is.`, 'warning');
        return false;
    }
    // Placeholder: Logica voor splitsen van factuur
    // Dit is een complexe operatie die nieuwe facturen zou genereren
    // en de originele factuur zou aanpassen of ongeldig maken.
    console.log(`Splitting invoice ${originalInvoiceId} by ${splitType} with value ${splitValue}.`);
    showToast('Factuur splitsen nog niet volledig geïmplementeerd (placeholder).', 'info');
    // Voor nu, retourneer true om aan te geven dat de actie is ontvangen.
    // In een echte implementatie zou je hier de nieuwe factuur ID's kunnen retourneren of een status.
    return false; // Return false as it's not fully implemented
  };
  // App settings
  const handleUpdateDefaultShowAndPackage = (showId?: string, packageId?: string) => {
    updateDoc(doc(db, 'appSettings', 'main'), { defaultShowId: showId, defaultPackageId: packageId });
    showToast('Standaard show/pakket bijgewerkt!', 'success');
  };

  // Booking handlers
  const handleBookShow = (slot?: ShowSlot) => {
    if (slot) {
      setInitialBookingData({ selectedShowSlotId: slot.id });
    } else {
      setInitialBookingData({});
    }
    setIsBookingStepperOpen(true);
  };

  const handleBookingSubmit = async (details: Omit<ReservationDetails, 'reservationId' | 'bookingTimestamp' | 'date' | 'time' | 'packageName'>): Promise<{ success: boolean; status: ReservationStatus }> => {
    try {
      console.log('Received booking details in App.tsx for overbooking check:', details);
      
      const reservationId = `RES_${Date.now()}`;
      const bookingTimestamp = new Date().toISOString();
      
      const showSlot = availableShowSlots.find(s => s.id === details.showSlotId);
      if (!showSlot) {
        console.error('Show slot not found:', details.showSlotId);
        showToast('Show niet gevonden!', 'error');
        return { success: false, status: 'failed' };
      }

      const packageDetails = SHOW_PACKAGES.find(p => p.id === details.packageId);
      if (!packageDetails) {
        console.error('Package not found:', details.packageId);
        showToast('Pakket niet gevonden!', 'error');
        return { success: false, status: 'failed' };
      }

      const { customerId: originalCustomerId, ...otherDetailsFromStepper } = details;

      const currentBookedCount = showSlot.bookedCount || 0;
      const requestedGuests = details.guests || 1;
      const slotCapacity = showSlot.capacity || 0;
      let newStatus: ReservationStatus = 'pending_approval'; // Default to pending_approval
      let isOverbookingAttempt = false;

      if (currentBookedCount + requestedGuests > slotCapacity) {
        isOverbookingAttempt = true;
        // For overbookings, status remains 'pending_approval' for admin to decide.
        showToast('Deze boeking overschrijdt de capaciteit en vereist goedkeuring.', 'warning');
        // newStatus remains 'pending_approval' as set by default
      } else {
        // If not an overbooking, confirm it directly
        newStatus = 'confirmed';
      }

      let bookingObjectForFirebase: any = {
        ...otherDetailsFromStepper,
        reservationId,
        bookingTimestamp,
        date: showSlot.date,
        time: showSlot.time,
        packageName: packageDetails.name,
        status: newStatus, 
        isGuestBooking: !originalCustomerId,
        isOverbooking: isOverbookingAttempt, // Add the flag here
      };

      if (originalCustomerId) {
        bookingObjectForFirebase.customerId = originalCustomerId;
      }

      const removeUndefinedValues = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined);
        return Object.fromEntries(
          Object.entries(obj)
            .map(([key, value]) => [key, removeUndefinedValues(value)])
            .filter(([_key, value]) => value !== undefined) // Corrected lint error by using _key
        );
      };
      
      const cleanBookingData = removeUndefinedValues(bookingObjectForFirebase);

      console.log('Saving cleaned booking data (overbooking check) to Firebase:', cleanBookingData);

      if (cleanBookingData === undefined || Object.keys(cleanBookingData).length === 0) {
          console.error("Critical error: cleanBookingData is undefined or empty. Original for Firebase:", bookingObjectForFirebase, "Original details:", details);
          showToast('Interne fout bij voorbereiden boeking (lege data).', 'error');
          return { success: false, status: 'failed' };
      }
      
      await addDoc(collection(db, 'bookings'), cleanBookingData);
      
      // Only update bookedCount if it's NOT an overbooking that needs approval.
      // If it is an overbooking, the count should only be updated upon admin approval.
      if (!isOverbookingAttempt) {
        await updateDoc(doc(db, 'shows', details.showSlotId), {
          bookedCount: currentBookedCount + requestedGuests
        });
      }

      console.log('Booking saved successfully (overbooking status:', isOverbookingAttempt, ')');
      
      const emailData: BookingEmailData = {
        reservationId,
        customerName: details.name,
        customerEmail: details.email,
        showDate: showSlot.date,
        showTime: showSlot.time,
        packageName: packageDetails.name,
        totalPrice: details.totalPrice,
        guests: details.guests,
        merchandise: details.merchandise?.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          itemPrice: item.itemPrice
        })).filter(item => item !== undefined),
        specialAddons: {
          voorborrel: details.selectedVoorborrel,
          naborrel: details.selectedNaborrel
        }
      };
      
      sendBookingConfirmationEmail(emailData).catch(error => 
        console.error('Failed to send customer confirmation email:', error)
      );
      sendBookingConfirmationToAdmin(emailData).catch(error => 
        console.error('Failed to send admin notification email:', error)
      );
      
      setConfirmationData({
        reservationId,
        customerName: details.name,
        customerEmail: details.email,
        showDate: showSlot.date,
        showTime: showSlot.time,
        packageName: packageDetails.name,
        totalPrice: details.totalPrice,
        guests: details.guests
      });
      
      setIsBookingStepperOpen(false);
      setIsConfirmationModalOpen(true);
      
      return { success: true, status: newStatus };
    } catch (error) {
      console.error('Booking error details in App.tsx (overbooking check):', error);
      if (error instanceof Error && 'code' in error) {
        console.error('Firebase error code:', (error as any).code);
      }
      showToast('Er ging iets mis bij het maken van de reservering.', 'error');
      return { success: false, status: 'failed' };
    }
  };
  
  // --- ADMIN APPROVAL FOR OVERBOOKING ---
  const handleApproveOverbooking = async (bookingId: string) => {
    const bookingDoc = allBookings.find(b => b.id === bookingId); // Use Firestore document ID

    if (!bookingDoc) {
      showToast('Boeking niet gevonden.', 'error');
      return;
    }

    const showSlot = availableShowSlots.find(s => s.id === bookingDoc.showSlotId);
    if (!showSlot) {
      showToast('Bijbehorende show slot niet gevonden.', 'error');
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      // Update booking status to confirmed
      await updateDoc(bookingRef, {
        status: 'confirmed' as ReservationStatus,
        isOverbooking: false, // Mark as processed if it was an overbooking
        internalAdminNotes: `${bookingDoc.internalAdminNotes || ''} (Boeking goedgekeurd op ${new Date().toLocaleString()})`
      });

      // Update the show's bookedCount only if it was an overbooking being approved
      // or if the booking was pending for other reasons but fits now.
      // The main booking flow already handles non-overbooking count updates.
      // This approval specifically handles counts for bookings that were initially pending.
      const currentBookedCount = showSlot.bookedCount || 0;
      const guestsInBooking = bookingDoc.guests || 1;
      
      // Check if approving this booking will exceed capacity AFTER this approval
      // This logic is crucial: only update count if it was genuinely pending due to capacity or admin review
      // If it was pending and now fits, or is an approved overbooking, update count.
      if (bookingDoc.status === 'pending_approval') { // Check original status before update
        await updateDoc(doc(db, 'shows', bookingDoc.showSlotId), {
          bookedCount: currentBookedCount + guestsInBooking
        });
        setAvailableShowSlots(prev => prev.map(s => s.id === bookingDoc.showSlotId ? {...s, bookedCount: currentBookedCount + guestsInBooking} : s));
      }

      showToast('Boeking succesvol goedgekeurd!', 'success');
    } catch (error) {
      console.error('Error approving booking:', error);
      showToast('Fout bij goedkeuren boeking.', 'error');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { 
        status: 'rejected' as ReservationStatus,
        internalAdminNotes: `Afgekeurd op ${new Date().toLocaleString()}`
      });
      // Note: bookedCount is not adjusted here as the booking was never confirmed to take a slot.
      showToast('Boeking afgewezen.', 'success');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      showToast('Fout bij afwijzen boeking.', 'error');
    }
  };

  const handleWaitlistBooking = async (bookingId: string) => {
    try {
      const bookingToWaitlist = allBookings.find(b => b.id === bookingId);
      if (!bookingToWaitlist) {
        showToast('Boeking niet gevonden om op wachtlijst te plaatsen.', 'error');
        return;
      }

      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { 
        status: 'waitlisted' as ReservationStatus,
        internalAdminNotes: `Verplaatst naar wachtlijst op ${new Date().toLocaleString()}`
      });
      
      // Optionally, add to a separate 'waitingList' collection if not already there
      // For now, just updating status. A more robust system might move/copy it.
      // We assume the existing handleAddToWaitingList is for users, this is admin action.
      // Let's ensure the WaitingListEntry structure is compatible or add a simplified version.
      const waitingListEntryData: Omit<WaitingListEntry, 'id' | 'creationTimestamp' | 'status' | 'showInfo'> = {
        showSlotId: bookingToWaitlist.showSlotId,
        name: bookingToWaitlist.name,
        email: bookingToWaitlist.email,
        phone: bookingToWaitlist.phone,
        guests: bookingToWaitlist.guests,
        dateAdded: new Date().toISOString(),
        // customerId: bookingToWaitlist.customerId, // If available and needed
        // notes: `From rejected booking ${bookingId}`, // Example note
      };
      // This re-uses the existing waiting list logic, which might need adjustment
      // if admin-added entries have different requirements.
      // For simplicity, we'll assume it's okay for now.
      await handleAddToWaitingList(waitingListEntryData); 

      showToast('Boeking op wachtlijst geplaatst.', 'success');
    } catch (error) {
      console.error('Error moving booking to waitlist:', error);
      showToast('Fout bij plaatsen op wachtlijst.', 'error');
    }
  };


  // DEFINITION OF THE MISSING FUNCTION
  const handleOpenWaitingListModal = (slotId: string) => {
    setWaitingListModalSlotId(slotId);
    setIsWaitingListModalOpen(true);
  };
  
  const handleAddToWaitingList = async (entryData: Omit<WaitingListEntry, 'id' | 'creationTimestamp' | 'status' | 'showInfo'>) => { // dateAdded is now part of entryData
    try {
      const showSlot = availableShowSlots.find(s => s.id === entryData.showSlotId);
      if (!showSlot) {
        showToast('Kan niet toevoegen: show niet gevonden.', 'error');
        return false;
      }
      const newEntry: Omit<WaitingListEntry, 'id'> = {
        ...entryData,
        showInfo: { date: showSlot.date, time: showSlot.time, name: showSlot.name },
        creationTimestamp: new Date().toISOString(), // Changed from timestamp
        status: 'pending',
      };
      await addDoc(collection(db, 'waitingList'), newEntry);
      showToast('Succesvol toegevoegd aan de wachtlijst!', 'success');
      setIsWaitingListModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      showToast('Fout bij toevoegen aan wachtlijst.', 'error');
      return false;
    }
  };


  // --- RENDER LOGIC ---
  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {view === 'admin' && (
        <AdminPage
          availableShowSlots={availableShowSlots}
          allBookings={allBookings}
          // pendingApprovalBookings wordt nu afgeleid in AdminPage zelf
          onAddShowSlot={handleAddShowSlot}
          onRemoveShowSlot={handleRemoveShowSlot}
          onUpdateShowSlot={handleUpdateShowSlot}
          allPackages={SHOW_PACKAGES}
          specialAddons={SPECIAL_ADDONS}
          merchandiseItems={merchandiseItems}
          onAddMerchandise={handleAddMerchandise}
          onUpdateMerchandise={handleUpdateMerchandise}
          onDeleteMerchandise={handleDeleteMerchandise}
          onManualBookingSubmit={handleManualBookingSubmit}
          onUpdateBooking={handleUpdateBooking}
          bookingStats={{
            week: { count: 0, guests: 0 }, // Placeholder data
            month: { count: 0, guests: 0 }, // Placeholder data
            year: { count: 0, guests: 0 }    // Placeholder data
          }}
          waitingListEntries={waitingListEntries}
          onRemoveWaitingListEntry={handleRemoveWaitingListEntry} // This prop name is correct as per AdminPageProps definition in AdminPage.tsx
          onNavigateToUserView={() => setView('user')}
          onBookFromWaitingListModalOpen={(entry: WaitingListEntry) => { // Added type for entry
            console.log('Attempting to book from waiting list for:', entry);
            setInitialBookingData({
              selectedShowSlotId: entry.showSlotId,
              name: entry.name,
              email: entry.email,
              phone: entry.phone,
              guests: entry.guests,
            });
            setIsBookingStepperOpen(true);
            showToast('Boekingsformulier geopend voor wachtlijstitem.', 'info');
          }}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer} // Corrected typo
          onDeleteCustomer={handleDeleteCustomer}
          showToast={showToast}
          promoCodes={promoCodes}
          onAddPromoCode={handleAddPromoCode}
          onUpdatePromoCode={handleUpdatePromoCode}
          onDeletePromoCode={handleDeletePromoCode}
          applyPromoCode={applyPromoCode}
          auditLogs={auditLogs}
          invoices={invoices}
          onGenerateInvoice={handleGenerateInvoice}
          onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          onGenerateInvoicesForDay={handleGenerateInvoicesForDay}
          onCreateCreditNote={handleCreateCreditNote}
          onSplitInvoice={handleSplitInvoice}
          staffMembers={staffMembers}
          scheduledShifts={scheduledShifts}
          onAddStaffMember={handleAddStaffMember}
          onUpdateStaffMember={handleUpdateStaffMember}
          onDeleteStaffMember={handleDeleteStaffMember}
          onScheduleStaff={handleScheduleStaff}
          onUnscheduleStaff={handleUnscheduleStaff}
          onApproveOverbooking={handleApproveOverbooking}
          appSettings={appSettings}
          onUpdateDefaultShowAndPackage={handleUpdateDefaultShowAndPackage}
        />
      )}
      {view === 'user' && (
        <UserBookingPage
          availableShowSlots={availableShowSlots}
          onBookShow={handleBookShow}
          onOpenWaitingListModal={handleOpenWaitingListModal} // This prop name is correct as per UserBookingPageProps definition in UserBookingPage.tsx
          merchandiseItems={merchandiseItems}
          allPackages={SHOW_PACKAGES}
          appSettings={appSettings}
          // Add the missing props that UserBookingPage expects, if any, or adjust UserBookingPageProps
          onNavigateToAdminView={() => setView('admin')} // Assuming this is the intended navigation
          onNavigateToUserAccountView={() => { console.log('Navigate to user account - not implemented'); showToast('Gebruikersaccount nog niet beschikbaar', 'info');}} // Placeholder
        />
      )}

      {isBookingStepperOpen && (
        <BookingStepper
          isOpen={isBookingStepperOpen}
          onClose={() => setIsBookingStepperOpen(false)}
          onSubmit={handleBookingSubmit}
          availableShowSlots={availableShowSlots}
          merchandiseItems={merchandiseItems}
          promoCodes={promoCodes}
          applyPromoCode={applyPromoCode}
          showPackages={SHOW_PACKAGES}
          specialAddons={SPECIAL_ADDONS}
          initialData={initialBookingData}
          appSettings={appSettings}
          loggedInCustomer={null}
          onOpenWaitingListModal={handleOpenWaitingListModal}
          showInfoModal={(_title, message, status) => showToast(message as string, status || 'info')} // Mark title as unused
        />
      )}

      {isWaitingListModalOpen && waitingListModalSlotId && (
        <WaitingListModal
          isOpen={isWaitingListModalOpen}
          onClose={() => setIsWaitingListModalOpen(false)}
          onSubmit={handleAddToWaitingList} // Gebruik de gecorrigeerde handler
          showSlotId={waitingListModalSlotId}
          showSlotInfo={availableShowSlots.find(s => s.id === waitingListModalSlotId) || undefined}
        />
      )}

      {/* Booking Confirmation Modal */}
      {confirmationData && (
        <BookingConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => {
            setIsConfirmationModalOpen(false);
            setConfirmationData(null);
          }}
          reservationId={confirmationData.reservationId}
          customerName={confirmationData.customerName}
          customerEmail={confirmationData.customerEmail}
          showDate={confirmationData.showDate}
          showTime={confirmationData.showTime}
          packageName={confirmationData.packageName}
          totalPrice={confirmationData.totalPrice}
          guests={confirmationData.guests}
        />
      )}
    </>
  );
};

export default App;
