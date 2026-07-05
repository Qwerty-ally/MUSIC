# ANCHOR Music — Setup Guide

A music & video hub for the ANCHOR group: Music, Music Videos, Live
Performances, Interviews, Behind the Scenes, Photos, and Albums/EPs.
Firebase handles sign in/up and the two account types — **Normal** (listen &
watch) and **Owner** (can also upload, gated by a secret code). Cloudinary
handles storing the actual audio/video/image files.

Plain HTML/CSS/JS — no build step, no `npm install` needed to run it.

## 1. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it e.g. `anchor-music`
3. Google Analytics is optional

## 2. Enable Firebase Services

In your Firebase project, enable:
- **Authentication** → Sign-in method → **Email/Password** ✓
- **Firestore Database** → Create in **production mode**

(No need for Firebase Storage — file uploads go to Cloudinary instead, see
step 5.)

## 3. Get Your Web App Config

1. Project Settings → General → "Your apps" → click the **</>** (web) icon
2. Register the app, copy the `firebaseConfig` object
3. Paste it into `firebase-config.js` in the project root, replacing the
   placeholder values (see `firebase-config.example.js` for the shape)

## 4. Set the Owner Sign-Up Code

Open `js/constants.js` and change `OWNER_CODE` to a secret of your choosing.
Only share this with people who should be able to upload content.

```js
export const OWNER_CODE = 'pick-your-own-secret'
```

Anyone who doesn't know this code can still sign up normally (no code
needed) and will get a "Normal" account.

## 5. Cloudinary (file storage)

Song/video/image files are uploaded directly from the browser to Cloudinary
using an **unsigned upload preset** (no backend, no API secret in the code).
This project currently reuses the same Cloudinary account as anchor-social
(cloud name `dtt5ie1ax`, preset `hiiiiiiiii`) — configured in
`js/cloudinary.js`.

If you'd rather use your own Cloudinary account instead:
1. Sign up free at https://cloudinary.com
2. Dashboard → copy your **Cloud name**
3. Settings → Upload → **Add upload preset** → set **Signing Mode** to
   **Unsigned** → Save → copy the preset name
4. Put both values into `js/cloudinary.js`:

```js
const CLOUD_NAME = 'your-cloud-name'
const UPLOAD_PRESET = 'your-unsigned-preset'
```

## 6. Apply Firestore Security Rules

Paste the contents of `firestore.rules` into Firebase Console → Firestore
Database → Rules → **Publish**.

This is what actually enforces the Owner/Normal split server-side: anyone
signed in can read any collection, but only accounts with `role == "owner"`
in their `users/{uid}` Firestore document can create, update, or delete
songs/videos/photos/albums (the client-side code check just decides which
role gets written when the account is created — the rule is what stops a
normal user from writing `role: "owner"` on themselves, or writing
documents directly).

If you already published the rules once before and are re-deploying, make
sure to re-paste and re-publish — new collections (`livePerformances`,
`interviews`, `behindTheScenes`, `photos`, `albums`) were added.

## 7. Run the App

This app uses native ES module `import`s, which browsers refuse to load over
`file://` (CORS). You need a plain static file server — pick whichever's
easiest:

```bash
# Option A: Node (no install needed)
npx serve .

# Option B: Python 3
python -m http.server 8080
```

Then open the printed URL (e.g. http://localhost:3000 or http://localhost:8080).

## How accounts work

- **Sign up** → choose **Normal** or **Owner**.
  - Normal: no code needed, can browse/watch/listen everything.
  - Owner: must enter the secret code from step 4. Gets an **Upload** link in
    the sidebar to add content to any tab.
- **Sign in** works the same for both roles.

## The tabs

- **Music** — songs, played through the persistent bottom player bar.
- **Music Videos** / **Live Performances** / **Interviews** / **Behind the
  Scenes** — all video collections, click a card to play in a modal.
- **Photos** — an image gallery, click a photo to view it larger.
- **Albums** — Album/EP releases. An owner sets a title, cover, optional
  release date, and a list of track names.
  - If the release date is in the future, the card shows an **"Upcoming
    Release"** tag, and opening it shows a live countdown at the top with the
    tracklist greyed out and unclickable.
  - Once the release date passes (or if no date was set — meaning it's
    already out), the countdown disappears and the tracklist displays
    normally.
  - Owners can reopen an album and click **Edit Album** to change the title,
    cover, release date, or track names later.

## Project structure

- `index.html` — the whole app shell (auth view + sidebar + all page sections + player bar + video/image/album modals), single page, hash-based navigation (`#/music`, `#/music-videos`, `#/live-performances`, `#/interviews`, `#/behind-the-scenes`, `#/photos`, `#/albums`, `#/upload`)
- `styles.css` — dark theme
- `firebase-config.js` — your Firebase project config (edit this)
- `js/constants.js` — the owner sign-up code (edit this)
- `js/cloudinary.js` — Cloudinary cloud name + unsigned upload preset (edit this if using your own account), plus the upload helper with progress reporting
- `js/firebase.js` — Firebase SDK init (auth, Firestore), loaded from the `gstatic.com` CDN as ES modules
- `js/auth.js` — sign up / sign in / sign out, Firestore user profile, auth state pub-sub
- `js/authPage.js` — wires up the sign in/up form and role picker
- `js/router.js` — hash-based view switching + auth/owner guard + sidebar state
- `js/player.js` — global audio player (queue, play/pause, seek, volume)
- `js/musicPage.js` — Music grid (Firestore `songs` collection)
- `js/videoCollectionPage.js` — generic grid+modal page factory shared by Music Videos, Live Performances, Interviews, and Behind the Scenes (each is just a Firestore collection name + a subtitle field)
- `js/photosPage.js` / `js/imageModal.js` — Photos grid + image lightbox
- `js/albumsPage.js` / `js/albumModal.js` / `js/albumForm.js` / `js/albumUtils.js` — Albums grid, detail modal (countdown + tracklist), create/edit form, and shared release-date helpers
- `js/uploadPage.js` — owner-only upload form covering all 7 content tabs, uploads to Cloudinary then saves the resulting URL + metadata to Firestore
- `js/mediaCard.js` — shared grid/card rendering helper
- `js/videoModal.js` — video playback modal
- `js/toast.js` — small toast notification helper
- `firestore.rules` — server-side owner-only write enforcement for every collection

## Notes

- There's only one group on this site (ANCHOR) — no multi-tenant/org support,
  by design.
- The audio player persists across tab navigation since it's all one HTML
  page (hash routing just shows/hides sections) — it does not persist across
  a full page reload.
- Cloudinary's free tier has generous limits for a small group, but large
  video files will eat into it fastest — keep an eye on usage in the
  Cloudinary dashboard if uploads are frequent.
