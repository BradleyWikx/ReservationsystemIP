
import React, { useState, useEffect, useMemo } from 'react';
import { PromoCode } from '../../types';

interface PromoCodeManagerProps {
  promoCodes: PromoCode[];
  onAddPromoCode: (codeData: Omit<PromoCode, 'id' | 'timesUsed'>) => PromoCode | null;
  onUpdatePromoCode: (updatedCode: PromoCode) => boolean;
  onDeletePromoCode: (codeId: string) => Promise<boolean>;
}

type ViewType = 'all' | 'discount' | 'gift_card';

const generateRandomCode = (prefix = "PROMO", length = 8): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix + '-';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const PromoCodeManager: React.FC<PromoCodeManagerProps> = ({
  promoCodes,
  onAddPromoCode,
  onUpdatePromoCode,
  onDeletePromoCode,
}) => {
  const [isEditing, setIsEditing] = useState<PromoCode | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount' | 'gift_card'>('fixed_amount');
  const [value, setValue] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expirationDate, setExpirationDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [minBookingAmount, setMinBookingAmount] = useState<number | ''>('');
  const [generatedFor, setGeneratedFor] = useState('');
  
  const [formError, setFormError] = useState<string>('');
  const [viewType, setViewType] = useState<ViewType>('all');

  useEffect(() => {
    if (isEditing) {
      setCode(isEditing.code);
      setType(isEditing.type);
      setValue(isEditing.value);
      setDescription(isEditing.description);
      setIsActive(isEditing.isActive);
      setExpirationDate(isEditing.expirationDate ? isEditing.expirationDate.split('T')[0] : '');
      setUsageLimit(isEditing.usageLimit ?? '');
      setMinBookingAmount(isEditing.minBookingAmount ?? '');
      setGeneratedFor(isEditing.generatedFor || '');
    } else {
      // Reset form
      setCode('');
      // Set default type based on current view, or fallback
      setType(viewType === 'gift_card' ? 'gift_card' : 'fixed_amount');
      setValue('');
      setDescription('');
      setIsActive(true);
      setExpirationDate('');
      setUsageLimit('');
      setMinBookingAmount('');
      setGeneratedFor('');
    }
    setFormError('');
  }, [isEditing, viewType]);

  const handleGenerateCodeClick = () => {
    const prefix = type === 'gift_card' ? 'IPGIFT' : (type === 'percentage' ? 'IPSALE' : 'IPFIXED');
    let newCode = generateRandomCode(prefix);
    while (promoCodes.find(pc => pc.code === newCode && (!isEditing || pc.id !== isEditing.id))) {
        newCode = generateRandomCode(prefix);
    }
    setCode(newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim()) { setFormError('Code is verplicht.'); return; }
    if (value === '' || value < 0) { setFormError('Waarde is verplicht en moet positief zijn.'); return; }
    if (type === 'percentage' && (value > 100 || value <=0)) { setFormError('Percentage moet tussen 1 en 100 liggen.'); return; }
    if (usageLimit !== '' && Number(usageLimit) < 0) { setFormError('Gebruikslimiet kan niet negatief zijn.'); return; }
    if (minBookingAmount !== '' && Number(minBookingAmount) < 0) { setFormError('Min. boekingsbedrag kan niet negatief zijn.'); return; }
    if (expirationDate && new Date(expirationDate + 'T00:00:00Z') < new Date(new Date().setHours(0,0,0,0)) && !isEditing) {
        setFormError('Vervaldatum kan niet in het verleden liggen.'); return;
    }

    const codeData: Omit<PromoCode, 'id' | 'timesUsed'> = {
      code: code.trim(),
      type,
      value: Number(value),
      description,
      isActive,
      expirationDate: expirationDate || undefined,
      usageLimit: usageLimit === '' ? undefined : Number(usageLimit),
      minBookingAmount: minBookingAmount === '' ? undefined : Number(minBookingAmount),
      generatedFor: type === 'gift_card' ? (generatedFor || undefined) : undefined, // Only for gift_card
    };

    let success = false;
    if (isEditing) {
      success = onUpdatePromoCode({ ...isEditing, ...codeData });
    } else {
      const newCode = onAddPromoCode(codeData);
      success = !!newCode;
    }

    if (success) {
      setIsEditing(null); 
    }
  };

  const startEdit = (promoCode: PromoCode) => {
    setIsEditing(promoCode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => setIsEditing(null);

  const filteredAndSortedCodes = useMemo(() => {
    return promoCodes
      .filter(pc => {
        if (viewType === 'all') return true;
        if (viewType === 'gift_card') return pc.type === 'gift_card';
        if (viewType === 'discount') return pc.type === 'percentage' || pc.type === 'fixed_amount';
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [promoCodes, viewType]);


  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        {isEditing ? `Code Bewerken: ${isEditing.code}` : 'Kortingscodes & Cadeaubonnen Beheer'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4 shadow">
        <h3 className="text-lg font-semibold text-indigo-700">{isEditing ? 'Details Aanpassen' : 'Nieuwe Code/Bon Toevoegen'}</h3>
        {formError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm shadow-sm">{formError}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="promoCodeType" className="block text-sm font-medium text-slate-600 mb-1">Type</label>
            <select id="promoCodeType" value={type} onChange={e => setType(e.target.value as PromoCode['type'])} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="fixed_amount">Vast Bedrag Korting</option>
              <option value="percentage">Percentage Korting</option>
              <option value="gift_card">Cadeaubon</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="promoCodeString" className="block text-sm font-medium text-slate-600 mb-1">Code</label>
            <div className="flex">
              <input type="text" id="promoCodeString" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full p-2 border-slate-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
              <button type="button" onClick={handleGenerateCodeClick} className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium px-3 py-2 rounded-r-md transition-colors shadow-sm">Genereer</button>
            </div>
          </div>
          <div>
            <label htmlFor="promoValue" className="block text-sm font-medium text-slate-600 mb-1">
              Waarde {type === 'percentage' ? '(%)' : '(€)'}
            </label>
            <input type="number" id="promoValue" value={value} onChange={e => setValue(parseFloat(e.target.value) || '')} 
                   step={type === 'percentage' ? '1' : '0.01'} min="0" 
                   className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          {type !== 'gift_card' && (
            <>
            <div>
                <label htmlFor="promoUsageLimit" className="block text-sm font-medium text-slate-600 mb-1">Gebruikslimiet (leeg = onbeperkt)</label>
                <input type="number" id="promoUsageLimit" value={usageLimit} onChange={e => setUsageLimit(e.target.value === '' ? '' : parseInt(e.target.value))} min="0" className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="promoMinBookingAmount" className="block text-sm font-medium text-slate-600 mb-1">Min. Boekingsbedrag (€, optioneel)</label>
                <input type="number" id="promoMinBookingAmount" value={minBookingAmount} onChange={e => setMinBookingAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} step="0.01" min="0" className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            </>
          )}
          {type === 'gift_card' && (
            <div className="lg:col-span-2">
                <label htmlFor="promoGeneratedFor" className="block text-sm font-medium text-slate-600 mb-1">Gegenereerd Voor (optioneel, bv. naam ontvanger)</label>
                <input type="text" id="promoGeneratedFor" value={generatedFor} onChange={e => setGeneratedFor(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
          )}
        </div>
        
        <div>
            <label htmlFor="promoDescription" className="block text-sm font-medium text-slate-600 mb-1">Beschrijving (voor admin)</label>
            <textarea id="promoDescription" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {type !== 'gift_card' && (
              <div>
                  <label htmlFor="promoExpiration" className="block text-sm font-medium text-slate-600 mb-1">Vervaldatum (optioneel)</label>
                  <input type="date" id="promoExpiration" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
            )}
            <div className="pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="form-checkbox h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/>
                <span className="text-sm font-medium text-slate-700">Actief</span>
                </label>
            </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm shadow-md hover:shadow-lg transition-all">
            {isEditing ? 'Wijzigingen Opslaan' : 'Toevoegen'}
          </button>
          {isEditing && (
            <button type="button" onClick={cancelEdit} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm shadow-sm hover:shadow-md transition-colors">
              Annuleren
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 border-b border-slate-200">
        <nav className="flex space-x-1 -mb-px" aria-label="Tabs">
            { (['all', 'discount', 'gift_card'] as ViewType[]).map(tabType => (
                <button
                    key={tabType}
                    onClick={() => setViewType(tabType)}
                    className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                        ${viewType === tabType 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    aria-current={viewType === tabType ? 'page' : undefined}
                >
                    {tabType === 'all' ? 'Alle' : tabType === 'discount' ? 'Kortingscodes' : 'Cadeaubonnen'} ({
                        tabType === 'all' ? promoCodes.length :
                        tabType === 'gift_card' ? promoCodes.filter(pc=>pc.type === 'gift_card').length :
                        promoCodes.filter(pc=>pc.type === 'percentage' || pc.type === 'fixed_amount').length
                    })
                </button>
            ))}
        </nav>
      </div>


      <div>
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">
            {viewType === 'all' ? 'Alle Codes & Bonnen' : viewType === 'discount' ? 'Kortingscodes' : 'Cadeaubonnen'} ({filteredAndSortedCodes.length})
        </h3>
        {filteredAndSortedCodes.length === 0 ? (
          <p className="text-slate-500 italic">
            {promoCodes.length === 0 ? "Nog geen codes of bonnen aangemaakt." : `Geen items van type '${viewType}' gevonden.`}
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            {filteredAndSortedCodes.map(pc => (
              <div key={pc.id} className={`p-4 rounded-lg shadow-md border ${pc.isActive ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-300 opacity-70'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                  <div>
                    <h4 className={`font-bold text-lg ${pc.isActive ? 'text-indigo-700' : 'text-slate-500'}`}>{pc.code}</h4>
                    <p className="text-xs text-slate-500">{pc.description}</p>
                  </div>
                  <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                    <button onClick={() => startEdit(pc)} className="text-xs bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold py-1 px-2.5 rounded-md shadow-sm hover:shadow-md transition-colors">Bewerk</button>
                    <button onClick={() => onDeletePromoCode(pc.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2.5 rounded-md shadow-sm hover:shadow-md transition-colors">Verwijder</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-sm text-slate-600">
                  <div><strong>Type:</strong> {pc.type === 'percentage' ? 'Procent' : pc.type === 'fixed_amount' ? 'Vast Bedrag' : 'Cadeaubon'}</div>
                  <div><strong>Waarde:</strong> {pc.type === 'percentage' ? `${pc.value}%` : `€${pc.value.toFixed(2)}`}</div>
                  <div><strong>Status:</strong> <span className={pc.isActive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{pc.isActive ? 'Actief' : 'Inactief'}</span></div>
                  {pc.type !== 'gift_card' && <div><strong>Gebruikt:</strong> {pc.timesUsed} / {pc.usageLimit ?? '∞'}</div>}
                  {pc.type === 'gift_card' && <div><strong>Resterende Waarde:</strong> <span className="text-slate-400 italic">(Nog niet geïmpl.)</span></div>}
                  {pc.expirationDate && pc.type !== 'gift_card' && <div><strong>Vervalt op:</strong> {new Date(pc.expirationDate  + 'T00:00:00Z').toLocaleDateString('nl-NL')}</div>}
                  {pc.minBookingAmount && pc.type !== 'gift_card' && <div><strong>Min. Bedrag:</strong> €{pc.minBookingAmount.toFixed(2)}</div>}
                  {pc.generatedFor && <div><strong>Voor:</strong> {pc.generatedFor}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
