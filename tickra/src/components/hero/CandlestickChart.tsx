'use client';

import { motion } from 'framer-motion';
import { candles } from './candleData';
import { easeOutExpo } from '@/lib/motion';

const W = 720;
const H = 440;
const PAD = { top: 32, right: 56, bottom: 36, left: 24 };

export function CandlestickChart({ caption }: { caption: string }) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allLow = Math.min(...candles.map((c) => c.l));
  const allHigh = Math.max(...candles.map((c) => c.h));
  const pad = (allHigh - allLow) * 0.12;
  const yMin = allLow - pad;
  const yMax = allHigh + pad;

  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const cw = innerW / candles.length;
  const bodyW = cw * 0.62;

  const gridLines = 5;
  const gridY = Array.from({ length: gridLines }, (_, i) =>
    PAD.top + (innerH * i) / (gridLines - 1),
  );
  const priceLabels = Array.from({ length: gridLines }, (_, i) =>
    (yMax - ((yMax - yMin) * i) / (gridLines - 1)).toFixed(4),
  );

  const trendStart = { x: PAD.left + cw * 3 + cw / 2, y: y(candles[3].l) };
  const trendEnd = { x: PAD.left + cw * 23 + cw / 2, y: y(candles[23].h) };

  const lastPrice = candles[candles.length - 1].c;

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={caption}
        className="block h-auto w-full"
      >
        <defs>
          <clipPath id="chart-clip">
            <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {gridY.map((gy, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={gy}
              y2={gy}
              stroke="rgb(var(--line))"
              strokeWidth={1}
              strokeDasharray={i === gridLines - 1 ? '0' : '2 4'}
            />
            <text
              x={PAD.left + innerW + 10}
              y={gy + 4}
              fontFamily="var(--font-jetbrains)"
              fontSize={10}
              fill="rgb(var(--subtle))"
            >
              {priceLabels[i]}
            </text>
          </g>
        ))}

        <g clipPath="url(#chart-clip)">
          {candles.map((c, i) => {
            const cx = PAD.left + cw * i + cw / 2;
            const isUp = c.c >= c.o;
            const color = isUp ? 'rgb(var(--up))' : 'rgb(var(--down))';
            const bodyTop = y(Math.max(c.o, c.c));
            const bodyBottom = y(Math.min(c.o, c.c));
            const bodyH = Math.max(1.5, bodyBottom - bodyTop);
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 + i * 0.025, ease: easeOutExpo }}
              >
                <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1.25} />
                <rect
                  x={cx - bodyW / 2}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  fill={isUp ? color : color}
                  fillOpacity={isUp ? 0.92 : 1}
                  stroke={color}
                  strokeWidth={1}
                />
              </motion.g>
            );
          })}

          <motion.line
            x1={trendStart.x}
            y1={trendStart.y}
            x2={trendEnd.x}
            y2={trendEnd.y}
            stroke="rgb(var(--brand))"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.9, ease: easeOutExpo }}
          />

          <motion.circle
            cx={trendStart.x}
            cy={trendStart.y}
            r={3}
            fill="rgb(var(--brand))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.95, duration: 0.4, ease: easeOutExpo }}
          />
          <motion.circle
            cx={trendEnd.x}
            cy={trendEnd.y}
            r={3}
            fill="rgb(var(--brand))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.2, duration: 0.4, ease: easeOutExpo }}
          />
        </g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 0.5, ease: easeOutExpo }}
        >
          <line
            x1={PAD.left}
            x2={PAD.left + innerW}
            y1={y(lastPrice)}
            y2={y(lastPrice)}
            stroke="rgb(var(--ink))"
            strokeOpacity={0.35}
            strokeDasharray="2 3"
            strokeWidth={1}
          />
          <rect
            x={PAD.left + innerW + 4}
            y={y(lastPrice) - 10}
            width={48}
            height={20}
            fill="rgb(var(--ink))"
            rx={3}
          />
          <text
            x={PAD.left + innerW + 28}
            y={y(lastPrice) + 4}
            textAnchor="middle"
            fontFamily="var(--font-jetbrains)"
            fontSize={10}
            fill="rgb(var(--canvas))"
          >
            {lastPrice.toFixed(4)}
          </text>
        </motion.g>
      </svg>
      <figcaption className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <span>{caption}</span>
        <span className="flex items-center gap-1.5 text-up">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-up" />
          +0.21%
        </span>
      </figcaption>
    </figure>
  );
}
