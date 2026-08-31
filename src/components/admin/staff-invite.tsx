"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { adminFetch } from "@/lib/admin/client";
import { STAFF_ROLES, type StaffRole } from "@/lib/security/rbac";

type StaffRow = {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRole;
  disabled: boolean;
};

export function StaffInvitePanel() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<StaffRole>("KITCHEN");
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function load() {
    adminFetch<{ staff: StaffRow[] }>("/api/admin/staff")
      .then((payload) => {
        setStaff(payload.staff);
        setError(null);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Could not load staff.");
      });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Team</p>
        <h1 className="mt-2 font-heading text-4xl">Staff invitations</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Invite kitchen and admin colleagues. They receive a branded email to set a password, then
          sign in on admin.mfcuisine.se or kitchen.mfcuisine.se.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
        onSubmit={(event) => {
          event.preventDefault();
          setInviteUrl(null);
          void adminFetch<{ user: StaffRow; inviteUrl?: string }>("/api/admin/staff", {
            method: "POST",
            body: JSON.stringify({ email, displayName, role }),
          })
            .then((result) => {
              toast.success(`Invite sent to ${result.user.email}.`);
              setInviteUrl(result.inviteUrl ?? null);
              setEmail("");
              setDisplayName("");
              load();
            })
            .catch((cause: unknown) => {
              const message = cause instanceof Error ? cause.message : "Could not send the invite.";
              setError(message);
              toast.error(message);
            });
        }}
      >
        <Field id="staff-name" label="Name">
          <Input id="staff-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        </Field>
        <Field id="staff-email" label="Email">
          <Input id="staff-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field id="staff-role" label="Role">
          <select
            id="staff-role"
            className="h-11 w-full rounded-md border border-input bg-background px-3"
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
          >
            {STAFF_ROLES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" size="touch">
          Send invite
        </Button>
        {inviteUrl ? (
          <p className="break-all text-sm text-muted-foreground">
            Local setup link: {inviteUrl}
          </p>
        ) : null}
      </form>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-3">
        {staff.map((user) => (
          <li key={user.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <div>
              <p className="font-heading text-xl">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <p className="text-xs uppercase tracking-[0.14em] text-earth">{user.role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
