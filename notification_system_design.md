markdown# Notification System Design

## Overview

This document covers the complete design and implementation of a campus placement notification system. The system is responsible for delivering timely notifications to students regarding placement activities, interview schedules, and results.

---

# Stage 1

## API Design

### Base URL
http://<host>/api/v1

### Authentication

All endpoints require a Bearer token in the Authorization header.
Authorization: Bearer <access_token>

---

### Endpoints

---

#### 1. Fetch All Notifications

**GET** `/notifications`

Retrieves a paginated list of notifications for the authenticated student.

**Query Parameters**

| Parameter | Type    | Required | Description                    |
|-----------|---------|----------|--------------------------------|
| page      | integer | No       | Page number (default: 1)       |
| limit     | integer | No       | Results per page (default: 20) |
| isRead    | boolean | No       | Filter by read/unread status   |
| type      | string  | No       | Filter by notification type    |

**Response — 200 OK**

```json
{
  "status": "success",
  "data": {
    "total": 84,
    "page": 1,
    "limit": 20,
    "notifications": [
      {
        "id": "notif_001",
        "studentId": "1042",
        "type": "placement_drive",
        "title": "Infosys Drive on 15th June",
        "message": "You are shortlisted for the Infosys placement drive.",
        "isRead": false,
        "createdAt": "2025-06-01T09:30:00Z"
      }
    ]
  }
}
```

---

#### 2. Fetch Single Notification

**GET** `/notifications/{id}`

Retrieves full details of one notification by its ID.

**Path Parameter**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| id        | string | Notification ID |

**Response — 200 OK**

```json
{
  "status": "success",
  "data": {
    "id": "notif_001",
    "studentId": "1042",
    "type": "placement_drive",
    "title": "Infosys Drive on 15th June",
    "message": "You are shortlisted for the Infosys placement drive.",
    "isRead": false,
    "createdAt": "2025-06-01T09:30:00Z",
    "updatedAt": "2025-06-01T09:30:00Z"
  }
}
```

**Response — 404 Not Found**

```json
{
  "status": "error",
  "message": "Notification not found"
}
```

---

#### 3. Create Notification

**POST** `/notifications`

Creates a new notification for one or more students.

**Request Body**

```json
{
  "studentIds": ["1042", "1043", "1044"],
  "type": "interview_schedule",
  "title": "Technical Interview - TCS",
  "message": "Your technical round is scheduled for 10th June at 11:00 AM."
}
```

**JSON Schema**

```json
{
  "type": "object",
  "required": ["studentIds", "type", "title", "message"],
  "properties": {
    "studentIds": {
      "type": "array",
      "items": { "type": "string" }
    },
    "type": {
      "type": "string",
      "enum": [
        "placement_drive",
        "interview_schedule",
        "result_announcement",
        "general_update"
      ]
    },
    "title": { "type": "string", "maxLength": 150 },
    "message": { "type": "string", "maxLength": 1000 }
  }
}
```

**Response — 201 Created**

```json
{
  "status": "success",
  "message": "Notifications queued for delivery",
  "data": {
    "notificationsCreated": 3
  }
}
```

---

#### 4. Mark Notification as Read

**PATCH** `/notifications/{id}/read`

Marks a specific notification as read.

**Response — 200 OK**

```json
{
  "status": "success",
  "data": {
    "id": "notif_001",
    "isRead": true,
    "updatedAt": "2025-06-09T10:15:00Z"
  }
}
```

---

#### 5. Mark All as Read

**PATCH** `/notifications/read-all`

Marks every unread notification as read for the authenticated student.

**Response — 200 OK**

```json
{
  "status": "success",
  "message": "All notifications marked as read"
}
```

---

### Notification Types and Priority

| Type                | Priority | Description                    |
|---------------------|----------|--------------------------------|
| placement_drive     | HIGH     | New company drive announcement |
| interview_schedule  | HIGH     | Scheduled interview details    |
| result_announcement | HIGH     | Selection or rejection result  |
| general_update      | LOW      | General campus updates         |

---

### Real-Time Notification Mechanism

The system uses **Server-Sent Events (SSE)** for real-time delivery.

**Why SSE and not WebSockets:**
- Notifications only flow from server to student, so a one-way channel is enough.
- SSE is simpler, works over standard HTTP, and reconnects automatically on drop.
- WebSockets add bidirectional overhead that is not needed here.

