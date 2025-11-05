export type RefundStatus = "pending" | "approved" | "rejected";

export interface RefundRequest {
  id: number;
  booking_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone_number: string;
  customer_address: string;
  payment_transaction_id: number;
  amount: number;
  refund_percentage: number;
  request_date: string;
  status: RefundStatus;
  processed_at: string | null;
  stripe_refund_id: string | null;
  refund_reason: string;
  metadata: Record<string, any>;
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
    previousCursor?: string;
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
