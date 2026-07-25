export const getWhatsAppUrl = (phone, businessName = '') => {
  if (!phone) return null;
  let digits = phone.toString().replace(/\D/g, '');
  if (!digits) return null;
  
  // Auto prepend 51 (Peru country code) if it's a 9-digit Peruvian number starting with 9
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = '51' + digits;
  }

  const text = businessName 
    ? encodeURIComponent(`Hola ${businessName}, te saludo de Bienestar Sin Excusas.`) 
    : '';

  return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
};
