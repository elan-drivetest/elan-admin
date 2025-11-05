import { useState, useEffect } from "react";
import { refundService } from "@/services/refund";
import {
  RefundRequest,
  RefundRequestsResponse,
  GetRefundRequestsParams,
  UpdateRefundRequestPayload,
} from "@/types/refund";
import { toast } from "sonner";

export const useRefunds = (initialParams?: GetRefundRequestsParams) => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchRefunds = async (params?: GetRefundRequestsParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await refundService.getRefundRequests({
        ...initialParams,
        ...params,
      });
      setRefunds(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch refund requests";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(initialParams);
  }, []);

  return {
    refunds,
    loading,
    error,
    meta,
    refetch: fetchRefunds,
  };
};

export const useRefundDetail = (id: number | null) => {
  const [refund, setRefund] = useState<RefundRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRefund = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await refundService.getRefundRequestById(id);
      setRefund(response);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch refund details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefund();
  }, [id]);

  return {
    refund,
    loading,
    error,
    refetch: fetchRefund,
  };
};

export const useUpdateRefund = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRefund = async (
    id: number,
    payload: UpdateRefundRequestPayload
  ): Promise<RefundRequest | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await refundService.updateRefundRequest(id, payload);
      toast.success("Refund request updated successfully");
      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update refund request";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateRefund,
    loading,
    error,
  };
};

export const usePendingRefundsCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = async () => {
    setLoading(true);
    try {
      const response = await refundService.getPendingRefundRequests({
        limit: 1,
      });
      // Since we don't have total count from API, we'll need to fetch with a large limit
      // or track from the meta data
      setCount(response.data.length);
    } catch (err) {
      console.error("Failed to fetch pending refunds count", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  return {
    count,
    loading,
    refetch: fetchCount,
  };
};
