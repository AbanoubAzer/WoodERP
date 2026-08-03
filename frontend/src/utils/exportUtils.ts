export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map(v => {
        let val = v === null || v === undefined ? '' : String(v);
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  };

  // Prepend UTF-8 BOM so Excel opens Arabic text correctly
  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.endsWith('.csv') ? filename : filename + '.csv'}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
