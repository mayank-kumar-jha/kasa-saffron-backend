import { sendB2BEnquiryEmail } from './src/utils/email.js';

(async () => {
  console.log('Sending test B2B enquiry email to yash91597p@gmail.com...');
  const sampleLead = {
    companyName: 'Acme Saffron Distributors',
    contactPerson: 'Yash Patel',
    email: 'yash91597p@gmail.com',
    phone: '+91 9876543210',
    businessType: 'Wholesaler / Distributor',
    estimatedVolume: '10-50 kg per month',
    notes: 'This is a test B2B enquiry to check if email styling and delivery are working correctly.',
  };

  try {
    await sendB2BEnquiryEmail(sampleLead, 'yash91597p@gmail.com');
    console.log('B2B Enquiry Test email sent successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
})();
