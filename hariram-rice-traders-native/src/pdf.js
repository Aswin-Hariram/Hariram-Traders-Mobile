import { Platform } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

import {
  calculateItem,
  calculateSummary,
  convertAmountToWords,
  escapeHtml,
  formatCurrency,
  formatMultilineText,
  formatNumber,
  formatReadableDate,
  getGstLabels,
} from './utils'

export function getPdfFilename(state) {
  return `${sanitizeFilename(state.invoiceNumber || 'sales-invoice')}.pdf`
}

export async function downloadPdf(state) {
  const uri = await createPdfFromHtml(buildInvoiceHtml(state))

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save invoice PDF',
      UTI: 'com.adobe.pdf',
    })
  }

  return uri
}

export async function sharePdf(state) {
  const uri = await createPdfFromHtml(buildInvoiceHtml(state))

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share invoice PDF',
    UTI: 'com.adobe.pdf',
  })

  return uri
}

export async function shareCombinedPdf(states) {
  const uri = await createPdfFromHtml(buildCombinedInvoiceHtml(states))

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share selected bills PDF',
    UTI: 'com.adobe.pdf',
  })

  return uri
}

async function createPdfFromHtml(html) {
  if (Platform.OS === 'web') {
    throw new Error('PDF actions are currently supported on iOS and Android.')
  }

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  })

  return uri
}

export function buildInvoiceHtml(state) {
  return buildPdfDocumentHtml([state])
}

export function buildCombinedInvoiceHtml(states) {
  return buildPdfDocumentHtml(normalizeInvoiceStates(states))
}

function normalizeInvoiceStates(states) {
  const invoices = Array.isArray(states) ? states.filter(Boolean) : []

  if (!invoices.length) {
    throw new Error('Select at least one bill to share.')
  }

  return invoices
}

