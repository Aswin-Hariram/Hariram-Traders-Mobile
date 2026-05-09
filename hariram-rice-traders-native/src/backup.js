import { Platform } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

const BACKUP_FILE_PREFIX = 'hariram-rice-traders-backup'

export async function shareBackupFile(backupDocument) {
  if (Platform.OS === 'web') {
    throw new Error('Backup export is currently supported on iOS and Android builds.')
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.')
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error('The local cache folder is unavailable on this device.')
  }

  const exportedAt = backupDocument?.exportedAt || new Date().toISOString()
  const fileName = buildBackupFileName(exportedAt)
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupDocument, null, 2))

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save backup file',
    UTI: 'public.json',
  })

  return {
    fileName,
    fileUri,
  }
}

export async function pickBackupDocument() {
  if (Platform.OS === 'web') {
    throw new Error('Backup restore is currently supported on iOS and Android builds.')
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  })

  if (result.canceled || !result.assets?.length) {
    return null
  }

  const asset = result.assets[0]
  const fileContents = await FileSystem.readAsStringAsync(asset.uri)

  return {
    fileName: asset.name || 'backup.json',
    fileUri: asset.uri,
    contents: fileContents,
  }
}

function buildBackupFileName(exportedAt) {
  const safeTimestamp = String(exportedAt || new Date().toISOString())
    .replace(/[:.]/g, '-')
    .replace(/[^0-9A-Za-z_-]/g, '')

  return `${BACKUP_FILE_PREFIX}-${safeTimestamp || Date.now()}.json`
}
