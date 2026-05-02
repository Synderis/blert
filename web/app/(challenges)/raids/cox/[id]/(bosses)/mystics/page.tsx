'use client';

import {
  ChallengeStatus,
  CoxRaid,
  EventType,
  Npc,
  SkillLevel,
  Stage,
} from '@blert/common';

import { useContext, useMemo } from 'react';

// import { TimelineColor } from '@/components/attack-timeline';
import BossFightOverview from '@/components/boss-fight-overview';
import BossPageAttackTimeline from '@/components/boss-page-attack-timeline';
import BossPageControls from '@/components/boss-page-controls';
import BossPageDPSTimeline from '@/components/boss-page-dps-timeline';
import BossPageParty from '@/components/boss-page-party';
import BossPageReplay from '@/components/boss-page-replay';
import Card from '@/components/card';
import { MapDefinition } from '@/components/map-renderer';
import Loading from '@/components/loading';
import { useDisplay } from '@/display';
import { ActorContext } from '@/(challenges)/raids/cox/context';
import {
  EnhancedRoomNpc,
  useMapEntities,
  usePlayingState,
  useStageEvents,
} from '@/utils/boss-room-state';

import bossStyles from '../style.module.scss';

const MYSTICS_MAP_DEFINITION: MapDefinition = {
  baseX: 3265,
  baseY: 5250,
  width: 28,
  height: 28,
  plane: 1,
};

export default function MysticsPage() {
  const display = useDisplay();

  const compact = display.isCompact();

  const {
    challenge,
    totalTicks,
    events,
    playerState,
    npcState,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_MYSTICS);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 12 : 20;
    return {
      ...MYSTICS_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedPlayer, selectedPlayer } = useContext(ActorContext);

  const bossHealthChartData = useMemo(() => {
    let mystic: EnhancedRoomNpc | null = null;
    const iter = npcState.values();
    for (let npc = iter.next(); !npc.done; npc = iter.next()) {
      if (Npc.isSkeletalMystic(npc.value.spawnNpcId)) {
        mystic = npc.value;
        break;
      }
    }

    if (mystic !== null) {
      return mystic.stateByTick.map((state, tick) => ({
        tick,
        bossHealthPercentage: state?.hitpoints.percentage() ?? 0,
      }));
    }

    const healthByTick = new Map<number, number>();
    for (const event of events) {
      if (
        event.type === EventType.NPC_UPDATE &&
        event.npc !== undefined &&
        Npc.isSkeletalMystic(event.npc.id)
      ) {
        healthByTick.set(
          event.tick,
          SkillLevel.fromRaw(event.npc.hitpoints).percentage(),
        );
      }
    }

    if (healthByTick.size === 0) {
      return [];
    }

    const maxTick = Math.max(...healthByTick.keys());
    const chartData = [];
    let lastHealth = 0;
    for (let tick = 0; tick <= maxTick; tick++) {
      const healthAtTick = healthByTick.get(tick);
      if (healthAtTick !== undefined) {
        lastHealth = healthAtTick;
      }
      chartData.push({
        tick,
        bossHealthPercentage: lastHealth,
      });
    }

    return chartData;
  }, [events, npcState]);

  const { entitiesByTick, preloads } = useMapEntities(
    challenge,
    playerState,
    npcState,
    totalTicks,
  );

  if (loading || challenge === null) {
    return <Loading />;
  }

  const mysticsData = challenge.coxRooms.mystics;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && mysticsData === null) {
    return <>No Skeletal Mystics data for this raid</>;
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
          name="Skeletal Mystics"
          image="/images/cox/mystics.png"
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
        {/* <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Map replay coming soon</p>
        </div> */}
        <BossPageReplay
          entities={entitiesByTick.get(currentTick) ?? []}
          preloads={preloads}
          mapDef={mapDefinition}
          playing={playing}
          width={display.isCompact() ? 352 : 550}
          height={display.isCompact() ? 352 : 550}
          currentTick={currentTick}
          advanceTick={advanceTick}
        />
        <BossPageParty
          playerTickState={playerTickState}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
        />
      </div>

      <div className={bossStyles.charts}>
        <Card
          className={bossStyles.chart}
          header={{ title: "Skeletal Mystic's Health By Tick" }}
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
