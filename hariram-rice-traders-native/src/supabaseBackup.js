import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SUPABASE_BACKUP_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET || 'app-backups'
const LEGACY_BACKUP_OBJECT_NAME = 'latest.json'
const BACKUP_OBJECT_PREFIX = 'backup-'
const MAX_BACKUP_FILES = 12

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
  const objectPath = getUserBackupPath(session.user.id, buildBackupObjectName(backupDocument?.exportedAt))
  const backupContents = JSON.stringify(backupDocument, null, 2)
  const fileBody = encodeTextToArrayBuffer(backupContents)

  const { error } = await client.storage.from(SUPABASE_BACKUP_BUCKET).upload(objectPath, fileBody, {
    contentType: 'application/json',
    cacheControl: '0',
    upsert: true,
  })

  if (error) {
    throw new Error(normalizeStorageError(error, 'Unable to upload the backup to Supabase.'))
  }

  await pruneOldBackupFiles(client, session.user.id)

  return {
    bucket: SUPABASE_BACKUP_BUCKET,
    objectPath,
    fileName: getObjectNameFromPath(objectPath),
    exportedAt: backupDocument?.exportedAt || new Date().toISOString(),
    email: session.user.email || '',
  }
}

export async function downloadBackupFromSupabase() {
  const client = getSupabaseClient()
  const session = await requireSupabaseBackupSession()
  const objectPath = await getLatestUserBackupPath(client, session.user.id)
  const { data, error } = await client.storage
    .from(SUPABASE_BACKUP_BUCKET)
    .download(objectPath, { cacheNonce: Date.now() }, { cache: 'no-store' })

  if (error) {
    throw new Error(normalizeStorageError(error, 'Unable to download the backup from Supabase.'))
  }

  const contents = await readDownloadedBackupContents(data)

  return {
    bucket: SUPABASE_BACKUP_BUCKET,
    objectPath,
    fileName: getObjectNameFromPath(objectPath),
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

function getUserBackupFolder(userId) {
  return String(userId || '').trim()
}

function getUserBackupPath(userId, objectName) {
  return `${getUserBackupFolder(userId)}/${objectName}`
}

function buildBackupObjectName(exportedAt) {
  const parsedDate = new Date(exportedAt || Date.now())
  const isoValue = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()

  return `${BACKUP_OBJECT_PREFIX}${isoValue.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}.json`
}

function getObjectNameFromPath(objectPath) {
  return String(objectPath || '')
    .split('/')
    .filter(Boolean)
    .pop() || LEGACY_BACKUP_OBJECT_NAME
}

async function getLatestUserBackupPath(client, userId) {
  const folder = getUserBackupFolder(userId)
  const { data, error } = await client.storage.from(SUPABASE_BACKUP_BUCKET).list(
    folder,
    {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'desc' },
    },
    { cache: 'no-store' }
  )

  if (error) {
    throw new Error(normalizeStorageError(error, 'Unable to list Supabase backups.'))
  }

  const backupFiles = (data || []).filter((entry) =>
    String(entry?.name || '').startsWith(BACKUP_OBJECT_PREFIX) && String(entry?.name || '').endsWith('.json')
  )

  if (backupFiles.length > 0) {
    return getUserBackupPath(userId, backupFiles[0].name)
  }

  const legacyBackup = (data || []).find((entry) => String(entry?.name || '') === LEGACY_BACKUP_OBJECT_NAME)

  if (legacyBackup) {
    return getUserBackupPath(userId, LEGACY_BACKUP_OBJECT_NAME)
  }

  throw new Error('No Supabase backup was found for this backup account yet.')
}

async function pruneOldBackupFiles(client, userId) {
  const folder = getUserBackupFolder(userId)
  const { data, error } = await client.storage.from(SUPABASE_BACKUP_BUCKET).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'desc' },
  })

  if (error) {
    return
  }

  const removablePaths = (data || [])
    .filter((entry) =>
      String(entry?.name || '').startsWith(BACKUP_OBJECT_PREFIX) && String(entry?.name || '').endsWith('.json')
    )
    .slice(MAX_BACKUP_FILES)
    .map((entry) => getUserBackupPath(userId, entry.name))

  if (removablePaths.length === 0) {
    return
  }

  await client.storage.from(SUPABASE_BACKUP_BUCKET).remove(removablePaths)
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

async function readDownloadedBackupContents(data) {
  if (typeof data === 'string') {
    return data
  }

  if (typeof data?.text === 'function') {
    return data.text()
  }

  if (typeof data?.arrayBuffer === 'function') {
    const buffer = await data.arrayBuffer()
    return decodeBytesToText(new Uint8Array(buffer))
  }

  if (typeof Response !== 'undefined' && data instanceof Response) {
    return data.text()
  }

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    if (typeof Response !== 'undefined') {
      return new Response(data).text()
    }

    return readBlobWithFileReader(data)
  }

  if (data instanceof ArrayBuffer) {
    return decodeBytesToText(new Uint8Array(data))
  }

  if (ArrayBuffer.isView(data)) {
    return decodeBytesToText(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
  }

  if (looksLikeBlob(data)) {
    if (typeof Response !== 'undefined') {
      return new Response(data).text()
    }

    return readBlobWithFileReader(data)
  }

  throw new Error('The downloaded Supabase backup format is not supported on this device yet.')
}

function decodeBytesToText(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes)
  }

  let output = ''

  for (let index = 0; index < bytes.length; index += 1) {
    output += String.fromCharCode(bytes[index])
  }

  try {
    return decodeURIComponent(escape(output))
  } catch (_error) {
    return output
  }
}

function encodeTextToArrayBuffer(value) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).buffer
  }

  const utf8Value = unescape(encodeURIComponent(String(value || '')))
  const bytes = new Uint8Array(utf8Value.length)

  for (let index = 0; index < utf8Value.length; index += 1) {
    bytes[index] = utf8Value.charCodeAt(index)
  }

  return bytes.buffer
}

function looksLikeBlob(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.size === 'number' &&
      typeof value.type === 'string' &&
      typeof value.slice === 'function'
  )
}

function readBlobWithFileReader(blob) {
  if (typeof FileReader === 'undefined') {
    throw new Error('The downloaded Supabase backup format is not supported on this device yet.')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Unable to read the downloaded Supabase backup on this device.'))
    }

    reader.onload = () => {
      resolve(String(reader.result || ''))
    }

    reader.readAsText(blob)
  })
}
