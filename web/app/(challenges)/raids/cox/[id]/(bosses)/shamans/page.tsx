'use client';

import {
  ChallengeStatus,
  CoxRaid,
  Npc,
  Stage,
} from '@blert/common';

import { useContext, useMemo } from 'react';

// import { TimelineColor } from '@/components/attack-timeline';
import BossFightOverview from '@/components/boss-fight-overview';
import BossPageAttackTimeline from '@/components/boss-page-attack-timeline';
import BossPageControls from '@/components/boss-page-controls';
import BossPageDPSTimeline from '@/components/boss-page-dps-timeline';
import BossPageParty from '@/components/boss-page-party';
import Card from '@/components/card';
import Loading from '@/components/loading';
import { ActorContext } from '@/(challenges)/raids/cox/context';
import {
  EnhancedRoomNpc,
  usePlayingState,
  useStageEvents,
} from '@/utils/boss-room-state';

import bossStyles from '../style.module.scss';

export default function ShamansPage() {
  const {
    challenge,
    totalTicks,
    eventsByType,
    playerState,
    npcState,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_SHAMANS);

  const { currentTick, setTick, playing, setPlaying } =
    usePlayingState(totalTicks);

  const { setSelectedPlayer, selectedPlayer } = useContext(ActorContext);

  const bossHealthChartData = useMemo(() => {
    let lizardmanShaman: EnhancedRoomNpc | null = null;
    const iter = npcState.values();
    for (let npc = iter.next(); !npc.done; npc = iter.next()) {
      if (Npc.isLizardmanShaman(npc.value.spawnNpcId)) {
        lizardmanShaman = npcState.get(npc.value.roomId)!;
        break;
      }
    }

    return (
      lizardmanShaman?.stateByTick.map((state, tick) => ({
        tick,
        bossHealthPercentage: state?.hitpoints.percentage() ?? 0,
      })) ?? []
    );
  }, [npcState]);

  if (loading || challenge === null) {
    return <Loading />;
  }

  const lizardmanShamanData = challenge.coxRooms.shamans;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && lizardmanShamanData === null) {
    return <>No Lizardman Shaman data for this raid</>;
  }

  const playerTickState = challenge.party.reduce(
    (acc, { username }) => ({
      ...acc,
      [username]: playerState.get(username)?.at(currentTick) ?? null,
    }),
    {},
  );

  const stats = [
    {
      title: 'Room Statistics',
      content: (
        <div>
          <table>
            <tbody>
              <tr>
                <td>
                  <i className="fa-solid fa-stopwatch" style={{ paddingRight: 10 }} />
                  <span className="sr-only">Duration</span>
                </td>
                <td>{totalTicks} ticks</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={bossStyles.overview}>
        <BossFightOverview
          name="Lizardman Shaman"
          image="/images/cox/shamans.png"
          time={totalTicks}
          sections={stats}
        />
      </div>

      <div className={bossStyles.timeline}>
        <BossPageAttackTimeline
          currentTick={currentTick}
          playing={playing}
          playerState={playerState}
          timelineTicks={totalTicks}
          updateTickOnPage={setTick}
          npcs={npcState}
          splits={[]}
          backgroundColors={[]}
        />
      </div>

      <div className={bossStyles.replayAndParty}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Map replay coming soon</p>
        </div>
        <BossPageParty
          playerTickState={playerTickState}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
        />
      </div>

      <div className={bossStyles.charts}>
        <Card
          className={bossStyles.chart}
          header={{ title: "Lizardman Shaman's Health By Tick" }}
        >
          <BossPageDPSTimeline
            currentTick={currentTick}
            data={bossHealthChartData}
            width="100%"
            height="100%"
          />
        </Card>
      </div>

      <BossPageControls
        currentlyPlaying={playing}
        totalTicks={totalTicks}
        currentTick={currentTick}
        updateTick={setTick}
        updatePlayingState={setPlaying}
        splits={[]}
      />
    </>
  );
}
