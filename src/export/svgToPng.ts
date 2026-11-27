import { t } from '../i18n';
import { type ImageFormat, MIME_TYPES } from './fileNames';

/** SVG -> Image -> canvas -> Blob, browser only */
export async function svgToImage(svg: string, format: ImageFormat = 'png'): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(t('error.noCanvas'));
    ctx.drawImage(img, 0, 0);

    const type = MIME_TYPES[format];
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.95));
    if (!blob) throw new Error(t('error.noImage'));
    // no WebP encoder? the browser quietly hands back PNG
    if (blob.type !== type) {
      throw new Error(t('error.noFormat', { format: format.toUpperCase() }));
    }
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** same thing as bytes, for the zip */
export async function svgToImageBytes(svg: string, format: ImageFormat): Promise<Uint8Array> {
  const blob = await svgToImage(svg, format);
  return new Uint8Array(await blob.arrayBuffer());
}
