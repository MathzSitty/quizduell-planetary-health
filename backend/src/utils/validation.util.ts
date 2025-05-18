/**
 * Validierungshilfsfunktionen für die Benutzerregistrierung
 * und andere Eingabeüberprüfungen
 */

import { AppError } from './AppError';
import BadWords from 'bad-words';

// Instanz des Schimpfwortfilters mit Standardkonfiguration
const filter = new BadWords({
  placeHolder: '*',
});

// Deutsche Schimpfwörter zur Liste hinzufügen
// In einer realen Anwendung würde diese Liste umfangreicher sein
const germanProfanityList = [
  'analritter', 'arsch', 'arschficker', 'arschlecker', 'arschloch', 
  'bimbo', 'bratze', 'bumsen', 'bonze', 'dödel', 'depp', 'dummkopf',
  'fick', 'ficken', 'flittchen', 'fotze', 'fratze', 
  'hackfresse', 'hure', 'hurensohn',
  'idiot', 'ische',
  'kackbratze', 'kacke', 'kacken', 'kackwurst', 'kampflesbe', 'kanake', 'kimme',
  'lümmel',
  'milf', 'möpse', 'morgenlatte', 'möse', 'mufti', 'muschi',
  'nackt', 'nazi', 'neger', 'nigger', 'nippel', 'nutte',
  'onanieren', 'orgasmus',
  'penis', 'pimmel', 'pimpern', 'pinkeln', 'pissen', 'pisser', 'popel', 'poppen', 'porno',
  'reudig', 'rosette',
  'schabracke', 'schlampe', 'scheiße', 'scheisser', 'schiesser', 'schnackeln', 'schwanzlutscher', 'schwuchtel',
  'tittchen', 'titten', 'trottel',
  'verdammt', 'vögeln', 'vollpfosten',
  'wichse', 'wichsen', 'wichser'
];

// Wörter einzeln hinzufügen
germanProfanityList.forEach(word => {
  filter.addWords(word);
});

/**
 * Ersetzt Leetspeak-Zeichen durch ihre alphabetischen Äquivalente
 * Beispiel: "4rsch" -> "arsch"
 */
export const normalizeLeetspeak = (text: string): string => {
  const leetMap: Record<string, string> = {
    '4': 'a', '@': 'a',
    '8': 'b',
    '3': 'e',
    '1': 'i', '!': 'i',
    '0': 'o',
    '5': 's', '$': 's',
    '7': 't',
    '+': 't',
    'ph': 'f',
    '2': 'z',
    '&': 'und'
  };

  let normalized = text.toLowerCase();
  
  // Ersetze Leetspeak-Zeichen
  Object.entries(leetMap).forEach(([leet, char]) => {
    // Escape Sonderzeichen für RegExp
    const escapedLeet = leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized.replace(new RegExp(escapedLeet, 'g'), char);
  });

  return normalized;
};

/**
 * Überprüft, ob eine E-Mail-Adresse syntaktisch gültig ist
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 konforme Regex für E-Mail-Validierung
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

/**
 * Überprüft, ob ein Text Schimpfwörter enthält, auch in Leetspeak
 */
export const containsProfanity = (text: string): boolean => {
  // Prüfe original Text
  if (filter.isProfane(text)) {
    return true;
  }
  
  // Prüfe normalisierten Leetspeak-Text
  const normalizedText = normalizeLeetspeak(text);
  return filter.isProfane(normalizedText);
};

/**
 * Validiert einen Benutzernamen nach verschiedenen Kriterien
 */
export const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (username.length < 3) {
    return { valid: false, message: 'Der Name muss mindestens 3 Zeichen lang sein.' };
  }
  
  if (username.length > 30) {
    return { valid: false, message: 'Der Name darf maximal 30 Zeichen lang sein.' };
  }
  
  // Erlaubte Zeichen (Buchstaben, Zahlen, Leerzeichen und einige Sonderzeichen)
  const validCharRegex = /^[a-zA-ZäöüÄÖÜß0-9\s\-_.]+$/;
  if (!validCharRegex.test(username)) {
    return { valid: false, message: 'Der Name enthält ungültige Zeichen.' };
  }
  
  if (containsProfanity(username)) {
    return { valid: false, message: 'Der Name enthält unangemessene Ausdrücke.' };
  }
  
  return { valid: true };
};

/**
 * Validiert ein Uni-Kürzel
 */
/**
 * Validiert ein Uni-Kürzel nach typischen Konventionen für Hochschulkürzel
 */
/**
 * Validiert ein Uni-Kürzel nach typischen Konventionen für Hochschulkürzel
 */
export const validateUniHandle = (uniHandle: string | null | undefined): { valid: boolean; message?: string } => {
  // Wenn nicht angegeben, ist es gültig (optional)
  if (!uniHandle) {
    return { valid: true };
  }
  
  // Grundlegendes Trimmen
  const trimmedHandle = uniHandle.trim();
  
  // Prüfe auf gültiges Format: 2-10 Großbuchstaben mit optionalen Ziffern am Ende
  const uniHandleRegex = /^[A-Z]{2,10}[0-9]*$/;
  
  // Spezialprüfung für klein geschriebene, aber sonst gültige Kürzel
  const upperCaseHandle = trimmedHandle.toUpperCase();
  
  if (!uniHandleRegex.test(trimmedHandle)) {
    // Wenn nur die Großschreibung fehlt, gib eine hilfreiche Meldung
    if (uniHandleRegex.test(upperCaseHandle)) {
      return {
        valid: false,
        message: 'Das Uni-Kürzel muss in Großbuchstaben eingegeben werden (z.B. "HKA" statt "hka").'
      };
    }
    
    // Anderer Validierungsfehler
    return {
      valid: false,
      message: 'Das Uni-Kürzel muss aus 2-10 Großbuchstaben bestehen und kann optional Ziffern am Ende enthalten.'
    };
  }
  
  // Prüfe auf Schimpfwörter, auch in Leetspeak-Form
  const denormalizedHandle = normalizeLeetspeak(trimmedHandle);
  if (containsProfanity(denormalizedHandle) || containsProfanity(trimmedHandle)) {
    return { valid: false, message: 'Das Uni-Kürzel enthält unangemessene Ausdrücke.' };
  }
  
  return { valid: true };
};

/**
 * Überprüft ein Passwort auf Komplexität und Sicherheit
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };
  }
  
  // Prüfe, ob das Passwort mindestens eine Zahl enthält
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Das Passwort muss mindestens eine Zahl enthalten.' };
  }
  
  // Prüfe, ob das Passwort mindestens einen Großbuchstaben enthält
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Das Passwort muss mindestens einen Großbuchstaben enthalten.' };
  }
  
  // Prüfe, ob das Passwort mindestens einen Kleinbuchstaben enthält
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten.' };
  }
  
  return { valid: true };
};