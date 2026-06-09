# Stage 1

## Overview

The notification platform allows users to receive and manage notifications when they are logged into the application. The system supports creation, retrieval, updating, deletion and real-time delivery of notifications.

### Core Actions

1. Create Notification
2. Get User Notifications
3. Get Unread Notifications
4. Mark Notification as Read
5. Mark All Notifications as Read
6. Delete Notification
7. Real-Time Notification Delivery

---

## Authentication

All APIs require authentication.

### Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 1. Create Notification

### Endpoint

```http
POST /api/v1/notifications
```

### Request Body

```json
{
  "userId": "12345",
  "title": "Placement Drive",
  "message": "Company XYZ has opened registrations.",
  "type": "placement"
}
```

### Response

```json
{
  "success": true,
  "notificationId": "n101"
}
```

---

## 2. Get Notifications

### Endpoint

```http
GET /api/v1/notifications
```

### Query Parameters

```http
?page=1&limit=20
```

### Response

```json
{
  "notifications": [
    {
      "id": "n101",
      "title": "Placement Drive",
      "message": "Company XYZ has opened registrations.",
      "type": "placement",
      "isRead": false,
      "createdAt": "2026-06-09T10:00:00Z"
    }
  ]
}
```

---

## 3. Get Unread Notifications

### Endpoint

```http
GET /api/v1/notifications/unread
```

### Response

```json
{
  "count": 5,
  "notifications": []
}
```

---

## 4. Mark Notification as Read

### Endpoint

```http
PATCH /api/v1/notifications/:notificationId/read
```

### Response

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 5. Mark All Notifications as Read

### Endpoint

```http
PATCH /api/v1/notifications/read-all
```

### Response

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 6. Delete Notification

### Endpoint

```http
DELETE /api/v1/notifications/:notificationId
```

### Response

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Real-Time Notification Mechanism

The system uses WebSocket technology for real-time notification delivery.

### Flow

1. User logs into the application.
2. Client establishes WebSocket connection.
3. Server pushes new notifications instantly.
4. Notification appears without page refresh.
5. Unread notification count is updated automatically.

### Benefits

- Low latency delivery
- Reduced database polling
- Better user experience
- Scalable notification delivery
