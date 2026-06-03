declare module 'particlesjs' {
  interface ParticleOptions {
    selector?: string;
    maxParticles?: number;
    sizeVariations?: number;
    speed?: number;
    color?: string | string[];
    minDistance?: number;
    connectParticles?: boolean;
    responsive?: Array<{
      breakpoint: number;
      options: ParticleOptions;
    }>;
  }

  const Particles: {
    init(options: ParticleOptions): void;
    destroy(): void;
  };

  export default Particles;
}
