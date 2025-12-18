# Driver App API Endpoints

Base URL: `https://tarto-server-pog2.onrender.com/api/drivers`

---

## Authentication Endpoints

### 1. Check Driver Exists / Get Driver Profile
**Endpoint:** `GET /profile/phone/:phoneNumber`

**Purpose:** Check if a driver exists and retrieve their complete profile

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/profile/phone/9876543210
```

**Response (Driver Exists):**
```json
{
  "success": true,
  "data": {
    "_id": "driver123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "gender": "male",
    "profileImage": "https://example.com/image.jpg",
    "status": "active",
    "vehicleDetails": {
      "type": "auto",
      "number": "KA01AB1234",
      "model": "Bajaj RE",
      "color": "Yellow"
    },
    "documents": {
      "license": {
        "status": "verified"
      },
      "rc": {
        "status": "verified"
      }
    },
    "rating": 4.5,
    "totalTrips": 150,
    "totalEarnings": 45000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "ZHJpdmVyMTIzOjE3MDQwNjcyMDAwMDA="
}
```

**Response (Driver Not Found):**
```json
{
  "success": false,
  "message": "Driver not found"
}
```

---

### 2. Register New Driver
**Endpoint:** `POST /auth/register`

**Purpose:** Create a new driver profile after OTP verification

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/auth/register
Content-Type: application/json

{
  "phone": "9876543210",
  "name": "John Doe",
  "email": "john@example.com",
  "gender": "male"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Driver profile created successfully",
  "data": {
    "_id": "driver123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "gender": "male",
    "status": "pending_verification",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "ZHJpdmVyMTIzOjE3MDQwNjcyMDAwMDA="
}
```

**Response (Driver Already Exists):**
```json
{
  "success": false,
  "message": "Driver already exists with this phone number"
}
```

---

### 3. Login - Generate OTP
**Endpoint:** `POST /login`

**Purpose:** Generate OTP for driver login

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/login
Content-Type: application/json

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

### 4. Verify OTP
**Endpoint:** `POST /verify-otp`

**Purpose:** Verify OTP and complete login

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/verify-otp
Content-Type: application/json

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
    "token": "ZHJpdmVyMTIzOjE3MDQwNjcyMDAwMDA=",
    "driver": {
      "id": "driver123",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "vehicleDetails": {},
      "documents": {},
      "status": "active",
      "rating": 4.5,
      "totalTrips": 150,
      "totalEarnings": 45000
    }
  }
}
```

---

## Profile Management

### 5. Get Driver Profile by ID
**Endpoint:** `GET /profile/:driverId`

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/profile/driver123
```

**Response:**
```json
{
  "id": "driver123",
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "vehicleDetails": {},
  "documents": {},
  "status": "active",
  "rating": 4.5,
  "totalTrips": 150,
  "totalEarnings": 45000
}
```

---

### 6. Update Driver Profile
**Endpoint:** `POST /:driverId/update`

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/driver123/update
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "vehicleDetails": {
    "registrationNumber": "KA01AB1234"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "driver": {
      "_id": "driver123",
      "name": "John Updated",
      "email": "john.updated@example.com"
    }
  }
}
```

---

### 7. Update Driver Status
**Endpoint:** `POST /:driverId/status`

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/driver123/status
Content-Type: application/json

{
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "driver": {
      "_id": "driver123",
      "status": "active"
    }
  }
}
```

---

### 8. Update Driver Location
**Endpoint:** `POST /:driverId/location`

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/driver123/location
Content-Type: application/json

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

### 9. Update Work Locations
**Endpoint:** `POST /:driverId/work-locations`

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/driver123/work-locations
Content-Type: application/json

