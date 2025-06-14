export enum ShowType {
  REGULAR = 'REGULAR',
  MATINEE = 'MATINEE',
  ZORGZAME_HELDEN = 'ZORGZAME_HELDEN',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

export interface PriceComponent {
  percentageOfTotalPrice: number;
  vatRate: number;
  description: string;
}

export interface PackageOption {
  id: string;
  name: string;
  price: number;
  description: string;
  details: string[];
  days?: string;
  colorCode?: string;
  minPersons?: number;
  priceComponents: PriceComponent[];
}

export interface ShowSlot {
  id: string;
  name?: string; // Added name for the show/event
  date: string;
  time: string;
  availablePackageIds: string[];
  capacity: number;
  bookedCount: number;
  availableSlots: number; // Added availableSlots
  isManuallyClosed: boolean;
  showType?: ShowType;
}

export interface MerchandiseItem {
  id: string;
  name: string;
  description?: string;
  priceInclVAT: number;
  imageUrl?: string;
  category?: string;
  vatRate: number;
}

export interface OrderedMerchandiseItem {
  itemId: string; // Was merchandiseId in some App.tsx usage, standardized to itemId
  quantity: number;
  itemName: string;
  itemPrice: number; // Price per item at time of booking (INCL VAT)
}

export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

export interface InvoiceDetails {
  needsInvoice: boolean;
  companyName?: string;
  vatNumber?: string;
  invoiceAddress?: Address;
  remarks?: string;
}

export type ReservationStatus = 'confirmed' | 'pending_approval' | 'waitlisted' | 'rejected' | 'moved_to_waitlist' | 'pending_date_change' | 'failed' | 'pending_payment' | 'cancelled' | 'completed'; // Added new statuses

export interface SpecialAddOn {
  id: 'voorborrel' | 'naborrel';
  name: string;
  price: number;
  description: string;
  minPersons?: number;
  timing: string;
  vatRate?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  companyName?: string;
  salutation?: string;
  address?: Address;
  notes?: string;
  creationTimestamp: string;
  lastUpdateTimestamp: string;
  role: 'admin' | 'customer'; // Added role
  isAdmin?: boolean; // Added isAdmin for clarity, though role might be sufficient
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'gift_card'; // App.tsx to use 'type'
  value: number; // App.tsx to use 'value'
  description: string;
  isActive: boolean;
  expirationDate?: string; // App.tsx to use 'expirationDate'
  usageLimit?: number;
  timesUsed: number;
  minBookingAmount?: number;
  generatedFor?: string;
}

export interface ReservationDetails {
  reservationId: string;
  showSlotId: string;
  customerId?: string;
  packageName: string;
  packageId: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  address?: Address;
  invoiceDetails?: InvoiceDetails;
  celebrationDetails?: string;
  dietaryWishes?: string;
  merchandise?: OrderedMerchandiseItem[];
  selectedVoorborrel?: boolean;
  selectedNaborrel?: boolean;
  selectedAddOns?: { id: string; quantity: number; name: string; price: number; }[]; // Added
  isPaid?: boolean;
  bookingTimestamp: string;
  status: ReservationStatus;
  isMPL?: boolean;
  placementPreferenceDetails?: string;
  internalAdminNotes?: string;
  isOverbooking?: boolean; // Added to specifically flag overbooking attempts
  notes?: string; // Added general notes
  appliedPromoCode?: string;
  discountAmount?: number;
  invoiceId?: string;
  needsInvoiceReview?: boolean;
  userModificationRequest?: string;
  acceptsMarketingEmails?: boolean;
  agreedToPrivacyPolicy: boolean;
  cancellationReason?: string;
  paymentDetails?: { // Added
    method: string;
    transactionId?: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'paid_on_site' | 'invoiced';
  };
  totalPrice: number; // Added
  lastUpdatedTimestamp?: any; // Added (string or server timestamp)
  bookedBy?: string; // Added
  sendConfirmationEmail?: boolean; // Added
}

// Expanded BookingData interface
export interface BookingData {
  selectedShowSlotId?: string;
  selectedPackageId?: string;
  customerId?: string;
  guests?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  invoiceDetails?: InvoiceDetails;
  celebrationDetails?: string;
  dietaryWishes?: string;
  merchandise?: OrderedMerchandiseItem[];
  selectedVoorborrel?: boolean;
  selectedNaborrel?: boolean;
  status?: ReservationStatus;
  appliedPromoCode?: string;
  discountAmount?: number;
  promoCodeInput?: string;
  acceptsMarketingEmails?: boolean;
  agreedToPrivacyPolicy: boolean;
  calendarSelectedDate?: string;
}

// Added missing types
export interface WaitingListEntry {
  id: string;
  showSlotId: string;
  showInfo: { date: string; time: string }; // Simplified for this context
  name: string;
  email: string;
  phone: string;
  guests: number;
  timestamp: string; // Assuming this is dateAdded
  notes?: string;
  customerId?: string; // Added
  dateAdded: any; // Added (string or server timestamp)
  status: 'pending' | 'contacted' | 'booked' | 'unavailable'; // Added
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string; // e.g., "System", "Admin (username)", "Customer (email/id)"
  actionType: string; // e.g., "BOOKING_CREATED", "SHOW_SLOT_UPDATED", "LOGIN_FAILED"
  details: string; // Free-text description of the action
  entityType?: string; // e.g., "Reservation", "ShowSlot", "Customer"
  entityId?: string; // ID of the affected entity
  ipAddress?: string; // Optional: for web requests
  previousState?: any; // Optional: for detailed change tracking
  newState?: any; // Optional: for detailed change tracking
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // Changed from unitPriceExclVat, assuming inclusive
  vatRate: number; // Percentage, e.g., 21
  itemId?: string; // Added itemId
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId?: string; // Optional if it's a generic invoice not tied to a booking
  customerId: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: Address;
    companyName?: string;
    vatNumber?: string;
    invoiceAddress?: Address; // If different from primary address
  };
  companyDetails: CompanyDetails; // Your company's details
  lineItems: InvoiceLineItem[];
  subTotalExclVat: number;
  vatSummary: { vatRate: number; baseAmountExclVat: number; totalVatAmount: number }[];
  totalVatAmount: number;
  discountAmountOnInclVatTotal?: number; // Discount applied to the total including VAT
  grandTotalInclVat: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'credited';
  notes?: string;
  paymentDetails?: string; // e.g., "Paid on YYYY-MM-DD via iDEAL", "Credited on YYYY-MM-DD"
  creationTimestamp: string;
  lastUpdateTimestamp: string;
  originalInvoiceId?: string; // For credit notes, the ID of the invoice being credited
  creditedByInvoiceId?: string; // For original invoices, the ID of the credit note if it exists
}

