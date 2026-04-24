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
};

export interface ValidationIssue {
  field: string;
  message: string;
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
    default:
      return null;
  }
}
