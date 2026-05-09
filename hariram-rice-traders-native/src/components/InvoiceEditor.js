import React, { useState } from 'react'
import { Text, View } from 'react-native'

import { calculateSummary, getGstLabels, getMinimumDueDate, hasPreviewableInvoiceItems } from '../utils'
import {
  ActionButton,
  CompactItemPreview,
  CustomerInfoCard,
  CustomerSelector,
  FieldGrid,
  InvoiceSummaryCard,
  LabeledDateInput,
  LabeledInput,
  SectionCard,
  THEME,
  compactPanelStyle,
  fontFace,
  panelStyle,
} from './InvoiceComponents'
import BagTypePicker from './invoice-editor/BagTypePicker'
import LineItemEditor from './invoice-editor/LineItemEditor'

const invoiceFields = [
  { key: 'invoiceNumber', label: 'Invoice no.', leftIcon: 'hash' },
  { key: 'invoiceDate', label: 'Invoice date', type: 'date', leftIcon: 'calendar' },
  { key: 'dueDate', label: 'Due date', type: 'date', clearable: true, leftIcon: 'calendar' },
  { key: 'vehicleNumber', label: 'Vehicle no.', leftIcon: 'truck' },
  { key: 'placeOfSupply', label: 'Place of supply', leftIcon: 'map' },
]

export default function InvoiceEditor({
  invoice,
  customers,
  summary,
  isCompact,
  isTablet,
  isWide,
  isExistingBill = false,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onApplyCustomer,
  onPreview,
  lightMode = true,
}) {
  const [bagTypePickerItemId, setBagTypePickerItemId] = useState(null)
  const invoiceSummary = summary || calculateSummary(invoice.items)
  const { cgstLabel, sgstLabel } = getGstLabels(invoice.items)
  const hasItems = invoice.items.length > 0
  const canPreview = hasPreviewableInvoiceItems(invoice.items)

  return (
    <View style={{ gap: 10 }}>
      <View
        style={[
          panelStyle,
          isCompact && compactPanelStyle,
          !lightMode && { backgroundColor: THEME.darkSurface, borderColor: THEME.darkBorder },
        ]}
      >
        <SectionCard title="Invoice details" kicker="Basics" lightMode={lightMode}>
          <FieldGrid>
            {invoiceFields.map((field) =>
              field.type === 'date' ? (
                <LabeledDateInput
                  key={field.key}
                  label={field.label}
                  value={invoice[field.key]}
                  columns={isTablet ? 2 : 1}
                  clearable={field.clearable}
                  leftIcon={field.leftIcon}
                  lightMode={lightMode}
                  minimumDate={field.key === 'dueDate' ? getMinimumDueDate(invoice.invoiceDate) : undefined}
                  onChangeText={(value) => onFieldChange(field.key, value)}
                />
              ) : (
                <LabeledInput
                  key={field.key}
                  label={field.label}
                  value={invoice[field.key]}
                  placeholder={field.placeholder}
                  leftIcon={field.leftIcon}
                  columns={isTablet ? 2 : 1}
                  lightMode={lightMode}
                  editable={!(field.key === 'invoiceNumber' && isExistingBill)}
                  onChangeText={(value) => onFieldChange(field.key, value)}
                />
              )
            )}
          </FieldGrid>
        </SectionCard>

        <SectionCard title="Customer" kicker="Linked profile" lightMode={lightMode}>
          <View style={{ gap: 12 }}>
            <CustomerSelector
              customers={customers}
              selectedCustomerId={invoice.customerId}
              onSelectCustomer={onApplyCustomer}
              lightMode={lightMode}
            />
            <CustomerInfoCard invoice={invoice} isTablet={isTablet} lightMode={lightMode} />
          </View>
        </SectionCard>

        <SectionCard title="Line items" kicker="Stock" lightMode={lightMode} style={lineItemsSectionCardStyle}>
          <View style={{ gap: 14 }}>
            {hasItems ? (
              invoice.items.map((item) => (
                <LineItemEditor
                  key={item.id}
                  item={item}
                  isTablet={isTablet}
                  lightMode={lightMode}
                  onItemChange={onItemChange}
                  onRemoveItem={onRemoveItem}
                  onOpenBagType={setBagTypePickerItemId}
                />
              ))
            ) : (
              <EmptyItemsState lightMode={lightMode} />
            )}
            <ActionButton
              label="Add item"
              variant="secondary"
              fullWidth
              onPress={onAddItem}
              lightMode={lightMode}
              iconName="plus-circle"
            />
          </View>
        </SectionCard>

        <SectionCard title="Notes" kicker="Extras" lightMode={lightMode}>
          <LabeledInput
            label="Invoice notes"
            value={invoice.notes}
            multiline
            fullWidth
            columns={1}
            leftIcon="file-text"
            lightMode={lightMode}
            onChangeText={(value) => onFieldChange('notes', value)}
          />
        </SectionCard>

        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            gap: 16,
            alignItems: isWide ? 'flex-start' : 'stretch',
          }}
        >
          <View style={{ flex: 1, gap: 10 }}>
            <Text style={summaryLabelStyle(lightMode)}>Quick totals</Text>
            {hasItems ? (
              invoice.items.map((item) => (
                <CompactItemPreview key={`preview-${item.id}`} item={item} lightMode={lightMode} />
              ))
            ) : (
              <Text style={emptyTotalsHintStyle(lightMode)}>
                No stock added yet. Add your first line item to enable preview.
              </Text>
            )}
            {hasItems && !canPreview ? (
              <Text style={emptyTotalsHintStyle(lightMode)}>
                Fill one item with a description, bag type, quantity, and rate to unlock preview.
              </Text>
            ) : null}
          </View>

          <InvoiceSummaryCard
            summary={invoiceSummary}
            cgstLabel={cgstLabel}
            sgstLabel={sgstLabel}
            lightMode={lightMode}
          />
        </View>

        <View
          style={{
            flexDirection: isCompact ? 'column' : 'row',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <ActionButton
            label="Preview Invoice"
            variant="primary"
            disabled={!canPreview}
            fullWidth
            lightMode={lightMode}
            iconName="eye"
            onPress={onPreview}
          />
        </View>
      </View>

      <BagTypePicker
        visible={!!bagTypePickerItemId}
        selectedItemId={bagTypePickerItemId}
        lightMode={lightMode}
        onClose={() => setBagTypePickerItemId(null)}
        onSelect={(itemId, type) => onItemChange(itemId, 'bagType', type)}
      />
    </View>
  )
}

function EmptyItemsState({ lightMode }) {
  return (
    <View style={emptyItemsCardStyle(lightMode)}>
      <Text style={emptyItemsTitleStyle(lightMode)}>No line items yet</Text>
      <Text style={emptyItemsBodyStyle(lightMode)}>
        Start with “Add item”. Preview stays disabled until one line item is properly filled.
      </Text>
    </View>
  )
}

const lineItemsSectionCardStyle = {
  padding: 14,
  gap: 12,
}

function summaryLabelStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
}

function emptyItemsCardStyle(lightMode) {
  return {
    gap: 6,
    padding: 18,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderStyle: 'dashed',
    borderCurve: 'continuous',
  }
}

function emptyItemsTitleStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
  }
}

function emptyItemsBodyStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 11,
    lineHeight: 16,
  }
}

function emptyTotalsHintStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 11,
    lineHeight: 16,
  }
}
