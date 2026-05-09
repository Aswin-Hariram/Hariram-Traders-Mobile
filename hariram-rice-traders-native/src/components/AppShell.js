import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { THEME, mutedTextStyle, panelStyle, sectionTitleStyle } from './InvoiceComponents'

export function AppShell({ children, backgroundColor = THEME.surface, statusBarStyle = 'dark' }) {
  const isDark = statusBarStyle === 'light'
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor, overflow: 'hidden', paddingTop: insets.top }}>
      <StatusBar style={statusBarStyle} />
      <BackdropDecoration isDark={isDark} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {children}
      </KeyboardAvoidingView>
    </View>
  )
}

function BackdropDecoration({ isDark }) {
  const orbLeftColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.98)'
  const orbRightColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(250, 252, 251, 0.96)'
  const orbInnerColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.92)'
  const contourColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(47, 123, 103, 0.04)'
  const beadColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(47, 123, 103, 0.05)'

  return (
    <View pointerEvents="none" style={backdropFrameStyle}>
      <View style={[backdropLeftOrbStyle, { backgroundColor: orbLeftColor }]} />
      <View style={[backdropLeftInnerOrbStyle, { backgroundColor: orbInnerColor }]} />
      <View style={[backdropRightOrbStyle, { backgroundColor: orbRightColor }]} />
      <View style={[backdropRightInnerOrbStyle, { backgroundColor: orbInnerColor }]} />

      <View style={backdropContourWrapStyle}>
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={`contour-${index}`} style={[backdropContourStyle(index), { borderColor: contourColor }]} />
        ))}
        {Array.from({ length: 24 }).map((_, index) => (
          <View key={`bead-${index}`} style={[backdropBeadStyle(index), { backgroundColor: beadColor }]} />
        ))}
      </View>
    </View>
  )
}

export function ScrollablePage({ children, isCompact, bottomPadding, onScroll, scrollEventThrottle = 16 }) {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={{
        paddingHorizontal: isCompact ? 5 : 16,
        paddingTop: isCompact ? 14 : 20,
        paddingBottom: (bottomPadding ?? (isCompact ? 30 : 40)) + insets.bottom,
        gap: isCompact ? 14 : 18,
      }}
    >
      {children}
    </ScrollView>
  )
}

export function PageContent({ children, isCompact, gapOverride }) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 1280,
        alignSelf: 'center',
        gap: gapOverride ?? (isCompact ? 16 : 20),
      }}
    >
      {children}
    </View>
  )
}

export function CenteredMessage({ title, body }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <View style={panelStyle}>
        <Text style={sectionTitleStyle}>{title}</Text>
        <Text style={mutedTextStyle}>{body}</Text>
      </View>
    </View>
  )
}

const absoluteFillStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}

const backdropFrameStyle = {
  ...absoluteFillStyle,
  overflow: 'hidden',
}

const backdropLeftOrbStyle = {
  position: 'absolute',
  top: 132,
  left: -150,
  width: 320,
  height: 320,
  borderRadius: 999,
}

const backdropLeftInnerOrbStyle = {
  position: 'absolute',
  top: 208,
  left: -42,
  width: 136,
  height: 136,
  borderRadius: 999,
}

const backdropRightOrbStyle = {
  position: 'absolute',
  top: 192,
  right: -164,
  width: 340,
  height: 340,
  borderRadius: 999,
}

const backdropRightInnerOrbStyle = {
  position: 'absolute',
  top: 286,
  right: -28,
  width: 144,
  height: 144,
  borderRadius: 999,
}

const backdropContourWrapStyle = {
  ...absoluteFillStyle,
}

function backdropContourStyle(index) {
  const isRightCluster = index < 6
  const clusterIndex = isRightCluster ? index : index - 6

  return {
    position: 'absolute',
    width: 132 + clusterIndex * 16,
    height: 132 + clusterIndex * 16,
    borderRadius: 999,
    borderWidth: 1,
    top: isRightCluster ? 160 + clusterIndex * 20 : undefined,
    right: isRightCluster ? -76 + clusterIndex * 12 : undefined,
    bottom: !isRightCluster ? 104 + clusterIndex * 20 : undefined,
    left: !isRightCluster ? -82 + clusterIndex * 12 : undefined,
  }
}

function backdropBeadStyle(index) {
  const isRightCluster = index < 12
  const clusterIndex = isRightCluster ? index : index - 12
  const column = clusterIndex % 2
  const row = Math.floor(clusterIndex / 2)

  return {
    position: 'absolute',
    width: row % 3 === 0 ? 8 : 6,
    height: row % 3 === 0 ? 8 : 6,
    borderRadius: 999,
    top: isRightCluster ? 208 + row * 24 : undefined,
    right: isRightCluster ? 22 + column * 18 : undefined,
    bottom: !isRightCluster ? 136 + row * 20 : undefined,
    left: !isRightCluster ? 22 + column * 18 : undefined,
  }
}
