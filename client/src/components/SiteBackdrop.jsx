function dustField(seed, count) {
  let state = seed;
  const next = () => {
    state = (state * 16807 + 11) % 2147483647;
    return state / 2147483647;
  };

  return Array.from({ length: count }, (_, index) => {
    const edge = next();
    const along = next();
    const radial = next() ** 1.35;
    let x;
    let y;

    if (edge < 0.25) {
      x = along * 42;
      y = radial * 100;
    } else if (edge < 0.5) {
      x = 58 + along * 42;
      y = radial * 100;
    } else if (edge < 0.75) {
      x = along * 46;
      y = 54 + radial * 46;
    } else {
      x = 54 + along * 46;
      y = 52 + radial * 48;
    }

    return {
      id: `${seed}-${index}`,
      cx: x,
      cy: y,
      r: 0.18 + next() * 1.15,
      opacity: 0.14 + next() * 0.42,
      fill: next() > 0.55 ? '#C9A35B' : '#E6D3A5',
    };
  });
}

const DUST_FIELDS = {
  tl: dustField(17, 70),
  tr: dustField(41, 58),
  bl: dustField(73, 52),
  br: dustField(97, 76),
};

function GoldDust({ points }) {
  return (
    <svg className="site-backdrop__dust" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {points.map((dot) => (
        <circle key={dot.id} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} opacity={dot.opacity} />
      ))}
    </svg>
  );
}

function GoldLineRose({ cx, cy, scale = 1, rotate = 0 }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`} fill="none" stroke="#C9A35B" strokeWidth="1.15">
      <ellipse cx="0" cy="8" rx="18" ry="22" opacity="0.55" />
      <ellipse cx="-11" cy="2" rx="12" ry="16" opacity="0.48" />
      <ellipse cx="12" cy="1" rx="11" ry="15" opacity="0.5" />
      <ellipse cx="0" cy="-8" rx="10" ry="13" opacity="0.58" />
      <ellipse cx="-6" cy="-2" rx="7" ry="9" opacity="0.45" />
      <ellipse cx="5" cy="-3" rx="6.5" ry="8" opacity="0.45" />
      <circle cx="0" cy="0" r="4.2" opacity="0.4" />
    </g>
  );
}

function Bloom({ cx, cy, scale = 1, rotate = 0, deep = true }) {
  const outer = deep ? '#74372A' : '#A96F63';
  const inner = deep ? '#A96F63' : '#E6D3A5';

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <ellipse cx="0" cy="10" rx="22" ry="26" fill={outer} opacity="0.42" />
      <ellipse cx="-14" cy="2" rx="15" ry="20" fill={outer} opacity="0.38" />
      <ellipse cx="15" cy="1" rx="14" ry="19" fill={outer} opacity="0.36" />
      <ellipse cx="-4" cy="-10" rx="13" ry="16" fill={outer} opacity="0.4" />
      <ellipse cx="8" cy="-8" rx="12" ry="15" fill={outer} opacity="0.34" />
      <ellipse cx="0" cy="2" rx="11" ry="12" fill={inner} opacity="0.48" />
      <ellipse cx="-3" cy="-2" rx="6" ry="7" fill="#FFF8EF" opacity="0.22" />
    </g>
  );
}

function Leaf({ cx, cy, rotate = 0, scale = 1, gold = false }) {
  const fill = gold ? '#C9A35B' : '#74372A';

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`} opacity={gold ? 0.38 : 0.34}>
      <path d="M0 0 C18 -8 34 -6 48 8 C32 10 16 12 0 0 Z" fill={fill} />
      <path d="M4 1 C20 -4 34 0 44 8" fill="none" stroke="#E6D3A5" strokeWidth="0.7" opacity="0.55" />
    </g>
  );
}

function Branch({ d, opacity = 0.38 }) {
  return <path d={d} fill="none" stroke="#C9A35B" strokeWidth="1.05" strokeLinecap="round" opacity={opacity} />;
}

