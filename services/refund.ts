import { apiClient } from "@/lib/axios";
import {
  RefundRequest,
  RefundRequestsResponse,
  GetRefundRequestsParams,
  UpdateRefundRequestPayload,
} from "@/types/refund";

export const refundService = {
  /**
   * Get all refund requests with optional filters
   */
  getRefundRequests: async (
    params?: GetRefundRequestsParams
  ): Promise<RefundRequestsResponse> => {
    const response = await apiClient.get<RefundRequestsResponse>(
      "/admin/refund-requests",
      { params }
    );
    return response.data;
  },

  /**
   * Get refund request by ID
   */
  getRefundRequestById: async (id: number): Promise<RefundRequest> => {
    const response = await apiClient.get<RefundRequest>(
      `/admin/refund-requests/${id}`
    );
    return response.data;
  },

  /**
   * Update refund request (approve/reject)
   */
  updateRefundRequest: async (
    id: number,
    payload: UpdateRefundRequestPayload
  ): Promise<RefundRequest> => {
    const response = await apiClient.patch<RefundRequest>(
      `/admin/refund-requests/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Get refund requests by customer ID
   */
  getRefundRequestsByCustomer: async (
    customerId: number,
    params?: Omit<GetRefundRequestsParams, "customer_id">
  ): Promise<RefundRequestsResponse> => {
    return refundService.getRefundRequests({
      ...params,
      customer_id: customerId,
    });
  },

  /**
   * Get refund requests by booking ID
   */
  getRefundRequestsByBooking: async (
    bookingId: number
  ): Promise<RefundRequestsResponse> => {
    return refundService.getRefundRequests({
      booking_id: bookingId,
    });
  },

  /**
   * Get pending refund requests
   */
  getPendingRefundRequests: async (
    params?: Omit<GetRefundRequestsParams, "status">
  ): Promise<RefundRequestsResponse> => {
    return refundService.getRefundRequests({
      ...params,
      status: "pending",
    });
  },
};
