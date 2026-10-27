export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Du behöver logga in igen.";
      case 403:
        return "Du har inte behörighet att göra detta.";
      case 404:
        return "Det du söker finns inte kvar eller kunde inte hittas.";
      case 429:
        return "För många försök på kort tid. Vänta en stund och försök igen.";
    }

    if (error.status >= 500 && error.status <= 599) {
      return "Tjänsten har problem just nu. Försök igen om en stund.";
    }
  }

  return "Något gick fel. Försök igen.";
}
