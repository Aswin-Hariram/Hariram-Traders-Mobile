import * as SQLite from 'expo-sqlite'

import {
  createBill,
  createBusinessProfile,
  createCustomer,
  createItem,
} from './constants'
import { calculateSummary, normalizeIndianPhoneNumber } from './utils'

const DATABASE_NAME = 'billing-desk.db'
const DEFAULT_BUSINESS_PROFILE = {
  companyName: 'Hariram Rice Traders',
  companyTagline: 'Wholesale Rice Merchants',
  companyAddress: '115, South New Street, Thoothukudi - 628 001',
  companyGstin: '33ABKPH138D2Z9',
  companyPhone: '+91 9443078877',
  companyEmail: 'hariramp7799@gmail.com',
  companyBank: 'Canara Bank',
  companyAccountName: 'HARIRAM P',
  companyAccount: '1284201000958',
  companyAccountType: 'CAA',
  companyIfsc: 'CNRB0001284',
  companyBranch: 'CHIDAMBARA NAGAR, TUTICORIN',
  companyState: 'Tamil Nadu',
  companyWebsite: 'https://www.justdial.com/Thoothukudi/Hariram-RICE-Traders-Kilashanmugapuram/9999PX461-X461-190117163250-T9G3_BZDET',
}
const THEME_MODE_SETTING_KEY = 'theme_mode'
const DEFAULT_THEME_MODE = 'light'

let databasePromise

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
  }

  return databasePromise
}

export async function initializeDatabase() {
  const db = await getDatabase()

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      gstin TEXT,
      email TEXT,
      place_of_supply TEXT,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      invoice_date TEXT,
      due_date TEXT,
      grand_total REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const settingsCount = await db.getFirstAsync(
    'SELECT COUNT(*) AS count FROM app_settings WHERE key = ?',
    'business_profile'
  )

  if ((settingsCount?.count ?? 0) === 0) {
    await saveBusinessProfile(createBusinessProfile(DEFAULT_BUSINESS_PROFILE))
  }
}

export async function listCustomers() {
  const db = await getDatabase()
  const rows = await db.getAllAsync(
    'SELECT payload FROM customers ORDER BY updated_at DESC, name COLLATE NOCASE ASC'
  )

  return rows.map((row) => reviveCustomer(row.payload))
}

export async function saveCustomer(customer) {
  const db = await getDatabase()
  const nextCustomer = normalizeCustomer(customer)

  if (!hasCustomerContent(nextCustomer)) {
    throw new Error('Add at least one customer detail before saving.')
  }

  await db.runAsync(
    `INSERT INTO customers (id, name, phone, gstin, email, place_of_supply, updated_at, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       phone = excluded.phone,
       gstin = excluded.gstin,
       email = excluded.email,
       place_of_supply = excluded.place_of_supply,
       updated_at = excluded.updated_at,
       payload = excluded.payload`,
    nextCustomer.id,
    nextCustomer.name,
    nextCustomer.phone,
    nextCustomer.gstin,
    nextCustomer.email,
    nextCustomer.placeOfSupply,
    nextCustomer.updatedAt,
    JSON.stringify(nextCustomer)
  )

  return nextCustomer
}

export async function deleteCustomer(customerId) {
  const db = await getDatabase()

  const billsToUpdate = await db.getAllAsync(
    'SELECT id, payload FROM bills WHERE customer_id = ?',
    customerId
  )

  if (billsToUpdate.length > 0) {
    const updatedAt = new Date().toISOString()

    for (const row of billsToUpdate) {
      const payload = JSON.parse(row.payload)
      const nextPayload = JSON.stringify({
        ...payload,
        customerId: null,
        updatedAt,
      })

      await db.runAsync(
        `UPDATE bills
           SET customer_id = NULL,
               payload = ?,
               updated_at = ?
         WHERE id = ?`,
        nextPayload,
        updatedAt,
        row.id
      )
    }
  }

  await db.runAsync('DELETE FROM customers WHERE id = ?', customerId)
}

export async function listBills() {
  const db = await getDatabase()
  const rows = await db.getAllAsync(
    `SELECT payload
     FROM bills
     ORDER BY invoice_date DESC, updated_at DESC, invoice_number COLLATE NOCASE ASC`
  )

  return rows.map((row) => reviveBill(row.payload))
}

