import { View, Text, TextInput } from 'react-native'
import { THEME } from './InvoiceComponents'

export function ModernInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
  fullWidth = false,
  columns = 1,
}) {
  return (
    <View style={wrapperStyle(fullWidth, columns)}>
      <Text style={labelStyle}>{label}</Text>

      <View style={inputContainer}>
        <TextInput
          value={value ?? ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor={THEME.subtle}
          style={[textInputStyle, multiline && multilineStyle]}
        />
      </View>
    </View>
  )
}

const wrapperStyle = (fullWidth, columns) => ({
  width: fullWidth
    ? '100%'
    : columns === 2
    ? '48%'
    : '100%',
  marginBottom: 22,
})

const labelStyle = {
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: THEME.accent,
  marginBottom: 10,
  marginLeft: 4,
}

const inputContainer = {
  backgroundColor: THEME.surface,
  borderWidth: 1.5,
  borderColor: THEME.borderStrong,
  borderRadius: 22,
  paddingHorizontal: 18,
  minHeight: 64,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.04,
  shadowRadius: 6,

  elevation: 2,
}

const textInputStyle = {
  flex: 1,
  fontSize: 17,
  color: THEME.ink,
  fontWeight: '500',
  paddingVertical: 18,
}

const multilineStyle = {
  paddingTop: 18,
}
