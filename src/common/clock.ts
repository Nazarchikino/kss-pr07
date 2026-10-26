/** Абстракція годинника: у тестах замінюється фіксованим часом. */
export interface Clock {
  now(): Date;
}

/** Токен впровадження для годинника (інтерфейси зникають під час компіляції). */
export const CLOCK = Symbol('CLOCK');

export const systemClock: Clock = { now: () => new Date() };
