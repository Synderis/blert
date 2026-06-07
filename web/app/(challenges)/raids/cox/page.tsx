import { ChallengeType } from '@blert/common';
import { ResolvingMetadata } from 'next';

import { basicMetadata } from '@/utils/metadata';
import ChallengePage from '../../challenge-page';

export default function Page() {
  return <ChallengePage type={ChallengeType.COX} />;
}

export async function generateMetadata(
  _props: Record<string, never>,
  parent: ResolvingMetadata,
) {
  return basicMetadata(await parent, {
    title: 'Chambers of Xeric Activity — OSRS Raid Stats & Analytics',
    description:
      'Track recent Chambers of Xeric raids with real-time session breakdowns, ' +
      "completion stats, and player activity. See who's raiding, how long " +
      "they lasted, and where they wiped on Blert, Old School RuneScape's " +
      'premier PvM tracker.',
  });
}

export const dynamic = 'force-dynamic';