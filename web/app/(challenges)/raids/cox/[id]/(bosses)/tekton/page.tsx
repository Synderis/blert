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

const TEKTON_MAP_DEFINITION: MapDefinition = {
  baseX: 3296,
  baseY: 5280,
  width: 32,
  height: 32,
  plane: 1,
};

export default function TektonPage() {
  const display = useDisplay();

  const compact = display.isCompact();

  const {
    challenge,
    totalTicks,
    events,
    playerState,
    npcState,
    loading,
  } = useStageEvents<CoxRaid>(Stage.COX_TEKTON);

  const { currentTick, setTick, playing, setPlaying, advanceTick } =
    usePlayingState(totalTicks);

  const mapDefinition = useMemo(() => {
    const initialZoom = compact ? 16 : 24;
    return {
      ...TEKTON_MAP_DEFINITION,
      initialZoom,
    };
  }, [compact]);

  const { setSelectedPlayer, selectedPlayer } = useContext(ActorContext);

  const bossHealthChartData = useMemo(() => {
    let tekton: EnhancedRoomNpc | null = null;
    const iter = npcState.values();
    for (let npc = iter.next(); !npc.done; npc = iter.next()) {
      if (Npc.isTekton(npc.value.spawnNpcId)) {
        tekton = npc.value;
        break;
      }
    }

    if (tekton !== null) {
      return tekton.stateByTick.map((state, tick) => ({
        tick,
        bossHealthPercentage: state?.hitpoints.percentage() ?? 0,
      }));
    }

    const healthByTick = new Map<number, number>();
    for (const event of events) {
      if (
        event.type === EventType.NPC_UPDATE &&
        event.npc !== undefined &&
        Npc.isTekton(event.npc.id)
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

  const tektonData = challenge.coxRooms.tekton;
  if (challenge.status !== ChallengeStatus.IN_PROGRESS && tektonData === null) {
    return <>No Tekton data for this raid</>;
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
          name="Tekton"
          image="/images/cox/tekton.png"
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
          header={{ title: "Tekton's Health By Tick" }}
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
