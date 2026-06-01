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
import MultiBossDpsTimeline, { BossDefinition } from '@/components/multi-boss-dps-timeline';
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
    bcf,
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

  const { setSelectedActor, selectedActor } = useContext(ActorContext);

  const mysticBosses: BossDefinition[] = [
    { name: 'Mystic 1', dataKey: 'mystic1Health', color: '#ef4444' },
    { name: 'Mystic 2', dataKey: 'mystic2Health', color: '#22c55e' },
    { name: 'Mystic 3', dataKey: 'mystic3Health', color: '#3b82f6' },
  ];

  const bossHealthChartData = useMemo(() => {
    // Collect mystics by NPC ID (7604, 7605, 7606)
    let mystic1: EnhancedRoomNpc | null = null;
    let mystic2: EnhancedRoomNpc | null = null;
    let mystic3: EnhancedRoomNpc | null = null;
    
    for (const npc of npcState.values()) {
      if (npc.spawnNpcId === 7604) {
        mystic1 = npc;
      } else if (npc.spawnNpcId === 7605) {
        mystic2 = npc;
      } else if (npc.spawnNpcId === 7606) {
        mystic3 = npc;
      }
    }

    if (mystic1 || mystic2 || mystic3) {
      // Calculate health percentage for each mystic
      const chartData = [];
      for (let tick = 0; tick < totalTicks; tick++) {
        const tickData: {
          tick: number;
          mystic1Health?: number;
          mystic2Health?: number;
          mystic3Health?: number;
        } = { tick };
        
        if (mystic1) {
          const state = mystic1.stateByTick[tick];
          if (state) {
            tickData.mystic1Health = state.hitpoints.percentage();
          }
        }
        
        if (mystic2) {
          const state = mystic2.stateByTick[tick];
          if (state) {
            tickData.mystic2Health = state.hitpoints.percentage();
          }
        }
        
        if (mystic3) {
          const state = mystic3.stateByTick[tick];
          if (state) {
            tickData.mystic3Health = state.hitpoints.percentage();
          }
        }
        
        chartData.push(tickData);
      }
      return chartData;
    }

    // Fallback to event-based tracking if state isn't available
    const healthByTick = new Map<number, {
      mystic1Health?: number;
      mystic2Health?: number;
      mystic3Health?: number;
    }>();
    
    for (const event of events) {
      if (
        event.type === EventType.NPC_UPDATE &&
        event.npc !== undefined &&
        Npc.isSkeletalMystic(event.npc.id)
      ) {
        const existing = healthByTick.get(event.tick) ?? {};
        const skillLevel = SkillLevel.fromRaw(event.npc.hitpoints);
        const healthPct = skillLevel.percentage();
        
        if (event.npc.id === 7604) {
          existing.mystic1Health = healthPct;
        } else if (event.npc.id === 7605) {
          existing.mystic2Health = healthPct;
        } else if (event.npc.id === 7606) {
          existing.mystic3Health = healthPct;
        }
        
        healthByTick.set(event.tick, existing);
      }
    }

    if (healthByTick.size === 0) {
      return [];
    }

    const maxTick = Math.max(...healthByTick.keys());
    const chartData = [];
    let lastMystic1Health: number | undefined;
    let lastMystic2Health: number | undefined;
    let lastMystic3Health: number | undefined;
    
    for (let tick = 0; tick <= maxTick; tick++) {
      const healthAtTick = healthByTick.get(tick);
      if (healthAtTick) {
        if (healthAtTick.mystic1Health !== undefined) {
          lastMystic1Health = healthAtTick.mystic1Health;
        }
        if (healthAtTick.mystic2Health !== undefined) {
          lastMystic2Health = healthAtTick.mystic2Health;
        }
        if (healthAtTick.mystic3Health !== undefined) {
          lastMystic3Health = healthAtTick.mystic3Health;
        }
      }
      
      chartData.push({
        tick,
        mystic1Health: lastMystic1Health,
        mystic2Health: lastMystic2Health,
        mystic3Health: lastMystic3Health,
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
          header={{ title: "Skeletal Mystics Health By Tick" }}
        >
          <MultiBossDpsTimeline
            currentTick={currentTick}
            data={bossHealthChartData}
            bosses={mysticBosses}
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
