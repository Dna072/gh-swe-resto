"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import {
  clearAdminToken,
  getAdminToken,
  hasAdminToken,
  setAdminToken,
  subscribeAdminToken,
} from "@/lib/admin/client";
import { signInStaff, staffPasswordLoginAvailable } from "@/lib/firebase/client";

function useStoredAdminToken(): boolean {
  return useSyncExternalStore(subscribeAdminToken, hasAdminToken, () => false);
}

export function AdminSession() {
  const stored = useStoredAdminToken();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordLogin = staffPasswordLoginAvailable();
  const saved = stored && !editing;

  useEffect(() => {
    if (getAdminToken()) {
      return;
    }
    let cancelled = false;
    void fetch("/api/admin/local-session")
      .then(async (response) => {
        const body = (await response.json()) as { local?: boolean; token?: string };
        if (cancelled || !body.local || !body.token) {
          return;
        }
        setAdminToken(body.token);
      })
      .catch(() => {
        /* Local bootstrap is optional; staff can still paste a token. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
                setEditing(false);
                toast.success("Signed in. Kitchen and menu actions will use this session.");
              })
              .catch((cause: unknown) => {
                const message = cause instanceof Error ? cause.message : "Staff sign-in failed.";
                setError(message);
                toast.error(message);
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
          const next = token.trim() || getAdminToken();
          if (!next) {
            toast.error("Paste the admin token, then click Use token.");
            return;
          }
          setAdminToken(next);
          setEditing(false);
          toast.success("Admin token saved. You can save meals and upload photographs.");
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
              setEditing(true);
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
              setEditing(false);
              toast.message("Admin token cleared.");
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
