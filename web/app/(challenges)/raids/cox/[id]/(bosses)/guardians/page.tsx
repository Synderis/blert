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
  useStageEvents,
} from '@/utils/boss-room-state';

import bossStyles from '../style.module.scss';

const GUARDIANS_MAP_DEFINITION: MapDefinition = {
  baseX: 3300,
  baseY: 5250,
  width: 28,
  height: 28,
  plane: 2,
};

export default function GuardiansPage() {
  const display = useDisplay();

  const compact = display.isCompact();

  const {
    challenge,
    totalTicks,
    events,
    playerState,
    npcState,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_GUARDIANS);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 10 : 18;
    return {
      ...GUARDIANS_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedPlayer, selectedPlayer } = useContext(ActorContext);

  const guardianBosses: BossDefinition[] = [
    { name: 'Guardian 1', dataKey: 'guardian1Health', color: '#ef4444' },
    { name: 'Guardian 2', dataKey: 'guardian2Health', color: '#22c55e' },
  ];

  const bossHealthChartData = useMemo(() => {
    // Collect guardians by NPC ID (7569/7571=guardian1, 7570/7572=guardian2)
    let guardian1: EnhancedRoomNpc | null = null;
    let guardian2: EnhancedRoomNpc | null = null;
    
    for (const npc of npcState.values()) {
      if (npc.spawnNpcId === 7569 || npc.spawnNpcId === 7571) {
        guardian1 = npc;
      } else if (npc.spawnNpcId === 7570 || npc.spawnNpcId === 7572) {
        guardian2 = npc;
      }
    }

    if (guardian1 || guardian2) {
      // Calculate health percentage for each guardian
      const chartData = [];
      for (let tick = 0; tick < totalTicks; tick++) {
        const tickData: {
          tick: number;
          guardian1Health?: number;
          guardian2Health?: number;
        } = { tick };
        
        if (guardian1) {
          const state = guardian1.stateByTick[tick];
          if (state) {
            tickData.guardian1Health = state.hitpoints.percentage();
          }
        }
        
        if (guardian2) {
          const state = guardian2.stateByTick[tick];
          if (state) {
            tickData.guardian2Health = state.hitpoints.percentage();
          }
        }
        
        chartData.push(tickData);
      }
      return chartData;
    }

    // Fallback to event-based tracking if state isn't available
    const healthByTick = new Map<number, {
      guardian1Health?: number;
      guardian2Health?: number;
    }>();
    
    for (const event of events) {
      if (
        event.type === EventType.NPC_UPDATE &&
        event.npc !== undefined &&
        Npc.isGuardian(event.npc.id)
      ) {
        const existing = healthByTick.get(event.tick) ?? {};
        const skillLevel = SkillLevel.fromRaw(event.npc.hitpoints);
        const healthPct = skillLevel.percentage();
        
        if (event.npc.id === 7569 || event.npc.id === 7571) {
          existing.guardian1Health = healthPct;
        } else if (event.npc.id === 7570 || event.npc.id === 7572) {
          existing.guardian2Health = healthPct;
        }
        
        healthByTick.set(event.tick, existing);
      }
    }

    if (healthByTick.size === 0) {
      return [];
    }

    const maxTick = Math.max(...healthByTick.keys());
    const chartData = [];
    let lastGuardian1Health: number | undefined;
    let lastGuardian2Health: number | undefined;
    
    for (let tick = 0; tick <= maxTick; tick++) {
      const healthAtTick = healthByTick.get(tick);
      if (healthAtTick) {
        if (healthAtTick.guardian1Health !== undefined) {
          lastGuardian1Health = healthAtTick.guardian1Health;
        }
        if (healthAtTick.guardian2Health !== undefined) {
          lastGuardian2Health = healthAtTick.guardian2Health;
        }
      }
      
      chartData.push({
        tick,
        guardian1Health: lastGuardian1Health,
        guardian2Health: lastGuardian2Health,
      });
    }

    return chartData;
  }, [events, npcState, totalTicks]);

  const { entitiesByTick, preloads } = useMapEntities(
    challenge,
    playerState,
    npcState,
    totalTicks,
  );

  if (loading || challenge === null) {
    return <Loading />;
  }

  const guardiansData = challenge.coxRooms.guardians;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && guardiansData === null) {
    return <>No Guardians data for this raid</>;
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
          name="Guardians"
          image="/images/cox/guardians.png"
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
          header={{ title: "Guardians Health By Tick" }}
        >
          <MultiBossDpsTimeline
            currentTick={currentTick}
            data={bossHealthChartData}
            bosses={guardianBosses}
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
