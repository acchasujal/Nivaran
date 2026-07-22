# Event System Architecture

## Overview
CivicPulse automatically generates notification events triggered by core municipal case operations.

## Event Triggers
- **Case Assigned**: `dispatch_notification_event` fires when officer/department assignment is logged.
- **Repair Completed**: Dispatches notification when field team uploads after-repair photos.
- **Verification Requested**: Alerts local citizens to vote on repair quality.
- **Verification Passed**: Dispatches confirmation of community consensus.
- **Case Resolved**: Notifies reporter and community members of case resolution.
