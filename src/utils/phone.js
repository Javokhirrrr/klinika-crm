import { parsePhoneNumberFromString } from 'libphonenumber-js';


export function toE164(phone, defaultCountry = 'UZ') {
if (!phone) return phone;
const p = parsePhoneNumberFromString(phone, defaultCountry);
return p?.isValid() ? p.number : phone; // agar noto'g'ri bo'lsa as is
}