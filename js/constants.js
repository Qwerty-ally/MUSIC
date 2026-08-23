// Anyone who enters this code at sign up is granted the "owner" role
// (upload rights for songs / music videos / other videos).
// Change this before sharing the app with the group.
export const OWNER_CODE = 'ANCHOR#OFFICIAL'

// Newest entry first. Add one each time you ship a change, bumping the
// version by +0.01 for a small update, +0.05 for a medium update, or +0.1
// for a huge update. The corner badge shows CHANGELOG[0].version, and
// clicking it opens a page with CHANGELOG[0].notes.
export const CHANGELOG = [
  { version: '1.05', date: '2026-08-23', notes: "Songs no longer require audio to be uploaded upfront for a scheduled release — add it later. Songs can now be edited (title, artist, cover, audio, release date), and a released song with no audio yet stays clearly marked as pending instead of silently failing to play." },
  { version: '1.00', date: '2026-08-23', notes: 'Initial release.' },
]
