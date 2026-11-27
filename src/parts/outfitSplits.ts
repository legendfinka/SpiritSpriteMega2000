// old two-piece outfits, now a separate top and bottom; saves using them are converted
export const OUTFIT_SPLITS: Record<string, { top: string; bottom: string }> = {
  'outfit/jacket-jeans': { top: 'top/jacket', bottom: 'bottom/jeans' },
  'outfit/hoodie-jeans': { top: 'top/hoodie', bottom: 'bottom/jeans' },
  'outfit/sweater-jeans': { top: 'top/knit-sweater', bottom: 'bottom/jeans' },
  'outfit/leather-jacket': { top: 'top/leather-jacket', bottom: 'bottom/jeans' },
  'outfit/school-uniform': { top: 'top/blazer', bottom: 'bottom/slacks' },
  'outfit/tee-shorts': { top: 'top/star-tee', bottom: 'bottom/shorts' },
};
