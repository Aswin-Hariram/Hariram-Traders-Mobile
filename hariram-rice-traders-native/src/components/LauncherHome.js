import React, { useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'

import { BillCard } from './BillCard'
import { CustomerCard } from './CustomerCard'

import { calculateSummary, formatCurrency } from '../utils'
import {
  ActionButton,
  FieldGrid,
  LabeledDateInput,
  LabeledInput,
  PanelHeader,
  THEME,
  compactPanelStyle,
  eyebrowStyle,
  heroCopyStyle,
  panelStyle,
} from './InvoiceComponents'

const TAB_ITEMS = [
  { key: 'bills', label: 'Bills', icon: { family: Ionicons, name: 'receipt-outline' } },
  { key: 'customers', label: 'Customers', icon: { family: Feather, name: 'users' } },
  { key: 'settings', label: 'Settings', icon: { family: Ionicons, name: 'settings-outline' } },
]


const SETTINGS_SECTION_DEFINITIONS = {
  identity: {
    title: 'Billing identity',
    kicker: 'Invoices',
    subtitle: 'Control the owner, GST and location details printed across billing flows.',
    icon: 'briefcase',
    fields: [
      { key: 'companyAccountName', label: 'Owner name' },
      { key: 'companyGstin', label: 'GST' },
      { key: 'companyTagline', label: 'Business line' },
      { key: 'companyState', label: 'State' },
      { key: 'companyAddress', label: 'Location', multiline: true, fullWidth: true },
    ],
  },
  contact: {
    title: 'Contact channels',
    kicker: 'Reachability',
    subtitle: 'Update the phone and email buyers should use when they need your team.',
    icon: 'phone',
    fields: [
      { key: 'companyPhone', label: 'Phone', keyboardType: 'phone-pad', fixedPrefix: '+91', placeholder: '9XXXXXXXXX' },
      { key: 'companyEmail', label: 'Email', keyboardType: 'email-address', fullWidth: true },
    ],
  },
  banking: {
    title: 'Banking setup',
    kicker: 'Payments',
    subtitle: 'Keep beneficiary and bank settlement details ready for invoice exports.',
    icon: 'credit-card',
    fields: [
      { key: 'companyBank', label: 'Bank' },
      { key: 'companyAccountName', label: 'Account name' },
      { key: 'companyAccount', label: 'Account no.' },
      { key: 'companyAccountType', label: 'Account type' },
      { key: 'companyIfsc', label: 'IFSC' },
      { key: 'companyBranch', label: 'Branch', fullWidth: true },
    ],
  }
}

const LIGHT_AVATAR_COLORS = [
  { backgroundColor: '#1f5a47', color: '#a8f0cf' },
  { backgroundColor: '#2f7b67', color: '#dcfff1' },
  { backgroundColor: '#3f9478', color: '#ebfff6' },
  { backgroundColor: '#4aa685', color: '#f4fffb' },
  { backgroundColor: '#245f4c', color: '#cbf5e2' },
]

const DARK_AVATAR_COLORS = [
  { backgroundColor: '#18181b', color: '#fafafa' },
  { backgroundColor: '#27272a', color: '#f4f4f5' },
  { backgroundColor: '#1f2937', color: '#f9fafb' },
  { backgroundColor: '#111827', color: '#e5e7eb' },
  { backgroundColor: '#202024', color: '#ffffff' },
]

export function BillsHomeTab({
  bills,
  lightMode,
  onCreateBill,
  onEditBill,
  onShareBill,
  onShareBills,
  onDownloadBill,
  onDeleteBill,
}) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('date-desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [openBillMenuId, setOpenBillMenuId] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedBillIds, setSelectedBillIds] = useState([])
  const [filterDraft, setFilterDraft] = useState({
    sortOrder: 'date-desc',
    dateFrom: '',
    dateTo: '',
  })
  const billsWithStatus = useMemo(
    () =>
      bills.map((bill) => {
        const summary = calculateSummary(bill.items)

        return {
          ...bill,
          grandTotal: summary.grandTotal,
          itemCount: bill.items.length,
          uiStatus: getBillUiStatus(bill, summary.grandTotal),
        }
      }),
    [bills]
  )

  const visibleBills = useMemo(
    () =>
      billsWithStatus
        .filter(
          (bill) =>
            matchesBillFilter(bill, filterStatus) &&
            matchesBillDateRange(bill, dateFrom, dateTo) &&
            matchesSearchQuery(
              [bill.customerName, bill.invoiceNumber, bill.placeOfSupply, bill.vehicleNumber],
              searchQuery
            )
        )
        .sort((left, right) => compareBillsByDate(left, right, sortOrder)),
    [billsWithStatus, dateFrom, dateTo, filterStatus, searchQuery, sortOrder]
  )
  const selectedBills = useMemo(
    () => billsWithStatus.filter((bill) => selectedBillIds.includes(bill.id)),
    [billsWithStatus, selectedBillIds]
  )
  const billFilterSummary = getBillFilterSummary({ sortOrder, dateFrom, dateTo, filterStatus })
  const selectableBillIds = visibleBills.map((bill) => bill.id)
  const allVisibleBillsSelected = selectableBillIds.length > 0 && selectableBillIds.every((billId) => selectedBillIds.includes(billId))

  function openBillFilters() {
    setFilterDraft({
      sortOrder,
      dateFrom,
      dateTo,
    })
    setIsFilterSheetOpen(true)
  }

  function updateFilterDraft(field, value) {
    setFilterDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function applyBillFilters() {
    const nextDateFrom = String(filterDraft.dateFrom || '').trim()
    const nextDateTo = String(filterDraft.dateTo || '').trim()

    if (nextDateFrom && !isValidIsoDate(nextDateFrom)) {
      Alert.alert('Invalid start date', 'Use the format YYYY-MM-DD for the start date.')
      return
    }

    if (nextDateTo && !isValidIsoDate(nextDateTo)) {
      Alert.alert('Invalid end date', 'Use the format YYYY-MM-DD for the end date.')
      return
    }

    if (nextDateFrom && nextDateTo && getDateValue(nextDateFrom) > getDateValue(nextDateTo)) {
      Alert.alert('Invalid date range', 'The start date should be before the end date.')
      return
    }

    setDateFrom(nextDateFrom)
    setDateTo(nextDateTo)
    setSortOrder(filterDraft.sortOrder)
    setIsFilterSheetOpen(false)
  }

  function clearBillFilters() {
    setFilterDraft({
      sortOrder: 'date-desc',
      dateFrom: '',
      dateTo: '',
    })
  }

  function toggleBillMenu(billId) {
    setOpenBillMenuId((current) => (current === billId ? null : billId))
  }

  function beginSelectionWithBill(billId) {
    setOpenBillMenuId(null)
    setSelectionMode(true)
    setSelectedBillIds([billId])
  }

  function exitSelectionMode() {
    setOpenBillMenuId(null)
    setSelectionMode(false)
    setSelectedBillIds([])
  }

  function toggleBillSelection(billId) {
    setSelectedBillIds((current) =>
      current.includes(billId) ? current.filter((selectedId) => selectedId !== billId) : [...current, billId]
    )
  }

  function toggleSelectAllBills() {
    if (!selectableBillIds.length) {
      return
    }

    setSelectedBillIds((current) => {
      if (allVisibleBillsSelected) {
        return current.filter((billId) => !selectableBillIds.includes(billId))
      }

      const nextSelection = new Set(current)
      selectableBillIds.forEach((billId) => nextSelection.add(billId))
      return Array.from(nextSelection)
    })
  }

  async function handleShareSelectedBills() {
    if (!selectedBills.length) {
      Alert.alert('Select bills first', 'Choose at least one bill to share a combined PDF.')
      return
    }

    const shared = await onShareBills?.(selectedBills)

    if (shared) {
      exitSelectionMode()
    }
  }

  return (
    <View style={screenStackStyle}>
      {selectionMode ? (
        <SelectionHeader
          lightMode={lightMode}
          selectedCount={selectedBillIds.length}
          allSelected={allVisibleBillsSelected}
          hasVisibleBills={!!selectableBillIds.length}
          onClose={exitSelectionMode}
          onToggleSelectAll={toggleSelectAllBills}
          onShare={handleShareSelectedBills}
        />
      ) : (
        <DarkHeader
          title="Bills"
          primaryIcon={null}
          lightMode={lightMode}
          secondaryIcon="filter"
          onSecondary={openBillFilters}
        />
      )}
      <View style={{ width: '100%', height: 1, backgroundColor: lightMode ? THEME.border : THEME.darkBorder }} />
      {selectionMode ? null : (
        <SearchField
          lightMode={lightMode}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by customer, invoice no. or place"
        />
      )}

      <View style={listHeaderStyle}>
        <Text style={listHeaderCountStyle(lightMode)}>
          Showing {visibleBills.length} of {billsWithStatus.length} bills
        </Text>
        <Text style={listHeaderSortStyle(lightMode)}>{billFilterSummary}</Text>
      </View>

      <View style={recordsWrapStyle}>
        {visibleBills.length ? (
          visibleBills.map((bill, index) => (
            <BillCard
              key={bill.id}
              bill={bill}
              color={getAvatarTone(index, lightMode)}
              lightMode={lightMode}
              selectionMode={selectionMode}
              selected={selectedBillIds.includes(bill.id)}
              menuOpen={openBillMenuId === bill.id}
              onOpen={() => {
                if (selectionMode) {
                  toggleBillSelection(bill.id)
                  return
                }

                onEditBill(bill)
              }}
              onLongPress={() => {
                if (selectionMode) {
                  toggleBillSelection(bill.id)
                  return
                }

                beginSelectionWithBill(bill.id)
              }}
              onToggleSelect={() => toggleBillSelection(bill.id)}
              onOpenMenu={() => toggleBillMenu(bill.id)}
              onEditAction={() => {
                setOpenBillMenuId(null)
                onEditBill(bill)
              }}
              onShareAction={() => {
                setOpenBillMenuId(null)
                onShareBill(bill)
              }}
              onDownloadAction={() => {
                setOpenBillMenuId(null)
                onDownloadBill(bill)
              }}
              onDelete={() => onDeleteBill(bill)}
            />
          ))
        ) : (
          <EmptyLedgerState
            title="No bills found"
            body="Try another filter or create a new bill."
            actionLabel="Create bill"
            onAction={onCreateBill}
            lightMode={lightMode}
          />
        )}
      </View>

      <BillsFilterSheet
        visible={isFilterSheetOpen}
        lightMode={lightMode}
        filterDraft={filterDraft}
        onClose={() => setIsFilterSheetOpen(false)}
        onFieldChange={updateFilterDraft}
        onApply={applyBillFilters}
        onClear={clearBillFilters}
      />
    </View>
  )
}

export function CustomersHomeTab({
  customers,
  lightMode,
  onCreateCustomer,
  onEditCustomer,
  onCreateBillForCustomer,
  onDeleteCustomer,
}) {
  const [filterKey, setFilterKey] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const visibleCustomers = customers.filter(
    (customer) =>
      matchesCustomerFilter(customer, filterKey) &&
      matchesSearchQuery([customer.name, customer.phone, customer.placeOfSupply, customer.gstin], searchQuery)
  )

  return (
    <View style={screenStackStyle}>
      <DarkHeader title="Customers" primaryIcon={null} lightMode={lightMode} />
      <View style={{ width: '100%', height: 1, backgroundColor: lightMode ? THEME.border : THEME.darkBorder }} />


      <SearchField
        lightMode={lightMode}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, phone, GSTIN or place"
      />



      <View style={listHeaderStyle}>
        <Text style={listHeaderCountStyle(lightMode)}>
          Showing {visibleCustomers.length} of {customers.length} customers
        </Text>
      </View>

      <View style={recordsWrapStyle}>
        {visibleCustomers.length ? (
          visibleCustomers.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              color={getAvatarTone(index, lightMode)}
              lightMode={lightMode}
              onOpen={() => onEditCustomer(customer)}
              onCreateBill={() => onCreateBillForCustomer(customer)}
              onDelete={() => onDeleteCustomer(customer)}
            />
          ))
        ) : (
          <EmptyLedgerState
            title="No contacts found"
            body="Try another filter or add a new customer."
            actionLabel="Add customer"
            onAction={onCreateCustomer}
            lightMode={lightMode}
          />
        )}
      </View>
    </View>
  )
}

