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

# Stage 2

## Database Choice

I would use PostgreSQL as the primary database because:

- Strong ACID guarantees
- Reliable for notification storage
- Supports indexing and partitioning
- Good performance for read-heavy workloads
- Easy to scale using replicas

---

## Database Schema

### users

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE
);
```

### notifications

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    notification_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes

```sql
CREATE INDEX idx_user_notifications
ON notifications(user_id);

CREATE INDEX idx_user_read
ON notifications(user_id, is_read);

CREATE INDEX idx_created_at
ON notifications(created_at DESC);
```

---

## Sample Queries

### Get User Notifications

```sql
SELECT *
FROM notifications
WHERE user_id = 101
ORDER BY created_at DESC
LIMIT 20;
```

### Get Unread Notifications

```sql
SELECT *
FROM notifications
WHERE user_id = 101
AND is_read = FALSE;
```

### Mark Notification As Read

```sql
UPDATE notifications
SET is_read = TRUE
WHERE id = 1001;
```

### Delete Notification

```sql
DELETE FROM notifications
WHERE id = 1001;
```

---

## Potential Scaling Problems

As the number of users and notifications grows:

- Large table scans become expensive
- Read latency increases
- Storage requirements increase
- Write throughput becomes a bottleneck

---

## Scaling Strategies

### Partitioning

Partition notifications by month:

```sql
notifications_2026_06
notifications_2026_07
notifications_2026_08
```

This reduces the amount of data scanned.

### Read Replicas

Use read replicas for notification fetching APIs while keeping writes on the primary database.

### Archiving

Move notifications older than one year into archive tables.

### Caching

Store frequently accessed unread counts in Redis to reduce database load.

# Stage 3

## Query Analysis

Given Query:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

### Is the query correct?

Yes. The query correctly retrieves unread notifications for a student and orders them by newest first.

### Why is it slow?

The table contains:

- 50,000 students
- 5,000,000 notifications

Without a suitable index, the database may scan a large portion of the table before returning results.

### Recommended Index

```sql
CREATE INDEX idx_student_read_created
ON notifications(studentID, isRead, createdAt DESC);
```

This index allows the database to directly locate unread notifications for a student and return them already sorted.

### Expected Complexity

Without index:

```text
O(N)
```

With index:

```text
O(log N)
```

---

## Should We Add Indexes On Every Column?

No.

Adding indexes on every column is not recommended because:

- Storage usage increases
- Insert operations become slower
- Update operations become slower
- Many indexes may never be used

Indexes should be created only for frequently queried columns.

---

## Students Who Received Placement Notifications In Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

# Stage 4

## Problem

Notifications are fetched every time a student loads the page. As the number of users increases, the database receives a huge number of repeated read requests which affects performance and user experience.

---

## Solution 1: Redis Caching

Store frequently accessed notification data and unread counts in Redis.

### Benefits

- Faster response times
- Reduced database load
- Better scalability

### Tradeoff

- Additional infrastructure required
- Cache invalidation must be handled correctly

---

## Solution 2: Pagination

Instead of fetching all notifications:

```http
GET /notifications?page=1&limit=20
```

### Benefits

- Smaller query results
- Reduced network traffic
- Faster page loads

### Tradeoff

- Users must load additional pages to view older notifications

---

## Solution 3: WebSocket Based Updates

Rather than querying the database repeatedly, the server pushes new notifications in real time.

### Benefits

- Near real-time updates
- Fewer database requests

### Tradeoff

- More complex implementation
- Requires persistent connections

---

## Solution 4: Read Replicas

Use database replicas for read operations while keeping writes on the primary database.

### Benefits

- Better read throughput
- Reduced load on primary database

### Tradeoff

- Replication lag may occur

---

## Recommended Approach

Use a combination of:

- Redis Cache
- Pagination
- WebSockets
- Read Replicas

This provides the best balance between performance, scalability and user experience.

# Stage 5

## Problems In The Current Implementation

```python
for student_id in student_ids:
    send_email(student_id, message)
    save_to_db(student_id, message)
    push_to_app(student_id, message)
```

### Issues

1. Processing is sequential and slow.
2. A failure in email delivery can interrupt the process.
3. No retry mechanism exists.
4. Difficult to handle 50,000 students simultaneously.
5. Partial failures can create inconsistent states.

---

## Recommended Design

Use asynchronous processing with a message queue.

```text
HR Request
    |
    v
Notification Service
    |
    v
Message Queue (RabbitMQ / Kafka)
    |
    +-------------------+
    |                   |
    v                   v
Email Worker      Push Notification Worker
```

---

## Should Database Save And Email Happen Together?

No.

The notification should first be saved in the database.

After successful storage, background workers should process email and push notification delivery.

This ensures that notifications are not lost even if email delivery fails.

---

## Handling Failures

If email delivery fails:

- Retry automatically
- Log the failure
- Move failed messages to a Dead Letter Queue after multiple retries

---

## Revised Pseudocode

```python
function notify_all(student_ids, message):

    for student_id in student_ids:
        save_notification_to_db(student_id, message)

        publish_to_queue({
            student_id: student_id,
            message: message
        })


worker():

    while queue_not_empty:

        job = get_next_job()

        send_email(job.student_id, job.message)

        push_notification(job.student_id, job.message)
```

### Benefits

- Scalable
- Fault tolerant
- Faster processing
- Supports retries
- Suitable for large scale notification delivery
