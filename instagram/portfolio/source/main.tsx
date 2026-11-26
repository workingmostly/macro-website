/// <reference types="vite/client" />
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import './slides.css';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import emoji from './emoji.json';
import { SLIDES } from './slides';

/*
  One slide per page: /?slide=swipe&t=2.5. Every frame is a pure function of `t`, so render.mjs can step through a
  video frame by frame. The website's voice bar draws its waveform on its own animation loop; switching
  requestAnimationFrame off keeps that loop from ever running here (the slides draw the waveform themselves).
  Add &play to watch a video slide loop in real time.
*/
window.requestAnimationFrame = (() => 0) as typeof window.requestAnimationFrame;
window.cancelAnimationFrame = () => {};

const params = new URLSearchParams(location.search);
const slide = SLIDES.find((s) => s.id === params.get('slide')) ?? SLIDES[0];
const root = createRoot(document.getElementById('root')!);

function draw(t: number) {
  flushSync(() =>
    root.render(
      <div className="stage">
        <slide.Component t={t} />
      </div>,
    ),
  );
}

async function preload() {
  const files = [...Object.values(emoji).map((f) => `/emoji/${f}`), '/icon.png'];
  await Promise.all(
    files.map(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
    }),
  );
  await Promise.all([
    document.fonts.load('600 80px "Inter Tight Variable"'),
    document.fonts.load('400 30px "Inter Variable"'),
    document.fonts.load('200 128px "Inter Variable"'),
    document.fonts.load('500 26px "JetBrains Mono"'),
  ]);
  await document.fonts.ready;
}

declare global {
  interface Window {
    __meta: { id: string; file: string; kind: 'still' | 'video'; duration: number; poster: number }[];
    __ready: Promise<void>;
    __setTime: (t: number) => void;
  }
}

window.__meta = SLIDES.map(({ id, file, kind, duration = 0, poster = 0 }) => ({ id, file, kind, duration, poster }));
window.__setTime = draw;
window.__ready = preload().then(() => draw(Number(params.get('t') ?? slide.poster ?? 0)));

if (params.has('play') && slide.kind === 'video') {
  const start = performance.now();
  setInterval(() => draw(((performance.now() - start) / 1000) % (slide.duration ?? 1)), 1000 / 30);
}
