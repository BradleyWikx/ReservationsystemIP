
import React, { useState, useMemo } from 'react';
import { ReservationDetails, PackageOption, Invoice, PromoCode, ShowSlot, MerchandiseItem, SpecialAddOn, ShowType, AppSettings } from '../../types';

interface ReportsPageProps {
  allBookings: ReservationDetails[];
  availableShowSlots: ShowSlot[];
  allPackages: PackageOption[];
  invoices: Invoice[];
  promoCodes: PromoCode[];
  merchandiseItems: MerchandiseItem[];
  specialAddons: SpecialAddOn[];
  appSettings: Partial<AppSettings>;
}

interface MonthlyBookingStats {
  month: string;
  bookingCount: number;
  guestCount: number;
  totalRevenueFromBookings: number;
}
interface RevenueByPackage {
  packageName: string;
  bookingCount: number;
  totalRevenue: number;
}
interface RevenueByShowType {
    showType: ShowType | string;
    bookingCount: number;
    totalRevenue: number;
}
interface MerchandiseSalesReport {
    itemId: string;
    itemName: string;
    quantitySold: number;
    totalRevenue: number;
}
interface PromoCodeUsageReport {
    code: string;
    description: string;
    timesUsed: number;
    totalDiscountGiven: number;
}


export const ReportsPage: React.FC<ReportsPageProps> = ({
  allBookings,
  availableShowSlots,
  allPackages,
  invoices,
  promoCodes,
  merchandiseItems,
  specialAddons,
  appSettings,
}) => {
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMonthYear, setFilterMonthYear] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const calculateBookingRevenue = (booking: ReservationDetails): number => {
    let revenue = 0;
    const pkg = allPackages.find(p => p.id === booking.packageId);
    if (pkg) {
      revenue += pkg.price * booking.guests;
    }
    if (booking.selectedVoorborrel) {
        const addon = specialAddons.find(sa => sa.id === 'voorborrel');
        if (addon) revenue += addon.price * booking.guests;
    }
    if (booking.selectedNaborrel) {
        const addon = specialAddons.find(sa => sa.id === 'naborrel');
        if (addon) revenue += addon.price * booking.guests;
    }
    booking.merchandise?.forEach(m => {
        revenue += m.itemPrice * m.quantity;
    });
    revenue -= (booking.discountAmount || 0);
    return revenue;
  };

  const confirmedBookings = useMemo(() => allBookings.filter(b => b.status === 'confirmed'), [allBookings]);

  // --- Overall Summary Calculations ---
  const totalRevenueFromConfirmedBookings = useMemo(() => {
    return confirmedBookings.reduce((sum, booking) => sum + calculateBookingRevenue(booking), 0);
  }, [confirmedBookings, allPackages, specialAddons]);

  const totalRevenueFromInvoices = useMemo(() => {
    return invoices.filter(inv => inv.status === 'paid' || inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.grandTotalInclVat, 0);
  }, [invoices]);

  const totalConfirmedBookingsCount = confirmedBookings.length;
  const totalGuestsInConfirmedBookings = confirmedBookings.reduce((sum, b) => sum + b.guests, 0);
  const averageGuestsPerBooking = totalConfirmedBookingsCount > 0 ? (totalGuestsInConfirmedBookings / totalConfirmedBookingsCount) : 0;

  const overallOccupancyRate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pastOrCurrentSlots = availableShowSlots.filter(slot => slot.date <= today && !slot.isManuallyClosed);
    const totalCapacity = pastOrCurrentSlots.reduce((sum, slot) => sum + slot.capacity, 0);
    const totalBookedGuests = pastOrCurrentSlots.reduce((sum, slot) => sum + slot.bookedCount, 0);
    return totalCapacity > 0 ? (totalBookedGuests / totalCapacity) * 100 : 0;
  }, [availableShowSlots]);

  // --- Financial Reports Calculations ---
  const revenueByPackage = useMemo((): RevenueByPackage[] => {
    const stats: Record<string, { count: number; revenue: number }> = {};
    confirmedBookings.forEach(booking => {
      const pkg = allPackages.find(p => p.id === booking.packageId);
      if (pkg) {
        if (!stats[pkg.name]) stats[pkg.name] = { count: 0, revenue: 0 };
        stats[pkg.name].count++;
        stats[pkg.name].revenue += calculateBookingRevenue(booking);
      }
    });
    return Object.entries(stats).map(([name, data]) => ({ packageName: name, bookingCount: data.count, totalRevenue: data.revenue })).sort((a,b) => b.totalRevenue - a.totalRevenue);
  }, [confirmedBookings, allPackages]);

  const revenueByShowType = useMemo((): RevenueByShowType[] => {
    const stats: Record<string, { count: number; revenue: number }> = {};
    confirmedBookings.forEach(booking => {
        const slot = availableShowSlots.find(s => s.id === booking.showSlotId);
        const showType = slot?.showType || 'REGULAR';
        if (!stats[showType]) stats[showType] = { count: 0, revenue: 0 };
        stats[showType].count++;
        stats[showType].revenue += calculateBookingRevenue(booking);
    });
    return Object.entries(stats).map(([type, data]) => ({ showType: type, bookingCount: data.count, totalRevenue: data.revenue })).sort((a,b) => b.totalRevenue - a.totalRevenue);
  }, [confirmedBookings, availableShowSlots]);

  const merchandiseSalesReport = useMemo((): MerchandiseSalesReport[] => {
    const stats: Record<string, { itemName: string; quantitySold: number; totalRevenue: number; }> = {};
    confirmedBookings.forEach(booking => {
        booking.merchandise?.forEach(orderedItem => {
            if (!stats[orderedItem.itemId]) stats[orderedItem.itemId] = { itemName: orderedItem.itemName, quantitySold: 0, totalRevenue: 0};
            stats[orderedItem.itemId].quantitySold += orderedItem.quantity;
            stats[orderedItem.itemId].totalRevenue += orderedItem.itemPrice * orderedItem.quantity;
        });
    });
    return Object.entries(stats).map(([id, data]) => ({ 
        itemId: id, 
        itemName: data.itemName,
        quantitySold: data.quantitySold,
        totalRevenue: data.totalRevenue 
    })).sort((a,b) => b.totalRevenue - a.totalRevenue);
  }, [confirmedBookings]);
  
  const totalMerchandiseRevenue = merchandiseSalesReport.reduce((sum, item) => sum + item.totalRevenue, 0);

  const invoiceSummary = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotalInclVat, 0);
    const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.grandTotalInclVat, 0);
    const totalCredited = invoices.filter(inv => inv.status === 'credited').reduce((sum, inv) => sum + inv.grandTotalInclVat, 0); // Usually negative
    const totalOutstanding = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.grandTotalInclVat, 0);
    return { totalInvoiced, totalPaid, totalOutstanding, totalCredited };
  }, [invoices]);

  // --- Booking Trends Calculations ---
  const monthlyBookingStats = useMemo((): MonthlyBookingStats[] => {
    const stats: Record<string, { month: string; bookingCount: number; guestCount: number; totalRevenueFromBookings: number }> = {};
    const [year, month] = filterMonthYear.split('-');
    
    confirmedBookings.forEach(booking => {
      if (booking.date.startsWith(filterMonthYear)) {
        const day = booking.date; // Using full date string as key for daily summary within month for now
        if (!stats[day]) {
          stats[day] = { month: day, bookingCount: 0, guestCount: 0, totalRevenueFromBookings: 0 };
        }
        stats[day].bookingCount++;
        stats[day].guestCount += booking.guests;
        stats[day].totalRevenueFromBookings += calculateBookingRevenue(booking);
      }
    });
    return Object.values(stats).sort((a, b) => a.month.localeCompare(b.month));
  }, [confirmedBookings, filterMonthYear]);
  
  const totalForFilteredMonth = monthlyBookingStats.reduce((acc, curr) => {
    acc.bookingCount += curr.bookingCount;
    acc.guestCount += curr.guestCount;
    acc.totalRevenueFromBookings += curr.totalRevenueFromBookings;
    return acc;
  }, { bookingCount: 0, guestCount: 0, totalRevenueFromBookings: 0});

  // --- Occupancy Reports Calculations ---
  const occupancyForFilteredDate = useMemo(() => {
    const slotsOnDate = availableShowSlots.filter(slot => slot.date === filterDate && !slot.isManuallyClosed);
    if (slotsOnDate.length === 0) return [];
    return slotsOnDate.map(slot => ({
      time: slot.time,
      capacity: slot.capacity,
      booked: slot.bookedCount,
      occupancy: slot.capacity > 0 ? (slot.bookedCount / slot.capacity) * 100 : 0,
    })).sort((a,b)=> a.time.localeCompare(b.time));
  }, [availableShowSlots, filterDate]);
  
  const averageOccupancyByShowType = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const stats: Record<string, { totalCapacity: number, totalBooked: number, slotCount: number }> = {};
    availableShowSlots.filter(s => s.date <= today && !s.isManuallyClosed).forEach(slot => {
        const type = slot.showType || ShowType.REGULAR;
        if(!stats[type]) stats[type] = {totalCapacity:0, totalBooked:0, slotCount: 0};
        stats[type].totalCapacity += slot.capacity;
        stats[type].totalBooked += slot.bookedCount;
        stats[type].slotCount++;
    });
    return Object.entries(stats).map(([type, data]) => ({
        showType: type as ShowType | string,
        averageOccupancy: data.totalCapacity > 0 ? (data.totalBooked / data.totalCapacity) * 100 : 0,
        slotCount: data.slotCount
    })).sort((a,b) => b.averageOccupancy - a.averageOccupancy);
  }, [availableShowSlots]);

  // --- Promo Code Usage Calculations ---
  const promoCodeUsageReport = useMemo((): PromoCodeUsageReport[] => {
    const stats: Record<string, { code: string; description: string; timesUsed: number; totalDiscountGiven: number }> = {};
    // Initialize with all defined promo codes
    promoCodes.forEach(pc => {
      stats[pc.code] = { code: pc.code, description: pc.description, timesUsed: 0, totalDiscountGiven: 0 };
    });
    // Aggregate usage from confirmed bookings
    confirmedBookings.forEach(booking => {
      if (booking.appliedPromoCode && booking.discountAmount) {
        if (stats[booking.appliedPromoCode]) {
          stats[booking.appliedPromoCode].timesUsed++;
          stats[booking.appliedPromoCode].totalDiscountGiven += booking.discountAmount;
        } else {
          // This case handles if a booking used a code not in the current `promoCodes` state (e.g., an old/deleted one)
          stats[booking.appliedPromoCode] = { 
            code: booking.appliedPromoCode, 
            description: "Code niet (meer) in systeem", 
            timesUsed: 1, 
            totalDiscountGiven: booking.discountAmount 
          };
        }
      }
    });
    return Object.values(stats).filter(s => s.timesUsed > 0 || promoCodes.some(pc => pc.code === s.code)).sort((a,b) => b.timesUsed - a.timesUsed);
  }, [confirmedBookings, promoCodes]);


  // --- Rendering Helpers ---
  const ReportCard: React.FC<{ title: string; value: string | number; description?: string, icon?: React.ReactNode }> = ({ title, value, description, icon }) => (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-5 rounded-xl shadow-lg text-white transition-all hover:shadow-xl hover:scale-105 transform">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-semibold text-indigo-100">{title}</h4>
        {icon && <div className="text-indigo-200 opacity-75">{icon}</div>}
      </div>
      <p className="text-3xl font-bold mt-1.5">{typeof value === 'number' && !title.toLowerCase().includes("percentage") && !title.toLowerCase().includes("gemiddeld") ? `€${value.toFixed(2)}` : value.toLocaleString('nl-NL', {maximumFractionDigits: 2}) }{ title.toLowerCase().includes("percentage") || title.toLowerCase().includes("bezettingsgraad") ? "%" : ""}</p>
      {description && <p className="text-xs text-indigo-200 mt-1">{description}</p>}
    </div>
  );

  const ReportSection: React.FC<{ title: string; children: React.ReactNode; note?: string }> = ({ title, children, note }) => (
    <section className="p-4 border border-slate-200 rounded-lg bg-slate-50 shadow">
      <h3 className="text-xl font-semibold text-indigo-700 mb-3 pb-2 border-b border-indigo-100">{title}</h3>
      {children}
      {note && <p className="text-xs text-slate-400 italic mt-3">{note}</p>}
    </section>
  );
  
  const Table: React.FC<{ headers: string[]; data: (string | number)[][]; footers?: (string|number)[] }> = ({ headers, data, footers }) => (
    <div className="overflow-x-auto max-h-80 scrollbar-thin">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 sticky top-0">
          <tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-medium text-slate-600 whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => <tr key={i} className="hover:bg-slate-50">{row.map((cell, j) => <td key={j} className={`px-3 py-1.5 whitespace-nowrap ${typeof cell === 'number' ? 'text-right' : 'text-left'} ${headers[j].toLowerCase().includes('euro') || headers[j].toLowerCase().includes('omzet') || headers[j].toLowerCase().includes('korting') ? 'font-mono' : ''}`}>{typeof cell === 'number' ? (headers[j].toLowerCase().includes('percentage') || headers[j].toLowerCase().includes('bezetting') ? cell.toFixed(2) + '%' : `€${cell.toFixed(2)}`) : cell}</td>)}</tr>)}
          {footers && (
            <tr className="bg-slate-100 font-semibold">
              {footers.map((f, i) => <td key={i} className={`px-3 py-2 whitespace-nowrap ${typeof f === 'number' ? 'text-right' : (i === 0 ? 'text-left' : 'text-right')} ${headers[i].toLowerCase().includes('euro') || headers[i].toLowerCase().includes('omzet') || headers[i].toLowerCase().includes('korting') ? 'font-mono' : ''}`}>{typeof f === 'number' ? `€${f.toFixed(2)}` : f}</td>)}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );


  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-slate-200 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-1">Rapportages en Analyse</h2>
        <p className="text-xs text-slate-500 mb-5 italic">Let op: Veel rapporten zijn indicatief en gebaseerd op client-side data. Factuurdata is server-gesynchroniseerd.</p>
      </div>

      {/* Overall Summary */}
      <ReportSection title="Algemeen Overzicht" note="Omzet indicatief o.b.v. bevestigde boekingen & betaalde/verzonden facturen.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCard title="Totale Omzet Indicatief" value={(totalRevenueFromConfirmedBookings + totalRevenueFromInvoices)/2} description="Gem. van boekingen & facturen" />
          <ReportCard title="Totaal Bevestigde Boekingen" value={totalConfirmedBookingsCount} description="Aantal reserveringen" />
          <ReportCard title="Gem. Gasten / Boeking" value={averageGuestsPerBooking.toFixed(1)} description="Gemiddeld per reservering"/>
          <ReportCard title="Gem. Bezettingsgraad" value={overallOccupancyRate.toFixed(1)} description="Voor shows tot vandaag"/>
        </div>
      </ReportSection>

      {/* Financial Reports */}
      <ReportSection title="Financiële Rapporten" note="Boeking-gebaseerde omzet is indicatief. Factuur Samenvatting is gebaseerd op server data.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h4 className="text-md font-medium text-slate-700 mb-1.5">Omzet per Arrangement (o.b.v. boekingen)</h4>
                <Table headers={["Arrangement", "Boekingen", "Totale Omzet"]} data={revenueByPackage.map(r => [r.packageName, r.bookingCount, r.totalRevenue])} footers={["Totaal", revenueByPackage.reduce((s,r)=>s+r.bookingCount,0), revenueByPackage.reduce((s,r)=>s+r.totalRevenue,0) ]}/>
            </div>
            <div>
                <h4 className="text-md font-medium text-slate-700 mb-1.5">Omzet per Show Type (o.b.v. boekingen)</h4>
                <Table headers={["Show Type", "Boekingen", "Totale Omzet"]} data={revenueByShowType.map(r => [r.showType, r.bookingCount, r.totalRevenue])} footers={["Totaal", revenueByShowType.reduce((s,r)=>s+r.bookingCount,0), revenueByShowType.reduce((s,r)=>s+r.totalRevenue,0) ]}/>
            </div>
            <div>
                <h4 className="text-md font-medium text-slate-700 mb-1.5">Merchandise Verkoop (o.b.v. boekingen)</h4>
                <Table headers={["Item", "Aantal Verkocht", "Totale Omzet"]} data={merchandiseSalesReport.map(r => [r.itemName, r.quantitySold, r.totalRevenue])} footers={["Totaal", merchandiseSalesReport.reduce((s,r)=>s+r.quantitySold,0), totalMerchandiseRevenue ]}/>
            </div>
            <div>
                 <h4 className="text-md font-medium text-slate-700 mb-1.5">Factuur Samenvatting (server data)</h4>
                 <div className="space-y-1 text-sm p-3 bg-slate-100 rounded-md">
                    <p>Totaal Gefactureerd: <span className="font-mono font-semibold">€{invoiceSummary.totalInvoiced.toFixed(2)}</span></p>
                    <p>Totaal Betaald: <span className="font-mono font-semibold text-green-600">€{invoiceSummary.totalPaid.toFixed(2)}</span></p>
                    <p>Totaal Openstaand: <span className="font-mono font-semibold text-red-600">€{invoiceSummary.totalOutstanding.toFixed(2)}</span></p>
                    <p>Totaal Gecrediteerd: <span className="font-mono font-semibold text-purple-600">€{invoiceSummary.totalCredited.toFixed(2)}</span> (meestal negatief)</p>
                 </div>
            </div>
        </div>
      </ReportSection>
      
      {/* Booking Trends */}
      <ReportSection title="Boeking Trends (o.b.v. bevestigde boekingen)">
        <div className="mb-3 flex items-center space-x-3">
            <label htmlFor="filterMonthYear" className="text-sm font-medium text-slate-600">Selecteer Maand/Jaar:</label>
            <input type="month" id="filterMonthYear" value={filterMonthYear} onChange={e => setFilterMonthYear(e.target.value)} className="p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <Table headers={["Dag", "Aantal Boekingen", "Aantal Gasten", "Omzet (Boekingen)"]} data={monthlyBookingStats.map(s => [new Date(s.month+'T00:00:00').toLocaleDateString('nl-NL', {day:'2-digit'}), s.bookingCount, s.guestCount, s.totalRevenueFromBookings])} footers={[`Totaal (${new Date(filterMonthYear+'-01T00:00:00').toLocaleDateString('nl-NL',{month:'long', year:'numeric'})})`, totalForFilteredMonth.bookingCount, totalForFilteredMonth.guestCount, totalForFilteredMonth.totalRevenueFromBookings]} />
      </ReportSection>

      {/* Occupancy Reports */}
      <ReportSection title="Bezettingsgraad Rapporten">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <div className="mb-3 flex items-center space-x-3">
                    <label htmlFor="filterDateOccupancy" className="text-sm font-medium text-slate-600">Selecteer Dag:</label>
                    <input type="date" id="filterDateOccupancy" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-1.5 border-slate-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <Table headers={["Tijd", "Capaciteit", "Geboekt", "Bezetting (%)"]} data={occupancyForFilteredDate.map(o => [o.time, o.capacity, o.booked, o.occupancy])} />
            </div>
            <div>
                <h4 className="text-md font-medium text-slate-700 mb-1.5">Gem. Bezettingsgraad per Show Type (tot vandaag)</h4>
                <Table headers={["Show Type", "Gem. Bezetting (%)", "Aantal Shows"]} data={averageOccupancyByShowType.map(a => [a.showType, a.averageOccupancy, a.slotCount])} />
            </div>
         </div>
      </ReportSection>

      {/* Promo Code Usage */}
      <ReportSection title="Promotiecode Gebruik" note="Gebaseerd op client-side data van promotiecodes & boekingen.">
        <Table headers={["Code", "Beschrijving", "Aantal Keer Gebruikt", "Totaal Gegeven Korting"]} data={promoCodeUsageReport.map(pc => [pc.code, pc.description, pc.timesUsed, pc.totalDiscountGiven])} footers={["Totaal", "", promoCodeUsageReport.reduce((s,r)=>s+r.timesUsed,0), promoCodeUsageReport.reduce((s,r)=>s+r.totalDiscountGiven,0) ]}/>
      </ReportSection>

       <p className="mt-8 text-center text-sm text-indigo-600">
            Verdere, meer gedetailleerde rapportages en grafieken kunnen worden toegevoegd met server-side dataverwerking.
        </p>
    </div>
  );
};
