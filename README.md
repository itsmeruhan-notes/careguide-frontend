# Ruhan's Notes — User Manual

A private note-taking app. Notes stay private until you share them, every change is kept in history, and admins manage the team's accounts.

**Open the app:** https://ruhan.lol/careguide

Accounts are given to you by an admin, or you can register yourself.

## Stack

React 19 · React Router 7 · Vite · Tailwind CSS 4 · design built in Google Stitch

---

## 1. Sign in and register

- **Sign in** with your full work email address and password.
- **Register:** choose a nickname (3–30 letters, numbers, `.`, `_`, `-`) and a password (8+ characters with a letter and a number). Your email is created from your nickname. You can add interests now or later.
- Your nickname is your identity in the app and cannot be changed.
- If your session expires you will see a "Session expired" page. Sign in again.

## 2. Moving around

The top bar has **My Notes**, **Posts**, **Interests**, and for admins an **Admin** menu (Users, All Notes, DB Insights). The moon icon switches dark mode. Your avatar menu has **My Profile** and **Log out**. On a phone, use the ☰ menu.

## 3. My Notes

- **My notes** tab: notes you own. **Shared with me** tab: notes other people shared with you, with the owner's name and your access (`Read only` or `Can edit`).
- **Search** looks in titles and content. **Newest/Oldest first** changes the order. **Layout** switches between grid and list.
- Use the pager at the bottom and choose how many notes per page.
- The **⋯** menu on a card opens, edits, shares, shows history or deletes the note (share, history and delete only for your own notes).

## 4. Writing a note

- **+ New note** opens the editor. A title is required; content can be long.
- The toolbar adds formatting: bold, italic, code, lists, quotes, headings, divider. The note view shows it formatted.
- Save with **Save note** or **Ctrl+S / ⌘S**. Leaving with unsaved changes asks you first.
- If someone gave you **Can edit** access, a banner tells you whose note you are editing.

## 5. Reading, sharing and history

Opening a note shows the content, and on the side: owner, when it was created and last updated (and by whom), who it is shared with, and actions.

**Share (owner only):** click **Manage sharing** or **Share**.
1. Type the person's nickname.
2. Choose **Can edit** (view and change title and content) or **Read only** (view only).
3. Click **Share**. Change someone's access from the dropdown or remove them with ✕.

Only the owner can delete a note or change who it is shared with.

**History (owner and admin):** every edit is listed newest first with who did it and when. Title changes show `old → new`; content changes have **Show previous content diff**; sharing changes are listed too.

**Delete** asks for confirmation. A deleted note disappears for everyone it was shared with.

## 6. Posts

- **Posts** is a feed every member can read. **+ New post** adds a title, body and up to 5 tags.
- Search posts by text, tag or author; click a tag to search for it.
- Click an author's name to open their profile and all of their posts.
- You can delete your own posts; admins can delete any post.

## 7. Interests

- People grouped by interest, with member counts.
- Filter by interests, show only groups with **Min. 3 members**, search interest names, sort by size or A–Z.
- **View all** lists the members. **Join interest** adds it to your profile; **Joined** removes it.

## 8. My Profile

- Edit your **bio** and **interests**, then **Save changes**.
- Change your password (current password required).
- **Workspace Activity** shows how many notes you wrote, shared and received, and your posts.
- **View my public profile** shows what others see.

## 9. Admin

Visible only to admins.

**Users** — search by nickname, filter by status and role, add users, change role/interests/status, set a new password, delete (blocks sign-in and hides their notes and posts) or restore, and view each account's change history. You cannot delete or demote yourself.

**All Notes** — every note in the system, including deleted ones, with search, filters and sorting. **Inspect** opens a note read-only. Admins can read any note and its history but cannot edit or delete other people's notes.

**DB Insights** — every database index with its size and usage, and a live query plan for each main query showing whether it used an index (**IXSCAN**). **Re-run all query plans** refreshes it.

---

## For developers

```bash
npm ci
npm run dev     # local dev server, expects the backend running locally
npm run lint
npm run build   # static files in dist/, served under /careguide/
```
