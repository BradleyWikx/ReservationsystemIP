// Email service for sending booking confirmations
// This is a placeholder implementation - in production you would integrate with 
// an email service like SendGrid, Mailgun, or Firebase Functions

export interface BookingEmailData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  showDate: string;
  showTime: string;
  packageName: string;
  totalPrice: number;
  guests: number;
  merchandise?: Array<{
    itemName: string;
    quantity: number;
    itemPrice: number;
  }>;
  specialAddons?: {
    voorborrel?: boolean;
    naborrel?: boolean;
  };
}

export const sendBookingConfirmationEmail = async (bookingData: BookingEmailData): Promise<boolean> => {
  try {
    console.log('📧 Sending booking confirmation email to:', bookingData.customerEmail);
    console.log('📧 Email content would include:', {
      reservationId: bookingData.reservationId,
      customerName: bookingData.customerName,
      showDate: bookingData.showDate,
      showTime: bookingData.showTime,
      packageName: bookingData.packageName,
      totalPrice: bookingData.totalPrice,
      guests: bookingData.guests,
      merchandise: bookingData.merchandise,
      specialAddons: bookingData.specialAddons
    });

    // TODO: Implement actual email sending
    // Examples:
    // - Firebase Functions with email provider
    // - Direct integration with SendGrid/Mailgun
    // - Server-side email sending
    
    // For now, simulate successful email sending
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    console.log('✅ Booking confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email:', error);
    return false;
  }
};

export const sendBookingConfirmationToAdmin = async (bookingData: BookingEmailData): Promise<boolean> => {
  try {
    console.log('📧 Sending booking notification to admin: info@inspirationpoint.nl');
    console.log('📧 Admin notification content:', bookingData);
    
    // TODO: Implement actual admin notification email
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    console.log('✅ Admin notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    return false;
  }
};

// Template for the email content (HTML)
export const generateBookingConfirmationEmailHTML = (bookingData: BookingEmailData): string => {
  const merchandiseHTML = bookingData.merchandise && bookingData.merchandise.length > 0 
    ? `
    <h3>Merchandise</h3>
    <ul>
      ${bookingData.merchandise.map(item => 
        `<li>${item.itemName} x ${item.quantity} - €${(item.itemPrice * item.quantity).toFixed(2)}</li>`
      ).join('')}
    </ul>
    `
    : '';

  const addonsHTML = bookingData.specialAddons && (bookingData.specialAddons.voorborrel || bookingData.specialAddons.naborrel)
    ? `
    <h3>Extra's</h3>
    <ul>
      ${bookingData.specialAddons.voorborrel ? '<li>Borrel Vooraf</li>' : ''}
      ${bookingData.specialAddons.naborrel ? '<li>Borrel Achteraf</li>' : ''}
    </ul>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bevestiging Reservering - Inspiration Point</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #4f46e5;">Inspiration Point</h1>
    <h2 style="color: #333;">Bevestiging van uw reservering</h2>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p>Beste ${bookingData.customerName},</p>
    <p>Hartelijk dank voor uw reservering bij Inspiration Point! Hieronder vindt u de details van uw boeking:</p>
  </div>
  
  <div style="background-color: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #4f46e5; margin-top: 0;">Reserveringsgegevens</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Reserveringsnummer:</td>
        <td style="padding: 8px 0; color: #4f46e5; font-weight: bold;">${bookingData.reservationId}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Datum & Tijd:</td>
        <td style="padding: 8px 0;">${bookingData.showDate} om ${bookingData.showTime}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Arrangement:</td>
        <td style="padding: 8px 0;">${bookingData.packageName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Aantal gasten:</td>
        <td style="padding: 8px 0;">${bookingData.guests}</td>
      </tr>
      <tr style="border-top: 2px solid #4f46e5;">
        <td style="padding: 12px 0 8px 0; font-weight: bold; font-size: 18px;">Totaalprijs:</td>
        <td style="padding: 12px 0 8px 0; font-weight: bold; font-size: 18px; color: #4f46e5;">€${bookingData.totalPrice.toFixed(2)}</td>
      </tr>
    </table>
  </div>
  
  ${merchandiseHTML}
  ${addonsHTML}
  
  <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #1976d2; margin-top: 0;">Belangrijke informatie</h3>
    <ul style="padding-left: 20px;">
      <li>Bewaar dit e-mailadres en uw reserveringsnummer voor eventuele vragen</li>
      <li>Kom 15 minuten voor aanvang naar de locatie</li>
      <li>Adres: [LOCATIE ADRES]</li>
      <li>Voor wijzigingen kunt u contact opnemen via info@inspirationpoint.nl of telefoon [TELEFOONNUMMER]</li>
      <li>Annulering is mogelijk tot 48 uur voor de voorstelling</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #dee2e6;">
    <p>We kijken ernaar uit u te ontvangen!</p>
    <p style="color: #666; font-size: 14px;">
      Met vriendelijke groet,<br>
      Het team van Inspiration Point
    </p>
    <p style="color: #666; font-size: 12px; margin-top: 20px;">
      Dit is een automatisch gegenereerde e-mail. Voor vragen kunt u contact opnemen via info@inspirationpoint.nl
    </p>
  </div>
</body>
</html>
  `;
};
