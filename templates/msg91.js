export default () => `
const msg91 = require('msg91');

const authKey = process.env.MSG_AUTH_KEY;
msg91.initialize({authKey});

// Get SMS object
const getSMS = () => {
  return msg91.getSMS();
};

// Send SMS
const sendSMS = (flowId, mobileNumber, variables) => {
  const sms = getSMS();
  return sms.send(flowId, { mobile: mobileNumber, ...variables });
};

// Get OTP object
const getOTP = (otpTemplateId, options) => {
  return msg91.getOTP(otpTemplateId, options);
};

// Send OTP
const sendOTP = (otpInstance, mobileNumber) => {
  return otpInstance.send(mobileNumber);
};

// Retry OTP
const retryOTP = (otpInstance, mobileNumber) => {
  return otpInstance.retry(mobileNumber);
};

// Verify OTP
const verifyOTP = (otpInstance, mobileNumber, otp) => {
  return otpInstance.verify(mobileNumber, otp);
};

// Get Campaign object
const getCampaign = () => {
  return msg91.getCampaign();
};

// Get all campaigns
const getAllCampaigns = (campaignInstance) => {
  return campaignInstance.getAll();
};

// Run a campaign
const runCampaign = (campaignInstance, slug, data) => {
  return campaignInstance.run(slug, { data });
};

module.exports = {
  initializeMsg91,
  sendSMS,
  getOTP,
  sendOTP,
  retryOTP,
  verifyOTP,
  getCampaign,
  getAllCampaigns,
  runCampaign
};
`;
