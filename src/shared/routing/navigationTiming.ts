type NavigationTiming = {
  phases: Set<string>;
  startedAt: number;
  target: string;
};

let currentNavigation: NavigationTiming | null = null;

function now() {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function startNavigationTiming(target: string) {
  currentNavigation = { phases: new Set(), startedAt: now(), target };
  console.info(`[导航耗时] ${target} · 点击事件进入 JS`);
}

export function markNavigationDispatched(target: string) {
  markNavigationPhase(target, '路由已发起');
}

export function markNavigationRouteModuleLoaded(target: string) {
  markNavigationPhase(target, '路由模块已加载');
}

export function markNavigationRouteRenderStarted(target: string) {
  markNavigationPhase(target, '路由组件开始渲染');
}

export function markNavigationScreenRenderStarted(target: string) {
  markNavigationPhase(target, '页面组件开始渲染');
}

export function markNavigationReactCommitted(target: string) {
  markNavigationPhase(target, 'React 提交完成');
}

export function markNavigationNativeLayout(target: string) {
  markNavigationPhase(target, '原生首个布局完成');
}

export function markNavigationScreenMounted(target: string) {
  markNavigationPhase(target, '页面 effect 完成');
  currentNavigation = null;
}

function markNavigationPhase(target: string, phase: string) {
  if (currentNavigation?.target !== target || currentNavigation.phases.has(phase)) {
    return;
  }

  currentNavigation.phases.add(phase);
  console.info(
    `[导航耗时] ${target} · ${phase}: ${Math.round(now() - currentNavigation.startedAt)}ms`,
  );
}