export function SettingsHomeTab({
  profile,
  bills,
  customers,
  themeMode,
  lightMode,
  onToggleTheme,
  isCompact,
  isTablet,
  onSaveProfile,
  onPickContact,
}) {
  const [activeSettingsSectionKey, setActiveSettingsSectionKey] = useState(null)
  const [settingsDraft, setSettingsDraft] = useState(null)
  const [isSavingSection, setIsSavingSection] = useState(false)
  const revenue = bills.reduce((total, bill) => total + calculateSummary(bill.items).grandTotal, 0)
  const businessLine = profile.companyTagline || 'Rice trading operations'
  const stateName = getProfileState(profile)
  const setupScore = getSetupScore(profile)
  const readyCustomers = customers.filter((customer) => Boolean(String(customer.name || '').trim() && String(customer.placeOfSupply || '').trim())).length
  const activeSettingsSection = activeSettingsSectionKey ? SETTINGS_SECTION_DEFINITIONS[activeSettingsSectionKey] : null
  const settingsMetrics = [
    { label: 'Revenue tracked', value: formatCompactMoney(revenue), tone: 'primary', icon: 'trending-up' },
    { label: 'Bills issued', value: String(bills.length), tone: 'neutral', icon: 'file-text' },
    { label: 'Ready customers', value: `${readyCustomers}/${customers.length || 0}`, tone: 'neutral', icon: 'users' },
    { label: 'Setup score', value: `${setupScore}%`, tone: 'primary', icon: 'check-circle' },
  ]
  const identityRows = [
    { label: 'Owner name', value: profile.companyAccountName || profile.companyName || 'Add owner name' },
    { label: 'GST', value: profile.companyGstin || 'Add GST to activate billing identity' },
    { label: 'Business line', value: profile.companyTagline || 'Describe what this business sells' },
    { label: 'Location', value: profile.companyAddress || 'Add business location' },
    { label: 'State', value: profile.companyState || stateName || 'Add state information' },
  ]
  const contactRows = [
    { label: 'Phone', value: profile.companyPhone || 'Add a support number' },
    { label: 'Email', value: profile.companyEmail || 'Add a billing email' },
  ]
  const bankingRows = [
    { label: 'Bank', value: profile.companyBank || 'Add bank name' },
    { label: 'Account name', value: profile.companyAccountName || 'Add beneficiary name' },
    { label: 'Account number', value: profile.companyAccount || 'Add account number' },
    { label: 'Account type', value: profile.companyAccountType || 'Add account type' },
    { label: 'IFSC', value: profile.companyIfsc || 'Add IFSC code' },
    { label: 'Branch', value: profile.companyBranch || 'Add branch information' },
  ]
  const setupRows = [
    { label: 'Business name', value: profile.companyName || 'Add business name' },
    { label: 'Branch', value: profile.companyBranch || 'Add branch information' },
    { label: 'Account type', value: profile.companyAccountType || 'Add account type' },
    { label: 'Website', value: profile.companyWebsite || 'Add business website' },
  ]

  function openSettingsSection(sectionKey) {
    setSettingsDraft({ ...profile })
    setActiveSettingsSectionKey(sectionKey)
  }

  function closeSettingsSection() {
    if (isSavingSection) {
      return
    }

    setActiveSettingsSectionKey(null)
    setSettingsDraft(null)
  }

  function updateSettingsDraftField(field, value) {
    setSettingsDraft((current) => ({
      ...(current || profile),
      [field]: value,
    }))
  }

  async function importContactIntoDraft() {
    if (!onPickContact) {
      return
    }

    const nextContactFields = await onPickContact()

    if (!nextContactFields) {
      return
    }

    setSettingsDraft((current) => ({
      ...(current || profile),
      ...nextContactFields,
    }))
  }

  async function saveActiveSettingsSection() {
    if (!settingsDraft) {
      return
    }

    setIsSavingSection(true)

    try {
      await onSaveProfile(settingsDraft, true)
      setActiveSettingsSectionKey(null)
      setSettingsDraft(null)
    } finally {
      setIsSavingSection(false)
    }
  }

  return (
    <View style={settingsScreenStyle(lightMode)}>
      <View style={settingsHeroCardStyle(lightMode)}>
        <View pointerEvents="none" style={settingsHeroGlowStyle(lightMode)} />
        <View pointerEvents="none" style={settingsHeroGridStyle}>
          {Array.from({ length: 18 }).map((_, index) => (
            <View key={index} style={settingsHeroDotStyle(index, lightMode)} />
          ))}
        </View>
        <View style={settingsHeroTopRowStyle(isCompact)}>
          <View style={settingsHeroIdentityWrapStyle}>
            <View style={settingsHeroAvatarStyle(lightMode)}>
              <Text style={settingsHeroAvatarTextStyle}>{getInitials(profile.companyName || 'Business')}</Text>
            </View>
            <View style={settingsHeroCopyWrapStyle}>
              <Text style={settingsStudioEyebrowStyle(lightMode)}>Operations Studio</Text>
              <Text style={settingsHeroTitleStyle(lightMode)}>{profile.companyName || 'Business profile'}</Text>
              <Text style={settingsHeroSubtitleStyle(lightMode)}>{businessLine}</Text>
            </View>
          </View>

        </View>
      </View>

      <View style={settingsCardGridStyle(isCompact)}>
        <SettingsDetailCard title="Billing identity" icon="briefcase" rows={identityRows} lightMode={lightMode} onEdit={() => openSettingsSection('identity')} />
        <SettingsDetailCard title="Contact channels" icon="phone" rows={contactRows} lightMode={lightMode} onEdit={() => openSettingsSection('contact')} />
        <SettingsDetailCard title="Banking setup" icon="credit-card" rows={bankingRows} lightMode={lightMode} onEdit={() => openSettingsSection('banking')} />

      </View>

      <View style={settingsFooterCardStyle(lightMode)}>
        <View style={settingsFooterTopRowStyle}>
          <View style={settingsFooterCopyStyle}>
            <Text style={settingsFooterTitleStyle(lightMode)}>Control room</Text>
            <Text style={settingsFooterBodyStyle(lightMode)}>
              Make the business profile operational before sharing invoices or exporting records.
            </Text>
          </View>
        </View>
        <View style={settingsFooterActionListStyle}>
          <SettingsListAction
            title={themeMode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            subtitle={`Current theme: ${themeMode}`}
            icon="sliders"
            lightMode={lightMode}
            onPress={onToggleTheme}
          />
          <SettingsListAction
            title="Log out"
            subtitle="Sign out from this device"
            icon="log-out"
            lightMode={lightMode}
            onPress={() => Alert.alert('Log out', 'Sign out flow can be connected here next.')}
          />
          <SettingsListAction
            title="Delete account"
            subtitle="Permanently remove all data"
            icon="trash-2"
            destructive
            lightMode={lightMode}
            onPress={() => Alert.alert('Delete account', 'Account deletion can be connected here next.')}
          />
        </View>
      </View>

      <SettingsSectionSheet
        visible={Boolean(activeSettingsSection && settingsDraft)}
        section={activeSettingsSection}
        draft={settingsDraft}
        isCompact={isCompact}
        isTablet={isTablet}
        lightMode={lightMode}
        isSaving={isSavingSection}
        showContactImport={activeSettingsSectionKey === 'contact'}
        onFieldChange={updateSettingsDraftField}
        onClose={closeSettingsSection}
        onPickContact={importContactIntoDraft}
        onSave={saveActiveSettingsSection}
      />
    </View>
  )
}

export function ScreenHeader({
  kicker,
  title,
  subtitle,
  actionLabel,
  onAction,
  onBack,
  isCompact,
  isWide,
  lightMode = true,
}) {
  return (
    <View style={screenHeaderToolbarStyle}>
      <View style={screenHeaderTopRowStyle(isWide, isCompact)}>
        <View style={screenHeaderTitleWrapStyle}>
          <BackArrowButton onPress={onBack} lightMode={lightMode} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={screenHeaderTitleStyle(isWide, isCompact, lightMode)}>Build the sales invoice</Text>
          </View>
        </View>


      </View>

    </View>
  )
}

export function LedgerBottomNav({ activeTab, onTabChange, lightMode }) {
  return (
    <View style={[bottomNavShellStyle, lightMode && bottomNavShellLightStyle]}>
      <View pointerEvents="none" style={[bottomNavShellGlowStyle, lightMode && bottomNavShellGlowLightStyle]} />
      <View pointerEvents="none" style={[bottomNavShellHighlightStyle, lightMode && bottomNavShellHighlightLightStyle]} />
      <View style={bottomNavTrackStyle}>
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon.family
          const active = activeTab === item.key

          return (
            <Pressable
              key={item.key}
              onPress={() => {
                if (!item.disabled) {
                  onTabChange(item.key)
                }
              }}
              style={({ pressed }) => [
                bottomNavItemStyle,
                active && (lightMode ? bottomNavItemActiveLightStyle : bottomNavItemActiveStyle),
                item.disabled && { opacity: 0.58 },
                pressed && !item.disabled && { opacity: 0.9, transform: [{ scale: 0.985 }] },
              ]}
            >
              <View style={[bottomNavIconWrapStyle, active && (lightMode ? bottomNavIconWrapActiveLightStyle : bottomNavIconWrapActiveStyle)]}>
                <Icon
                  name={item.icon.name}
                  size={22}
                  color={active ? (lightMode ? '#44a383' : '#fafafa') : lightMode ? '#6b7184' : '#a1a1aa'}
                />
              </View>
              <Text style={[bottomNavLabelStyle, active && (lightMode ? bottomNavLabelActiveLightStyle : bottomNavLabelActiveStyle)]}>
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function FloatingPrimaryAction({ label, iconName = 'plus', onPress, lightMode }) {
  return (
    <View pointerEvents="box-none" style={floatingPrimaryActionWrapStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          floatingPrimaryActionStyle(lightMode),
          pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] },
        ]}
      >
        <View style={floatingPrimaryActionIconStyle(lightMode)}>
          <Feather name={iconName} size={18} color={lightMode ? '#ffffff' : '#09090b'} />
        </View>
        <Text style={floatingPrimaryActionLabelStyle(lightMode)}>{label}</Text>
      </Pressable>
    </View>
  )
}

export function bottomNavWrapStyle(isCompact) {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: isCompact ? 18 : 18,
    paddingBottom: isCompact ? 18 : 22,
    paddingTop: 12,
  }
}