**SSE Endpoint**
GET /notifications/stream
Authorization: Bearer <token>

The server holds this connection open and pushes each new notification as a JSON event matching the schema above.

**Fallback:** If SSE is blocked, the frontend polls `GET /notifications` every 30 seconds.

---
# Stage 2

## Database Design

### Database Choice: PostgreSQL (Relational / SQL)

**Why PostgreSQL:**
- Notification data has a clear, fixed structure — student ID, type, message, timestamps. A relational schema fits naturally.
- We need filtering, sorting, and aggregation queries (e.g. unread count per student, notifications in last 7 days). SQL handles these efficiently.
- PostgreSQL supports indexing, transactions, and JSON columns if the schema needs to extend later.
- NoSQL (like MongoDB) would be overkill here — the data is not document-heavy or deeply nested.

---

### Schema Design

#### Table: students

| Column     | Type         | Constraints        |
|------------|--------------|--------------------|
| id         | VARCHAR(50)  | PRIMARY KEY        |
| name       | VARCHAR(150) | NOT NULL           |
| email      | VARCHAR(200) | UNIQUE, NOT NULL   |
| mobile     | VARCHAR(15)  |                    |
| createdAt  | TIMESTAMP    | DEFAULT NOW()      |

---

#### Table: notifications

| Column     | Type         | Constraints                          |
|------------|--------------|--------------------------------------|
| id         | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid()|
| studentId  | VARCHAR(50)  | NOT NULL, FK → students(id)          |
| type       | VARCHAR(50)  | NOT NULL                             |
| title      | VARCHAR(150) | NOT NULL                             |
| message    | TEXT         | NOT NULL                             |
| isRead     | BOOLEAN      | DEFAULT false                        |
| createdAt  | TIMESTAMP    | DEFAULT NOW()                        |
| updatedAt  | TIMESTAMP    | DEFAULT NOW()                        |

---

### SQL to Create Tables

```sql
CREATE TABLE students (
    id         VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    email      VARCHAR(200) UNIQUE NOT NULL,
    mobile     VARCHAR(15),
    createdAt  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE notifications (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    studentId  VARCHAR(50)  NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(150) NOT NULL,
    message    TEXT         NOT NULL,
    isRead     BOOLEAN      DEFAULT false,
    createdAt  TIMESTAMP    DEFAULT NOW(),
    updatedAt  TIMESTAMP    DEFAULT NOW()
);
```

---

### Scaling Concerns

| Concern               | Approach                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| High notification volume | Partition the notifications table by createdAt (monthly partitions)   |
| Read-heavy traffic    | Add read replicas — writes go to primary, reads from replicas            |
| Large student base    | Index on studentId and isRead (covered in Stage 3)                       |
| Old data              | Archive notifications older than 90 days to a cold storage table         |
| Connection limits     | Use a connection pooler like PgBouncer in front of PostgreSQL            |

---

### API Compatibility

- `GET /notifications` → `SELECT * FROM notifications WHERE studentId = ? ORDER BY createdAt DESC`
- `GET /notifications/{id}` → `SELECT * FROM notifications WHERE id = ?`
- `PATCH /notifications/{id}/read` → `UPDATE notifications SET isRead = true WHERE id = ?`
- `POST /notifications` → `INSERT INTO notifications (studentId, type, title, message) VALUES (...)`

---
# Stage 3

## Query Analysis and Indexing

### Given Query

```sql
SELECT *
FROM notifications
WHERE studentId = 1042
AND isRead = false
ORDER BY createdAt ASC;
```

---

### Why This Query Becomes Slow

Without indexes, PostgreSQL performs a **full table scan** — it reads every row in
the notifications table to find matching records. As the table grows to millions
of rows (many students, many notifications), this becomes very slow.

Two specific problems:
- Filtering on `studentId` and `isRead` without indexes means no shortcut exists.
- Sorting by `createdAt` on a large result set adds additional cost.

---

### Indexing Strategy

The most effective fix is a **composite index** on the three columns used in the query:

```sql
CREATE INDEX idx_notifications_student_read_time
ON notifications (studentId, isRead, createdAt ASC);
```

**Why this works:**
- PostgreSQL uses the index to jump directly to rows where `studentId = 1042` and `isRead = false`.
- Since `createdAt` is part of the index in ASC order, the sort is already done — no extra sort step needed.
- This is called a **covering index path** — the database satisfies the entire query using only the index.

