'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CirclePause,
  CirclePlay,
  Globe2,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

type Scope = '全球' | '亚太' | '华东' | '上海枢纽';
type AlertItem = {
  id: number;
  time: string;
  level: '高' | '中';
  scope: string;
  text: string;
  value: string;
  threshold: string;
  acknowledged: boolean;
};
const scopePath: Record<Scope, Scope[]> = {
  全球: ['全球'],
  亚太: ['全球', '亚太'],
  华东: ['全球', '亚太', '华东'],
  上海枢纽: ['全球', '亚太', '华东', '上海枢纽'],
};
const nextScope: Partial<Record<Scope, Scope>> = {
  全球: '亚太',
  亚太: '华东',
  华东: '上海枢纽',
};
const baseAlerts: AlertItem[] = [
  {
    id: 1,
    time: '09:42',
    level: '高',
    scope: '西南大区',
    text: '目标达成率连续 3 个月低于阈值',
    value: '89.2%',
    threshold: '< 92%',
    acknowledged: false,
  },
  {
    id: 2,
    time: '09:31',
    level: '高',
    scope: '成都—莫斯科',
    text: '干线在途量环比异常下降',
    value: '-4.1%',
    threshold: '< -3%',
    acknowledged: false,
  },
  {
    id: 3,
    time: '09:18',
    level: '高',
    scope: '恒信科技',
    text: '应收账款逾期 63 天',
    value: '¥240万',
    threshold: '> 45天',
    acknowledged: false,
  },
  {
    id: 4,
    time: '08:56',
    level: '中',
    scope: '深圳南山店',
    text: '单日销售额创年内新高',
    value: '¥84.2万',
    threshold: '> ¥80万',
    acknowledged: false,
  },
  {
    id: 5,
    time: '08:44',
    level: '中',
    scope: '云服务品类',
    text: '毛利率环比下滑',
    value: '-2.1pp',
    threshold: '< -1.5pp',
    acknowledged: false,
  },
];
const regions: Record<
  Scope,
  { kpis: [string, string, string][]; ranking: [string, number, string][] }
> = {
  全球: {
    kpis: [
      ['年度营收', '86.42', '亿元'],
      ['目标达成', '101.0', '%'],
      ['毛利率', '34.8', '%'],
      ['回款率', '86.3', '%'],
      ['库存周转', '41.2', '天'],
    ],
    ranking: [
      ['亚太', 108, '¥31.6亿'],
      ['欧洲', 102, '¥20.8亿'],
      ['北美', 96, '¥18.9亿'],
      ['中东非', 91, '¥9.7亿'],
    ],
  },
  亚太: {
    kpis: [
      ['年度营收', '31.59', '亿元'],
      ['目标达成', '104.2', '%'],
      ['毛利率', '36.1', '%'],
      ['回款率', '89.4', '%'],
      ['库存周转', '38.6', '天'],
    ],
    ranking: [
      ['华东', 108, '¥12.7亿'],
      ['华南', 104, '¥9.2亿'],
      ['华北', 97, '¥6.4亿'],
      ['西南', 89, '¥3.3亿'],
    ],
  },
  华东: {
    kpis: [
      ['年度营收', '12.74', '亿元'],
      ['目标达成', '108.1', '%'],
      ['毛利率', '37.2', '%'],
      ['回款率', '91.3', '%'],
      ['库存周转', '32.0', '天'],
    ],
    ranking: [
      ['上海', 112, '¥4.7亿'],
      ['苏州', 108, '¥3.1亿'],
      ['南京', 101, '¥2.7亿'],
      ['杭州', 96, '¥2.2亿'],
    ],
  },
  上海枢纽: {
    kpis: [
      ['年度营收', '4.72', '亿元'],
      ['目标达成', '112.4', '%'],
      ['毛利率', '39.0', '%'],
      ['回款率', '94.1', '%'],
      ['库存周转', '28.6', '天'],
    ],
    ranking: [
      ['浦东中心', 118, '¥1.8亿'],
      ['虹桥中心', 111, '¥1.3亿'],
      ['临港仓', 105, '¥0.9亿'],
      ['宝山仓', 97, '¥0.7亿'],
    ],
  },
};
const routes = [
  ['上海 → 鹿特丹', '8.42', '-1.2%'],
  ['深圳 → 洛杉矶', '7.16', '+3.4%'],
  ['上海 → 纽约', '6.38', '+1.1%'],
  ['广州 → 迪拜', '4.92', '+5.2%'],
  ['北京 → 法兰克福', '4.35', '-0.6%'],
];

