# One Sunnah Content Studio
React 19 + TypeScript + Vite. Responsive admin interface with local CRUD, three-language editing, source references, publication validation, JSON export, and resizable widget previews.

## Run
`npm install` then `npm run dev`. Production: `npm run build`.

## Demo data
Three original editorial paraphrases, not full translated hadiths. Source links were checked on 2026-10-13. All start unpublished; Arabic excerpts and translations require editorial review. No records have been uploaded to Firebase. Local changes persist in browser localStorage; exporting JSON makes a portable backup. The web library is not capped at 100; the 100-record offline limit belongs to the planned mobile client.

## Firebase
The public Firebase Web configuration for `onesunnah-e3a1e` is included in the client. `.env.local` can override it for a different project. The Firestore Database ID is `onesunnah`, and content uses its `hadiths` collection. Firebase Analytics initializes when the browser supports it.

Enable email/password authentication and create an administrator account. Assign a trusted `admin: true` custom claim using the Firebase Admin SDK in a trusted environment. Add the deployed host to Firebase authorized domains. In Settings, sign in to load the cloud collection; demo records are never uploaded automatically. Never include service-account credentials in the frontend.

Deploy `firestore.rules` and `firestore.indexes.json` to the named database using `firebase.json`. The rules permit public reads only for records with `status == 'Published'` and `reviewed == true`; editing requires the administrator claim. Review them against other existing collections before deployment.

An Android emulator request on 2026-10-14 returned `NOT_FOUND` for database `onesunnah` in project `onesunnah-e3a1e`. The client build and deployment succeeded, but live Firestore access is unverified until the database exists and its rules and index are deployed. Publication requires complete translations, a reference URL, and editorial confirmation in the UI. The resizable web preview is not a native OS widget.

## Sources
https://sunnah.com/bukhari:1
https://sunnah.com/bukhari:6018
https://sunnah.com/muslim:2699a
