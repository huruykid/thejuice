# send-push-notification

Supabase Edge Function that delivers push notifications via Firebase Cloud Messaging (FCM) HTTP v1 API.

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Cloud Messaging** in the project settings

### 2. Download the service account key

1. In Firebase Console → Project Settings → **Service accounts**
2. Click **Generate new private key** → download the JSON file

### 3. Set Supabase secrets

```bash
supabase secrets set FIREBASE_PROJECT_ID=your-firebase-project-id
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{ ...paste the full JSON contents here... }'
```

### 4. Add platform config files

- **Android**: place `google-services.json` in `android/app/`
- **iOS**: place `GoogleService-Info.plist` in `ios/App/App/`

### 5. Sync Capacitor

```bash
npx cap sync
```

## Request format

```json
POST /functions/v1/send-push-notification
{
  "userId": "uuid-of-recipient",
  "title": "Notification title",
  "body": "Notification body text",
  "data": { "route": "/story/abc123" }
}
```

`data` is optional. When present, the client navigates to `data.route` when the user taps the notification.

## Notes

- Stale tokens (FCM returns 404 or `UNREGISTERED`) are automatically deleted from the `push_tokens` table.
- This function is called server-to-server and does not require a user auth token.
