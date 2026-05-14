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
  useStageEvents,
} from '@/utils/boss-room-state';

import bossStyles from '../style.module.scss';

const SHAMANS_MAP_DEFINITION: MapDefinition = {
  baseX: 3300,
  baseY: 5250,
  width: 28,
  height: 28,
  plane: 0,
};

export default function ShamansPage() {
  const display = useDisplay();

  const compact = display.isCompact();

  const {
    challenge,
    totalTicks,
    events,
    playerState,
    npcState,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_SHAMANS);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 16 : 24;
    return {
      ...SHAMANS_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedPlayer, selectedPlayer } = useContext(ActorContext);

  const shamanBosses: BossDefinition[] = [
    { name: 'Shaman 1', dataKey: 'shaman1Health', color: '#ef4444' },
    { name: 'Shaman 2', dataKey: 'shaman2Health', color: '#22c55e' },
  ];

  const bossHealthChartData = useMemo(() => {
      // Collect shamans by NPC ID (7573, 7574)
      let shaman1: EnhancedRoomNpc | null = null;
      let shaman2: EnhancedRoomNpc | null = null;
      
      for (const npc of npcState.values()) {
        if (npc.spawnNpcId === 7573) {
          shaman1 = npc;
        } else if (npc.spawnNpcId === 7574) {
          shaman2 = npc;
        }
      }
  
      if (shaman1 || shaman2) {
        // Calculate health percentage for each shaman
        const chartData = [];
        for (let tick = 0; tick < totalTicks; tick++) {
          const tickData: {
            tick: number;
            shaman1Health?: number;
            shaman2Health?: number;
          } = { tick };
          
          if (shaman1) {
            const state = shaman1.stateByTick[tick];
            if (state) {
              tickData.shaman1Health = state.hitpoints.percentage();
            }
          }
          
          if (shaman2) {
            const state = shaman2.stateByTick[tick];
            if (state) {
              tickData.shaman2Health = state.hitpoints.percentage();
            }
          }
          
          chartData.push(tickData);
        }
        return chartData;
      }
  
      // Fallback to event-based tracking if state isn't available
      const healthByTick = new Map<number, {
        shaman1Health?: number;
        shaman2Health?: number;
      }>();
      
      for (const event of events) {
        if (
          event.type === EventType.NPC_UPDATE &&
          event.npc !== undefined &&
          Npc.isLizardmanShaman(event.npc.id)
        ) {
          const existing = healthByTick.get(event.tick) ?? {};
          const skillLevel = SkillLevel.fromRaw(event.npc.hitpoints);
          const healthPct = skillLevel.percentage();
          
          if (event.npc.id === 7573) {
            existing.shaman1Health = healthPct;
          } else if (event.npc.id === 7574) {
            existing.shaman2Health = healthPct;
          }
          
          healthByTick.set(event.tick, existing);
        }
      }
  
      if (healthByTick.size === 0) {
        return [];
      }
  
      const maxTick = Math.max(...healthByTick.keys());
      const chartData = [];
      let lastShaman1Health: number | undefined;
      let lastShaman2Health: number | undefined;
      
      for (let tick = 0; tick <= maxTick; tick++) {
        const healthAtTick = healthByTick.get(tick);
        if (healthAtTick) {
          if (healthAtTick.shaman1Health !== undefined) {
            lastShaman1Health = healthAtTick.shaman1Health;
          }
          if (healthAtTick.shaman2Health !== undefined) {
            lastShaman2Health = healthAtTick.shaman2Health;
          }
        }
        
        chartData.push({
          tick,
          shaman1Health: lastShaman1Health,
          shaman2Health: lastShaman2Health,
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
          header={{ title: "Lizardman Shamans Health By Tick" }}
        >
          <MultiBossDpsTimeline
            currentTick={currentTick}
            data={bossHealthChartData}
            bosses={shamanBosses}
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
