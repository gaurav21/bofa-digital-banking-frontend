import { TestBed } from '@angular/core/testing';

export type ConfigureFn = (testBed: typeof TestBed) => void;

export const configureTests = (configure: ConfigureFn) => {
  const configuredTestBed = TestBed;

  configure(configuredTestBed);

  return configuredTestBed.compileComponents().then(() => configuredTestBed);
};
