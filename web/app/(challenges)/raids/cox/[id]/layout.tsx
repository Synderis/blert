import { ChallengeType } from '@blert/common';
import { ResolvingMetadata } from 'next';

import { loadChallenge } from '@/actions/challenge';
import ChallengeNav from '@/components/challenge-nav';
import { statusNameAndColor } from '@/utils/challenge';
import { challengePageDescription } from '@/utils/challenge-description';
import { ticksToFormattedSeconds } from '@/utils/tick';

import { CoxContextProvider } from '../context';

import styles from './style.module.scss';

type RaidParams = {
  id: string;
};

type RaidLayoutProps = {
  params: Promise<RaidParams>;
  children: React.ReactNode;
};

export default async function RaidLayout({
  params,
  children,
}: RaidLayoutProps) {
  const { id } = await params;

  return (
    <div className={styles.raid}>
      <CoxContextProvider raidId={id}>
        <ChallengeNav challengeId={id} />
        <div className={styles.content}>{children}</div>
      </CoxContextProvider>
    </div>
  );
}

export async function generateMetadata(
  { params }: RaidLayoutProps,
  parent: ResolvingMetadata,
) {
  const { id } = await params;

  const [raid, metadata] = await Promise.all([
    loadChallenge(ChallengeType.COX, id),
    parent,
  ]);

  if (raid === null) {
    return { title: 'Not Found' };
  }

  const [overallStatus] = statusNameAndColor(raid.status, raid.stage);

  let title = '';
  if (raid.challengeTicks > 0) {
    title = `${ticksToFormattedSeconds(raid.challengeTicks)} `;
  }

  switch (raid.scale) {
    case 1:
      title += 'Solo ';
      break;
    case 2:
      title += 'Duo ';
      break;
    case 3:
      title += 'Trio ';
      break;
    case 4:
      title += '4s ';
      break;
    case 5:
      title += '5s ';
      break;
  }

  title += `CoX ${overallStatus}`;

  const description = challengePageDescription(raid);

  return {
    title,
    description,
    openGraph: { ...metadata.openGraph, description },
    twitter: {
      ...metadata.twitter,
      title,
      description,
    },
  };
}
