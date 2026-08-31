import { FirstOwnerSetup } from "@/components/admin/first-owner-setup";
import { StaffInvitePanel } from "@/components/admin/staff-invite";

export default function AdminStaffPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-10 empty:hidden">
        <FirstOwnerSetup />
      </div>
      <StaffInvitePanel />
    </>
  );
}
