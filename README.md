# One Sunnah Content Studio
React 19 + TypeScript + Vite. Responsive admin interface with local CRUD, five-language editing, language-specific source references, publication validation, JSON import/export, and resizable widget previews.

## Run
`npm install` then `npm run dev`. Production: `npm run build`.

## Demo data
Three original editorial paraphrases are available as local examples; they are not full translated hadiths. Source links were checked on 2026-10-13. The separate [100-record five-language draft shortlist](data/README.md) was imported into Cloud Firestore on 2026-10-15. All 100 remain unpublished and unreviewed. Local demo changes persist in browser localStorage; exporting JSON makes a portable backup. The web library is not capped at 100; the mobile client keeps up to 100 records offline.

## Firebase
The public Firebase Web configuration for `onesunnah-e3a1e` is included in the client. `.env.local` can override it for a different project. The Firestore Database ID is `(default)`, and content uses its `hadiths` collection. Firebase Analytics initializes when the browser supports it.

Email/password and Google authentication are enabled. The deployed Site domain is in Firebase's authorized domains. In Settings, sign in with Google or email/password to load the cloud collection. A first Google sign-in creates a Firebase Authentication user, but that user still needs a trusted `admin: true` custom claim before the web editor can read or change drafts. An account without that claim is signed out and its UID is shown for administrator provisioning. Demo records are never uploaded automatically. Firebase CLI login is separate from web administrator sign-in. Never include service-account credentials in the frontend.

`firestore.rules` and `firestore.indexes.json` were deployed to the default database on 2026-10-15 using `firebase.json`. The rules permit public reads only for records with `status == 'Published'` and `reviewed == true`; editing requires the administrator claim. The content editor requires five complete languages for publication and can store a source label and URL for each language. Arabic and Urdu widget previews use right-to-left layout.

The Firebase Console screenshot on 2026-10-15 confirmed the project uses the default database. After deploying the rules and importing the 100 drafts, unauthenticated access to a draft was denied. Android 0.4.1 completed a live sync and correctly showed no published reminders. The administrator write path still needs an Authentication user with the `admin` claim. Publication requires complete translations, a reference URL, and editorial confirmation in the UI. The resizable web preview is not a native OS widget.

## Sources
https://sunnah.com/bukhari:1
https://sunnah.com/bukhari:6018
https://sunnah.com/muslim:2699a
