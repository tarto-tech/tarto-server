const { Client } = require('@googlemaps/google-maps-services-js');
require('dotenv').config();

const client = new Client({});

async function calculateDistanceAndDuration(source, stops) {
  try {
    const waypoints = stops.map(stop => `${stop.latitude},${stop.longitude}`);
    const origin = `${source.latitude},${source.longitude}`;
    const destination = waypoints[waypoints.length - 1];
    
    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: waypoints,
        key: process.env.GOOGLE_MAPS_API_KEY,
        units: 'metric'
      }
    });
    
    let totalDistance = 0;
    let totalDuration = 0;
    
    response.data.rows[0].elements.forEach(element => {
      if (element.status === 'OK') {
        totalDistance += element.distance.value / 1000;
        totalDuration += element.duration.value / 60;
      }
    });
    
    return {
      distance: Math.round(totalDistance * 100) / 100,
      duration: Math.round(totalDuration)
    };
  } catch (error) {
    throw new Error('Failed to calculate route: ' + error.message);
  }
}

module.exports = { calculateDistanceAndDuration };
