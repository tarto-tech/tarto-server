// Distance-based pricing tiers (matching frontend logic)
function calculateOneWayPrice(km) {
  if (km <= 0) return 0;
  
  let price;
  
  if (km < 30) {
    price = km * 45;
  } else if (km >= 30 && km < 50) {
    price = km * 36;
  } else if (km >= 50 && km <= 80) {
    price = km * 35;
  } else if (km > 80 && km <= 120) {
    price = km * 25;
  } else if (km > 120 && km <= 150) {
    price = km * 22;
  } else if (km > 150 && km <= 200) {
    price = km * 20;
  } else if (km > 200 && km <= 350) {
    price = km * 15.2;
  } else {
    price = km * 14.5;
  }
  
  return Math.round(price * 100) / 100;
}

function calculateSecureFare(distance, vehicleType, isRoundTrip) {
  let totalPrice = calculateOneWayPrice(distance);
  
  if (isRoundTrip) {
    totalPrice *= 2;
  }
  
  const serviceCharge = Math.floor(distance);
  const driverAmount = totalPrice - serviceCharge;
  
  return {
    totalPrice: Math.round(totalPrice),
    serviceCharge,
    driverAmount: Math.round(driverAmount),
    breakdown: {
      distance,
      pricePerKm: 'Variable based on distance',
      calculationRule: getAppliedRule(distance)
    }
  };
}

function getAppliedRule(km) {
  if (km < 30) return `Rule 1: ${km} km × ₹45 = ₹${km * 45}`;
  if (km >= 30 && km < 50) return `Rule 2: ${km} km × ₹36 = ₹${km * 36}`;
  if (km >= 50 && km <= 80) return `Rule 3: ${km} km × ₹35 = ₹${km * 35}`;
  if (km > 80 && km <= 120) return `Rule 4: ${km} km × ₹25 = ₹${km * 25}`;
  if (km > 120 && km <= 150) return `Rule 5: ${km} km × ₹22 = ₹${km * 22}`;
  if (km > 150 && km <= 200) return `Rule 6: ${km} km × ₹20 = ₹${km * 20}`;
  if (km > 200 && km <= 350) return `Rule 7: ${km} km × ₹15.2 = ₹${km * 15.2}`;
  return `Rule 8: ${km} km × ₹14.5 = ₹${km * 14.5}`;
}

module.exports = { calculateSecureFare, calculateOneWayPrice, getAppliedRule };
