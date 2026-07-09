export const capitalizeText = (text: string | null) => {
  if (!text) return ''

  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s,._-]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
