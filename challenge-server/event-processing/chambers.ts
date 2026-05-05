import {
  ChallengeMode,
  ChallengeStatus,
  ChallengeType,
  CoxChallengeStats,
  CoxRooms,
  DataRepository,
  PlayerAttack,
  PriceTracker,
  SplitType,
  Stage,
  StageStatus,
  camelToSnakeObject,
} from '@blert/common';
import { Event } from '@blert/common/generated/event_pb';

import ChallengeProcessor, { InitializedFields } from './challenge-processor';
import sql from '../db';
import logger from '../log';
import { MergedEvents } from '../merging';

function roomsKey(stage: Stage): keyof CoxRooms {
  switch (stage) {
    case Stage.COX_TEKTON:
      return 'tekton';
    case Stage.COX_CRABS:
      return 'crabs';
    case Stage.COX_ICE_DEMON:
      return 'iceDemon';
    case Stage.COX_SHAMANS:
      return 'shamans';
    case Stage.COX_VANGUARDS:
      return 'vanguards';
    case Stage.COX_THIEVING:
      return 'thieving';
    case Stage.COX_VASA:
      return 'vasa';
    case Stage.COX_VESPULA:
      return 'vespula';
    case Stage.COX_TIGHTROPE:
      return 'tightrope';
    case Stage.COX_GUARDIANS:
      return 'guardians';
    case Stage.COX_MYSTICS:
      return 'mystics';
    case Stage.COX_MUTTADILE:
      return 'muttadile';
    case Stage.COX_OLM:
      return 'olm';
    default:
      throw new Error(`Invalid CoX stage: ${stage}`);
  }
}

export default class ChambersProcessor extends ChallengeProcessor {
  private rooms: CoxRooms;
  private stageStats: Partial<CoxChallengeStats>;

  public constructor(
    dataRepository: DataRepository,
    priceTracker: PriceTracker,
    uuid: string,
    mode: ChallengeMode,
    stage: Stage,
    stageStatus: StageStatus,
    party: string[],
    extraFields: InitializedFields = {},
  ) {
    super(
      dataRepository,
      priceTracker,
      ChallengeType.COX,
      Stage.COX_TEKTON,
      Stage.COX_OLM,
      uuid,
      mode,
      stage,
      stageStatus,
      party,
      extraFields,
    );

    this.stageStats = {};

    if (extraFields.customData) {
      this.rooms = extraFields.customData as CoxRooms;
    } else {
      this.rooms = {
        tekton: null,
        crabs: null,
        iceDemon: null,
        shamans: null,
        vanguards: null,
        thieving: null,
        vasa: null,
        vespula: null,
        tightrope: null,
        guardians: null,
        mystics: null,
        muttadile: null,
        olm: null,
      };
    }
  }

  protected override async onCreate(): Promise<void> {
    await Promise.all([
      sql`
        INSERT INTO cox_challenge_stats (challenge_id)
        VALUES (${this.getDatabaseId()})
      `,
      this.getDataRepository().saveCoxChallengeData(this.getUuid(), this.rooms),
    ]);
  }

  protected override onFinish(finalChallengeTicks: number): Promise<void> {
    this.setSplit(SplitType.COX_CHALLENGE, finalChallengeTicks);
    this.setSplit(SplitType.COX_OVERALL, this.getOverallTicks());

    for (const username of this.getParty()) {
      const stats = this.getCurrentStageStats(username);
      switch (this.getChallengeStatus()) {
        case ChallengeStatus.COMPLETED:
          stats.coxCompletions += 1;
          break;
        case ChallengeStatus.RESET:
          stats.coxResets += 1;
          break;
        case ChallengeStatus.WIPED:
          stats.coxWipes += 1;
          break;
      }
    }

    return Promise.resolve();
  }