const floatingPrimaryActionWrapStyle = {
  alignItems: 'center',
  marginBottom: 14,
}

function floatingPrimaryActionStyle(lightMode) {
  return {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    paddingRight: 20,
    borderRadius: 999,
    backgroundColor: lightMode ? '#1f8d67' : '#f4f4f5',
    borderWidth: 1,
    borderColor: lightMode ? '#2fa17a' : '#d4d4d8',
    shadowColor: '#000000',
    shadowOpacity: lightMode ? 0.16 : 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  }
}

function floatingPrimaryActionIconStyle(lightMode) {
  return {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(9, 9, 11, 0.08)',
  }
}

function floatingPrimaryActionLabelStyle(lightMode) {
  return {
    color: lightMode ? '#ffffff' : '#09090b',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  }
}

function ProfileTopBar({ title, actionLabel, onAction }) {
  return (
    <View style={profileTopBarStyle}>
      <View style={profileTopBarLeftStyle}>
        <View style={profileTopBarIconWrapStyle}>
          <Feather name="user" size={24} color={THEME.ink} />
        </View>
        <Text style={profileTopBarTitleStyle}>{title}</Text>
      </View>

      <Pressable onPress={onAction} style={({ pressed }) => [profileTopBarButtonStyle, pressed && { opacity: 0.86 }]}>
        <Text style={profileTopBarButtonTextStyle}>{actionLabel}</Text>
      </Pressable>
    </View>
  )
}

function DarkHeader({
  title,
  onPrimary,
  primaryIcon = 'plus',
  lightMode,
  secondaryIcon = 'download',
  onSecondary,
}) {
  return (
    <View style={headerRowStyle}>
      <Text style={headerTitleStyle(lightMode)}>{title}</Text>
      <View style={headerActionsStyle}>
        <IconButton iconFamily={Feather} iconName="search" lightMode={lightMode} />
        {secondaryIcon ? (
          <IconButton iconFamily={Feather} iconName={secondaryIcon} onPress={onSecondary} lightMode={lightMode} />
        ) : null}
        {primaryIcon ? <IconButton iconFamily={Feather} iconName={primaryIcon} onPress={onPrimary} plain lightMode={lightMode} /> : null}
      </View>
    </View>
  )
}

