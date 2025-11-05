import axios from "axios";
import {
  RefundRequest,
  RefundRequestsResponse,
  GetRefundRequestsParams,
  UpdateRefundRequestPayload,
} from "@/types/refund";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-dev.elanroadtestrental.ca/v1";

const refundApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Response interceptor for handling errors
refundApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const refundService = {
  /**
   * Get all refund requests with optional filters
   */
  getRefundRequests: async (
    params?: GetRefundRequestsParams
  ): Promise<RefundRequestsResponse> => {
    const response = await refundApi.get<RefundRequestsResponse>(
      "/admin/refund-requests",
      { params }
    );
    return response.data;
  },

  /**
   * Get refund request by ID
   */
  getRefundRequestById: async (id: number): Promise<RefundRequest> => {
    const response = await refundApi.get<RefundRequest>(
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
    const response = await refundApi.patch<RefundRequest>(
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
