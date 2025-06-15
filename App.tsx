import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { AdminPage } from './components/admin/AdminPage';
import { UserBookingPage } from './components/UserBookingPage';
import { BookingStepper } from './components/booking/BookingStepper';
import { WaitingListModal } from './components/user/WaitingListModal'; // Corrected import path
import { ToastContainer, ToastMessage } from './components/shared/ToastNotifications';
import { sendBookingConfirmationEmail, sendBookingConfirmationToAdmin, BookingEmailData } from './services/emailService';
import { AppSettings, ReservationDetails, ShowSlot, MerchandiseItem, PromoCode, StaffMember, Customer, Invoice, WaitingListEntry, AuditLogEntry, ScheduledShift, BookingData, ReservationStatus, PackageOption } from './types'; // Added PackageOption for BookFromWaitingListModal
import { db } from './src/firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { SHOW_PACKAGES, SPECIAL_ADDONS } from './constants';
import { BookFromWaitingListModal } from './components/admin/BookFromWaitingListModal'; // Added


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
  const [isBookFromWaitingListModalOpen, setIsBookFromWaitingListModalOpen] = useState(false); 
  const [selectedWaitingListEntryForBooking, setSelectedWaitingListEntryForBooking] = useState<WaitingListEntry | null>(null); 
  const [initialBookingData, setInitialBookingData] = useState<Partial<BookingData>>({});
  
  // Booking confirmation modal state (Commented out: unused)
  // const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  // const [confirmationData, setConfirmationData] = useState<{
  //   reservationId: string;
  //   customerName: string;
  //   customerEmail: string;
  //   showDate: string;
  //   showTime: string;
  //   packageName: string;
  //   totalPrice: number;
  //   guests: number;
  // } | null>(null);

  // Adapter function for BookingStepper's showInfoModal prop
  const showInfoModalAdapter = (title: string, message: React.ReactNode, status?: 'success' | 'error' | 'info' | 'warning') => {
    // Convert status to ToastMessage['type']
    let toastType: ToastMessage['type'] = 'info'; // Default type
    if (status === 'success') toastType = 'success';
    else if (status === 'error') toastType = 'error';
    else if (status === 'warning') toastType = 'warning';
    // For React.ReactNode, we might need to be careful if it's complex.
    // For now, assuming it can be stringified or is a simple string.
    // If message is a complex ReactNode, showToast might need adjustment or this adapter needs a different modal.
    const messageString = typeof message === 'string' ? message : String(message); 
    showToast(`${title}: ${messageString}`, toastType);
  };

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
  const handleUpdateBooking = async (updatedBooking: ReservationDetails, originalShowSlotId?: string, adminConsentsToOverbooking: boolean = false) => {
    const { id, ...data } = updatedBooking as any;
    const bookingRef = doc(db, 'bookings', id);

    try {
      await updateDoc(bookingRef, { 
        ...data,
        lastModifiedTimestamp: new Date().toISOString(),
      });

      // If showSlotId has changed, adjust capacities
      if (originalShowSlotId && updatedBooking.showSlotId !== originalShowSlotId) {
        const oldSlotRef = doc(db, 'shows', originalShowSlotId);
        const newSlotRef = doc(db, 'shows', updatedBooking.showSlotId);
        const guests = updatedBooking.guests || 0;

        // Decrement old slot
        const oldSlotDoc = await getDoc(oldSlotRef); 
        if (oldSlotDoc.exists()) {
          const oldSlotData = oldSlotDoc.data() as ShowSlot;
          await updateDoc(oldSlotRef, { 
            bookedCount: Math.max(0, (oldSlotData.bookedCount || 0) - guests)
          });
        }
        
        // Increment new slot
        const newSlotDoc = await getDoc(newSlotRef);
        if (newSlotDoc.exists()) {
          const newSlotData = newSlotDoc.data() as ShowSlot;
          const newBookedCount = (newSlotData.bookedCount || 0) + guests;
          
          if (newBookedCount > newSlotData.capacity && !adminConsentsToOverbooking) {
            showToast('Verplaatsen niet mogelijk: nieuwe show is vol. Overboeking niet toegestaan.', 'error');
            // Potentially revert booking update here or throw an error to be caught by caller
            if (!updatedBooking.isOverbooking) {
                await updateDoc(bookingRef, { isOverbooking: true, status: 'pending_approval' });
            }
            showToast('Boeking verplaatst, maar wacht op goedkeuring (overboeking).', 'warning');
          } else {
            await updateDoc(newSlotRef, { 
              bookedCount: newBookedCount 
            });
            if (updatedBooking.isOverbooking && newBookedCount <= newSlotData.capacity) {
                // If it was an overbooking but now fits, update status
                await updateDoc(bookingRef, { isOverbooking: false, status: 'confirmed' });
            }
          }
        }
        
        // Update local state for show slots
        setAvailableShowSlots(prevSlots => {
          return prevSlots.map(s => {
            if (s.id === originalShowSlotId) {
              return { ...s, bookedCount: Math.max(0, (s.bookedCount || 0) - guests) };
            }
            if (s.id === updatedBooking.showSlotId) {
              return { ...s, bookedCount: (s.bookedCount || 0) + guests }; 
            }
            return s;
          });
        });

        // Add to reschedule history
        const rescheduleEntry = {
          oldShowSlotId: originalShowSlotId,
          newShowSlotId: updatedBooking.showSlotId,
          rescheduledBy: 'admin' as 'user' | 'admin', // Assuming admin action for now
          timestamp: new Date().toISOString(),
          // reason: adminNotes, // TODO: Capture reason from UI if provided
        };
        const currentHistory = updatedBooking.rescheduleHistory || [];
        await updateDoc(bookingRef, { 
          rescheduleHistory: [...currentHistory, rescheduleEntry]
        });

        showToast('Boeking succesvol verplaatst en capaciteiten bijgewerkt!', 'success');
      } else {
        showToast('Boeking bijgewerkt!', 'success');
      }
      
      // Update local booking state
      setAllBookings(prevBookings => 
        prevBookings.map(b => b.id === id ? { ...b, ...data, lastModifiedTimestamp: new Date().toISOString(), rescheduleHistory: data.rescheduleHistory } : b)
      );
      return true;
    } catch (error) {
      console.error("Error updating booking or show capacities:", error);
      showToast('Fout bij bijwerken boeking of show capaciteiten.', 'error');
      return false;
    }
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
  const handleUpdateAppSettings = async (updatedSettings: Partial<AppSettings>) => {
    try {
      // Assuming 'main' is the document ID for your single app settings document
      await updateDoc(doc(db, 'appSettings', 'main'), updatedSettings);
      setAppSettings(prev => ({ ...prev, ...updatedSettings }));
      showToast('Instellingen bijgewerkt!', 'success');
    } catch (error) {
      console.error('Error updating app settings:', error);
      showToast('Fout bij bijwerken instellingen.', 'error');
    }
  };

  // Booking handlers
  const handleBookShow = (slot?: ShowSlot) => {
    if (slot) {
      console.log('Booking initiated for specific slot:', slot);
      setInitialBookingData({ selectedShowSlotId: slot.id });
    } else {
      console.log('Booking initiated without a pre-selected slot.');
      setInitialBookingData({}); // Clear any previous pre-selection
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
      let newStatus: ReservationStatus = 'pending_approval'; 
      let isOverbookingFlag = false;

      if (currentBookedCount + requestedGuests > slotCapacity) {
        isOverbookingFlag = true;
        newStatus = 'pending_approval'; // Explicitly set for overbooking
        showToast('Deze boeking overschrijdt de capaciteit en vereist goedkeuring als overboeking.', 'warning');
      } else {
        newStatus = 'confirmed'; // Confirm directly if not an overbooking
        isOverbookingFlag = false; // Explicitly set for clarity
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
        isOverbooking: isOverbookingFlag, // Use the determined flag
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
            .filter(([_key, value]) => value !== undefined)
        );
      };
      
      const cleanBookingData = removeUndefinedValues(bookingObjectForFirebase);

      console.log('Saving cleaned booking data (overbooking status:', isOverbookingFlag, ') to Firebase:', cleanBookingData);

      if (cleanBookingData === undefined || Object.keys(cleanBookingData).length === 0) {
          console.error("Critical error: cleanBookingData is undefined or empty. Original for Firebase:", bookingObjectForFirebase, "Original details:", details);
          showToast('Interne fout bij voorbereiden boeking (lege data).', 'error');
          return { success: false, status: 'failed' };
      }
      
      const docRef = await addDoc(collection(db, 'bookings'), cleanBookingData);
      
      // Only update bookedCount if it's confirmed AND NOT an overbooking.
      // Overbookings' counts are handled by handleApproveOverbooking.
      if (newStatus === 'confirmed' && !isOverbookingFlag) {
        await updateDoc(doc(db, 'shows', details.showSlotId), {
          bookedCount: currentBookedCount + requestedGuests
        });
        // Update local state for immediate reflection if needed, or rely on Firestore listener
        setAvailableShowSlots(prevSlots => 
          prevSlots.map(s => 
            s.id === details.showSlotId 
            ? { ...s, bookedCount: currentBookedCount + requestedGuests } 
            : s
          )
        );
      }

      console.log('Booking saved successfully with ID:', docRef.id, '(overbooking status:', isOverbookingFlag, ', final status:', newStatus, ')');
      
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
      
      // Commented out as BookingConfirmationModal is not currently used
      // setConfirmationData({
      //   reservationId,
      //   customerName: details.name,
      //   customerEmail: details.email,
      //   showDate: showSlot.date,
      //   showTime: showSlot.time,
      //   packageName: packageDetails.name,
      //   totalPrice: details.totalPrice,
      //   guests: details.guests
      // });
      
      setIsBookingStepperOpen(false);
      // setIsConfirmationModalOpen(true); // Commented out
      
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
    const bookingDocFromState = allBookings.find(b => b.id === bookingId); 

    if (!bookingDocFromState) {
      showToast('Boeking niet gevonden in de huidige lijst.', 'error');
      return;
    }

    const showSlot = availableShowSlots.find(s => s.id === bookingDocFromState.showSlotId);
    if (!showSlot) {
      showToast('Bijbehorende show slot niet gevonden.', 'error');
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      
      // Update booking status to confirmed and clear overbooking flag
      await updateDoc(bookingRef, {
        status: 'confirmed' as ReservationStatus,
        isOverbooking: false, 
        internalAdminNotes: `${bookingDocFromState.internalAdminNotes || ''} (Overboeking goedgekeurd op ${new Date().toLocaleString()})`
      });

      // Correctly update the show's bookedCount
      // This function is specifically for approving bookings that were pending (often due to overbooking)
      const currentBookedCount = showSlot.bookedCount || 0;
      const guestsInBooking = bookingDocFromState.guests || 1;
      
      await updateDoc(doc(db, 'shows', bookingDocFromState.showSlotId), {
        bookedCount: currentBookedCount + guestsInBooking
      });
      
      // Update local state for immediate UI reflection
      setAvailableShowSlots(prev => prev.map(s => 
        s.id === bookingDocFromState.showSlotId 
        ? { ...s, bookedCount: currentBookedCount + guestsInBooking } 
        : s
      ));
      setAllBookings(prev => prev.map(b => 
        b.id === bookingId 
        ? { ...b, status: 'confirmed', isOverbooking: false } 
        : b
      ));

      showToast('Overboeking succesvol goedgekeurd en bevestigd!', 'success');
    } catch (error) {
      console.error('Error approving overbooking:', error);
      showToast('Fout bij goedkeuren overboeking.', 'error');
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string, cancelledBy: 'user' | 'admin') => {
    const bookingToCancel = allBookings.find(b => b.id === bookingId);
    if (!bookingToCancel) {
      showToast('Te annuleren boeking niet gevonden.', 'error');
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const cancellationTimestamp = new Date().toISOString();
      let internalNotesUpdate = `${bookingToCancel.internalAdminNotes || ''}`;
      internalNotesUpdate += `\nGeannuleerd door ${cancelledBy} op ${new Date(cancellationTimestamp).toLocaleString()} vanwege: ${reason}`;

      await updateDoc(bookingRef, { 
        status: 'cancelled' as ReservationStatus,
        cancellationReason: reason,
        cancelledBy: cancelledBy,
        cancellationTimestamp: cancellationTimestamp,
        internalAdminNotes: internalNotesUpdate.trim(),
      });

      // If the booking was confirmed (and not an overbooking that wasn't approved yet), adjust the show's bookedCount
      if (bookingToCancel.status === 'confirmed' && !bookingToCancel.isOverbooking) {
        const showSlot = availableShowSlots.find(s => s.id === bookingToCancel.showSlotId);
        if (showSlot) {
          const currentBookedCount = showSlot.bookedCount || 0;
          const guestsInBooking = bookingToCancel.guests || 0;
          const newBookedCount = Math.max(0, currentBookedCount - guestsInBooking);
          
          await updateDoc(doc(db, 'shows', bookingToCancel.showSlotId), {
            bookedCount: newBookedCount,
            // availableSlots: showSlot.capacity - newBookedCount // Or let it be derived
          });
          
          setAvailableShowSlots(prevSlots => 
            prevSlots.map(s => 
              s.id === bookingToCancel.showSlotId 
              ? { ...s, bookedCount: newBookedCount } 
              : s
            )
          );
        }
      }
      
      setAllBookings(prevBookings => 
        prevBookings.map(b => 
          b.id === bookingId 
          ? { 
              ...b, 
              status: 'cancelled' as ReservationStatus,
              cancellationReason: reason,
              cancelledBy: cancelledBy,
              cancellationTimestamp: cancellationTimestamp,
              internalAdminNotes: internalNotesUpdate.trim(),
            } 
          : b
        )
      );

      showToast('Boeking succesvol geannuleerd.', 'success');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast('Fout bij annuleren boeking.', 'error');
    }
  };

  // Adapter for AdminPage's onDeleteBooking prop
  const handleDeleteBookingAdapter = async (bookingId: string) => {
    // For now, admin cancellations via this path will use a default reason.
    // Ideally, the UI in AdminPage/BookingViewer would prompt for a reason.
    await handleCancelBooking(bookingId, "Geannuleerd door admin via algemene verwijderknop", "admin");
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

  const handleWaitlistBooking = async (bookingId: string): Promise<void> => {
    const bookingToMove = allBookings.find(b => b.id === bookingId);
    if (!bookingToMove) {
      showToast('Te verplaatsen boeking niet gevonden.', 'error');
      return;
    }

    const showSlot = availableShowSlots.find(s => s.id === bookingToMove.showSlotId);
    if (!showSlot) {
      showToast('Bijbehorende show niet gevonden voor wachtlijstplaatsing.', 'error');
      return;
    }

    try {
      // 1. Create a new waiting list entry
      const waitingListEntryData: Omit<WaitingListEntry, 'id'> = {
        name: bookingToMove.name,
        email: bookingToMove.email,
        phone: bookingToMove.phone,
        guests: bookingToMove.guests,
        showSlotId: bookingToMove.showSlotId,
        timestamp: new Date().toISOString(),
        status: 'pending',
        showInfo: {
          date: showSlot.date,
          time: showSlot.time,
          name: showSlot.name,
        },
        notes: `Verplaatst van reservering ${bookingToMove.reservationId} (status: ${bookingToMove.status}) door admin. Originele notities: ${bookingToMove.internalAdminNotes || ''}`,
      };
      await addDoc(collection(db, 'waitingList'), waitingListEntryData);

      // 2. Update the original booking's status
      // If the booking was 'pending_approval' and an overbooking, its count was not added.
      // If it was 'pending_approval' maar NIET een overboeking, dan was de status al bevestigd.
      // Dus, we hoeven de bookedCount van de show niet aan te passen bij het verplaatsen van een wachtlijstboeking.
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'moved_to_waitlist' as ReservationStatus,
        internalAdminNotes: `${bookingToMove.internalAdminNotes || ''} (Verplaatst naar wachtlijst op ${new Date().toLocaleString()})`,
      });
      
      // Update local state for immediate UI reflection
      setAllBookings(prevBookings => 
        prevBookings.map(b => 
          b.id === bookingId 
          ? { ...b, status: 'moved_to_waitlist' as ReservationStatus } 
          : b
        )
      );
      // The new waiting list entry will be picked up by the onSnapshot listener for waitingList.

      showToast(`Boeking ${bookingToMove.reservationId} is naar de wachtlijst verplaatst.`, 'success');
    } catch (error) {
      console.error('Error moving booking to waiting list:', error);
      showToast('Fout bij verplaatsen van boeking naar wachtlijst.', 'error');
    }
  };

  const handleOpenWaitingListModal = (slotId: string) => {
    setWaitingListModalSlotId(slotId);
    setIsWaitingListModalOpen(true);
  };

  const handleWaitingListSubmit = async (details: { name: string; email: string; phone: string; guests: number; notes?: string; showSlotId: string }): Promise<boolean> => {
    const showSlot = availableShowSlots.find(s => s.id === details.showSlotId);
    if (!showSlot) {
      showToast('Geselecteerde show niet gevonden voor wachtlijst.', 'error');
      return false;
    }

    try {
      const waitingListEntry: Omit<WaitingListEntry, 'id'> = {
        ...details,
        timestamp: new Date().toISOString(),
        status: 'pending',
        showInfo: {
          date: showSlot.date,
          time: showSlot.time,
          name: showSlot.name,
        }
      };
      await addDoc(collection(db, 'waitingList'), waitingListEntry);
      showToast('Succesvol toegevoegd aan de wachtlijst!', 'success');
      setIsWaitingListModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      showToast('Fout bij toevoegen aan wachtlijst.', 'error');
      return false;
    }
  };

  const handleToggleManualCloseShow = async (slotId: string, isClosed: boolean) => {
    const showSlotRef = doc(db, 'shows', slotId);
    try {
      await updateDoc(showSlotRef, { isManuallyClosed: isClosed });
      setAvailableShowSlots(prevSlots => 
        prevSlots.map(s => s.id === slotId ? { ...s, isManuallyClosed: isClosed } : s)
      );
      showToast(`Show slot ${isClosed ? 'gesloten' : 'geopend'}.`, 'success');
    } catch (error) {
      console.error('Error updating show manual close state:', error);
      showToast('Fout bij bijwerken show status.', 'error');
    }
  };

  const handleOpenBookFromWaitingListModal = (entry: WaitingListEntry) => {
    setSelectedWaitingListEntryForBooking(entry);
    setIsBookFromWaitingListModalOpen(true);
  };

  const handleBookFromWaitingList = async (waitingListEntryId: string, packageId: string): Promise<boolean> => {
    const entry = waitingListEntries.find(e => e.id === waitingListEntryId);
    if (!entry) {
      showToast('Wachtlijst entry niet gevonden.', 'error');
      return false;
    }
    const showSlot = availableShowSlots.find(s => s.id === entry.showSlotId);
    if (!showSlot) {
      showToast('Show niet gevonden voor deze wachtlijst entry.', 'error');
      return false;
    }
    const selectedPackage = SHOW_PACKAGES.find(p => p.id === packageId);
    if (!selectedPackage) {
      showToast('Pakket niet gevonden.', 'error');
      return false;
    }

    const priceTier = showSlot.priceTier || 'default';
    if (!selectedPackage.priceLevels || !selectedPackage.priceLevels[priceTier]) {
        showToast(`Prijsniveau '${priceTier}' niet gevonden voor pakket ${selectedPackage.name}. Controleer package configuratie.`, 'error');
        return false;
    }
    const pricePerPerson = selectedPackage.priceLevels[priceTier].pricePerPerson;
    const totalPrice = pricePerPerson * entry.guests;

    // Overbooking check
    const isOverbookingAttempt = showSlot.bookedCount + entry.guests > showSlot.capacity;
    if (isOverbookingAttempt && !confirm('Deze show is vol of de boeking overschrijdt de capaciteit. Wilt u doorgaan met overboeken? Dit vereist admin goedkeuring.')) {
        showToast('Boeking geannuleerd, show is vol of overschrijdt capaciteit.', 'info');
        return false;
    }
    if (showSlot.isManuallyClosed && !confirm('Deze show is handmatig gesloten. Toch doorgaan met boeken? Dit kan een overboeking zijn en vereist mogelijk goedkeuring.')){
        showToast('Boeking geannuleerd, show is gesloten.', 'info');
        return false;
    }

    try {
      const reservationId = `WL_RES_${Date.now()}`;
      const bookingTimestamp = new Date().toISOString();
      
      const newBookingStatus: ReservationStatus = isOverbookingAttempt ? 'pending_approval' : 'confirmed';

      const newBooking: Omit<ReservationDetails, 'id'> = {
        reservationId,
        showSlotId: entry.showSlotId,
        packageId,
        packageName: selectedPackage.name,
        date: showSlot.date,
        time: showSlot.time,
        guests: entry.guests,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        bookingTimestamp,
        status: newBookingStatus,
        totalPrice,
        isOverbooking: isOverbookingAttempt,
        agreedToPrivacyPolicy: true, 
        bookedBy: 'admin_waitlist',
        // Potentially add notes from waiting list entry.notes to internalAdminNotes or specialRequests
        internalAdminNotes: entry.notes ? `Vanaf wachtlijst: ${entry.notes}` : 'Geboekt vanaf wachtlijst',
      };

      await addDoc(collection(db, 'bookings'), newBooking);
      
      if (!isOverbookingAttempt) { // Only update bookedCount if not an overbooking initially
        await updateDoc(doc(db, 'shows', showSlot.id), { 
          bookedCount: showSlot.bookedCount + entry.guests,
          availableSlots: showSlot.capacity - (showSlot.bookedCount + entry.guests)
        });
      }
      await updateDoc(doc(db, 'waitingList', waitingListEntryId), { status: 'booked' });

      showToast(`Boeking voor ${entry.name} succesvol aangemaakt vanaf wachtlijst! Status: ${newBookingStatus}`, 'success');
      setIsBookFromWaitingListModalOpen(false);
      setSelectedWaitingListEntryForBooking(null);
      return true;
    } catch (error) {
      console.error('Error booking from waiting list:', error);
      showToast('Fout bij boeken vanaf wachtlijst.', 'error');
      return false;
    }
  };


  // --- RENDER LOGIC ---
  // Calculate booking stats (example)
  const bookingStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    let weekCount = 0;
    let weekGuests = 0;
    let monthCount = 0;
    let monthGuests = 0;
    let yearCount = 0;
    let yearGuests = 0;

    allBookings.forEach(booking => {
      const bookingDate = new Date(booking.bookingTimestamp);
      if (booking.status === 'confirmed') { // Only count confirmed bookings for stats
        if (bookingDate >= oneWeekAgo) {
          weekCount++;
          weekGuests += booking.guests;
        }
        if (bookingDate >= firstDayOfMonth) {
          monthCount++;
          monthGuests += booking.guests;
        }
        if (bookingDate >= firstDayOfYear) {
          yearCount++;
          yearGuests += booking.guests;
        }
      }
    });

    return {
      week: { count: weekCount, guests: weekGuests },
      month: { count: monthCount, guests: monthGuests },
      year: { count: yearCount, guests: yearGuests },
    };
  }, [allBookings]);

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {view === 'admin' && (
        <AdminPage
          availableShowSlots={availableShowSlots}
          allBookings={allBookings}
          waitingListEntries={waitingListEntries}
          promoCodes={promoCodes}
          merchandiseItems={merchandiseItems}
          customers={customers}
          invoices={invoices}
          auditLogs={auditLogs}
          staffMembers={staffMembers}
          scheduledShifts={scheduledShifts}
          appSettings={appSettings}
          allPackages={SHOW_PACKAGES as PackageOption[]} // Added allPackages
          specialAddons={SPECIAL_ADDONS}
          bookingStats={bookingStats} // Added bookingStats
          onAddShowSlot={handleAddShowSlot}
          onRemoveShowSlot={handleRemoveShowSlot}
          onUpdateShowSlot={handleUpdateShowSlot}
          onAddMerchandise={handleAddMerchandise}
          onUpdateMerchandise={handleUpdateMerchandise}
          onDeleteMerchandise={handleDeleteMerchandise}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onAddPromoCode={handleAddPromoCode}
          onUpdatePromoCode={handleUpdatePromoCode}
          onDeletePromoCode={handleDeletePromoCode}
          applyPromoCode={applyPromoCode} // Added applyPromoCode
          onUpdateBooking={handleUpdateBooking}
          onApproveBooking={handleApproveOverbooking} 
          onRejectBooking={handleRejectBooking} 
          onWaitlistBooking={handleWaitlistBooking} 
          onDeleteBooking={handleDeleteBookingAdapter} // Use the new adapter
          onRemoveWaitingListEntry={handleRemoveWaitingListEntry}
          onNavigateToUserView={() => setView('user')} // Added onNavigateToUserView
          onAddStaffMember={handleAddStaffMember}
          onUpdateStaffMember={handleUpdateStaffMember}
          onDeleteStaffMember={handleDeleteStaffMember}
          onScheduleStaff={handleScheduleStaff}
          onUnscheduleStaff={handleUnscheduleStaff}
          onGenerateInvoice={handleGenerateInvoice}
          onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          onGenerateInvoicesForDay={handleGenerateInvoicesForDay}
          onCreateCreditNote={handleCreateCreditNote}
          onSplitInvoice={handleSplitInvoice}
          onUpdateDefaultShowAndPackage={handleUpdateDefaultShowAndPackage}
          onUpdateAppSettings={handleUpdateAppSettings}
          onManualBookingSubmit={handleManualBookingSubmit}
          showToast={showToast}
          onBookFromWaitingListModalOpen={handleOpenBookFromWaitingListModal} 
          onToggleManualCloseShow={handleToggleManualCloseShow} // Added onToggleManualCloseShow
      />
      )}
      {view === 'user' && (
        <UserBookingPage
          availableShowSlots={availableShowSlots}
          onBookShow={handleBookShow}
          onOpenWaitingListModal={handleOpenWaitingListModal}
          allPackages={SHOW_PACKAGES}
          onNavigateToAdminView={() => setView('admin')}
          onNavigateToUserAccountView={() => { console.log('Navigate to user account - not implemented'); showToast('Gebruikersaccount nog niet beschikbaar', 'info');}}
        />
      )}

      {isBookingStepperOpen && (
        <BookingStepper 
          isOpen={isBookingStepperOpen}
          onClose={() => setIsBookingStepperOpen(false)}
          onSubmit={handleBookingSubmit}
          showPackages={SHOW_PACKAGES}
          specialAddons={SPECIAL_ADDONS}
          availableShowSlots={availableShowSlots}
          merchandiseItems={merchandiseItems}
          appSettings={appSettings}
          initialData={initialBookingData}
          onOpenWaitingListModal={handleOpenWaitingListModal} 
          applyPromoCode={applyPromoCode}
          loggedInCustomer={null} // Placeholder, replace with actual logged-in customer state if available
          showInfoModal={showInfoModalAdapter} // Use adapter function
        />
      )}
      {isWaitingListModalOpen && waitingListModalSlotId && (
        <WaitingListModal 
          isOpen={isWaitingListModalOpen}
          onClose={() => setIsWaitingListModalOpen(false)}
          onSubmit={handleWaitingListSubmit} 
          showSlotId={waitingListModalSlotId}
          showSlotInfo={availableShowSlots.find(s => s.id === waitingListModalSlotId)}
          loggedInCustomer={null} // This prop is now correctly recognized by the imported WaitingListModal
        />
      )}
      {isBookFromWaitingListModalOpen && selectedWaitingListEntryForBooking && (
        <BookFromWaitingListModal
          isOpen={isBookFromWaitingListModalOpen}
          onClose={() => { setIsBookFromWaitingListModalOpen(false); setSelectedWaitingListEntryForBooking(null); }}
          waitingListEntry={selectedWaitingListEntryForBooking}
          showSlot={availableShowSlots.find(s => s.id === selectedWaitingListEntryForBooking.showSlotId)}
          allPackages={SHOW_PACKAGES as PackageOption[]} // Pass SHOW_PACKAGES, ensure type assertion if necessary
          onSubmit={handleBookFromWaitingList} 
        />
      )}
    </>
  );
};

export default App;
