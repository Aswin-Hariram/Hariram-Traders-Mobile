# Supabase Backup Setup

This app uses SQLite for on-device storage and Supabase only for optional cloud backup and restore.

## What you need

- A Supabase project
- A private Storage bucket for backup files
- Email/password authentication enabled in Supabase Auth
- A local `.env` file with the app's public backup settings

## 1. Add app environment variables

Create a `.env` file in the project root and add:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET=app-backups
```

`EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET` is optional in code, but setting it explicitly keeps local setup clear.

## 2. Create a private Storage bucket

In Supabase Storage, create a private bucket named `app-backups` or use the bucket name you set in `EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET`.

## 3. Add Storage policies

Run the SQL below in the Supabase SQL editor. These policies allow each authenticated user to manage only their own backup files inside their own folder.

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

If you use a bucket name other than `app-backups`, replace that value in each policy.

## 4. Enable email/password auth

In Supabase Auth, enable Email authentication. The app signs in with a dedicated backup account so the same person can restore data on a new device later.

## 5. Rebuild and run the app

After adding the environment variables, start or rebuild the app:

```bash
npm start
```

For native testing:

```bash
npm run android
```

```bash
npm run ios
```

## How backup works in the app

- Local data stays in SQLite on the device
- The app can export that local data as a JSON backup
- When a Supabase backup account is connected, the latest backup can be uploaded to Storage
- Restore downloads the latest cloud backup and replaces the current local device data

## Common setup issues

- Missing `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` will disable cloud backup
- A public Storage bucket is not recommended for billing data backups
- If backup actions fail with permissions errors, double-check the Storage policies and bucket name
