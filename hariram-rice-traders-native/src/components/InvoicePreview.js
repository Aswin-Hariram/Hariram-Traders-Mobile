import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { calculateItem, convertAmountToWords, formatCurrency, formatNumber, formatReadableDate } from '../utils'
import {
  ActionButton,
  MetaRow,
  MobilePreviewItemCard,
  PartyCard,
  THEME,
  TableRow,
  amountWordsCardStyle,
  compactInvoiceSheetStyle,
  eyebrowStyle,
  invoiceMetaCardStyle,
  invoiceSheetStyle,
  invoiceTitleStyle,
  mutedTextStyle,
  summaryTitleStyle,
  totalsCardStyle,
} from './InvoiceComponents'

export default function InvoicePreview({
  invoice,
  summary,
  cgstLabel,
  sgstLabel,
  showCompactPreview,
  isCompact,
  isWide,
  busyAction,
  onBack,
  onSave,
  onShare,
  onDownload,
}) {
  return (
    <View style={[invoiceSheetStyle, isCompact && compactInvoiceSheetStyle]}>
      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={eyebrowStyle}>Tax Invoice</Text>
          <Text selectable style={invoiceTitleStyle}>
            {invoice.companyName}
          </Text>
          <Text selectable style={mutedTextStyle}>
            {invoice.companyTagline}
          </Text>
          <Text selectable style={mutedTextStyle}>
            {invoice.companyAddress}
          </Text>
        </View>

        <View style={[invoiceMetaCardStyle, !isWide && { minWidth: 0, width: '100%' }]}>
          <MetaRow label="Invoice No." value={invoice.invoiceNumber} valueAlign="right" />
          <MetaRow label="Invoice Date" value={formatReadableDate(invoice.invoiceDate)} valueAlign="right" />
          <MetaRow label="Due Date" value={formatReadableDate(invoice.dueDate)} valueAlign="right" />
          <MetaRow label="Place of Supply" value={invoice.placeOfSupply || '-'} valueAlign="right" />
        </View>
      </View>

      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          gap: 14,
        }}
      >
        <PartyCard
          title="Bill From"
          lines={[
            invoice.companyName,
            `Phone: ${invoice.companyPhone || '-'}`,
            `GSTIN: ${invoice.companyGstin || '-'}`,
            `Email: ${invoice.companyEmail || '-'}`,
            invoice.companyAddress,
          ]}
        />
        <PartyCard
          title="Bill To"
          lines={[
            invoice.customerName,
            `Phone: ${invoice.customerPhone || '-'}`,
            `GSTIN: ${invoice.customerGstin || '-'}`,
            `Email: ${invoice.customerEmail || '-'}`,
            invoice.customerAddress,
          ]}
        />
      </View>

      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          justifyContent: 'space-between',
          gap: 10,
          backgroundColor: THEME.surfaceMuted,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: THEME.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderCurve: 'continuous',
        }}
      >
        <Text selectable style={mutedTextStyle}>
          Vehicle No.: {invoice.vehicleNumber || '-'}
        </Text>
        <Text selectable style={mutedTextStyle}>
          Total Items: {invoice.items.length}
        </Text>
      </View>

      {showCompactPreview ? (
        <View style={{ gap: 12 }}>
          {invoice.items.map((item, index) => {
            const totals = calculateItem(item)

            return <MobilePreviewItemCard key={item.id} index={index} item={item} totals={totals} />
          })}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            minWidth: 760,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: THEME.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <TableRow
              header
              values={['#', 'Description', 'Bag Type', 'HSN', 'Qty', 'Rate', 'GST %', 'Amount']}
            />
            {invoice.items.map((item, index) => {
              const totals = calculateItem(item)

              return (
                <TableRow
                  key={item.id}
                  values={[
                    String(index + 1),
                    `${item.description}\n${item.unit}`,
                    item.bagType || '-',
                    item.hsn || '-',
                    formatNumber(item.quantity),
                    formatCurrency(item.rate),
                    `${formatNumber(item.gstRate)}%`,
                    formatCurrency(totals.lineTotal),
                  ]}
                />
              )
            })}
          </View>
        </ScrollView>
      )}

      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          gap: 16,
        }}
      >
        <View style={amountWordsCardStyle}>
          <Text style={eyebrowStyle}>Amount in words</Text>
          <Text selectable style={summaryTitleStyle}>
            {convertAmountToWords(summary.grandTotal)}
          </Text>
        </View>

        <View style={totalsCardStyle()}>
          <MetaRow label="Quantity" value={formatNumber(summary.quantityTotal)} valueAlign="right" />
          <MetaRow label="Taxable value" value={formatCurrency(summary.taxableTotal)} valueAlign="right" />
          <MetaRow label={cgstLabel} value={formatCurrency(summary.cgstTotal)} valueAlign="right" />
          <MetaRow label={sgstLabel} value={formatCurrency(summary.sgstTotal)} valueAlign="right" />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: THEME.border,
              paddingTop: 10,
            }}
          >
            <MetaRow
              label="Grand total"
              value={formatCurrency(summary.grandTotal)}
              strong
              valueAlign="right"
            />
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          justifyContent: 'space-between',
          gap: 18,
          alignItems: isWide ? 'flex-end' : 'stretch',
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={mutedTextStyle}>
            For {invoice.companyName}
          </Text>
          <View
            style={{
              width: '100%',
              maxWidth: 220,
              height: 54,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(31, 37, 39, 0.24)',
            }}
          />
          <Text selectable style={mutedTextStyle}>
            Authorized Signatory
          </Text>
        </View>
      </View>

      <View
        style={{
          gap: 10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <ActionButton
              label={busyAction === 'share' ? 'Preparing Share...' : 'Share PDF'}
              variant="secondary"
              disabled={busyAction !== null}
              fullWidth
              onPress={onShare}
            />
          </View>

          <View style={{ flex: 1 }}>
            <ActionButton
              label={busyAction === 'download' ? 'Generating PDF...' : 'Download PDF'}
              variant="primary"
              disabled={busyAction !== null}
              fullWidth
              onPress={onDownload}
            />
          </View>
        </View>

        <View>
          <ActionButton
            label={busyAction === 'save' ? 'Saving Invoice...' : 'Save Invoice'}
            variant="soft"
            disabled={busyAction !== null}
            fullWidth
            onPress={onSave}
          />
        </View>
      </View>

    </View>
  )
}
