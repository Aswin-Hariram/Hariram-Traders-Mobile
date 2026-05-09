import React, { useMemo } from 'react'
import {
  Animated,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'

import { Swipeable } from 'react-native-gesture-handler'
import { formatCurrency } from '../utils'
import { THEME } from './InvoiceComponents'

export function BillCard({
  bill,
  color,
  lightMode,
  selectionMode,
  selected,
  menuOpen,
  onOpen,
  onLongPress,
  onToggleSelect,
  onOpenMenu,
  onEditAction,
  onShareAction,
  onDownloadAction,
  onDelete,
}) {
  const { width } = useWindowDimensions()
  const isNarrowPhone = width < 390
  const summaryItems = useMemo(
    () => getBillSummaryItems(bill),
    [bill]
  )

  const renderRightActions = (
    progress,
    dragX
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [1, 0.85],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        style={[
          deleteActionStyle(lightMode),
          {
            transform: [{ scale }],
          },
        ]}
      >
        <Pressable
          onPress={onDelete}
          style={deleteButtonStyle}
        >
          <Text style={deleteTextStyle}>
            Delete
          </Text>
        </Pressable>
      </Animated.View>
    )
  }

  return (
    <Swipeable
      enabled={!selectionMode}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <Pressable
        onPress={onOpen}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          billCardStyle(lightMode),
          pressed && {
            opacity: 0.96,
            transform: [{ scale: 0.99 }],
          },
        ]}
      >
        <View style={cardBodyStyle}>
          <View style={identityRowStyle}>
            <View
              style={[
                avatarBoxStyle(lightMode),
                color,
              ]}
            >
              <Text
                style={[
                  avatarTextStyle,
                  {
                    color: color.color,
                  },
                ]}
              >
                {getInitials(
                  bill.customerName ||
                    bill.invoiceNumber
                )}
              </Text>
            </View>

            <View style={billMainStyle}>
              <View style={cardTopRowStyle}>
                <View style={billTitleRowStyle}>
                  <Text
                    numberOfLines={1}
                    style={[billNameStyle(lightMode), billNameInlineStyle]}
                  >
                    {bill.customerName ||
                      'No customer linked'}
                  </Text>

                  <View style={invoiceTagStyle(lightMode)}>
                    <Text
                      numberOfLines={1}
                      style={invoiceTagTextStyle(lightMode)}
                    >
                      #{bill.invoiceNumber || 'Draft'}
                    </Text>
                  </View>
                </View>

                {selectionMode ? (
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.()
                      onToggleSelect?.()
                    }}
                    style={({ pressed }) => [
                      billSelectionToggleStyle(lightMode, selected),
                      pressed && { opacity: 0.82 },
                    ]}
                  >
                    <Feather
                      name={selected ? 'check-circle' : 'circle'}
                      size={18}
                      color={
                        selected
                          ? lightMode
                            ? THEME.accentStrong
                            : THEME.darkAccent
                          : lightMode
                            ? THEME.muted
                            : THEME.darkMuted
                      }
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    onPressIn={(event) => {
                      event.stopPropagation?.()
                    }}
                    onPress={(event) => {
                      event.stopPropagation?.()
                      onOpenMenu?.()
                    }}
                    style={({ pressed }) => [
                      billMenuTriggerStyle(lightMode),
                      pressed && { opacity: 0.82 },
                    ]}
                  >
                    <Feather
                      name="more-vertical"
                      size={16}
                      color={lightMode ? THEME.accentStrong : THEME.darkText}
                    />
                  </Pressable>
                )}
              </View>

              <Text
                numberOfLines={1}
                style={billMetaStyle(lightMode)}
              >
                {bill.customerPhone ||
                  bill.vehicleNumber ||
                  'Tap to open full bill'}
              </Text>
            </View>
          </View>

          <View style={summaryGridStyle}>
            {summaryItems.map((item) => (
              <SummaryCell
                key={item.label}
                lightMode={lightMode}
                label={item.label}
                value={item.value}
                wide={item.wide}
                icon={item.icon}
              />
            ))}
          </View>

          {menuOpen && !selectionMode ? (
            <View style={cardActionStripStyle(lightMode)}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.()
                  onEditAction?.()
                }}
                style={({ pressed }) => [
                  cardActionButtonStyle(lightMode, 'edit'),
                  pressed && { opacity: 0.86 },
                ]}
              >
                <Feather name="edit-3" size={16} color={lightMode ? THEME.accentStrong : THEME.darkText} />
                <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={cardActionButtonTextStyle(lightMode, 'edit', isNarrowPhone)}>Edit</Text>
              </Pressable>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.()
                  onShareAction?.()
                }}
                style={({ pressed }) => [
                  cardActionButtonStyle(lightMode, 'share'),
                  pressed && { opacity: 0.86 },
                ]}
              >
                <Feather name="share-2" size={16} color={lightMode ? THEME.accentStrong : THEME.darkText} />
                <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={cardActionButtonTextStyle(lightMode, 'share', isNarrowPhone)}>Share</Text>
              </Pressable>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.()
                  onDownloadAction?.()
                }}
                style={({ pressed }) => [
                  cardActionButtonStyle(lightMode, 'download'),
                  pressed && { opacity: 0.86 },
                ]}
              >
                <Feather name="download" size={16} color={lightMode ? '#ffffff' : '#09090b'} />
                <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={cardActionButtonTextStyle(lightMode, 'download', isNarrowPhone)}>Download</Text>
              </Pressable>
            </View>
          ) : null}

          <Text
            style={swipeHintStyle(
              lightMode
            )}
          >
            {selectionMode ? (selected ? 'Selected for combined PDF' : 'Tap to select this bill') : 'Swipe to delete'}
          </Text>
        </View>
      </Pressable>
    </Swipeable>
  )
}

