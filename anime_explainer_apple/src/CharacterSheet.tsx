import React, {useEffect, useState} from 'react';
import {AbsoluteFill, delayRender, continueRender} from 'remotion';
import {Character} from './Character';
import {CANDIDATES, SIMPLE_CANDIDATES} from './characters';
import {HAND, loadFonts} from './fonts';

// キャラ候補の見本（選ぶための1枚）
export const CharacterSheetSimple: React.FC = () => <CharacterSheet simple />;
export const CharacterSheet: React.FC<{simple?: boolean}> = ({simple = false}) => {
  const list = simple ? SIMPLE_CANDIDATES : CANDIDATES;
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => { loadFonts(JSON.stringify([...CANDIDATES, ...SIMPLE_CANDIDATES].map((x) => x.name + x.desc))).then(() => continueRender(handle)).catch(() => continueRender(handle)); }, [handle]);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(160deg,#fff8e0,#ffe9b8)'}}>
      <svg width={1920} height={1080}>
        {list.map((c, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = 192 + col * 384;
          const baseY = row === 0 ? 440 : 960;
          return (
            <g key={c.id}>
              <rect x={x - 176} y={baseY - 420} width={352} height={490} rx={30} fill="rgba(255,255,255,0.65)" stroke="#1b1b1b" strokeWidth={4} />
              <Character who="" cfg={c.cfg} x={x} y={baseY - 10} scale={0.66} expr="smile" talking={false} seed={i * 13} simple={simple} />
              <text x={x - 150} y={baseY - 372} fontFamily={HAND} fontSize={64} fill="#e23030" stroke="#1b1b1b" strokeWidth={8} paintOrder="stroke">{c.id}</text>
              <text x={x} y={baseY + 26} fontFamily={HAND} fontSize={c.name.length > 7 ? 34 : 40} fill="#1b1b1b" textAnchor="middle">{c.name}</text>
              <text x={x} y={baseY + 62} fontFamily={HAND} fontSize={26} fill="#555" textAnchor="middle">{c.desc}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