---

### Query Complexity

| Scenario              | Complexity  |
|-----------------------|-------------|
| Without index         | O(n) — full table scan |
| With composite index  | O(log n) — B-tree lookup |

---

### Improved Query

```sql
SELECT id, studentId, type, title, message, isRead, createdAt
FROM notifications
WHERE studentId = '1042'
AND isRead = false
ORDER BY createdAt ASC
LIMIT 50;
```

**Changes made:**
- Selected specific columns instead of `SELECT *` — avoids fetching unnecessary data.
- Added `LIMIT 50` — prevents unbounded result sets from overwhelming the application.
- Changed `studentId = 1042` to `studentId = '1042'` — matches the VARCHAR type defined in the schema, avoiding implicit type casting which can break index usage.

---

### Should You Index Every Column?

No. Indexing every column is a bad idea because:
- Every index takes up disk space.
- Every `INSERT`, `UPDATE`, or `DELETE` must update all indexes — this slows down writes significantly.
- Most columns are never used as filter conditions, so those indexes are never used but still carry the write cost.

**Rule of thumb:** Only index columns that appear frequently in WHERE clauses, JOIN conditions, or ORDER BY clauses.

---

### Query: Students Who Received Placement Notifications in the Last 7 Days

```sql
SELECT DISTINCT studentId
FROM notifications
WHERE type = 'placement_drive'
AND createdAt >= NOW() - INTERVAL '7 days';
```

**Supporting index for this query:**

```sql
CREATE INDEX idx_notifications_type_time
ON notifications (type, createdAt DESC);
```

---
# Stage 4

## Performance Improvements

### Caching

Cache the results of frequently repeated queries using **Redis**.

- When a student fetches their notifications, store the result in Redis with a key like `notifications:studentId:1042`.
- Set a TTL (time to live) of 60 seconds so the cache auto-expires and stays fresh.
- On new notification arrival, invalidate that student's cache key so they get fresh data on next request.

**What not to cache:** unread counts and real-time streams — these must always reflect live data.

---

### Pagination

Never return all notifications in one response. Use **offset-based pagination**:

```sql
SELECT id, studentId, type, title, message, isRead, createdAt
FROM notifications
WHERE studentId = '1042'
ORDER BY createdAt DESC
LIMIT 20 OFFSET 0;
```

- `LIMIT` controls how many records per page.
- `OFFSET` moves to the next page (page 2 = OFFSET 20, page 3 = OFFSET 40).
- Return `total`, `page`, and `limit` in every response so the frontend can render page controls.

For very large datasets, **cursor-based pagination** is more efficient — use the last `createdAt` value as a cursor instead of OFFSET.

---

### Notification Retrieval Optimization

- Fetch only unread notifications on initial load — unread ones are what the student needs to act on.
- Lazy-load older or read notifications only when the student scrolls or requests them.
- Use `SELECT` with specific columns instead of `SELECT *` to reduce data transferred per query.

---

### Push vs Pull

| Approach | How it works | Best for |
|----------|-------------|----------|
| Pull | Client polls the server every N seconds asking for new notifications | Simple to implement, works everywhere |
| Push | Server sends notifications to client the moment they arrive (SSE or WebSockets) | Better user experience, lower server load at scale |

**Chosen approach:** SSE for push (as designed in Stage 1), with a 30-second poll fallback. Push reduces unnecessary HTTP requests and delivers notifications instantly.

---

### Database Performance

- Use the composite index from Stage 3 for all student-filtered queries.
- Run `EXPLAIN ANALYZE` on slow queries to identify missing indexes or sequential scans.
- Archive notifications older than 90 days to a separate table to keep the active table small.
- Use connection pooling (PgBouncer) to avoid exhausting database connections under high load.

---

### Tradeoffs

| Optimization | Benefit | Tradeoff |
|--------------|---------|----------|
| Redis caching | Faster reads | Stale data risk if cache invalidation is missed |
| Pagination | Lower memory usage | Client needs extra requests for more data |
| SSE push | Real-time delivery | Requires persistent server connections |
| Archiving old data | Smaller active table | Historical queries need to hit archive table |
| Composite indexes | Fast filtered queries | Slower writes due to index maintenance |

---

# Stage 5

