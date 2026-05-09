import React from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'

import { ActionButton, THEME, summaryTitleStyle } from './InvoiceComponents'
import CustomerEditor from './CustomerEditor'

export default function CustomerSheet({
  visible,
  mode,
  customer,
  isCompact,
  isTablet,
  isExistingCustomer,
  lightMode = true,
  onClose,
  onEdit,
  onFieldChange,
  onSave,
  onDelete,
  onCreateBill,
  onPickFromContacts,
}) {
  const title = mode === 'edit' ? (isExistingCustomer ? 'Edit Customer' : 'Add Customer') : 'Customer Details'
  const subtitle =
    mode === 'edit'
      ? 'Update customer information and save it to your local records.'
      : 'Review saved customer details or switch to edit mode.'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={backdropStyle}>
        <Pressable style={scrimStyle} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={sheetKeyboardAvoidingStyle}
        >
          <View style={sheetStyle(lightMode)}>
            <View style={grabberStyle(lightMode)} />

            <View style={headerStyle}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={titleStyle(lightMode)}>{title}</Text>
                <Text style={subtitleStyle(lightMode)}>{subtitle}</Text>
              </View>
              <Pressable onPress={onClose} style={({ pressed }) => [closeButtonStyle(lightMode), pressed && { opacity: 0.85 }]}>
                <Text style={closeButtonTextStyle(lightMode)}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              contentContainerStyle={scrollContentStyle}
            >
              {mode === 'view' ? (
                <CustomerDetailsView
                  customer={customer}
                  isExistingCustomer={isExistingCustomer}
                  lightMode={lightMode}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCreateBill={onCreateBill}
                />
              ) : (
                <CustomerEditor
                  customer={customer}
                  isCompact={isCompact}
                  isTablet={isTablet}
                  onFieldChange={onFieldChange}
                  onSave={onSave}
                  onDelete={onDelete}
                  onCancel={isExistingCustomer ? onClose : onClose}
                  onPickFromContacts={onPickFromContacts}
                  showHeader={false}
                  showDelete={isExistingCustomer}
                  embedded
                  lightMode={lightMode}
                  saveLabel={isExistingCustomer ? 'Save Changes' : 'Create Customer'}
                  deleteLabel="Delete Customer"
                  cancelLabel="Close"
                />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

function CustomerDetailsView({ customer, isExistingCustomer, lightMode, onEdit, onDelete, onCreateBill }) {
  return (
    <View style={{ gap: 18 }}>
      <View style={heroCardStyle(lightMode)}>
        <View style={avatarStyle(lightMode)}>
          <Text style={avatarTextStyle(lightMode)}>{getInitials(customer?.name || 'Customer')}</Text>
        </View>

        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[summaryTitleStyle, !lightMode && { color: THEME.darkText }]}>{customer?.name || 'Unnamed customer'}</Text>
          <Text style={heroMetaStyle(lightMode)}>{customer?.phone || 'No phone saved'}</Text>
          <Text style={heroMetaStyle(lightMode)}>{customer?.placeOfSupply || 'Place of supply not set'}</Text>
        </View>
      </View>

      <View style={detailsCardStyle(lightMode)}>
        <DetailRow label="GSTIN" value={customer?.gstin || 'Not added'} lightMode={lightMode} />
        <DetailRow label="Email" value={customer?.email || 'Not added'} lightMode={lightMode} />
        <DetailRow label="Address" value={customer?.address || 'Not added'} multiline lightMode={lightMode} />
        <DetailRow label="Notes" value={customer?.notes || 'Not added'} multiline lightMode={lightMode} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <ActionButton
            label="Edit Customer"
            variant="primary"
            onPress={onEdit}
            iconName="edit-3"
            lightMode={lightMode}
          />
        </View>

        {isExistingCustomer ? (
          <View style={{ flex: 1 }}>
            <ActionButton
              label="Delete Customer"
              variant="danger"
              onPress={onDelete}
              iconName="trash-2"
              lightMode={lightMode}
            />
          </View>
        ) : null}
      </View>

      <View >

        <ActionButton label="Create Bill" variant="secondary" fullWidth lightMode={lightMode} onPress={onCreateBill} iconName="file-plus" />

      </View>
    </View>
  )
}

function DetailRow({ label, value, multiline, lightMode }) {
  return (
    <View style={detailRowStyle}>
      <Text style={detailLabelStyle(lightMode)}>{label}</Text>
      <Text selectable style={[detailValueStyle(lightMode), multiline && { textAlign: 'left' }]}>
        {value}
      </Text>
    </View>
  )
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

const backdropStyle = {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(12, 14, 24, 0.42)',
}

const scrimStyle = {
  flex: 1,
}

const sheetKeyboardAvoidingStyle = {
  width: '100%',
  justifyContent: 'flex-end',
}

function sheetStyle(lightMode) {
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
    boxShadow: lightMode ? '0 -18px 48px rgba(8, 12, 26, 0.22)' : '0 -18px 48px rgba(0, 0, 0, 0.36)',
    borderCurve: 'continuous',
  }
}

function grabberStyle(lightMode) {
  return {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.borderStrong : THEME.darkBorder,
    marginBottom: 14,
  }
}

const headerStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  paddingBottom: 14,
}

function titleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  }
}

function subtitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 14,
    lineHeight: 20,
  }
}

function closeButtonStyle(lightMode) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function closeButtonTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 15,
    fontWeight: '700',
  }
}

const scrollContentStyle = {
  gap: 18,
  paddingBottom: 28,
  flexGrow: 1,
}

function heroCardStyle(lightMode) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    boxShadow: lightMode ? THEME.shadowSoft : '0 18px 48px rgba(0, 0, 0, 0.18)',
    borderCurve: 'continuous',
  }
}

function avatarStyle(lightMode) {
  return {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.accentSoft : THEME.darkSurface,
  }
}

function avatarTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 20,
    fontWeight: '800',
  }
}

function heroMetaStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 14,
    lineHeight: 20,
  }
}

function detailsCardStyle(lightMode) {
  return {
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

const detailRowStyle = {
  gap: 6,
}

function detailLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  }
}

function detailValueStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 16,
    lineHeight: 24,
  }
}
