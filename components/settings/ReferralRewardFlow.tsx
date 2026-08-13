// components/settings/ReferralRewardFlow.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Gift, Share2, Ticket, UserPlus, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatCAD } from '@/lib/utils';

interface FlowStep {
  icon: LucideIcon;
  title: string;
  detail: string;
  /** Rides that must be completed, drawn as dots. */
  rides?: number;
}

function StepRow({ steps }: { steps: FlowStep[] }) {
  return (
    // four steps with a chevron between each pair, collapsing to a stack on mobile
    <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
      {steps.map((step, index) => (
        <React.Fragment key={step.title}>
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
            <step.icon className="h-4 w-4 text-violet-600" />
            <p className="mt-2 text-sm font-medium leading-snug text-gray-900">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{step.detail}</p>
            {typeof step.rides === 'number' && step.rides > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from({ length: Math.min(step.rides, 12) }).map((_, i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-violet-400" />
                ))}
                {step.rides > 12 && <span className="text-[10px] text-violet-600">+{step.rides - 12}</span>}
              </div>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className="hidden items-center justify-center md:flex">
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface ReferralRewardFlowProps {
  /** cents — the amount actually in force, server value or backend fallback */
  instructorReferralPrice: number;
  adminReferralPrice: number;
  minRides: number;
  /** Plain-English names of the rows the server does not have. */
  unsetLabels: string[];
}

export default function ReferralRewardFlow({
  instructorReferralPrice,
  adminReferralPrice,
  minRides,
  unsetLabels,
}: ReferralRewardFlowProps) {
  const rides = minRides;
  const ridesLabel = String(minRides);
  const peerAmount = instructorReferralPrice;
  const promoAmount = adminReferralPrice;

  const money = (cents: number) => formatCAD(cents, { suffix: false });

  return (
    <Card className="border-violet-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900">
          <Gift className="h-4 w-4 text-violet-600" />
          What a referral actually costs you
        </CardTitle>
        <p className="text-sm text-gray-600">
          Two different journeys pay out from these settings. The difference matters: one pays two
          people, the other pays one.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructor refers an instructor — two payouts */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">An instructor brings in another instructor</p>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">
              Costs you {formatCAD(peerAmount * 2, { suffix: false })} per success
            </span>
          </div>

          <StepRow
            steps={[
              {
                icon: Share2,
                title: 'They share their code',
                detail: 'Every instructor has a personal referral code in their app.',
              },
              {
                icon: UserPlus,
                title: 'Someone new joins with it',
                detail: 'The new instructor claims the code when signing up.',
              },
              {
                icon: Wallet,
                title: `They complete ${ridesLabel} rides`,
                detail: 'Nothing is paid before this. It is the proof the referral was real.',
                rides,
              },
              {
                icon: Gift,
                title: `Both are paid ${money(peerAmount)}`,
                detail: 'The one who referred and the one who joined each receive the bonus.',
              },
            ]}
          />
        </div>

        {/* Admin promo code — one payout */}
        <div className="space-y-3 border-t border-gray-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">Your team hands out a promo code</p>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">
              Costs you {money(promoAmount)} per claim
            </span>
          </div>

          <StepRow
            steps={[
              {
                icon: Ticket,
                title: 'You create the code',
                detail: `The bonus is pre-filled at ${money(promoAmount)} and can be overridden while creating it.`,
              },
              {
                icon: UserPlus,
                title: 'An instructor claims it',
                detail: 'The amount and ride requirement are frozen onto the code at this moment.',
              },
              {
                icon: Wallet,
                title: `They complete ${ridesLabel} rides`,
                detail: 'The same proof-of-work rule applies before anything is paid.',
                rides,
              },
              {
                icon: Gift,
                title: `They are paid ${money(promoAmount)}`,
                detail: 'Only the claiming instructor is paid — there is nobody to reward on the other side.',
              },
            ]}
          />
        </div>

        {unsetLabels.length > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>Heads up:</strong> {unsetLabels.join(' and ')}{' '}
            {unsetLabels.length === 1 ? 'is' : 'are'} not set up on your server, so the amounts above
            are the system’s built-in defaults. Codes are being created with them right now — ask
            your developer to add the missing rows if you want different numbers.
          </p>
        )}

        <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
          Changing an amount here never rewrites codes already in circulation — each code carries the
          amount and ride requirement it was created with. The instructor-to-instructor bonus is the
          exception: it is read at the moment of payout, so it also affects referrals still in
          progress.
        </p>
      </CardContent>
    </Card>
  );
}
