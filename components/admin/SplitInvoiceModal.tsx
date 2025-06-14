
import React, { useState, useEffect } from 'react';
import { Invoice } from '../../types';

interface SplitInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToSplit: Invoice;
  onSplitInvoice: (originalInvoiceId: string, splitType: 'equalParts' | 'byAmount', splitValue: number) => Promise<boolean>;
}

const CloseIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const SplitInvoiceModal: React.FC<SplitInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToSplit,
  onSplitInvoice,
}) => {
  const [splitType, setSplitType] = useState<'equalParts' | 'byAmount'>('equalParts');
  const [numberOfParts, setNumberOfParts] = useState<number>(2);
  const [amountPart1, setAmountPart1] = useState<number | ''>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSplitType('equalParts');
      setNumberOfParts(2);
      setAmountPart1('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    setError('');
    if (splitType === 'equalParts') {
      if (numberOfParts < 2) {
        setError('Aantal delen moet minimaal 2 zijn.');
        return false;
      }
      if (numberOfParts > 10) { // Arbitrary limit to prevent too many invoices
        setError('Maximaal 10 delen toegestaan.');
        return false;
      }
    } else if (splitType === 'byAmount') {
      if (amountPart1 === '' || amountPart1 <= 0) {
        setError('Bedrag voor deel 1 moet positief zijn.');
        return false;
      }
      if (amountPart1 >= invoiceToSplit.grandTotalInclVat) {
        setError('Bedrag voor deel 1 moet kleiner zijn dan het totaalbedrag van de factuur.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    const splitValue = splitType === 'equalParts' ? numberOfParts : Number(amountPart1);
    const success = await onSplitInvoice(invoiceToSplit.id, splitType, splitValue);
    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      // Error message is usually handled by showToast in App.tsx
      setError('Factuur splitsen mislukt. Controleer de console voor details.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="split-invoice-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
          <h2 id="split-invoice-modal-title" className="text-xl font-semibold text-indigo-700">
            Factuur Splitsen: {invoiceToSplit.invoiceNumber}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 rounded-full" aria-label="Sluiten">
            <CloseIconSvg />
          </button>
        </div>

        <div className="mb-4 text-sm text-slate-600">
          <p><strong>Origineel Totaalbedrag:</strong> €{invoiceToSplit.grandTotalInclVat.toFixed(2)}</p>
        </div>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Splitsmethode</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitType"
                  value="equalParts"
                  checked={splitType === 'equalParts'}
                  onChange={() => setSplitType('equalParts')}
                  className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">In gelijke delen</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitType"
                  value="byAmount"
                  checked={splitType === 'byAmount'}
                  onChange={() => setSplitType('byAmount')}
                  className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">Op bedrag (2 delen)</span>
              </label>
            </div>
          </div>

          {splitType === 'equalParts' && (
            <div>
              <label htmlFor="numberOfParts" className="block text-sm font-medium text-slate-700 mb-1">Aantal delen</label>
              <input
                type="number"
                id="numberOfParts"
                value={numberOfParts}
                onChange={(e) => setNumberOfParts(parseInt(e.target.value, 10) || 2)}
                min="2"
                max="10"
                className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {splitType === 'byAmount' && (
            <div>
              <label htmlFor="amountPart1" className="block text-sm font-medium text-slate-700 mb-1">
                Bedrag voor deel 1 (incl. BTW)
              </label>
              <input
                type="number"
                id="amountPart1"
                value={amountPart1}
                onChange={(e) => setAmountPart1(parseFloat(e.target.value) || '')}
                step="0.01"
                min="0.01"
                max={invoiceToSplit.grandTotalInclVat - 0.01}
                className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="bv. 50.00"
              />
            </div>
          )}

          <div className="pt-5 flex justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-70"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? 'Bezig met splitsen...' : 'Factuur Splitsen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
