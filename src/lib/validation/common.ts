import { z } from "zod";

export const oreSchema = z.number().int();

export const addressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  postalCode: z
    .string()
    .min(3)
    .max(12)
    .transform((value) => value.replace(/\s+/g, "")),
  city: z.string().min(1).max(80),
  country: z.string().length(2).optional().default("SE"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  formatted: z.string().max(300).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  phone: z.string().min(6).max(20),
  customerId: z.string().optional(),
  guestSessionId: z.string().optional(),
});

export const cartLineSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().max(200).optional(),
  modifiers: z.array(
    z.object({
      groupId: z.string().min(1),
      optionId: z.string().min(1),
      quantity: z.number().int().min(1).max(10),
    }),
  ),
});

export const cartQuoteSchema = z.object({
  restaurantId: z.string().min(1),
  lines: z.array(cartLineSchema).min(1).max(30),
  deliveryFeeOre: oreSchema.nonnegative().optional(),
  promotionCode: z.string().max(40).optional(),
  customerId: z.string().optional(),
  guestSessionId: z.string().optional(),
  isMember: z.boolean().optional(),
  isFirstOrder: z.boolean().optional(),
});
