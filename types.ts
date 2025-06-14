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
  price?: number; // Re-added for direct display/use, complement with priceLevels
  description: string;
  details: string[];
  days?: string;
  colorCode?: string;
  minPersons?: number;
  priceComponents: PriceComponent[];
  priceLevels: Record<string, { pricePerPerson: number }>; // Added
}

export interface ShowSlot {
  id: string;
  name?: string; // Added name for the show/event
  date: string;
  time: string;
  availablePackageIds: string[];
  capacity: number;
  bookedCount: number;
  availableSlots: number; // availableSlots = capacity - bookedCount, can be derived or stored
  isManuallyClosed: boolean;
  showType?: ShowType;
  priceTier?: string; // Added
  packageIds?: string[]; // Added
}

export interface Show { // Added Show interface
  id: string;
  title: string;
  description: string;
  showSlots: ShowSlot[]; // A show can have multiple slots (e.g., different times on the same day)
  defaultPackageIds: string[];
  venue: string;
  notes?: string;
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
  zipCode?: string; // Added
  country?: string; // Added
}

export interface InvoiceDetails {
  generateInvoice: boolean; 
  sendInvoice: boolean; 
  companyName?: string;
  vatNumber?: string;
  address?: Address; 
  customMessage?: string; 
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
  id?: string; // Firestore document ID, can be different from reservationId if not careful
  reservationId: string; // Your custom unique reservation identifier
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
  specialRequests?: string; // Added
  internalNotes?: string; // Added (or confirm if internalAdminNotes is this)
  merchandise?: OrderedMerchandiseItem[];
  selectedVoorborrel?: boolean;
  selectedNaborrel?: boolean;
  selectedAddOns?: { id: string; quantity: number; name: string; price: number; }[]; // Added
  isPaid?: boolean;
  bookingTimestamp: string;
  status: ReservationStatus;
  isMPL?: boolean;
  placementPreferenceDetails?: string;
  internalAdminNotes?: string; // Keep for now, clarify if it's different from internalNotes
  isOverbooking?: boolean; 
  isGuestBooking?: boolean; // Added to distinguish guest bookings
  notes?: string; 
  appliedPromoCode?: string; // Standardized name
  discountAmount?: number;
  invoiceId?: string;
  needsInvoiceReview?: boolean;
  userModificationRequest?: string;
  acceptsMarketingEmails?: boolean;
  agreedToPrivacyPolicy: boolean;
  cancellationReason?: string;
  paymentDetails?: {
    method: string;
    transactionId?: string;
    amount?: number; // Added
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'paid_on_site' | 'invoiced';
  };
  totalPrice: number; 
  lastModifiedTimestamp?: string; // Changed type to string
  lastUpdatedTimestamp?: any; 
  bookedBy?: string; 
  sendConfirmationEmail?: boolean; 
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
  showInfo: { date: string; time: string; name?: string }; // Added name to showInfo
  name: string;
  email: string;
  phone: string; // Added
  guests: number; // Added
  packageId?: string; // Added
  packageName?: string; // Added
  notes?: string; // Added
  creationTimestamp: string; // Added
  dateAdded: string; // <<< ADDED
  status: 'pending' | 'contacted' | 'booked' | 'cancelled'; // Added
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

export interface Invoice {
  id: string;
  reservationId: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  status: 'pending_payment' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'credited' | 'draft';
  items: InvoiceItem[];
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: Address;
    companyName?: string;
    vatNumber?: string;
  };
  companyDetails: CompanyDetails;
  invoiceNumber: string;
  paymentDetails?: string;
  notes?: string;
  creditedByInvoiceId?: string; // ID of the credit note if this invoice was credited
  creditForInvoiceId?: string; // ID of the original invoice if this is a credit note
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // Price per unit EXCL VAT if you store it that way, or INCL VAT if consistent
  totalPrice: number; // quantity * unitPrice (then add VAT or ensure it's included based on unitPrice)
  vatRate: number; // e.g., 21 for 21%
}

export interface CompanyDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string;
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
  vatRateHigh: number;
  vatRateLow: number;
  invoiceNrPrefix: string;
  defaultShowId?: string;
  defaultPackageId?: string;
  paymentInstructions?: string;
  currencySymbol: string;
  // Potentially add other global settings here
}

// Added StaffMember and ScheduledShift
export interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  roles: StaffRole[]; // Changed from role?: StaffRole to roles: StaffRole[]
  availability?: { // Added for more detailed availability
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  skills?: string[]; // Added
  performanceHistory?: any[]; // Added
  hourlyRate?: number;
  isActive?: boolean;
  contactInfo: { // Changed from string to object
    address: Address;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  notes?: string; 
  unavailableDates?: string[]; // Kept as string[] for YYYY-MM-DD
}

export type StaffRole = 'zaal' | 'keuken' | 'bar' | 'techniek' | 'management' | 'onbepaald';

export const staffRolesArray: StaffRole[] = ['zaal', 'keuken', 'bar', 'techniek', 'management', 'onbepaald'];

export interface ScheduledShift {
  id: string;
  staffMemberId: string;
  showId?: string; 
  showSlotId?: string; // Added showSlotId
  startTime: Date;
  endTime: Date;
  roleAssigned: StaffRole; 
  shiftNotes?: string;
}

// Payload for Manual Booking Form
export interface ManualBookingPayload {
  showSlotId: string;
  packageId: string;
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
  isPaid?: boolean;
  isMPL?: boolean;
  placementPreferenceDetails?: string;
  internalAdminNotes?: string;
  appliedPromoCode?: string;
  discountAmount?: number;
  totalPrice: number;
  customerId?: string;
  acceptsMarketingEmails?: boolean;
}


// AdminMode might need to be expanded if new sections are added
export type AdminMode =
  | 'dashboard'
  | 'shows'
  | 'bulkAddShows'
  | 'bookings'
  | 'pendingApprovals'
  | 'overBookings' // Added for the new section
  | 'waitingList'
  | 'waitlistedBookings' // Added for bookings that are on waitlist
  | 'manualBooking'
  | 'rejectedBookingsArchive'
  | 'customers'
  | 'merchandise'
  | 'dailyPrintout'
  | 'staffScheduling'
  | 'invoices'
  | 'promoCodes'
  | 'reports'
  | 'auditLog'
  | 'settings';
