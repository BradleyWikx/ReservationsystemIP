
import React from 'react';
import { CalendarView } from '../CalendarView';
import { ShowSlot } from '../../types';

interface DashboardStats {
  week: { count: number; guests: number };
  month: { count: number; guests: number };
  year: { count: number; guests: number };
}

interface DashboardProps {
  stats: DashboardStats;
  totalShows: number; 
  availableShowSlots: ShowSlot[]; 
}

const StatCard: React.FC<{ title: string; count: number; guests: number; period: string, icon: React.ReactNode }> = ({ title, count, guests, period, icon }) => (
  <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-6 rounded-xl shadow-xl text-white transition-all hover:shadow-2xl hover:scale-105 transform">
    <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-indigo-100">{title}</h3>
        <div className="text-indigo-200 opacity-75">{icon}</div>
    </div>
    <p className="text-5xl font-bold mt-2">{count}</p>
    <p className="text-sm text-indigo-200">Reserveringen {period}</p>
    <p className="text-3xl font-bold mt-2">{guests}</p>
    <p className="text-sm text-indigo-200">Gasten {period}</p>
  </div>
);

// Icons for StatCards
const CalendarWeekIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const CalendarDaysIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>;


export const Dashboard: React.FC<DashboardProps> = ({ stats, totalShows, availableShowSlots }) => {
  const [selectedCalendarDate, setSelectedCalendarDate] = React.useState<string | null>(new Date().toISOString().split('T')[0]);
  
  const handleDashboardCalendarDateSelect = (dateString: string) => {
    setSelectedCalendarDate(dateString);
  };

  return (
    <div className="p-1">
      <h2 className="text-3xl font-display-black text-slate-800 mb-8">Dashboard Overzicht</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard title="Deze Week" count={stats.week.count} guests={stats.week.guests} period="deze week" icon={<CalendarWeekIcon />} />
        <StatCard title="Deze Maand" count={stats.month.count} guests={stats.month.guests} period="deze maand" icon={<CalendarDaysIcon />} />
        <StatCard title="Dit Jaar" count={stats.year.count} guests={stats.year.guests} period="dit jaar" icon={<CalendarDaysIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-semibold text-slate-700 mb-4">Show Kalender</h3>
          <CalendarView 
            showSlots={availableShowSlots}
            selectedDate={selectedCalendarDate}
            onDateSelect={handleDashboardCalendarDateSelect}
          />
           <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                <span className="font-medium">Legenda:</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1.5 ring-1 ring-green-600 ring-offset-1"></span>Veel Plaatsen</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 mr-1.5 ring-1 ring-orange-500 ring-offset-1"></span>Bijna Vol</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1.5 ring-1 ring-red-600 ring-offset-1"></span>Vol / Gesloten</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-300 mr-1.5 ring-1 ring-slate-400 ring-offset-1"></span>Geen Show</span>
            </div>
        </div>
        
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold text-slate-700 mb-4">Algemene Informatie</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Totaal Geplande Shows:</span> {totalShows}</p>
                <p><span className="font-medium text-slate-800">Meest Geboekte Arrangement:</span> <span className="text-slate-400 italic">(Nog niet geïmplementeerd)</span></p>
                <p><span className="font-medium text-slate-800">Gem. Gasten per Boeking:</span> <span className="text-slate-400 italic">(Nog niet geïmplementeerd)</span></p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold text-slate-700 mb-4">Snelle Acties</h3>
              <div className="space-y-3">
                <button 
                    onClick={() => { const currentHashBase = window.location.hash.split('?')[0]; window.location.hash = `${currentHashBase}?mode=shows`; }}
                    className="w-full text-left bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-sm hover:shadow-md"
                >
                    Beheer Shows
                </button>
                 <button 
                    onClick={() => { const currentHashBase = window.location.hash.split('?')[0]; window.location.hash = `${currentHashBase}?mode=manualBooking`; }}
                    className="w-full text-left bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-sm hover:shadow-md"
                >
                    Handmatige Boeking Toevoegen
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};