import type { Customer, CustomerAddress } from "./models";

export interface CustomerRepository {
  getById(customerId: string): Promise<Customer | null>;
  getByAuthUid(authUid: string): Promise<Customer | null>;
  listAddresses(customerId: string): Promise<CustomerAddress[]>;
  upsert(customer: Customer): Promise<Customer>;
}
