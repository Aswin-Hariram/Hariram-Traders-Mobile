import React from 'react'
import { View } from 'react-native'

import {
  ActionButton,
  FieldGrid,
  LabeledInput,
  PanelHeader,
  SectionCard,
  compactPanelStyle,
  panelStyle,
} from './InvoiceComponents'

const customerFields = [
  { key: 'name', label: 'Customer name', leftIcon: 'user' },
  { key: 'address', label: 'Customer address', multiline: true, fullWidth: true, leftIcon: 'map-pin' },
  { key: 'gstin', label: 'GSTIN', leftIcon: 'hash' },
  { key: 'phone', label: 'Phone', keyboardType: 'phone-pad', fixedPrefix: '+91', placeholder: '9XXXXXXXXX', leftIcon: 'phone' },
  { key: 'email', label: 'Email', keyboardType: 'email-address', leftIcon: 'mail' },
  { key: 'placeOfSupply', label: 'Place of supply', leftIcon: 'map' },
]

export default function CustomerEditor({
  customer,
  isCompact,
  isTablet,
  onFieldChange,
  onSave,
  onDelete,
  onCancel,
  onPickFromContacts,
  showHeader = true,
  showDelete = true,
  embedded = false,
  saveLabel = 'Save Customer',
  deleteLabel = 'Delete Customer',
  cancelLabel = 'Cancel',
  lightMode = true,
}) {
  return (
    <View style={embedded ? { gap: 18 } : [panelStyle, isCompact && compactPanelStyle]}>
      {showHeader ? <PanelHeader kicker="Customer" title="Customer profile" lightMode={lightMode} /> : null}

      <SectionCard title="Contact details" kicker="Profile" lightMode={lightMode}>
        <FieldGrid>
          {customerFields.map((field) => (
            <LabeledInput
              key={field.key}
              label={field.label}
              value={customer[field.key]}
              keyboardType={field.keyboardType}
              placeholder={field.placeholder}
              multiline={field.multiline}
              fullWidth={field.fullWidth}
              fixedPrefix={field.fixedPrefix}
              leftIcon={field.leftIcon}
              trailingActionLabel={field.key === 'phone' && onPickFromContacts ? 'Pick' : undefined}
              onTrailingActionPress={field.key === 'phone' ? onPickFromContacts : undefined}
              columns={isTablet ? 2 : 1}
              lightMode={lightMode}
              onChangeText={(value) => onFieldChange(field.key, value)}
            />
          ))}
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Notes" kicker="Extra" lightMode={lightMode}>
        <LabeledInput
          label="Notes"
          value={customer.notes}
          multiline
          fullWidth
          columns={1}
          lightMode={lightMode}
          leftIcon="file-text"
          onChangeText={(value) => onFieldChange('notes', value)}
        />
      </SectionCard>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
       
        <View style={{flex:1}}>
          {showDelete ? (
          <ActionButton label={deleteLabel} variant="danger" fullWidth={isCompact} onPress={onDelete} iconName="trash-2" lightMode={lightMode} />
        ) : null}
        </View>
        <View style={{flex:1}}>
         <ActionButton label={saveLabel} variant="primary" fullWidth onPress={onSave} iconName="save" lightMode={lightMode} />
        </View>
      </View>
     
    </View>
  )
}
