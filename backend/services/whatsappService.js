// VizhaBook Automated WhatsApp Digital Receipt Service
// Sends digital receipts in Tamil & English via WhatsApp API / Webhook

export const sendWhatsAppReceipt = async ({ phone, guestName, amount, functionName, giftType, entrySource }) => {
    if (!phone || phone.trim().length < 10) {
        console.log('ℹ️ WhatsApp receipt skipped: No valid mobile number provided');
        return { success: false, reason: 'No valid phone number' };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const isCash = giftType === 'Cash' || !giftType;
    const formattedAmount = isCash ? `₹${Number(amount).toLocaleString('en-IN')}` : giftType;

    const sourceLabel = entrySource === 'stage_present' ? '👑 மேடை மொய் (Stage Gift)' :
                        entrySource === 'qr_checkin' ? '📱 QR Check-In' : '🏛️ வரவேற்புப் பிரிவு';

    const textMessage =
        `🙏 *நன்றி! (Thank You!)*\n\n` +
        `திரு/திருமதி *${guestName}* அவர்களின் ` +
        `*${formattedAmount}* மொய் அன்புடனே ஏற்றுக்கொள்ளப்பட்டது.\n\n` +
        `📍 *நிகழ்வு:* ${functionName || 'VizhaBook Event'}\n` +
        `🏷️ *பதிவு இடம்:* ${sourceLabel}\n` +
        `📅 *தேதி:* ${new Date().toLocaleDateString('ta-IN')}\n\n` +
        `✨ *VizhaBook — டிஜிட்டல் மொய்ப் புத்தகம்*`;

    console.log(`📱 [WhatsApp Dispatcher] Sending digital receipt to +${formattedPhone}:\n${textMessage}`);

    // If WhatsApp Webhook/API URL is configured in environment, dispatch HTTP POST payload
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;

    if (whatsappApiUrl) {
        try {
            const response = await fetch(whatsappApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(whatsappToken ? { 'Authorization': `Bearer ${whatsappToken}` } : {})
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'text',
                    text: { body: textMessage }
                })
            });
            const resData = await response.json();
            console.log(`✅ WhatsApp API Response for +${formattedPhone}:`, resData);
            return { success: true, apiResponse: resData };
        } catch (e) {
            console.error(`⚠️ WhatsApp API Network Dispatch Error (+${formattedPhone}):`, e.message);
            return { success: false, error: e.message };
        }
    }

    return { success: true, mocked: true, message: 'Receipt formatted and logged successfully' };
};

export default sendWhatsAppReceipt;
