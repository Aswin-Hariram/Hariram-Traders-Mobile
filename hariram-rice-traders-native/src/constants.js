import { addDays, formatDateInput, formatInvoiceNumberDate, makeId } from './utils'

export const BAG_TYPE_OPTIONS = ['5 KG', '10 KG', '25 KG', '26 KG', '50 KG', '100 KG']

export const BUSINESS_PROFILE_TEMPLATE = {
  companyName: '',
  companyTagline: '',
  companyAddress: '',
  companyGstin: '',
  companyPhone: '',
  companyEmail: '',
  companyBank: '',
  companyAccountName: '',
  companyAccount: '',
  companyAccountType: '',
  companyIfsc: '',
  companyBranch: '',
  companyState: '',
  companyWebsite: '',
}

export function createBusinessProfile(overrides = {}) {
  return {
    ...BUSINESS_PROFILE_TEMPLATE,
    ...overrides,
  }
}

export function createItem(overrides = {}) {
  return {
    id: makeId(),
    description: '',
    bagType: '',
    hsn: '',
    quantity: '',
    unit: '',
    rate: '',
    gstRate: '',
    ...overrides,
  }
}

export function createCustomer(overrides = {}) {
  return {
    id: makeId(),
    name: '',
    address: '',
    gstin: '',
    phone: '',
    email: '',
    placeOfSupply: '',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export function mapCustomerToInvoiceFields(customer) {
  if (!customer) {
    return {}
  }

  return {
    customerId: customer.id,
    customerName: customer.name || '',
    customerAddress: customer.address || '',
    customerGstin: customer.gstin || '',
    customerPhone: customer.phone || '',
    customerEmail: customer.email || '',
    placeOfSupply: customer.placeOfSupply || '',
  }
}

export function createBill(overrides = {}) {
  const today = new Date()
  const invoiceDate = overrides.invoiceDate || formatDateInput(today)

  return {
    id: makeId(),
    customerId: null,
    ...BUSINESS_PROFILE_TEMPLATE,
    customerName: '',
    customerAddress: '',
    customerGstin: '',
    customerPhone: '',
    customerEmail: '',
    placeOfSupply: '',
    invoiceNumber: `INV-${formatInvoiceNumberDate(invoiceDate)}-001`,
    invoiceDate,
    dueDate: formatDateInput(addDays(today, 7)),
    vehicleNumber: '',
    notes: '',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export const getDefaultState = () => createBill()
