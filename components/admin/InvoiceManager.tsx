
import React, { useState, useMemo } from 'react';
import { Invoice, ReservationDetails, Customer } from '../../types';
import type { ToastMessage } from '../shared/ToastNotifications';
import { SplitInvoiceModal } from './SplitInvoiceModal'; // Import the new modal

interface InvoiceManagerProps {
  invoices: Invoice[];
  allBookings: ReservationDetails[];
  customers: Customer[];
  onUpdateInvoiceStatus: (invoiceId: string, status: Invoice['status'], paymentDetails?: string) => void;
  onGenerateInvoicesForDay: (selectedDate: string) => Promise<{ successCount: number, failCount: number, alreadyExistsCount: number }>; // Changed to Promise
  showToast: (message: string, type: ToastMessage['type']) => void;
  onCreateCreditNote: (originalInvoiceId: string) => Invoice | null;
  onSplitInvoice: (originalInvoiceId: string, splitType: 'equalParts' | 'byAmount', splitValue: number) => Promise<boolean>;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  allBookings,
  customers,
  onUpdateInvoiceStatus,
  onGenerateInvoicesForDay,
  showToast,
  onCreateCreditNote,
  onSplitInvoice,
}) => {
  const [filters, setFilters] = useState({
    status: '',
    invoiceNumber: '',
    customerName: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    showOpenOnly: false,
  });
  const [paymentDetailsInput, setPaymentDetailsInput] = useState<Record<string, string>>({});
  const [bulkGenerateDate, setBulkGenerateDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splittingInvoice, setSplittingInvoice] = useState<Invoice | null>(null);

  const handleOpenSplitModal = (invoice: Invoice) => {
    setSplittingInvoice(invoice);
    setIsSplitModalOpen(true);
  };

  const handleCloseSplitModal = () => {
    setSplittingInvoice(null);
    setIsSplitModalOpen(false);
  };


  const getCustomerNameFromInvoice = (invoice: Invoice): string => {
    return invoice.customerDetails.companyName || invoice.customerDetails.name || 'N/A';
  };
  
  const getBookingForInvoice = (invoice: Invoice): ReservationDetails | undefined => {
    return allBookings.find(b => b.reservationId === invoice.reservationId);
  };

  const filteredInvoices = useMemo(() => {
    const openStatuses: Invoice['status'][] = ['draft', 'sent', 'overdue'];
    return invoices
      .filter(invoice => {
        const customerName = getCustomerNameFromInvoice(invoice);

        const statusMatch = !filters.status || invoice.status === filters.status;
        const numberMatch = !filters.invoiceNumber || invoice.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase());
        const customerMatch = !filters.customerName || customerName.toLowerCase().includes(filters.customerName.toLowerCase());
        const dateStartMatch = !filters.dateRangeStart || new Date(invoice.invoiceDate) >= new Date(filters.dateRangeStart);
        const dateEndMatch = !filters.dateRangeEnd || new Date(invoice.invoiceDate) <= new Date(filters.dateRangeEnd);
        const openOnlyMatch = !filters.showOpenOnly || openStatuses.includes(invoice.status);
        
        return statusMatch && numberMatch && customerMatch && dateStartMatch && dateEndMatch && openOnlyMatch;
      })
      .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber));
  }, [invoices, filters, customers, allBookings]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleViewPrintInvoice = (invoiceId: string) => {
    window.location.hash = `#admin?mode=invoices&viewInvoiceId=${invoiceId}`;
  };
  
  const handlePaymentDetailsChange = (invoiceId: string, value: string) => {
    setPaymentDetailsInput(prev => ({ ...prev, [invoiceId]: value }));
  };

  const handleMarkAsPaidWithDetails = (invoiceId: string) => {
    onUpdateInvoiceStatus(invoiceId, 'paid', paymentDetailsInput[invoiceId] || `Betaald op ${new Date().toLocaleDateString('nl-NL')}`);
    setPaymentDetailsInput(prev => ({ ...prev, [invoiceId]: '' })); 
  };

  const handleBulkGenerate = async () => {
    if (!bulkGenerateDate) {
        showToast("Selecteer een datum voor bulk factuurgeneratie.", "error");
        return;
    }
    await onGenerateInvoicesForDay(bulkGenerateDate);
  };


  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Factuurbeheer ({filteredInvoices.length})</h2>

      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
        <h3 className="text-lg font-medium text-indigo-600">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label htmlFor="statusFilter" className="block text-xs font-medium text-slate-600">Status</label>
            <select name="status" id="statusFilter" value={filters.status} onChange={handleFilterChange} className="mt-0.5 w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Alle Statussen</option>
              <option value="draft">Concept</option>
              <option value="sent">Verzonden</option>
              <option value="paid">Betaald</option>
              <option value="overdue">Vervallen</option>
              <option value="cancelled">Geannuleerd</option>
              <option value="credited">Gecrediteerd</option>
            </select>
          </div>
          <div>
            <label htmlFor="invoiceNumberFilter" className="block text-xs font-medium text-slate-600">Factuurnr.</label>
            <input type="text" name="invoiceNumber" id="invoiceNumberFilter" value={filters.invoiceNumber} onChange={handleFilterChange} placeholder="INV-..." className="mt-0.5 w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="customerNameFilter" className="block text-xs font-medium text-slate-600">Klantnaam</label>
            <input type="text" name="customerName" id="customerNameFilter" value={filters.customerName} onChange={handleFilterChange} placeholder="Zoek klant..." className="mt-0.5 w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="dateRangeStartFilter" className="block text-xs font-medium text-slate-600">Factuurdatum Vanaf</label>
            <input type="date" name="dateRangeStart" id="dateRangeStartFilter" value={filters.dateRangeStart} onChange={handleFilterChange} className="mt-0.5 w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="dateRangeEndFilter" className="block text-xs font-medium text-slate-600">Factuurdatum Tot</label>
            <input type="date" name="dateRangeEnd" id="dateRangeEndFilter" value={filters.dateRangeEnd} onChange={handleFilterChange} className="mt-0.5 w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
           <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="showOpenOnly" checked={filters.showOpenOnly} onChange={handleFilterChange} className="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-400"/>
                <span className="text-sm text-slate-700">Toon alleen openstaand</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mb-8 p-4 border border-teal-300 bg-teal-50 rounded-lg">
        <h3 className="text-lg font-medium text-teal-700 mb-2">Bulk Factuur Generatie</h3>
        <div className="flex items-end space-x-3">
            <div>
                <label htmlFor="bulkGenerateDate" className="block text-sm font-medium text-slate-600 mb-1">Selecteer Dag:</label>
                <input 
                    type="date" 
                    id="bulkGenerateDate" 
                    value={bulkGenerateDate} 
                    onChange={(e) => setBulkGenerateDate(e.target.value)}
                    className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                />
            </div>
            <button 
                onClick={handleBulkGenerate}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-sm hover:shadow-md text-sm"
                disabled={!bulkGenerateDate}
            >
                Genereer Facturen
            </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Genereert facturen voor alle bevestigde, nog niet gefactureerde reserveringen op de geselecteerde dag.</p>
      </div>


      {filteredInvoices.length === 0 ? (
        <p className="text-slate-500 italic">Geen facturen gevonden die aan de criteria voldoen.</p>
      ) : (
        <div className="overflow-x-auto max-h-[70vh] scrollbar-thin">
          <table className="min-w-full divide-y divide-slate-200 border border-slate-200 shadow-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Factuurnr.</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Klant</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Datum</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Vervaldatum</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Totaal</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredInvoices.map(invoice => {
                const customerName = getCustomerNameFromInvoice(invoice);
                 const statusClasses: Record<Invoice['status'], string> = {
                    draft: 'bg-slate-200 text-slate-700',
                    sent: 'bg-blue-200 text-blue-700',
                    paid: 'bg-green-200 text-green-800',
                    overdue: 'bg-orange-200 text-orange-700', 
                    cancelled: 'bg-gray-300 text-gray-600 line-through',
                    credited: 'bg-purple-200 text-purple-700',
                };
                const originalLinkedInvoice = invoice.originalInvoiceId ? invoices.find(inv => inv.id === invoice.originalInvoiceId) : null;
                const creditNoteLink = invoice.creditedByInvoiceId ? invoices.find(inv => inv.id === invoice.creditedByInvoiceId) : null;

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-xs text-indigo-600 font-medium">
                        {invoice.invoiceNumber}
                        {originalLinkedInvoice && <span className="block text-[10px] text-slate-500">(Deel v. <a href={`#admin?mode=invoices&viewInvoiceId=${originalLinkedInvoice.id}`} onClick={(e)=>{e.preventDefault(); handleViewPrintInvoice(originalLinkedInvoice.id)}} className="underline hover:text-indigo-500">{originalLinkedInvoice.invoiceNumber}</a>)</span>}
                        {invoice.status === 'credited' && originalLinkedInvoice && <span className="block text-[10px] text-slate-500">(Credit v. <a href={`#admin?mode=invoices&viewInvoiceId=${originalLinkedInvoice.id}`} onClick={(e)=>{e.preventDefault(); handleViewPrintInvoice(originalLinkedInvoice.id)}} className="underline hover:text-indigo-500">{originalLinkedInvoice.invoiceNumber}</a>)</span>}
                        {creditNoteLink && <span className="block text-[10px] text-slate-500">(Gecrediteerd d. <a href={`#admin?mode=invoices&viewInvoiceId=${creditNoteLink.id}`}  onClick={(e)=>{e.preventDefault(); handleViewPrintInvoice(creditNoteLink.id)}} className="underline hover:text-indigo-500">{creditNoteLink.invoiceNumber}</a>)</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{customerName}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('nl-NL')}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString('nl-NL')}</td>
                    <td className="px-3 py-2 text-xs text-slate-700 font-semibold">€{invoice.grandTotalInclVat.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[invoice.status] || ''}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                    </td>
                    <td className="px-3 py-2 text-xs space-y-1">
                      <button onClick={() => handleViewPrintInvoice(invoice.id)} className="w-full text-left text-xs bg-sky-500 hover:bg-sky-600 text-white font-medium py-1 px-2 rounded shadow-sm">Bekijk/Print</button>
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'credited' && (
                        <>
                         <button onClick={() => onUpdateInvoiceStatus(invoice.id, 'sent')} className="w-full text-left text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-2 rounded shadow-sm">Markeer Verzonden</button>
                          <div className="flex items-center space-x-1">
                            <input 
                                type="text" 
                                placeholder="Betalingsdetails (optioneel)" 
                                value={paymentDetailsInput[invoice.id] || ''}
                                onChange={(e) => handlePaymentDetailsChange(invoice.id, e.target.value)}
                                className="flex-grow p-1 border-slate-300 rounded text-xs"
                            />
                            <button onClick={() => handleMarkAsPaidWithDetails(invoice.id)} className="flex-shrink-0 text-xs bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-2 rounded shadow-sm">Betaald</button>
                          </div>
                          <button onClick={() => handleOpenSplitModal(invoice)} className="w-full text-left text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium py-1 px-2 rounded shadow-sm">Factuur Splitsen</button>
                        </>
                      )}
                      {invoice.status === 'paid' && !invoice.creditedByInvoiceId && (
                        <button onClick={() => onCreateCreditNote(invoice.id)} className="w-full text-left text-xs bg-purple-500 hover:bg-purple-600 text-white font-medium py-1 px-2 rounded shadow-sm">Creditnota Aanmaken</button>
                      )}
                      {invoice.status !== 'cancelled' && invoice.status !== 'credited' && (
                        <button onClick={() => onUpdateInvoiceStatus(invoice.id, 'cancelled')} className="w-full text-left text-xs bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-2 rounded shadow-sm">Annuleer Factuur</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {splittingInvoice && (
        <SplitInvoiceModal
          isOpen={isSplitModalOpen}
          onClose={handleCloseSplitModal}
          invoiceToSplit={splittingInvoice}
          onSplitInvoice={onSplitInvoice}
        />
      )}
    </div>
  );
};
