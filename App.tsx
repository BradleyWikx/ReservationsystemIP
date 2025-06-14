import React, { useState, useEffect, useCallback } from 'react';
import { AdminPage } from './components/admin/AdminPage';
import { UserBookingPage } from './components/UserBookingPage';
import { BookingStepper } from './components/booking/BookingStepper';
import { SimpleBookingStepper } from './components/SimpleBookingStepper';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { SimpleBookingModal } from './components/SimpleBookingModal';
import { TestModal } from './components/TestModal';
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
  const handleAddShowSlot = async (newSlotData: Omit<ShowSlot, 'id' | 'bookedCount' | 'isManuallyClosed'>) => {
    await addDoc(collection(db, 'shows'), { ...newSlotData, bookedCount: 0, isManuallyClosed: false });
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
  const applyPromoCode = (codeString: string, currentBookingSubtotal: number) => {
    return { success: false, message: 'Promo code functionaliteit niet geïmplementeerd' };
  };
  // Bookings
  const handleUpdateBooking = async (updatedBooking: ReservationDetails, adminConsentsToOverbooking: boolean = false) => {
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
  const handleGenerateInvoice = async (reservationId: string) => {
    showToast('Factuur genereren nog niet geïmplementeerd', 'info');
    return null;
  };
  const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status'], paymentDetails?: string) => {
    updateDoc(doc(db, 'invoices', invoiceId), { status, paymentDetails });
    showToast('Factuurstatus bijgewerkt!', 'success');
  };
  const handleGenerateInvoicesForDay = async (selectedDate: string) => {
    showToast('Dagfacturatie nog niet geïmplementeerd', 'info');
    return { successCount: 0, failCount: 0, alreadyExistsCount: 0 };
  };
  const handleCreateCreditNote = (originalInvoiceId: string) => {
    showToast('Creditnota nog niet geïmplementeerd', 'info');
    return null;
  };
  const handleSplitInvoice = async (originalInvoiceId: string, splitType: 'equalParts' | 'byAmount', splitValue: number) => {
    showToast('Factuur splitsen nog niet geïmplementeerd', 'info');
    return false;
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
      let newStatus: ReservationStatus = 'pending_approval';
      let isOverbookingAttempt = false;

      if (currentBookedCount + requestedGuests > slotCapacity) {
        isOverbookingAttempt = true;
        // For overbookings, status remains 'pending_approval' for admin to decide.
        // Admin will need to explicitly approve this.
        showToast('Deze boeking overschrijdt de capaciteit en vereist goedkeuring.', 'warning');
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
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = allBookings.find(b => b.reservationId === bookingId); // Assuming reservationId is unique and used as doc ID

    if (!bookingDoc || !bookingDoc.isOverbooking) {
      showToast('Boeking niet gevonden of geen overboeking.', 'error');
      return;
    }

    const showSlot = availableShowSlots.find(s => s.id === bookingDoc.showSlotId);
    if (!showSlot) {
      showToast('Bijbehorende show slot niet gevonden.', 'error');
      return;
    }

    try {
      // Update booking status to confirmed
      await updateDoc(bookingRef, {
        status: 'confirmed' as ReservationStatus,
        isOverbooking: false, // Mark as processed
        internalAdminNotes: `${bookingDoc.internalAdminNotes || ''} (Overboeking goedgekeurd op ${new Date().toLocaleString()})`
      });

      // Update the show's bookedCount
      const newBookedCount = (showSlot.bookedCount || 0) + (bookingDoc.guests || 1);
      await updateDoc(doc(db, 'shows', bookingDoc.showSlotId), {
        bookedCount: newBookedCount
      });

      setAllBookings(prev => prev.map(b => b.reservationId === bookingId ? {...b, status: 'confirmed', isOverbooking: false } : b));
      setAvailableShowSlots(prev => prev.map(s => s.id === bookingDoc.showSlotId ? {...s, bookedCount: newBookedCount} : s));

      showToast('Overboeking succesvol goedgekeurd en capaciteit bijgewerkt!', 'success');
    } catch (error) {
      console.error('Error approving overbooking:', error);
      showToast('Fout bij goedkeuren overboeking.', 'error');
    }
  };

  // DEFINITION OF THE MISSING FUNCTION
  const handleOpenWaitingListModal = (slotId: string) => {
    setWaitingListModalSlotId(slotId);
    setIsWaitingListModalOpen(true);
  };

  // --- RENDER LOGIC ---
  let pageContent;
  if (view === 'admin') {
    pageContent = <AdminPage
      availableShowSlots={availableShowSlots}
      allBookings={allBookings}
      pendingApprovalBookings={allBookings.filter(b => b.status === 'pending_approval')}
      onInitiateBookingApproval={() => {}}
      onRejectPendingBooking={() => {}}
      onWaitlistPendingBooking={() => {}}
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
      bookingStats={{week: {count: 0, guests: 0}, month: {count: 0, guests: 0}, year: {count: 0, guests: 0}}}
      waitingListEntries={waitingListEntries}
      removeWaitingListEntry={handleRemoveWaitingListEntry}
      onNavigateToUserView={() => setView('user')}
      onBookFromWaitingListModalOpen={() => {}}
      customers={customers}
      onAddCustomer={handleAddCustomer}
      onUpdateCustomer={handleUpdateCustomer}
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
      appSettings={appSettings}
      onUpdateDefaultShowAndPackage={handleUpdateDefaultShowAndPackage}
      onApproveOverbooking={handleApproveOverbooking} // Pass the new handler
    />;
  } else {
    pageContent = <UserBookingPage
      availableShowSlots={availableShowSlots}
      onBookShow={handleBookShow}
      allPackages={SHOW_PACKAGES}
      onNavigateToAdminView={() => setView('admin')}
      onNavigateToUserAccountView={() => {}}
    />;
  }

  return (
    <>
      <div style={{position: 'fixed', top: 10, right: 10, zIndex: 1000}}>
        {view === 'admin' ? (
          <button onClick={() => setView('user')} className="px-4 py-2 bg-blue-600 text-white rounded">Verlaat Admin</button>
        ) : (
          <button onClick={() => setView('admin')} className="px-4 py-2 bg-green-600 text-white rounded">Admin</button>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {pageContent}
      
      {/* BookingStepper Modal */}
      <BookingStepper
        isOpen={isBookingStepperOpen}
        onClose={() => setIsBookingStepperOpen(false)}
        onSubmit={handleBookingSubmit}
        allPackages={SHOW_PACKAGES}
        specialAddons={SPECIAL_ADDONS} // Pass SPECIAL_ADDONS
        availableShowSlots={availableShowSlots}
        merchandiseItems={merchandiseItems}
        initialData={initialBookingData}
        onOpenWaitingListModal={handleOpenWaitingListModal}
        applyPromoCode={applyPromoCode} // Pass de echte applyPromoCode functie
        loggedInCustomer={null} // Voor nu null, later te implementeren
        onLogout={() => { showToast("Uitgelogd (placeholder)", "info"); /* Implementeer echte logout */ }}
        showInfoModal={(_title, message, status) => showToast(message as string, status || 'info')} // Aangepast om ReactNode te accepteren
      />
      
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

      <WaitingListModal
        isOpen={isWaitingListModalOpen}
        onClose={() => setIsWaitingListModalOpen(false)}
        showSlotId={waitingListModalSlotId || ''} // Pass empty string if null to satisfy type, or adjust type in props
        onSubmit={async (data) => { // Changed from onSubmitWaitingList to onSubmit, and ensure data type is correct
          if (!data.showSlotId) { // data now directly contains showSlotId from the form
            showToast('Kan niet toevoegen aan wachtlijst: show ID mist.', 'error');
            return {success: false};
          }
          const entry: Omit<WaitingListEntry, 'id' | 'timestamp' | 'showInfo' | 'dateAdded' | 'status'> & { timestamp: string, status: WaitingListEntry['status'] } = {
            showSlotId: data.showSlotId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            guests: data.guests,
            timestamp: new Date().toISOString(),
            status: 'pending',
            // customerId and notes can be added if form supports them
          };
          try {
            await addDoc(collection(db, 'waitingList'), entry);
            showToast('Succesvol toegevoegd aan de wachtlijst!', 'success');
            setIsWaitingListModalOpen(false);
            return {success: true};
          } catch (error) {
            console.error("Error adding to waiting list:", error);
            showToast('Fout bij toevoegen aan wachtlijst.', 'error');
            return {success: false};
          }
        }}
        showSlotInfo={availableShowSlots.find(s => s.id === waitingListModalSlotId) || undefined}
      />
    </>
  );
};

export default App;
