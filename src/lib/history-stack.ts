export type OverlayKind =
  | 'lightbox'
  | 'editor'
  | 'menu'
  | 'sheet'
  | 'confirm'
  | 'prompt'
  | 'move';

export type Overlay =
  | { kind: 'lightbox'; src: string; alt?: string }
  | { kind: 'editor'; noteId: string }
  | { kind: 'menu' }
  | { kind: 'sheet'; sheet: 'composer' | 'page' | 'chip' }
  | { kind: 'confirm'; title: string; body?: string; action: 'delete-notes' | 'delete-page'; payload?: string }
  | { kind: 'prompt'; title: string; placeholder?: string; value?: string; action: 'new-page' | 'rename-page' | 'new-section' }
  | { kind: 'move' };

type Listener = () => void;

const listeners = new Set<Listener>();
let stack: Overlay[] = [];
let exitArmedUntil = 0;
let onExitToast: ((msg: string) => void) | null = null;
let started = false;

function emit() {
  for (const l of listeners) l();
}

export function subscribeOverlays(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getOverlays(): Overlay[] {
  return stack;
}

export function topOverlay(): Overlay | null {
  return stack[stack.length - 1] ?? null;
}

export function setExitToastHandler(fn: (msg: string) => void) {
  onExitToast = fn;
}

export function startHistoryStack() {
  if (started) return;
  started = true;
  history.pushState({ scriptor: 'root' }, '');
  window.addEventListener('popstate', onPop);
}

function onPop() {
  if (stack.length) {
    stack = stack.slice(0, -1);
    emit();
    return;
  }
  const now = Date.now();
  if (now < exitArmedUntil) {
    history.go(-1);
    return;
  }
  exitArmedUntil = now + 2000;
  onExitToast?.('Toque de novo para sair');
  history.pushState({ scriptor: 'root' }, '');
}

export function openOverlay(overlay: Overlay) {
  stack = [...stack, overlay];
  history.pushState({ scriptor: overlay.kind }, '');
  emit();
}

export function closeTopViaBack() {
  if (!stack.length) return;
  history.back();
}

export function replaceTop(overlay: Overlay) {
  if (!stack.length) {
    openOverlay(overlay);
    return;
  }
  stack = [...stack.slice(0, -1), overlay];
  emit();
}

export function closeAllOverlays() {
  const n = stack.length;
  if (!n) return;
  stack = [];
  emit();
  if (n === 1) history.back();
  else history.go(-n);
}
