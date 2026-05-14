import { ValidationResult } from "../../../Domain/types/ValidationResult";

export const validateLogin = (gamer_tag: string, password: string): ValidationResult => {
  if (!gamer_tag || gamer_tag.trim().length < 3)
    return { valid: false, message: "Gamer tag mora imati najmanje 3 karaktera" };
  if (!password || password.length < 8)
    return { valid: false, message: "Lozinka mora imati najmanje 8 karaktera" };
  return { valid: true };
};