export async function saveBill(bill) {
  const db = await getDatabase()
  const nextBill = normalizeBill(bill)
  const summary = calculateSummary(nextBill.items)

  await db.runAsync(
    `INSERT INTO bills (
      id,
      invoice_number,
      customer_id,
      customer_name,
      invoice_date,
      due_date,
      grand_total,
      updated_at,
      payload
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      invoice_number = excluded.invoice_number,
      customer_id = excluded.customer_id,
      customer_name = excluded.customer_name,
      invoice_date = excluded.invoice_date,
      due_date = excluded.due_date,
      grand_total = excluded.grand_total,
      updated_at = excluded.updated_at,
      payload = excluded.payload`,
    nextBill.id,
    nextBill.invoiceNumber,
    nextBill.customerId,
    nextBill.customerName,
    nextBill.invoiceDate,
    nextBill.dueDate,
    summary.grandTotal,
    nextBill.updatedAt,
    JSON.stringify(nextBill)
  )

  return nextBill
}

export async function deleteBill(billId) {
  const db = await getDatabase()
  await db.runAsync('DELETE FROM bills WHERE id = ?', billId)
}

export async function getBusinessProfile() {
  const db = await getDatabase()
  const row = await db.getFirstAsync(
    'SELECT payload FROM app_settings WHERE key = ?',
    'business_profile'
  )

  if (!row?.payload) {
    const seedProfile = createBusinessProfile(DEFAULT_BUSINESS_PROFILE)
    await saveBusinessProfile(seedProfile)
    return seedProfile
  }

  return normalizeBusinessProfile(JSON.parse(row.payload))
}

export async function saveBusinessProfile(profile) {
  const db = await getDatabase()
  const nextProfile = normalizeBusinessProfile(profile)
  const updatedAt = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO app_settings (key, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    'business_profile',
    JSON.stringify(nextProfile),
    updatedAt
  )

  return nextProfile
}

export async function getThemeMode() {
  const db = await getDatabase()
  const row = await db.getFirstAsync(
    'SELECT payload FROM app_settings WHERE key = ?',
    THEME_MODE_SETTING_KEY
  )

  if (!row?.payload) {
    return DEFAULT_THEME_MODE
  }

  return normalizeThemeMode(JSON.parse(row.payload))
}

export async function saveThemeMode(themeMode) {
  const db = await getDatabase()
  const nextThemeMode = normalizeThemeMode(themeMode)
  const updatedAt = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO app_settings (key, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    THEME_MODE_SETTING_KEY,
    JSON.stringify(nextThemeMode),
    updatedAt
  )

  return nextThemeMode
}

function hasCustomerContent(customer) {
  return [
    customer?.name,
    customer?.address,
    customer?.gstin,
    customer?.phone,
    customer?.email,
    customer?.placeOfSupply,
    customer?.notes,
  ].some((value) => Boolean(String(value || '').trim()))
}

function normalizeCustomer(customer) {
  const now = new Date().toISOString()
  const baseCustomer = createCustomer()

  return {
    ...baseCustomer,
    ...customer,
    id: customer?.id || baseCustomer.id,
    phone: normalizeIndianPhoneNumber(customer?.phone),
    createdAt: customer?.createdAt || now,
    updatedAt: now,
  }
}

function normalizeBill(bill) {
  const now = new Date().toISOString()
  const baseBill = createBill()

  return {
    ...baseBill,
    ...bill,
    id: bill?.id || baseBill.id,
    customerId: bill?.customerId || null,
    companyPhone: normalizeIndianPhoneNumber(bill?.companyPhone),
    customerPhone: normalizeIndianPhoneNumber(bill?.customerPhone),
    items: Array.isArray(bill?.items) ? bill.items : [],
    createdAt: bill?.createdAt || now,
    updatedAt: now,
  }
}

function reviveCustomer(payload) {
  const parsed = JSON.parse(payload)
  return normalizeStoredCustomer(parsed)
}

function reviveBill(payload) {
  const parsed = JSON.parse(payload)
  return normalizeStoredBill(parsed)
}

function normalizeStoredCustomer(customer) {
  const baseCustomer = createCustomer()

  return {
    ...baseCustomer,
    ...customer,
    phone: normalizeIndianPhoneNumber(customer?.phone),
  }
}

function normalizeStoredBill(bill) {
  const baseBill = createBill()

  return {
    ...baseBill,
    ...bill,
    companyPhone: normalizeIndianPhoneNumber(bill?.companyPhone),
    customerPhone: normalizeIndianPhoneNumber(bill?.customerPhone),
    items:
      Array.isArray(bill?.items) && bill.items.length > 0
        ? bill.items.map((item) => ({ ...createItem(), ...item, id: item.id || createItem().id }))
        : [],
  }
}

function normalizeBusinessProfile(profile) {
  return {
    ...createBusinessProfile(),
    ...profile,
    companyPhone: normalizeIndianPhoneNumber(profile?.companyPhone),
    companyState: profile?.companyState || profile?.CompanyState || '',
  }
}

function normalizeThemeMode(themeMode) {
  return themeMode === 'dark' ? 'dark' : DEFAULT_THEME_MODE
}
