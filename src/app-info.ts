import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Відомості про застосунок для /health. */
export interface AppInfo {
  name: string;
  version: string;
  startedAt: Date;
}

export const APP_INFO = 'APP_INFO';

/** Фабрика провайдера: читає назву і версію з package.json один раз під час запуску. */
export function appInfoFactory(): AppInfo {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
  ) as {
    name: string;
    version: string;
  };
  return { name: pkg.name, version: pkg.version, startedAt: new Date() };
}