function buildPdfDocumentHtml(states) {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          width: 210mm;
          background: #ffffff;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          color: #1f2527;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm;
          background: #ffffff;
          page-break-after: always;
          break-after: page;
        }

        .page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .page-frame {
          width: 100%;
          min-height: calc(297mm - 16mm);
        }

        .sheet {
          background: #ffffff;
          border: 1px solid rgba(139, 107, 59, 0.18);
          border-radius: 18px;
          padding: 18px;
          transform-origin: top left;
        }

        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 8px;
          font-weight: 700;
          color: #8a4f17;
          margin: 0 0 5px;
        }

        .document-title {
          margin: 0 0 14px;
          text-align: center;
          color: #1f2527;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .top,
        .party-grid,
        .summary-grid,
        .footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .top h1,
        .party-card h2,
        .amount-card h2 {
          margin: 0;
          color: #1f2527;
        }

        .top h1 {
          font-size: 20px;
          margin-bottom: 4px;
          line-height: 1.15;
        }

        .party-card h2,
        .amount-card h2 {
          font-size: 14px;
          line-height: 1.25;
        }

        .muted,
        .meta-row span,
        .meta-row strong {
          color: #6e5f4e;
          line-height: 1.35;
          font-size: 10px;
        }

        .meta-card,
        .party-card,
        .amount-card,
        .totals-card {
          border-radius: 14px;
          padding: 12px;
        }

        .meta-card {
          min-width: 200px;
          background: #fff7ea;
          border: 1px solid rgba(214, 167, 92, 0.35);
        }

        .party-card,
        .amount-card {
          flex: 1;
          background: #fffdf8;
          border: 1px solid rgba(139, 107, 59, 0.16);
        }

        .totals-card {
          width: 230px;
          background: #fff8ed;
          border: 1px solid rgba(214, 167, 92, 0.36);
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 5px;
        }

        .vehicle-strip {
          margin: 12px 0;
          padding: 9px 12px;
          border-radius: 12px;
          background: #fbf5ec;
          border: 1px solid rgba(139, 107, 59, 0.18);
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }

        thead {
          background: #f4e0bf;
        }

        th,
        td {
          text-align: left;
          padding: 7px;
          border-bottom: 1px solid rgba(139, 107, 59, 0.14);
          font-size: 10px;
          vertical-align: top;
          line-height: 1.3;
        }

        th {
          font-size: 10px;
          font-weight: 700;
        }

        .totals-card .meta-row:last-child {
          padding-top: 8px;
          border-top: 1px solid rgba(139, 107, 59, 0.18);
          margin-top: 8px;
        }

        .signature {
          min-width: 180px;
          text-align: right;
        }

        .signature-line {
          height: 38px;
          border-bottom: 1px solid rgba(31, 37, 39, 0.3);
          margin: 6px 0 8px;
        }

        .footer {
          margin-top: 14px;
          gap: 12px;
        }

        strong {
          font-weight: 700;
        }

        @media print {
          html,
          body {
            width: auto;
          }

          .page,
          .page-frame {
            min-height: auto;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>

    <body>
      ${states.map((state) => renderInvoicePage(state)).join('')}

      <script>
        (function () {
          function fitInvoicePage(page) {
            var frame = page.querySelector('.page-frame')
            var sheet = page.querySelector('.invoice-sheet')

            if (!frame || !sheet) {
              return
            }

            sheet.style.transform = 'scale(1)'

            var availableWidth = frame.clientWidth
            var availableHeight = frame.clientHeight
            var naturalWidth = sheet.scrollWidth
            var naturalHeight = sheet.scrollHeight

            if (
              !availableWidth ||
              !availableHeight ||
              !naturalWidth ||
              !naturalHeight
            ) {
              return
            }

            var widthScale = availableWidth / naturalWidth
            var heightScale = availableHeight / naturalHeight
            var scale = Math.min(
              1,
              widthScale,
              heightScale
            )

            sheet.style.transform = 'scale(' + scale + ')'
          }

          function fitInvoices() {
            var pages = document.querySelectorAll('.page')

            pages.forEach(function (page) {
              fitInvoicePage(page)
            })
          }

          function scheduleFit() {
            window.requestAnimationFrame(function () {
              fitInvoices()
              window.requestAnimationFrame(fitInvoices)
            })
          }

          if (
            document.fonts &&
            document.fonts.ready
          ) {
            document.fonts.ready.then(scheduleFit)
          } else {
            scheduleFit()
          }

          window.addEventListener(
            'load',
            scheduleFit
          )

          window.addEventListener(
            'resize',
            scheduleFit
          )
        })()
      </script>
    </body>
  </html>`
}

function renderInvoicePage(state) {
  const items = Array.isArray(state.items) ? state.items : []
  const summary = calculateSummary(items)
  const { cgstLabel, sgstLabel } = getGstLabels(items)

  return `
    <div class="page">
      <div class="page-frame">
        <div class="sheet invoice-sheet">
          <h1 class="document-title">Bill of Supply</h1>
          <div class="top">
            <div>
              <p class="eyebrow">Tax Invoice</p>

              <h1>${escapeHtml(state.companyName || '')}</h1>

              <div class="muted">
                ${escapeHtml(state.companyTagline || '')}
              </div>

              <div class="muted">
                ${formatMultilineText(state.companyAddress || '')}
              </div>
            </div>

            <div class="meta-card">
              ${renderMetaRow(
                'Invoice No.',
                state.invoiceNumber || '-'
              )}

              ${renderMetaRow(
                'Invoice Date',
                formatReadableDate(state.invoiceDate)
              )}

              ${renderMetaRow(
                'Due Date',
                formatReadableDate(state.dueDate)
              )}

              ${renderMetaRow(
                'Place of Supply',
                state.placeOfSupply || '-'
              )}
            </div>
          </div>

          <div
            class="party-grid"
            style="margin-top: 14px;"
          >
            <div class="party-card">
              <p class="eyebrow">Bill From</p>

              <h2>${escapeHtml(state.companyName || '')}</h2>

              <div class="muted">
                Phone:
                ${escapeHtml(state.companyPhone || '-')}
              </div>

              <div class="muted">
                GSTIN:
                ${escapeHtml(state.companyGstin || '-')}
              </div>

              <div class="muted">
                Email:
                ${escapeHtml(state.companyEmail || '-')}
              </div>

              <div class="muted">
                ${formatMultilineText(state.companyAddress || '')}
              </div>
            </div>

            <div class="party-card">
              <p class="eyebrow">Bill To</p>

              <h2>${escapeHtml(state.customerName || '-')}</h2>

              <div class="muted">
                Phone:
                ${escapeHtml(state.customerPhone || '-')}
              </div>

              <div class="muted">
                GSTIN:
                ${escapeHtml(state.customerGstin || '-')}
              </div>

              <div class="muted">
                Email:
                ${escapeHtml(state.customerEmail || '-')}
              </div>

              <div class="muted">
                ${formatMultilineText(state.customerAddress || '')}
              </div>
            </div>
          </div>

          <div class="vehicle-strip">
            <div class="muted">
              Vehicle No.:
              <strong>
                ${escapeHtml(state.vehicleNumber || '-')}
              </strong>
            </div>

            <div class="muted">
              Total Items:
              <strong>${items.length}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Bag Type</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total GST %</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              ${items
                .map((item, index) => {
                  const totals = calculateItem(item)

                  return `
                    <tr>
                      <td>${index + 1}</td>

                      <td>
                        ${escapeHtml(item.description || '')}
                        <br />
                        <span style="color:#6e5f4e;">
                          ${escapeHtml(item.unit || '')}
                        </span>
                      </td>

                      <td>
                        ${escapeHtml(item.bagType || '-')}
                      </td>

                      <td>
                        ${escapeHtml(item.hsn || '-')}
                      </td>

                      <td>
                        ${formatNumber(item.quantity)}
                      </td>

                      <td>
                        ${formatCurrency(item.rate)}
                      </td>

                      <td>
                        ${formatNumber(item.gstRate)}%
                      </td>

                      <td>
                        ${formatCurrency(
                          totals.lineTotal
                        )}
                      </td>
                    </tr>
                  `
                })
                .join('')}
            </tbody>
          </table>

          <div class="summary-grid">
            <div class="amount-card">
              <p class="eyebrow">Amount in words</p>

              <h2>
                ${escapeHtml(
                  convertAmountToWords(
                    summary.grandTotal
                  )
                )}
              </h2>
            </div>

            <div class="totals-card">
              ${renderMetaRow(
                'Taxable value',
                formatCurrency(summary.taxableTotal)
              )}

              ${renderMetaRow(
                cgstLabel,
                formatCurrency(summary.cgstTotal)
              )}

              ${renderMetaRow(
                sgstLabel,
                formatCurrency(summary.sgstTotal)
              )}

              ${renderMetaRow(
                'Grand total',
                formatCurrency(summary.grandTotal)
              )}
            </div>
          </div>

          <div class="footer">
            <div>
              <p class="eyebrow">Bank details</p>

              <div class="muted">
                ${escapeHtml(state.companyBank || '-')}
              </div>

              <div class="muted">
                Name:
                ${escapeHtml(
                  state.companyAccountName || '-'
                )}
              </div>

              <div class="muted">
                A/C:
                ${escapeHtml(state.companyAccount || '-')}
                (${escapeHtml(
                  state.companyAccountType || '-'
                )})
              </div>

              <div class="muted">
                IFSC:
                ${escapeHtml(state.companyIfsc || '-')}
              </div>

              <div class="muted">
                Branch:
                ${escapeHtml(state.companyBranch || '-')}
              </div>
            </div>

            <div class="signature">
              <div class="muted">
                For
                ${escapeHtml(state.companyName || '')}
              </div>

              <div class="signature-line"></div>

              <div class="muted">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderMetaRow(label, value) {
  return `
    <div class="meta-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `
}

function sanitizeFilename(value) {
  return String(value).replace(
    /[^a-z0-9._-]+/gi,
    '-',
  )
}
