# Driver Registration API - Flutter Integration Guide

## Complete Flow

### 1. User Registration with Documents

**Endpoint:** `POST /api/drivers/auth/register`

**Step 1: Upload Documents to Firebase Storage**
```dart
// Flutter code example
Future<String> uploadDocument(File file, String path) async {
  final ref = FirebaseStorage.instance.ref().child(path);
  await ref.putFile(file);
  return await ref.getDownloadURL();
}

// Upload all documents
String aadharFront = await uploadDocument(aadharFrontFile, 'drivers/aadhar_front.jpg');
String aadharBack = await uploadDocument(aadharBackFile, 'drivers/aadhar_back.jpg');
String license = await uploadDocument(licenseFile, 'drivers/license.jpg');
```

**Step 2: Call Registration Endpoint**
```dart
Future<void> registerDriver() async {
  final response = await http.post(
    Uri.parse('http://localhost:5000/api/drivers/auth/register'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
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
      },
      "documents": {
        "aadhar": {
          "frontUrl": aadharFront,
          "backUrl": aadharBack,
          "status": "pending"
        },
        "license": {
          "url": license,
          "status": "pending"
        }
      }
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    print('Driver registered: ${data['data']['_id']}');
    print('Status: ${data['data']['status']}'); // "pending"
  }
}
```

**Response (201):**
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
    }
  },
  "token": "base64_encoded_token"
}
```

---

### 2. Check Registration Status

**Endpoint:** `GET /api/drivers/profile/phone/:phoneNumber`

```dart
Future<void> checkDriverStatus(String phone) async {
  final response = await http.get(
    Uri.parse('http://localhost:5000/api/drivers/profile/phone/$phone'),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    final status = data['data']['status']; // "pending", "approved", or "rejected"
    
    if (status == 'pending') {
      print('Waiting for admin approval...');
    } else if (status == 'approved') {
      print('Driver approved! Access dashboard');
    } else if (status == 'rejected') {
      print('Rejected: ${data['data']['rejectionReason']}');
    }
  }
}
```

**Response:**
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

---

### 3. Update Documents Later (Optional)

**Endpoint:** `PATCH /api/drivers/:driverId`

```dart
Future<void> updateDocuments(String driverId) async {
  final response = await http.patch(
    Uri.parse('http://localhost:5000/api/drivers/$driverId'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      "documents": {
        "rc": {
          "url": "https://...",
          "status": "pending"
        },
        "insurance": {
          "url": "https://...",
          "status": "pending"
        }
      }
    }),
  );
}
```

---

## Admin Endpoints (Backend Only)

### Approve Driver
```bash
PATCH /api/drivers/:driverId/approve
```

### Reject Driver
```bash
PATCH /api/drivers/:driverId/reject
Body: { "rejectionReason": "Invalid documents" }
```

---

## Status Flow

```
Registration (POST /auth/register)
    ↓
Status: "pending"
    ↓
Admin Review
    ↓
Admin Action (approve/reject)
    ↓
Status: "approved" or "rejected"
    ↓
Driver Access Dashboard (if approved)
```

---

## Error Handling

**Duplicate Phone:**
```json
{
  "success": false,
  "error": "Driver already registered with this phone number"
}
```

**Driver Not Found:**
```json
{
  "success": false,
  "error": "Driver not found"
}
```

**Server Error:**
```json
{
  "success": false,
  "error": "error message"
}
```

---

## Implementation Checklist

✅ Backend endpoints ready:
- `POST /api/drivers/auth/register` - Register with documents
- `GET /api/drivers/profile/phone/:phone` - Check status
- `PATCH /api/drivers/:driverId` - Update documents
- `PATCH /api/drivers/:driverId/approve` - Admin approve
- `PATCH /api/drivers/:driverId/reject` - Admin reject

✅ Database schema supports:
- Document URLs (aadhar, license, rc, insurance)
- Document status tracking
- Driver status workflow
- Rejection reasons

✅ Response format:
- Consistent success/error structure
- Proper HTTP status codes (201, 200, 400, 404, 500)
- Token included in registration response

---

## Testing

Use Postman or the provided `driver-registration.http` file to test all endpoints before integrating with Flutter app.
