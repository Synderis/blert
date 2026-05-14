import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import styles from './styles.module.scss';

export type BossDefinition = {
  name: string;
  dataKey: string;
  color: string;
};

type MultiBossDpsTimelineProps = {
  currentTick: number;
  data: Array<{ tick: number; [key: string]: number | undefined }>;
  bosses: BossDefinition[];
  width: string | number;
  height: string | number;
};

export default function MultiBossDpsTimeline({
  currentTick,
  data,
  bosses,
  width,
  height,
}: MultiBossDpsTimelineProps) {
  return (
    <div
      className={styles.chartParent}
      style={{ width, height }}
      data-blert-disable-sidebar="true"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -10 }}>
          <defs>
            {bosses.map((boss) => (
              <linearGradient
                key={`gradient-${boss.dataKey}`}
                id={`${boss.dataKey}Gradient`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={boss.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={boss.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--blert-surface-light)"
            opacity={0.9}
          />
          <XAxis
            dataKey="tick"
            stroke="var(--blert-font-color-secondary)"
            tickLine={false}
            axisLine={{ stroke: 'var(--blert-surface-light)' }}
          />
          <YAxis
            unit="%"
            stroke="var(--blert-font-color-secondary)"
            tickLine={false}
            axisLine={{ stroke: 'var(--blert-surface-light)' }}
          />
          {bosses.map((boss) => (
            <Area
              key={boss.dataKey}
              type="monotone"
              dataKey={boss.dataKey}
              name={boss.name}
              stroke={boss.color}
              strokeWidth={2}
              fill={`url(#${boss.dataKey}Gradient)`}
            />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--blert-surface-dark)',
              border: '1px solid var(--blert-surface-light)',
              borderRadius: '8px',
              color: 'var(--blert-font-color-primary)',
              padding: '8px',
            }}
            formatter={(value: number, name: string) => {
              return [`${value.toFixed(2)}%`, name];
            }}
            labelFormatter={(value: number) => `Tick: ${value}`}
            cursor={{
              stroke: 'var(--blert-divider-color)',
              strokeWidth: 1,
            }}
          />
          <Legend />
          <ReferenceLine
            x={currentTick}
            stroke="var(--blert-red)"
            strokeWidth={2}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