// --------------------------------------------------
// Utility Functions
// --------------------------------------------------

function getInitials(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return '--'
  }

  return parts
    .map(
      (part) =>
        part[0]?.toUpperCase() || ''
    )
    .join('')
}

function formatShortDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(
    `${value}T00:00:00`
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
    }
  ).format(date)
}

function getBillSummaryItems(bill) {
  const itemCount = bill.itemCount || bill.items?.length || 0

  return [
    { label: 'Invoice date', value: formatShortDate(bill.invoiceDate), icon: 'calendar' },
    { label: 'Due date', value: bill.dueDate ? formatShortDate(bill.dueDate) : 'Not set', icon: 'clock' },
    { label: 'Items', value: `${itemCount} item${itemCount === 1 ? '' : 's'}`, icon: 'package' },
    { label: 'Supply', value: bill.placeOfSupply || 'Not set', icon: 'map-pin' },
    { label: 'Total', value: formatCurrency(bill.grandTotal || 0), wide: true, icon: 'credit-card' },
  ]
}

function SummaryCell({ lightMode, label, value, wide, icon }) {
  return (
    <View style={[summaryCellStyle(lightMode), wide && summaryCellWideStyle]}>
      <View style={summaryCellLabelRowStyle}>
        {icon ? (
          <Feather
            name={icon}
            size={12}
            color={lightMode ? THEME.accentStrong : THEME.darkAccent}
          />
        ) : null}
        <Text style={summaryCellLabelStyle(lightMode)}>
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[summaryCellValueStyle(lightMode), wide && summaryCellWideValueStyle(lightMode)]}
      >
        {value}
      </Text>
    </View>
  )
}

// --------------------------------------------------
// Styles
// --------------------------------------------------

export function billCardStyle(lightMode) {
  return {
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 26,
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurface,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    marginHorizontal: 2,
    marginVertical: 4,
    minHeight: 0,
    boxShadow: lightMode ? THEME.shadowSoft : '0 12px 28px rgba(0, 0, 0, 0.22)',
    borderCurve: 'continuous',
  }
}

