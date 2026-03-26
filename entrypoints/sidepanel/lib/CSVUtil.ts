export function toCSV(headers: string[], rows: unknown[][]): string {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(',')),
    ].join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