export enum StaffRole {
  ZAAL = 'Zaal',
  KEUKEN = 'Keuken',
  BAR = 'Bar',
  TECHNIEK = 'Techniek',
  MANAGEMENT = 'Management',
  OVERIG = 'Overig',
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  contactInfo?: string; // email or phone
  notes?: string;
  unavailableDates?: string[]; // Array of YYYY-MM-DD strings
}

export interface ScheduledShift {
  id: string;
  staffMemberId: string;
  showSlotId: string;
  roleDuringShift: StaffRole; // Could be different from default role
  shiftNotes?: string;
}

export interface CompanyDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string; // Optional
  phone: string;
  email: string;
  vatNumber: string;
  kvkNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  logoUrl?: string;
}

export interface AppSettings {
  companyDetails: CompanyDetails;
  lastInvoiceNumber: number;
  invoiceDueDays: number;
  vatRateHigh: number; // e.g., 21
  vatRateLow: number;  // e.g., 9
  invoiceNrPrefix: string;
  defaultShowId?: string;
  defaultPackageId?: string;
  paymentInstructions: string; // Added
  currencySymbol: string; // Added
  // Potentially add more settings like email templates, default texts etc.
}

export type AdminMode =
  | 'dashboard'
  | 'shows'
  | 'bulkAddShows'
  | 'bookings'
  | 'manualBooking'
  | 'pendingApprovals'
  | 'waitingList'
  | 'dailyPrintout'
  | 'merchandise'
  | 'customers'
  | 'promoCodes'
  | 'auditLog'
  | 'invoices'
  | 'staffScheduling'
  | 'reports'
  | 'settings'
  | 'rejectedBookingsArchive';

// Added ManualBookingSubmitDetails interface
export interface ManualBookingSubmitDetails {
  showSlotId: string;
  packageId: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  address?: Address;
  invoiceDetails?: InvoiceDetails;
  celebrationDetails?: string;
  dietaryWishes?: string;
  merchandise?: OrderedMerchandiseItem[];
  selectedVoorborrel?: boolean;
  selectedNaborrel?: boolean;
  isMPL?: boolean;
  placementPreferenceDetails?: string;
  internalAdminNotes?: string;
  acceptsMarketingEmails?: boolean;
  // Note: agreedToPrivacyPolicy is handled by the booking function
  // Note: status, bookingTimestamp etc. are set by the booking function
}
