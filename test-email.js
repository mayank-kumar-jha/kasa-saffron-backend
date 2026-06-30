import { sendWelcomeEmail } from './src/utils/email.js';

(async () => {
  console.log('Sending test Welcome email to yash91597p@gmail.com...');
  try {
    await sendWelcomeEmail('yash91597p@gmail.com', 'Yash');
    console.log('Welcome Test completed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
})();