function SelectionHeader({ lightMode, selectedCount, allSelected, hasVisibleBills, onClose, onToggleSelectAll, onShare }) {
  return (
    <View style={selectionHeaderRowStyle}>
      <View style={selectionHeaderLeadingStyle}>
        <IconButton iconFamily={Feather} iconName="x" onPress={onClose} lightMode={lightMode} />
        <View style={selectionHeaderCopyStyle}>
          <Text style={headerTitleStyle(lightMode)}>{selectedCount} selected</Text>
        </View>
      </View>

      <View style={selectionHeaderActionsStyle}>
        <Pressable
          onPress={onToggleSelectAll}
          disabled={!hasVisibleBills}
          style={({ pressed }) => [
            selectionToolbarPillStyle(lightMode, !hasVisibleBills),
            pressed && hasVisibleBills && { opacity: 0.82 },
          ]}
        >
          <Text style={selectionToolbarPillTextStyle(lightMode, !hasVisibleBills)}>
            {allSelected ? 'Clear all' : 'Select all'}
          </Text>
        </Pressable>
        <IconButton iconFamily={Feather} iconName="share" onPress={onShare} lightMode={lightMode} disabled={!selectedCount} />
      </View>
    </View>
  )
}

function BillsFilterSheet({ visible, lightMode, filterDraft, onClose, onFieldChange, onApply, onClear }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={settingsSheetBackdropStyle}>
        <Pressable style={settingsSheetScrimStyle} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={settingsSheetKeyboardAvoidingStyle}
        >
          <View style={billFilterSheetStyle(lightMode)}>
            <View style={settingsSheetGrabberStyle} />

            <View style={settingsSheetHeaderStyle}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={billFilterSheetTitleStyle(lightMode)}>Filter Bills</Text>
                <Text style={billFilterSheetSubtitleStyle(lightMode)}>
                  Choose a custom date range and sort the bill list by invoice date.
                </Text>
              </View>
              <Pressable onPress={onClose} style={({ pressed }) => [settingsSheetCloseButtonStyle, pressed && { opacity: 0.85 }]}>
                <Text style={settingsSheetCloseButtonTextStyle}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={settingsSheetScrollContentStyle}
            >
              <View style={toolbarCardStyle(lightMode)}>
                <View style={billFilterGroupStyle}>
                  <Text style={billFilterSectionLabelStyle(lightMode)}>Date sort</Text>
                  <FilterChipRow
                    lightMode={lightMode}
                    items={BILL_SORT_OPTIONS}
                    activeKey={filterDraft.sortOrder}
                    onChange={(value) => onFieldChange('sortOrder', value)}
                  />
                </View>

                <View style={billFilterGroupStyle}>
                  <Text style={billFilterSectionLabelStyle(lightMode)}>Custom date range</Text>
                  <View style={billFilterDateGridStyle}>
                    <View style={billFilterDateFieldStyle}>
                      <LabeledDateInput
                        label="From"
                        value={filterDraft.dateFrom}
                        onChangeText={(value) => onFieldChange('dateFrom', value)}
                        placeholder="Start date"
                        fullWidth
                        clearable
                        lightMode={lightMode}
                      />
                    </View>
                    <View style={billFilterDateFieldStyle}>
                      <LabeledDateInput
                        label="To"
                        value={filterDraft.dateTo}
                        onChangeText={(value) => onFieldChange('dateTo', value)}
                        placeholder="End date"
                        fullWidth
                        clearable
                        lightMode={lightMode}
                      />
                    </View>
                  </View>
                </View>

                <View style={billFilterActionRowStyle}>
                  <ActionButton label="Clear" variant="secondary" lightMode={lightMode} onPress={onClear} iconName="rotate-ccw" />
                  <ActionButton label="Apply" variant="primary" onPress={onApply} iconName="sliders" />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

function SearchField({ lightMode, value, onChangeText, placeholder }) {
  return (
    <View style={searchFieldShellStyle(lightMode)}>
      <Feather name="search" size={18} color={lightMode ? THEME.subtle : THEME.darkMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={lightMode ? THEME.subtle : THEME.darkMuted}
        style={searchFieldInputStyle(lightMode)}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} style={({ pressed }) => [clearButtonStyle(lightMode), pressed && { opacity: 0.8 }]}>
          <Feather name="x" size={14} color={lightMode ? THEME.muted : THEME.darkText} />
        </Pressable>
      ) : null}
    </View>
  )
}

