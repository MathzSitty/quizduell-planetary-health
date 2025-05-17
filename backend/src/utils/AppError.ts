// backend/src/utils/AppError.ts

/**
 * Benutzerdefinierte Fehlerklasse zur Erstellung von handhabbaren Anwendungsfehlern.
 * Ermöglicht die Angabe eines HTTP-Statuscodes und unterscheidet zwischen
 * operationellen Fehlern (erwartet, z.B. ungültige Eingabe) und Programmierfehlern.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string; // 'fail' für 4xx Fehler, 'error' für 5xx Fehler
  public readonly isOperational: boolean; // Markiert Fehler, die erwartet und gehandhabt werden können

  /**
   * Erstellt eine Instanz von AppError.
   * @param message Die Fehlermeldung.
   * @param statusCode Der HTTP-Statuscode, der mit diesem Fehler verbunden ist.
   */
  constructor(message: string, statusCode: number) {
    super(message); // Ruft den Konstruktor der Basisklasse Error auf

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 'fail' für Client-Fehler, 'error' für Server-Fehler
    this.isOperational = true; // Standardmäßig sind AppErrors operationelle Fehler

    // Stellt sicher, dass der Stack Trace korrekt ist und die AppError-Klasse nicht im Stack Trace erscheint
    Error.captureStackTrace(this, this.constructor);
  }
}