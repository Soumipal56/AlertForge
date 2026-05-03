# Authentication System Testing Guide

This document outlines how to test the AlertForge dual authentication system (Cookies + API Key) using Postman.

---

## 🛠️ Prerequisites
- **Frontend URL**: `http://localhost:5173`
- **Backend URL**: `http://localhost:3000`
- **Postman Settings**: Ensure "Enable cookie jar" is ON in Postman settings.

---

## 🔹 Scenario 1: Dashboard Auth (Cookies)

### Step 1: Login
- **URL**: `POST http://localhost:3000/api/auth/login`
- **Body** (JSON):
```json
{
  "email": "test@example.com",
  "password": "yourpassword"
}
```
- **Expectation**: 
  - Status `200 OK`
  - `accessToken` and `refreshToken` cookies are set in the response headers.
  - Body contains `success: true` and user data.

### Step 2: Call Protected Route
- **URL**: `GET http://localhost:3000/api/incidents`
- **Headers**: None required (Postman automatically sends cookies).
- **Expectation**: 
  - Status `200 OK`
  - Returns incident list.

---

## 🔹 Scenario 2: SDK / API Key Auth

### Step 1: Generate API Key
- Login via Dashboard or Postman.
- **URL**: `POST http://localhost:3000/api/apikeys`
- **Body** (JSON): `{"serviceName": "Test SDK"}`
- **Expectation**: Returns a raw `key`. **Copy this key.**

### Step 2: Call Protected Route with API Key
- **URL**: `GET http://localhost:3000/api/incidents`
- **Headers**:
  - `x-api-key`: `YOUR_RAW_API_KEY_HERE`
- **Expectation**: 
  - Status `200 OK`
  - Returns incident list even if cookies are cleared.

---

## 🔹 Scenario 3: Unauthorized Access
- Clear Postman cookies (Manage Cookies -> Remove All).
- Remove `x-api-key` header.
- **URL**: `GET http://localhost:3000/api/incidents`
- **Expectation**: 
  - Status `401 Unauthorized`
  - Body: `{"success": false, "message": "Unauthorized access - No valid session or API Key found"}`

---

## 💡 Troubleshooting
1. **CORS Errors**: Ensure the backend `app.js` has `credentials: true` and the origin matches your client.
2. **Cookie Not Sending**: In Postman, check the "Cookies" link below the Send button to verify the domain has stored the tokens.
3. **Invalid Token**: If you see "Invalid or expired token", call `/api/auth/login` again.
