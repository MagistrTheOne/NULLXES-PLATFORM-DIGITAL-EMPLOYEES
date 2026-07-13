import "server-only";

import {
  getTbankApiBase,
  getTbankFailUrl,
  getTbankNotificationUrl,
  getTbankPassword,
  getTbankSuccessUrl,
  getTbankTaxation,
  getTbankTerminalKey,
  getTbankVat,
  isTbankReceiptEnabled,
} from "./config";
import { buildTbankToken } from "./token";

export type TbankApiResponse = {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  TerminalKey?: string;
  Status?: string;
  PaymentId?: string | number;
  OrderId?: string;
  Amount?: number;
  PaymentURL?: string;
};

export type TbankReceiptItem = {
  Name: string;
  Price: number;
  Quantity: number;
  Amount: number;
  Tax: string;
  PaymentMethod?: string;
  PaymentObject?: string;
};

export type InitPaymentInput = {
  amountKopecks: number;
  orderId: string;
  description: string;
  customerKey?: string;
  customerEmail?: string;
  language?: "ru" | "en";
  /** Override Receipt inclusion (default: on for bank fiscalization tests). */
  withReceipt?: boolean;
};

function requireCredentials(): { terminalKey: string; password: string } {
  const terminalKey = getTbankTerminalKey();
  const password = getTbankPassword();
  if (!terminalKey || !password) {
    throw new Error(
      "T-Bank is not configured (TBANK_TERMINAL_KEY / TBANK_PASSWORD)",
    );
  }
  return { terminalKey, password };
}

async function postTbank(
  method: string,
  body: Record<string, unknown>,
): Promise<TbankApiResponse> {
  const { password } = requireCredentials();
  const payload = { ...body };
  payload.Token = buildTbankToken(payload, password);

  const response = await fetch(`${getTbankApiBase()}/v2/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json()) as TbankApiResponse;
  return data;
}

/** Fiscal Receipt for Init (54-FZ / bank tests 7–8). */
export function buildTbankReceipt(input: {
  amountKopecks: number;
  description: string;
  email?: string;
}): Record<string, unknown> {
  const item: TbankReceiptItem = {
    Name: input.description.slice(0, 128),
    Price: input.amountKopecks,
    Quantity: 1,
    Amount: input.amountKopecks,
    Tax: getTbankVat(),
    PaymentMethod: "full_payment",
    PaymentObject: "service",
  };

  const receipt: Record<string, unknown> = {
    Taxation: getTbankTaxation(),
    Items: [item],
  };

  if (input.email) {
    receipt.Email = input.email;
  }

  return receipt;
}

export async function initTbankPayment(
  input: InitPaymentInput,
): Promise<TbankApiResponse> {
  const { terminalKey } = requireCredentials();
  const includeReceipt = input.withReceipt ?? isTbankReceiptEnabled();

  const body: Record<string, unknown> = {
    TerminalKey: terminalKey,
    Amount: input.amountKopecks,
    OrderId: input.orderId,
    Description: input.description.slice(0, 140),
    Language: input.language ?? "ru",
    SuccessURL: buildTbankReturnUrl(getTbankSuccessUrl(), input.orderId),
    FailURL: buildTbankReturnUrl(getTbankFailUrl(), input.orderId),
    NotificationURL: getTbankNotificationUrl(),
    PayType: "O",
  };

  if (input.customerKey) {
    body.CustomerKey = input.customerKey;
  }

  if (input.customerEmail) {
    body.DATA = { Email: input.customerEmail };
  }

  if (includeReceipt) {
    body.Receipt = buildTbankReceipt({
      amountKopecks: input.amountKopecks,
      description: input.description,
      email: input.customerEmail,
    });
  }

  return postTbank("Init", body);
}

export async function getTbankPaymentState(
  paymentId: string,
): Promise<TbankApiResponse> {
  const { terminalKey } = requireCredentials();
  return postTbank("GetState", {
    TerminalKey: terminalKey,
    PaymentId: paymentId,
  });
}

/**
 * Full cancel — do not send Receipt.Items (bank forms refund check from Init).
 * @see https://developer.tinkoff.ru/eacq/api/cancel
 */
export async function cancelTbankPayment(
  paymentId: string,
): Promise<TbankApiResponse> {
  const { terminalKey } = requireCredentials();
  return postTbank("Cancel", {
    TerminalKey: terminalKey,
    PaymentId: paymentId,
  });
}

/** Resolve PaymentId from OrderId when SuccessURL lost PaymentId. */
export async function checkTbankOrder(
  orderId: string,
): Promise<TbankApiResponse & { Payments?: Array<{ PaymentId?: string | number; Status?: string }> }> {
  const { terminalKey } = requireCredentials();
  return postTbank("CheckOrder", {
    TerminalKey: terminalKey,
    OrderId: orderId,
  }) as Promise<
    TbankApiResponse & {
      Payments?: Array<{ PaymentId?: string | number; Status?: string }>;
    }
  >;
}

export function buildTbankReturnUrl(
  baseUrl: string,
  orderId: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("OrderId", orderId);
  return url.toString();
}
