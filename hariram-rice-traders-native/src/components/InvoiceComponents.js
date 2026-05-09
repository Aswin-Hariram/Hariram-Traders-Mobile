import React, { useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Feather } from '@expo/vector-icons'

import {
  calculateItem,
  formatCurrency,
  formatDateInput,
  formatNumber,
  formatReadableDate,
  getIndianPhoneDigits,
} from '../utils'

export const THEME = {
  cream: '#f4fbf7',
  canvas: '#f9fdfb',
  surface: '#ffffff',
  surfaceMuted: '#eef8f2',
  accent: '#419676',
  accentStrong: '#2f7b67',
  accentSoft: '#dcefe6',
  accentSoftStrong: '#bddfce',
  ink: '#193127',
  muted: '#5f796f',
  subtle: '#8aa399',
  border: 'rgba(65, 150, 118, 0.16)',
  borderStrong: 'rgba(65, 150, 118, 0.28)',
  danger: '#d44b3e',
  shadowSoft: '0 18px 48px rgba(31, 86, 66, 0.10)',
  darkBackground: '#050505',
  darkSurface: '#0b0b0c',
  darkSurfaceAlt: '#141416',
  darkBorder: '#27272a',
  darkText: '#f5f5f5',
  darkMuted: '#a1a1aa',
  darkAccent: '#d4d4d8',
}

export const FONT_FAMILY = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
}

export function fontFace(weight = '500') {
  const key = String(weight)
  const familyByWeight = {
    '400': FONT_FAMILY.regular,
    '500': FONT_FAMILY.medium,
    '600': FONT_FAMILY.semibold,
    '700': FONT_FAMILY.bold,
    '800': FONT_FAMILY.extrabold,
    '900': FONT_FAMILY.extrabold,
    regular: FONT_FAMILY.regular,
    medium: FONT_FAMILY.medium,
    semibold: FONT_FAMILY.semibold,
    bold: FONT_FAMILY.bold,
    extrabold: FONT_FAMILY.extrabold,
    mono: FONT_FAMILY.mono,
  }

  return {
    fontFamily: familyByWeight[key] || FONT_FAMILY.medium,
  }
}

export const panelStyle = {
  gap: 18,
  padding: 10,
  borderRadius: 28,
  backgroundColor: THEME.surface,
  borderWidth: 1,
  borderColor: THEME.border,
  boxShadow: THEME.shadowSoft,
  borderCurve: 'continuous',
}

export const compactPanelStyle = {
  padding: 10,
  borderRadius: 24,
}

export const eyebrowStyle = {
  ...fontFace('800'),
  color: THEME.accent,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
}

export const sectionTitleStyle = {
  ...fontFace('800'),
  color: THEME.ink,
  fontSize: 22,
  lineHeight: 28,
}

export const summaryTitleStyle = {
  ...fontFace('800'),
  color: THEME.ink,
  fontSize: 18,
  lineHeight: 24,
}

export const invoiceTitleStyle = {
  ...fontFace('900'),
  color: THEME.ink,
  fontSize: 28,
  lineHeight: 34,
}

export const mutedTextStyle = {
  ...fontFace('500'),
  color: THEME.muted,
  fontSize: 14,
  lineHeight: 21,
}

export const heroCopyStyle = {
  ...fontFace('500'),
  color: THEME.muted,
  fontSize: 15,
  lineHeight: 22,
}

export const invoiceSheetStyle = {
  ...panelStyle,
  padding: 22,
  gap: 18,
}

export const compactInvoiceSheetStyle = {
  padding: 16,
  borderRadius: 24,
}

export const invoiceMetaCardStyle = {
  minWidth: 250,
  gap: 10,
  padding: 16,
  borderRadius: 20,
  backgroundColor: THEME.surfaceMuted,
  borderWidth: 1,
  borderColor: THEME.accentSoftStrong,
  borderCurve: 'continuous',
}

export const amountWordsCardStyle = {
  flex: 1,
  gap: 10,
  padding: 16,
  borderRadius: 20,
  backgroundColor: THEME.surface,
  borderWidth: 1,
  borderColor: THEME.border,
  borderCurve: 'continuous',
}

export function totalsCardStyle(lightMode = true) {
  return {
    width: '100%',
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  lightMode = true,
  iconName,
  iconPosition = 'left',
}) {
  const { width } = useWindowDimensions()
  const foregroundColor = actionButtonForegroundColor(variant, disabled, lightMode)
  const isNarrowPhone = width < 390
  const iconSize = isNarrowPhone ? 15 : 16

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        actionButtonStyle(variant, fullWidth, disabled, lightMode, isNarrowPhone),
        pressed && !disabled && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      {iconName && iconPosition === 'left' ? (
        <Feather name={iconName} size={iconSize} color={foregroundColor} />
      ) : null}
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        numberOfLines={1}
        style={actionButtonTextStyle(variant, disabled, lightMode, isNarrowPhone)}
      >
        {label}
      </Text>
      {iconName && iconPosition === 'right' ? (
        <Feather name={iconName} size={iconSize} color={foregroundColor} />
      ) : null}
    </Pressable>
  )
}

