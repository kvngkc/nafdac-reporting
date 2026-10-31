import { NAFDAC } from "@/lib/nafdac";

const link = "font-medium text-brand-700 underline";

/** Official NAFDAC channels, for people who want to verify a product or contact the agency directly. */
export function NafdacContacts() {
  return (
    <ul className="space-y-1.5 text-sm text-slate-600">
      <li>
        Check if a product is registered on{" "}
        <a className={link} href={NAFDAC.greenbook} target="_blank" rel="noreferrer">
          NAFDAC Greenbook
        </a>
      </li>
      <li>
        Toll-free line:{" "}
        <a className={link} href={`tel:${NAFDAC.tollFreeTel}`}>
          {NAFDAC.tollFree}
        </a>
      </li>
      <li>
        Email:{" "}
        <a className={link} href={`mailto:${NAFDAC.email}`}>
          {NAFDAC.email}
        </a>
      </li>
      <li>
        Website:{" "}
        <a className={link} href={NAFDAC.website} target="_blank" rel="noreferrer">
          nafdac.gov.ng
        </a>
      </li>
    </ul>
  );
}
