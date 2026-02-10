'use client';

import { ChallengeType, CoxRaid } from '@blert/common';
import { ReactNode } from 'react';

import { createChallengeContextProvider } from '../../challenge-context-provider';

const { ActorContext, ChallengeProvider } =
  createChallengeContextProvider<CoxRaid>({
    buildUrl: (id) => `/api/v1/raids/cox/${id}`,
    challengeType: ChallengeType.COX,
  });

export { ActorContext };

export function CoxContextProvider({
  children,
  raidId,
}: {
  children: ReactNode;
  raidId: string;
}) {
  return <ChallengeProvider challengeId={raidId}>{children}</ChallengeProvider>;
}
