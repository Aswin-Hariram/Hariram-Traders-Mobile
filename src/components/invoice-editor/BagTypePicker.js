import React from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { BAG_TYPE_OPTIONS } from '../../constants'
import { THEME } from '../InvoiceComponents'

export default function BagTypePicker({ visible, selectedItemId, lightMode = true, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={pickerBackdropStyle} onPress={onClose} />
      <View style={pickerShellStyle(lightMode)}>
        <Text style={pickerTitleStyle(lightMode)}>Choose bag type</Text>
        <ScrollView contentContainerStyle={pickerListStyle} keyboardShouldPersistTaps="handled">
          {BAG_TYPE_OPTIONS.map((type) => (
            <Pressable
              key={type}
              onPress={() => {
                if (selectedItemId) {
                  onSelect(selectedItemId, type)
                }
                onClose()
              }}
              style={({ pressed }) => [pickerOptionStyle(lightMode), pressed && { opacity: 0.8 }]}
            >
              <Text style={pickerOptionTextStyle(lightMode)}>{type}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
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
    shadowColor: '#000000',
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
