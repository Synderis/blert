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

const OLM_MAP_DEFINITION: MapDefinition = {
  baseX: 3220,
  baseY: 5725,
  width: 28,
  height: 28,
  plane: 0,
};

export default function OlmPage() {
  const display = useDisplay();

  const compact = display.isCompact();

  const {
    challenge,
    totalTicks,
    events,
    playerState,
    npcState,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_OLM);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 16 : 24;
    return {
      ...OLM_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedPlayer, selectedPlayer } = useContext(ActorContext);

  const olmBosses: BossDefinition[] = [
    { name: 'Head', dataKey: 'headHealth', color: '#22c55e' },
    { name: 'Mage Hand (Left)', dataKey: 'mageHandHealth', color: '#3b82f6' },
    { name: 'Melee Hand (Right)', dataKey: 'meleeHandHealth', color: '#ef4444' },
  ];

  const bossHealthChartData = useMemo(() => {
    // Collect Olm parts by NPC ID
    let olmHead: EnhancedRoomNpc | null = null;
    let mageHand: EnhancedRoomNpc | null = null;
    let meleeHand: EnhancedRoomNpc | null = null;
    
    for (const npc of npcState.values()) {
      if (npc.spawnNpcId === 7551 || npc.spawnNpcId === 7554) {
        olmHead = npc;
      } else if (npc.spawnNpcId === 7550 || npc.spawnNpcId === 7553) {
        mageHand = npc;
      } else if (npc.spawnNpcId === 7552 || npc.spawnNpcId === 7555) {
        meleeHand = npc;
      }
    }

    if (olmHead || mageHand || meleeHand) {
      // Calculate health percentage for each Olm part
      const chartData = [];
      for (let tick = 0; tick < totalTicks; tick++) {
        const tickData: {
          tick: number;
          headHealth?: number;
          mageHandHealth?: number;
          meleeHandHealth?: number;
        } = { tick };
        
        if (olmHead) {
          const state = olmHead.stateByTick[tick];
          if (state) {
            tickData.headHealth = state.hitpoints.percentage();
          }
        }
        
        if (mageHand) {
          const state = mageHand.stateByTick[tick];
          if (state) {
            tickData.mageHandHealth = state.hitpoints.percentage();
          }
        }
        
        if (meleeHand) {
          const state = meleeHand.stateByTick[tick];
          if (state) {
            tickData.meleeHandHealth = state.hitpoints.percentage();
          }
        }
        
        chartData.push(tickData);
      }
      return chartData;
    }

    // Fallback to event-based tracking if state isn't available
    const healthByTick = new Map<number, {
      headHealth?: number;
      mageHandHealth?: number;
      meleeHandHealth?: number;
    }>();
    
    for (const event of events) {
      if (
        event.type === EventType.NPC_UPDATE &&
        event.npc !== undefined
      ) {
        const existing = healthByTick.get(event.tick) ?? {};
        const skillLevel = SkillLevel.fromRaw(event.npc.hitpoints);
        const healthPct = skillLevel.percentage();
        
        if (Npc.isOlmHead(event.npc.id)) {
          existing.headHealth = healthPct;
        } else if (Npc.isOlmMageHand(event.npc.id)) {
          existing.mageHandHealth = healthPct;
        } else if (Npc.isOlmMeleeHand(event.npc.id)) {
          existing.meleeHandHealth = healthPct;
        }
        
        healthByTick.set(event.tick, existing);
      }
    }

    if (healthByTick.size === 0) {
      return [];
    }

    const maxTick = Math.max(...healthByTick.keys());
    const chartData = [];
    let lastHeadHealth: number | undefined;
    let lastMageHandHealth: number | undefined;
    let lastMeleeHandHealth: number | undefined;
    
    for (let tick = 0; tick <= maxTick; tick++) {
      const healthAtTick = healthByTick.get(tick);
      if (healthAtTick) {
        if (healthAtTick.headHealth !== undefined) {
          lastHeadHealth = healthAtTick.headHealth;
        }
        if (healthAtTick.mageHandHealth !== undefined) {
          lastMageHandHealth = healthAtTick.mageHandHealth;
        }
        if (healthAtTick.meleeHandHealth !== undefined) {
          lastMeleeHandHealth = healthAtTick.meleeHandHealth;
        }
      }
      
      chartData.push({
        tick,
        headHealth: lastHeadHealth,
        mageHandHealth: lastMageHandHealth,
        meleeHandHealth: lastMeleeHandHealth,
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

  const olmData = challenge.coxRooms.olm;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && olmData === null) {
    return <>No Great Olm data for this raid</>;
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
          name="Great Olm"
          image="/images/cox/olm.png"
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
          header={{ title: "Great Olm Health By Tick" }}
        >
          <MultiBossDpsTimeline
            currentTick={currentTick}
            data={bossHealthChartData}
            bosses={olmBosses}
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
