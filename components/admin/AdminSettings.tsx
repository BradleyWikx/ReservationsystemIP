import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, ShowSlot, PackageOption } from '../../types';
import type { ToastMessage } from '../shared/ToastNotifications';

export interface AdminSettingsProps {
  appSettings: AppSettings;
  availableShowSlots: ShowSlot[];
  allPackages: PackageOption[];
  onUpdateAppSettings: (updatedSettings: Partial<AppSettings>) => void; // Added onUpdateAppSettings
  onUpdateDefaultShowAndPackage: (showId?: string, packageId?: string) => void;
  showToast: (message: string, type: ToastMessage['type']) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  appSettings,
  availableShowSlots,
  allPackages,
  onUpdateAppSettings, // Added onUpdateAppSettings
  onUpdateDefaultShowAndPackage,
  showToast,
}) => {
  const [selectedDefaultShowId, setSelectedDefaultShowId] = useState<string>(appSettings.defaultShowId || '');
  const [selectedDefaultPackageId, setSelectedDefaultPackageId] = useState<string>(appSettings.defaultPackageId || '');
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>(appSettings); // For other settings

  useEffect(() => {
    setSelectedDefaultShowId(appSettings.defaultShowId || '');
    setSelectedDefaultPackageId(appSettings.defaultPackageId || '');
    setLocalSettings(appSettings); // Sync local settings when appSettings prop changes
  }, [appSettings]);

  const futureOpenShowSlots = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return availableShowSlots
      .filter(slot => slot.date >= today && !slot.isManuallyClosed && slot.bookedCount < slot.capacity)
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [availableShowSlots]);

  const packagesAvailableForSelectedDefaultShow = useMemo(() => {
    if (!selectedDefaultShowId) return allPackages; 
    const show = futureOpenShowSlots.find(s => s.id === selectedDefaultShowId);
    if (show) {
      return allPackages.filter(p => show.availablePackageIds.includes(p.id));
    }
    return allPackages; 
  }, [selectedDefaultShowId, futureOpenShowSlots, allPackages]);

  useEffect(() => {
    if (selectedDefaultShowId && selectedDefaultPackageId) {
        const show = futureOpenShowSlots.find(s => s.id === selectedDefaultShowId);
        if (show && !show.availablePackageIds.includes(selectedDefaultPackageId)) {
            setSelectedDefaultPackageId(''); 
             showToast('Standaard arrangement was niet geldig voor de nieuw geselecteerde show en is gereset.', 'info');
        }
    }
  }, [selectedDefaultShowId, selectedDefaultPackageId, futureOpenShowSlots, showToast]);


  const handleSaveDefaults = () => {
    if (selectedDefaultShowId && !selectedDefaultPackageId) {
        showToast('Selecteer ook een standaard arrangement als u een standaard show instelt.', 'warning');
        return;
    }
    if (!selectedDefaultShowId && selectedDefaultPackageId) {
        showToast('Selecteer ook een standaard show als u een standaard arrangement instelt.', 'warning');
        return;
    }
    onUpdateDefaultShowAndPackage(selectedDefaultShowId || undefined, selectedDefaultPackageId || undefined);
  };

  const handleClearDefaults = () => {
    setSelectedDefaultShowId('');
    setSelectedDefaultPackageId('');
    onUpdateDefaultShowAndPackage(undefined, undefined);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const numValue = parseFloat(value);

    setLocalSettings(prev => {
        const keys = name.split('.');
        if (keys.length === 2) { // Nested property like companyDetails.name
            return {
                ...prev,
                [keys[0]]: {
                    ...(prev as any)[keys[0]],
                    [keys[1]]: type === 'checkbox' ? checked : (type === 'number' ? numValue : value)
                }
            };
        }
        return {
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? numValue : value)
        };
    });
  };

  const handleSaveAllSettings = () => {
    onUpdateAppSettings(localSettings);
    // Default show/package is saved separately by its own button
    // showToast('Alle instellingen opgeslagen!', 'success'); // App.tsx will show toast
  };

  const currentDefaultShow = appSettings.defaultShowId ? availableShowSlots.find(s => s.id === appSettings.defaultShowId) : null;
  const currentDefaultPackage = appSettings.defaultPackageId ? allPackages.find(p => p.id === appSettings.defaultPackageId) : null;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Algemene Instellingen</h2>

      <section className="mb-8 p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow-sm">
        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Standaard Boeking Instellingen</h3>
        <p className="text-sm text-slate-600 mb-4">
          Stel een standaard show en arrangement in die worden voorgeladen wanneer een gebruiker het boekingsproces start zonder een specifieke show te selecteren.
          Dit beïnvloedt alleen nieuwe, algemene boekingen, niet reeds gemaakte reserveringen.
        </p>

        { (currentDefaultShow || currentDefaultPackage) && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                <h4 className="font-semibold text-green-700 mb-1">Huidige Standaarden:</h4>
                {currentDefaultShow ? (
                    <p><strong>Show:</strong> {new Date(currentDefaultShow.date + "T00:00:00").toLocaleDateString('nl-NL', {weekday: 'long', day: 'numeric', month: 'long'})} om {currentDefaultShow.time}</p>
                ) : <p>Geen standaard show ingesteld.</p>}
                {currentDefaultPackage ? (
                    <p><strong>Arrangement:</strong> {currentDefaultPackage.name} (€{currentDefaultPackage.price?.toFixed(2) || 'N/A'})</p>
                ) : <p>Geen standaard arrangement ingesteld.</p>}
                 {(currentDefaultShow && new Date(currentDefaultShow.date + 'T' + currentDefaultShow.time) < new Date()) && 
                    <p className="text-orange-600 text-xs mt-1">Let op: de huidige standaard show is in het verleden.</p>
                 }
                 {(currentDefaultShow && (currentDefaultShow.isManuallyClosed || currentDefaultShow.bookedCount >= currentDefaultShow.capacity)) &&
                    <p className="text-orange-600 text-xs mt-1">Let op: de huidige standaard show is gesloten of vol.</p>
                 }
            </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="defaultShowId" className="block text-sm font-medium text-slate-700 mb-1">
              Standaard Show (Toekomstig & Beschikbaar)
            </label>
            <select
              id="defaultShowId"
              value={selectedDefaultShowId}
              onChange={(e) => setSelectedDefaultShowId(e.target.value)}
              className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Geen Standaard Show --</option>
              {futureOpenShowSlots.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} - {slot.time} ({slot.bookedCount}/{slot.capacity})
                </option>
              ))}
            </select>
             {futureOpenShowSlots.length === 0 && !selectedDefaultShowId && <p className="text-xs text-amber-600 mt-1">Geen toekomstige, open shows beschikbaar om als standaard in te stellen.</p>}
          </div>

          <div>
            <label htmlFor="defaultPackageId" className="block text-sm font-medium text-slate-700 mb-1">
              Standaard Arrangement
            </label>
            <select
              id="defaultPackageId"
              value={selectedDefaultPackageId}
              onChange={(e) => setSelectedDefaultPackageId(e.target.value)}
              className="w-full p-2 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!selectedDefaultShowId && packagesAvailableForSelectedDefaultShow.length === allPackages.length} 
            >
              <option value="">-- Geen Standaard Arrangement --</option>
              {packagesAvailableForSelectedDefaultShow.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - €{pkg.price?.toFixed(2) || 'N/A'}
                </option>
              ))}
            </select>
            {selectedDefaultShowId && packagesAvailableForSelectedDefaultShow.length === 0 && <p className="text-xs text-amber-600 mt-1">Geen arrangementen beschikbaar voor de geselecteerde standaard show.</p>}
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSaveDefaults}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors"
            >
              Standaarden Opslaan
            </button>
            <button
              onClick={handleClearDefaults}
              disabled={!appSettings.defaultShowId && !appSettings.defaultPackageId}
              className="bg-slate-400 hover:bg-slate-500 text-white font-medium py-2 px-3 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              Wis Standaarden
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8 p-4 border border-teal-200 rounded-lg bg-teal-50 shadow-sm">
        <h3 className="text-xl font-semibold text-teal-700 mb-4">Bedrijfsgegevens & Facturatie</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                <label htmlFor="companyDetails.name" className="block text-sm font-medium text-slate-700">Bedrijfsnaam</label>
                <input type="text" name="companyDetails.name" id="companyDetails.name" value={localSettings.companyDetails?.name || ''} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            {/* Add more fields for companyDetails, lastInvoiceNumber, invoiceDueDays, etc. similar to above */}
            <div>
                <label htmlFor="invoiceNrPrefix" className="block text-sm font-medium text-slate-700">Factuurnummer Prefix</label>
                <input type="text" name="invoiceNrPrefix" id="invoiceNrPrefix" value={localSettings.invoiceNrPrefix || ''} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
             <div>
                <label htmlFor="vatRateHigh" className="block text-sm font-medium text-slate-700">BTW Tarief Hoog (%)</label>
                <input type="number" name="vatRateHigh" id="vatRateHigh" value={localSettings.vatRateHigh || 0} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div>
                <label htmlFor="vatRateLow" className="block text-sm font-medium text-slate-700">BTW Tarief Laag (%)</label>
                <input type="number" name="vatRateLow" id="vatRateLow" value={localSettings.vatRateLow || 0} onChange={handleSettingsChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="paymentInstructions" className="block text-sm font-medium text-slate-700">Betalingsinstructies (voor facturen)</label>
                <textarea name="paymentInstructions" id="paymentInstructions" value={localSettings.paymentInstructions || ''} onChange={handleSettingsChange} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"></textarea>
            </div>
        </div>
      </section>

      <div className="mt-8 flex justify-end space-x-3">
        <button 
            type="button" 
            onClick={handleSaveAllSettings} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
            Alle Instellingen Opslaan
        </button>
      </div>
    </div>
  );
};
