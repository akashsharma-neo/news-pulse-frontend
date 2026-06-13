const INDIA_COUNTRY_CODE = "91";
const INDIA_LOCAL_LENGTH = 10;

/** Strip spaces, dashes, and parentheses from a phone string. */
export function stripPhoneFormatting(value: string): string {
  return value.replace(/[\s\-()]/g, "");
}

/**
 * Normalize user input to E.164 for India (+91).
 * NexPrep is India-only; local 10-digit numbers get +91 by default.
 */
export function normalizeIndianPhone(input: string): string {
  let digits = stripPhoneFormatting(input.trim());

  if (!digits) return "";

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  if (digits.startsWith(INDIA_COUNTRY_CODE) && digits.length === INDIA_COUNTRY_CODE.length + INDIA_LOCAL_LENGTH) {
    return `+${digits}`;
  }

  if (digits.length === INDIA_LOCAL_LENGTH) {
    return `+${INDIA_COUNTRY_CODE}${digits}`;
  }

  if (digits.startsWith(INDIA_COUNTRY_CODE)) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/** Keep only digits and cap at 10 for the local Indian mobile input. */
export function formatIndianPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }
  if (digits.startsWith(INDIA_COUNTRY_CODE) && digits.length > INDIA_LOCAL_LENGTH) {
    digits = digits.slice(INDIA_COUNTRY_CODE.length);
  }
  return digits.slice(0, INDIA_LOCAL_LENGTH);
}

/** Display a stored/local phone number with the +91 prefix. */
export function displayIndianPhone(localDigits: string): string {
  const digits = formatIndianPhoneInput(localDigits);
  return digits ? `+91 ${digits}` : "+91";
}
