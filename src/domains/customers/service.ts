import { AppError } from "@/lib/errors";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import type { AuthAdminPort } from "@/domains/auth/ports";
import type { NotificationService } from "@/domains/notifications/service";
import { storefrontOrigin } from "@/lib/brand/hosts";
import { newId } from "@/lib/ids";
import type { Customer } from "./models";
import type { CustomerRepository } from "./repository";
import type { PersonalDataExport } from "./models";

export class CustomerService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly auth: AuthAdminPort,
    private readonly notifications: NotificationService,
  ) {}

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

  async register(input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    marketingOptIn?: boolean;
  }): Promise<{ customer: Customer; localToken: string | null }> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!email || !name || input.password.length < 8) {
      throw new AppError("VALIDATION", "Name, email, and a password of at least 8 characters are required.");
    }
    const existingAuth = await this.auth.getUserByEmail(email);
    if (existingAuth) {
      throw new AppError("CONFLICT", "An account with this email already exists.");
    }
    let record;
    try {
      record = await this.auth.createUser({
        email,
        password: input.password,
        displayName: name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already/i.test(message)) {
        throw new AppError("CONFLICT", "An account with this email already exists.");
      }
      throw new AppError("INTERNAL", "We could not create that account.");
    }
    const now = new Date().toISOString();
    const customer = await this.customers.upsert({
      id: record.uid,
      authUid: record.uid,
      email,
      name,
      phone: input.phone?.trim() || undefined,
      marketingOptIn: Boolean(input.marketingOptIn),
      createdAt: now,
      updatedAt: now,
    });
    const ctaUrl = `${storefrontOrigin()}/account`;
    try {
      const verifyUrl = await this.auth.generateEmailVerificationLink(email, ctaUrl);
      await this.notifications.notify({
        event: "ACCOUNT_CREATED",
        to: email,
        idempotencyKey: `account-created:${record.uid}`,
        vars: { guestName: name, ctaUrl: verifyUrl || ctaUrl },
      });
    } catch {
      await this.notifications.notify({
        event: "ACCOUNT_CREATED",
        to: email,
        idempotencyKey: `account-created:${record.uid}`,
        vars: { guestName: name, ctaUrl },
      });
    }
    return { customer, localToken: this.auth.issueLocalSessionToken(record.uid) };
  }

  async login(email: string, password: string): Promise<{ customer: Customer; localToken: string }> {
    const record = await this.auth.verifyPassword(email, password);
    if (!record) {
      throw new AppError("UNAUTHORIZED", "Email or password is not correct.");
    }
    const token = this.auth.issueLocalSessionToken(record.uid);
    if (!token) {
      throw new AppError("UNAUTHORIZED", "Sign in with the restaurant account form.");
    }
    const customer = await this.ensureProfile({
      uid: record.uid,
      email: record.email,
      name: record.displayName ?? record.email,
    });
    return { customer, localToken: token };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new AppError("VALIDATION", "Email is required.");
    }
    const record = await this.auth.getUserByEmail(normalized);
    if (!record) {
      return;
    }
    const continueUrl = `${storefrontOrigin()}/account`;
    const resetUrl = await this.auth.generatePasswordResetLink(normalized, continueUrl);
    await this.notifications.notify({
      event: "PASSWORD_RESET",
      to: normalized,
      idempotencyKey: `password-reset:${record.uid}:${new Date().toISOString().slice(0, 13)}`,
      vars: { ctaUrl: resetUrl },
    });
  }

  async ensureProfile(session: { uid: string; email?: string; name?: string; phone?: string }): Promise<Customer> {
    const existing = (await this.customers.getByAuthUid(session.uid)) ?? (await this.customers.getById(session.uid));
    const now = new Date().toISOString();
    if (existing) {
      return this.customers.upsert({
        ...existing,
        email: session.email ?? existing.email,
        name: session.name ?? existing.name,
        phone: session.phone ?? existing.phone,
        updatedAt: now,
      });
    }
    return this.customers.upsert({
      id: session.uid || newId(),
      authUid: session.uid,
      email: session.email ?? "",
      name: session.name ?? "Guest",
      phone: session.phone,
      marketingOptIn: false,
      createdAt: now,
      updatedAt: now,
    });
  }
}
