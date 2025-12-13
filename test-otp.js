// Test OTP service
require('dotenv').config();

console.log('Testing OTP Service Configuration...\n');
console.log('MSG91_WIDGET_ID:', process.env.MSG91_WIDGET_ID ? '✓ Set' : '✗ Not set');
console.log('MSG91_AUTH_TOKEN:', process.env.MSG91_AUTH_TOKEN ? '✓ Set' : '✗ Not set');
console.log('\nActual values:');
console.log('WIDGET_ID:', process.env.MSG91_WIDGET_ID);
console.log('AUTH_TOKEN:', process.env.MSG91_AUTH_TOKEN);

const { sendOTP } = require('./services/otpService');

async function testOTP() {
  console.log('\n--- Testing OTP Send ---');
  const result = await sendOTP('+919876543210');
  console.log('Result:', JSON.stringify(result, null, 2));
}

testOTP();
