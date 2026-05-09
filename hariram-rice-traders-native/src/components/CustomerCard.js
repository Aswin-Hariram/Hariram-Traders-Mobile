import React from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'

import {
  avatarBoxStyle,
  avatarTextStyle,
  billCardStyle,
  billMainStyle,
  billMetaStyle,
  billNameStyle,
  deleteActionStyle,
  deleteButtonStyle,
  deleteTextStyle,
  swipeHintStyle,
} from './BillCard'
import { THEME } from './InvoiceComponents'

export function CustomerCard({ customer, color, lightMode, onOpen, onCreateBill, onDelete }) {
  const summaryItems = getCustomerSummaryItems(customer)

  const renderRightActions = (progress, dragX) => {
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
        <Pressable onPress={onDelete} style={deleteButtonStyle}>
          <Text style={deleteTextStyle}>Delete</Text>
        </Pressable>
      </Animated.View>
    )
  }

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable onPress={onOpen} style={({ pressed }) => [billCardStyle(lightMode), pressed && { opacity: 0.92 }]}>
        <View style={customerCardBodyStyle}>
          <View style={customerIdentityRowStyle}>
            <View style={[avatarBoxStyle(lightMode), color]}>
              <Text style={[avatarTextStyle, { color: color.color }]}>{getInitials(customer.name || 'Customer')}</Text>
            </View>

            <View style={customerHeaderContentStyle}>
              <View style={customerHeaderRowStyle}>
                <View style={billMainStyle}>
                  <Text numberOfLines={1} style={billNameStyle(lightMode)}>
                    {customer.name || 'Unnamed customer'}
                  </Text>
                  <Text numberOfLines={1} style={billMetaStyle(lightMode)}>
                    {customer.email || customer.placeOfSupply || 'Tap to open full customer profile'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={customerSummaryGridStyle}>
            {summaryItems.map((item) => (
              <View key={item.label} style={customerSummaryCellStyle(lightMode)}>
                <Text style={customerSummaryLabelStyle(lightMode)}>{item.label}</Text>
                <Text numberOfLines={1} style={customerSummaryValueStyle(lightMode)}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={customerFooterRowStyle}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                onCreateBill()
              }}
              style={({ pressed }) => [customerActionChipStyle(lightMode), pressed && { opacity: 0.85 }]}
            >
              <Text style={customerActionChipTextStyle(lightMode)}>New bill</Text>
            </Pressable>
            <Text style={swipeHintStyle(lightMode)}>Swipe left to delete</Text>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  )
}

function getCustomerSummaryItems(customer) {
  return [
    { label: 'Phone', value: customer.phone || 'Not added' },
    { label: 'GSTIN', value: customer.gstin || 'Not added' },
    { label: 'Supply', value: customer.placeOfSupply || 'Not set' },
    { label: 'City', value: getCityFromAddress(customer.address) },
  ]
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

function getCityFromAddress(address) {
  if (!address) {
    return '-'
  }

  const parts = String(address).split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return parts[parts.length - 2].replace(/-\s*\d{6}/, '').trim()
  }

  return parts[0] || '-'
}

const customerCardBodyStyle = {
  flex: 1,
  gap: 12,
  minWidth: 0,
}

const customerIdentityRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
}

const customerHeaderContentStyle = {
  flex: 1,
  minWidth: 0,
  justifyContent: 'center',
  minHeight: 72,
}

const customerHeaderRowStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  minWidth: 0,
}

const customerSummaryGridStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'space-between',
}

function customerSummaryCellStyle(lightMode) {
  return {
    width: '48.5%',
    minWidth: 0,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 15,
    backgroundColor: lightMode ? THEME.canvas : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function customerSummaryLabelStyle(lightMode) {
  return {
    color: lightMode ? THEME.subtle : THEME.darkMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  }
}

function customerSummaryValueStyle(lightMode) {
  return {
    color: lightMode ? THEME.ink : THEME.darkText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  }
}

const customerFooterRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

function customerActionChipStyle(lightMode) {
  return {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: lightMode ? THEME.surfaceMuted : THEME.darkSurfaceAlt,
    borderWidth: 1,
    borderColor: lightMode ? THEME.border : THEME.darkBorder,
    borderCurve: 'continuous',
  }
}

function customerActionChipTextStyle(lightMode) {
  return {
    color: lightMode ? THEME.accentStrong : THEME.darkAccent,
    fontSize: 13,
    fontWeight: '700',
  }
}
