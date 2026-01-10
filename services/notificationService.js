const admin = require('firebase-admin');
const Driver = require('../models/Driver');

// Initialize Firebase Admin (add your service account key)
// Download from Firebase Console -> Project Settings -> Service Accounts
try {
  if (!admin.apps.length) {
    // Option 1: Use service account file
    // const serviceAccount = require('../config/firebase-service-account.json');
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    
    // Option 2: Use environment variables
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
  }
} catch (error) {
  console.log('Firebase Admin initialization skipped:', error.message);
}

const sendNotification = async ({ to, notification, data }) => {
  try {
    if (!to) {
      console.log('No FCM token provided');
      return { success: false, error: 'No FCM token' };
    }

    if (!admin.apps.length) {
      console.log('Firebase Admin not initialized');
      return { success: false, error: 'Firebase not initialized' };
    }

    const message = {
      token: to,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

const notifyNearbyDrivers = async ({ bookingId, pickupLocation, dropoffLocation, fare, distance, pickupAddress, dropoffAddress }) => {
  try {
    // Find nearby drivers using geospatial query
    const nearbyDrivers = await Driver.find({
      status: 'active',
      fcmToken: { $exists: true, $ne: null },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupLocation.longitude, pickupLocation.latitude]
          },
          $maxDistance: 30000 // 30km in meters
        }
      }
    }).limit(50);

    console.log(`Found ${nearbyDrivers.length} nearby drivers`);

    if (nearbyDrivers.length === 0) {
      console.log('No nearby drivers found');
      return { success: false, message: 'No nearby drivers found' };
    }

    // Send notifications to all nearby drivers
    const notifications = nearbyDrivers.map(driver => ({
      token: driver.fcmToken,
      notification: {
        title: 'New Trip Request 🚗',
        body: `${pickupAddress} → ${dropoffAddress}\n₹${fare} • ${distance}km`
      },
      data: {
        type: 'new_trip_request',
        booking_id: bookingId.toString(),
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        fare: fare.toString(),
        distance: distance.toString()
      }
    }));

    const results = await admin.messaging().sendAll(notifications);
    console.log(`Sent notifications to ${results.successCount} drivers, ${results.failureCount} failed`);
    
    return { 
      success: true, 
      driversNotified: results.successCount,
      totalDrivers: nearbyDrivers.length 
    };

  } catch (error) {
    console.error('Error notifying drivers:', error);
    
    // Fallback: Use aggregation pipeline if geospatial query fails
    try {
      console.log('Attempting fallback method...');
      const nearbyDrivers = await Driver.aggregate([
        {
          $match: {
            status: 'active',
            fcmToken: { $exists: true, $ne: null },
            location: { $exists: true }
          }
        },
        {
          $addFields: {
            distance: {
              $sqrt: {
                $add: [
                  { $pow: [{ $subtract: [{ $arrayElemAt: ["$location.coordinates", 0] }, pickupLocation.longitude] }, 2] },
                  { $pow: [{ $subtract: [{ $arrayElemAt: ["$location.coordinates", 1] }, pickupLocation.latitude] }, 2] }
                ]
              }
            }
          }
        },
        {
          $match: {
            distance: { $lte: 0.27 } // Roughly 30km in degrees
          }
        },
        { $limit: 50 }
      ]);

      if (nearbyDrivers.length > 0) {
        const notifications = nearbyDrivers.map(driver => ({
          token: driver.fcmToken,
          notification: {
            title: 'New Trip Request 🚗',
            body: `${pickupAddress} → ${dropoffAddress}\n₹${fare} • ${distance}km`
          },
          data: {
            type: 'new_trip_request',
            booking_id: bookingId.toString(),
            pickup_address: pickupAddress,
            dropoff_address: dropoffAddress,
            fare: fare.toString(),
            distance: distance.toString()
          }
        }));

        const results = await admin.messaging().sendAll(notifications);
        console.log(`Fallback: Sent notifications to ${results.successCount} drivers`);
        
        return { 
          success: true, 
          driversNotified: results.successCount,
          totalDrivers: nearbyDrivers.length,
          method: 'fallback'
        };
      }
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
    }
    
    return { success: false, error: error.message };
  }
};

module.exports = { sendNotification, notifyNearbyDrivers };
