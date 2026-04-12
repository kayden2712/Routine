interface ExcelExportOptions {
  fileName: string;
  sheetName?: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null | undefined>>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function exportRowsToExcel(options: ExcelExportOptions): void {
  const sheetName = options.sheetName ?? 'Sheet1';

  const headerRow = options.headers
    .map((header) => `<th style="border:1px solid #d9d9d9;padding:8px;background:#f5f5f5;">${escapeHtml(header)}</th>`)
    .join('');

  const bodyRows = options.rows
    .map((row) => {
      const cells = row
        .map((cell) => `<td style="border:1px solid #d9d9d9;padding:8px;">${escapeHtml(String(cell ?? ''))}</td>`)
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <meta name="ProgId" content="Excel.Sheet" />
        <meta name="Generator" content="Routine Admin" />
        <title>${escapeHtml(sheetName)}</title>
      </head>
      <body>
        <table style="border-collapse:collapse;">
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([`\ufeff${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.fileName}.xls`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
