import type { AddressSnapshot, Timestamped } from "@/domains/shared/types";

export interface Customer extends Timestamped {
  id: string;
  authUid?: string;
  email: string;
  name: string;
  phone?: string;
  marketingOptIn: boolean;
  deletedAt?: string;
}

export interface CustomerAddress extends AddressSnapshot, Timestamped {
  id: string;
  customerId: string;
  label?: string;
  isDefault: boolean;
}

export interface PersonalDataExport {
  customer: Customer;
  addresses: CustomerAddress[];
  orderIds: string[];
}
