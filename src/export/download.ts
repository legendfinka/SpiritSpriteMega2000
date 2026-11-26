/** download through a throwaway link */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // let the download start before freeing the URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
