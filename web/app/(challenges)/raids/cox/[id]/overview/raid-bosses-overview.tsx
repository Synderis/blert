'use client';

import { CoxRooms, SplitType } from '@blert/common';
import Image from 'next/image';
import Link from 'next/link';

// import Badge from '@/components/badge';
import { GLOBAL_TOOLTIP_ID } from '@/components/tooltip';
// import { useDisplay } from '@/display';
import { ticksToFormattedSeconds } from '@/utils/tick';

import styles from './style.module.scss';

interface RaidBossesOverviewProps {
    raidId: string;
    rooms: CoxRooms;
    splits: Partial<Record<SplitType, number>>;
}

function deathsTooltip(deaths: string[]): string {
    if (deaths.length === 0) {
        return '';
    }
    return `Deaths: ${deaths.join(', ')}`;
}

export function RaidBossesOverview(props: RaidBossesOverviewProps) {
    const { rooms, raidId, splits } = props;
    // const display = useDisplay();

    return (
        <div className={styles.bossesOverview}>
            {/*************************/
      /*  Tekton */
      /*************************/}
            {rooms.tekton && (
                <Link href={`/raids/cox/${raidId}/tekton`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/tekton.png"
                            alt="tekton"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Tekton
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_TEKTON] ?? 0)}
                            </span>
                            {rooms.tekton.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.tekton.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.tekton.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Crabs */
      /*************************/}
            {rooms.crabs && (
                <Link href={`/raids/cox/${raidId}/crabs`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/crabs.png"
                            alt="crabs"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Crabs
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_CRABS] ?? 0)}
                            </span>
                            {rooms.crabs.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.crabs.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.crabs.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Ice Demon */
      /*************************/}
            {rooms.iceDemon && (
                <Link href={`/raids/cox/${raidId}/ice-demon`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/ice_demon.png"
                            alt="ice demon"
                            fill
                            style={{
                                // transform: 'scale(1.2)',
                                objectFit: 'contain',
                                // top: 10,
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Ice Demon
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_ICE_DEMON] ?? 0)}
                            </span>
                            {rooms.iceDemon.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.iceDemon.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.iceDemon.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Shamans */
      /*************************/}
            {rooms.shamans && (
                <Link href={`/raids/cox/${raidId}/shamans`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/shamans.png"
                            alt="shamans"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Shamans
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_SHAMANS] ?? 0)}
                            </span>
                            {rooms.shamans.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.shamans.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.shamans.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Vanguards */
      /*************************/}
            {rooms.vanguards && (
                <Link href={`/raids/cox/${raidId}/vanguards`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/vanguards.png"
                            alt="vanguards"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Vanguards
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_VANGUARDS] ?? 0)}
                            </span>
                            {rooms.vanguards.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.vanguards.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.vanguards.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Thieving */
      /*************************/}
            {rooms.thieving && (
                <Link href={`/raids/cox/${raidId}/thieving`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/thieving.png"
                            alt="thieving"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Thieving
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_THIEVING] ?? 0)}
                            </span>
                            {rooms.thieving.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.thieving.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.thieving.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Vespula */
      /*************************/}
            {rooms.vespula && (
                <Link href={`/raids/cox/${raidId}/vespula`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/vespula.png"
                            alt="vespula"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Vespula
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_VESPULA] ?? 0)}
                            </span>
                            {rooms.vespula.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.vespula.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.vespula.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Tightrope */
      /*************************/}
            {rooms.tightrope && (
                <Link href={`/raids/cox/${raidId}/tightrope`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/tightrope.png"
                            alt="tightrope"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Tightrope
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_TIGHTROPE] ?? 0)}
                            </span>
                            {rooms.tightrope.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.tightrope.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.tightrope.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Guardians */
      /*************************/}
            {rooms.guardians && (
                <Link href={`/raids/cox/${raidId}/guardians`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/guardians.png"
                            alt="guardians"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Guardians
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_GUARDIANS] ?? 0)}
                            </span>
                            {rooms.guardians.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.guardians.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.guardians.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Vasa */
      /*************************/}
            {rooms.vasa && (
                <Link href={`/raids/cox/${raidId}/vasa`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/vasa.png"
                            alt="vasa"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Vasa Nistirio
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_VASA] ?? 0)}
                            </span>
                            {rooms.vasa.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.vasa.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.vasa.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Mystics */
      /*************************/}
            {rooms.mystics && (
                <Link href={`/raids/cox/${raidId}/mystics`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/mystics.png"
                            alt="mystics"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Mystics
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_MYSTICS] ?? 0)}
                            </span>
                            {rooms.mystics.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.mystics.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.mystics.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Muttadile */
      /*************************/}
            {rooms.muttadile && (
                <Link href={`/raids/cox/${raidId}/muttadile`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/muttadile.png"
                            alt="muttadile"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            Muttadile
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(splits[SplitType.COX_MUTTADILE] ?? 0)}
                            </span>
                            {rooms.muttadile.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.muttadile.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.muttadile.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}

            {/*************************/
      /*  Olm */
      /*************************/}
            {rooms.olm && (
                <Link href={`/raids/cox/${raidId}/olm`} className={styles.boss}>
                    <div className={styles.bossImg}>
                        <Image
                            src="/images/cox/olm.png"
                            alt="olm"
                            fill
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <div className={styles.roomDetails}>
                        <h4 className={styles.bossName}>
                            The Great Olm
                            <i className="fa-solid fa-hourglass" />
                            <span className={styles.time}>
                                {ticksToFormattedSeconds(
                                    splits[SplitType.COX_OLM] ?? 0,
                                )}
                            </span>
                            {rooms.olm.deaths.length > 0 && (
                                <div
                                    className={styles.deathCount}
                                    data-tooltip-id={GLOBAL_TOOLTIP_ID}
                                    data-tooltip-content={deathsTooltip(rooms.olm.deaths)}
                                >
                                    <i className="fa-solid fa-skull" />
                                    {rooms.olm.deaths.length}
                                </div>
                            )}
                        </h4>
                    </div>
                </Link>
            )}
        </div>
    );
}
