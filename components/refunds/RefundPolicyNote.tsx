// components/refunds/RefundPolicyNote.tsx
'use client';

import React from 'react';
import { useRefundPolicy } from '@/hooks/useRefundPolicy';
import {
  calculateRefundPercentage,
  describeRefundLadder,
  hoursBeforeTest,
} from '@/lib/utils/refund-calculations';

interface RefundPolicyNoteProps {
  /** `booking_test_date` from the refund request. */
  testDate?: string | null;
  /** When the customer asked — the moment the server decided the percentage. */
  requestDate?: string | null;
  /** The percentage stored on the request. */
  storedPercentage?: number;
}

/**
 * What the cancellation policy said for this request, and what it says today.
 *
 * The stored `refund_percentage` was decided when the request was created, so
 * the comparison uses `request_date` — recomputing against "now" would report a
 * different band for every request as time passes. A mismatch means the ladder
 * has been edited in settings since the request came in.
 */
export default function RefundPolicyNote({
  testDate,
  requestDate,
  storedPercentage,
}: RefundPolicyNoteProps) {
  const { policy, fellBackFor } = useRefundPolicy();

  const ladder = describeRefundLadder(policy);
  const hours = testDate && requestDate ? hoursBeforeTest(testDate, requestDate) : null;
  const atRequest =
    testDate && requestDate
      ? calculateRefundPercentage(testDate, policy, new Date(requestDate))
      : null;

  const drifted =
    atRequest !== null && storedPercentage !== undefined && atRequest !== storedPercentage;

  return (
    <div className="rounded-md bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
      {hours !== null && atRequest !== null ? (
        <p>
          Requested <strong className="text-gray-900">{Math.round(hours)} h</strong> before the test
          — today’s policy puts that at{' '}
          <strong className="text-gray-900">{atRequest}%</strong>.
        </p>
      ) : (
        <p>Cancellation policy</p>
      )}

      <p className="mt-1">{ladder}</p>

      {drifted && (
        <p className="mt-1 text-amber-800">
          The request was stored at {storedPercentage}%, so the policy has changed since it came in.
          The customer was quoted the older figure.
        </p>
      )}

      {fellBackFor.length > 0 && (
        <p className="mt-1 text-amber-800">
          Some of these values are not set on the server, so the built-in defaults are shown.
        </p>
      )}
    </div>
  );
}
