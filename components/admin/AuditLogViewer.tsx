
import React, { useState, useMemo } from 'react';
import { AuditLogEntry, ReservationDetails, ShowSlot, Customer, PromoCode, PackageOption, MerchandiseItem } from '../../types';

interface AuditLogViewerProps {
  auditLogs: AuditLogEntry[];
  allBookings: ReservationDetails[];
  availableShowSlots: ShowSlot[];
  customers: Customer[];
  promoCodes: PromoCode[];
  allPackages: PackageOption[];
  merchandiseItems: MerchandiseItem[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  auditLogs,
  allBookings,
  availableShowSlots,
  customers,
  promoCodes,
  allPackages,
  merchandiseItems,
}) => {
  const [filters, setFilters] = useState({
    date: '',
    actor: '',
    actionType: '',
    entityType: '',
    entityId: '',
    searchTerm: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 25;

  const entityTypeOptions = useMemo(() => {
    const types = new Set<string>();
    auditLogs.forEach(log => {
      if (log.entityType) types.add(log.entityType);
    });
    return Array.from(types).sort();
  }, [auditLogs]);

  const actionTypeOptions = useMemo(() => {
    const types = new Set<string>();
    auditLogs.forEach(log => {
      if (log.actionType) types.add(log.actionType);
    });
    return Array.from(types).sort();
  }, [auditLogs]);


  const getEntityName = (entityType?: string, entityId?: string): string | null => {
    if (!entityType || !entityId) return null;
    switch (entityType) {
      case 'Reservation':
        const booking = allBookings.find(b => b.reservationId === entityId);
        return booking ? `Boeking: ${booking.name} (${booking.guests}p)` : null;
      case 'ShowSlot':
        const slot = availableShowSlots.find(s => s.id === entityId);
        return slot ? `Show: ${new Date(slot.date + 'T00:00:00').toLocaleDateString('nl-NL')} ${slot.time}` : null;
      case 'Customer':
        const customer = customers.find(c => c.id === entityId);
        return customer ? `Klant: ${customer.name}` : null;
      case 'PromoCode':
        const promo = promoCodes.find(p => p.id === entityId || p.code === entityId); // Check both id and code
        return promo ? `Code: ${promo.code}` : null;
      case 'MerchandiseItem':
        const merch = merchandiseItems.find(m => m.id === entityId);
        return merch ? `Merch: ${merch.name}` : null;
      default:
        return null;
    }
  };

  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter(log => {
        const dateMatch = !filters.date || log.timestamp.startsWith(filters.date);
        const actorMatch = !filters.actor || log.actor.toLowerCase().includes(filters.actor.toLowerCase());
        const actionTypeMatch = !filters.actionType || log.actionType.toLowerCase().includes(filters.actionType.toLowerCase());
        const entityTypeMatch = !filters.entityType || log.entityType === filters.entityType;
        const entityIdMatch = !filters.entityId || (log.entityId && log.entityId.toLowerCase().includes(filters.entityId.toLowerCase()));
        const searchTermMatch = !filters.searchTerm || log.details.toLowerCase().includes(filters.searchTerm.toLowerCase()) || (log.entityId && log.entityId.toLowerCase().includes(filters.searchTerm.toLowerCase())) || log.actor.toLowerCase().includes(filters.searchTerm.toLowerCase());
        return dateMatch && actorMatch && actionTypeMatch && entityTypeMatch && entityIdMatch && searchTermMatch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first
  }, [auditLogs, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ date: '', actor: '', actionType: '', entityType: '', entityId: '', searchTerm: '' });
    setCurrentPage(1);
  };

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Audit Logboek</h2>
      
      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dateFilter" className="block text-xs font-medium text-slate-600 mb-0.5">Datum (YYYY-MM-DD)</label>
            <input type="date" name="date" id="dateFilter" value={filters.date} onChange={handleFilterChange} className="w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="actorFilter" className="block text-xs font-medium text-slate-600 mb-0.5">Actor</label>
            <input type="text" name="actor" id="actorFilter" value={filters.actor} onChange={handleFilterChange} placeholder="Admin, Klant: Naam, Systeem" className="w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="actionTypeFilter" className="block text-xs font-medium text-slate-600 mb-0.5">Actie Type</label>
             <select name="actionType" id="actionTypeFilter" value={filters.actionType} onChange={handleFilterChange} className="w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Alle Acties</option>
              {actionTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="entityTypeFilter" className="block text-xs font-medium text-slate-600 mb-0.5">Entiteit Type</label>
            <select name="entityType" id="entityTypeFilter" value={filters.entityType} onChange={handleFilterChange} className="w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Alle Types</option>
              {entityTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="entityIdFilter" className="block text-xs font-medium text-slate-600 mb-0.5">Entiteit ID</label>
            <input type="text" name="entityId" id="entityIdFilter" value={filters.entityId} onChange={handleFilterChange} placeholder="ID van boeking, show, etc." className="w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
           <div className="lg:col-span-1">
            <label htmlFor="searchTerm" className="block text-xs font-medium text-slate-600 mb-0.5">Zoek in Details</label>
            <input type="text" name="searchTerm" id="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Zoekterm..." className="w-full p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
        </div>
        <button onClick={resetFilters} className="mt-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-1.5 px-4 rounded-md text-sm transition-colors shadow-sm">Reset Filters</button>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="text-slate-500 italic">Geen logs gevonden die aan de criteria voldoen.</p>
      ) : (
        <>
          <div className="overflow-x-auto max-h-[65vh] scrollbar-thin">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 shadow-sm">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wider">Tijdstip</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wider">Actor</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wider">Actie</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wider">Entiteit</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {currentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500 align-top">
                      {new Date(log.timestamp).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 align-top">{log.actor}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 font-medium align-top">{log.actionType}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 align-top">
                      {log.entityType && (
                        <div>
                          <span className="font-medium">{log.entityType}</span>
                          {log.entityId && <span className="block text-slate-400 text-[10px]">ID: ...{log.entityId.slice(-8)}</span>}
                          {getEntityName(log.entityType, log.entityId) && <span className="block text-indigo-500 text-[10px]">{getEntityName(log.entityType, log.entityId)}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 align-top min-w-[300px] break-words">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center text-sm">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Vorige
              </button>
              <span>Pagina {currentPage} van {totalPages}</span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Volgende
              </button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4">Totaal {filteredLogs.length} logs gevonden.</p>
        </>
      )}
       <p className="mt-6 text-xs text-slate-400 italic">
        Dit is een frontend-simulatie van een audit log. Logs gaan verloren bij het herladen van de pagina. 
        Een productiesysteem vereist backend-integratie voor persistente opslag.
      </p>
    </div>
  );
};
