import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SUPABASE_BACKUP_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET || 'app-backups'
const BACKUP_OBJECT_NAME = 'latest.json'

let supabaseClient
let autoRefreshRegistered = false

export function isSupabaseBackupConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
}

export function getSupabaseBackupBucketName() {
  return SUPABASE_BACKUP_BUCKET
}

export async function getSupabaseBackupConnection() {
  if (!isSupabaseBackupConfigured()) {
    return {
      configured: false,
      connected: false,
      email: '',
      userId: '',
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw new Error(error.message || 'Unable to read the Supabase backup session.')
  }

  return {
    configured: true,
    connected: Boolean(data.session),
    email: data.session?.user?.email || '',
    userId: data.session?.user?.id || '',
  }
}

export async function signUpSupabaseBackupAccount(email, password) {
  const client = getSupabaseClient()
  const normalizedEmail = normalizeEmail(email)
  const normalizedPassword = normalizePassword(password)

  const { data, error } = await client.auth.signUp({
    email: normalizedEmail,
    password: normalizedPassword,
  })

  if (error) {
    throw new Error(error.message || 'Unable to create the Supabase backup account.')
  }

  return {
    email: data.user?.email || normalizedEmail,
    connected: Boolean(data.session),
    requiresEmailConfirmation: !data.session,
  }
}

export async function signInSupabaseBackupAccount(email, password) {
  const client = getSupabaseClient()
  const normalizedEmail = normalizeEmail(email)
  const normalizedPassword = normalizePassword(password)

  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  })

  if (error) {
    throw new Error(error.message || 'Unable to sign in to the Supabase backup account.')
  }

  if (!data.session) {
    throw new Error('Supabase did not return a session for this backup account.')
  }

  return {
    email: data.session.user.email || normalizedEmail,
    userId: data.session.user.id,
  }
}

export async function signOutSupabaseBackupAccount() {
  if (!isSupabaseBackupConfigured()) {
    return
  }

  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()

  if (error) {
    throw new Error(error.message || 'Unable to sign out of the Supabase backup account.')
  }
}

export async function uploadBackupToSupabase(backupDocument) {
  const client = getSupabaseClient()
  const session = await requireSupabaseBackupSession()
  const objectPath = getUserBackupPath(session.user.id)
  const backupContents = JSON.stringify(backupDocument, null, 2)
  const fileBody = new Blob([backupContents], { type: 'application/json' })

  const { error } = await client.storage.from(SUPABASE_BACKUP_BUCKET).upload(objectPath, fileBody, {
    contentType: 'application/json',
    cacheControl: '0',
    upsert: true,
  })

  if (error) {
    throw new Error(normalizeStorageError(error, 'Unable to upload the backup to Supabase.'))
  }

  return {
    bucket: SUPABASE_BACKUP_BUCKET,
    objectPath,
    exportedAt: backupDocument?.exportedAt || new Date().toISOString(),
    email: session.user.email || '',
  }
}

export async function downloadBackupFromSupabase() {
  const client = getSupabaseClient()
  const session = await requireSupabaseBackupSession()
  const objectPath = getUserBackupPath(session.user.id)
  const { data, error } = await client.storage.from(SUPABASE_BACKUP_BUCKET).download(objectPath)

  if (error) {
    throw new Error(normalizeStorageError(error, 'Unable to download the backup from Supabase.'))
  }

  const contents = await data.text()

  return {
    bucket: SUPABASE_BACKUP_BUCKET,
    objectPath,
    fileName: buildRemoteBackupFileName(session.user.email),
    contents,
  }
}

function getSupabaseClient() {
  if (!isSupabaseBackupConfigured()) {
    throw new Error(
      'Supabase backup is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY first.'
    )
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  }

  registerAutoRefresh(supabaseClient)

  return supabaseClient
}

async function requireSupabaseBackupSession() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw new Error(error.message || 'Unable to read the Supabase backup session.')
  }

  if (!data.session) {
    throw new Error('Connect a Supabase backup account first.')
  }

  return data.session
}

function registerAutoRefresh(client) {
  if (autoRefreshRegistered || Platform.OS === 'web') {
    return
  }

  autoRefreshRegistered = true

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      client.auth.startAutoRefresh()
    } else {
      client.auth.stopAutoRefresh()
    }
  })
}

function getUserBackupPath(userId) {
  return `${String(userId || '').trim()}/${BACKUP_OBJECT_NAME}`
}

function buildRemoteBackupFileName(email) {
  const sanitizedEmail = String(email || 'supabase-backup')
    .trim()
    .replace(/[^0-9A-Za-z._-]/g, '-')

  return `${sanitizedEmail || 'supabase-backup'}-${BACKUP_OBJECT_NAME}`
}

function normalizeStorageError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage || '').trim()

  if (!message) {
    return fallbackMessage
  }

  if (message.toLowerCase().includes('not found')) {
    return 'No Supabase backup was found for this backup account yet.'
  }

  return message
}

function normalizeEmail(email) {
  const nextEmail = String(email || '').trim().toLowerCase()

  if (!nextEmail) {
    throw new Error('Enter the email for your Supabase backup account.')
  }

  return nextEmail
}

function normalizePassword(password) {
  const nextPassword = String(password || '')

  if (!nextPassword.trim()) {
    throw new Error('Enter the password for your Supabase backup account.')
  }

  if (nextPassword.length < 6) {
    throw new Error('Use a password with at least 6 characters for the backup account.')
  }

  return nextPassword
}
