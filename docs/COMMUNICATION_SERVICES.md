# Communication Services & Channel Delivery Tracking

## Overview
CivicPulse manages multi-channel communication delivery (In-App, Email via SendGrid, WhatsApp via Twilio) and tracks delivery statuses.

## Channel Abstractions & Tracking
- **`in_app`**: Immediate persistence in notification table.
- **`email`**: Dispatched via SendGrid SMTP gateway.
- **`whatsapp`**: Dispatched via Twilio Meta Cloud API sandbox.

## Delivery States (`notification_deliveries`)
- `queued`: Notification scheduled for dispatch.
- `sending`: Transmitting to provider gateway.
- `delivered`: Provider confirmation received.
- `failed`: Terminal dispatch failure.
