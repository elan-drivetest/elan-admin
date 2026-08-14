export type RefundStatus = "pending" | "approved" | "rejected" | "completed" | "processing" | "failed";

export interface RefundRequest {
  id?: number; // Optional - list endpoint may not return this
  booking_id: number;
  customer_id: number;
  customer_name?: string; // Optional - list endpoint may not return this
  customer_email?: string; // Optional - list endpoint may not return this
  customer_phone_number?: string; // Optional - list endpoint may not return this
  customer_address?: string; // Optional - list endpoint may not return this
  payment_transaction_id?: number; // Optional - list endpoint may not return this
  /**
   * The refund amount in cents — ALREADY `floor(booking.total_price * refund_percentage / 100)`.
   * Never multiply this by the percentage again.
   */
  amount: number;
  refund_percentage: number;
  /**
   * The booking's `total_price`. NOT currently returned by the API — the admin
   * refund query selects only `booking_test_date`. Declared so that the moment
   * the backend adds it, `deriveBookingTotal()` uses it instead of working
   * backwards from `amount`. See lib/utils/refund-calculations.ts.
   */
  booking_total_price?: number;
  /** The booking's 	est_date, aliased by the admin refund query. */
  booking_test_date?: string;
  request_date: string;
  status: RefundStatus;
  processed_at: string | null;
  stripe_refund_id: string | null;
  refund_reason: string | null;
  metadata: Record<string, any> | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundRequestsResponse {
  data: RefundRequest[];
  meta: {
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    prevCursor?: string; // backend key is prevCursor, not previousCursor
  };
}

export interface GetRefundRequestsParams {
  limit?: number;
  cursor?: string;
  direction?: "forward" | "backward";
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  search?: string;
  baseUrl?: string;
  status?: RefundStatus;
  customer_id?: number;
  booking_id?: number;
  startDate?: string;
  endDate?: string;
  customerName?: string;
}

export interface UpdateRefundRequestPayload {
  status?: RefundStatus;
  refund_percentage?: number;
  admin_notes?: string;
}
