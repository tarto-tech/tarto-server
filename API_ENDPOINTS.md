# Tarto Driver App - API Endpoints

## Base URL
`https://tarto-server-pog2.onrender.com`

---

## 🚗 Booking Endpoints

### 1. Accept Booking ✅
```
POST /api/bookings/:bookingId/accept
```
**Body:**
```json
{
  "driverId": "69206989915f8c7f1b69e15e"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Booking accepted"
}
```

---

### 2. Reject Booking ✅
```
POST /api/bookings/:bookingId/reject
```
**Body:**
```json
{
  "driverId": "69206989915f8c7f1b69e15e"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Booking rejected"
}
```

---

### 3. Start Trip ✅
```
POST /api/bookings/:bookingId/start
```
**Body:** (optional)
```json
{
  "startTime": "2024-01-15T10:30:00Z"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Trip started"
}
```

---

### 4. Complete Trip ✅
```
POST /api/bookings/:bookingId/complete
```
**Body:**
```json
{
  "endLocation": "Destination Address",
  "finalAmount": 1500
}
```
**Response:**
```json
{
  "success": true,
  "message": "Trip completed"
}
```

---

### 5. Get Driver Bookings ✅
```
GET /api/bookings/driver/:driverId
```
**Response:**
```json
[
  {
    "id": "691de670499689f451e5bbc4",
    "type": "airport",
    "pickup": "Bangalore Airport",
    "drop": "MG Road",
    "date": "2024-01-15",
    "time": "10:30",
    "status": "pending",
    "amount": 1200,
    "customer": {
      "name": "John Doe",
      "phone": "9876543210"
    }
  }
]
```

---

### 6. Get Booking Details ✅
```
GET /api/bookings/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "691de670499689f451e5bbc4",
    "userId": "...",
    "driverId": "...",
    "vehicleId": "...",
    "source": {...},
    "destination": {...},
    "status": "accepted",
    "totalPrice": 1200,
    "acceptedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 👨‍✈️ Driver Endpoints

### 7. Update Driver Location ✅
```
POST /api/drivers/:driverId/location
```
**Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```
**Response:**
```json
{
  "success": true,
  "message": "Location updated"
}
```

---

### 8. Update Driver Status ✅
```
POST /api/drivers/:driverId/status
```
**Body:**
```json
{
  "status": "active"
}
```
**Status Options:** `active`, `inactive`, `busy`, `pending`, `approved`, `rejected`

**Response:**
```json
{
  "success": true,
  "data": {
    "driver": {
      "_id": "69206989915f8c7f1b69e15e",
      "name": "Driver Name",
      "status": "active"
    }
  }
}
```

---

### 9. Driver Login (Generate OTP) ✅
```
POST /api/drivers/login
```
**Body:**
```json
{
  "phone": "9876543210"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP generated"
}
```

---

### 10. Verify OTP ✅
```
POST /api/drivers/verify-otp
```
**Body:**
```json
{
  "phone": "9876543210",
  "otp": "1234"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "base64token",
    "driver": {
      "id": "69206989915f8c7f1b69e15e",
      "name": "Driver Name",
      "phone": "9876543210",
      "status": "active",
      "rating": 4.5,
      "totalTrips": 150,
      "totalEarnings": 45000
    }
  }
}
```

---

### 11. Get Driver Profile ✅
```
GET /api/drivers/profile/:driverId
```
**Response:**
```json
{
  "id": "69206989915f8c7f1b69e15e",
  "name": "Driver Name",
  "phone": "9876543210",
  "email": "driver@example.com",
  "vehicleDetails": {
    "type": "Sedan",
    "registrationNumber": "KA01AB1234"
  },
  "status": "active",
  "rating": 4.5,
  "totalTrips": 150,
  "totalEarnings": 45000
}
```

---

