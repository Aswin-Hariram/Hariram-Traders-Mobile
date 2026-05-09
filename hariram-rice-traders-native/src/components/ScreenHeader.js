import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ActionButton, THEME, fontFace } from './InvoiceComponents'

export default function ScreenHeader({
  title,
  actionLabel,
  onAction,
  onBack,
  isCompact,
  isWide,
  forceInlineAction = false,
  lightMode = true,
}) {
  const showInlineAction = Boolean(actionLabel && onAction && (isWide || forceInlineAction))
  const showStackedAction = Boolean(actionLabel && onAction && !isWide)

  return (
    <View style={screenHeaderToolbarStyle}>
      <View style={screenHeaderRowStyle}>
        <View style={screenHeaderBackWrapStyle}>
          <BackArrowButton onPress={onBack} lightMode={lightMode} />
        </View>

        <View style={screenHeaderTitleWrapStyle}>
          <Text
            numberOfLines={1}
            style={screenHeaderTitleStyle(isCompact, lightMode)}
          >
            {title}
          </Text>
        </View>

        <View style={screenHeaderActionWrapStyle(showInlineAction)}>
          {showInlineAction ? (
            <ActionButton
              label={actionLabel}
              onPress={onAction}
              variant="secondary"
              lightMode={lightMode}
              iconName="arrow-left"
            />
          ) : null}
        </View>
      </View>

      {showStackedAction && !forceInlineAction ? (
        <View style={screenHeaderStackedActionWrapStyle}>
          <ActionButton
            label={actionLabel}
            onPress={onAction}
            variant="secondary"
            fullWidth
            lightMode={lightMode}
            iconName="arrow-left"
          />
        </View>
      ) : null}
    </View>
  )
}

function BackArrowButton({ onPress, lightMode = true }) {
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
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: lightMode ? 0.08 : 0.22,
        shadowRadius: 6,
        elevation: 3,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Ionicons name="arrow-back" size={20} color={lightMode ? '#111827' : THEME.darkText} />
    </Pressable>
  )
}

const screenHeaderToolbarStyle = {
  gap: 12,
  paddingHorizontal: 2,
  paddingVertical: 2,
}

const screenHeaderRowStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
}

const screenHeaderBackWrapStyle = {
  minWidth: 54,
  minHeight: 54,
  justifyContent: 'center',
}

const screenHeaderTitleWrapStyle = {
  flex: 1,
  minWidth: 0,
  alignItems: 'flex-start',
  justifyContent: 'center',
  minHeight: 54,
}

function screenHeaderTitleStyle(isCompact, lightMode = true) {
  return {
    ...fontFace('800'),
    flexShrink: 1,
    textAlign: 'left',
    fontSize: isCompact ? 20 : 25,
    lineHeight: isCompact ? 24 : 30,
    color: lightMode ? THEME.ink : THEME.darkText,
  }
}

function screenHeaderActionWrapStyle(showInlineAction) {
  return {
    width: showInlineAction ? 210 : 0,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'flex-end',
  }
}

const screenHeaderStackedActionWrapStyle = {
  width: '100%',
}
