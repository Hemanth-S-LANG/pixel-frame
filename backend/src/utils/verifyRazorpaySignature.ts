import crypto from "crypto";

/**
 * Verifies a Razorpay webhook/payment signature using HMAC-SHA256.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 *
 * @param razorpayOrderId   - The Razorpay order ID
 * @param razorpayPaymentId - The Razorpay payment ID
 * @param signature         - The signature received from Razorpay
 * @param secret            - RAZORPAY_KEY_SECRET from env
 * @returns true if the signature is valid, false otherwise
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const receivedBuf = Buffer.from(signature,          "hex");

  // timingSafeEqual requires buffers of the same length.
  // If lengths differ the signature is trivially invalid — return false immediately
  // without the equal-length requirement, which would throw.
  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