{
  "workLocations": [
    {
      "name": "Bangalore",
      "city": "Bangalore",
      "lat": "12.9716",
      "lng": "77.5946"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "driver123",
    "workLocations": [...]
  }
}
```

---

## Booking Management

### 10. Get Driver Bookings
**Endpoint:** `GET /:driverId/bookings`

**Query Parameters:**
- `status` - Filter by booking status (pending, accepted, completed, etc.)
- `type` - Filter by booking type (outstation, rental, airport, etc.)

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/driver123/bookings?status=accepted
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking123",
      "userId": "user123",
      "driverId": "driver123",
      "status": "accepted",
      "type": "outstation",
      "source": "Mumbai",
      "destination": "Pune"
    }
  ]
}
```

---

### 11. Get Active Bookings
**Endpoint:** `GET /:driverId/active-bookings`

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/driver123/active-bookings
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking123",
      "status": "in_progress"
    }
  ]
}
```

---

### 12. Check Active Booking
**Endpoint:** `GET /:driverId/active-booking`

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/driver123/active-booking
```

**Response:**
```json
{
  "success": true,
  "hasActiveBooking": true,
  "activeBooking": {
    "_id": "booking123",
    "status": "started"
  }
}
```

---

### 13. Get Available Trips
**Endpoint:** `GET /:driverId/available-trips`

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/driver123/available-trips
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking123",
      "status": "pending",
      "source": "Mumbai",
      "destination": "Pune"
    }
  ]
}
```

---

### 14. Accept Trip
**Endpoint:** `POST /:driverId/accept-trip`

**Request:**
```
POST https://tarto-server-pog2.onrender.com/api/drivers/driver123/accept-trip
Content-Type: application/json

{
  "bookingId": "booking123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking123",
    "driverId": "driver123",
    "status": "accepted"
  }
}
```

---

### 15. Get Trip History
**Endpoint:** `GET /:driverId/trips`

**Query Parameters:**
- `status` - Filter by status (completed, cancelled, etc.)

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/driver123/trips?status=completed
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking123",
      "status": "completed",
      "totalPrice": 2500
    }
  ]
}
```

---

### 16. Get Earnings History
**Endpoint:** `GET /:driverId/earnings`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `type` - Filter by earning type

**Request:**
```
GET https://tarto-server-pog2.onrender.com/api/drivers/driver123/earnings?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "earnings": [],
    "totalEarnings": 45000,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

---

## Admin Endpoints

### 17. Approve Driver
**Endpoint:** `PUT /:id/approve`

**Request:**
```
PUT https://tarto-server-pog2.onrender.com/api/drivers/driver123/approve
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "driver123",
    "status": "approved"
  }
}
```

---

### 18. Update Driver Status (Admin)
**Endpoint:** `PATCH /:id/status`

**Request:**
```
PATCH https://tarto-server-pog2.onrender.com/api/drivers/driver123/status
Content-Type: application/json

{
  "status": "suspended"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "driver123",
    "status": "suspended"
  }
}
```

---

## Status Values

**Driver Status:**
- `pending_verification` - New driver, documents pending
- `pending` - Documents submitted, awaiting approval
- `approved` - Approved by admin
- `active` - Active and available for trips
- `inactive` - Not available
- `busy` - Currently on a trip
- `suspended` - Account suspended
- `rejected` - Application rejected

**Document Status:**
- `pending` - Not uploaded or awaiting verification
- `verified` - Verified by admin
- `rejected` - Rejected, needs resubmission

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication

Store the token received from login/registration in SharedPreferences and include it in future requests if needed:
```
Authorization: Bearer <token>
```

---

## Testing in Postman

1. **Register New Driver:**
   - POST `/api/drivers/auth/register`
   - Body: `{"phone": "9876543210", "name": "Test Driver", "email": "test@example.com", "gender": "male"}`

2. **Check Driver Exists:**
   - GET `/api/drivers/profile/phone/9876543210`

3. **Login Flow:**
   - POST `/api/drivers/login` with phone
   - POST `/api/drivers/verify-otp` with phone and OTP

4. **Update Profile:**
   - POST `/api/drivers/{driverId}/update` with updated fields
