import { useEffect, useId, useState } from "react";

export function PasswordField({
  label = "Passwort",
  value,
  onChange,
  newPassword = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  newPassword?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!value) setVisible(false);
  }, [value]);
  const action = `${label} ${visible ? "verbergen" : "anzeigen"}`;
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={newPassword ? "new-password" : "current-password"}
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={newPassword ? 12 : 1}
          maxLength={128}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={action}
          title={action}
          aria-controls={id}
          onClick={() => setVisible((current) => !current)}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
