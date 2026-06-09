# Stage 1 - Notification System API Design

## Overview

The Campus Notification Platform enables students to receive real-time notifications related to placements, events, examinations, and results. The system supports creating, viewing, updating, and deleting notifications while ensuring real-time delivery.

## Core Actions

1. Create Notification
2. Get All Notifications
3. Get Notification By ID
4. Mark Notification As Read
5. Delete Notification
6. Receive Real-Time Notifications

## Authentication

All APIs require authentication.

### Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Create Notification

### Endpoint

```http
POST /api/notifications
```

### Request Body

```json
{
  "title": "Placement Drive",
  "message": "Google Internship applications are now open.",
  "type": "placement",
  "targetAudience": "all"
}
```

### Response

```json
{
  "success": true,
  "notificationId": "12345",
  "message": "Notification created successfully"
}
```

---

## Get All Notifications

### Endpoint

```http
GET /api/notifications
```

### Response

```json
[
  {
    "id": "12345",
    "title": "Placement Drive",
    "message": "Google Internship applications are now open.",
    "type": "placement",
    "isRead": false,
    "createdAt": "2026-06-09T10:00:00Z"
  }
]
```

---

## Get Notification By ID

### Endpoint

```http
GET /api/notifications/:id
```

### Response

```json
{
  "id": "12345",
  "title": "Placement Drive",
  "message": "Google Internship applications are now open.",
  "type": "placement",
  "isRead": false
}
```

---

## Mark Notification As Read

### Endpoint

```http
PATCH /api/notifications/:id/read
```

### Response

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## Delete Notification

### Endpoint

```http
DELETE /api/notifications/:id
```

### Response

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Real-Time Notification Design

The system uses WebSockets (Socket.IO) for real-time communication.

### Flow

1. User logs in.
2. Client establishes Socket.IO connection.
3. Server emits notification events.
4. Connected clients instantly receive notifications without page refresh.

### Event Example

```javascript
socket.emit("notification", {
  title: "Placement Drive",
  message: "Google Internship applications are now open.",
});
```

# Stage 2 - Database Design

## Database Choice

MongoDB is selected because notifications are document-oriented, flexible, and easy to scale horizontally.

## Collections

### Users

```json
{
  "_id": "user123",
  "name": "Anubhav",
  "email": "user@example.com"
}
```

### Notifications

```json
{
  "_id": "notif123",
  "title": "Placement Drive",
  "message": "Google Internship applications are now open.",
  "type": "placement",
  "createdAt": "2026-06-09T10:00:00Z"
}
```

### NotificationReads

```json
{
  "userId": "user123",
  "notificationId": "notif123",
  "readAt": "2026-06-09T10:05:00Z"
}
```

## Scaling Challenges

1. Large number of notifications.
2. Slow query performance.
3. High concurrent users.
4. Growing storage requirements.

## Solutions

1. Indexing on userId and createdAt.
2. Pagination for notification retrieval.
3. Redis caching for frequently accessed data.
4. MongoDB sharding for horizontal scaling.
5. Archive old notifications periodically.

## Sample Query

Get latest notifications:

```javascript
db.notifications.find().sort({ createdAt: -1 }).limit(20);
```
