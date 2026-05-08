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

const businessFields = [
  { key: 'companyName', label: 'Business name', leftIcon: 'briefcase' },
  { key: 'companyTagline', label: 'Business line', leftIcon: 'tag' },
  { key: 'companyAddress', label: 'Business address', multiline: true, fullWidth: true, leftIcon: 'map-pin' },
  { key: 'companyGstin', label: 'GSTIN', leftIcon: 'hash' },
  { key: 'companyPhone', label: 'Phone', keyboardType: 'phone-pad', fixedPrefix: '+91', placeholder: '9XXXXXXXXX', leftIcon: 'phone' },
  { key: 'companyEmail', label: 'Email', keyboardType: 'email-address', leftIcon: 'mail' },
]

const bankFields = [
  { key: 'companyBank', label: 'Bank', leftIcon: 'dollar-sign' },
  { key: 'companyAccountName', label: 'Account name', leftIcon: 'user' },
  { key: 'companyAccount', label: 'Account no.', leftIcon: 'credit-card' },
  { key: 'companyAccountType', label: 'Account type', leftIcon: 'list' },
  { key: 'companyIfsc', label: 'IFSC', leftIcon: 'code' },
  { key: 'companyBranch', label: 'Branch', fullWidth: true, leftIcon: 'map-pin' },
]

export default function SettingsEditor({
  profile,
  isCompact,
  isTablet,
  onFieldChange,
  onSave,
  onPickContact,
}) {
  return (
    <View style={[panelStyle, isCompact && compactPanelStyle]}>
      <PanelHeader kicker="Settings" title="Business setup" />

      <SectionCard title="Business details" kicker="Identity">
        <FieldGrid>
          {businessFields.map((field) => (
            <LabeledInput
              key={field.key}
              label={field.label}
              value={profile[field.key]}
              keyboardType={field.keyboardType}
              placeholder={field.placeholder}
              multiline={field.multiline}
              fullWidth={field.fullWidth}
              fixedPrefix={field.fixedPrefix}
              leftIcon={field.leftIcon}
              trailingActionLabel={field.key === 'companyPhone' && onPickContact ? 'Pick' : undefined}
              onTrailingActionPress={field.key === 'companyPhone' ? onPickContact : undefined}
              columns={isTablet ? 2 : 1}
              onChangeText={(value) => onFieldChange(field.key, value)}
            />
          ))}
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Bank setup" kicker="Payments">
        <FieldGrid>
          {bankFields.map((field) => (
            <LabeledInput
              key={field.key}
              label={field.label}
              value={profile[field.key]}
              keyboardType={field.keyboardType}
              placeholder={field.placeholder}
              multiline={field.multiline}
              fullWidth={field.fullWidth}
              leftIcon={field.leftIcon}
              columns={isTablet ? 2 : 1}
              onChangeText={(value) => onFieldChange(field.key, value)}
            />
          ))}
        </FieldGrid>
      </SectionCard>

      <View
        style={{
          flexDirection: isCompact ? 'column' : 'row',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <ActionButton label="Save Settings" variant="primary" fullWidth onPress={onSave} />
      </View>
    </View>
  )
}
