// Anyone who enters this code at sign up is granted the "owner" role
// (upload rights for songs / music videos / other videos).
// Change this before sharing the app with the group.
export const OWNER_CODE = 'ANCHOR#OFFICIAL'

// Newest entry first. Add one each time you ship a change, bumping the
// version by +0.01 for a small update, +0.05 for a medium update, or +0.1
// for a huge update. The corner badge shows CHANGELOG[0].version, and
// clicking it opens a page with CHANGELOG[0].notes.
export const CHANGELOG = [
  { version: '1.04', date: '2026-08-24', notes: 'Songs now have a shareable public link too, not just albums — grab it from the share icon on any song card. Release links use a new #/release/album/... or #/release/song/... format; old album links still work.' },
  { version: '1.03', date: '2026-08-24', notes: "Release dates now include a time, not just a day — pick an exact hour/minute for songs, albums, and per-track early releases. Also fully closes the timezone bug from the last update (albums saved before that fix will show the old date until you reopen and re-save them once)." },
  { version: '1.02', date: '2026-08-23', notes: "Fixed a timezone bug where a picked release date could show as a day earlier. Albums now have a shareable public link (grab it from the album's Copy Release Link button) that shows the countdown, cover, and tracklist to anyone — even without an Anchor account." },
  { version: '1.01', date: '2026-08-23', notes: "Songs no longer require audio to be uploaded upfront for a scheduled release — add it later. Songs can now be edited (title, artist, cover, audio, release date), and a released song with no audio yet stays clearly marked as pending instead of silently failing to play." },
  { version: '1.00', date: '2026-08-23', notes: 'Initial release.' },
]
