import React, { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { BAG_TYPE_OPTIONS } from '../constants'
import {
  calculateSummary,
  formatCurrency,
  formatNumber,
  getMinimumDueDate,
  getGstLabels,
  hasPreviewableInvoiceItems,
  isInvoiceItemReady,
} from '../utils'
import {
  ActionButton,
  CompactItemPreview,
  CustomerInfoCard,
  CustomerSelector,
  FieldGrid,
  LabeledDateInput,
  InvoiceSummaryCard,
  LabeledInput,
  PanelHeader,
  SectionCard,
  THEME,
  compactPanelStyle,
  panelStyle,
} from './InvoiceComponents'

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
  onSave,
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
      <View style={[panelStyle, isCompact && compactPanelStyle, !lightMode && { backgroundColor: THEME.darkSurface, borderColor: THEME.darkBorder }]}>
        <SectionCard title="Invoice details" kicker="Basics" lightMode={lightMode}>
          <FieldGrid>
            {invoiceFields.map((field) => (
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
            ))}
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

        <SectionCard title="Line items" kicker="Stock" lightMode={lightMode}>
          <View style={{ gap: 14 }}>
            {hasItems ? (
              invoice.items.map((item, index) => (
                <ItemEditorCard
                  key={item.id}
                  item={item}
                  index={index}
                  isTablet={isTablet}
                  lightMode={lightMode}
                  onItemChange={onItemChange}
                  onRemoveItem={onRemoveItem}
                  onOpenBagType={() => setBagTypePickerItemId(item.id)}
                />
              ))
            ) : (
              <EmptyItemsState lightMode={lightMode} />
            )}
            <ActionButton label="Add item" variant="secondary" fullWidth onPress={onAddItem} lightMode={lightMode} />
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
              invoice.items.map((item) => <CompactItemPreview key={`preview-${item.id}`} item={item} lightMode={lightMode} />)
            ) : (
              <Text style={emptyTotalsHintStyle(lightMode)}>No stock added yet. Add your first line item to enable preview.</Text>
            )}
            {hasItems && !canPreview ? (
              <Text style={emptyTotalsHintStyle(lightMode)}>
                Fill one item with a name or bag type, quantity, and rate to unlock preview.
              </Text>
            ) : null}
          </View>

          <InvoiceSummaryCard summary={invoiceSummary} cgstLabel={cgstLabel} sgstLabel={sgstLabel} lightMode={lightMode} />
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
            onPress={onPreview}
          />
        </View>
      </View>

      <Modal
        visible={!!bagTypePickerItemId}
        transparent
        animationType="fade"
        onRequestClose={() => setBagTypePickerItemId(null)}
      >
        <Pressable style={pickerBackdropStyle} onPress={() => setBagTypePickerItemId(null)} />
        <View style={pickerShellStyle(lightMode)}>
          <Text style={pickerTitleStyle(lightMode)}>Choose bag type</Text>
          <ScrollView contentContainerStyle={pickerListStyle} keyboardShouldPersistTaps="handled">
            {BAG_TYPE_OPTIONS.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  if (bagTypePickerItemId) {
                    onItemChange(bagTypePickerItemId, 'bagType', type)
                  }
                  setBagTypePickerItemId(null)
                }}
                style={({ pressed }) => [pickerOptionStyle(lightMode), pressed && { opacity: 0.8 }]}
              >
                <Text style={pickerOptionTextStyle(lightMode)}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
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