function FilterChipRow({ lightMode, items, activeKey, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterRowStyle}>
      {items.map((item) => {
        const active = item.key === activeKey

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              filterChipStyle(lightMode),
              active && filterChipActiveStyle(lightMode),
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={[filterChipTextStyle(lightMode), active && filterChipTextActiveStyle(lightMode)]}>{item.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

function IconButton({ iconFamily: Icon, iconName, onPress, plain, lightMode, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        plain ? headerPlainActionStyle : headerActionStyle(lightMode),
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.82 },
      ]}
    >
      <Icon name={iconName} size={20} color={disabled ? (lightMode ? THEME.subtle : THEME.darkMuted) : lightMode ? '#556077' : '#dfe7f3'} />
    </Pressable>
  )
}

function SettingsHeroSummaryChip({ label, value }) {
  return (
    <View style={settingsHeroSummaryChipStyle}>
      <Text style={settingsHeroSummaryChipLabelStyle}>{label}</Text>
      <Text numberOfLines={1} style={settingsHeroSummaryChipValueStyle}>
        {value}
      </Text>
    </View>
  )
}

function SettingsMetricCard({ metric, isCompact }) {
  return (
    <View style={settingsMetricCardStyle(isCompact, metric.tone)}>
      <View style={settingsMetricIconWrapStyle(metric.tone)}>
        <Feather name={metric.icon} size={18} color={metric.tone === 'primary' ? THEME.accentStrong : THEME.ink} />
      </View>
      <Text style={settingsMetricValueStyle}>{metric.value}</Text>
      <Text style={settingsMetricLabelStyle}>{metric.label}</Text>
    </View>
  )
}

function SettingsActionPill({ icon, label, sublabel, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [settingsActionPillStyle, pressed && { opacity: 0.9 }]}>
      <View style={settingsActionPillIconStyle}>
        <Feather name={icon} size={17} color={THEME.accentStrong} />
      </View>
      <View style={settingsActionPillCopyStyle}>
        <Text style={settingsActionPillLabelStyle}>{label}</Text>
        <Text style={settingsActionPillSubLabelStyle}>{sublabel}</Text>
      </View>
    </Pressable>
  )
}

function SettingsDetailCard({ title, icon, rows, lightMode, onEdit }) {
  return (
    <View style={settingsDetailCardStyle(lightMode)}>
      <View style={settingsDetailCardHeaderStyle}>
        <View style={settingsDetailCardHeaderLeftStyle}>
          <View style={settingsDetailCardIconStyle(lightMode)}>
            <Feather name={icon} size={18} color={lightMode ? THEME.accentStrong : THEME.darkAccent} />
          </View>
          <Text style={settingsDetailCardTitleStyle(lightMode)}>{title}</Text>
        </View>
        <Pressable onPress={onEdit} style={({ pressed }) => [settingsDetailCardEditStyle(lightMode), pressed && { opacity: 0.86 }]}>
          <Text style={settingsDetailCardEditTextStyle(lightMode)}>Edit</Text>
        </Pressable>
      </View>
      <View style={settingsDetailRowsStyle}>
        {rows.map((row) => (
          <View key={`${title}-${row.label}`} style={settingsDetailRowStyle(lightMode)}>
            <Text style={settingsDetailLabelStyle(lightMode)}>{row.label}</Text>
            <Text style={settingsDetailValueStyle(lightMode)}>{row.value || '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function SettingsSectionSheet({
  visible,
  section,
  draft,
  isCompact,
  isTablet,
  lightMode,
  isSaving,
  showContactImport,
  onFieldChange,
  onClose,
  onPickContact,
  onSave,
}) {
  if (!section || !draft) {
    return null
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={settingsSheetBackdropStyle}>
        <Pressable style={settingsSheetScrimStyle} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={settingsSheetKeyboardAvoidingStyle}
        >
          <View style={settingsSheetStyle(lightMode)}>
            <View style={settingsSheetGrabberStyle(lightMode)} />

            <View style={settingsSheetHeaderStyle}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={settingsSheetTitleStyle(lightMode)}>{section.title}</Text>
                <Text style={settingsSheetSubtitleStyle(lightMode)}>{section.subtitle}</Text>
              </View>
              <Pressable onPress={onClose} style={({ pressed }) => [settingsSheetCloseButtonStyle(lightMode), pressed && { opacity: 0.85 }]}>
                <Text style={settingsSheetCloseButtonTextStyle(lightMode)}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={settingsSheetScrollContentStyle}
            >
              <View style={[panelStyle, settingsSheetPanelStyle(lightMode), isCompact && compactPanelStyle]}>
                <PanelHeader kicker={section.kicker} title={section.title} body={section.subtitle} lightMode={lightMode} />
                <FieldGrid>
                  {section.fields.map((field) => (
                    <LabeledInput
                      key={field.key}
                      label={field.label}
                      value={draft[field.key]}
                      keyboardType={field.keyboardType}
                      placeholder={field.placeholder}
                      multiline={field.multiline}
                      fullWidth={field.fullWidth}
                      fixedPrefix={field.fixedPrefix}
                      trailingActionLabel={
                        showContactImport && field.key === 'companyPhone' && onPickContact ? 'Pick' : undefined
                      }
                      onTrailingActionPress={showContactImport && field.key === 'companyPhone' ? onPickContact : undefined}
                      columns={isTablet ? 2 : 1}
                      lightMode={lightMode}
                      onChangeText={(value) => onFieldChange(field.key, value)}
                    />
                  ))}
                </FieldGrid>
              </View>

              <ActionButton label={isSaving ? 'Saving...' : 'Save Changes'} variant="primary" fullWidth onPress={onSave} disabled={isSaving} iconName="save" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

function SettingsListAction({ title, subtitle, icon, lightMode, destructive = false, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [settingsListActionStyle(lightMode, destructive), pressed && { opacity: 0.9 }]}>
      <View style={settingsListActionIconStyle(lightMode, destructive)}>
        <Feather name={icon} size={18} color={destructive ? THEME.danger : lightMode ? THEME.accentStrong : THEME.darkAccent} />
      </View>
      <View style={settingsListActionCopyStyle}>
        <Text style={settingsListActionTitleStyle(lightMode, destructive)}>{title}</Text>
        <Text style={settingsListActionSubtitleStyle(lightMode)}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={destructive ? THEME.danger : lightMode ? THEME.subtle : THEME.darkMuted} />
    </Pressable>
  )
}

function ProfileStat({ value, label, showDivider }) {
  return (
    <View style={[profileStatCellStyle, !showDivider && profileStatCellLastStyle]}>
      <Text style={profileStatValueStyle}>{value}</Text>
      <Text style={profileStatLabelStyle}>{label}</Text>
    </View>
  )
}

function ProfileInfoSection({ iconFamily: Icon, iconName, iconTint, iconBackground, title, rows, isCompact }) {
  return (
    <View style={profileSectionStyle}>
      <View style={profileSectionHeaderStyle}>
        <View style={[profileSectionIconWrapStyle, { backgroundColor: iconBackground }]}>
          <Icon name={iconName} size={28} color={iconTint} />
        </View>
        <Text style={profileSectionTitleStyle}>{title}</Text>
      </View>

      <View style={profileSectionRowsStyle}>
        {rows.map((row) => (
          <View key={`${title}-${row.label}`} style={profileInfoRowStyle}>
            <Text style={profileInfoLabelStyle}>{row.label}</Text>
            <Text style={[profileInfoValueStyle, row.accent && profileInfoAccentValueStyle]}>
              {row.value || '-'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function ProfileActionSection({ iconFamily: Icon, iconName, iconTint, iconBackground, title, children }) {
  return (
    <View style={profileSectionStyle}>
      <View style={profileSectionHeaderStyle}>
        <View style={[profileSectionIconWrapStyle, { backgroundColor: iconBackground }]}>
          <Icon name={iconName} size={28} color={iconTint} />
        </View>
        <Text style={profileSectionTitleStyle}>{title}</Text>
      </View>

      <View style={actionSectionContentStyle}>
        {children}
      </View>
    </View>
  )
}

function ActionMenuRow({ title, subtitle, destructive, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [actionMenuRowStyle, destructive && actionMenuRowDestructiveStyle, pressed && { opacity: 0.9 }]}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[actionMenuTitleStyle, destructive && actionMenuTitleDestructiveStyle]}>{title}</Text>
        <Text style={actionMenuSubtitleStyle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={24} color={destructive ? '#c45463' : '#7c8398'} />
    </Pressable>
  )
}


function EmptyLedgerState({ title, body, actionLabel, onAction, lightMode }) {
  const actionIconName = actionLabel.toLowerCase().includes('bill')
    ? 'file-plus'
    : actionLabel.toLowerCase().includes('customer')
      ? 'user-plus'
      : 'plus-circle'

  return (
    <View style={emptyStateStyle(lightMode)}>
      <Text style={emptyStateTitleStyle(lightMode)}>{title}</Text>
      <Text style={emptyStateBodyStyle(lightMode)}>{body}</Text>
      <ActionButton label={actionLabel} variant="primary" fullWidth onPress={onAction} iconName={actionIconName} />
    </View>
  )
}

export function BackArrowButton({ onPress, lightMode = true }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 20,
        backgroundColor: lightMode ? '#ffffff' : THEME.darkSurfaceAlt,
        borderWidth: 1,
        borderColor: lightMode ? '#e8e8e8' : THEME.darkBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: lightMode ? 0.08 : 0.22,
        shadowRadius: 6,
        elevation: 3,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Ionicons
        name="arrow-back"
        size={20}
        color={lightMode ? '#111827' : THEME.darkText}

      />
    </Pressable>
  )
}

function matchesBillFilter(bill, filterStatus) {
  if (filterStatus === 'all') {
    return true
  }

  if (filterStatus === 'pending') {
    return bill.uiStatus === 'open' || bill.uiStatus === 'overdue'
  }

  return bill.uiStatus === filterStatus
}

function matchesBillDateRange(bill, dateFrom, dateTo) {
  const billDate = getDateValue(bill.invoiceDate)

  if (!billDate) {
    return !dateFrom && !dateTo
  }

  if (dateFrom && billDate < getDateValue(dateFrom)) {
    return false
  }

  if (dateTo && billDate > getDateValue(dateTo)) {
    return false
  }

  return true
}

function matchesCustomerFilter(customer, filterKey) {
  if (filterKey === 'all') {
    return true
  }

  if (filterKey === 'ready') {
    return Boolean(String(customer.name || '').trim() && String(customer.placeOfSupply || '').trim())
  }

  if (filterKey === 'gstin') {
    return Boolean(String(customer.gstin || '').trim())
  }

  if (filterKey === 'phone') {
    return Boolean(String(customer.phone || '').trim())
  }

  if (filterKey === 'missing') {
    return !String(customer.placeOfSupply || '').trim() || !String(customer.phone || '').trim()
  }

  return true
}

function matchesSearchQuery(values, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
}

function getBillUiStatus(bill, grandTotal) {
  if (bill.status) {
    return String(bill.status).toLowerCase()
  }

  if (!bill.items?.length || grandTotal <= 0) {
    return 'draft'
  }

  if (bill.dueDate) {
    const today = new Date()
    const dueDate = new Date(`${bill.dueDate}T00:00:00`)

    if (!Number.isNaN(dueDate.getTime())) {
      today.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        return 'overdue'
      }
    }
  }

  return 'open'
}

function getInitials(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return '--'
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('')
}

function getAvatarTone(index, lightMode) {
  const palette = lightMode ? LIGHT_AVATAR_COLORS : DARK_AVATAR_COLORS
  return palette[index % palette.length]
}

function getProfileState(profile) {
  if (profile?.companyState) {
    return profile.companyState
  }

  const address = profile?.companyAddress

  if (!address) {
    return '-'
  }

  const stateMatch = String(address).match(/tamil nadu/i)
  if (stateMatch) {
    return 'Tamil Nadu'
  }

  const parts = String(address).split(',').map((part) => part.trim()).filter(Boolean)
  return parts[parts.length - 1] || '-'
}

function getPinFromAddress(address) {
  const match = String(address || '').match(/\b\d{6}\b/)
  return match ? match[0] : '-'
}

function bannerDotStyle(index) {
  const left = 3 + (index % 6) * 16
  const top = 6 + Math.floor(index / 6) * 13

  return {
    position: 'absolute',
    left: `${left}%`,
    top,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(203, 233, 224, 0.22)',
    transform: [{ rotate: index % 2 === 0 ? '12deg' : '-12deg' }],
  }
}

function formatCompactMoney(amount) {
  const absolute = Math.abs(amount || 0)

  if (absolute >= 100000) {
    return `₹${(absolute / 100000).toFixed(2)}L`
  }

  if (absolute >= 1000) {
    return `₹${Math.round(absolute / 1000)}k`
  }

  return `₹${Math.round(absolute)}`
}

function getSetupScore(profile) {
  const checks = [
    profile.companyName,
    profile.companyAddress,
    profile.companyState,
    profile.companyGstin,
    profile.companyPhone,
    profile.companyEmail,
    profile.companyBank,
    profile.companyAccountName,
    profile.companyAccount,
    profile.companyIfsc,
  ]

  const completed = checks.filter((value) => Boolean(String(value || '').trim())).length
  return Math.round((completed / checks.length) * 100)
}

function formatStatusLabel(status) {
  if (status === 'open' || status === 'overdue') {
    return 'Pending'
  }

  if (status === 'draft') {
    return 'Draft'
  }

  return String(status || 'Open').charAt(0).toUpperCase() + String(status || 'Open').slice(1)
}

function getDateValue(value) {
  if (!value) {
    return 0
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function compareBillsByDate(left, right, sortOrder) {
  const leftDate = getDateValue(left.invoiceDate)
  const rightDate = getDateValue(right.invoiceDate)

  if (sortOrder === 'date-asc') {
    return leftDate - rightDate
  }

  return rightDate - leftDate
}

function getBillFilterSummary({ sortOrder, dateFrom, dateTo, filterStatus }) {
  const sortLabel = sortOrder === 'date-asc' ? 'Oldest first' : 'Newest first'
  const statusLabel = filterStatus === 'all' ? 'All' : formatStatusLabel(filterStatus)

  if (dateFrom && dateTo) {
    return `${sortLabel} • ${statusLabel} • ${dateFrom} to ${dateTo}`
  }

  if (dateFrom) {
    return `${sortLabel} • ${statusLabel} • From ${dateFrom}`
  }

  if (dateTo) {
    return `${sortLabel} • ${statusLabel} • Until ${dateTo}`
  }

  return `${sortLabel} • ${statusLabel}`
}

function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && getDateValue(value) > 0
}

function statusBadgeStyle(status) {
  if (status === 'paid') {
    return [pillBaseStyle, { backgroundColor: '#1e6a53' }]
  }

  if (status === 'cancelled') {
    return [pillBaseStyle, { backgroundColor: '#5c1d1d' }]
  }

  if (status === 'draft') {
    return [pillBaseStyle, { backgroundColor: '#4e7f6d' }]
  }

  return [pillBaseStyle, { backgroundColor: '#5b8f79' }]
}

function statusBadgeTextStyle(status) {
  if (status === 'paid') {
    return { color: '#fafafa', fontSize: 10, fontWeight: '700' }
  }

  if (status === 'cancelled') {
    return { color: '#ff8b8b', fontSize: 10, fontWeight: '700' }
  }

  if (status === 'draft') {
    return { color: '#e4e4e7', fontSize: 10, fontWeight: '700' }
  }

  return { color: '#f4f4f5', fontSize: 10, fontWeight: '700' }
}

const screenStackStyle = {
  gap: 16,
}

const screenHeaderToolbarStyle = {
  gap: 10,
  paddingHorizontal: 2,
  paddingVertical: 2,
}

function screenHeaderTopRowStyle(isWide, isCompact) {
  return {
    flexDirection: isWide ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isWide ? 'center' : 'stretch',
    gap: isCompact ? 10 : 12,
  }
}

const screenHeaderTitleWrapStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  flex: 1,
}

function screenHeaderActionWrapStyle(isWide) {
  return {
    width: isWide ? 190 : '100%',
    maxWidth: '100%',
  }
}

function screenHeaderTitleStyle(isWide, isCompact, lightMode = true) {
  return {
    fontSize: isWide ? 25 : isCompact ? 17 : 20,
    lineHeight: isWide ? 25 : isCompact ? 17 : 20,
    color: lightMode ? THEME.ink : THEME.darkText,
    fontWeight: '800',
  }
}

const screenHeaderSubtitleStyle = {
  color: THEME.muted,
  fontSize: 12,
  lineHeight: 18,
  maxWidth: 720,
  paddingLeft: 2,
}

const headerRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 2,
}

const selectionHeaderRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingTop: 2,
  flexWrap: 'wrap',
}

const selectionHeaderLeadingStyle = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  minWidth: 180,
}

const selectionHeaderCopyStyle = {
  flex: 1,
  gap: 3,
}

function headerTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 25,
    lineHeight: 25,
    fontWeight: '600',
  }
}

const headerActionsStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
}

const selectionHeaderActionsStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

function headerActionStyle(lightMode) {
  return {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

const headerPlainActionStyle = {
  width: 45,
  height: 45,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
}

function selectionToolbarPillStyle(lightMode, disabled) {
  return {
    minHeight: 45,
    minWidth: 92,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    opacity: disabled ? 0.5 : 1,
  }
}

function selectionToolbarPillTextStyle(lightMode, disabled) {
  return {
    color: disabled ? (lightMode ? THEME.subtle : THEME.darkMuted) : lightMode ? THEME.ink : THEME.darkText,
    fontSize: 12,
    fontWeight: '700',
  }
}

function toolbarCardStyle(lightMode) {
  return {
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function searchFieldShellStyle(lightMode) {
  return {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurface,
    borderCurve: 'continuous',
  }
}

function searchFieldInputStyle(lightMode) {
  return {
    flex: 1,
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    paddingVertical: 0,
  }
}

function clearButtonStyle(lightMode) {
  return {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
  }
}

const filterRowStyle = {
  gap: 8,
  paddingRight: 2,
}

const BILL_SORT_OPTIONS = [
  { key: 'date-desc', label: 'Newest first' },
  { key: 'date-asc', label: 'Oldest first' },
]

function filterChipStyle(lightMode) {
  return {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function filterChipActiveStyle(lightMode) {
  return {
    backgroundColor: lightMode ? THEME.accentSoft : THEME.darkSurfaceAlt,
    borderColor: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
  }
}

function filterChipTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12,
    fontWeight: '600',
  }
}

function filterChipTextActiveStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
  }
}

const listHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

function listHeaderCountStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  }
}

function listHeaderSortStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  }
}

const recordsWrapStyle = {
  gap: 12,
}

function billFilterSheetStyle(lightMode) {
  return {
    marginTop: 'auto',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: lightMode ? '#ffffff' : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    gap: 16,
  }
}

const billFilterGroupStyle = {
  gap: 10,
}

function billFilterSheetTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 20,
    fontWeight: '800',
  }
}

function billFilterSheetSubtitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12,
    lineHeight: 18,
  }
}

function billFilterSectionLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    fontWeight: '700',
  }
}

const billFilterDateGridStyle = {
  flexDirection: 'row',
  gap: 12,
  flexWrap: 'wrap',
}

const billFilterDateFieldStyle = {
  flex: 1,
  minWidth: 140,
  gap: 6,
}

const billFilterActionRowStyle = {
  flexDirection: 'row',
  gap: 10,
}

const billActionRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
}

const billActionTextStyle = {
  color: THEME.accent,
  fontSize: 10,
  fontWeight: '700',
}

const pillBaseStyle = {
  paddingHorizontal: 12,
  paddingVertical: 5,
  borderRadius: 999,
}

function emptyStateStyle(lightMode) {
  return {
    gap: 12,
    padding: 20,
    borderRadius: 22,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function emptyStateTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 15,
    fontWeight: '700',
  }
}

function emptyStateBodyStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12,
    lineHeight: 17,
  }
}

function settingsScreenStyle(lightMode) {
  return {
    gap: 16,
    paddingBottom: 18,
  }
}

function settingsStudioHeaderStyle(isCompact) {
  return {
    gap: 14,
    flexDirection: isCompact ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isCompact ? 'stretch' : 'flex-start',
  }
}

const settingsStudioHeaderCopyStyle = {
  flex: 1,
  gap: 6,
}

function settingsStudioEyebrowStyle(lightMode) {
  return {
    color: lightMode ? '#f2fff9' : '#dbfff2',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  }
}

const settingsStudioTitleStyle = {
  color: THEME.ink,
  fontSize: 25,
  lineHeight: 30,
  fontWeight: '900',
}

const settingsStudioSubtitleStyle = {
  color: THEME.muted,
  fontSize: 13,
  lineHeight: 19,
  maxWidth: 620,
}

