// Indian government registration number validators
// Format references: Income Tax PAN, GSTIN (15-char), CIN (21-char MCA), IFSC (11-char RBI), TAN (10-char), Udyam, DPIIT.

export const PATTERNS = {
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  tan: /^[A-Z]{4}[0-9]{5}[A-Z]$/,
  gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  cin: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  udyam: /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/i,
  dpiit: /^DIPP[0-9]{4,7}$/i,
  pincode: /^[1-9][0-9]{5}$/,
  phoneIN: /^(\+91[\-\s]?)?[6-9][0-9]{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  duns: /^[0-9]{9}$/,
  gemSeller: /^[A-Z0-9]{6,20}$/i,
  bee: /^[1-5]$/,
  // DD/MM/YYYY date
  dateDMY: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)[0-9]{2}$/,
  year4: /^(19|20)[0-9]{2}$/,
  percent: /^(100|[1-9]?[0-9])(\.[0-9]{1,2})?$/,
  miiClass: /^(class[\s-]?i{1,2}|non[\s-]?local)$/i,
  bankAccount: /^[0-9]{9,18}$/,
};

export interface ValidationIssue {
  field: string;
  message: string;
}

// Parse DD/MM/YYYY safely
export function parseDMY(value: string): Date | null {
  if (!PATTERNS.dateDMY.test(value)) return null;
  const [d, m, y] = value.split("/").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

// Returns 'expired' | 'expiring' (within 60 days) | 'valid' | null (invalid format)
export function expiryStatus(value: string): "expired" | "expiring" | "valid" | null {
  const dt = parseDMY(value);
  if (!dt) return null;
  const now = new Date();
  const diffDays = Math.floor((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 60) return "expiring";
  return "valid";
}

export function validate(field: string, value: string): string | null {
  if (!value) return null; // empty is allowed; use required check separately
  const v = value.trim().toUpperCase();
  switch (field) {
    case "pan":
      return PATTERNS.pan.test(v) ? null : "PAN must be 10 chars: ABCDE1234F";
    case "tan":
      return PATTERNS.tan.test(v) ? null : "TAN must be 10 chars: ABCD12345E";
    case "gst":
      return PATTERNS.gst.test(v) ? null : "GSTIN must be 15 chars: 22AAAAA0000A1Z5";
    case "cin":
      return PATTERNS.cin.test(v) ? null : "CIN must be 21 chars: U12345MH2020PTC123456";
    case "ifsc_code":
      return PATTERNS.ifsc.test(v) ? null : "IFSC must be 11 chars: SBIN0001234";
    case "udyam_number":
      return PATTERNS.udyam.test(v) ? null : "Udyam format: UDYAM-XX-00-0000000";
    case "dpiit_number":
      return PATTERNS.dpiit.test(v) ? null : "DPIIT format: DIPP12345";
    case "duns_number":
      return PATTERNS.duns.test(value) ? null : "DUNS must be 9 digits";
    case "bank_account":
      return PATTERNS.bankAccount.test(value.replace(/\s/g, "")) ? null : "Account no. must be 9-18 digits";
    case "contact_email":
    case "support_email":
    case "escalation_l1_email":
    case "escalation_l2_email":
    case "escalation_l3_email":
      return PATTERNS.email.test(value) ? null : "Invalid email";
    case "contact_phone":
    case "support_phone":
      return PATTERNS.phoneIN.test(value.replace(/\s/g, "")) ? null : "Indian phone: +91XXXXXXXXXX";
    case "bee_rating":
      return PATTERNS.bee.test(value) ? null : "BEE star rating 1-5";
    case "year_of_incorporation": {
      if (!PATTERNS.year4.test(value)) return "Year must be 4 digits (e.g. 2020)";
      const y = Number(value);
      const cy = new Date().getFullYear();
      if (y < 1900 || y > cy) return `Year must be between 1900 and ${cy}`;
      return null;
    }
    case "local_content_percentage":
      return PATTERNS.percent.test(value) ? null : "Enter percent 0-100";
    case "mii_class":
      return PATTERNS.miiClass.test(value.trim()) ? null : "Must be Class-I, Class-II or Non-local";
    case "dsc_expiry":
    case "iso_expiry": {
      const status = expiryStatus(value);
      if (status === null) return "Use DD/MM/YYYY format";
      if (status === "expired") return "⚠ Expired — renew before bidding";
      if (status === "expiring") return "⚠ Expiring within 60 days — renew soon";
      return null;
    }
    default:
      return null;
  }
}
