const faqs = {
  'book appointment':
    'To book an appointment, go to the patient dashboard and click "Book New". You can then search for a doctor and select an available time slot.',
  'cancel appointment':
    'You can cancel an appointment from the "My Appointments" page. Find the appointment you wish to cancel and click the "Cancel" button.',
  'payment':
    'We use Razorpay for secure payments. After booking, you will be redirected to the payment page. Your appointment is confirmed once payment is successful.',
  'chat':
    'You can chat with your doctor for confirmed appointments. A "Chat" button will appear on your appointment card, which will take you to the chat page.',
  'default':
    "I'm sorry, I don't understand that question. Please try asking about booking, cancellation, payments, or chat.",
};

const getChatbotReply = (message) => {
  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes('book')) {
    return faqs['book appointment'];
  }
  if (lowerCaseMessage.includes('cancel')) {
    return faqs['cancel appointment'];
  }
  if (lowerCaseMessage.includes('payment') || lowerCaseMessage.includes('pay')) {
    return faqs['payment'];
  }
  if (lowerCaseMessage.includes('chat')) {
    return faqs['chat'];
  }

  return faqs['default'];
};

export default getChatbotReply;
