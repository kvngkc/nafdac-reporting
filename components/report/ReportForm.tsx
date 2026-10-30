"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import clsx from "clsx";
import { Category, ProductType } from "@prisma/client";
import { Field } from "@/components/ui";
import { CATEGORY_HINTS, CATEGORY_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/labels";
import { STATES, STATES_LGAS } from "@/lib/nigeria";
import { complaintSchema } from "@/lib/validation/complaint";
import { UPLOADS } from "@/lib/config";
import { submitComplaint } from "@/app/(public)/report/actions";

type Errors = Record<string, string | undefined>;

const STEPS = [
  { title: "Product", fields: ["productName", "brand", "manufacturer", "productType", "nafdacRegNo", "batchNo", "expiryDate"] },
  { title: "What's wrong", fields: ["category", "description"] },
  { title: "Where & when", fields: ["state", "lga", "purchaseLocation", "purchaseDate"] },
  { title: "Health", fields: ["healthEffect", "healthEffectDetails", "hospitalized"] },
  { title: "Photos", fields: ["evidence"] },
  { title: "Contact & submit", fields: ["contactName", "contactPhone", "contactEmail"] },
] as const;

const today = () => new Date().toISOString().slice(0, 10);

export function ReportForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState("");
  const [healthEffect, setHealthEffect] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const last = step === STEPS.length - 1;

  /** Validates the whole form with the shared schema but only reports errors for `fields`. Returns those errors. */
  function validate(fields: readonly string[]): Errors {
    const raw = Object.fromEntries(
      [...new FormData(formRef.current!).entries()].filter(([, v]) => typeof v === "string"),
    );
    const result = complaintSchema.safeParse(raw);
    const fe = result.success ? {} : result.error.flatten().fieldErrors;
    const next: Errors = {};
    for (const f of fields) next[f] = (fe as Record<string, string[] | undefined>)[f]?.[0];
    setErrors((prev) => ({ ...prev, ...next }));
    const firstBad = fields.find((f) => next[f]);
    if (firstBad) formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
    return next;
  }

  const hasErrors = (e: Errors) => Object.values(e).some(Boolean);

  function goTo(n: number) {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    if (!hasErrors(validate(STEPS[step].fields))) goTo(step + 1);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = [...list];
    const bad = incoming.find((f) => !(UPLOADS.allowedMime as readonly string[]).includes(f.type) || f.size > UPLOADS.maxBytes);
    if (bad) {
      setErrors((e) => ({ ...e, evidence: `"${bad.name}" must be a JPG, PNG or WebP image under 5 MB` }));
      return;
    }
    const merged = [...files, ...incoming].slice(0, UPLOADS.maxFiles);
    setErrors((e) => ({ ...e, evidence: undefined }));
    setFiles(merged);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!last) return next();
    const allFields = STEPS.flatMap((s) => s.fields as readonly string[]);
    const found = validate(allFields);
    if (hasErrors(found)) {
      const badStep = STEPS.findIndex((s) => s.fields.some((f) => found[f]));
      if (badStep >= 0) goTo(badStep);
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.delete("evidence");
    files.forEach((f) => fd.append("evidence", f));
    setFormError(null);
    startTransition(async () => {
      try {
        const res = await submitComplaint(fd);
        if (res.ok) {
          router.push(`/report/success?code=${encodeURIComponent(res.trackingCode)}`);
          return;
        }
        setFormError(res.message);
        if (res.fieldErrors) {
          const fe: Errors = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) fe[k] = v?.[0];
          setErrors(fe);
          const badStep = STEPS.findIndex((s) => s.fields.some((f) => fe[f]));
          if (badStep >= 0) goTo(badStep);
        }
      } catch {
        setFormError("Could not send your report. Check your internet connection and try again.");
      }
    });
  }

  const err = (name: string) => errors[name];
  const aria = (name: string) => ({
    "aria-invalid": err(name) ? true : undefined,
    "aria-describedby": err(name) ? `${name}-error` : undefined,
  });

  return (
    <div ref={topRef} className="scroll-mt-4">
      {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}

      <ol className="mb-6 flex gap-1.5" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex-1">
            <div className={clsx("h-1.5 rounded-full", i <= step ? "bg-brand-600" : "bg-slate-200")} />
            <span className={clsx("mt-1.5 hidden text-xs sm:block", i === step ? "font-semibold text-brand-700" : "text-slate-500")}>
              {s.title}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-4 text-sm text-slate-500 sm:hidden">
        Step {step + 1} of {STEPS.length}: <span className="font-semibold text-slate-700">{STEPS[step].title}</span>
      </p>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="card p-5 sm:p-6">
        {/* Step 1: product */}
        <fieldset hidden={step !== 0} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Which product are you reporting?</legend>
          <Field label="Product name" htmlFor="productName" error={err("productName")}>
            <input id="productName" name="productName" className="input" placeholder="e.g. Paracetamol 500mg tablets" {...aria("productName")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand" htmlFor="brand" optional>
              <input id="brand" name="brand" className="input" />
            </Field>
            <Field label="Manufacturer / distributor" htmlFor="manufacturer" optional>
              <input id="manufacturer" name="manufacturer" className="input" />
            </Field>
          </div>
          <Field label="Type of product" htmlFor="productType" error={err("productType")}>
            <select id="productType" name="productType" className="input" defaultValue="" {...aria("productType")}>
              <option value="" disabled>
                Select…
              </option>
              {Object.values(ProductType).map((t) => (
                <option key={t} value={t}>
                  {PRODUCT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="NAFDAC Reg. No." htmlFor="nafdacRegNo" optional hint="Leave blank if there is none">
              <input id="nafdacRegNo" name="nafdacRegNo" className="input" placeholder="e.g. A4-1234" />
            </Field>
            <Field label="Batch / lot no." htmlFor="batchNo" optional>
              <input id="batchNo" name="batchNo" className="input" />
            </Field>
            <Field label="Expiry date" htmlFor="expiryDate" optional error={err("expiryDate")}>
              <input id="expiryDate" name="expiryDate" type="date" className="input" />
            </Field>
          </div>
        </fieldset>

        {/* Step 2: problem */}
        <fieldset hidden={step !== 1} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">What is wrong with it?</legend>
          <div role="radiogroup" aria-describedby={err("category") ? "category-error" : undefined} className="grid gap-2 sm:grid-cols-2">
            {Object.values(Category).map((c) => (
              <label
                key={c}
                className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-600 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
              >
                <input type="radio" name="category" value={c} className="mt-1 accent-brand-600" />
                <span>
                  <span className="block text-sm font-semibold">{CATEGORY_LABELS[c]}</span>
                  <span className="block text-xs text-slate-500">{CATEGORY_HINTS[c]}</span>
                </span>
              </label>
            ))}
          </div>
          {err("category") && (
            <p id="category-error" className="text-sm text-red-600">
              {err("category")}
            </p>
          )}
          <Field label="Describe the problem" htmlFor="description" error={err("description")}>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="input"
              placeholder="What did you notice? How is it different from the genuine product?"
              {...aria("description")}
            />
          </Field>
        </fieldset>

        {/* Step 3: location */}
        <fieldset hidden={step !== 2} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Where and when did you get it?</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State" htmlFor="state" error={err("state")}>
              <select id="state" name="state" className="input" value={state} onChange={(e) => setState(e.target.value)} {...aria("state")}>
                <option value="" disabled>
                  Select state…
                </option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s === "FCT" ? "FCT – Abuja" : s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Local Government Area" htmlFor="lga" error={err("lga")}>
              <select id="lga" name="lga" className="input" defaultValue="" key={state} disabled={!state} {...aria("lga")}>
                <option value="" disabled>
                  {state ? "Select LGA…" : "Choose a state first"}
                </option>
                {(STATES_LGAS[state] ?? []).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Shop, market or pharmacy" htmlFor="purchaseLocation" optional hint="e.g. Idumota Market, Shop 14">
            <input id="purchaseLocation" name="purchaseLocation" className="input" />
          </Field>
          <Field label="Date of purchase" htmlFor="purchaseDate" optional error={err("purchaseDate")}>
            <input id="purchaseDate" name="purchaseDate" type="date" max={today()} className="input" {...aria("purchaseDate")} />
          </Field>
        </fieldset>

        {/* Step 4: health */}
        <fieldset hidden={step !== 3} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Did anyone get sick?</legend>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            If someone is seriously ill, go to the nearest hospital or call <strong>112</strong> now. Take the product
            and its packaging with you.
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="healthEffect"
              className="mt-1 h-4 w-4 accent-brand-600"
              checked={healthEffect}
              onChange={(e) => setHealthEffect(e.target.checked)}
            />
            <span className="text-sm">Yes – someone had a bad reaction or fell ill after using this product</span>
          </label>
          {healthEffect && (
            <>
              <Field label="What happened?" htmlFor="healthEffectDetails" optional>
                <textarea id="healthEffectDetails" name="healthEffectDetails" rows={3} className="input" placeholder="Symptoms, how long after use, who was affected (adult/child)…" />
              </Field>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="hospitalized" className="mt-1 h-4 w-4 accent-brand-600" />
                <span className="text-sm">The person needed hospital treatment</span>
              </label>
            </>
          )}
        </fieldset>

        {/* Step 5: photos */}
        <fieldset hidden={step !== 4} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Add photos</legend>
          <p className="text-sm text-slate-600">
            Photos of the front label, NAFDAC number, batch/expiry print and receipt help investigators the most. Up to{" "}
            {UPLOADS.maxFiles} images, 5 MB each. Location data is removed from photos automatically.
          </p>
          <label
            htmlFor="evidence"
            className={clsx(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm",
              files.length >= UPLOADS.maxFiles ? "pointer-events-none opacity-50" : "border-slate-300 hover:border-brand-600",
            )}
          >
            <span className="font-semibold text-brand-700">Take or choose photos</span>
            <span className="text-slate-500">JPG, PNG or WebP</span>
          </label>
          <input
            id="evidence"
            name="evidence"
            type="file"
            accept={UPLOADS.allowedMime.join(",")}
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {err("evidence") && <p className="text-sm text-red-600">{err("evidence")}</p>}
          {files.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews[i]} alt={f.name} className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                    aria-label={`Remove ${f.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        {/* Step 6: contact */}
        <fieldset hidden={step !== 5} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Contact details (optional)</legend>
          <p className="text-sm text-slate-600">
            You can report anonymously. If you leave a phone number or email, investigators may contact you for more
            information. Your details are never published.
          </p>
          <Field label="Name" htmlFor="contactName" optional>
            <input id="contactName" name="contactName" autoComplete="name" className="input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone number" htmlFor="contactPhone" optional error={err("contactPhone")}>
              <input id="contactPhone" name="contactPhone" type="tel" autoComplete="tel" inputMode="tel" className="input" placeholder="0803 123 4567" {...aria("contactPhone")} />
            </Field>
            <Field label="Email" htmlFor="contactEmail" optional error={err("contactEmail")}>
              <input id="contactEmail" name="contactEmail" type="email" autoComplete="email" className="input" {...aria("contactEmail")} />
            </Field>
          </div>
          {turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />}
          <p className="text-xs text-slate-500">
            By submitting, you confirm this report is true to the best of your knowledge. False reports may be removed.
          </p>
        </fieldset>

        {formError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="btn-secondary" onClick={() => goTo(step - 1)} disabled={step === 0 || pending}>
            Back
          </button>
          {last ? (
            // Distinct keys stop React reusing the "Continue" button node; otherwise the click that
            // reveals this step would flip its type to submit mid-click and submit the form early.
            <button key="submit" type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Sending…" : "Submit report"}
            </button>
          ) : (
            <button key="continue" type="button" className="btn-primary" onClick={next}>
              Continue
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