## Notification Reliability and Queue Architecture

### Given Pseudocode
function notify_all(student_ids, message) {
for student_id in student_ids
send_email(student_id, message)
save_to_db(student_id, message)
push_to_app(student_id, message)
}

---

### Shortcomings

**1. Synchronous and blocking**
All three operations run one after another for every student. If there are 500 students, the function blocks until all 1500 operations finish. The HTTP request that triggered this will time out.

**2. No error handling**
If `send_email` fails for student 47, the loop either crashes and stops (remaining students never notified) or silently skips (no record of the failure).

**3. No retries**
A temporary email service outage means that notification is lost permanently. There is no mechanism to try again.

**4. No partial failure recovery**
If the system crashes halfway through the loop, there is no way to know which students were already notified and which were not. Re-running the function sends duplicates to the first half.

**5. Tightly coupled operations**
Email, database write, and push are all inside the same function. A failure in one blocks or breaks the others.

---

### Failure Scenarios

| Scenario | Impact in current design |
|----------|--------------------------|
| Email service is down | All remaining students miss their notification |
| Database write fails | Notification sent but never stored — data inconsistency |
| Push service times out | Loop stalls, all subsequent students delayed |
| Server crashes mid-loop | No recovery — partial delivery with no audit trail |

---

### Revised Architecture Using Queues

Each notification is placed on a **message queue** (e.g. Redis Queue or RabbitMQ) as an independent job. Separate worker processes consume jobs from the queue and handle delivery.

**Flow:**
notify_all() called
↓
For each student → push job onto queue (fast, non-blocking)
↓
notify_all() returns immediately
↓
Workers pick up jobs independently
↓
Each worker: save_to_db → send_email → push_to_app
↓
On failure → retry with backoff → dead letter queue after max retries

---

### Retries and Dead Letter Queue

- Each job tracks a `retryCount`.
- On failure, the job is re-queued after a delay (exponential backoff: 5s, 30s, 2min).
- After 3 failed attempts, the job moves to a **Dead Letter Queue (DLQ)**.
- The DLQ is monitored by an alert — the team is notified to investigate and manually replay if needed.

---

### Revised Pseudocode

```python
def notify_all(student_ids, message):
    for student_id in student_ids:
        job = {
            "studentId": student_id,
            "message": message,
            "retryCount": 0,
            "createdAt": current_timestamp()
        }
        queue.push("notification_jobs", job)
    # returns immediately — no blocking


def worker_process():
    while True:
        job = queue.pop("notification_jobs")
        if job is None:
            continue

        try:
            save_to_db(job["studentId"], job["message"])
            send_email(job["studentId"], job["message"])
            push_to_app(job["studentId"], job["message"])

        except Exception as error:
            job["retryCount"] += 1
            if job["retryCount"] <= 3:
                queue.push_delayed("notification_jobs", job, delay_seconds=30)
            else:
                queue.push("dead_letter_queue", job)
                log_error(job, error)
```

---

### Benefits of This Architecture

| Concern | Solution |
|---------|----------|
| Blocking | Queue returns instantly, workers run async |
| No retries | Automatic retry with backoff |
| Crash recovery | Jobs persist in queue until acknowledged |
| Partial delivery | Each job is independent — no cascading failure |
| Observability | DLQ captures every failed job for inspection |

---
# Stage 6

## Priority Notification Inbox

### Approach

Notifications are fetched live from the provided API and ranked using a scoring function combining two signals:

1. **Type weight** — Placement (100), Result (80), Event (40)
2. **Recency score** — starts at 100 and decreases by 1 for every hour since the notification arrived. Newer notifications score higher.

**Final score = typeWeight + recencyScore**

Notifications are sorted descending by score and the top N are returned.

### Handling Continuously Incoming Notifications

The frontend polls the backend every 30 seconds. Each poll re-fetches and re-ranks the full list so newly arrived high-priority notifications rise to the top automatically.

### User-Selected Top N

The Priority Inbox tab allows selecting top 5, 10, 15, or 20. The frontend sends `?topN=N` to the backend which slices after ranking.

### Code Location

- Backend ranking: `notification_app_be/src/priorityEngine.js`
- Notification fetch: `notification_app_be/src/notificationService.js`
- API server: `notification_app_be/src/server.js`
- Frontend: `notification_app_fe/src/App.jsx`

---