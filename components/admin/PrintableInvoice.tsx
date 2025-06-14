
import React from 'react';
import { Invoice } from '../../types';

interface PrintableInvoiceProps {
  invoice: Invoice | null; 
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice }) => {
  if (!invoice) {
    return (
        <div className="p-8 text-center text-slate-600 printable-invoice-container">
            <h1 className="text-2xl font-bold mb-4">Factuur niet gevonden</h1>
            <p>De gevraagde factuur kon niet worden geladen. Controleer het ID of probeer het later opnieuw.</p>
            <button
              onClick={() => { window.location.hash = '#admin?mode=invoices'; }}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 no-print"
            >
              Terug naar Facturen
            </button>
        </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const originalInvoiceNumber = invoice.originalInvoiceId ? 
    (window.location.hash.split('?')[0] + `?mode=invoices&viewInvoiceId=${invoice.originalInvoiceId}`) 
    : null;
  const creditNoteInvoiceNumber = invoice.creditedByInvoiceId ?
    (window.location.hash.split('?')[0] + `?mode=invoices&viewInvoiceId=${invoice.creditedByInvoiceId}`)
    : null;


  return (
    <div className="p-4 md:p-8 bg-white font-sans text-slate-800 printable-invoice-container">
      {/* Inline styles for print are handled by @media print in index.html and App.tsx head */}
      
      <header className="flex justify-between items-start mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">{invoice.companyDetails.name}</h1>
          <p className="text-sm text-slate-600">{invoice.companyDetails.addressLine1}</p>
          <p className="text-sm text-slate-600">{invoice.companyDetails.addressLine2}</p>
          {invoice.companyDetails.phone && <p className="text-sm text-slate-600">Tel: {invoice.companyDetails.phone}</p>}
          {invoice.companyDetails.email && <p className="text-sm text-slate-600">Email: {invoice.companyDetails.email}</p>}
        </div>
        <div className="text-right">
          <h2 className={`text-2xl font-semibold ${invoice.status === 'credited' ? 'text-purple-700' : 'text-slate-700'}`}>
            {invoice.status === 'credited' ? 'CREDITNOTA' : 'FACTUUR'}
          </h2>
          <p className="text-sm"><strong>Factuurnummer:</strong> {invoice.invoiceNumber}</p>
          <p className="text-sm"><strong>Factuurdatum:</strong> {new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('nl-NL')}</p>
          <p className="text-sm"><strong>Vervaldatum:</strong> {new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString('nl-NL')}</p>
          {invoice.reservationId && <p className="text-xs text-slate-500">Boeking ID: ...{invoice.reservationId.slice(-8)}</p>}
           {invoice.originalInvoiceId && originalInvoiceNumber && (
            <p className="text-xs text-slate-500">
              Refereert aan: <a href={originalInvoiceNumber} className="text-indigo-500 hover:underline no-print" onClick={(e) => { e.preventDefault(); window.location.hash = originalInvoiceNumber; }}>Factuur #{invoice.originalInvoiceId.slice(-6)}</a>
              <span className="print-only">Factuur #{invoice.originalInvoiceId.slice(-6)}</span>
            </p>
          )}
          {invoice.creditedByInvoiceId && creditNoteInvoiceNumber && (
            <p className="text-xs text-slate-500">
              Gecrediteerd door: <a href={creditNoteInvoiceNumber} className="text-indigo-500 hover:underline no-print" onClick={(e) => { e.preventDefault(); window.location.hash = creditNoteInvoiceNumber; }}>Creditnota #{invoice.creditedByInvoiceId.slice(-6)}</a>
              <span className="print-only">Creditnota #{invoice.creditedByInvoiceId.slice(-6)}</span>
            </p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-slate-700 mb-1">Aan:</h3>
          <p className="font-medium">{invoice.customerDetails.companyName || invoice.customerDetails.name}</p>
          {invoice.customerDetails.address && (
            <>
              <p>{invoice.customerDetails.address.street} {invoice.customerDetails.address.houseNumber}</p>
              <p>{invoice.customerDetails.address.postalCode} {invoice.customerDetails.address.city}</p>
            </>
          )}
           {invoice.customerDetails.invoiceAddress && (invoice.customerDetails.invoiceAddress.street !== invoice.customerDetails.address?.street) && (
            <>
              <p className="mt-1 text-xs italic">(Factuuradres indien afwijkend:)</p>
              <p className="text-xs">{invoice.customerDetails.invoiceAddress.street} {invoice.customerDetails.invoiceAddress.houseNumber}</p>
              <p className="text-xs">{invoice.customerDetails.invoiceAddress.postalCode} {invoice.customerDetails.invoiceAddress.city}</p>
            </>
          )}
          <p>Email: {invoice.customerDetails.email}</p>
          <p>Telefoon: {invoice.customerDetails.phone}</p>
          {invoice.customerDetails.vatNumber && <p>BTW-nummer: {invoice.customerDetails.vatNumber}</p>}
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-slate-700 mb-1">Bedrijfsgegevens:</h3>
          <p>BTW-nummer: {invoice.companyDetails.vatNumber}</p>
          {invoice.companyDetails.kvkNumber && <p>KVK: {invoice.companyDetails.kvkNumber}</p>}
          {invoice.companyDetails.bankAccountNumber && <p>IBAN: {invoice.companyDetails.bankAccountNumber}</p>}
          {invoice.companyDetails.bankName && <p>Bank: {invoice.companyDetails.bankName}</p>}
        </div>
      </section>

      <section className="mb-8">
        <table className="w-full invoice-table border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-slate-100 text-left text-xs font-semibold">Omschrijving</th>
              <th className="border p-2 bg-slate-100 text-right text-xs font-semibold">Aantal</th>
              <th className="border p-2 bg-slate-100 text-right text-xs font-semibold">Prijs p.st. (excl. BTW)</th>
              <th className="border p-2 bg-slate-100 text-right text-xs font-semibold">BTW %</th>
              <th className="border p-2 bg-slate-100 text-right text-xs font-semibold">BTW Bedrag</th>
              <th className="border p-2 bg-slate-100 text-right text-xs font-semibold">Totaal (excl. BTW)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td className="border p-2 text-xs">{item.description}</td>
                <td className="border p-2 text-right text-xs">{item.quantity}</td>
                <td className="border p-2 text-right text-xs">€{item.unitPriceExclVat.toFixed(2)}</td>
                <td className="border p-2 text-right text-xs">{item.vatRate}%</td>
                <td className="border p-2 text-right text-xs">€{item.vatAmount.toFixed(2)}</td>
                <td className="border p-2 text-right text-xs">€{item.totalPriceExclVat.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mb-8">
        <div className="w-full sm:w-1/2 lg:w-2/5 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotaal (excl. BTW):</span><span>€{invoice.subTotalExclVat.toFixed(2)}</span></div>
          
          {invoice.vatSummary && invoice.vatSummary.length > 0 && (
            <div className="pl-4 border-l-2 border-slate-200 my-1 py-1">
              {invoice.vatSummary.map(summary => (
                <div key={summary.vatRate} className="flex justify-between text-xs text-slate-600">
                  <span>BTW {summary.vatRate}% over €{summary.baseAmountExclVat.toFixed(2)}:</span>
                  <span>€{summary.totalVatAmount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between font-semibold"><span>Totaal BTW:</span><span>€{invoice.totalVatAmount.toFixed(2)}</span></div>
          
          {invoice.discountAmountOnInclVatTotal && invoice.discountAmountOnInclVatTotal !== 0 && (
             <div className={`flex justify-between ${invoice.discountAmountOnInclVatTotal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Korting:</span>
                <span>{invoice.discountAmountOnInclVatTotal > 0 ? '-' : '+'} €{Math.abs(invoice.discountAmountOnInclVatTotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1 border-t border-slate-300 mt-1">
            <span>Totaal te betalen (incl. BTW):</span>
            <span>€{invoice.grandTotalInclVat.toFixed(2)}</span>
          </div>
        </div>
      </section>
      
      {invoice.notes && (
        <section className="mb-8 text-sm p-3 border border-dashed border-slate-300 rounded-md bg-slate-50">
            <h4 className="font-semibold mb-1 text-xs">Opmerkingen:</h4>
            <p className="whitespace-pre-wrap text-xs">{invoice.notes}</p>
        </section>
      )}

      {invoice.status === 'paid' && invoice.paymentDetails && (
        <section className="mb-8 text-sm p-3 border border-green-300 bg-green-50 rounded-md text-green-700">
            <h4 className="font-semibold mb-1 text-xs">Betalingsstatus: Betaald</h4>
            <p className="text-xs">{invoice.paymentDetails}</p>
        </section>
      )}
       {invoice.status === 'credited' && (
        <section className="mb-8 text-sm p-3 border border-purple-300 bg-purple-50 rounded-md text-purple-700">
            <h4 className="font-semibold mb-1 text-xs">Status: Gecrediteerd</h4>
            {invoice.paymentDetails && <p className="text-xs">{invoice.paymentDetails}</p>}
        </section>
      )}
      {invoice.status !== 'paid' && invoice.status !== 'credited' && invoice.status !== 'cancelled' && (
        <section className="mb-8 text-sm">
            <p>Gelieve het totaalbedrag van <strong>€{invoice.grandTotalInclVat.toFixed(2)}</strong> voor <strong>{new Date(invoice.dueDate+'T00:00:00').toLocaleDateString('nl-NL')}</strong> over te maken op rekeningnummer <strong>{invoice.companyDetails.bankAccountNumber}</strong> t.n.v. <strong>{invoice.companyDetails.name}</strong>, onder vermelding van factuurnummer <strong>{invoice.invoiceNumber}</strong>.</p>
        </section>
      )}


      <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
        <p>Hartelijk dank voor uw reservering!</p>
        <p>{invoice.companyDetails.name} - {invoice.companyDetails.addressLine1}, {invoice.companyDetails.addressLine2}</p>
      </footer>

      <div className="mt-8 text-center no-print">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          Factuur Printen
        </button>
         <button
            onClick={() => { window.location.hash = '#admin?mode=invoices'; }}
            className="ml-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
        >
            Terug naar Facturen
        </button>
      </div>
    </div>
  );
};

export default PrintableInvoice;
