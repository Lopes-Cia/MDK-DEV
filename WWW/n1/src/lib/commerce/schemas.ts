import { z } from "zod";

export const COMMERCE_SCHEMA_VERSION = 1 as const;

const IsoDateStringSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime()) // fallback para ambientes que geram sem offset
  .describe("ISO date string");

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().min(6).optional().nullable(),
  passwordHash: z.string().min(1), // mock: usado apenas no server; nunca retornar para UI
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type User = z.infer<typeof UserSchema>;

export const PublicUserSchema = UserSchema.omit({ passwordHash: true });
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  tenant: z.string().min(1),
  userId: z.string().uuid(),
  token: z.string().min(24),
  createdAt: IsoDateStringSchema,
  expiresAt: IsoDateStringSchema.optional().nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

export const AddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(6),
  zipCode: z.string().min(5),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
});
export type Address = z.infer<typeof AddressSchema>;

export const PaymentMethodSchema = z.enum(["pix", "credit_card", "cash"]);

export const PaymentSchema = z.object({
  method: PaymentMethodSchema,
  status: z.enum(["pending", "paid", "failed"]).default("pending"),
  transactionId: z.string().optional().nullable(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.number().int().nonnegative(),
  sku: z.string().optional().nullable(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderTotalsSchema = z.object({
  itemsSubtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  grandTotal: z.number().nonnegative(),
  currency: z.string().default("BRL"),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  tenant: z.string().min(1),
  userId: z.string().uuid(),
  status: z.enum(["created", "paid", "shipped", "delivered", "canceled"]).default("created"),
  items: z.array(OrderItemSchema).min(1),
  address: AddressSchema,
  payment: PaymentSchema,
  totals: OrderTotalsSchema,
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type Order = z.infer<typeof OrderSchema>;

export const UsersFileSchema = z.object({
  schemaVersion: z.literal(COMMERCE_SCHEMA_VERSION),
  users: z.array(UserSchema),
});
export type UsersFile = z.infer<typeof UsersFileSchema>;

export const SessionsFileSchema = z.object({
  schemaVersion: z.literal(COMMERCE_SCHEMA_VERSION),
  sessions: z.array(SessionSchema),
});
export type SessionsFile = z.infer<typeof SessionsFileSchema>;

export const OrdersFileSchema = z.object({
  schemaVersion: z.literal(COMMERCE_SCHEMA_VERSION),
  orders: z.array(OrderSchema),
});
export type OrdersFile = z.infer<typeof OrdersFileSchema>;

export const CartItemSchema = z.object({
  productId: z.number().int().nonnegative(),
  sku: z.string().optional().nullable(),
  name: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  qty: z.number().int().positive(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartTotalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.string().default("BRL"),
});
export type CartTotals = z.infer<typeof CartTotalsSchema>;

export const CartSchema = z.object({
  id: z.string().min(1), // no MVP pode ser igual ao userId
  userId: z.string().uuid(),
  items: z.array(CartItemSchema).default([]),
  totals: CartTotalsSchema,
  updatedAt: IsoDateStringSchema,
});
export type Cart = z.infer<typeof CartSchema>;

export const CartsFileSchema = z.object({
  schemaVersion: z.literal(COMMERCE_SCHEMA_VERSION),
  carts: z.array(CartSchema),
});
export type CartsFile = z.infer<typeof CartsFileSchema>;

export const PasswordResetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string().min(24),
  expiresAt: IsoDateStringSchema,
  usedAt: IsoDateStringSchema.optional().nullable(),
  createdAt: IsoDateStringSchema.optional(),
});
export type PasswordReset = z.infer<typeof PasswordResetSchema>;

export const PasswordResetsFileSchema = z.object({
  schemaVersion: z.literal(COMMERCE_SCHEMA_VERSION),
  passwordResets: z.array(PasswordResetSchema),
});
export type PasswordResetsFile = z.infer<typeof PasswordResetsFileSchema>;
