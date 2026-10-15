# One Sunnah Content Studio
React 19 + TypeScript + Vite. A public daily hadith reading page with Arabic, five-language translations and explanations, plus a Google-protected content studio with editing, source references, publication validation, JSON import/export, and resizable widget previews.

## Run
`npm install` then `npm run dev`. Production: `npm run build`.

## Demo data
The [100-record five-language draft shortlist](data/README.md) was imported into Cloud Firestore on 2026-10-15. All 100 remain unpublished and unreviewed. The web library is not capped at 100; the mobile client keeps up to 100 records offline. Older local editorial examples may remain in a browser's localStorage, but the web editor is now hidden until Google access is approved.

## Firebase
The public Firebase Web configuration for `onesunnah-e3a1e` is included in the client. `.env.local` can override it for a different project. The Firestore Database ID is `(default)`, and content uses its `hadiths` collection. Firebase Analytics initializes when the browser supports it.

Google authentication is enabled and the deployed Site domain is in Firebase's authorized domains. Everyone initially sees the public reading page. The Google icon at the top right starts OAuth; a new account's access request is submitted automatically after successful sign-in. This creates `accessRequests/{uid}` with `status: pending`, the Google email, display name, and a server timestamp. Pending users see a request-sent page with a Back button. Existing requests are not submitted again. To approve manually, open **Firebase Console → Firestore Database → `(default)` → `accessRequests` → the user's UID** and change only `status` from `pending` to `approved`. The visitor can then click the Google icon again to check approval and open the studio. Set `status` to `rejected` to deny access. Firebase Security Rules prohibit clients from changing or deleting a request after creation; Console writes use privileged access. Only an approved Google sign-in can read or edit unpublished hadiths. Firebase CLI login is separate from web sign-in. Never include service-account credentials in the frontend.

The public page queries only published, reviewed records and displays one with complete translations and explanations in all five languages. If none is ready or Firestore is unavailable, it uses the separately attributed HadeethEnc 4717 reference bundled in `src/featured-reading.json`; the draft shortlist is not exposed. The public reader supports Arabic and Urdu right-to-left layouts. Run `npm run test:access` for the sign-in/request flow and `npm run test:rules` for Firestore access checks.

`firestore.rules` and `firestore.indexes.json` target the default database through `firebase.json`. The rules permit public reads only for records with `status == 'Published'` and `reviewed == true`; writing and reading drafts require an approved Google request document. The content editor requires five complete languages for publication and can store a source label and URL for each language. Arabic and Urdu widget previews use right-to-left layout.

The Firebase Console screenshot on 2026-10-15 confirmed the project uses the default database. After deploying the original rules and importing the 100 drafts, unauthenticated access to a draft was denied. Android 0.4.1 completed a live sync and correctly showed no published reminders. Publication requires complete translations, a reference URL, and editorial confirmation in the UI. The resizable web preview is not a native OS widget.

## Sources
https://sunnah.com/bukhari:1
https://sunnah.com/bukhari:6018
https://sunnah.com/muslim:2699a
