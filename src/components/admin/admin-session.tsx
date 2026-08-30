"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { clearAdminToken, getAdminToken, setAdminToken } from "@/lib/admin/client";

export function AdminSession() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="border-b border-border bg-secondary/60">
      <form
        className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setAdminToken(token.trim() || getAdminToken());
          setSaved(true);
        }}
      >
        <Field
          id="admin-token"
          label="Admin token"
          hint="Development only. Production uses a Firebase staff session."
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
    </div>
  );
}