const settingsHeaderButtonStyle = {
  alignSelf: 'flex-start',
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 999,
  backgroundColor: THEME.surfaceMuted,
  borderWidth: 1,
  borderColor: THEME.borderStrong,
}

const settingsHeaderButtonTextStyle = {
  color: THEME.accentStrong,
  fontSize: 13,
  fontWeight: '800',
}

function settingsHeroCardStyle(lightMode) {
  return {
    position: 'relative',
    overflow: 'hidden',
    gap: 18,
    padding: 20,
    borderRadius: 32,
    backgroundColor: lightMode ? THEME.accentStrong : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? 'rgba(255, 255, 255, 0.08)' : THEME.darkBorder,
    boxShadow: lightMode ? '0 22px 50px rgba(26, 94, 69, 0.24)' : '0 22px 50px rgba(0, 0, 0, 0.28)',
  }
}

function settingsHeroGlowStyle(lightMode) {
  return {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: lightMode ? 'rgba(221, 255, 243, 0.16)' : 'rgba(255, 255, 255, 0.06)',
  }
}

const settingsHeroGridStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}

function settingsHeroDotStyle(index, lightMode) {
  const column = index % 6
  const row = Math.floor(index / 6)

  return {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    top: 20 + row * 22,
    right: 18 + column * 18,
    backgroundColor: lightMode ? 'rgba(220, 255, 241, 0.18)' : 'rgba(159, 183, 174, 0.18)',
  }
}

function settingsHeroTopRowStyle(isCompact) {
  return {
    gap: 16,
    flexDirection: isCompact ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isCompact ? 'stretch' : 'flex-start',
  }
}

const settingsHeroIdentityWrapStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
  flex: 1,
}

function settingsHeroAvatarStyle(lightMode) {
  return {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: lightMode ? 'rgba(222, 255, 244, 0.16)' : 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: lightMode ? 'rgba(230, 255, 247, 0.22)' : 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

const settingsHeroAvatarTextStyle = {
  color: '#ffffff',
  fontSize: 24,
  fontWeight: '900',
  letterSpacing: 1,
}

const settingsHeroCopyWrapStyle = {
  flex: 1,
  gap: 4,
}

function settingsHeroTitleStyle(lightMode) {
  return {
    color: '#ffffff',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
  }
}

function settingsHeroSubtitleStyle(lightMode) {
  return {
    color: lightMode ? 'rgba(235, 255, 247, 0.8)' : 'rgba(238, 248, 243, 0.72)',
    fontSize: 13,
    lineHeight: 19,
  }
}

const settingsHeroActionStyle = {
  alignSelf: 'flex-start',
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 999,
  backgroundColor: '#ffffff',
}

const settingsHeroActionTextStyle = {
  color: THEME.accentStrong,
  fontSize: 13,
  fontWeight: '800',
}

const settingsHeroBadgeRowStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
}

const settingsHeroBadgeStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 999,
  backgroundColor: 'rgba(255, 255, 255, 0.09)',
  borderWidth: 1,
  borderColor: 'rgba(225, 255, 244, 0.14)',
}

const settingsHeroBadgeTextStyle = {
  color: '#f1fff8',
  fontSize: 11,
  fontWeight: '700',
}

function settingsHeroSummaryRowStyle(isCompact) {
  return {
    flexDirection: isCompact ? 'row' : 'row',
    flexWrap: 'wrap',

    gap: 10,
  }
}

const settingsHeroSummaryChipStyle = {
  flex: 1,
  minWidth: 0,
  gap: 4,
  padding: 14,
  borderRadius: 18,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderWidth: 1,
  borderColor: 'rgba(225, 255, 244, 0.12)',
}

const settingsHeroSummaryChipLabelStyle = {
  color: 'rgba(226, 255, 244, 0.74)',
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 0.7,
  textTransform: 'uppercase',
}

const settingsHeroSummaryChipValueStyle = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: '700',
}

const settingsMetricGridStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
}

function settingsMetricCardStyle(isCompact, tone) {
  return {
    width: isCompact ? '100%' : '48.5%',
    minWidth: 0,
    gap: 10,
    padding: 18,
    borderRadius: 24,
    backgroundColor: tone === 'primary' ? THEME.surfaceMuted : THEME.surface,
    borderWidth: 1,
    borderColor: tone === 'primary' ? THEME.accentSoftStrong : THEME.border,
  }
}

function settingsMetricIconWrapStyle(tone) {
  return {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tone === 'primary' ? '#ffffff' : THEME.canvas,
  }
}

const settingsMetricValueStyle = {
  color: THEME.ink,
  fontSize: 24,
  lineHeight: 28,
  fontWeight: '900',
}

const settingsMetricLabelStyle = {
  color: THEME.muted,
  fontSize: 12,
  lineHeight: 17,
  fontWeight: '600',
}

function settingsActionRowStyle(isCompact) {
  return {
    flexDirection: isCompact ? 'column' : 'row',
    gap: 10,
  }
}

const settingsActionPillStyle = {
  flex: 1,
  minWidth: 0,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 22,
  backgroundColor: THEME.surface,
  borderWidth: 1,
  borderColor: THEME.border,
}

const settingsActionPillIconStyle = {
  width: 38,
  height: 38,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: THEME.surfaceMuted,
}

const settingsActionPillCopyStyle = {
  flex: 1,
  gap: 2,
}

const settingsActionPillLabelStyle = {
  color: THEME.ink,
  fontSize: 13,
  fontWeight: '800',
}

const settingsActionPillSubLabelStyle = {
  color: THEME.muted,
  fontSize: 11,
  lineHeight: 15,
}

function settingsCardGridStyle(isCompact) {
  return {
    flexDirection: isCompact ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: 12,
  }
}

function settingsDetailCardStyle(lightMode) {
  return {
    width: '100%',
    gap: 16,
    padding: 18,
    borderRadius: 26,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

const settingsDetailCardHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const settingsDetailCardHeaderLeftStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  flex: 1,
}

function settingsDetailCardIconStyle(lightMode) {
  return {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
  }
}

function settingsDetailCardTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  }
}

function settingsDetailCardEditStyle(lightMode) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.borderStrong : THEME.darkBorder,
  }
}

function settingsDetailCardEditTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 12,
    fontWeight: '800',
  }
}

const settingsDetailRowsStyle = {
  gap: 12,
}

function settingsDetailRowStyle(lightMode) {
  return {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function settingsDetailLabelStyle(lightMode) {
  return {
    width: '34%',
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  }
}

function settingsDetailValueStyle(lightMode) {
  return {
    flex: 1,
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'right',
  }
}

function settingsFooterCardStyle(lightMode) {
  return {
    gap: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

const settingsFooterTopRowStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 14,
}

const settingsFooterCopyStyle = {
  flex: 1,
  gap: 6,
}

function settingsFooterTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  }
}

function settingsFooterBodyStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 13,
    lineHeight: 19,
  }
}

const settingsFooterStatusStyle = {
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 999,
  backgroundColor: THEME.surfaceMuted,
}

const settingsFooterStatusTextStyle = {
  color: THEME.accentStrong,
  fontSize: 12,
  fontWeight: '800',
}

const settingsFooterActionListStyle = {
  gap: 10,
}

function settingsListActionStyle(lightMode, destructive) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: destructive
      ? lightMode
        ? 'rgba(212, 75, 62, 0.06)'
        : 'rgba(212, 75, 62, 0.12)'
      : lightMode
        ? THEME.canvas
        : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: destructive ? 'rgba(212, 75, 62, 0.16)' : lightMode ? THEME.border : THEME.darkBorder,
  }
}

function settingsListActionIconStyle(lightMode, destructive) {
  return {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: destructive
      ? 'rgba(212, 75, 62, 0.1)'
      : lightMode
        ? THEME.surface
        : THEME.darkSurface,
  }
}

const settingsListActionCopyStyle = {
  flex: 1,
  gap: 3,
}

function settingsListActionTitleStyle(lightMode, destructive) {
  return {
    color: destructive ? THEME.danger : lightMode ? THEME.ink : THEME.darkText,
    fontSize: 14,
    fontWeight: '800',
  }
}

function settingsListActionSubtitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12,
    lineHeight: 17,
  }
}

const settingsSheetBackdropStyle = {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(10, 18, 14, 0.34)',
}

const settingsSheetScrimStyle = {
  flex: 1,
}

const settingsSheetKeyboardAvoidingStyle = {
  width: '100%',
  justifyContent: 'flex-end',
}

