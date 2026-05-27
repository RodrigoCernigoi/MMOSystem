import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";

type PixiGameFeelLayerProps = {
  intensity: number;
  accent: "cyan" | "green" | "red";
};

type Particle = {
  graphic: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
};

type Burst = {
  graphic: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: number;
};

const accentColors = {
  cyan: 0x22d3ee,
  green: 0x84cc16,
  red: 0xef4444,
};

export const PixiGameFeelLayer = ({ intensity, accent }: PixiGameFeelLayerProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ intensity, accent });

  useEffect(() => {
    stateRef.current = { intensity, accent };
  }, [intensity, accent]);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    let isMounted = true;
    let isReady = false;
    let app: Application | null = new Application();
    const particles: Particle[] = [];
    const bursts: Burst[] = [];
    const particleLayer = new Container();
    const burstLayer = new Container();
    const lineLayer = new Graphics();
    const pulse = new Graphics();

    const resize = () => {
      if (!app?.renderer) {
        return;
      }

      app.renderer.resize(window.innerWidth, window.innerHeight);
    };

    const createParticle = (width: number, height: number): Particle => {
      const graphic = new Graphics();
      const radius = 1.2 + Math.random() * 2.6;
      const particle: Particle = {
        graphic,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: -0.18 + Math.random() * 0.36,
        vy: -0.12 - Math.random() * 0.28,
        radius,
        phase: Math.random() * Math.PI * 2,
      };

      particleLayer.addChild(graphic);
      return particle;
    };

    const spawnBurst = (type: string) => {
      if (!app?.renderer) {
        return;
      }

      const color = type === "level-up" ? 0xbef264 : type === "skill-unlock" ? 0x7dd3fc : accentColors[stateRef.current.accent];
      const count = type === "level-up" ? 44 : type === "skill-unlock" ? 34 : 24;
      const originX = app.renderer.width * 0.5;
      const originY = app.renderer.height * 0.46;

      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.2 + Math.random() * (type === "level-up" ? 5.2 : 3.4);
        const graphic = new Graphics();
        const burst: Burst = {
          graphic,
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 42 + Math.random() * 26,
          radius: 1.8 + Math.random() * 3.8,
          color,
        };

        bursts.push(burst);
        burstLayer.addChild(graphic);
      }
    };

    const visualEventHandler = ((event: CustomEvent<{ type: string }>) => {
      spawnBurst(event.detail.type);
    }) as EventListener;

    const start = async () => {
      try {
        if (!app) {
          return;
        }

        await app.init({
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          resizeTo: window,
        });
        isReady = true;

        if (!isMounted || !hostRef.current || !app) {
          app?.destroy(true);
          app = null;
          return;
        }

        hostRef.current.appendChild(app.canvas);
        app.stage.addChild(lineLayer);
        app.stage.addChild(particleLayer);
        app.stage.addChild(burstLayer);
        app.stage.addChild(pulse);

        for (let index = 0; index < 54; index += 1) {
          particles.push(createParticle(window.innerWidth, window.innerHeight));
        }

        app.ticker.add((ticker) => {
          if (!app?.renderer) {
            return;
          }

          const { intensity: currentIntensity, accent: currentAccent } = stateRef.current;
          const color = accentColors[currentAccent];
          const width = app.renderer.width;
          const height = app.renderer.height;
          const delta = ticker.deltaTime;
          const power = 0.35 + currentIntensity * 0.65;
          const time = performance.now() / 1000;

          lineLayer.clear();
          for (let i = 0; i < 4; i += 1) {
            const y = height * (0.18 + i * 0.18) + Math.sin(time + i) * 10;
            lineLayer.moveTo(0, y);
            lineLayer.lineTo(width, y + Math.sin(time * 0.8 + i) * 18);
            lineLayer.stroke({ color, alpha: 0.035 * power, width: 1 });
          }

          pulse.clear();
          pulse.circle(width * 0.78, height * 0.22, 80 + Math.sin(time * 1.8) * 10 + currentIntensity * 80);
          pulse.stroke({ color, alpha: 0.08 * power, width: 2 });

          for (const particle of particles) {
            particle.x += particle.vx * delta * (0.8 + currentIntensity);
            particle.y += particle.vy * delta * (0.8 + currentIntensity);

            if (particle.x < -20) particle.x = width + 20;
            if (particle.x > width + 20) particle.x = -20;
            if (particle.y < -20) particle.y = height + 20;
            if (particle.y > height + 20) particle.y = -20;

            const alpha = 0.14 + Math.sin(time * 2 + particle.phase) * 0.08 + currentIntensity * 0.12;
            particle.graphic.clear();
            particle.graphic.circle(particle.x, particle.y, particle.radius);
            particle.graphic.fill({ color, alpha: Math.max(0.05, alpha) });
          }

          for (let index = bursts.length - 1; index >= 0; index -= 1) {
            const burst = bursts[index];
            burst.life += delta;
            burst.x += burst.vx * delta;
            burst.y += burst.vy * delta;
            burst.vy += 0.025 * delta;

            const progress = burst.life / burst.maxLife;
            burst.graphic.clear();

            if (progress >= 1) {
              burstLayer.removeChild(burst.graphic);
              burst.graphic.destroy();
              bursts.splice(index, 1);
              continue;
            }

            burst.graphic.circle(burst.x, burst.y, burst.radius * (1 + progress));
            burst.graphic.fill({ color: burst.color, alpha: 0.85 * (1 - progress) });
          }
        });

        window.addEventListener("mmo-system:visual-event", visualEventHandler);
        window.addEventListener("resize", resize);
      } catch (error) {
        console.warn("Pixi game feel layer failed to initialize.", error);
      }
    };

    void start();

    return () => {
      isMounted = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("mmo-system:visual-event", visualEventHandler);
      if (isReady && app) {
        app.destroy(true, { children: true });
      }
      app = null;
    };
  }, []);

  return <div className="pixi-game-layer" ref={hostRef} aria-hidden="true" />;
};
