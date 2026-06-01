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
import BossPageReplay from '@/components/boss-page-replay';
import Card from '@/components/card';
import { MapDefinition } from '@/components/map-renderer';
import Loading from '@/components/loading';
import MultiBossDpsTimeline, { BossDefinition } from '@/components/multi-boss-dps-timeline';
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

const VANGUARDS_MAP_DEFINITION: MapDefinition = {
  baseX: 3300,
  baseY: 5315,
  width: 28,
  height: 28,
  plane: 0,
};

export default function VanguardsPage() {
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
  } = useStageEvents<CoxRaid>(Stage.COX_VANGUARDS);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 16 : 24;
    return {
      ...VANGUARDS_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedActor, selectedActor } = useContext(ActorContext);

  const vanguardBosses: BossDefinition[] = [
    { name: 'Melee Vanguard', dataKey: 'meleeHealth', color: '#ef4444' },
    { name: 'Ranged Vanguard', dataKey: 'rangedHealth', color: '#22c55e' },
    { name: 'Magic Vanguard', dataKey: 'magicHealth', color: '#3b82f6' },
  ];

  const vanguardsHealthChartData = useMemo(() => {
      // Collect vanguards by type (7527=melee, 7528=ranged, 7529=magic)
      let meleeVanguard: EnhancedRoomNpc | null = null;
      let rangedVanguard: EnhancedRoomNpc | null = null;
      let magicVanguard: EnhancedRoomNpc | null = null;
      
      for (const npc of npcState.values()) {
        if (npc.spawnNpcId === 7527) {
          meleeVanguard = npc;
        } else if (npc.spawnNpcId === 7528) {
          rangedVanguard = npc;
        } else if (npc.spawnNpcId === 7529) {
          magicVanguard = npc;
        }
      }
  
      if (meleeVanguard || rangedVanguard || magicVanguard) {
        // Calculate health percentage for each vanguard
        const chartData = [];
        for (let tick = 0; tick < totalTicks; tick++) {
          const tickData: {
            tick: number;
            meleeHealth?: number;
            rangedHealth?: number;
            magicHealth?: number;
          } = { tick };
          
          if (meleeVanguard) {
            const state = meleeVanguard.stateByTick[tick];
            if (state) {
              tickData.meleeHealth = state.hitpoints.percentage();
            }
          }
          
          if (rangedVanguard) {
            const state = rangedVanguard.stateByTick[tick];
            if (state) {
              tickData.rangedHealth = state.hitpoints.percentage();
            }
          }
          
          if (magicVanguard) {
            const state = magicVanguard.stateByTick[tick];
            if (state) {
              tickData.magicHealth = state.hitpoints.percentage();
            }
          }
          
          chartData.push(tickData);
        }
        return chartData;
      }
  
      // Fallback to event-based tracking if state isn't available
      const healthByTick = new Map<number, {
        meleeHealth?: number;
        rangedHealth?: number;
        magicHealth?: number;
      }>();
      
      for (const event of events) {
        if (
          event.type === EventType.NPC_UPDATE &&
          event.npc !== undefined &&
          Npc.isVanguard(event.npc.id)
        ) {
          const existing = healthByTick.get(event.tick) ?? {};
          const skillLevel = SkillLevel.fromRaw(event.npc.hitpoints);
          const healthPct = skillLevel.percentage();
          
          if (event.npc.id === 7527) {
            existing.meleeHealth = healthPct;
          } else if (event.npc.id === 7528) {
            existing.rangedHealth = healthPct;
          } else if (event.npc.id === 7529) {
            existing.magicHealth = healthPct;
          }
          
          healthByTick.set(event.tick, existing);
        }
      }
  
      if (healthByTick.size === 0) {
        return [];
      }
  
      const maxTick = Math.max(...healthByTick.keys());
      const chartData = [];
      let lastMeleeHealth: number | undefined;
      let lastRangedHealth: number | undefined;
      let lastMagicHealth: number | undefined;
      
      for (let tick = 0; tick <= maxTick; tick++) {
        const healthAtTick = healthByTick.get(tick);
        if (healthAtTick) {
          if (healthAtTick.meleeHealth !== undefined) {
            lastMeleeHealth = healthAtTick.meleeHealth;
          }
          if (healthAtTick.rangedHealth !== undefined) {
            lastRangedHealth = healthAtTick.rangedHealth;
          }
          if (healthAtTick.magicHealth !== undefined) {
            lastMagicHealth = healthAtTick.magicHealth;
          }
        }
        
        chartData.push({
          tick,
          meleeHealth: lastMeleeHealth,
          rangedHealth: lastRangedHealth,
          magicHealth: lastMagicHealth,
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

  const vanguardsData = challenge.coxRooms.vanguards;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && vanguardsData === null) {
    return <>No Vanguards data for this raid</>;
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
          name="Vanguards"
          image="/images/cox/vanguards.png"
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
          header={{ title: "Vanguards Health By Tick" }}
        >
          <MultiBossDpsTimeline
            currentTick={currentTick}
            data={vanguardsHealthChartData}
            bosses={vanguardBosses}
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
