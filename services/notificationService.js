const admin = require('firebase-admin');

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

module.exports = { sendNotification };
