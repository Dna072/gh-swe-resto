import { AppError } from "@/lib/errors";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import type { CustomerRepository } from "./repository";
import type { PersonalDataExport } from "./models";

export class CustomerService {
  constructor(private readonly customers: CustomerRepository) {}

  async getProfile(actor: Actor, customerId: string) {
    authorizationService.assertSelfOrStaff(actor, customerId, "customers:read");
    const customer = await this.customers.getById(customerId);
    if (!customer || customer.deletedAt) {
      throw new AppError("NOT_FOUND", "Customer not found.");
    }
    return customer;
  }

  async exportPersonalData(actor: Actor, customerId: string): Promise<PersonalDataExport> {
    authorizationService.assertSelfOrStaff(actor, customerId, "customers:export");
    const customer = await this.getProfile(actor, customerId);
    const addresses = await this.customers.listAddresses(customerId);
    return {
      customer,
      addresses,
      orderIds: [],
    };
  }
}
