import { z } from "zod";
import { addressSchema, cartLineSchema, contactSchema } from "./common";

export const fulfillmentSchema = z.enum(["DELIVERY", "PICKUP"]);

export const deliveryQuoteSchema = z.object({
  restaurantId: z.string().min(1),
  address: addressSchema,
  orderValueOre: z.number().int().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  fulfillment: fulfillmentSchema.default("DELIVERY"),
  lines: z.array(cartLineSchema).min(1).max(30),
  customer: contactSchema,
  deliveryAddress: addressSchema.optional(),
  specialInstructions: z.string().max(300).optional(),
  promotionCode: z.string().max(40).optional(),
  guestSessionId: z.string().max(80).optional(),
});