### 12. Get Driver Earnings ✅
```
GET /api/drivers/:driverId/earnings
```
**Response:**
```json
{
  "today": 0,
  "thisWeek": 0,
  "thisMonth": 0,
  "total": 45000
}
```

---

### 13. Get Trip History ✅
```
GET /api/drivers/:driverId/trips
```
**Response:**
```json
[
  {
    "id": "691de670499689f451e5bbc4",
    "date": "2024-01-15",
    "pickup": "Bangalore Airport",
    "drop": "MG Road",
    "amount": 1200,
    "status": "completed",
    "type": "airport"
  }
]
```

---

## 📊 Database Schema Updates

### Booking Schema - New Fields:
```javascript
{
  driverId: ObjectId,
  status: ['pending', 'accepted', 'confirmed', 'in_progress', 'started', 'completed', 'cancelled'],
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  rejectedDrivers: [ObjectId]
}
```

### Driver Schema - New Fields:
```javascript
{
  status: ['pending', 'approved', 'active', 'inactive', 'busy', 'rejected'],
  location: {
    latitude: Number,
    longitude: Number
  }
}
```

---

## 🧪 Testing Examples

### Test Accept Booking:
```bash
curl -X POST https://tarto-server-pog2.onrender.com/api/bookings/691de670499689f451e5bbc4/accept \
  -H "Content-Type: application/json" \
  -d '{"driverId": "69206989915f8c7f1b69e15e"}'
```

### Test Start Trip:
```bash
curl -X POST https://tarto-server-pog2.onrender.com/api/bookings/691de670499689f451e5bbc4/start \
  -H "Content-Type: application/json"
```

### Test Update Location:
```bash
curl -X POST https://tarto-server-pog2.onrender.com/api/drivers/69206989915f8c7f1b69e15e/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 12.9716, "longitude": 77.5946}'
```

---

## ✅ Implementation Status

| Endpoint | Status | Priority |
|----------|--------|----------|
| Accept Booking | ✅ Implemented | CRITICAL |
| Reject Booking | ✅ Implemented | High |
| Start Trip | ✅ Implemented | CRITICAL |
| Complete Trip | ✅ Implemented | CRITICAL |
| Update Driver Location | ✅ Implemented | High |
| Update Driver Status | ✅ Implemented | High |
| Driver Login/OTP | ✅ Implemented | CRITICAL |
| Get Driver Bookings | ✅ Implemented | CRITICAL |
| Get Driver Profile | ✅ Implemented | High |
| Get Earnings | ✅ Implemented | Medium |
| Get Trip History | ✅ Implemented | Medium |

---

### 14. Update Driver Work Locations ✅
```
PUT /api/drivers/:driverId/work-locations
```
**Body:**
```json
{
  "workLocations": [
    {
      "name": "Bangalore",
      "city": "Bangalore",
      "lat": "12.9716",
      "lng": "77.5946"
    },
    {
      "name": "Mysore",
      "city": "Mysore",
      "lat": "12.2958",
      "lng": "76.6394"
    }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "69206989915f8c7f1b69e15e",
    "name": "Driver Name",
    "workLocations": [...]
  }
}
```

---

### 15. Get Nearby Bookings ✅
```
GET /api/bookings/nearby/:driverId?lat=12.9716&lng=77.5946&radius=30
```
**Query Parameters:**
- `lat` (optional): Latitude
- `lng` (optional): Longitude
- `radius` (optional): Radius in km (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "691de670499689f451e5bbc4",
        "source": {...},
        "destination": {...},
        "status": "pending",
        "totalPrice": 1200
      }
    ]
  }
}
```

---

## 📝 Notes

- All endpoints return JSON responses
- Error responses follow format: `{ "success": false, "message": "Error message" }`
- Success responses follow format: `{ "success": true, "data": {...} }`
- Booking status flow: `pending` → `accepted` → `in_progress` → `completed`
- Driver must be `active` to receive bookings
- Nearby bookings use Haversine formula for distance calculation
