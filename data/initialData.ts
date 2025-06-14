// Placeholder for Initial Data
import { PackageOption, SpecialAddOn, MerchandiseItem, PromoCode, StaffMember, ScheduledShift, AppSettings, ShowType, Customer, Invoice, CompanyDetails } from './types';

export const FALLBACK_MERCHANDISE_ITEMS: MerchandiseItem[] = [];
export const SHOW_PACKAGES: PackageOption[] = [];
export const SPECIAL_ADDONS: SpecialAddOn[] = [];
export const initialPackageOptions: PackageOption[] = [];
export const initialSpecialAddons: SpecialAddOn[] = [];
export const initialMerchandiseItems: MerchandiseItem[] = [];
export const initialPromoCodes: PromoCode[] = [];
export const initialStaffMembers: StaffMember[] = [];
export const initialScheduledShifts: ScheduledShift[] = [];

export const initialCompanyDetails: CompanyDetails = {
  name: "Inspiration Point",
  addressLine1: "123 Show Lane",
  city: "Theater Town",
  phone: "555-1234",
  email: "contact@inspirationpoint.show",
  vatNumber: "NL123456789B01",
  kvkNumber: "12345678",
  bankAccountNumber: "NL99BANK0123456789",
  bankName: "Show Bank"
};

export const initialAppSettings: AppSettings = {
  companyDetails: initialCompanyDetails,
  lastInvoiceNumber: 0,
  invoiceDueDays: 14,
  vatRateHigh: 21,
  vatRateLow: 9,
  invoiceNrPrefix: "INV-",
};

export const initialShowTypes: ShowType[] = [];
export const initialCustomers: Customer[] = [];
export const initialInvoices: Invoice[] = [];
