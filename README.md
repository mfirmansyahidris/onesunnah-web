# One Sunnah Content Studio
React 19 + TypeScript + Vite. Responsive admin interface with local CRUD, three-language editing, source references, publication validation, JSON export, and resizable widget previews.

## Run
`npm install` then `npm run dev`. Production: `npm run build`.

## Demo data
Three original editorial paraphrases, not full translated hadiths. Source links were checked on 2026-10-13. All start unpublished; Arabic excerpts and translations require editorial review. No records have been uploaded to Firebase. Local changes persist in browser localStorage; exporting JSON makes a portable backup. The web library is not capped at 100; the 100-record offline limit belongs to the planned mobile client.

## Firebase
Copy `.env.example` to `.env.local` and enter public Firebase Web configuration. Enable email/password authentication and create an administrator account. Assign a trusted `admin: true` custom claim using the Firebase Admin SDK in a trusted environment. Deploy `firestore.rules` to restrict all reads/writes to admins. Add the deployed host to Firebase authorized domains. Rebuild the site with config present. In Settings, sign in to load the `hadiths` collection. Successful cloud writes update the interface; failures are surfaced without claiming success. Demo records are never uploaded automatically. Firebase config is public; never include service-account credentials in the frontend.

Live Firestore has not been validated without a configured project. Before production, confirm rules and claims against the Firebase emulator/project. Public/mobile read access is intentionally not granted by these admin-only rules and needs a separate published-content access design. Publication requires complete translations, a reference URL, and editorial confirmation in the UI; the administrator remains responsible for review. The resizable web preview is not a native OS widget.

## Sources
https://sunnah.com/bukhari:1
https://sunnah.com/bukhari:6018
https://sunnah.com/muslim:2699a