function ItemEditorCard({ item, index, isTablet, lightMode, onItemChange, onRemoveItem, onOpenBagType }) {
  const lineSummary = calculateSummary([item])
  const isReady = isInvoiceItemReady(item)
  const itemName = item.description || item.bagType || 'Untitled item'
  const itemSubtitle = isReady
    ? 'Ready for invoice preview and totals.'
    : 'Add description or bag type, quantity, and rate to complete this item.'
  const itemFacts = [
    { label: 'Bag', value: item.bagType || 'Pending', tone: item.bagType ? 'filled' : 'muted' },
    { label: 'HSN', value: item.hsn || 'Pending', tone: item.hsn ? 'filled' : 'muted' },
    {
      label: 'GST',
      value: Number(item.gstRate) > 0 ? `${formatNumber(item.gstRate)}%` : 'Pending',
      tone: Number(item.gstRate) > 0 ? 'filled' : 'muted',
    },
  ]

  return (
    <View style={itemCardStyle(lightMode)}>
      <FieldGrid>
        <LabeledInput
          label="Description"
          value={item.description}
          placeholder="Enter item description"
          fullWidth
          columns={1}
          leftIcon="align-left"
          lightMode={lightMode}
          onChangeText={(value) => onItemChange(item.id, 'description', value)}
        />
        <LabeledSelect
          label="Bag type"
          value={item.bagType}
          placeholder="Select bag type"
          columns={isTablet ? 2 : 1}
          leftIcon="box"
          lightMode={lightMode}
          onPress={() => onOpenBagType(item.id)}
        />
        <LabeledInput
          label="HSN"
          value={item.hsn}
          columns={isTablet ? 2 : 1}
          leftIcon="tag"
          lightMode={lightMode}
          onChangeText={(value) => onItemChange(item.id, 'hsn', value)}
        />
        <StepperInput
          label="Quantity"
          value={Number(item.quantity) || 0}
          min={0}
          max={9999}
          columns={isTablet ? 2 : 1}
          lightMode={lightMode}
          onChange={(nextValue) => onItemChange(item.id, 'quantity', String(nextValue))}
        />
        <LabeledInput
          label="Rate"
          value={String(item.rate ?? '')}
          keyboardType="numeric"
          columns={isTablet ? 2 : 1}
          leftIcon="dollar-sign"
          lightMode={lightMode}
          onChangeText={(value) => onItemChange(item.id, 'rate', value)}
        />
        <LabeledInput
          label="GST %"
          value={String(item.gstRate ?? '')}
          keyboardType="numeric"
          columns={isTablet ? 2 : 1}
          leftIcon="percent"
          lightMode={lightMode}
          onChangeText={(value) => onItemChange(item.id, 'gstRate', value)}
        />
      </FieldGrid>

      <View style={itemMetaWrapStyle(isTablet)}>
        <MetricPill label="Taxable" value={formatCurrency(lineSummary.taxableTotal)} isTablet={isTablet} lightMode={lightMode} />
        <MetricPill label="GST" value={formatCurrency(lineSummary.gstTotal)} isTablet={isTablet} lightMode={lightMode} />
        
        <MetricPill
          label="Qty x Rate"
          value={`${formatNumber(item.quantity)} x ${formatCurrency(item.rate)}`}
          isTablet={isTablet}
          lightMode={lightMode}
        />
        <MetricPill label="Line total" value={formatCurrency(lineSummary.grandTotal)} strong isTablet={isTablet} lightMode={lightMode} />
      </View>

      <View style={itemActionsStyle}>
        <ActionButton label="Remove item" variant="danger" fullWidth onPress={() => onRemoveItem(item.id)} lightMode={lightMode} />
      </View>
    </View>
  )
}

function ItemFactChip({ label, value, tone = 'filled', lightMode = true }) {
  return (
    <View style={itemFactChipStyle(tone, lightMode)}>
      <Text style={itemFactChipLabelStyle(lightMode)}>{label}</Text>
      <Text style={itemFactChipValueStyle(tone, lightMode)}>{value}</Text>
    </View>
  )
}

function SummaryCell({ label, value, strong = false, lightMode = true }) {
  return (
    <View style={summaryCellStyle}>
      <Text style={summaryCellLabelStyle(lightMode)}>{label}</Text>
      <Text style={summaryCellValueStyle(strong, lightMode)}>{value}</Text>
    </View>
  )
}

function StepperInput({ label, value, min = 0, max = 9999, step = 1, columns = 1, lightMode = true, onChange }) {
  return (
    <View style={{ width: columns > 1 ? '48%' : '100%', gap: 6 }}>
      <Text style={inputLabelStyle(lightMode)}>{label}</Text>
      <View style={stepperStyle(lightMode)}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          style={({ pressed }) => [stepperButtonStyle(lightMode), pressed && { opacity: 0.8 }]}
        >
          <Text style={stepperButtonTextStyle(lightMode)}>-</Text>
        </Pressable>
        <Text style={stepperValueStyle(lightMode)}>{value}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + step))}
          style={({ pressed }) => [stepperButtonStyle(lightMode), pressed && { opacity: 0.8 }]}
        >
          <Text style={stepperButtonTextStyle(lightMode)}>+</Text>
        </Pressable>
      </View>
    </View>
  )
}

function LabeledSelect({ label, value, placeholder, columns, onPress, leftIcon, lightMode = true }) {
  return (
    <View style={{ width: columns > 1 ? '48%' : '100%', gap: 6 }}>
      <Text style={inputLabelStyle(lightMode)}>{label}</Text>
      <Pressable onPress={onPress} style={[selectFieldStyle(lightMode), { flexDirection: 'row', alignItems: 'center' }]}>
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={16}
            color={THEME.subtle}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={[selectValueStyle(lightMode), !value && { color: THEME.subtle }, { flex: 1 }]}>
          {value || placeholder}
        </Text>
      </Pressable>
    </View>
  )
}

function MetricPill({ label, value, strong = false, isTablet, lightMode = true }) {
  return (
    <View style={metricPillStyle(strong, isTablet, lightMode)}>
      <Text style={metricLabelStyle(lightMode)}>{label}</Text>
      <Text numberOfLines={1} style={metricValueStyle(strong, lightMode)}>
        {value}
      </Text>
    </View>
  )
}

function summaryLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 12,
    fontWeight: '700',
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
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    fontWeight: '700',
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

function itemCardStyle(lightMode) {
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

const itemActionsStyle = {
  alignItems: 'stretch',
}

const itemCardHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
}

const itemHeroCardStyle = {
  flex: 1,
  gap: 8,
  padding: 14,
  borderRadius: 18,
  backgroundColor: THEME.surfaceMuted,
  borderWidth: 1,
  borderColor: THEME.accentSoftStrong,
  borderCurve: 'continuous',
}

const itemHeroTopRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const itemIndexPillStyle = {
  alignSelf: 'flex-start',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: THEME.surface,
  borderWidth: 1,
  borderColor: THEME.border,
}

const itemIndexPillTextStyle = {
  color: THEME.accentStrong,
  fontSize: 9.5,
  fontWeight: '700',
  letterSpacing: 0.2,
}

function itemStatusPillStyle(isReady) {
  return {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: isReady ? THEME.surfaceMuted : THEME.surface,
    borderWidth: 1,
    borderColor: isReady ? THEME.accentSoftStrong : THEME.border,
  }
}

function itemStatusPillTextStyle(isReady) {
  return {
    color: isReady ? THEME.accentStrong : THEME.muted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  }
}

const itemSubtitleStyle = {
  color: THEME.muted,
  fontSize: 11,
  lineHeight: 15,
  fontWeight: '600',
}

const itemFactsRowStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
}

function itemFactChipStyle(tone, lightMode = true) {
  return {
    minWidth: 96,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: tone === 'filled' ? (lightMode ? THEME.surface : THEME.darkSurfaceAlt) : (lightMode ? THEME.canvas : THEME.darkSurface),
    borderWidth: 1,
    borderColor: tone === 'filled' ? (lightMode ? THEME.accentSoftStrong : THEME.darkBorder) : (lightMode ? THEME.border : THEME.darkBorder),
    borderCurve: 'continuous',
  }
}

function itemFactChipLabelStyle(lightMode = true) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  }
}

function itemFactChipValueStyle(tone, lightMode = true) {
  return {
    color: tone === 'filled' ? THEME.accentStrong : (lightMode ? THEME.ink : THEME.darkText),
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  }
}

function itemSummaryStripStyle(lightMode) {
  return {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

const summaryCellStyle = {
  flex: 1,
  minWidth: 100,
  gap: 3,
}

function summaryCellLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  }
}

function selectFieldStyle(lightMode) {
  return {
    minHeight: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function selectValueStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
  }
}

function inputLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  }
}

function stepperStyle(lightMode) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderRadius: 16,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    minHeight: 48,
  }
}

function stepperButtonStyle(lightMode) {
  return {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurface,
  }
}

function stepperButtonTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 18,
    fontWeight: '800',
  }
}

function stepperValueStyle(lightMode) {
  return {
    flex: 1,
    textAlign: 'center',
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    fontWeight: '700',
  }
}

const pickerBackdropStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
}

function pickerShellStyle(lightMode) {
  return {
    marginHorizontal: 24,
    marginTop: 180,
    borderRadius: 20,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  }
}

function pickerTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  }
}

const pickerListStyle = {
  gap: 10,
}

function pickerOptionStyle(lightMode) {
  return {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
  }
}

function pickerOptionTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
  }
}

function itemTitleStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  }
}

function itemMetaWrapStyle(isTablet) {
  return {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  }
}

function metricPillStyle(strong, isTablet, lightMode) {
  return {
    width: isTablet ? '23.5%' : '48%',
    minWidth: 0,
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: strong ? (lightMode ? THEME.accentSoft : THEME.darkSurfaceAlt) : (lightMode ? THEME.canvas : THEME.darkSurface),
    borderWidth: 1,
    borderColor: strong ? (lightMode ? THEME.accentSoftStrong : THEME.accent) : (lightMode ? THEME.border : THEME.darkBorder),
    borderCurve: 'continuous',
  }
}

function metricLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  }
}

function metricValueStyle(strong, lightMode) {
  return {
    color: strong ? THEME.accentStrong : (lightMode ? THEME.ink : THEME.darkText),
    fontSize: strong ? 12 : 11,
    lineHeight: strong ? 16 : 15,
    fontWeight: strong ? '800' : '700',
  }
}

function summaryCellValueStyle(strong, lightMode) {
  return {
    color: strong ? THEME.accentStrong : (lightMode ? THEME.ink : THEME.darkText),
    fontSize: strong ? 13 : 12,
    lineHeight: strong ? 17 : 16,
    fontWeight: strong ? '800' : '700',
  }
}
