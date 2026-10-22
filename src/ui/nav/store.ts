import { useLayoutEffect, useRef } from 'react';
import { create } from 'zustand';
import type { NavIconId } from './icons';
import type { GlyphId } from '../icons';

/**
 * v0.32: the actions a screen gives to the bottom bar (its places 2 to 4 in NAV_CONFIG) and the commands of the
 * screen that have no place in the bar (former floating pill, previous / next, explanations…): those are listed
 * at the top of the « Menu » sheet, under « Sur cet écran ». Same pattern as the former pill (useActionPill): the
 * screen declares while it is shown, the bar draws.
 */
export interface ScreenAction {
  run: () => void;
  /** shown greyed out and not run (nothing selected yet) */
  disabled?: boolean;
  /** an on / off state (slow motion on, technique mastered, favourite): highlighted and announced as pressed */
  pressed?: boolean;
  /** icon and word when they follow the state (Démarrer / Pause / Reprendre); default: NAV_CONFIG */
  icon?: NavIconId;
  label?: string;
  /** longer spoken name; it starts with the visible word */
  ariaLabel?: string;
  /** test id kept from the former buttons (default `nav-<action>`) */
  testId?: string;
}

export interface MenuCommand {
  id: string;
  label: string;
  /** an icon of the mockup when one fits, else a glyph of the app's icon set */
  icon: NavIconId | { glyph: GlyphId };
  run: () => void;
  pressed?: boolean;
  disabled?: boolean;
  testId?: string;
}

type ActionView = Omit<ScreenAction, 'run'>;
type CommandView = Omit<MenuCommand, 'run'>;

export type NavSheet = null | 'menu' | 'news';

interface NavState {
  actions: Record<string, ActionView>;
  commands: CommandView[];
  run: (id: string) => void;
  runCommand: (id: string) => void;
  /** the sheet of the bar open now */
  sheet: NavSheet;
  sheetLayer: number;
  setSheet: (s: NavSheet, layer?: number) => void;
}

type Live = { actions: Record<string, ScreenAction | false | null | undefined>; commands: readonly (MenuCommand | false | null | undefined)[] };
type Reg = { views: Record<string, ActionView>; cmds: CommandView[]; live: { current: Live } };

/** a screen can declare from several of its parts (the catalogue and its tab): the declarations are merged */
const regs = new Map<object, Reg>();

function publish() {
  const actions: Record<string, ActionView> = {};
  const commands: CommandView[] = [];
  for (const r of regs.values()) {
    Object.assign(actions, r.views);
    for (const c of r.cmds) if (!commands.some((x) => x.id === c.id)) commands.push(c);
  }
  useNavStore.setState({ actions, commands });
}

function find<T>(pick: (l: Live) => T | undefined): T | undefined {
  let found: T | undefined;
  for (const r of regs.values()) found = pick(r.live.current) ?? found;
  return found;
}

export const useNavStore = create<NavState>((set) => ({
  actions: {},
  commands: [],
  run: (id) => {
    const a = find((l) => l.actions[id] || undefined);
    if (a && !a.disabled) a.run();
  },
  runCommand: (id) => {
    const c = find((l) => l.commands.find((y) => y && y.id === id) || undefined);
    if (c && !c.disabled) c.run();
  },
  sheet: null,
  sheetLayer: 0,
  setSheet: (sheet, layer) => set((s) => ({ sheet, sheetLayer: layer ?? s.sheetLayer })),
}));

/**
 * Declares the bar actions of a screen (keyed by the action ids of NAV_CONFIG) and its other commands. Read on every
 * render, so they act on the current state; the bar redraws only when what it shows changes.
 */
export function useNavActions(actions: Live['actions'], commands: Live['commands'] = []) {
  const live = useRef<Live>({ actions, commands });
  live.current = { actions, commands };
  const views: Record<string, ActionView> = {};
  for (const [k, a] of Object.entries(actions)) {
    if (!a) continue;
    const { run: _run, ...v } = a;
    views[k] = v;
  }
  const cmds: CommandView[] = [];
  for (const c of commands) {
    if (!c) continue;
    const { run: _run, ...v } = c;
    cmds.push(v);
  }
  const key = JSON.stringify([views, cmds]);
  // a layout effect: cleaned up when the screen is hidden behind the loading fallback of the next (lazy) screen
  useLayoutEffect(() => {
    const [v, c] = JSON.parse(key) as [Record<string, ActionView>, CommandView[]];
    const owner = {};
    regs.set(owner, { views: v, cmds: c, live });
    publish();
    return () => {
      regs.delete(owner);
      publish();
    };
  }, [key]);
}

/**
 * A screen with unsaved changes (the fighter studio) asks before the bar or the Menu leaves it, as it already did
 * for links (useLeaveGuard). `leave(go)` runs `go` at once, or hands it to the screen's confirmation.
 */
let leaveGuard: ((go: () => void) => void) | null = null;
export function setLeaveGuard(guard: ((go: () => void) => void) | null) {
  leaveGuard = guard;
}
export function leave(go: () => void) {
  if (leaveGuard) leaveGuard(go);
  else go();
}
