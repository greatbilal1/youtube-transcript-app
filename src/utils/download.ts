/** Trigger a browser download of a Blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Download a string as a text file. */
export function downloadText(text: string, filename: string, mime = 'text/markdown'): void {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}
