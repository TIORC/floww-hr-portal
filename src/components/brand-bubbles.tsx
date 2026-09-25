type BubbleStyle = React.CSSProperties & {
  "--bubble-left": string;
  "--bubble-size": string;
  "--bubble-duration": string;
  "--bubble-delay": string;
  "--bubble-drift-x": string;
  "--bubble-opacity": string;
};

const BUBBLES: BubbleStyle[] = [
  {
    "--bubble-left": "6%",
    "--bubble-size": "1.1rem",
    "--bubble-duration": "18s",
    "--bubble-delay": "0s",
    "--bubble-drift-x": "5.5rem",
    "--bubble-opacity": "0.85",
  },
  {
    "--bubble-left": "15%",
    "--bubble-size": "1.8rem",
    "--bubble-duration": "22s",
    "--bubble-delay": "-4s",
    "--bubble-drift-x": "-4rem",
    "--bubble-opacity": "0.62",
  },
  {
    "--bubble-left": "24%",
    "--bubble-size": "0.85rem",
    "--bubble-duration": "15s",
    "--bubble-delay": "-9s",
    "--bubble-drift-x": "3.5rem",
    "--bubble-opacity": "0.9",
  },
  {
    "--bubble-left": "33%",
    "--bubble-size": "1.35rem",
    "--bubble-duration": "20s",
    "--bubble-delay": "-2s",
    "--bubble-drift-x": "-5.5rem",
    "--bubble-opacity": "0.7",
  },
  {
    "--bubble-left": "42%",
    "--bubble-size": "2.1rem",
    "--bubble-duration": "24s",
    "--bubble-delay": "-13s",
    "--bubble-drift-x": "4.5rem",
    "--bubble-opacity": "0.55",
  },
  {
    "--bubble-left": "50%",
    "--bubble-size": "0.95rem",
    "--bubble-duration": "16s",
    "--bubble-delay": "-6s",
    "--bubble-drift-x": "-3rem",
    "--bubble-opacity": "0.88",
  },
  {
    "--bubble-left": "58%",
    "--bubble-size": "1.6rem",
    "--bubble-duration": "21s",
    "--bubble-delay": "-17s",
    "--bubble-drift-x": "6rem",
    "--bubble-opacity": "0.65",
  },
  {
    "--bubble-left": "66%",
    "--bubble-size": "0.75rem",
    "--bubble-duration": "17s",
    "--bubble-delay": "-11s",
    "--bubble-drift-x": "-5rem",
    "--bubble-opacity": "0.92",
  },
  {
    "--bubble-left": "74%",
    "--bubble-size": "1.25rem",
    "--bubble-duration": "19s",
    "--bubble-delay": "-7s",
    "--bubble-drift-x": "4rem",
    "--bubble-opacity": "0.72",
  },
  {
    "--bubble-left": "81%",
    "--bubble-size": "2rem",
    "--bubble-duration": "23s",
    "--bubble-delay": "-15s",
    "--bubble-drift-x": "-5rem",
    "--bubble-opacity": "0.5",
  },
  {
    "--bubble-left": "89%",
    "--bubble-size": "0.9rem",
    "--bubble-duration": "16s",
    "--bubble-delay": "-3s",
    "--bubble-drift-x": "4.5rem",
    "--bubble-opacity": "0.86",
  },
  {
    "--bubble-left": "96%",
    "--bubble-size": "1.45rem",
    "--bubble-duration": "20s",
    "--bubble-delay": "-10s",
    "--bubble-drift-x": "-3.5rem",
    "--bubble-opacity": "0.6",
  },
];

export function BrandBubbles() {
  return (
    <div className="brand-bubbles" aria-hidden>
      {BUBBLES.map((bubble) => (
        <span key={bubble["--bubble-left"]} className="brand-bubble" style={bubble} />
      ))}
    </div>
  );
}
