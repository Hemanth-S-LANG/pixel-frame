export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    headers,
    credentials: "include", // sends httpOnly admin_token cookie automatically
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Programs
export const getPrograms = () => fetchApi<Program[]>("/programs");
export const getProgramById = (id: string) => fetchApi<Program>(`/programs/${id}`);

// Availability
export const getAvailableDates = (programId: string | undefined, month: string) =>
  fetchApi<string[]>(`/bookings/available-dates?month=${month}${programId ? `&programId=${programId}` : ''}`);

export const getAvailableSlots = (date: string, programId?: string) =>
  fetchApi<TimeSlotWithProgram[]>(`/bookings/available-slots?date=${date}${programId ? `&programId=${programId}` : ''}`);

// Bookings
export const createBooking = (data: CreateBookingPayload) =>
  fetchApi<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getBookingById = (id: string) => fetchApi<Booking>(`/bookings/${id}`);

// Payments
export const createPaymentOrder = (data: { amount: number; currency?: string; programName?: string; customerEmail?: string }) =>
  fetchApi<PaymentOrder>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const verifyPayment = (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
  fetchApi<{ orderId: string; paymentId: string }>("/payments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Types
export interface Program {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  category: string;
  image: string;
  icon: string;
  tags: string[];
  isActive: boolean;
}

export interface TimeSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  program: string;
  isBooked: boolean;
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
  blockReason?: string;
}

// TimeSlot with program populated — returned by getAvailableSlots
export interface TimeSlotWithProgram extends Omit<TimeSlot, "program"> {
  program: Program;
}

export interface Booking {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  program: Program;
  timeSlot: TimeSlot;
  bookingDate: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentStatus: string;
  bookingStatus: string;
  notes: string;
  createdAt: string;
}

export interface CreateBookingPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  programId: string;
  timeSlotId: string;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  notes?: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

// ---- Admin APIs ----

// Login (no auth required) — sets httpOnly cookie, no token in response body
export const adminLogin = (data: { username: string; password: string }) =>
  fetchApi<{ username: string; expiresIn: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Logout — clears the httpOnly cookie server-side
export const adminLogout = () =>
  fetchApi<{ message: string }>("/admin/logout", { method: "POST" });

export const adminBlockDate = (data: { date: string; reason?: string }) =>
  fetchApi<{ blockedSlots: number }>("/admin/block-date", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminUnblockDate = (data: { date: string }) =>
  fetchApi<{ unblockedSlots: number }>("/admin/unblock-date", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminBlockSlot = (data: { slotId: string; reason?: string }) =>
  fetchApi<TimeSlot>("/admin/block-slot", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminUnblockSlot = (data: { slotId: string }) =>
  fetchApi<TimeSlot>("/admin/unblock-slot", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminGetSlots = (date: string) =>
  fetchApi<AdminSlot[]>(`/admin/slots?date=${date}`);

export const adminGetBookings = (page = 1, limit = 20) =>
  fetchApi<Booking[]>(`/admin/bookings?page=${page}&limit=${limit}`);

export const adminGetStats = () =>
  fetchApi<AdminStats>("/admin/stats");

export const getBlockedDatesForMonth = (month: string, programId?: string) =>
  fetchApi<{ blockedDates: string[]; blockReasons: Record<string, string> }>(`/bookings/blocked-dates?month=${month}${programId ? `&programId=${programId}` : ''}`);

// Admin types
export interface AdminSlot extends Omit<TimeSlot, "program"> {
  blockReason?: string;
  program: Program | { _id: string; name: string; category: string };
}

export interface AdminStats {
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  totalPrograms: number;
}

export const adminUpdateSlot = (slotId: string, data: { startTime: string; endTime: string; program?: string }) =>
  fetchApi<AdminSlot>(`/admin/slots/${slotId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const adminCreateSlot = (data: { date: string; startTime: string; endTime: string; program: string }) =>
  fetchApi<AdminSlot>("/admin/slots", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminDeleteSlot = (slotId: string) =>
  fetchApi<{ message: string }>(`/admin/slots/${slotId}`, {
    method: "DELETE",
  });

export const adminUpdateBlockReason = (data: { date: string; reason: string }) =>
  fetchApi<{ message: string }>("/admin/update-block-reason", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const adminGetAvailableDates = (month: string) =>
  fetchApi<string[]>(`/admin/available-dates?month=${month}`);

// ---- Messages ----
export const submitMessage = (data: {
  name: string; email: string; phone: string;
  phoneVerified: boolean; service?: string; message: string;
}) =>
  fetchApi<{ _id: string }>("/messages", { method: "POST", body: JSON.stringify(data) });

export const adminGetMessages = (page = 1, limit = 20) =>
  fetchApi<ContactMessage[]>(`/admin/messages?page=${page}&limit=${limit}`);

export const adminGetUnreadCount = () =>
  fetchApi<{ count: number }>("/admin/messages/unread-count");

export const adminMarkMessageRead = (id: string) =>
  fetchApi<ContactMessage>(`/admin/messages/${id}/read`, { method: "PATCH" });

export const adminDeleteMessage = (id: string) =>
  fetchApi<{ message: string }>(`/admin/messages/${id}`, { method: "DELETE" });

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  service: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
