import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { NeatGradient, type NeatConfig } from '@firecms/neat';
import App from './App.tsx';
import './main.css';

declare global {
  interface Window {
    triggerDesktopExit?: () => void;
  }
}

const backgroundConfig: NeatConfig = {
  colors: [
    { color: '#37404A', enabled: true },
    { color: '#707074', enabled: true },
    { color: '#5C5C5F', enabled: true },
    { color: '#252B3A', enabled: true },
    { color: '#455056', enabled: true },
    { color: '#B8D4E6', enabled: false },
  ],
  speed: 1,
  horizontalPressure: 3,
  verticalPressure: 5,
  waveFrequencyX: 1,
  waveFrequencyY: 3,
  waveAmplitude: 8,
  shadows: 0,
  highlights: 2,
  colorBrightness: 1,
  colorSaturation: 6,
  wireframe: false,
  antialias: false,
  colorBlending: 7,
  backgroundColor: '#003FFF',
  backgroundAlpha: 1,
  grainIntensity: 0,
  resolution: 0.25,
  //@ts-expect-error
  renderScale: 0.25,
  yOffset: 0,
  yOffsetWaveMultiplier: 1.8,
  yOffsetColorMultiplier: 2,
  yOffsetFlowMultiplier: 2.2,
  flowDistortionA: 3.7,
  flowDistortionB: 1.4,
  flowScale: 2.9,
  flowEase: 0.32,
  flowEnabled: false,
  enableProceduralTexture: false,
  transparentTextureVoid: false,
  textureVoidLikelihood: 0.27,
  textureVoidWidthMin: 60,
  textureVoidWidthMax: 420,
  textureBandDensity: 1.2,
  textureColorBlending: 0.06,
  textureSeed: 333,
  textureEase: 0.8,
  proceduralBackgroundColor: '#0E0707',
  textureShapeTriangles: 20,
  textureShapeCircles: 15,
  textureShapeBars: 15,
  textureShapeSquiggles: 10,
  domainWarpEnabled: false,
  domainWarpIntensity: 0,
  domainWarpScale: 3,
  vignetteIntensity: 0,
  vignetteRadius: 0.8,
  fresnelEnabled: false,
  fresnelPower: 2,
  fresnelIntensity: 0.5,
  fresnelColor: '#FFFFFF',
  iridescenceEnabled: false,
  iridescenceIntensity: 0.5,
  iridescenceSpeed: 1,
  bloomIntensity: 0,
  bloomThreshold: 0.7,
  chromaticAberration: 0,
  shapeType: 'plane',
  shapeRotationX: 0,
  shapeRotationY: 0,
  shapeRotationZ: 0,
  shapeAutoRotateSpeedX: 0,
  shapeAutoRotateSpeedY: 0,
  sphereRadius: 15,
  torusRadius: 15,
  torusTube: 5,
  cylinderRadius: 10,
  cylinderHeight: 40,
  planeBend: 0,
  planeTwist: 0,
  silhouetteFade: 0.25,
  cylinderFade: 0.08,
  ribbonFade: 0.05,
  flatShading: true,
  cameraLock: true,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
  cameraRotationX: 0,
  cameraRotationY: 0,
  cameraRotationZ: 0,
  cameraZoom: 1,

};

function GlobalGradient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gradientRef = useRef<NeatGradient | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const supportsWebGL = !!(
      (canvas.getContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2')))
    );

    if (!supportsWebGL) {
      document.body.classList.add('wst-bg');
      return;
    }
    
    document.body.classList.remove('wst-bg');

    gradientRef.current = new NeatGradient({
      ref: canvasRef.current,
      ...backgroundConfig,
    } as NeatConfig & { ref: HTMLCanvasElement });

    return () => {
      gradientRef.current?.destroy();
      gradientRef.current = null;
      document.body.classList.remove('wst-bg');
    };
  }, []);

  return <canvas id="gradient" ref={canvasRef} aria-label="Animated gradient background" />;
}

export const triggerDesktopExit = () => {
  if (typeof window === 'undefined' || document.body.classList.contains('desktop-exit')) {
    return;
  }

  document.body.classList.add('desktop-exit');

  const gradient = document.getElementById('gradient');
  if (gradient) {
    gradient.classList.add('gradient-fading');
  }

  window.dispatchEvent(new CustomEvent('desktop-exit'));
};

window.triggerDesktopExit = triggerDesktopExit;

createRoot(document.getElementById('root')!).render(
  <>
    <GlobalGradient />
    <App />
  </>
);
