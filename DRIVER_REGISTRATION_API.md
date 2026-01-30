# Driver Registration API Documentation

## Overview
This implementation provides a complete driver registration system with document management, admin approval/rejection workflow, and driver profile retrieval.

## Database Schema

The Driver model has been updated with the following structure:

```javascript
{
  phone: String (unique, required),
  name: String (required),
  email: String (required),
  agencyName: String (required),
  panNumber: String (required),
  address: String,
  dateOfBirth: Date,
  licenseNumber: String (required),
  gender: String (enum: 'male', 'female', 'other'),
  
  vehicleDetails: {
    vehicleNumber: String,
    vehicleType: String,
    type: String (enum: 'auto', 'bike', 'car', 'hatchback', 'sedan', 'suv'),
    registrationNumber: String,
    model: String,
    color: String
  },
  
  documents: {
    aadhar: {
      frontUrl: String,
      backUrl: String,
      status: String (enum: 'pending', 'approved', 'rejected', default: 'pending')
    },
    license: {
      url: String,
      status: String (enum: 'pending', 'approved', 'rejected', default: 'pending')
    },
    rc: {
      url: String,
      status: String (enum: 'pending', 'approved', 'rejected', default: 'pending')
    },
    insurance: {
      url: String,
      status: String (enum: 'pending', 'approved', 'rejected', default: 'pending')
    }
  },
  
  status: String (enum: 'pending', 'approved', 'active', 'inactive', 'busy', 'rejected', 'suspended', default: 'pending'),
  rejectionReason: String,
  
  rating: Number (default: 0),
  totalTrips: Number (default: 0),
  totalEarnings: Number (default: 0),
  
  currentLocation: {
    type: String (default: 'Point'),
    coordinates: [Number]
  },
  
  isOnline: Boolean (default: false),
  isAvailable: Boolean (default: false),
  fcmToken: String,
  workLocations: [Object],
  lastActiveAt: Date,
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## API Endpoints

### 1. Register Driver
**Endpoint:** `POST /api/drivers/register`

**Request Body:**
```json
{
  "phone": "7892994854",
  "name": "Purushottam",
  "email": "driver@example.com",
  "agencyName": "Tarto",
  "panNumber": "ABCDE1234G",
  "address": "Tiptur",
  "dateOfBirth": "2008-01-08",
  "licenseNumber": "DL1234567890",
  "gender": "male",
  "vehicleDetails": {
    "vehicleNumber": "KA12HJ5678",
    "vehicleType": "hatchback",
    "type": "hatchback",
    "registrationNumber": "KA12HJ5678",
    "model": "SUV",
    "color": "White"
  }
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "_id": "6958ae9e976153d49405a745",
    "phone": "7892994854",
    "name": "Purushottam",
    "email": "driver@example.com",
    "status": "pending",
    "documents": {
      "aadhar": { "status": "pending" },
      "license": { "status": "pending" }
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Driver already registered with this phone number"
}
```

---

### 2. Update Driver Documents
**Endpoint:** `PATCH /api/drivers/:driverId`

**Request Body:**
```json
{
  "documents": {
    "aadhar": {
      "frontUrl": "https://firebasestorage.googleapis.com/.../aadhar_front.jpg",
      "backUrl": "https://firebasestorage.googleapis.com/.../aadhar_back.jpg",
      "status": "pending"
    },
    "license": {
      "url": "https://firebasestorage.googleapis.com/.../license.jpg",
      "status": "pending"
    }
  },
  "status": "pending"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "_id": "6958ae9e976153d49405a745",
    "phone": "7892994854",
    "name": "Purushottam",
    "email": "driver@example.com",
    "status": "pending",
    "documents": {
      "aadhar": {
        "frontUrl": "https://...",
        "backUrl": "https://...",
        "status": "pending"
      },
      "license": {
        "url": "https://...",
        "status": "pending"
      }
    },
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. Admin Approve Driver
**Endpoint:** `PATCH /api/drivers/:driverId/approve`

**Request Body:**
```json
{
  "status": "approved",
  "documents": {
    "aadhar": { "status": "approved" },
    "license": { "status": "approved" }
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Driver approved successfully",
  "data": {
    "_id": "6958ae9e976153d49405a745",
    "status": "approved",
    "documents": {
      "aadhar": { "status": "approved" },
      "license": { "status": "approved" }
    }
  }
}
```

---

### 4. Admin Reject Driver
**Endpoint:** `PATCH /api/drivers/:driverId/reject`

**Request Body:**
```json
{
  "status": "rejected",
  "rejectionReason": "Invalid documents"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Driver rejected",
  "data": {
    "_id": "6958ae9e976153d49405a745",
    "status": "rejected",
    "rejectionReason": "Invalid documents"
  }
}
```

---

### 5. Get Driver by Phone
**Endpoint:** `GET /api/drivers/profile/phone/:phoneNumber`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "_id": "6958ae9e976153d49405a745",
    "phone": "7892994854",
    "name": "Purushottam",
    "email": "driver@example.com",
    "status": "pending",
    "documents": {
      "aadhar": { "status": "pending" },
      "license": { "status": "pending" }
    }
  }
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "error": "Driver not found"
}
```

---

## Status Flow

```
Registration → pending
    ↓
Upload Docs → pending
    ↓
Admin Review → pending
    ↓
Admin Action → approved/rejected
    ↓
Driver Access → Dashboard (if approved)
```

## Files Modified/Created

1. **models/Driver.js** - Updated schema with new document structure
2. **routes/driverRegistrationRoutes.js** - New file with registration endpoints
3. **server.js** - Added new routes to the application
4. **driver-registration.http** - Test file with example requests

## Implementation Details

### Key Features:
- ✅ Driver registration with basic information
- ✅ Document upload management (Aadhar, License, RC, Insurance)
- ✅ Admin approval workflow
- ✅ Admin rejection with reason
- ✅ Driver profile retrieval by phone
- ✅ Automatic timestamp tracking (createdAt, updatedAt)
- ✅ Status tracking throughout the workflow

### Error Handling:
- Duplicate phone number validation
- Driver not found handling
- Proper HTTP status codes (201 for creation, 404 for not found, 400 for bad request)
- Descriptive error messages

### Database Indexes:
- Unique index on phone number
- Geospatial index on currentLocation for location-based queries

## Testing

Use the provided `driver-registration.http` file to test all endpoints with your REST client (VS Code REST Client, Postman, etc.).

## Integration Notes

- The registration routes are mounted at `/api/drivers`
- All endpoints follow RESTful conventions
- Responses follow a consistent format with `success` flag and `data`/`error` fields
- Timestamps are automatically managed by Mongoose
