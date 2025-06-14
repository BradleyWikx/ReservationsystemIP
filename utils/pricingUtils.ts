import { PackageOption, OrderedMerchandiseItem, MerchandiseItem, ShowSlot } from '../types'; // Removed AppSettings

// Placeholder for pricing utility functions
// Implement actual pricing logic as needed

export interface CalculatePriceArgs {
  selectedPackage?: PackageOption;
  selectedShowSlot?: ShowSlot; // Added to access priceTier
  guests: number;
  merchandise?: OrderedMerchandiseItem[];
  merchandiseItems: MerchandiseItem[]; 
  vatRate?: number; // Example: appSettings?.vatRates?.standard or a default
}

export const calculatePrice = (args: CalculatePriceArgs): number => {
  const { selectedPackage, selectedShowSlot, guests, merchandise, merchandiseItems } = args;
  let total = 0;

  if (selectedPackage && selectedPackage.price && guests > 0) {
    total += selectedPackage.price * guests;
  } else if (selectedPackage && selectedPackage.priceLevels && selectedShowSlot?.priceTier && guests > 0) {
    // Fallback or more complex pricing based on priceTier from ShowSlot
    const level = selectedPackage.priceLevels[selectedShowSlot.priceTier];
    if (level && level.pricePerPerson) {
      total += level.pricePerPerson * guests;
    }
  }


  if (merchandise && merchandise.length > 0 && merchandiseItems && merchandiseItems.length > 0) {
    merchandise.forEach(orderedItem => {
      const fullItem = merchandiseItems.find(mi => mi.id === orderedItem.itemId);
      if (fullItem) {
        total += fullItem.priceInclVAT * orderedItem.quantity;
      } else {
        // Fallback if full item details not found, use stored price (less ideal)
        total += orderedItem.itemPrice * orderedItem.quantity;
      }
    });
  }
  
  // Placeholder for VAT calculation if prices are exclusive of VAT
  // const vatRate = args.vatRate || 0.21; // Example default VAT rate
  // total = total * (1 + vatRate);


  // Placeholder for promo code logic
  // if (args.promoCode) { ... }
  // Placeholder for discount logic
  // if (args.discountAmount) { total -= args.discountAmount; }

  return total;
};

// Add other pricing utility functions here if needed
// e.g., calculateVAT, applyPromoCodeDiscount, etc.
