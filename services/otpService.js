const axios = require('axios');
const logger = require('../config/logger');

const MSG91_WIDGET_ID = process.env.MSG91_WIDGET_ID;
const MSG91_AUTH_TOKEN = process.env.MSG91_AUTH_TOKEN;

if (!MSG91_WIDGET_ID || !MSG91_AUTH_TOKEN) {
  logger.warn('MSG91 credentials not configured - OTP service will not work');
}

const sendOTP = async (phone) => {
  if (!MSG91_WIDGET_ID || !MSG91_AUTH_TOKEN) {
    return { success: false, error: 'OTP service not configured' };
  }
  
  try {
    const response = await axios.post('https://control.msg91.com/api/v5/otp', {
      template_id: MSG91_WIDGET_ID,
      mobile: phone,
      authkey: MSG91_AUTH_TOKEN
    });
    
    logger.info(`OTP sent successfully to ${phone}`);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('OTP send failed:', error.message);
    return { success: false, error: 'Failed to send OTP' };
  }
};

const verifyOTP = async (phone, otp) => {
  if (!MSG91_AUTH_TOKEN) {
    return { success: false, error: 'OTP service not configured' };
  }
  
  try {
    const response = await axios.post('https://control.msg91.com/api/v5/otp/verify', {
      mobile: phone,
      otp: otp,
      authkey: MSG91_AUTH_TOKEN
    });
    
    logger.info(`OTP verified successfully for ${phone}`);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('OTP verify failed:', error.message);
    return { success: false, error: 'OTP verification failed' };
  }
};

module.exports = { sendOTP, verifyOTP };