export function avatarBoxStyle(
  lightMode
) {
  return {
    width:48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

export const avatarTextStyle = {
  fontSize: 18,
  fontWeight: '700',
  letterSpacing: 0.3,
  color: 'white',
}

const cardBodyStyle = {
  gap: 12,
  minWidth: 0,
}

const identityRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  minWidth: 0,
}

export const billMainStyle = {
  flex: 1,
  justifyContent: 'flex-center',
  
  gap: 8,
  minWidth: 0,
  marginVertical:'auto',
}

const cardTopRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  minWidth: 0,
}

const billTitleRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  gap: 8,
  minWidth: 0,
}

function billMenuTriggerStyle(lightMode) {
  return {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightMode ? THEME.surface : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function billSelectionToggleStyle(lightMode, selected) {
  return {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: selected
      ? lightMode
        ? THEME.accentSoft
        : THEME.darkSurfaceAlt
      : lightMode
        ? THEME.surface
        : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: selected
      ? lightMode
        ? THEME.accentSoftStrong
        : THEME.darkBorder
      : lightMode
        ? THEME.border
        : THEME.darkBorder,
  }
}

function cardActionStripStyle(lightMode) {
  return {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 18,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function cardActionButtonStyle(lightMode, tone) {
  const backgroundColor =
    tone === 'download'
      ? lightMode
        ? THEME.accentStrong
        : THEME.darkAccent
      : tone === 'share'
        ? lightMode
          ? THEME.accentSoft
          : THEME.darkSurfaceAlt
        : lightMode
          ? THEME.surface
          : THEME.darkSurface

  const borderColor =
    tone === 'download'
      ? lightMode
        ? THEME.accentStrong
        : THEME.darkAccent
      : tone === 'share'
        ? lightMode
          ? THEME.accentSoftStrong
          : THEME.darkBorder
        : lightMode
          ? THEME.border
          : THEME.darkBorder

  return {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor,
    borderWidth: 1,
    borderColor,
  }
}

function cardActionButtonTextStyle(lightMode, tone, isNarrowPhone = false) {
  return {
    flexShrink: 1,
    color:
      tone === 'download'
        ? lightMode
          ? '#ffffff'
          : '#09090b'
        : lightMode
          ? THEME.accentStrong
          : THEME.darkText,
    fontSize: isNarrowPhone ? 11 : 12,
    fontWeight: '800',
    lineHeight: isNarrowPhone ? 14 : 16,
    textAlign: 'center',
  }
}

export function billNameStyle(
  lightMode
) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.1,
  }
}

const billNameInlineStyle = {
  flexShrink: 1,
}

export const metaRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
}

export function billMetaStyle(
  lightMode
) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '500',
  }
}

function invoiceTagStyle(lightMode) {
  return {
    maxWidth: '58%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
  }
}

function invoiceTagTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.muted : THEME.darkMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.25,
  }
}

const summaryGridStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
}

function summaryCellStyle(lightMode) {
  return {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 118,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

const summaryCellWideStyle = {
  flexBasis: '100%',
}

const summaryCellLabelRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
}

function summaryCellLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  }
}

function summaryCellValueStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  }
}

function summaryCellWideValueStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  }
}

export function dotStyle(lightMode) {
  return {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.accentSoftStrong : THEME.darkBorder,
  }
}

export const billAsideStyle = {
  alignItems: 'flex-end',
  justifyContent: 'space-between',

  alignSelf: 'stretch',

  paddingLeft: 12,
}

export function swipeHintStyle(
  lightMode
) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'left',
  }
}

// --------------------------------------------------
// Swipe Delete Styles
// --------------------------------------------------

export function deleteActionStyle(
  lightMode
) {
  return {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 26,
    backgroundColor: lightMode ? THEME.danger : '#991b1b',
    width: 92,
  }
}

export const deleteButtonStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',

  width: '100%',
}

export const deleteTextStyle = {
  color: '#ffffff',
  fontSize: 12,
  fontWeight: '800',
  letterSpacing: 0.2,
}

export const pillBaseStyle = {
  paddingHorizontal: 12,
  paddingVertical: 5,
  borderRadius: 999,
}

export function billDeleteStyle(lightMode) {
  return {
    color: lightMode ? THEME.danger : '#ff9c8e',
    fontSize: 10,
    fontWeight: '700',
  }
}
