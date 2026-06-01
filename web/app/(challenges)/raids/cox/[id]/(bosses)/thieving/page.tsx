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
  usePreloads,
  useStageEvents,
} from '@/utils/boss-room-state';

import bossStyles from '../style.module.scss';

const THIEVING_MAP_DEFINITION: MapDefinition = {
  baseX: 3300,
  baseY: 5377,
  width: 28,
  height: 26,
  plane: 0,
};

export default function ThievingPage() {
  const display = useDisplay();

  const compact = display.isCompact();
  const {
    challenge,
    totalTicks,
    events,
    playerState,
    npcState,
    bcf,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_THIEVING);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 16 : 24;
    return {
      ...THIEVING_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedActor, selectedActor } = useContext(ActorContext);

    const bossHealthChartData = useMemo(() => {
      let corruptedScavenger: EnhancedRoomNpc | null = null;
      const iter = npcState.values();
      for (let npc = iter.next(); !npc.done; npc = iter.next()) {
        if (Npc.isCorruptedScavenger(npc.value.spawnNpcId)) {
          corruptedScavenger = npc.value;
          break;
        }
      }
  
      if (corruptedScavenger !== null) {
        return corruptedScavenger.stateByTick.map((state, tick) => ({
          tick,
          bossHealthPercentage: state?.hitpoints.percentage() ?? 0,
        }));
      }
  
      const healthByTick = new Map<number, number>();
      for (const event of events) {
        if (
          event.type === EventType.NPC_UPDATE &&
          event.npc !== undefined &&
          Npc.isCorruptedScavenger(event.npc.id)
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
  
    const getEntities = useMapEntities(
      challenge,
      playerState,
      npcState,
      totalTicks,
    );
    const preloads = usePreloads(npcState, false);
  
    if (loading || challenge === null) {
      return <Loading />;
    }
  
    const thievingData = challenge.coxRooms.thieving;
    if (challenge.status !== ChallengeStatus.IN_PROGRESS && thievingData === null) {
      return <>No Thieving data for this raid</>;
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
          name="Thieving"
          image="/images/cox/thieving.png"
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
          bcf={bcf}
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
          entities={getEntities(currentTick)}
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
          selectedActor={selectedActor}
          setSelectedActor={setSelectedActor}
        />
      </div>
      <div className={bossStyles.charts}>
        <Card
          className={bossStyles.chart}
          header={{ title: "Corrupted Scavenger's Health By Tick" }}
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
