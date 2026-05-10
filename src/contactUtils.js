import { normalizeIndianPhoneNumber } from './utils'

function getContactName(contact) {
  const fullName = String(contact?.name || '').trim()

  if (fullName) {
    return fullName
  }

  return [contact?.firstName, contact?.lastName].filter(Boolean).join(' ').trim()
}

function getContactPhone(contact) {
  const phoneNumbers = Array.isArray(contact?.phoneNumbers) ? contact.phoneNumbers : []
  const preferredPhone =
    phoneNumbers.find((entry) => entry?.isPrimary && (entry.number || entry.digits)) ||
    phoneNumbers.find(
      (entry) => /mobile|iphone|main/i.test(String(entry?.label || '')) && (entry.number || entry.digits)
    ) ||
    phoneNumbers.find((entry) => entry?.number || entry?.digits)

  return normalizeIndianPhoneNumber(preferredPhone?.number || preferredPhone?.digits)
}

function getContactEmail(contact) {
  const emails = Array.isArray(contact?.emails) ? contact.emails : []
  const preferredEmail = emails.find((entry) => entry?.isPrimary && entry.email) || emails.find((entry) => entry?.email)

  return String(preferredEmail?.email || '').trim()
}

function getContactAddress(contact) {
  const addresses = Array.isArray(contact?.addresses) ? contact.addresses : []
  const preferredAddress = addresses.find((entry) =>
    [entry?.street, entry?.city, entry?.region, entry?.postalCode, entry?.country].some(Boolean)
  )

  if (!preferredAddress) {
    return ''
  }

  return [
    preferredAddress.street,
    preferredAddress.city,
    preferredAddress.region,
    preferredAddress.postalCode,
    preferredAddress.country,
  ]
    .filter(Boolean)
    .join(', ')
}

function getContactPlaceOfSupply(contact) {
  const addresses = Array.isArray(contact?.addresses) ? contact.addresses : []
  const preferredAddress = addresses.find((entry) => entry?.region || entry?.city || entry?.country)

  if (!preferredAddress) {
    return ''
  }

  return preferredAddress.region || preferredAddress.city || preferredAddress.country || ''
}

export function extractCustomerFromContact(contact) {
  return {
    name: getContactName(contact),
    phone: getContactPhone(contact),
    email: getContactEmail(contact),
    address: getContactAddress(contact),
    placeOfSupply: getContactPlaceOfSupply(contact),
  }
}

export function extractBusinessContactFields(contact) {
  return {
    companyPhone: getContactPhone(contact),
    companyEmail: getContactEmail(contact),
  }
}
