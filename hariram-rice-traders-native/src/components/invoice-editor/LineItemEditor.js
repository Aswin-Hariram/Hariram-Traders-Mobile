import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { calculateSummary, formatCurrency, formatNumber } from '../../utils'
import { ActionButton, FieldGrid, LabeledInput, THEME, fontFace } from '../InvoiceComponents'

export default function LineItemEditor({
  item,
  isTablet,
  lightMode = true,
  onItemChange,
  onRemoveItem,
  onOpenBagType,
}) {
  const lineSummary = calculateSummary([item])

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
          prefixText="₹"
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
        <ActionButton
          label="Remove item"
          variant="danger"
          fullWidth
          onPress={() => onRemoveItem(item.id)}
          lightMode={lightMode}
          iconName="trash-2"
        />
      </View>
    </View>
  )
}

function LabeledSelect({ label, value, placeholder, columns, onPress, leftIcon, lightMode = true }) {
  return (
    <View style={{ width: columns > 1 ? '48%' : '100%', gap: 6 }}>
      <Text style={inputLabelStyle(lightMode)}>{label}</Text>
      <Pressable onPress={onPress} style={[selectFieldStyle(lightMode), { flexDirection: 'row', alignItems: 'center' }]}>
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={16}
            color={lightMode ? THEME.subtle : THEME.darkMuted}
            style={{ marginRight: 8 }}
          />
        ) : null}
        <Text
          style={[
            selectValueStyle(lightMode),
            !value && { color: lightMode ? THEME.subtle : THEME.darkMuted },
            { flex: 1 },
          ]}
        >
          {value || placeholder}
        </Text>
      </Pressable>
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

function itemMetaWrapStyle(isTablet) {
  return {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  }
}

function inputLabelStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    ...fontFace('800'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 18,
  }
}

function stepperValueStyle(lightMode) {
  return {
    ...fontFace('700'),
    flex: 1,
    textAlign: 'center',
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
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
    backgroundColor: strong
      ? lightMode
        ? THEME.accentSoft
        : THEME.darkSurfaceAlt
      : lightMode
        ? THEME.canvas
        : THEME.darkSurface,
    borderWidth: 1,
    borderColor: strong
      ? lightMode
        ? THEME.accentSoftStrong
        : THEME.accent
      : lightMode
        ? THEME.border
        : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function metricLabelStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  }
}

function metricValueStyle(strong, lightMode) {
  return {
    ...fontFace(strong ? '800' : '700'),
    color: strong ? THEME.accentStrong : lightMode ? THEME.ink : THEME.darkText,
    fontSize: strong ? 14 : 12,
    lineHeight: strong ? 18 : 16,
  }
}