export function PanelHeader({ kicker, title, body, lightMode = true }) {
  return (
    <View style={{ gap: 6 }}>
      {kicker ? <Text style={[eyebrowStyle, !lightMode && { color: THEME.darkAccent }]}>{kicker}</Text> : null}
      <Text style={[sectionTitleStyle, !lightMode && { color: THEME.darkText }]}>{title}</Text>
      {body ? <Text style={[mutedTextStyle, !lightMode && { color: THEME.darkMuted }]}>{body}</Text> : null}
    </View>
  )
}

export function SectionCard({ kicker, title, children, lightMode = true, style }) {
  return (
    <View style={[sectionCardStyle(lightMode), style]}>
      {(kicker || title) ? <PanelHeader kicker={kicker} title={title} lightMode={lightMode} /> : null}
      {children}
    </View>
  )
}

export function FieldGrid({ children }) {
  return <View style={fieldGridStyle}>{children}</View>
}

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  fullWidth = false,
  columns = 1,
  editable = true,
  lightMode = true,
  fixedPrefix,
  trailingActionLabel,
  onTrailingActionPress,
  leftIcon,
  labelIcon,
  showInputIcon = true,
  prefixText,
}) {
  const isFixedPrefixInput = Boolean(fixedPrefix)
  const hasTrailingAction = Boolean(trailingActionLabel && onTrailingActionPress)
  const resolvedValue = value ?? ''
  const inputValue = isFixedPrefixInput ? getIndianPhoneDigits(resolvedValue) : resolvedValue
  const resolvedLeftIcon = showInputIcon ? leftIcon : undefined

  function handleChangeText(nextValue) {
    if (!isFixedPrefixInput) {
      onChangeText?.(nextValue)
      return
    }

    const digits = String(nextValue || '').replace(/\D/g, '').slice(0, 10)
    onChangeText?.(digits ? `${fixedPrefix} ${digits}` : '')
  }

  function handleClear() {
    onChangeText?.('')
  }

  return (
    <View style={inputWrapStyle(fullWidth, columns)}>
      <View style={inputLabelRowStyle}>
        {labelIcon ? (
          <Feather
            name={labelIcon}
            size={14}
            color={lightMode ? THEME.accentStrong : THEME.darkAccent}
          />
        ) : null}
        <Text style={[inputLabelStyle, !lightMode && { color: THEME.darkMuted }]}>{label}</Text>
      </View>
      <View
        style={[
          inputStyle,
          !lightMode && darkInputStyle,
          !editable && disabledInputStyle,
          !editable && !lightMode && darkDisabledInputStyle,
          multiline && multilineInputStyle,
          isFixedPrefixInput && prefixedInputContainerStyle,
        ]}
      >
        {isFixedPrefixInput ? (
          <View style={prefixedInputRowStyle}>
            {resolvedLeftIcon && (
              <Feather
                name={resolvedLeftIcon}
                size={16}
                color={lightMode ? THEME.subtle : THEME.darkMuted}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[inputPrefixStyle, !lightMode && { color: THEME.darkText }]}>{fixedPrefix}</Text>
            <TextInput
              value={inputValue}
              onChangeText={handleChangeText}
              placeholder={placeholder || `Type ${label.toLowerCase()}...`}
              keyboardType={keyboardType}
              multiline={multiline}
              editable={editable}
              textAlignVertical={multiline ? 'top' : 'center'}
              placeholderTextColor={lightMode ? THEME.subtle : THEME.darkMuted}
              style={[
                prefixedTextInputStyle,
                !lightMode && prefixedTextInputDarkStyle,
                multiline && prefixedMultilineInputStyle,
              ]}
            />
            {editable && inputValue.length > 0 && !hasTrailingAction ? (
              <Pressable onPress={handleClear} style={{ padding: 4, marginLeft: 4 }}>
                <Feather name="x-circle" size={16} color={lightMode ? THEME.subtle : THEME.darkMuted} />
              </Pressable>
            ) : null}
            {hasTrailingAction ? (
              <Pressable
                onPress={onTrailingActionPress}
                style={({ pressed }) => [
                  inputTrailingActionStyle(lightMode),
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Text style={inputTrailingActionTextStyle(lightMode)}>{trailingActionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={plainInputRowStyle}>
            {resolvedLeftIcon && (
              <Feather
                name={resolvedLeftIcon}
                size={16}
                color={lightMode ? THEME.subtle : THEME.darkMuted}
              />
            )}
            {prefixText ? (
              <Text style={[inputPrefixStyle, !lightMode && { color: THEME.darkText }]}>{prefixText}</Text>
            ) : null}
            <TextInput
              value={resolvedValue}
              onChangeText={handleChangeText}
              placeholder={placeholder || `Type ${label.toLowerCase()}...`}
              keyboardType={keyboardType}
              multiline={multiline}
              editable={editable}
              textAlignVertical={multiline ? 'top' : 'center'}
              placeholderTextColor={lightMode ? THEME.subtle : THEME.darkMuted}
              style={[
                inputContentStyle,
                !lightMode && inputContentDarkStyle,
                multiline && multilineContentStyle,
              ]}
            />
            {editable && resolvedValue.length > 0 && !hasTrailingAction ? (
              <Pressable onPress={handleClear} style={{ padding: 4, marginLeft: 4 }}>
                <Feather name="x-circle" size={16} color={lightMode ? THEME.subtle : THEME.darkMuted} />
              </Pressable>
            ) : null}
            {hasTrailingAction ? (
              <Pressable
                onPress={onTrailingActionPress}
                style={({ pressed }) => [
                  inputTrailingActionStyle(lightMode),
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Text style={inputTrailingActionTextStyle(lightMode)}>{trailingActionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  )
}

export function LabeledDateInput({
  label,
  value,
  onChangeText,
  placeholder = 'Select date',
  fullWidth = false,
  columns = 1,
  editable = true,
  clearable = false,
  lightMode = true,
  minimumDate,
  leftIcon,
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [draftDate, setDraftDate] = useState(resolvePickerDate(value))
  const hasValue = Boolean(String(value || '').trim())
  const minimumPickerDate = minimumDate ? resolvePickerDate(minimumDate) : undefined

  function openPicker() {
    if (!editable) {
      return
    }

    setDraftDate(resolvePickerDate(value))
    setIsPickerOpen(true)
  }

  function closePicker() {
    setIsPickerOpen(false)
  }

  function commitValue(nextDate) {
    onChangeText?.(formatDateInput(nextDate))
  }

  function handleNativeChange(event, nextDate) {
    if (Platform.OS === 'android') {
      setIsPickerOpen(false)

      if (event.type === 'set' && nextDate) {
        commitValue(nextDate)
      }

      return
    }

    if (nextDate) {
      setDraftDate(nextDate)
    }
  }

  function clearValue() {
    onChangeText?.('')
    setDraftDate(resolvePickerDate(''))
    closePicker()
  }

  return (
    <View style={inputWrapStyle(fullWidth, columns)}>
      <Text style={[inputLabelStyle, !lightMode && { color: THEME.darkMuted }]}>{label}</Text>
      <Pressable
        disabled={!editable}
        onPress={openPicker}
        style={({ pressed }) => [
          inputStyle,
          dateInputStyle(lightMode),
          !editable && disabledInputStyle,
          pressed && editable && { opacity: 0.92 },
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={16}
            color={lightMode ? THEME.subtle : THEME.darkMuted}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={dateInputTextStyle(hasValue, lightMode)}>{hasValue ? formatReadableDate(value) : placeholder}</Text>
        <Text style={dateInputActionStyle(lightMode)}>{editable ? 'Pick' : 'Locked'}</Text>
      </Pressable>
      {clearable && hasValue ? (
        <Pressable onPress={clearValue} style={({ pressed }) => [dateClearButtonStyle, pressed && { opacity: 0.75 }]}>
          <Text style={dateClearButtonTextStyle(lightMode)}>Clear date</Text>
        </Pressable>
      ) : null}

      {isPickerOpen ? (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible onRequestClose={closePicker} statusBarTranslucent>
            <View style={datePickerBackdropStyle}>
              <Pressable style={datePickerScrimStyle} onPress={closePicker} />
              <View style={datePickerSheetStyle(lightMode)}>
                <View style={datePickerHeaderStyle}>
                  <Text style={datePickerTitleStyle(lightMode)}>{label}</Text>
                  <Text style={datePickerSubtitleStyle(lightMode)}>
                    {hasValue ? formatReadableDate(formatDateInput(draftDate)) : 'Choose a date'}
                  </Text>
                </View>
                <DateTimePicker
                  value={draftDate}
                  mode="date"
                  display="inline"
                  minimumDate={minimumPickerDate}
                  themeVariant={lightMode ? 'light' : 'dark'}
                  onChange={handleNativeChange}
                  style={datePickerNativeStyle}
                />
                <View style={datePickerActionRowStyle}>
                  {clearable ? (
                    <Pressable onPress={clearValue} style={({ pressed }) => [datePickerGhostButtonStyle, pressed && { opacity: 0.8 }]}>
                      <Text style={datePickerGhostButtonTextStyle(lightMode)}>Clear</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <View style={datePickerActionGroupStyle}>
                    <Pressable onPress={closePicker} style={({ pressed }) => [datePickerGhostButtonStyle, pressed && { opacity: 0.8 }]}>
                      <Text style={datePickerGhostButtonTextStyle(lightMode)}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        commitValue(draftDate)
                        closePicker()
                      }}
                      style={({ pressed }) => [datePickerPrimaryButtonStyle(lightMode), pressed && { opacity: 0.9 }]}
                    >
                      <Text style={datePickerPrimaryButtonTextStyle(lightMode)}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="default"
            minimumDate={minimumPickerDate}
            themeVariant={lightMode ? 'light' : 'dark'}
            onChange={handleNativeChange}
          />
        )
      ) : null}
    </View>
  )
}

const inputLabelRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
}

export function MetaRow({ label, value, strong = false, isCompact = false, labelWidth = 112, lightMode = true }) {
  return (
    <View style={metaRowStyle(isCompact)}>
      <Text style={metaLabelStyle(labelWidth, isCompact, lightMode)}>{label}</Text>
      <Text selectable numberOfLines={2} style={metaValueStyle(strong, isCompact, lightMode)}>
        {value}
      </Text>
    </View>
  )
}

export function PartyCard({ title, lines, lightMode = true }) {
  return (
    <View style={partyCardStyle(lightMode)}>
      <Text style={[eyebrowStyle, !lightMode && { color: THEME.darkAccent }]}>{title}</Text>
      {lines.filter(Boolean).map((line, index) => (
        <Text
          key={`${title}-${index}`}
          selectable
          style={[
            index === 0 ? summaryTitleStyle : mutedTextStyle,
            !lightMode && { color: index === 0 ? THEME.darkText : THEME.darkMuted },
          ]}
        >
          {line}
        </Text>
      ))}
    </View>
  )
}

export function TableRow({ values, header = false, lightMode = true }) {
  return (
    <View style={[tableRowStyle(lightMode), header && tableHeaderRowStyle(lightMode)]}>
      {values.map((value, index) => (
        <View key={`${index}-${value}`} style={[tableCellStyle(lightMode), index === 1 && tableDescriptionCellStyle]}>
          <Text
            style={[
              tableTextStyle(lightMode),
              header ? tableHeaderTextStyle : null,
              !header && index !== 1 ? tableMonoTextStyle : null,
            ]}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function MobilePreviewItemCard({ item, totals, index, lightMode = true }) {
  return (
    <View style={mobileItemCardStyle(lightMode)}>
      <View style={{ gap: 4 }}>
        <Text style={[eyebrowStyle, !lightMode && { color: THEME.darkAccent }]}>Item {index + 1}</Text>
        <Text style={[summaryTitleStyle, !lightMode && { color: THEME.darkText }]}>{item.description || 'Untitled item'}</Text>
        <Text style={[mutedTextStyle, !lightMode && { color: THEME.darkMuted }]}>
          {item.bagType || '-'} • HSN {item.hsn || '-'} 
        </Text>
      
      <MetaRow label="Quantity" value={formatNumber(item.quantity)} lightMode={lightMode} /></View>
      <MetaRow label="Rate" value={formatCurrency(item.rate)} lightMode={lightMode} />
      <MetaRow label="GST" value={`${formatNumber(item.gstRate)}%`} lightMode={lightMode} />
      <MetaRow label="Taxable" value={formatCurrency(totals.taxable)} lightMode={lightMode} />
      <MetaRow label="Line Total" value={formatCurrency(totals.lineTotal)} strong lightMode={lightMode} />
    </View>
  )
}

export function InvoiceSummaryCard({ summary, cgstLabel, sgstLabel, lightMode = true }) {
  return (
    <View style={totalsCardStyle(lightMode)}>
      <MetaRow label="Taxable value" value={formatCurrency(summary.taxableTotal)} lightMode={lightMode} />
      <MetaRow label={cgstLabel} value={formatCurrency(summary.cgstTotal)} lightMode={lightMode} />
      <MetaRow label={sgstLabel} value={formatCurrency(summary.sgstTotal)} lightMode={lightMode} />
      <View style={{ borderTopWidth: 1, borderTopColor: lightMode ? THEME.border : THEME.darkBorder, paddingTop: 10 }}>
        <MetaRow label="Grand total" value={formatCurrency(summary.grandTotal)} strong lightMode={lightMode} />
      </View>
    </View>
  )
}

export function CompactItemPreview({ item, lightMode = true }) {
  const totals = calculateItem(item)

  return (
    <View style={compactItemPreviewStyle(lightMode)}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[summaryTitleStyle, !lightMode && { color: THEME.darkText }]}>{item.description || 'Untitled item'}</Text>
        <Text style={[mutedTextStyle, !lightMode && { color: THEME.darkMuted }]}>
          {formatNumber(item.quantity)} x {formatCurrency(item.rate)} • GST {formatNumber(item.gstRate)}%
        </Text>
      </View>
      <Text style={[summaryTitleStyle, !lightMode && { color: THEME.darkText }]}>{formatCurrency(totals.lineTotal)}</Text>
    </View>
  )
}

function actionButtonStyle(variant, fullWidth, disabled, lightMode, isNarrowPhone) {
  const backgrounds = {
    primary: THEME.accentStrong,
    secondary: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    soft: lightMode ? THEME.accentSoft : THEME.darkSurfaceAlt,
    danger: THEME.danger,
  }

  const borderColors = {
    primary: THEME.accentStrong,
    secondary: lightMode ? THEME.borderStrong : THEME.darkBorder,
    soft: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
    danger: THEME.danger,
  }

  return {
    minHeight: 50,
    minWidth: fullWidth || isNarrowPhone ? 0 : 140,
    width: fullWidth ? '100%' : undefined,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isNarrowPhone ? 12 : 16,
    paddingVertical: 12,
    gap: isNarrowPhone ? 6 : 8,
    borderRadius: 16,
    backgroundColor: disabled ? '#d6d0c8' : backgrounds[variant] || backgrounds.primary,
    borderWidth: 1,
    borderColor: disabled ? '#d6d0c8' : borderColors[variant] || borderColors.primary,
    borderCurve: 'continuous',
  }
}

function actionButtonForegroundColor(variant, disabled, lightMode) {
  const colors = {
    primary: '#ffffff',
    secondary: lightMode ? THEME.accentStrong : THEME.darkAccent,
    soft: lightMode ? THEME.accentStrong : THEME.darkAccent,
    danger: '#ffffff',
  }

  return disabled ? '#8f877d' : colors[variant] || colors.primary
}

function actionButtonTextStyle(variant, disabled, lightMode, isNarrowPhone) {
  return {
    ...fontFace('800'),
    flexShrink: 1,
    color: actionButtonForegroundColor(variant, disabled, lightMode),
    fontSize: isNarrowPhone ? 14 : 15,
    lineHeight: isNarrowPhone ? 18 : 20,
    letterSpacing: 0.15,
    textAlign: 'center',
  }
}

function sectionCardStyle(lightMode) {
  return {
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

const fieldGridStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
}

function inputWrapStyle(fullWidth, columns) {
  return {
    width: fullWidth ? '100%' : columns > 1 ? '48%' : '100%',
    gap: 6,
  }
}

const inputLabelStyle = {
  ...fontFace('700'),
  color: THEME.subtle,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}

const inputStyle = {
  ...fontFace('500'),
  minHeight: 48,
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 16,
  backgroundColor: THEME.surface,
  borderWidth: 1,
  borderColor: THEME.border,
  color: THEME.ink,
  fontSize: 15,
  lineHeight: 20,
}

const multilineInputStyle = {}

const disabledInputStyle = {
  color: THEME.subtle,
}

const darkInputStyle = {
  backgroundColor: THEME.darkSurfaceAlt,
  borderColor: THEME.darkBorder,
  color: THEME.darkText,
}

const darkDisabledInputStyle = {
  color: THEME.darkMuted,
}

const inputContentStyle = {
  ...fontFace('500'),
  flex: 1,
  color: THEME.ink,
  fontSize: 15,
  lineHeight: 20,
  padding: 0,
}

const inputContentDarkStyle = {
  color: THEME.darkText,
}

const multilineContentStyle = {}

const prefixedInputContainerStyle = {
  justifyContent: 'center',
}

const prefixedInputRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
}

const plainInputRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
}

const inputPrefixStyle = {
  ...fontFace('800'),
  color: THEME.ink,
  fontSize: 15,
  lineHeight: 20,
}

const prefixedTextInputStyle = {
  ...fontFace('500'),
  flex: 1,
  color: THEME.ink,
  fontSize: 15,
  lineHeight: 20,
  padding: 0,
}

const prefixedTextInputDarkStyle = {
  color: THEME.darkText,
}

const prefixedMultilineInputStyle = {}

function inputTrailingActionStyle(lightMode) {
  return {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.accentSoft : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
  }
}

function inputTrailingActionTextStyle(lightMode) {
  return {
    ...fontFace('800'),
    color: lightMode ? THEME.accentStrong : THEME.darkText,
    fontSize: 11,
    letterSpacing: 0.2,
  }
}

function dateInputStyle(lightMode) {
  return {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function dateInputTextStyle(hasValue, lightMode) {
  return {
    ...fontFace('500'),
    color: hasValue ? (lightMode ? THEME.ink : THEME.darkText) : lightMode ? THEME.subtle : THEME.darkMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingRight: 12,
  }
}

function dateInputActionStyle(lightMode) {
  return {
    ...fontFace('800'),
    color: lightMode ? THEME.accent : THEME.darkAccent,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  }
}

const dateClearButtonStyle = {
  alignSelf: 'flex-start',
  marginTop: 6,
}

function dateClearButtonTextStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12,
  }
}

const datePickerBackdropStyle = {
  flex: 1,
  justifyContent: 'center',
  padding: 20,
}

const datePickerScrimStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(13, 23, 19, 0.32)',
}

function datePickerSheetStyle(lightMode) {
  return {
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    padding: 18,
    gap: 14,
  }
}

const datePickerHeaderStyle = {
  gap: 4,
}

function datePickerTitleStyle(lightMode) {
  return {
    ...fontFace('800'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 18,
  }
}

function datePickerSubtitleStyle(lightMode) {
  return {
    ...fontFace('500'),
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 13,
  }
}

const datePickerNativeStyle = {
  alignSelf: 'stretch',
}

const datePickerActionRowStyle = {
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
}

const datePickerActionGroupStyle = {
  alignItems: 'center',
  flexDirection: 'row',
  gap: 10,
}

const datePickerGhostButtonStyle = {
  paddingHorizontal: 12,
  paddingVertical: 10,
}

function datePickerGhostButtonTextStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 14,
  }
}

function datePickerPrimaryButtonStyle(lightMode) {
  return {
    backgroundColor: lightMode ? THEME.accentStrong : THEME.darkAccent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  }
}

function datePickerPrimaryButtonTextStyle(lightMode) {
  return {
    ...fontFace('800'),
    color: lightMode ? '#ffffff' : '#09090b',
    fontSize: 14,
  }
}

function resolvePickerDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(year, month - 1, day)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

function metaRowStyle(isCompact) {
  return {
    flexDirection: isCompact ? 'column' : 'row',
    alignItems: isCompact ? 'flex-start' : 'flex-start',
    gap: 8,
  }
}

function metaLabelStyle(labelWidth, isCompact, lightMode) {
  return {
    ...fontFace('700'),
    width: isCompact ? '100%' : labelWidth,
    flexShrink: 0,
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 14,
    lineHeight: 19,
  }
}

function metaValueStyle(strong, isCompact, lightMode) {
  return {
    ...fontFace(strong ? '800' : '600'),
    flex: 1,
    minWidth: 0,
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: strong ? 16 : 14,
    lineHeight: strong ? 22 : 20,
    textAlign: isCompact ? 'left' : 'right',
  }
}

function partyCardStyle(lightMode) {
  return {
    flex: 1,
    gap: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function tableRowStyle(lightMode) {
  return {
    flexDirection: 'row',
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
  }
}

function tableHeaderRowStyle(lightMode) {
  return {
    backgroundColor: lightMode ? THEME.accentSoft : THEME.darkSurfaceAlt,
  }
}

function tableCellStyle(lightMode) {
  return {
    flex: 1,
    minWidth: 86,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

const tableDescriptionCellStyle = {
  flex: 2,
  minWidth: 180,
}

function tableTextStyle(lightMode) {
  return {
    ...fontFace('500'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 13,
    lineHeight: 18,
  }
}

const tableHeaderTextStyle = {
  ...fontFace('800'),
}

const tableMonoTextStyle = {
  ...fontFace('mono'),
}

function mobileItemCardStyle(lightMode) {
  return {
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function compactItemPreviewStyle(lightMode) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

export function CustomerSelector({ customers, selectedCustomerId, onSelectCustomer, lightMode = true }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const displayName = selectedCustomer ? selectedCustomer.name : 'Select a customer'
  const customerMeta = [selectedCustomer?.phone, selectedCustomer?.gstin].filter(Boolean).join(' • ')

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={({ pressed }) => [
          customerSelectorTriggerStyle(lightMode),
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={customerSelectorTriggerContentStyle}>
          <View style={customerInitialBadgeStyle(!!selectedCustomer, lightMode)}>
            <Text style={customerInitialBadgeTextStyle(!!selectedCustomer, lightMode)}>
              {getCustomerInitials(selectedCustomer?.name)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={customerSelectorLabelStyle(lightMode)}>
              {selectedCustomer ? 'Linked customer' : 'Customer profile'}
            </Text>
            <Text numberOfLines={1} style={customerSelectorValueStyle(!!selectedCustomer, lightMode)}>
              {displayName}
            </Text>
            {customerMeta ? (
              <Text numberOfLines={1} style={customerSelectorMetaStyle(lightMode)}>
                {customerMeta}
              </Text>
            ) : (
              <Text numberOfLines={1} style={customerSelectorHintStyle(lightMode)}>
                Search saved customers and attach their billing details
              </Text>
            )}
          </View>
        </View>
        <View style={customerSelectorChevronWrapStyle(lightMode)}>
          <Text style={customerSelectorChevronStyle(lightMode)}>{isOpen ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {isOpen && (
        <View style={customerSelectorMenuStyle(lightMode)}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            borderBottomWidth: 1,
            borderBottomColor: lightMode ? THEME.border : THEME.darkBorder,
          }}>
            <Feather name="search" size={16} color={lightMode ? THEME.subtle : THEME.darkMuted} style={{ marginRight: 8,padding:10 }} />
            <TextInput
              placeholder="Search customer..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={lightMode ? THEME.subtle : THEME.darkMuted}
              style={{
                flex: 1,
                paddingVertical: 20,
                fontSize: 14,
                color: lightMode ? THEME.ink : THEME.darkText,
              }}
            />
            {searchText.length > 0 ? (
              <Pressable onPress={() => setSearchText('')} style={{ padding: 4, marginLeft: 4 }}>
                <Feather name="x-circle" size={16} color={lightMode ? THEME.subtle : THEME.darkMuted} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView>
            {!filteredCustomers.length ? (
              <View style={customerSearchEmptyStyle}>
                <Text style={customerSearchEmptyTitleStyle(lightMode)}>No matches found</Text>
                <Text style={customerSearchEmptyBodyStyle(lightMode)}>
                  Try a different name or add the customer from the customer screen first.
                </Text>
              </View>
            ) : null}
            {filteredCustomers.map((customer) => (
              <Pressable
                key={customer.id}
                onPress={() => {
                  onSelectCustomer(customer)
                  setIsOpen(false)
                  setSearchText('')
                }}
                style={({ pressed }) => [
                  customerSearchRowStyle(customer.id === selectedCustomerId, lightMode),
                  pressed && { opacity: 0.7 },

                ]}
              >
                <View style={customerSearchRowContentStyle}>
                  <View style={customerSearchAvatarStyle(customer.id === selectedCustomerId, lightMode)}>
                    <Text style={customerSearchAvatarTextStyle(customer.id === selectedCustomerId, lightMode)}>
                      {getCustomerInitials(customer.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={customerSearchNameStyle(customer.id === selectedCustomerId, lightMode)}>
                      {customer.name}
                    </Text>
                    <Text numberOfLines={1} style={customerSearchMetaStyle(lightMode)}>
                      {[customer.phone, customer.gstin || customer.placeOfSupply]
                        .filter(Boolean)
                        .join(' • ') || 'No extra details yet'}
                    </Text>
                  </View>
                  {customer.id === selectedCustomerId ? (
                    <View style={customerSelectedPillStyle(lightMode)}>
                      <Text style={customerSelectedPillTextStyle(lightMode)}>Selected</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

export function CustomerInfoCard({ invoice, isTablet, lightMode = true }) {
  const selectedCustomer = invoice.customerId
  const hasCustomerData =
    invoice.customerName ||
    invoice.customerPhone ||
    invoice.customerGstin ||
    invoice.customerEmail ||
    invoice.customerAddress ||
    invoice.placeOfSupply

  if (!selectedCustomer && !hasCustomerData) {
    return null
  }

  const infoItems = [
    { label: 'Phone', value: invoice.customerPhone },
    { label: 'GSTIN', value: invoice.customerGstin },
    { label: 'Email', value: invoice.customerEmail },
    { label: 'Place of supply', value: invoice.placeOfSupply },
    { label: 'Address', value: invoice.customerAddress, wide: true },
  ].filter((item) => item.value)

  const name = invoice.customerName || 'Customer details'
  const headerTag = selectedCustomer ? 'Saved profile' : 'Manual snapshot'
  const headerCopy = selectedCustomer
    ? 'This invoice will keep a snapshot of the linked customer details.'
    : 'These customer details are stored only on this invoice unless you save them as a profile.'

  return (
    <View style={customerInfoCardStyle(lightMode)}>
      <View style={customerInfoHeroStyle(lightMode)}>
        <View style={customerInfoHeroRowStyle}>
          <View style={customerInfoBadgeStyle(!!selectedCustomer, lightMode)}>
            <Text style={customerInfoBadgeTextStyle(!!selectedCustomer, lightMode)}>{getCustomerInitials(name)}</Text>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <View style={customerInfoTagStyle(!!selectedCustomer, lightMode)}>
              <Text style={customerInfoTagTextStyle(!!selectedCustomer, lightMode)}>{headerTag}</Text>
            </View>
            <Text style={customerInfoNameStyle(lightMode)}>{name}</Text>
            <Text style={customerInfoHelpStyle(lightMode)}>{headerCopy}</Text>
          </View>
        </View>
      </View>

      {infoItems.length ? (
        <View style={customerInfoGridStyle}>
          {infoItems.map((item) => (
            <View
              key={item.label}
              style={[
                customerInfoCellStyle(lightMode),
                item.wide && customerInfoCellWideStyle,
                item.wide && !isTablet && { minWidth: '100%' },
              ]}
            >
              <Text style={customerInfoCellLabelStyle(lightMode)}>{item.label}</Text>
              <Text style={customerInfoCellValueStyle(item.wide, lightMode)}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function getCustomerInitials(name) {
  if (!name) {
    return 'CU'
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return 'CU'
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('')
}

function customerSelectorTriggerStyle(lightMode) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderCurve: 'continuous',
  }
}

const customerSelectorTriggerContentStyle = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
}

function customerInitialBadgeStyle(isSelected, lightMode) {
  return {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected ? (lightMode ? THEME.accentSoft : THEME.darkSurface) : lightMode ? THEME.canvas : THEME.darkSurface,
    borderWidth: 1,
    borderColor: isSelected ? (lightMode ? THEME.accentSoftStrong : THEME.darkBorder) : lightMode ? THEME.border : THEME.darkBorder,
  }
}

function customerInitialBadgeTextStyle(isSelected, lightMode) {
  return {
    ...fontFace('800'),
    color: isSelected ? (lightMode ? THEME.accentStrong : THEME.darkAccent) : lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 14,
    letterSpacing: 0.3,
  }
}

function customerSelectorLabelStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  }
}

function customerSelectorValueStyle(isSelected, lightMode) {
  return {
    ...fontFace('700'),
    color: isSelected ? (lightMode ? THEME.ink : THEME.darkText) : lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 15,
  }
}

function customerSelectorMetaStyle(lightMode) {
  return {
    ...fontFace('600'),
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12.5,
    lineHeight: 17,
  }
}

function customerSelectorHintStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 12.5,
    lineHeight: 17,
  }
}

function customerSelectorChevronWrapStyle(lightMode) {
  return {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurface,
  }
}

function customerSelectorChevronStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 14,
  }
}

function customerSelectorMenuStyle(lightMode) {
  return {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    overflow: 'hidden',
    maxHeight: 320,
    borderCurve: 'continuous',
  }
}

const customerSearchInputStyle = {
  ...fontFace('500'),
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: THEME.border,
  fontSize: 14,
  color: THEME.ink,
}

const customerSearchEmptyStyle = {
  gap: 4,
  paddingHorizontal: 14,
  paddingVertical: 16,
}

function customerSearchEmptyTitleStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 14,
  }
}

function customerSearchEmptyBodyStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12.5,
    lineHeight: 18,
  }
}

function customerSearchRowStyle(isSelected, lightMode) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightMode ? THEME.border : THEME.darkBorder,
    backgroundColor: isSelected ? (lightMode ? THEME.accentSoft : THEME.darkSurface) : lightMode ? THEME.surface : THEME.darkSurfaceAlt,
  }
}

const customerSearchRowContentStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 5,
  gap: 12,
}

function customerSearchAvatarStyle(isSelected, lightMode) {
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected ? (lightMode ? THEME.surface : THEME.darkSurfaceAlt) : lightMode ? THEME.canvas : THEME.darkSurface,
    borderWidth: 1,
    borderColor: isSelected ? (lightMode ? THEME.accentSoftStrong : THEME.darkBorder) : lightMode ? THEME.border : THEME.darkBorder,
  }
}

function customerSearchAvatarTextStyle(isSelected, lightMode) {
  return {
    ...fontFace('800'),
    color: isSelected ? (lightMode ? THEME.accentStrong : THEME.darkAccent) : lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 12.5,
  }
}

function customerSearchNameStyle(isSelected, lightMode) {
  return {
    ...fontFace('700'),
    color: isSelected ? (lightMode ? THEME.accentStrong : THEME.darkAccent) : lightMode ? THEME.ink : THEME.darkText,
    fontSize: 14,
  }
}

function customerSearchMetaStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 12.5,
    lineHeight: 17,
  }
}

function customerSelectedPillStyle(lightMode) {
  return {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
  }
}

function customerSelectedPillTextStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 11.5,
  }
}

function customerInfoCardStyle(lightMode) {
  return {
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function customerInfoHeroStyle(lightMode) {
  return {
    padding: 14,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

const customerInfoHeroRowStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
}

function customerInfoBadgeStyle(isSelected, lightMode) {
  return {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected ? (lightMode ? THEME.accentStrong : THEME.darkAccent) : lightMode ? THEME.canvas : THEME.darkSurfaceAlt,
  }
}

function customerInfoBadgeTextStyle(isSelected, lightMode) {
  return {
    ...fontFace('800'),
    color: isSelected ? (lightMode ? '#ffffff' : '#09090b') : lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 16,
    letterSpacing: 0.35,
  }
}

function customerInfoTagStyle(isSelected, lightMode) {
  return {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: isSelected ? (lightMode ? THEME.accentSoft : THEME.darkSurfaceAlt) : lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: isSelected ? (lightMode ? THEME.accentSoftStrong : THEME.darkBorder) : lightMode ? THEME.border : THEME.darkBorder,
  }
}

function customerInfoTagTextStyle(isSelected, lightMode) {
  return {
    ...fontFace('700'),
    color: isSelected ? (lightMode ? THEME.accentStrong : THEME.darkAccent) : lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 11.5,
    letterSpacing: 0.25,
  }
}

function customerInfoNameStyle(lightMode) {
  return {
    ...fontFace('800'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 20,
    lineHeight: 25,
  }
}

function customerInfoHelpStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 13,
    lineHeight: 19,
  }
}

const customerInfoGridStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
}

function customerInfoCellStyle(lightMode) {
  return {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 124,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

const customerInfoCellWideStyle = {
  flexBasis: '100%',
}

function customerInfoCellLabelStyle(lightMode) {
  return {
    ...fontFace('700'),
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  }
}

function customerInfoCellValueStyle(isWide, lightMode) {
  return {
    ...fontFace(isWide ? '700' : '600'),
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: isWide ? 14 : 13.5,
    lineHeight: isWide ? 20 : 18,
  }
}
