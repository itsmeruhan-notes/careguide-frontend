# Ruhan's Notes — User Manual

A private note-taking app. Your notes stay private until you share them, every change is kept in history, and admins can manage users.

**Open the app:** https://ruhan.lol/careguide

| Try it with | Email | Password |
|---|---|---|
| Admin | `admin@ruhan.lol` | `Admin1234` |
| User | `demo@ruhan.lol` | `User1234` |
| More users | `karim@ruhan.lol`, `sara@ruhan.lol`, `mim@ruhan.lol` | `Karim1234`, `Sara1234`, `Mim12345` |

On the sign-in page, the **Use Admin demo** and **Use User demo** buttons fill these in for you.

---

## 1. Sign in and register

- **Sign in** with your full email: `nickname@ruhan.lol`.
- **Register:** pick a nickname (3–30 letters, numbers, `.`, `_`, `-`) and a password (8+ characters with a letter and a number). Your email is created for you as `nickname@ruhan.lol`. You can add interests now or later.
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

- **+ New note** opens the editor. A title is required. Content can be up to 20,000 characters.
- The toolbar adds Markdown: bold, italic, code, lists, quotes, headings, divider. The note view shows it formatted.
- Save with the **Save note** button or **Ctrl+S / ⌘S**. Leaving with unsaved changes asks you first.
- If someone gave you **Can edit** access, a blue banner tells you whose note you are editing.

## 5. Reading, sharing and history

Opening a note shows the content, and on the right: owner, created and last-updated times (and by whom), who it is shared with, and actions.

**Share (owner only):** click **Manage sharing** or **Share** at the top.
1. Type the person's nickname or email.
2. Choose **Can edit** (view + change title and content) or **Read only** (view only).
3. Click **Share**. You can change someone's access from the dropdown or remove them with ✕.

Only the owner can delete a note or change who it is shared with.

**History (owner and admin):** every edit is listed newest first with who did it and when. Title changes show `old → new`. Content changes have **Show previous content diff**. Sharing changes are listed too.

**Delete** asks for confirmation. Deleted notes disappear for everyone they were shared with.

## 6. Posts

- **Posts** is a public feed every member can read. **+ New post** adds a title, body and up to 5 tags.
- Search posts by text, tag or author. Click a tag to search for it.
- Click an author's name to open their profile and all of their posts (Latest / Oldest).
- You can delete your own posts. Admins can delete any post.

## 7. Interests

- Shows people grouped by interest, with member counts.
- Filter by one or more interests (**Add filter**), show only groups with **Min. 3 members**, search interest names, and sort by size or A–Z.
- **View all** lists the members (click one to open their profile). **Join interest** adds that interest to your profile; **Joined** removes it.

## 8. My Profile

- Edit your **bio** and **interests** and click **Save changes**.
- Change your password (current password required). Demo accounts cannot change passwords.
- **Workspace Activity** shows how many notes you wrote, shared and received, and your posts.
- **View my public profile** shows what others see.

## 9. Admin

Visible only to admins.

**Users**
- Search by nickname, filter by status (Active/Deleted) and role.
- **Add user:** nickname, role, interests, password.
- **Edit user:** change role, interests, status or set a new password (leave blank to keep it).
- **Delete user** blocks sign-in and hides their notes and posts. **Restore user** brings them back.
- **View history** shows every change made to that account. You cannot delete or demote yourself, and demo accounts are locked.

**All Notes**
- Every note in the system, including deleted ones, with search, status/sharing filters and sorting.
- **Inspect** opens a note in read-only Admin view. Admins can read any note and its history but cannot edit or delete other people's notes.

**DB Insights**
- Lists every database index with its size and how often it is used.
- Shows a live query plan for every main query (the result of `explain()`), with keys examined, documents examined and time.
- The green **IXSCAN** badge means the query used an index. **Re-run all query plans** refreshes everything.

---

## For developers

```bash
npm ci
npm run dev       # http://localhost:5173/careguide/ (proxies /careguide/api to http://127.0.0.1:4000)
npm run lint
npm run build     # static files in dist/, served under /careguide/
```

React 19 · React Router 7 · Vite · Tailwind CSS 4. Design from Google Stitch (Calm Utility). The API lives in the `careguide-backend` repository.