  protected override async onStageFinished(
    stage: Stage,
    events: MergedEvents,
  ): Promise<void> {
    const stageTicks = events.getLastTick();
    let stageSplit: SplitType;

    const stageState = this.getStageState();

    const roomData = {
      ticksLost: events.getMissingTickCount(),
      deaths: stageState?.deaths ?? [],
      npcs: Object.fromEntries(stageState?.npcs ?? []),
    };

    switch (stage) {
      case Stage.COX_TEKTON:
        stageSplit = SplitType.COX_TEKTON;
        this.rooms.tekton = {
          ...roomData,
          stage: Stage.COX_TEKTON,
        };
        this.stageStats.tektonDeaths = this.rooms.tekton.deaths.length;
        break;

      case Stage.COX_CRABS:
        stageSplit = SplitType.COX_CRABS;
        this.rooms.crabs = {
          ...roomData,
          stage: Stage.COX_CRABS,
        };
        this.stageStats.crabsDeaths = this.rooms.crabs.deaths.length;
        break;

      case Stage.COX_ICE_DEMON:
        stageSplit = SplitType.COX_ICE_DEMON;
        this.rooms.iceDemon = {
          ...roomData,
          stage: Stage.COX_ICE_DEMON,
        };
        this.stageStats.iceDemonDeaths = this.rooms.iceDemon.deaths.length;
        break;

      case Stage.COX_SHAMANS:
        stageSplit = SplitType.COX_SHAMANS;
        this.rooms.shamans = {
          ...roomData,
          stage: Stage.COX_SHAMANS,
        };
        this.stageStats.shamansDeaths = this.rooms.shamans.deaths.length;
        break;

      case Stage.COX_VANGUARDS:
        stageSplit = SplitType.COX_VANGUARDS;
        this.rooms.vanguards = {
          ...roomData,
          stage: Stage.COX_VANGUARDS,
        };
        this.stageStats.vanguardsDeaths = this.rooms.vanguards.deaths.length;
        break;

      case Stage.COX_THIEVING:
        stageSplit = SplitType.COX_THIEVING;
        this.rooms.thieving = {
          ...roomData,
          stage: Stage.COX_THIEVING,
        };
        this.stageStats.thievingDeaths = this.rooms.thieving.deaths.length;
        break;

      case Stage.COX_VASA:
        stageSplit = SplitType.COX_VASA;
        this.rooms.vasa = {
          ...roomData,
          stage: Stage.COX_VASA,
        };
        this.stageStats.vasaDeaths = this.rooms.vasa.deaths.length;
        break;

      case Stage.COX_VESPULA:
        stageSplit = SplitType.COX_VESPULA;
        this.rooms.vespula = {
          ...roomData,
          stage: Stage.COX_VESPULA,
        };
        this.stageStats.vespulaDeaths = this.rooms.vespula.deaths.length;
        break;

      case Stage.COX_TIGHTROPE:
        stageSplit = SplitType.COX_TIGHTROPE;
        this.rooms.tightrope = {
          ...roomData,
          stage: Stage.COX_TIGHTROPE,
        };
        this.stageStats.tightropeDeaths = this.rooms.tightrope.deaths.length;
        break;

      case Stage.COX_GUARDIANS:
        stageSplit = SplitType.COX_GUARDIANS;
        this.rooms.guardians = {
          ...roomData,
          stage: Stage.COX_GUARDIANS,
        };
        this.stageStats.guardiansDeaths = this.rooms.guardians.deaths.length;
        break;

      case Stage.COX_MYSTICS:
        stageSplit = SplitType.COX_MYSTICS;
        this.rooms.mystics = {
          ...roomData,
          stage: Stage.COX_MYSTICS,
        };
        this.stageStats.mysticsDeaths = this.rooms.mystics.deaths.length;
        break;

      case Stage.COX_MUTTADILE:
        stageSplit = SplitType.COX_MUTTADILE;
        this.rooms.muttadile = {
          ...roomData,
          stage: Stage.COX_MUTTADILE,
        };
        this.stageStats.muttadileDeaths = this.rooms.muttadile.deaths.length;
        break;

      case Stage.COX_OLM:
        stageSplit = SplitType.COX_OLM;
        this.rooms.olm = {
          ...roomData,
          stage: Stage.COX_OLM,
        };
        this.stageStats.olmDeaths = this.rooms.olm.deaths.length;
        break;
    }

    await this.updateChallengeStats(this.stageStats);
    this.stageStats = {};

    this.setSplit(stageSplit!, stageTicks);

    await this.getDataRepository().saveCoxChallengeData(
      this.getUuid(),
      this.rooms,
    );
  }

  protected override async processChallengeEvent(
    allEvents: MergedEvents,
    event: Event,
  ): Promise<boolean> {
    switch (event.getType()) {
      case Event.Type.PLAYER_DEATH: {
        // Handle player death tracking
        break;
      }

      case Event.Type.PLAYER_ATTACK:
        // Handle player attacks for tracking purposes
        await this.processPlayerAttack(event);
        break;
      case Event.Type.NPC_SPAWN:
        // Handle NPC spawns
        break;

      case Event.Type.NPC_UPDATE:
        // Handle NPC updates
        break;

      case Event.Type.NPC_ATTACK:
        // Handle NPC attacks
        break;

      // Add CoX-specific events here as needed
      // Examples:
      // case Event.Type.COX_OLM_PHASE:
      // case Event.Type.COX_VASA_CRYSTAL_SPAWN:
      // etc.
    }

    return Promise.resolve(true);
  }

  protected override getCustomData(): object | null {
    return this.rooms;
  }

  protected override hasFullyRecordedUpTo(stage: Stage): boolean {
    if (stage < Stage.COX_TEKTON || stage > Stage.COX_OLM) {
      return false;
    }

    for (let s = Stage.COX_TEKTON; s <= stage; s++) {
      // Skip floor/corridor stages between rooms (COX_FLOOR_1=24, COX_FLOOR_2=29,
      // COX_FLOOR_3=34) which are not boss rooms and have no entry in `roomsKey`.
      if (
        s === Stage.COX_FLOOR_1 ||
        s === Stage.COX_FLOOR_2 ||
        s === Stage.COX_FLOOR_3
      ) {
        continue;
      }
      if (this.rooms[roomsKey(s)] === null) {
        return false;
      }
    }

    return true;
  }

  protected override isRetriable(_: Stage): boolean {
    return false;
  }

  private async updateChallengeStats(
    updates: Partial<CoxChallengeStats>,
  ): Promise<void> {
    await sql`
      UPDATE cox_challenge_stats
      SET ${sql(camelToSnakeObject(updates))}
      WHERE challenge_id = ${this.getDatabaseId()};
    `;
  }

  private async processPlayerAttack(event: Event): Promise<void> {
    const username = event.getPlayer()?.getName();
    const attack = event.getPlayerAttack();

    if (username === undefined || attack === undefined) {
      return;
    }

    const stats = this.getCurrentStageStats(username);

    switch (attack.getType()) {
      case PlayerAttack.GODSWORD_SMACK:
        stats.bgsSmacks += 1;
        break;

      case PlayerAttack.HAMMER_BOP:
        stats.hammerBops += 1;
        break;

      case PlayerAttack.CHALLY_SWIPE:
        stats.challyPokes += 1;
        break;

      case PlayerAttack.ELDER_MAUL:
        stats.elderMaulSmacks += 1;
        break;

      case PlayerAttack.TONALZTICS_AUTO:
        stats.ralosAutos += 1;
        break;

      case PlayerAttack.SCYTHE_UNCHARGED:
        stats.unchargedScytheSwings += 1;
        break;
    }
  }
}