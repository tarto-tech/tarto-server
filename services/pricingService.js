const PRICING_CONFIG = {
  sedan: {
    baseRate: 12,
    minimumFare: 500,
    driverAllowancePerKm: 2
  },
  suv: {
    baseRate: 15,
    minimumFare: 600,
    driverAllowancePerKm: 2.5
  },
  luxury: {
    baseRate: 20,
    minimumFare: 800,
    driverAllowancePerKm: 3
  }
};

function calculateSecureFare(distance, vehicleType, isRoundTrip) {
  const config = PRICING_CONFIG[vehicleType] || PRICING_CONFIG.sedan;
  
  let baseFare = distance * config.baseRate;
  let driverAllowance = distance * config.driverAllowancePerKm;
  let tollCharges = Math.ceil(distance / 200) * 200;
  
  if (isRoundTrip) {
    baseFare *= 2;
    driverAllowance *= 2;
    tollCharges *= 2;
  }
  
  baseFare = Math.max(baseFare, config.minimumFare);
  
  const subtotal = baseFare + driverAllowance + tollCharges;
  const taxes = Math.round(subtotal * 0.18);
  const totalFare = subtotal + taxes;
  
  return {
    baseFare: Math.round(baseFare),
    driverAllowance: Math.round(driverAllowance),
    tollCharges,
    taxes,
    totalFare: Math.round(totalFare)
  };
}

module.exports = { calculateSecureFare };
