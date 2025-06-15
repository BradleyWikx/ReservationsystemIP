import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShowSlot, ReservationDetails, PackageOption, MerchandiseItem, SpecialAddOn, Customer, PromoCode,
  AdminMode, WaitingListEntry, AuditLogEntry, Invoice, AppSettings, 
  ManualBookingPayload, StaffMember, ScheduledShift 
} from '../../types'; 
import { ShowManagement } from './ShowManagement';
import { BulkShowAdd } from './BulkShowAdd';
import { BookingViewer } from './BookingViewer';
import { PendingApprovals } from './PendingApprovals';
import { ManualBookingForm } from './ManualBookingForm';
import { EditBookingModal } from './EditBookingModal'; 
import { AdminSettings } from './AdminSettings'; 
import { AuditLogViewer } from './AuditLogViewer'; 
import { Dashboard } from './Dashboard'; 
import { DailyPrintout } from './DailyPrintout'; 
import { MerchandiseManager } from './MerchandiseManager'; 
import { PromoCodeManager } from './PromoCodeManager'; 
import { CustomerManagement } from './CustomerManagement'; 
import { WaitingListManager } from './WaitingListManager'; 

import type { ToastMessage } from '../shared/ToastNotifications';

const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform duration-200"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

interface NavSubItem {
  mode: AdminMode;
  label: string;
  count?: number;
}

interface NavItemCategory {
  mainLabel: string;
  items: NavSubItem[];
  isInitiallyOpen?: boolean;
}

