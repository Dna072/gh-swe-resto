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
  hasSignedIn?: boolean;
  pendingSetup?: boolean;
};

type InviteResponse = {
  user: StaffRow;
  inviteUrl?: string;
  emailDelivery?: "sent" | "mock" | "failed";
  resetLinkReady?: boolean;
};

const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: "Owner — full admin, invites, Swish confirm",
  MANAGER: "Manager — menu, orders, Swish confirm",
  KITCHEN: "Kitchen — board and tickets",
  DISPATCHER: "Dispatcher — deliveries",
  FINANCE: "Finance — refunds and Swish confirm",
  MARKETING: "Marketing — promotions and reviews",
};

function roleLabel(role: StaffRole): string {
  return ROLE_LABELS[role];
}

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function StaffInvitePanel() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<StaffRole>("KITCHEN");
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteForEmail, setInviteForEmail] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<InviteResponse["emailDelivery"]>();
  const [busyUid, setBusyUid] = useState<string | null>(null);

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

  async function fetchSetupLink(uid: string, forEmail: string) {
    setBusyUid(uid);
    setError(null);
    try {
      const result = await adminFetch<{ email: string; inviteUrl: string }>(
        `/api/admin/staff/${uid}/setup-link`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setInviteUrl(result.inviteUrl);
      setInviteForEmail(result.email || forEmail);
      setEmailDelivery("mock");
      await copyText(result.inviteUrl);
      toast.success(`Setup link for ${result.email} copied.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not create a setup link.";
      setError(message);
      toast.error(message);
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Team</p>
        <h1 className="mt-2 font-heading text-4xl">Staff invitations</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Invite kitchen and admin colleagues. While outbound email is unavailable, use Copy setup
          link on anyone who has not signed in yet and share it with them. Invite OWNER, MANAGER, or
          FINANCE so they can confirm Swish payments.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
        onSubmit={(event) => {
          event.preventDefault();
          setInviteUrl(null);
          setInviteForEmail(null);
          setEmailDelivery(undefined);
          void adminFetch<InviteResponse>("/api/admin/staff", {
            method: "POST",
            body: JSON.stringify({ email, displayName, role }),
          })
            .then(async (result) => {
              setInviteUrl(result.inviteUrl ?? null);
              setInviteForEmail(result.user.email);
              setEmailDelivery(result.emailDelivery);
              if (result.inviteUrl) {
                try {
                  await copyText(result.inviteUrl);
                } catch {
                  // Clipboard may be blocked; the link is still shown below.
                }
              }
              if (result.emailDelivery === "sent") {
                toast.success(`Invite email sent to ${result.user.email}.`);
              } else if (result.emailDelivery === "mock") {
                toast.success(`Account created for ${result.user.email}. Setup link ready below.`);
              } else {
                toast.message(
                  `Account created for ${result.user.email}. Email did not send — use the setup link.`,
                );
              }
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
                {roleLabel(value)}
              </option>
            ))}
          </select>
        </Field>
        {role === "FINANCE" || role === "OWNER" || role === "MANAGER" ? (
          <p className="text-sm text-muted-foreground">
            This role can confirm Swish payments on unpaid manual-payment orders and notify the guest.
          </p>
        ) : null}
        <Button type="submit" size="touch">
          Send invite
        </Button>
        {inviteUrl ? (
          <div className="space-y-2 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10">
            <p className="font-medium text-foreground">
              {inviteForEmail ? `Setup link for ${inviteForEmail}` : "Setup link"}
              {emailDelivery === "sent"
                ? " (email also sent):"
                : emailDelivery === "mock"
                  ? " — share this while email is offline:"
                  : " — email failed, share this:"}
            </p>
            <p className="break-all text-muted-foreground">{inviteUrl}</p>
            <Button
              type="button"
              size="touch"
              variant="outline"
              onClick={() => {
                void copyText(inviteUrl).then(
                  () => toast.success("Setup link copied."),
                  () => toast.error("Could not copy the link."),
                );
              }}
            >
              Copy setup link
            </Button>
          </div>
        ) : null}
      </form>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-3">
        {staff.map((user) => (
          <li
            key={user.uid}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div>
              <p className="font-heading text-xl">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.pendingSetup ? (
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-earth">Awaiting first sign-in</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-earth">{roleLabel(user.role)}</p>
              {user.pendingSetup ? (
                <Button
                  type="button"
                  size="touch"
                  variant="outline"
                  disabled={busyUid === user.uid}
                  onClick={() => void fetchSetupLink(user.uid, user.email)}
                >
                  {busyUid === user.uid ? "Creating link…" : "Copy setup link"}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