function settingsSheetStyle(lightMode) {
  return {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: lightMode ? THEME.cream : THEME.darkSurface,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    boxShadow: lightMode ? '0 -18px 48px rgba(8, 24, 18, 0.18)' : '0 -18px 48px rgba(0, 0, 0, 0.36)',
    borderCurve: 'continuous',
  }
}

function settingsSheetGrabberStyle(lightMode) {
  return {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.borderStrong : THEME.darkBorder,
    marginBottom: 14,
  }
}

const settingsSheetHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  paddingBottom: 14,
}

function settingsSheetTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  }
}

function settingsSheetSubtitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 14,
    lineHeight: 20,
  }
}

function settingsSheetCloseButtonStyle(lightMode) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function settingsSheetCloseButtonTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 15,
    fontWeight: '700',
  }
}

function settingsSheetPanelStyle(lightMode) {
  return lightMode
    ? {}
    : {
        backgroundColor: THEME.darkSurfaceAlt,
        borderColor: THEME.darkBorder,
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.18)',
      }
}

const settingsSheetScrollContentStyle = {
  gap: 18,
  paddingBottom: 28,
  flexGrow: 1,
}

const profileTopBarStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingTop: 4,
}

const profileTopBarLeftStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  flex: 1,
}

const profileTopBarIconWrapStyle = {
  width: 56,
  height: 56,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: THEME.border,
  backgroundColor: THEME.surface,
  alignItems: 'center',
  justifyContent: 'center',
}

const profileTopBarTitleStyle = {
  color: THEME.ink,
  fontSize: 18,
  lineHeight: 23,
  fontWeight: '800',
  flexShrink: 1,
}

const profileTopBarButtonStyle = {
  paddingHorizontal: 22,
  paddingVertical: 12,
  borderRadius: 999,
  borderWidth: 2,
  borderColor: THEME.accentStrong,
  backgroundColor: THEME.surfaceMuted,
}

const profileTopBarButtonTextStyle = {
  color: THEME.accentStrong,
  fontSize: 13,
  fontWeight: '700',
}

const profileHeroShellStyle = {
  marginTop: 2,
  marginHorizontal: -16,
}

const profileBannerStyle = {
  height: 136,
  backgroundColor: THEME.accentStrong,
  overflow: 'hidden',
}

const profileAvatarWrapStyle = {
  marginTop: -56,
  paddingHorizontal: 18,
}

const profileAvatarStyle = {
  width: 104,
  height: 104,
  borderRadius: 30,
  borderWidth: 6,
  borderColor: THEME.canvas,
  backgroundColor: '#58b08b',
  alignItems: 'center',
  justifyContent: 'center',
}

const profileAvatarTextStyle = {
  color: '#ffffff',
  fontSize: 23,
  fontWeight: '800',
  letterSpacing: 1,
}

const profileHeaderBlockStyle = {
  gap: 10,
}

const profileCompanyNameStyle = {
  color: THEME.ink,
  fontSize: 23,
  lineHeight: 28,
  fontWeight: '800',
}

const profileMetaRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}

const profileChipStyle = {
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderRadius: 999,
  borderWidth: 2,
  borderColor: THEME.accentStrong,
  backgroundColor: THEME.surfaceMuted,
}

const profileChipTextStyle = {
  color: THEME.accentStrong,
  fontSize: 13,
  fontWeight: '700',
}

const profileMetaTextStyle = {
  color: THEME.muted,
  fontSize: 13,
  fontWeight: '500',
}

const gstCardStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  backgroundColor: THEME.surface,
  borderWidth: 1,
  borderColor: THEME.border,
}

const gstLabelStyle = {
  color: THEME.subtle,
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 0.8,
}

const gstValueStyle = {
  color: THEME.ink,
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '500',
}

const copyBadgeStyle = {
  width: 52,
  height: 52,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: THEME.surfaceMuted,
}

const verificationRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
}

const verificationDotStyle = {
  width: 12,
  height: 12,
  borderRadius: 999,
  backgroundColor: THEME.accentStrong,
}

const verificationTextStyle = {
  color: THEME.accentStrong,
  fontSize: 13,
  lineHeight: 18,
  fontWeight: '500',
}

const profileStatsStripStyle = {
  flexDirection: 'row',
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: THEME.border,
  backgroundColor: THEME.canvas,
}

const profileStatCellStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 108,
  paddingHorizontal: 10,
  borderRightWidth: 1,
  borderColor: THEME.border,
}

const profileStatCellLastStyle = {
  borderRightWidth: 0,
}

const profileStatValueStyle = {
  color: THEME.ink,
  fontSize: 20,
  lineHeight: 25,
  fontWeight: '800',
}

const profileStatLabelStyle = {
  color: THEME.muted,
  fontSize: 12,
  lineHeight: 17,
}

const profileSectionStyle = {
  gap: 18,
  paddingTop: 6,
  paddingBottom: 20,
  borderBottomWidth: 1,
  borderColor: THEME.border,
}

const profileSectionHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
}

const profileSectionIconWrapStyle = {
  width: 50,
  height: 50,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
}

const profileSectionTitleStyle = {
  color: THEME.ink,
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '800',
  flexShrink: 1,
}

const profileSectionRowsStyle = {
  gap: 18,
}

const actionSectionContentStyle = {
  gap: 16,
}

const profileInfoRowStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 18,
}

const profileInfoLabelStyle = {
  width: '32%',
  color: THEME.muted,
  fontSize: 13,
  lineHeight: 20,
  fontWeight: '600',
}

const profileInfoValueStyle = {
  flex: 1,
  color: THEME.ink,
  fontSize: 13,
  lineHeight: 20,
  textAlign: 'right',
  paddingLeft: 12,
}

const profileInfoAccentValueStyle = {
  color: THEME.accentStrong,
}

const actionMenuRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  paddingHorizontal: 18,
  paddingVertical: 18,
  borderRadius: 24,
  borderWidth: 1,
  borderColor: THEME.border,
  backgroundColor: THEME.surface,
}

const actionMenuRowDestructiveStyle = {
  borderWidth: 2,
  borderColor: '#5b2d2d',
}

const actionMenuTitleStyle = {
  color: THEME.ink,
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '800',
}

const actionMenuTitleDestructiveStyle = {
  color: '#c45463',
}

const actionMenuSubtitleStyle = {
  color: THEME.muted,
  fontSize: 13,
  lineHeight: 18,
}

const settingsEditorWrapStyle = {
  borderRadius: 24,
  overflow: 'hidden',
}

const bottomNavShellStyle = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 38,
  backgroundColor: '#09090b',
  borderWidth: 1,
  borderColor: '#27272a',
  paddingHorizontal: 8,
  paddingVertical: 7,
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.34)',
}

const bottomNavShellLightStyle = {
  backgroundColor: '#fbfdfc',
  borderColor: 'rgba(188, 214, 203, 0.82)',
  boxShadow: '0 14px 32px rgba(70, 128, 104, 0.16)',
}

const bottomNavShellGlowStyle = {
  position: 'absolute',
  top: -20,
  left: 40,
  right: 40,
  height: 42,
  borderRadius: 999,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
}

const bottomNavShellGlowLightStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
}

const bottomNavShellHighlightStyle = {
  position: 'absolute',
  top: 0,
  left: 26,
  right: 26,
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
}

const bottomNavShellHighlightLightStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
}

const bottomNavTrackStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
}

const bottomNavItemStyle = {
  flex: 1,
  minHeight: 72,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  paddingHorizontal: 8,
  paddingVertical: 10,
  borderRadius: 26,
}

const bottomNavItemActiveStyle = {
  backgroundColor: '#18181b',
  borderWidth: 1,
  borderColor: '#3f3f46',
  transform: [{ translateY: -1 }],
}

const bottomNavItemActiveLightStyle = {
  backgroundColor: '#dfeee8',
  borderWidth: 1,
  borderColor: '#c7ddd5',
  transform: [{ translateY: -1 }],
}

const bottomNavIconWrapStyle = {
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
}

const bottomNavIconWrapActiveStyle = {
  backgroundColor: 'transparent',
}

const bottomNavIconWrapActiveLightStyle = {
  backgroundColor: 'transparent',
}

const bottomNavLabelStyle = {
  color: '#a1a1aa',
  fontSize: 10,
  lineHeight: 12,
  fontWeight: '600',
}

const bottomNavLabelActiveStyle = {
  color: '#fafafa',
}

const bottomNavLabelActiveLightStyle = {
  color: '#44a383',
  fontWeight: '700',
}