export interface AdminPageProps {
  availableShowSlots: ShowSlot[];
  allBookings: ReservationDetails[];
  onAddShowSlot: (newSlotData: Omit<ShowSlot, 'id' | 'bookedCount' | 'availableSlots' | 'isManuallyClosed'>) => void;
  onRemoveShowSlot: (slotId: string) => Promise<void>;
  onUpdateShowSlot: (slot: ShowSlot) => void;
  allPackages: PackageOption[];
  specialAddons: SpecialAddOn[];
  merchandiseItems: MerchandiseItem[];
  onAddMerchandise: (item: Omit<MerchandiseItem, 'id'>) => void;
  onUpdateMerchandise: (item: MerchandiseItem) => void;
  onDeleteMerchandise: (itemId: string) => void;
  onManualBookingSubmit: (details: ManualBookingPayload) => Promise<boolean>;
  onUpdateBooking: (updatedBooking: ReservationDetails, originalShowSlotId?: string, adminConsentsToOverbooking?: boolean) => Promise<boolean>; // Modified signature
  bookingStats: {
    week: { count: number; guests: number };
    month: { count: number; guests: number };
    year: { count: number; guests: number };
  };
  waitingListEntries: WaitingListEntry[];
  onRemoveWaitingListEntry: (entryId: string) => Promise<void>; 
  onNavigateToUserView: () => void;
  customers: Customer[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'creationTimestamp' | 'lastUpdateTimestamp'>) => Promise<Customer | null>;
  onUpdateCustomer: (updatedCustomer: Customer) => Promise<boolean>;
  onDeleteCustomer: (customerId: string) => Promise<boolean>;
  showToast: (message: string, type: ToastMessage['type']) => void;
  promoCodes: PromoCode[];
  onAddPromoCode: (codeData: Omit<PromoCode, 'id' | 'timesUsed'>) => PromoCode | null;
  onUpdatePromoCode: (updatedCode: PromoCode) => boolean;
  onDeletePromoCode: (codeId: string) => Promise<boolean>;
  applyPromoCode: (codeString: string, currentBookingSubtotal: number) => { success: boolean; discountAmount?: number; message: string; appliedCodeObject?: PromoCode };
  auditLogs: AuditLogEntry[];
  invoices: Invoice[];
  onGenerateInvoice: (reservationId: string) => Promise<Invoice | null>; 
  appSettings: AppSettings;
  onUpdateAppSettings: (updatedSettings: Partial<AppSettings>) => void; 
  onUpdateDefaultShowAndPackage: (showId?: string, packageId?: string) => void;
  onApproveBooking: (bookingId: string) => Promise<void>; 
  onRejectBooking: (bookingId: string) => Promise<void>; 
  onWaitlistBooking: (bookingId: string) => Promise<void>; 
  onDeleteBooking: (bookingId: string) => Promise<void>; 
  onBookFromWaitingListModalOpen: (entry: WaitingListEntry) => void; 
  onToggleManualCloseShow: (slotId: string, isClosed: boolean) => Promise<void>; 
  // Added missing props that are passed from App.tsx
  staffMembers: StaffMember[];
  scheduledShifts: ScheduledShift[];
  onAddStaffMember: (data: Omit<StaffMember, 'id'>) => StaffMember;
  onUpdateStaffMember: (updatedStaffMember: StaffMember) => boolean;
  onDeleteStaffMember: (staffMemberId: string) => Promise<boolean>;
  onScheduleStaff: (shiftData: Omit<ScheduledShift, 'id'>) => ScheduledShift | null;
  onUnscheduleStaff: (shiftId: string) => Promise<boolean>;
  onUpdateInvoiceStatus: (invoiceId: string, status: Invoice['status'], paymentDetails?: string) => void;
  onGenerateInvoicesForDay: (selectedDate: string) => Promise<{ success: number; failCount: number; alreadyExistsCount: number }>;
  onCreateCreditNote: (originalInvoiceId: string) => Promise<Invoice | null>;
  onSplitInvoice: (originalInvoiceId: string, splitType: 'equalParts' | 'byAmount', splitValue: number) => Promise<boolean>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  availableShowSlots,
  allBookings,
  onAddShowSlot,
  onRemoveShowSlot,
  onUpdateShowSlot,
  allPackages,
  specialAddons,
  merchandiseItems,
  onAddMerchandise,
  onUpdateMerchandise,
  onDeleteMerchandise,
  onManualBookingSubmit,
  onUpdateBooking,
  bookingStats,
  waitingListEntries,
  onRemoveWaitingListEntry, 
  onNavigateToUserView,
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  showToast,
  promoCodes,
  onAddPromoCode,
  onUpdatePromoCode,
  onDeletePromoCode,
  applyPromoCode,
  auditLogs,
  invoices,
  onGenerateInvoice,
  appSettings,
  onUpdateAppSettings, 
  onUpdateDefaultShowAndPackage,
  onApproveBooking, 
  onRejectBooking, 
  onWaitlistBooking, 
  onDeleteBooking, 
  onBookFromWaitingListModalOpen,
  onToggleManualCloseShow, 
  // Added missing props that are passed from App.tsx
  staffMembers,
  scheduledShifts,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember,
  onScheduleStaff,
  onUnscheduleStaff,
  onUpdateInvoiceStatus,
  onGenerateInvoicesForDay,
  onCreateCreditNote,
  onSplitInvoice,
}) => {
  const [activeMode, setActiveMode] = useState<AdminMode>('dashboard');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ReservationDetails | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pendingApprovalBookings = useMemo(() => allBookings.filter(b => b.status === 'pending_approval' && !b.isOverbooking), [allBookings]);
  const overBookingsRequiringApproval = useMemo(() => allBookings.filter(b => b.status === 'pending_approval' && b.isOverbooking), [allBookings]);
  const confirmedBookings = useMemo(() => allBookings.filter(b => b.status === 'confirmed'), [allBookings]);
  const rejectedBookings = useMemo(() => allBookings.filter(b => b.status === 'rejected' || b.status === 'cancelled' || b.status === 'moved_to_waitlist'), [allBookings]); 
  // const dateChangeRequests = useMemo(() => allBookings.filter(b => b.status === 'pending_date_change'), [allBookings]); // Removed as unused
  const waitlistedBookings = useMemo(() => allBookings.filter(b => b.status === 'waitlisted' || b.status === 'moved_to_waitlist'), [allBookings]);


  const navItemCategories: NavItemCategory[] = useMemo(() => [
    {
      mainLabel: 'Dashboard',
      items: [{ mode: 'dashboard', label: 'Dashboard Overzicht' }],
      isInitiallyOpen: true,
    },
    {
      mainLabel: 'Shows',
      items: [
        { mode: 'shows', label: 'Showbeheer' },
        { mode: 'bulkAddShows', label: 'Shows Bulk Toevoegen' },
      ],
    },
    {
      mainLabel: 'Reserveringen & Aanvragen',
      items: [
        { mode: 'pendingApprovals', label: 'Nieuwe Aanvragen', count: pendingApprovalBookings.length },
        { mode: 'overBookings', label: 'Overboekingen Ter Goedkeuring', count: overBookingsRequiringApproval.length }, 
        { mode: 'bookings', label: 'Bevestigde Boekingen', count: confirmedBookings.length },
        { mode: 'waitingList', label: 'Wachtlijst Contacten', count: waitingListEntries.length }, 
        { mode: 'waitlistedBookings', label: 'Boekingen op Wachtlijst', count: waitlistedBookings.length }, 
        { mode: 'manualBooking', label: 'Handmatige Boeking' },
        { mode: 'rejectedBookingsArchive', label: 'Afgewezen/Geannuleerd Archief', count: rejectedBookings.length },
      ],
      isInitiallyOpen: true,
    },
    {
      mainLabel: 'Klanten',
      items: [{ mode: 'customers', label: 'Klantenbeheer', count: customers.length }],
    },
     {
      mainLabel: 'Personeel',
      items: [], 
    },
    {
      mainLabel: 'Financieel',
      items: [
        { mode: 'invoices', label: 'Facturatie', count: invoices.length },
        { mode: 'promoCodes', label: 'Kortingscodes', count: promoCodes.filter(pc => pc.isActive).length },
      ],
    },
    {
      mainLabel: 'Producten',
      items: [{ mode: 'merchandise', label: 'Merchandise Beheer' }],
    },
    {
      mainLabel: 'Operationeel & Rapportage',
      items: [
        { mode: 'dailyPrintout', label: 'Daglijst Printen' },
        { mode: 'reports', label: 'Gedetailleerde Rapportages' },
        { mode: 'auditLog', label: 'Audit Log', count: auditLogs.length },
        { mode: 'settings', label: 'Instellingen' },
      ],
      isInitiallyOpen: true,
    },
  ], [
    pendingApprovalBookings.length,
    overBookingsRequiringApproval.length,
    confirmedBookings.length,
    waitingListEntries.length,
    rejectedBookings.length,
    customers.length,
    invoices.length,
    promoCodes,
    auditLogs.length,
    waitlistedBookings.length, 
  ]);
  
  const [openSections, setOpenSections] = useState<string[]>(
    navItemCategories.filter(cat => cat.isInitiallyOpen).map(cat => cat.mainLabel)
  );

  const toggleSection = (sectionLabel: string) => {
    setOpenSections(prevOpenSections =>
      prevOpenSections.includes(sectionLabel)
        ? prevOpenSections.filter(label => label !== sectionLabel)
        : [...prevOpenSections, sectionLabel]
    );
  };

  const handleOpenEditModal = (booking: ReservationDetails) => {
    setEditingBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBooking(null);
  };

  // Adjusted to match EditBookingModalProps onSave signature
  const handleEditBookingSubmitForModal = async (updatedBooking: ReservationDetails, originalShowSlotId?: string) => {
    // The adminConsentsToOverbooking parameter is not available from EditBookingModal's onSave.
    // We might need to adjust EditBookingModal to include this, or handle it differently.
    // For now, assuming false or that it's handled within onUpdateBooking if not provided.
    // Pass originalShowSlotId to onUpdateBooking
    const success = await onUpdateBooking(updatedBooking, originalShowSlotId, false); 
    if (success) {
      handleCloseEditModal();
    }
  };

  const setActiveModeAndUpdateHash = useCallback((mode: AdminMode) => {
    setActiveMode(mode);
    window.location.hash = `#admin?mode=${mode}`;
    setIsMobileMenuOpen(false); 
  }, []);


  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#admin')) return;

      const params = new URLSearchParams(hash.split('?')[1] || '');
      const modeFromUrl = params.get('mode') as AdminMode | null;
      const isViewingInvoice = params.has('viewInvoiceId');

      if (isViewingInvoice) return; 

      if (modeFromUrl && navItemCategories.flatMap(cat => cat.items).some(item => item.mode === modeFromUrl)) {
        const currentModeInUrl: AdminMode = modeFromUrl;
        if (activeMode !== currentModeInUrl) {
          setActiveMode(currentModeInUrl);
        }
      } else if (!modeFromUrl && (hash === '#admin' || hash === '#admin?')) {
        setActiveModeAndUpdateHash('dashboard');
      } else if (modeFromUrl && !navItemCategories.flatMap(cat => cat.items).some(item => item.mode === modeFromUrl)) {
        setActiveModeAndUpdateHash('dashboard');
      }
    };

    const initialParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (!initialParams.has('viewInvoiceId')) {
      const initialMode = initialParams.get('mode') as AdminMode | null;
      if (initialMode && navItemCategories.flatMap(cat => cat.items).some(item => item.mode === initialMode)) {
        if (activeMode !== initialMode) setActiveMode(initialMode);
      } else {
         if(window.location.hash.startsWith('#admin')) setActiveModeAndUpdateHash('dashboard');
      }
    }


    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeMode, navItemCategories, setActiveModeAndUpdateHash]);


  const logoUrl = "./logo-ip.png";

  const renderNavMenu = (isMobile: boolean) => (
    <nav className={`bg-slate-800 text-slate-100 p-5 space-y-1 ${isMobile ? 'w-full h-full' : 'w-64 flex-shrink-0 shadow-lg overflow-y-auto scrollbar'}`}>
      {navItemCategories.map(category => (
        <div key={category.mainLabel} className="py-1">
          <button
            onClick={() => toggleSection(category.mainLabel)}
            className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-800 group"
            aria-expanded={openSections.includes(category.mainLabel)}
            aria-controls={`section-${category.mainLabel.replace(/\s+/g, '-')}`}
          >
            <span className="text-sm font-semibold tracking-wider uppercase">{category.mainLabel}</span>
            <ChevronDownIcon />
          </button>
          {openSections.includes(category.mainLabel) && (
            <div id={`section-${category.mainLabel.replace(/\s+/g, '-')}`} className="pl-3 pt-1 pb-2 space-y-px border-l border-slate-700 ml-3">
              {category.items.map(item => (
                <button
                  key={item.mode}
                  onClick={() => setActiveModeAndUpdateHash(item.mode)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out group
                    ${activeMode === item.mode
                      ? 'bg-indigo-600 text-white shadow-inner'
                      : 'hover:bg-slate-700 hover:text-white text-slate-300'}`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${activeMode === item.mode ? 'bg-indigo-400 text-white' : 'bg-slate-600 text-slate-200 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
  
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={logoUrl}
              alt="Inspiration Point Logo"
              className="h-10 md:h-12 mr-3 object-contain"
            />
            <h1 className="text-xl md:text-2xl font-display text-indigo-700 whitespace-nowrap">Admin Panel</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={onNavigateToUserView}
              className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 items-center mr-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Verlaat Admin
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800 pt-5 pb-4 overflow-y-auto scrollbar">
             <div className="flex items-center justify-between px-4 mb-4">
                <h2 className="text-lg font-semibold text-white">Menu</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 hover:text-white p-1">
                    <CloseIcon/>
                </button>
            </div>
            {renderNavMenu(true)}
             <button
              onClick={() => { onNavigateToUserView(); setIsMobileMenuOpen(false); }}
              className="mt-auto flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 text-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Verlaat Admin
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-grow container mx-auto">
        <div className="hidden md:block">
         {renderNavMenu(false)}
        </div>

        <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl">
            {activeMode === 'dashboard' && (<Dashboard stats={bookingStats} totalShows={availableShowSlots.length} availableShowSlots={availableShowSlots} />)}
            {activeMode === 'shows' && (
              <ShowManagement
                availableShowSlots={availableShowSlots}
                onAddShowSlot={onAddShowSlot} 
                onUpdateShowSlot={onUpdateShowSlot}
                onDeleteShowSlot={onRemoveShowSlot} 
                onToggleManualClose={onToggleManualCloseShow} 
                allPackages={allPackages} 
                showToast={showToast}
                waitingListEntries={waitingListEntries} 
              />
            )}
            {activeMode === 'bulkAddShows' && (
              <BulkShowAdd
                onAddShowSlot={onAddShowSlot}
                allPackages={allPackages}
                existingShowSlots={availableShowSlots}
            />
            )}
            {activeMode === 'bookings' && (
              <BookingViewer
                bookings={confirmedBookings} 
                showSlots={availableShowSlots}
                onOpenEditModal={handleOpenEditModal}
                onDeleteBooking={onDeleteBooking} 
                customers={customers} 
                invoices={invoices} 
                onGenerateInvoice={onGenerateInvoice} 
              />
            )}
            {activeMode === 'pendingApprovals' && (
              <PendingApprovals
                bookings={allBookings.filter(b => (b.status === 'pending_approval' || b.status === 'pending_date_change') && !b.isOverbooking)} 
                onApprove={onApproveBooking} 
                onReject={onRejectBooking} 
                onWaitlist={onWaitlistBooking} 
                showSlots={availableShowSlots}
                onOpenEditModal={handleOpenEditModal}
              />
            )}
            {activeMode === 'overBookings' && (
              <PendingApprovals
                bookings={overBookingsRequiringApproval} 
                onApprove={onApproveBooking} 
                onReject={onRejectBooking}
                onWaitlist={onWaitlistBooking} 
                showSlots={availableShowSlots}
                onOpenEditModal={handleOpenEditModal}
                isOverbookingApprovalMode={true} 
              />
            )}
            {activeMode === 'manualBooking' && (
              <ManualBookingForm
                availableShowSlots={availableShowSlots} 
                allPackages={allPackages} 
                specialAddons={specialAddons} 
                merchandiseItems={merchandiseItems} 
                onSubmit={onManualBookingSubmit}
                applyPromoCode={applyPromoCode}
              />
            )}
            {activeMode === 'dailyPrintout' && (<DailyPrintout bookings={confirmedBookings} showSlots={availableShowSlots} customers={customers} />)}
            {activeMode === 'merchandise' && (<MerchandiseManager merchandiseItems={merchandiseItems} onAddMerchandise={onAddMerchandise} onUpdateMerchandise={onUpdateMerchandise} onDeleteMerchandise={onDeleteMerchandise} />)}
            {activeMode === 'promoCodes' && (<PromoCodeManager promoCodes={promoCodes} onAddPromoCode={onAddPromoCode} onUpdatePromoCode={onUpdatePromoCode} onDeletePromoCode={onDeletePromoCode} />)}
            {activeMode === 'customers' && (
              <CustomerManagement
                customers={customers}
                allBookings={allBookings}
                onAddCustomer={onAddCustomer}
                onUpdateCustomer={onUpdateCustomer}
                onDeleteCustomer={onDeleteCustomer}
                onOpenEditBookingModal={handleOpenEditModal} 
                showToast={showToast}
                showSlots={availableShowSlots} 
                allPackages={allPackages} 
                onManualBookingSubmit={onManualBookingSubmit} 
                specialAddons={specialAddons} 
                merchandiseItems={merchandiseItems} 
                applyPromoCode={applyPromoCode} 
              />
            )}
            {activeMode === 'waitingList' && (
              <WaitingListManager
                entries={waitingListEntries}
                onRemoveEntry={onRemoveWaitingListEntry}
                showSlots={availableShowSlots}
                onBookFromWaitingListModalOpen={onBookFromWaitingListModalOpen}
              />
            )}
            {activeMode === 'auditLog' && (
            <AuditLogViewer 
                auditLogs={auditLogs} 
                allBookings={allBookings}
                availableShowSlots={availableShowSlots}
                customers={customers}
                promoCodes={promoCodes}
                allPackages={allPackages}
                merchandiseItems={merchandiseItems}
            />)}
            {activeMode === 'settings' && (
              <AdminSettings 
                appSettings={appSettings} 
                onUpdateAppSettings={onUpdateAppSettings} 
                onUpdateDefaultShowAndPackage={onUpdateDefaultShowAndPackage} 
                availableShowSlots={availableShowSlots} 
                allPackages={allPackages}
                showToast={showToast} 
              />
            )}
            {activeMode === 'rejectedBookingsArchive' && (
              <BookingViewer
                bookings={rejectedBookings} // These are already filtered for cancelled/rejected
                showSlots={availableShowSlots}
                onOpenEditModal={handleOpenEditModal} 
                onDeleteBooking={onDeleteBooking} 
                customers={customers} 
                invoices={invoices} 
                onGenerateInvoice={onGenerateInvoice} 
                isArchiveView={true} 
              />
            )}
            {/* Simplified condition: if it's one of these modes AND NOT rejectedBookingsArchive (which is covered above) */}
            {(activeMode === 'waitlistedBookings' || activeMode === 'invoices' || activeMode === 'reports' ) && (
                <div className="text-center py-10">
                    <h3 className="text-lg font-semibold text-gray-600">{navItemCategories.flatMap(c => c.items).find(item => item.mode === activeMode)?.label || activeMode}</h3>
                    <p className="text-gray-500">Deze sectie is nog in ontwikkeling.</p>
                </div>
            )}
          </div>
        </main>
      </div>

      {isEditModalOpen && editingBooking && (
        <EditBookingModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          booking={editingBooking}
          onSave={handleEditBookingSubmitForModal} 
          packages={allPackages} // Corrected from packages to allPackages
          merchandiseItems={merchandiseItems}
          showSlots={availableShowSlots}
          // specialAddons and applyPromoCode are not part of EditBookingModalProps by default
          // appSettings is optional in EditBookingModalProps
          // customers and onUpdateCustomer are not part of EditBookingModalProps by default
        />
      )}
    </div>
  );
};
