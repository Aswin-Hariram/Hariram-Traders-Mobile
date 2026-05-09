# Supabase Backup Setup

This app keeps SQLite as the local database and uses Supabase only for cloud backup and restore.

## 1. Add app env vars

Copy the values from your Supabase project into `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET=app-backups
```

## 2. Create a private Storage bucket

Create a private bucket named `app-backups` in Supabase Storage.

## 3. Add Storage policies

Run this SQL in the Supabase SQL editor. It gives each authenticated user access only to files inside their own folder.

```sql
create policy "Users can upload their own backup files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'app-backups'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can read their own backup files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'app-backups'
  and owner_id = (select auth.uid()::text)
);

create policy "Users can update their own backup files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'app-backups'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'app-backups'
  and owner_id = (select auth.uid()::text)
);

create policy "Users can delete their own backup files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'app-backups'
  and owner_id = (select auth.uid()::text)
);
```

## 4. Enable email/password auth

In Supabase Auth, enable Email auth. The app uses a small backup-only account so the same user can sign in on a new phone and restore their backup.

## 5. Rebuild the app

After installing dependencies, rebuild the native app:

```bash
npm run android
```