function FloraBottomLeft() {
  return (
    <svg className="site-backdrop__flora site-backdrop__flora--bl" viewBox="0 0 420 460" aria-hidden="true">
      <Branch d="M18 430 C70 360 90 280 70 210" opacity="0.32" />
      <Branch d="M40 440 C130 390 190 330 240 250" opacity="0.28" />
      <Branch d="M10 400 C80 340 150 300 210 270" opacity="0.22" />
      <Leaf cx="28" cy="350" rotate="-62" scale="1.15" />
      <Leaf cx="62" cy="300" rotate="-28" scale="0.95" />
      <Leaf cx="18" cy="250" rotate="-78" scale="0.82" gold />
      <Leaf cx="110" cy="360" rotate="18" scale="1.05" />
      <Leaf cx="150" cy="310" rotate="38" scale="0.78" />
      <Leaf cx="88" cy="220" rotate="-12" scale="0.7" gold />
      <Leaf cx="200" cy="390" rotate="52" scale="0.88" />
      <Bloom cx="96" cy="338" scale="1.35" rotate="-12" />
      <Bloom cx="168" cy="292" scale="0.82" rotate="18" deep={false} />
      <Bloom cx="54" cy="268" scale="0.62" rotate="-28" deep={false} />
      <GoldLineRose cx="210" cy="248" scale="1.15" rotate="16" />
      <GoldLineRose cx="132" cy="210" scale="0.72" rotate="-22" />
    </svg>
  );
}

function FloraTopLeft() {
  return (
    <svg className="site-backdrop__flora site-backdrop__flora--tl" viewBox="0 0 320 280" aria-hidden="true">
      <Branch d="M8 12 C60 40 90 90 70 150" />
      <Leaf cx="24" cy="48" rotate="42" scale="0.72" />
      <Leaf cx="58" cy="22" rotate="8" scale="0.55" gold />
      <Leaf cx="18" cy="110" rotate="72" scale="0.6" />
      <Bloom cx="52" cy="68" scale="0.58" rotate="24" deep={false} />
      <GoldLineRose cx="110" cy="36" scale="0.7" rotate="-8" />
    </svg>
  );
}

function FloraTopRight() {
  return (
    <svg className="site-backdrop__flora site-backdrop__flora--tr" viewBox="0 0 320 280" aria-hidden="true">
      <Branch d="M310 18 C250 50 230 110 250 170" opacity="0.3" />
      <Leaf cx="268" cy="42" rotate="150" scale="0.68" />
      <Leaf cx="292" cy="96" rotate="112" scale="0.5" gold />
      <Bloom cx="250" cy="58" scale="0.5" rotate="-18" />
      <GoldLineRose cx="198" cy="28" scale="0.62" rotate="12" />
    </svg>
  );
}

function FloraBottomRight() {
  return (
    <svg className="site-backdrop__flora site-backdrop__flora--br" viewBox="0 0 360 360" aria-hidden="true">
      <Branch d="M340 340 C280 300 250 240 270 180" opacity="0.26" />
      <Leaf cx="300" cy="300" rotate="128" scale="0.9" />
      <Leaf cx="248" cy="318" rotate="168" scale="0.7" />
      <Leaf cx="320" cy="240" rotate="98" scale="0.58" gold />
      <Bloom cx="276" cy="268" scale="0.7" rotate="22" deep={false} />
      <GoldLineRose cx="214" cy="300" scale="0.8" rotate="-14" />
    </svg>
  );
}

export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="site-backdrop__paper" />
      <div className="site-backdrop__glow" />
      <div className="site-backdrop__grain" />
      <div className="site-backdrop__dust-wrap site-backdrop__dust-wrap--tl">
        <GoldDust points={DUST_FIELDS.tl} />
      </div>
      <div className="site-backdrop__dust-wrap site-backdrop__dust-wrap--tr">
        <GoldDust points={DUST_FIELDS.tr} />
      </div>
      <div className="site-backdrop__dust-wrap site-backdrop__dust-wrap--bl">
        <GoldDust points={DUST_FIELDS.bl} />
      </div>
      <div className="site-backdrop__dust-wrap site-backdrop__dust-wrap--br">
        <GoldDust points={DUST_FIELDS.br} />
      </div>
      <FloraTopLeft />
      <FloraTopRight />
      <FloraBottomRight />
      <FloraBottomLeft />
    </div>
  );
}
