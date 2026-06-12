'use client';

import { useEffect, useState } from 'react';

// TICKRA-REDESIGN: Animated candlestick reveal for the Premium Navy hero.
// 12 candles, EUR/USD-ish values, pure SVG, no deps.

type Candle = {
  open: number;
  close: number;
  high: number;
  low: number;
};

// Pre-computed sample sequence (EUR/USD ~1.09-1.11 range).
const CANDLES: Candle[] = [
  { open: 1.092, close: 1.094, high: 1.0955, low: 1.0915 },
  { open: 1.094, close: 1.097, high: 1.098, low: 1.0935 },
  { open: 1.097, close: 1.0955, high: 1.0985, low: 1.0945 },
  { open: 1.0955, close: 1.099, high: 1.1, low: 1.095 },
  { open: 1.099, close: 1.1015, high: 1.102, low: 1.0985 },
  { open: 1.1015, close: 1.1005, high: 1.103, low: 1.1 },
  { open: 1.1005, close: 1.103, high: 1.1045, low: 1.1 },
  { open: 1.103, close: 1.1055, high: 1.107, low: 1.1025 },
  { open: 1.1055, close: 1.104, high: 1.1065, low: 1.103 },
  { open: 1.104, close: 1.1065, high: 1.1075, low: 1.1035 },
  { open: 1.1065, close: 1.108, high: 1.109, low: 1.106 },
  { open: 1.108, close: 1.1075, high: 1.1085, low: 1.106 },
];

const VIEW_W = 300;
const VIEW_H = 160;
const PAD_X = 16;
const PAD_Y = 14;
const Y_MIN = 1.091;
const Y_MAX = 1.11;

function yFor(price: number): number {
  const t = (price - Y_MIN) / (Y_MAX - Y_MIN);
  return VIEW_H - PAD_Y - t * (VIEW_H - PAD_Y * 2);
}

export function AnimatedCandleChart() {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRevealed((r) => {
        if (r >= CANDLES.length) return 0;
        return r + 1;
      });
    }, 120);
    return () => clearInterval(id);
  }, []);

  const usableW = VIEW_W - PAD_X * 2 - 24; // leave room for price labels on right
  const step = usableW / CANDLES.length;
  const bodyW = Math.max(4, step * 0.55);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Animated EUR/USD candlestick chart"
        className="block w-full h-auto"
      >
        {/* Subtle grid lines */}
        {[1.107, 1.099, 1.091].map((p) => (
          <line
            key={p}
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={yFor(p)}
            y2={yFor(p)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {CANDLES.map((c, i) => {
          const isBull = c.close >= c.open;
          const color = isBull ? '#059669' : '#DC2626';
          const x = PAD_X + i * step + (step - bodyW) / 2;
          const yTop = yFor(Math.max(c.open, c.close));
          const yBot = yFor(Math.min(c.open, c.close));
          const wickX = x + bodyW / 2;
          const isVisible = i < revealed;
          return (
            <g
              key={i}
              className="transition-opacity duration-300"
              style={{ opacity: isVisible ? 1 : 0 }}
            >
              <line
                x1={wickX}
                x2={wickX}
                y1={yFor(c.high)}
                y2={yFor(c.low)}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                x={x}
                y={yTop}
                width={bodyW}
                height={Math.max(1, yBot - yTop)}
                fill={color}
                rx={0.5}
              />
            </g>
          );
        })}

        {/* Right-side price labels */}
        {[1.107, 1.099, 1.091].map((p) => (
          <text
            key={`l-${p}`}
            x={VIEW_W - PAD_X + 2}
            y={yFor(p) + 3}
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
          >
            {p.toFixed(3)}
          </text>
        ))}

        {/* Bottom caption */}
        <text
          x={PAD_X}
          y={VIEW_H - 2}
          fill="rgba(255,255,255,0.5)"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          EUR/USD · 1H · Last 24 sessions
        </text>
      </svg>
    </div>
  );
}
