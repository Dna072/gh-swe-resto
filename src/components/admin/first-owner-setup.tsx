"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { getAdminToken } from "@/lib/admin/client";

export function FirstOwnerSetup() {
  const [available, setAvailable] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/bootstrap-owner")
      .then(async (response) => {
        const body = (await response.json()) as { available?: boolean };
        setAvailable(Boolean(body.available));
      })
      .catch(() => {
        setAvailable(false);
      });
  }, []);

  if (!available && !doneEmail) {
    return null;
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-4 rounded-2xl bg-card p-5 ring-2 ring-gold/35">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">First owner</p>
        <h2 className="mt-2 font-heading text-2xl">Add the first admin</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste the admin token, then add the first owner. This can only be done once. After that,
          that person signs in and invites everyone else from Staff.
        </p>
      </div>
      {doneEmail ? (
        <p className="text-sm text-forest">
          Invite sent to {doneEmail}. They should set a password from the email, then sign in above.
          {inviteUrl ? (
            <>
              {" "}
              Local setup link: <span className="break-all">{inviteUrl}</span>
            </>
          ) : null}
        </p>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            const headerToken = token.trim() || getAdminToken();
            void fetch("/api/admin/bootstrap-owner", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(headerToken ? { "X-Admin-Token": headerToken } : {}),
              },
              body: JSON.stringify({ email, displayName }),
            })
              .then(async (response) => {
                const body = (await response.json()) as {
                  message?: string;
                  user?: { email: string };
                  inviteUrl?: string;
                };
                if (!response.ok) {
                  throw new Error(body.message ?? "Could not add the first owner.");
                }
                setDoneEmail(body.user?.email ?? email);
                setInviteUrl(body.inviteUrl ?? null);
                setAvailable(false);
                toast.success("First owner invite sent.");
              })
              .catch((cause: unknown) => {
                const message = cause instanceof Error ? cause.message : "Could not add the first owner.";
                setError(message);
                toast.error(message);
              })
              .finally(() => {
                setBusy(false);
              });
          }}
        >
          <Field id="first-owner-name" label="Name">
            <Input
              id="first-owner-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </Field>
          <Field id="first-owner-email" label="Email">
            <Input
              id="first-owner-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field
            id="first-owner-token"
            label="Admin token"
            hint="Use the same token as above if you already pasted it."
          >
            <Input
              id="first-owner-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste admin token"
            />
          </Field>
          <Button type="submit" size="touch" disabled={busy}>
            {busy ? "Sending invite…" : "Create first owner"}
          </Button>
        </form>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
