import { AppError } from "@/lib/errors";
import { formatPublicOrderNumber, newAccessToken, newId } from "@/lib/ids";
import { sha256Hex, hashesEqual } from "@/lib/hash";
import { SCHEMA_VERSION } from "@/domains/shared/types";
import type { TransactionRunner } from "@/domains/shared/transaction";
import { applyInventoryDelta } from "@/domains/inventory/service";
import { CartService } from "@/domains/cart/service";
import type { CartQuoteRequest } from "@/domains/cart/models";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import type { AddressSnapshot, CustomerSnapshot } from "@/domains/shared/types";
import { applyOrderTransition } from "./state-machine";
import type { Order, OrderStatus } from "./models";
import type { OrderRepository } from "./repository";

export type FulfillmentMethod = "DELIVERY" | "PICKUP";

export interface CreateOrderRequest extends CartQuoteRequest {
  customer: CustomerSnapshot;
  deliveryAddress: AddressSnapshot;
  idempotencyKey: string;
  specialInstructions?: string;
  deliveryProvider?: string;
  fulfillment?: FulfillmentMethod;
  estimatedDeliveryTime?: string;
  deliveryQuoteId?: string;
}

export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly cart: CartService,
    private readonly transactions: TransactionRunner,
  ) {}

  async create(request: CreateOrderRequest): Promise<{ order: Order; accessToken: string }> {
    if (!request.idempotencyKey.trim()) {
      throw new AppError("VALIDATION", "An idempotency key is required.");
    }
    if (!request.customer.email || !request.customer.phone || !request.customer.name) {
      throw new AppError("VALIDATION", "Contact details are required.");
    }
    const quote = await this.cart.quote({
      ...request,
      deliveryAddress: request.deliveryAddress,
    });

    return this.transactions.run(async (tx) => {
      const existingId = await tx.getIdempotentOrderId(request.idempotencyKey);
      if (existingId) {
        const existing = await this.orders.getById(existingId);
        if (!existing) {
          throw new AppError("IDEMPOTENCY_CONFLICT", "This checkout was already started.");
        }
        return { order: existing, accessToken: "" };
      }

      const reservations = new Map<string, number>();
      for (const line of quote.lines) {
        if (!line.inventoryTracked || !line.inventorySku) {
          continue;
        }
        reservations.set(line.inventorySku, (reservations.get(line.inventorySku) ?? 0) + line.quantity);
      }

      for (const [sku, quantity] of reservations) {
        const inventory = await tx.getInventory(request.restaurantId, sku);
        if (!inventory || !inventory.tracked) {
          continue;
        }
        tx.saveInventory(applyInventoryDelta(inventory, -quantity));
      }

      if (quote.promotionCode) {
        const promotion = await tx.getPromotion(request.restaurantId, quote.promotionCode);
        if (promotion) {
          const customerKey = request.customer.customerId ?? request.guestSessionId ?? "anonymous";
          const usage = await tx.getPromotionUsage(promotion.id, customerKey);
          tx.savePromotionUsage({
            id: usage?.id ?? `${promotion.id}:${customerKey}`,
            promotionId: promotion.id,
            customerKey,
            count: (usage?.count ?? 0) + 1,
          });
        }
      }

      const now = new Date().toISOString();
      const accessToken = newAccessToken();
      const sequence = await tx.nextOrderSequence(request.restaurantId);
      const order: Order = {
        id: newId(),
        restaurantId: request.restaurantId,
        publicOrderNumber: formatPublicOrderNumber(sequence),
        accessTokenHash: sha256Hex(accessToken),
        customerId: request.customer.customerId,
        guestSessionId: request.guestSessionId,
        items: quote.lines.map((line) => ({
          menuItemId: line.menuItemId,
          name: line.name,
          quantity: line.quantity,
          unitPriceOre: line.unitPriceOre,
          modifierTotalOre: line.modifierTotalOre,
          lineTotalOre: line.lineTotalOre,
          notes: line.notes,
          modifiers: line.modifiers,
        })),
        subtotalOre: quote.subtotalOre,
        deliveryFeeOre: quote.deliveryFeeOre,
        discountTotalOre: quote.discountTotalOre,
        taxTotalOre: quote.taxTotalOre,
        totalOre: quote.totalOre,
        currency: "SEK",
        paymentStatus: "PENDING",
        orderStatus: "PENDING_PAYMENT",
        deliveryStatus: request.fulfillment === "PICKUP" ? "NOT_REQUESTED" : "QUOTED",
        deliveryProvider: request.fulfillment === "PICKUP" ? undefined : request.deliveryProvider,
        deliveryId: request.deliveryQuoteId,
        deliveryAddressSnapshot: request.deliveryAddress,
        customerSnapshot: request.customer,
        estimatedDeliveryTime: request.estimatedDeliveryTime,
        specialInstructions: request.specialInstructions,
        promotionCode: quote.promotionCode,
        idempotencyKey: request.idempotencyKey,
        schemaVersion: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
      };
      tx.createOrder(order);
      tx.saveIdempotency(request.idempotencyKey, order.id);
      return { order, accessToken };
    });
  }

  async getByPublicNumber(restaurantId: string, publicOrderNumber: string): Promise<Order | null> {
    return this.orders.getByPublicNumber(restaurantId, publicOrderNumber.trim().toUpperCase());
  }

  async getForCustomer(orderId: string, accessToken?: string, actor?: Actor): Promise<Order> {
    const order = await this.orders.getById(orderId);
    if (!order) {
      throw new AppError("NOT_FOUND", "Order not found.");
    }
    if (actor && authorizationService.can(actor, "orders:read")) {
      return order;
    }
    if (actor?.uid && order.customerId === actor.uid) {
      return order;
    }
    if (accessToken && hashesEqual(order.accessTokenHash, sha256Hex(accessToken))) {
      return order;
    }
    throw new AppError("FORBIDDEN", "You cannot view this order.");
  }

  async transition(actor: Actor, orderId: string, to: OrderStatus): Promise<Order> {
    authorizationService.requirePermission(actor, "orders:transition");
    const order = await this.orders.getById(orderId);
    if (!order) {
      throw new AppError("NOT_FOUND", "Order not found.");
    }
    return applyOrderTransition(order, to);
  }
}
