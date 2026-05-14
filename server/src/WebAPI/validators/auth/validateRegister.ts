import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateRegister = (gamer_tag: string, full_name: string, email: string, password: string): ValidationResult => {
  if (!gamer_tag || gamer_tag.trim().length < 3 || gamer_tag.length > 30 || !/^[a-zA-Z0-9\-\.]+$/.test(gamer_tag))
    return { valid: false, message: "Gamer tag je zauzet ili nije validan" };
  if (!full_name || full_name.trim().length < 2)
    return { valid: false, message: "Ime je obavezno" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { valid: false, message: "Email je već zauzet" };
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { valid: false, message: "Lozinka ne ispunjava uslove" };
  return { valid: true };
};