function Globe({
  paused,
  focus,
  onSelect,
}: {
  paused: boolean;
  focus: string | null;
  onSelect: (n: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef({ x: -0.18, y: -0.36 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const nodes = useMemo(
    () => [
      { name: '上海', lat: 31, lon: 121 },
      { name: '新加坡', lat: 1, lon: 104 },
      { name: '迪拜', lat: 25, lon: 55 },
      { name: '鹿特丹', lat: 52, lon: 4 },
      { name: '纽约', lat: 41, lon: -74 },
      { name: '洛杉矶', lat: 34, lon: -118 },
    ],
    [],
  );
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const project = (
      lat: number,
      lon: number,
      r: number,
      cx: number,
      cy: number,
    ) => {
      const la = (lat * Math.PI) / 180,
        lo = (lon * Math.PI) / 180 + rotation.current.y,
        x = Math.cos(la) * Math.sin(lo),
        y = -Math.sin(la);
      let z = Math.cos(la) * Math.cos(lo);
      const co = Math.cos(rotation.current.x),
        si = Math.sin(rotation.current.x),
        yy = y * co - z * si;
      z = y * si + z * co;
      return { x: cx + x * r, y: cy + yy * r, z };
    };
    const draw = () => {
      const dpr = Math.min(devicePixelRatio, 2),
        rect = c.getBoundingClientRect();
      if (c.width !== rect.width * dpr || c.height !== rect.height * dpr) {
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width,
        h = rect.height,
        cx = w / 2,
        cy = h / 2,
        r = Math.min(w, h) * 0.38;
      ctx.clearRect(0, 0, w, h);
      if (!paused && !drag.current) rotation.current.y += 0.00055;
      const glow = ctx.createRadialGradient(
        cx - r * 0.25,
        cy - r * 0.2,
        r * 0.1,
        cx,
        cy,
        r * 1.25,
      );
      glow.addColorStop(0, '#12476a');
      glow.addColorStop(0.6, '#071d32');
      glow.addColorStop(1, 'rgba(3,10,20,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
      ctx.fill();
      const sphere = ctx.createRadialGradient(
        cx - r * 0.35,
        cy - r * 0.35,
        r * 0.05,
        cx,
        cy,
        r,
      );
      sphere.addColorStop(0, '#144d72');
      sphere.addColorStop(0.55, '#061b30');
      sphere.addColorStop(1, '#020914');
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(73,171,230,.13)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(lat, lon, r, cx, cy);
          if (p.z > 0) {
            if (started) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            started = true;
          } else started = false;
        }
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 20) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lat, lon, r, cx, cy);
          if (p.z > 0) {
            if (started) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            started = true;
          } else started = false;
        }
        ctx.stroke();
      }
      const utcHours =
        new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
      const sunLon = 180 - utcHours * 15;
      const sunPoint = project(0, sunLon, r, cx, cy);
      const nightShade = ctx.createLinearGradient(
        sunPoint.x,
        sunPoint.y,
        cx * 2 - sunPoint.x,
        cy * 2 - sunPoint.y,
      );
      nightShade.addColorStop(0, 'rgba(3,8,17,0)');
      nightShade.addColorStop(0.48, 'rgba(3,8,17,.12)');
      nightShade.addColorStop(0.56, 'rgba(1,4,11,.72)');
      nightShade.addColorStop(1, 'rgba(0,2,8,.88)');
      ctx.fillStyle = nightShade;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      for (let i = 0; i < 520; i++) {
        const lat = ((i * 47) % 150) - 68,
          lon = ((i * 83) % 360) - 180,
          p = project(lat, lon, r, cx, cy),
          solarDot =
            Math.cos((lat * Math.PI) / 180) *
            Math.cos(((lon - sunLon) * Math.PI) / 180);
        if (p.z > 0.08 && solarDot < 0.12) {
          ctx.fillStyle = `rgba(255,181,73,${0.22 + p.z * 0.5})`;
          ctx.fillRect(p.x, p.y, 1.4, 1.4);
        }
      }
      const hub = nodes[0];
      for (const t of nodes.slice(1)) {
        const a = project(hub.lat, hub.lon, r, cx, cy),
          b = project(t.lat, t.lon, r, cx, cy);
        if (a.z > -0.1 || b.z > -0.1) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(
            (a.x + b.x) / 2,
            (a.y + b.y) / 2 - r * 0.32,
            b.x,
            b.y,
          );
          ctx.strokeStyle = 'rgba(73,199,255,.45)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.strokeStyle = '#2a9bd5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      for (const n of nodes) {
        const p = project(n.lat, n.lon, r, cx, cy);
        if (p.z > 0.05) {
          const active = focus === n.name;
          ctx.fillStyle = active ? '#fff' : '#65dcff';
          ctx.shadowColor = '#62dfff';
          ctx.shadowBlur = active ? 25 : 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, active ? 7 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          if (active) {
            ctx.strokeStyle = '#61dfff';
            ctx.beginPath();
            ctx.arc(
              p.x,
              p.y,
              15 + Math.sin(Date.now() / 250) * 3,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [paused, focus, nodes]);
  const down = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x,
      dy = e.clientY - drag.current.y;
    rotation.current.y += dx * 0.007;
    rotation.current.x = Math.max(
      -1.1,
      Math.min(1.1, rotation.current.x + dy * 0.006),
    );
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      moved: drag.current.moved || Math.abs(dx) + Math.abs(dy) > 3,
    };
  };
  const up = (e: React.PointerEvent) => {
    if (drag.current && !drag.current.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      onSelect(
        nodes[
          Math.floor(((e.clientX - rect.left) / rect.width) * nodes.length) %
            nodes.length
        ].name,
      );
    }
    drag.current = null;
  };
  return (
    <canvas
      ref={canvasRef}
      className="globe-canvas"
      aria-label="可拖拽的全球业务网络地球"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
    />
  );
}
function Panel({
  title,
  aside,
  children,
  className = '',
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-head">
        <h2>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
function Sparkline({
  values,
  color = '#3fb6ff',
}: {
  values: number[];
  color?: string;
}) {
  const pts = values
    .map((v, i) => `${(i * 100) / (values.length - 1)},${54 - v}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="spark">
      <polygon points={`0,60 ${pts} 100,60`} fill={color} opacity=".1" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Home() {
  const [scope, setScope] = useState<Scope>('全球'),
    [paused, setPaused] = useState(false),
    [online, setOnline] = useState(true),
    [selected, setSelected] = useState<string | null>('上海'),
    [alerts, setAlerts] = useState(baseAlerts),
    [detail, setDetail] = useState<AlertItem | null>(null),
    [clock, setClock] = useState<Date | null>(null),
    [tick, setTick] = useState(0);
  useEffect(() => {
    setClock(new Date());
    const t = setInterval(() => setClock(new Date()), 1000),
      d = setInterval(() => setTick((v) => v + 1), 5000);
    return () => {
      clearInterval(t);
      clearInterval(d);
    };
  }, []);
  const data = regions[scope],
    highCount = alerts.filter(
      (a) => a.level === '高' && !a.acknowledged,
    ).length;
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'acknowledge_alert',
          title: '确认告警',
          description: '确认一条当前大屏中的告警，并同步更新可见告警状态。',
          inputSchema: {
            type: 'object',
            properties: { alertId: { type: 'number' } },
            required: ['alertId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const id = (input as { alertId?: unknown })?.alertId;
            if (typeof id !== 'number' || !baseAlerts.some((a) => a.id === id))
              throw new Error('无效的告警 ID');
            setAlerts((v) =>
              v.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
            );
            return { alertId: id, status: 'acknowledged' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const drill = useCallback(() => {
    const n = nextScope[scope];
    if (n) {
      setScope(n);
      setSelected(n === '上海枢纽' ? '上海' : n);
    }
  }, [scope]);
  const acknowledge = (id: number) => {
    setAlerts((v) =>
      v.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
    setDetail((d) => (d?.id === id ? { ...d, acknowledged: true } : d));
  };
  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <Globe2 />
          <div>
            <h1>全球运营指挥中心</h1>
            <p>GLOBAL OPERATIONS COMMAND</p>
          </div>
        </div>
        <nav className="breadcrumbs" aria-label="组织路径">
          {scopePath[scope].map((s, i) => (
            <button key={s} onClick={() => setScope(s)}>
              {i > 0 && <span>/</span>}
              {s}
            </button>
          ))}
        </nav>
        <div className="status">
          <button
            className={`live ${online ? '' : 'offline'}`}
            onClick={() => setOnline((v) => !v)}
          >
            {online ? <Wifi /> : <WifiOff />}
            {online ? '实时接入' : '连接中断'}
          </button>
          <div className="clock">
            <strong>
              {clock
                ? clock.toLocaleTimeString('zh-CN', { hour12: false })
                : '--:--:--'}
            </strong>
            <small>
              {clock
                ? clock.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                : '----/--/--'}{' '}
              · 悉尼
            </small>
          </div>
          <button
            className="icon-btn"
            aria-label="进入全屏"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Maximize2 />
          </button>
        </div>
      </header>
      {!online && (
        <div className="offline-bar">
          连接中断，保留最近快照 · 数据截至{' '}
          {clock
            ? clock.toLocaleTimeString('zh-CN', { hour12: false })
            : '--:--:--'}
        </div>
      )}
      <div className="grid">
        <aside className="left-stack">
          <Panel
            title="区域达成率"
            aside={
              <button onClick={drill} disabled={!nextScope[scope]}>
                点击下钻
              </button>
            }
          >
            <div className="ranking">
              {data.ranking.map(([name, val, amount], i) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelected(name);
                    drill();
                  }}
                >
                  <b>{i + 1}</b>
                  <span>{name}</span>
                  <i>
                    <em style={{ width: `${Math.min(val, 115)}%` }} />
                  </i>
                  <strong>{amount}</strong>
                  <small className={val < 100 ? 'warn' : 'good'}>{val}%</small>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="业务结构">
            <div className="donut-wrap">
              <div className="donut">
                <span>
                  86.4<small>亿元</small>
                </span>
              </div>
              <ul className="legend">
                <li>
                  <b className="blue" />
                  智能终端 <strong>37.7%</strong>
                </li>
                <li>
                  <b className="purple" />
                  云服务 <strong>25.3%</strong>
                </li>
                <li>
                  <b className="green-bg" />
                  工业模组 <strong>19.7%</strong>
                </li>
                <li>
                  <b className="orange" />
                  配件耗材 <strong>11.2%</strong>
                </li>
              </ul>
            </div>
          </Panel>
          <Panel
            title="库存周转"
            aside={<span className="unit">单位：天</span>}
          >
            <div className="bars">
              {[
                ['华东', 32],
                ['华南', 38],
                ['华北', 45],
                ['西南', 51],
                ['华中', 57],
              ].map(([n, v]) => (
                <div key={n}>
                  <span>{n}</span>
                  <i>
                    <em
                      className={
                        Number(v) > 50
                          ? 'danger'
                          : Number(v) > 42
                            ? 'caution'
                            : ''
                      }
                      style={{ width: `${Number(v) * 1.45}%` }}
                    />
                  </i>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
        <section className="center">
          <div className="kpis">
            {data.kpis.map(([label, value, unit], i) => (
              <article key={label}>
                <span>{label}</span>
                <div>
                  <strong>{value}</strong>
                  <b>{unit}</b>
                </div>
                <small className={i === 3 ? 'down' : 'up'}>
                  {i === 3 ? '▼ 1.8%' : '▲ ' + (1.2 + i * 0.8).toFixed(1) + '%'}{' '}
                  <i>同比</i>
                </small>
              </article>
            ))}
          </div>
          <section className="globe-panel">
            <div className="globe-label">
              <strong>全球贸易网络</strong>
              <span>GLOBAL TRADE NETWORK · REALTIME</span>
            </div>
            <Globe paused={paused} focus={selected} onSelect={setSelected} />
            <div className="globe-controls">
              <button onClick={() => setPaused((v) => !v)}>
                {paused ? <CirclePlay /> : <CirclePause />}
                {paused ? '继续巡航' : '暂停巡航'}
              </button>
              <button onClick={() => setSelected('上海')}>
                <RotateCcw />
                复位
              </button>
            </div>
            <div className="selection">
              <span>当前聚焦</span>
              <strong>{selected || '未选择'}</strong>
              <button onClick={drill} disabled={!nextScope[scope]}>
                下钻 →
              </button>
            </div>
            <div className="globe-hint">拖动旋转 · 点击节点聚焦</div>
          </section>
          <Panel
            title="营收趋势与目标"
            aside={<span className="scope-tag">{scope}</span>}
            className="trend"
          >
            <div className="chart-key">
              <span className="actual">实际</span>
              <span className="target">目标</span>
              <span className="predict">预测</span>
            </div>
            <Sparkline
              values={[
                18,
                20,
                27,
                32,
                23,
                25,
                34,
                38,
                42,
                44,
                51,
                42 + (tick % 3 === 0 ? 1 : 0),
              ]}
            />
            <svg
              className="target-line"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,40 9,39 18,37 27,35 36,33 45,31 54,29 63,27 72,25 81,23 90,21 100,19"
                fill="none"
                stroke="#ffb64a"
                strokeWidth="1"
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="months">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i}>{i + 1}月</span>
              ))}
            </div>
          </Panel>
        </section>
        <aside className="right-stack">
          <Panel
            title="跨境干线"
            aside={<span className="unit">近 24 小时 · 千吨</span>}
          >
            <div className="routes">
              {routes.map(([route, val, delta]) => (
                <button
                  key={route}
                  onClick={() => setSelected(route.split(' → ')[0])}
                >
                  <span>{route}</span>
                  <strong>{val}</strong>
                  <small className={delta.startsWith('+') ? 'good' : 'bad'}>
                    {delta}
                  </small>
                </button>
              ))}
            </div>
          </Panel>
          <Panel
            title="实时告警"
            aside={<span className="alert-count">{highCount} 条高危</span>}
          >
            <div className="alerts">
              {alerts.map((a) => (
                <button
                  key={a.id}
                  className={`${a.level === '高' ? 'high' : 'medium'} ${a.acknowledged ? 'acked' : ''}`}
                  onClick={() => {
                    setDetail(a);
                    setSelected(a.scope);
                  }}
                >
                  <time>{a.time}</time>
                  <span>
                    <strong>{a.scope}</strong>
                    {a.text}
                  </span>
                  <b>{a.acknowledged ? '已确认' : a.level}</b>
                </button>
              ))}
            </div>
          </Panel>
          <Panel
            title="回款与现金流"
            aside={<span className="unit">单位：万元</span>}
          >
            <div className="cash-chart">
              {[42, 49, 45, 53, 51, 58].map((v, i) => (
                <div key={i}>
                  <i style={{ height: `${v + 15}%` }} />
                  <em style={{ height: `${v}%` }} />
                  <span>{i + 3}月</span>
                </div>
              ))}
              <Sparkline values={[20, 28, 22, 36, 30, 42]} color="#54e2bb" />
            </div>
            <div className="cash-key">
              <span>应收</span>
              <span>实收</span>
              <span>经营现金流</span>
            </div>
          </Panel>
        </aside>
      </div>
      {detail && (
        <div className="modal-backdrop">
          <button
            className="modal-close-area"
            aria-label="关闭告警详情"
            onClick={() => setDetail(null)}
          />
          <dialog open className="detail-sheet" aria-labelledby="alert-title">
            <header>
              <div className="detail-icon">
                <AlertTriangle />
              </div>
              <div>
                <span>{detail.level === '高' ? '高危告警' : '业务动态'}</span>
                <h2 id="alert-title">{detail.scope}</h2>
              </div>
              <button
                className="icon-btn"
                aria-label="关闭"
                onClick={() => setDetail(null)}
              >
                <X />
              </button>
            </header>
            <p className="detail-text">{detail.text}</p>
            <dl>
              <div>
                <dt>当前值</dt>
                <dd>{detail.value}</dd>
              </div>
              <div>
                <dt>触发阈值</dt>
                <dd>{detail.threshold}</dd>
              </div>
              <div>
                <dt>首次发生</dt>
                <dd>今日 {detail.time}</dd>
              </div>
              <div>
                <dt>数据来源</dt>
                <dd>运营聚合 · v2481</dd>
              </div>
            </dl>
            <div className="audit">
              <ShieldCheck />
              确认操作将记录操作者及时间，不会自动关闭业务异常。
            </div>
            <button
              className="ack-btn"
              disabled={detail.acknowledged}
              onClick={() => acknowledge(detail.id)}
            >
              {detail.acknowledged ? '已确认知悉' : '确认知悉'}
            </button>
          </dialog>
        </div>
      )}
    </main>
  );
}
