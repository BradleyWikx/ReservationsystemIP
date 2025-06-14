
import React, { useState, useEffect } from 'react';
import { MerchandiseItem } from '../../types';

interface MerchandiseManagerProps {
  merchandiseItems: MerchandiseItem[];
  onAddMerchandise: (item: Omit<MerchandiseItem, 'id'>) => void; // App.tsx will filter fields for API
  onUpdateMerchandise: (item: MerchandiseItem) => void; // App.tsx will filter fields for API
  onDeleteMerchandise: (itemId: string) => void;
}

export const MerchandiseManager: React.FC<MerchandiseManagerProps> = ({ 
    merchandiseItems, onAddMerchandise, onUpdateMerchandise, onDeleteMerchandise 
}) => {
  const [isEditing, setIsEditing] = useState<MerchandiseItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceInclVAT, setPriceInclVAT] = useState<number | ''>(''); // Changed from price
  const [vatRate, setVatRate] = useState<number | ''>(21); // Default to 21%
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
        setName(isEditing.name);
        setDescription(isEditing.description || '');
        setPriceInclVAT(isEditing.priceInclVAT);
        setVatRate(isEditing.vatRate);
        setImageUrl(isEditing.imageUrl || '');
        setCategory(isEditing.category || '');
    } else {
        setName(''); setDescription(''); setPriceInclVAT(''); setVatRate(21); setImageUrl(''); setCategory('');
    }
  }, [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || priceInclVAT === '' || priceInclVAT < 0 || vatRate === '' || vatRate < 0 || !category.trim()) {
        setError('Naam, categorie, geldige prijs (0+) en BTW-tarief (0+) zijn verplicht.');
        return;
    }
    // These are all fields the frontend might care about. App.tsx will select API-compatible ones.
    const itemData = { 
        name, 
        description, 
        priceInclVAT: Number(priceInclVAT), 
        vatRate: Number(vatRate),
        imageUrl, 
        category 
    }; 
    if (isEditing) {
        onUpdateMerchandise({ ...isEditing, ...itemData });
        setIsEditing(null);
    } else {
        onAddMerchandise(itemData as Omit<MerchandiseItem, 'id'>); // Cast because ID is not set here
    }
    if(!isEditing) {setName(''); setDescription(''); setPriceInclVAT(''); setVatRate(21); setImageUrl(''); setCategory('');}
  };

  const startEdit = (item: MerchandiseItem) => setIsEditing(item);
  const cancelEdit = () => setIsEditing(null);

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">
        {isEditing ? `Merchandise item bewerken: ${isEditing.name}` : 'Merchandise Beheer'}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 p-4 border border-gray-200 rounded-md space-y-4">
        <h3 className="text-lg text-blue-600 font-medium">{isEditing ? 'Details Aanpassen' : 'Nieuw Item Toevoegen'}</h3>
        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="merchName" className="block text-sm font-medium text-gray-600 mb-1">Naam</label>
                <input type="text" id="merchName" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label htmlFor="merchPriceInclVAT" className="block text-sm font-medium text-gray-600 mb-1">Prijs (€ incl. BTW)</label>
                <input type="number" id="merchPriceInclVAT" value={priceInclVAT} onChange={e => setPriceInclVAT(parseFloat(e.target.value) || '')} step="0.01" min="0" required
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="merchVatRate" className="block text-sm font-medium text-gray-600 mb-1">BTW Tarief (%)</label>
                <input type="number" id="merchVatRate" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || '')} step="1" min="0" max="100" required
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label htmlFor="merchCategory" className="block text-sm font-medium text-gray-600 mb-1">Categorie (UI Only)</label>
                <input type="text" id="merchCategory" value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
        </div>
        <div>
            <label htmlFor="merchDesc" className="block text-sm font-medium text-gray-600 mb-1">Beschrijving (UI Only)</label>
            <textarea id="merchDesc" value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="merchImageUrl" className="block text-sm font-medium text-gray-600 mb-1">Afbeelding URL (UI Only)</label>
            <input type="url" id="merchImageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
         <div className="flex items-center space-x-3">
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-md transition-colors text-sm">
            {isEditing ? 'Opslaan' : 'Toevoegen'}
            </button>
            {isEditing && (
                <button type="button" onClick={cancelEdit} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors text-sm">
                    Annuleren
                </button>
            )}
        </div>
      </form>

      <div>
        <h3 className="text-lg text-blue-600 font-medium mb-3">Bestaande Merchandise ({merchandiseItems.length})</h3>
        {merchandiseItems.length === 0 ? (
          <p className="text-gray-500">Nog geen merchandise items toegevoegd.</p>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {merchandiseItems.map(item => (
              <div key={item.id} className="p-3 rounded-md shadow-sm border bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded mr-3"/>}
                    <div>
                        <p className="font-semibold text-gray-800">{item.name} - €{item.priceInclVAT.toFixed(2)} ({item.vatRate}%)</p>
                        {item.category && <p className="text-xs text-gray-500">Categorie: {item.category}</p>}
                        {item.description && <p className="text-xs text-gray-500 truncate w-60" title={item.description}>{item.description}</p>}
                    </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button onClick={() => startEdit(item)} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-medium py-1 px-2 rounded-md transition-colors">Bewerk</button>
                    <button onClick={() => onDeleteMerchandise(item.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-2 rounded-md transition-colors">Verwijder</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
