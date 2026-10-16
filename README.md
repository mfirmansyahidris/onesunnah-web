# One Sunnah Content Studio
React 19 + TypeScript + Vite. A public daily hadith reading page with Arabic, five-language translations and explanations, plus a Google-protected content studio with editing, source references, publication validation, JSON import/export, and resizable widget previews.

## Run
`npm install` then `npm run dev`. Production: `npm run build`.

## Demo data
The [100-record five-language draft shortlist](data/README.md) was imported into Cloud Firestore on 2026-10-15. All 100 remain unpublished and unreviewed. The web library is not capped at 100; the mobile client keeps up to 100 records offline. Older local editorial examples may remain in a browser's localStorage, but the web editor is now hidden until Google access is approved.

## Firebase
The public Firebase Web configuration for `onesunnah-e3a1e` is included in the client. `.env.local` can override it for a different project. The Firestore Database ID is `(default)`, and content uses its `hadiths` collection. Firebase Analytics initializes when the browser supports it.

Google authentication is enabled and the deployed Site domain is in Firebase's authorized domains. Everyone initially sees the public reading page. The account icon at the top right opens a dedicated **Log in** page. Logging in checks access without creating a request. **Sign up → Sign up with Google** creates `accessRequests/{uid}` with the Google UID, email, display name, `status: pending`, and `requestedAt` server timestamp. Existing requests are not overwritten. Pending users see a request-sent page with a Back button. An approved account can return through Log in to open the workspace.

Approved members have one of two roles in their access request document: `owner` or `editor` (missing roles on older approved records default to editor). **Workspace → Access requests** is visible only to owners, with live Pending, Approved, and Declined lists, search, and approval confirmation. Approving a pending request grants editor access; declining blocks entry. Every decision records `reviewedBy` (owner UID) and `reviewedAt` (server timestamp). Rules enforce these permissions, preserve the applicant's identity, and prevent self-approval, role escalation, overwriting an existing decision, and editing owner accounts. Editors can manage content but cannot list other accounts or review requests.

For manual administration, open **Firebase Console → Firestore Database → `(default)` → `accessRequests` → the user's UID**. Change `status` to `approved` and set `role` to `editor` for content access, or `owner` for an owner. Owner roles are assigned only through privileged Console/IAM access, never by sign-up or the approval UI. Set `status` to `rejected` to revoke access. Only assign owner access to trusted project administrators. Firebase CLI login is separate from web sign-in. Never include service-account credentials in the frontend.

The public reading page and Android can read records with both `status == 'Published'` and `reviewed == true` without login. The public page displays one record with complete translations and explanations in all five languages, or the separately attributed HadeethEnc 4717 reference bundled in `src/featured-reading.json` when none is ready. The draft shortlist is never exposed publicly. The reader supports Arabic and Urdu right-to-left layouts. Run `npm run test:access` for the sign-in/request flow and `npm run test:rules` for Firestore access checks.

`firestore.rules` and `firestore.indexes.json` target the default database through `firebase.json`. Public read access to `hadiths` is limited to Published, reviewed records. Reading drafts or creating, changing, or deleting content requires Google authentication and `accessRequests/{uid}.status == 'approved'`. Applicants may create a strictly validated pending request and read their own request; only approved owners may list requests or approve/decline others. Other collections and subcollections are denied by default. Revoking approval removes management access while preserving ordinary public reading. Privileged Firebase Console/Admin SDK access still uses Google Cloud IAM. Web and Android deployment rule files are kept identical. The content editor requires five complete languages for publication and can store a source label and URL for each language. Arabic and Urdu widget previews use right-to-left layout.

The earlier approved-only reading restriction was superseded on 2026-10-16 after the user clarified that Android must work without login. Google login and approval protect the web workspace; Android continues using its existing unauthenticated Published/reviewed query. Emulator checks cover that exact mobile query, public reading, draft and unreviewed isolation, approved management, owner decisions, applicant isolation, privilege escalation, default denial, and revocation.

The revised rules were deployed to `(default)` and verified against the tested source on 2026-10-16. Android's unauthenticated query succeeds (HTTP 200), while unfiltered collection reads and direct draft reads are denied (HTTP 403). At that initial verification all 100 candidates were Draft. A later staging step added 900 source-validated drafts and preserved the original 100 field values; all 1,000 remain Draft and unreviewed, so the public query still returns no records. The [Android selection report](data/android-daily-1000/README.md) and [five-language coverage report](data/collection-1000/README.md) distinguish complete five-language content from the missing Malay translations. No publication or database structure migration has been performed.

The Firebase Console screenshot on 2026-10-15 confirmed the project uses the default database. After deploying the original rules and importing the 100 drafts, unauthenticated access to a draft was denied. Android 0.4.1 completed a live sync and correctly showed no published reminders. Publication requires complete translations, a reference URL, and editorial confirmation in the UI. The resizable web preview is not a native OS widget.

## Sources
https://sunnah.com/bukhari:1
https://sunnah.com/bukhari:6018
https://sunnah.com/muslim:2699a
