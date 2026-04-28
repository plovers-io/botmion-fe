export type PasswordRequirement = {
  id: "minLength" | "uppercase" | "lowercase" | "digit" | "special";
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "digit",
    label: "One number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "One special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function getPasswordRequirementState(password: string) {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    satisfied: requirement.test(password),
  }));
}

export function getPasswordScore(password: string) {
  return PASSWORD_REQUIREMENTS.reduce(
    (count, requirement) => count + (requirement.test(password) ? 1 : 0),
    0
  );
}
