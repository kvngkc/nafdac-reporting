export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** NAFDAC numbers look like "A4-1234" or "04-5678L"; strip spaces/dashes variations and uppercase. */
export function normalizeRegNo(s: string | null | undefined): string | null {
  if (!s) return null;
  const v = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return v.length ? v : null;
}

export function productKey(input: {
  productName: string;
  brand?: string | null;
  nafdacRegNo?: string | null;
}): string {
  const reg = normalizeRegNo(input.nafdacRegNo);
  if (reg) return `reg:${reg}`;
  return `name:${normalizeText(input.productName)}|${normalizeText(input.brand ?? "")}`;
}

export function describeProductKey(key: string): string {
  if (key.startsWith("reg:")) return `NAFDAC No. ${key.slice(4)}`;
  const [name, brand] = key.slice(5).split("|");
  return brand ? `${name} (${brand})` : name;
}
