"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/admin/client";
import { signInStaff, staffPasswordLoginAvailable } from "@/lib/firebase/client";

export function AdminSession() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordLogin = staffPasswordLoginAvailable();

  return (
    <div className="border-b border-border bg-secondary/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3">
      {passwordLogin ? (
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            void signInStaff(email, password)
              .then((idToken) => {
                setAdminToken(idToken);
                setSaved(true);
              })
              .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : "Staff sign-in failed.");
              });
          }}
        >
          <Field id="staff-email" label="Staff email" className="flex-1">
            <Input
              id="staff-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field id="staff-password" label="Password" className="flex-1">
            <Input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" size="touch">
            Sign in
          </Button>
        </form>
      ) : null}
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setAdminToken(token.trim() || getAdminToken());
          setSaved(true);
        }}
      >
        <Field
          id="admin-token"
          label="Admin token"
          hint={
            passwordLogin
              ? "Or paste a Firebase ID token. Local ADMIN_DEV_TOKEN works when APP_ENV is not production."
              : "Local development: paste ADMIN_DEV_TOKEN. Production uses Firebase staff sign-in."
          }
          className="flex-1"
        >
          <Input
            id="admin-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setSaved(false);
            }}
            placeholder="Paste ADMIN_DEV_TOKEN"
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" size="touch">
            {saved ? "Saved" : "Use token"}
          </Button>
          <Button
            type="button"
            size="touch"
            variant="outline"
            onClick={() => {
              clearAdminToken();
              setToken("");
              setSaved(false);
            }}
          >
            Clear
          </Button>
        </div>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      </div>
    </div>
  );
}
