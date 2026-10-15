# One Sunnah Content Studio
React 19 + TypeScript + Vite. Responsive admin interface with local CRUD, five-language editing, language-specific source references, publication validation, JSON import/export, and resizable widget previews.

## Run
`npm install` then `npm run dev`. Production: `npm run build`.

## Demo data
Three original editorial paraphrases, not full translated hadiths. Source links were checked on 2026-10-13. All start unpublished; Arabic excerpts and translations require editorial review. A separate [100-record five-language draft shortlist](data/README.md) can be imported in Settings. No records have been uploaded to Firebase. Local changes persist in browser localStorage; exporting JSON makes a portable backup. The web library is not capped at 100; the mobile client keeps up to 100 records offline.

## Firebase
The public Firebase Web configuration for `onesunnah-e3a1e` is included in the client. `.env.local` can override it for a different project. The Firestore Database ID is `onesunnah`, and content uses its `hadiths` collection. Firebase Analytics initializes when the browser supports it.

Enable email/password authentication and create an administrator account. Assign a trusted `admin: true` custom claim using the Firebase Admin SDK in a trusted environment. Add the deployed host to Firebase authorized domains. In Settings, sign in to load the cloud collection; demo records are never uploaded automatically. Never include service-account credentials in the frontend.

Deploy `firestore.rules` and `firestore.indexes.json` to the named database using `firebase.json`. The rules permit public reads only for records with `status == 'Published'` and `reviewed == true`; editing requires the administrator claim. Review them against other existing collections before deployment. The content editor now requires five complete languages for publication and can store a source label and URL for each language. Arabic and Urdu widget previews use right-to-left layout.

An Android emulator request on 2026-10-14 returned `NOT_FOUND` for database `onesunnah` in project `onesunnah-e3a1e`. The client build and deployment succeeded, but live Firestore access is unverified until the database exists and its rules and index are deployed. Publication requires complete translations, a reference URL, and editorial confirmation in the UI. The resizable web preview is not a native OS widget.

## Sources
https://sunnah.com/bukhari:1
https://sunnah.com/bukhari:6018
https://sunnah.com/muslim:2699a
