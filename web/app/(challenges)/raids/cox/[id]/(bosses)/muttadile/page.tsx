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
import BossPageParty from '@/components/boss-page-party';
import MultiBossDpsTimeline from '@/components/multi-boss-dps-timeline';
import type { BossDefinition } from '@/components/multi-boss-dps-timeline';
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

const MUTTADILES_MAP_DEFINITION: MapDefinition = {
  baseX: 3300,
  baseY: 5312,
  width: 28,
  height: 28,
  plane: 1,
};

export default function MuttadilePage() {
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
  } = useStageEvents<CoxRaid>(Stage.COX_MUTTADILE);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const { setSelectedActor, selectedActor } = useContext(ActorContext);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 12 : 20;
    return {
      ...MUTTADILES_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const muttadileBosses: BossDefinition[] = [
    { name: 'Small Muttadile', dataKey: 'smallHealth', color: '#ef4444' },
    { name: 'Large Muttadile', dataKey: 'largeHealth', color: '#3b82f6' },
  ];

  const bossHealthChartData = useMemo(() => {
    // Collect muttadiles by NPC ID (7562=small, 7561/7563=large)
    let smallMuttadile: EnhancedRoomNpc | null = null;
    let largeMuttadile: EnhancedRoomNpc | null = null;
    
    for (const npc of npcState.values()) {
      if (npc.spawnNpcId === 7562) {
        smallMuttadile = npc;
      } else if (npc.spawnNpcId === 7561 || npc.spawnNpcId === 7563) {
        largeMuttadile = npc;
      }
    }

    if (smallMuttadile || largeMuttadile) {
      // Calculate health percentage for each muttadile
      const chartData = [];
      for (let tick = 0; tick < totalTicks; tick++) {
        const tickData: {
          tick: number;
          smallHealth?: number;
          largeHealth?: number;
        } = { tick };
        
        if (smallMuttadile) {
          const state = smallMuttadile.stateByTick[tick];
          if (state) {
            tickData.smallHealth = state.hitpoints.percentage();
          }
        }
        
        if (largeMuttadile) {
          const state = largeMuttadile.stateByTick[tick];
          if (state) {
            tickData.largeHealth = state.hitpoints.percentage();
          }
        }
        
        chartData.push(tickData);
      }
      return chartData;
    }

    // Fallback to event-based tracking if state isn't available
    const healthByTick = new Map<number, {
      smallHealth?: number;
      largeHealth?: number;
    }>();
    
    for (const event of events) {
      if (
        event.type === EventType.NPC_UPDATE &&
        event.npc !== undefined &&
        Npc.isMuttadile(event.npc.id)
      ) {
        const existing = healthByTick.get(event.tick) ?? {};
        const skillLevel = SkillLevel.fromRaw(event.npc.hitpoints);
        const healthPct = skillLevel.percentage();
        
        if (event.npc.id === 7562) {
          existing.smallHealth = healthPct;
        } else if (event.npc.id === 7561 || event.npc.id === 7563) {
          existing.largeHealth = healthPct;
        }
        
        healthByTick.set(event.tick, existing);
      }
    }

    if (healthByTick.size === 0) {
      return [];
    }

    const maxTick = Math.max(...healthByTick.keys());
    const chartData = [];
    let lastSmallHealth: number | undefined;
    let lastLargeHealth: number | undefined;
    
    for (let tick = 0; tick <= maxTick; tick++) {
      const healthAtTick = healthByTick.get(tick);
      if (healthAtTick) {
        if (healthAtTick.smallHealth !== undefined) {
          lastSmallHealth = healthAtTick.smallHealth;
        }
        if (healthAtTick.largeHealth !== undefined) {
          lastLargeHealth = healthAtTick.largeHealth;
        }
      }
      
      chartData.push({
        tick,
        smallHealth: lastSmallHealth,
        largeHealth: lastLargeHealth,
      });
    }

    return chartData;
  }, [events, npcState, totalTicks]);

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

  const muttadileData = challenge.coxRooms.muttadile;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && muttadileData === null) {
    return <>No Muttadile data for this raid</>;
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
          name="Muttadile"
          image="/images/cox/muttadile.png"
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
          header={{ title: "Muttadiles Health By Tick" }}
        >
          <MultiBossDpsTimeline
            currentTick={currentTick}
            data={bossHealthChartData}
            bosses={muttadileBosses}
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
