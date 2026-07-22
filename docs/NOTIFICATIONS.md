# Notification System Architecture

## Overview
CivicPulse provides an event-driven notification center supporting persistent in-app notifications, delivery tracking, user channel preferences, and system broadcast announcements.

## Architecture
- **In-App Persistence**: Notifications are saved to table `notifications` with category, status, and optional case ID.
- **Event Engine**: `dispatch_notification_event()` generates in-app notifications and inspects user communication preferences for external dispatch.
- **Unread Counter**: `GET /api/notifications/unread-count` returns active unread items.
