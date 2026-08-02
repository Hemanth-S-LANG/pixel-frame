import "dotenv/config";
import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log("Using Razorpay Key:", key_id);

const razorpay = new Razorpay({
  key_id: key_id as string,
  key_secret: key_secret as string,
});

async function run() {
  try {
    const order = await razorpay.orders.create({
      amount: 500, // 5 INR in paise
      currency: "INR",
      receipt: "receipt_test_123",
    });
    console.log("SUCCESS! Razorpay order created successfully:", order.id);
  } catch (error) {
    console.error("FAILURE! Failed to create Razorpay order:", error);
  }
}

run();
