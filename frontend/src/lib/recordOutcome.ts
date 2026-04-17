export type WinningOutcomeFields = {
  winning_animal?: string | null;
  winning_number?: string | null;
};

export function normalizeWinningAnimal(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeWinningNumber(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  if (/^\d{1,2}$/.test(normalizedValue)) {
    return normalizedValue.padStart(2, '0');
  }

  return normalizedValue;
}

export function formatWinningOutcome({ winning_animal, winning_number }: WinningOutcomeFields) {
  const normalizedAnimal = normalizeWinningAnimal(winning_animal);
  const normalizedNumber = normalizeWinningNumber(winning_number);

  if (normalizedAnimal && normalizedNumber) {
    return `${normalizedAnimal} · ${normalizedNumber}`;
  }

  return normalizedAnimal || normalizedNumber || '';
}
