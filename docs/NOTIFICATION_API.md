# Notification & Preferences API Reference

## Endpoints

### 1. Get User Notifications
- **`GET /api/notifications?category=government&unread_only=false`**

### 2. Get Unread Count
- **`GET /api/notifications/unread-count`**
- **Response**: `{"unread_count": 3}`

### 3. Mark Notification Read
- **`PATCH /api/notifications/{id}/read`**

### 4. Mark All Notifications Read
- **`PATCH /api/notifications/read-all`**

### 5. Delete Notification
- **`DELETE /api/notifications/{id}`**

### 6. Get Notification Preferences
- **`GET /api/preferences/notifications`**

### 7. Update Notification Preferences
- **`PUT /api/preferences/notifications`**
  ```json
  {
    "email_enabled": true,
    "whatsapp_enabled": false,
    "language": "hi"
  }
  ```

### 8. Create System Announcement
- **`POST /api/announcements`**
  ```json
  {
    "title": "Scheduled Maintenance",
    "content": "System will be undergo maintenance on Sunday.",
    "target_role": "all"
  }
  ```

### 9. List Announcements
- **`GET /api/announcements`**
