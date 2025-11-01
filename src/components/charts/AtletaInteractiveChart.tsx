import { useResponsive } from '@/hooks/useResponsive';
import { fetchHistoricalEvaluations } from '@/services/relatorioApi';
import { AvaliacaoGeral } from '@/types/RelatorioTypes';
import { platformSelect } from '@/utils/platform';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle as SvgCircle, G as SvgG, Line as SvgLine, Polygon as SvgPolygon, Text as SvgText } from 'react-native-svg';

type Props = {
  atletaId: number;
  highlightedEvaluationId?: number | null;
  onPointPress?: (evaluation: AvaliacaoGeral) => void;
  style?: any;
};

// Small utility: compute average numeric score of an evaluation
const averageScore = (ev: AvaliacaoGeral) => {
  const vals: number[] = [];
  if (ev.relatorioDesempenho) {
    Object.keys(ev.relatorioDesempenho).forEach((k) => {
      const v = (ev.relatorioDesempenho as any)[k];
      if (typeof v === 'number') vals.push(v);
    });
  }
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

const AtletaInteractiveChart: React.FC<Props> = ({ atletaId, highlightedEvaluationId, onPointPress, style }) => {
  const [evaluations, setEvaluations] = useState<AvaliacaoGeral[]>([]);
  const [loading, setLoading] = useState(false);
  // get responsive width/height from app hook so we can adapt SVG sizes
  const { width: respWidth = 1024 } = useResponsive();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const all = await fetchHistoricalEvaluations();
        if (!mounted) return;
        const filtered = all.filter((e) => e.atletaId === atletaId).sort((a, b) => {
          // normalize date formats - API may return dd-MM-yyyy or YYYY-MM-DD
          const pa = parseDate(a.dataAvaliacao);
          const pb = parseDate(b.dataAvaliacao);
          return pa.getTime() - pb.getTime();
        });
        setEvaluations(filtered);
      } catch (err) {
        console.error('Erro ao carregar avaliações do atleta para o gráfico', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [atletaId]);

  const points = useMemo(() => evaluations.map((ev) => ({
    id: ev.id,
    date: parseDate(ev.dataAvaliacao),
    label: format(parseDate(ev.dataAvaliacao), 'dd/MM/yyyy'),
    avg: averageScore(ev),
    raw: ev,
  })), [evaluations]);

  // Prepare metric keys (numeric keys from relatorioDesempenho) for both web and native
  // Keys to exclude from charts (technical ids or meta fields)
  const EXCLUDE_KEYS = ['id', 'gerenciamentoDeGols'];

  // Optional preferred order for metrics on the radar (if present)
  const PREFERRED_ORDER = [
    'controle', 'recepcao','jogoOfensivo', 'manuseioDeBola',  'tiro', 'cruzamento', 'giro', 'passe',
    'forcaChute', 'jogoDefensivo', 'dribles',
  ];

  // Friendly labels for long/technical keys
  const LABELS_MAP: Record<string, string> = {
    
    manuseioDeBola: 'Manuseio de Bola',
    jogoOfensivo: 'Jogo Ofensivo',
    jogoDefensivo: 'Jogo Defensivo',
    forcaChute: 'Força no Chute',
  };

  const humanize = (k: string) => {
    if (LABELS_MAP[k]) return LABELS_MAP[k];
    // split camelCase or snake_case
    return k
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // collect numeric metric keys, excluding technical fields
  let metricKeys: string[] = [];
  evaluations.forEach((ev) => {
    if (ev.relatorioDesempenho) {
      Object.keys(ev.relatorioDesempenho).forEach((k) => {
        const v = (ev.relatorioDesempenho as any)[k];
        if (EXCLUDE_KEYS.includes(k)) return;
        if (typeof v === 'number' && !metricKeys.includes(k)) metricKeys.push(k);
      });
    }
  });

  // apply preferred ordering but keep any additional keys at the end
  metricKeys = PREFERRED_ORDER.filter((k) => metricKeys.includes(k)).concat(metricKeys.filter((k) => !PREFERRED_ORDER.includes(k)));

  // Selected evaluation (used by both web and native)
  const selected = evaluations.find((ev) => ev.id === highlightedEvaluationId) || null;

  // Compute meanSeries and selectedSeries (for radar) at component level so native can reuse
  const meanSeries: Record<string, number> = {};
  metricKeys.forEach((k) => {
    const vals: number[] = [];
    evaluations.forEach((ev) => {
      let v: any = undefined;
      if (ev.relatorioDesempenho && (ev.relatorioDesempenho as any)[k] !== undefined) v = (ev.relatorioDesempenho as any)[k];
      if (typeof v === 'number') vals.push(v);
    });
    meanSeries[k] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  });

  const selectedSeries: Record<string, number> = {};
  if (selected) {
    metricKeys.forEach((k) => {
      let v: any = undefined;
      if (selected.relatorioDesempenho && (selected.relatorioDesempenho as any)[k] !== undefined) v = (selected.relatorioDesempenho as any)[k];
      selectedSeries[k] = typeof v === 'number' ? v : 0;
    });
  }

  // Native tooltip state (simple centered overlay on touch)
  const [nativeTooltip, setNativeTooltip] = useState<{ visible: boolean; title: string; value: string }>({ visible: false, title: '', value: '' });

    // Tooltip state for web (replaces direct DOM manipulations)
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; title: string; value: string }>(
      { visible: false, x: 0, y: 0, title: '', value: '' }
    );

    const showTooltip = (clientX: number, clientY: number, title: string, value: string) => {
      // clamp to viewport a bit
      let x = clientX + 12;
      let y = clientY + 12;
      try {
        const maxX = (window.innerWidth || 1200) - 160;
        const maxY = (window.innerHeight || 800) - 80;
        if (x > maxX) x = maxX;
        if (y > maxY) y = maxY;
      } catch {
        // ignore
      }
      setTooltip({ visible: true, x, y, title, value });
    };

    const hideTooltip = () => setTooltip({ visible: false, x: 0, y: 0, title: '', value: '' });

    // Helper: show tooltip centered on given svg-local coordinates (cx, cy)
    const showCenteredTooltip = (svgRect: ClientRect | DOMRect | null, localCx: number, localCy: number, title: string, value: string) => {
      if (!svgRect) return showTooltip(0, 0, title, value);
      const x = (svgRect as DOMRect).left + localCx;
      const y = (svgRect as DOMRect).top + localCy;
      showTooltip(x, y, title, value);
    };

    const showCenteredFromEvent = (e: any, localCx: number, localCy: number, title: string, value: string) => {
      try {
        const svgEl = (e.currentTarget && (e.currentTarget.ownerSVGElement || e.currentTarget)) as Element;
        const rect = svgEl && (svgEl as Element).getBoundingClientRect();
        showCenteredTooltip(rect || null, localCx, localCy, title, value);
      } catch {
        showTooltip(e.clientX || 0, e.clientY || 0, title, value);
      }
    };

    if (Platform.OS === 'web') {
 
  const MOBILE_MAX = 420; // px breakpoint for phones
  const TABLET_MAX = 1024; // px breakpoint for tablets

  const isMobileView = respWidth <= MOBILE_MAX;
  const isTabletView = respWidth > MOBILE_MAX && respWidth <= TABLET_MAX;

  // Configuration objects (change these values to tune sizes)
  const MOBILE_SVG = { width: 360, height: 340, cxOffset: 0, cyOffset: -5, radiusFactor: 0.20 };
  const TABLET_SVG = { width: 460, height: 360, cxOffset: 10, cyOffset: -8, radiusFactor: 0.28 };
  const DESKTOP_SVG = { width: 520, height: 380, cxOffset: 0, cyOffset: -10, radiusFactor: 0.36 };

  const cfg = isMobileView ? MOBILE_SVG : isTabletView ? TABLET_SVG : DESKTOP_SVG;
  const width = cfg.width;
  const height = cfg.height;
  const cx = width / 2 + cfg.cxOffset;
  const cy = height / 2 + cfg.cyOffset;
  const radius = Math.min(width, height) * cfg.radiusFactor;
    
    // re-use metricKeys and selected computed at component level

    // If no specific metricKeys found, fallback to showing the line chart
    if (metricKeys.length === 0) {
      // reuse earlier line chart rendering
      const padding = 30;
      // normalize to metric range 1-5 (API provides 1..5)
      const maxY = Math.max(5, ...points.map((p) => p.avg));
      const minY = Math.min(0, ...points.map((p) => p.avg));
      const xFor = (i: number) => padding + (i / Math.max(1, points.length - 1)) * (width - padding * 2);
      const yFor = (v: number) => height - padding - ((v - minY) / Math.max(0.001, maxY - minY)) * (height - padding * 2);
      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.avg)}`).join(' ');

      // mouse handler on svg: compute nearest point and show tooltip (works even if circle onMouse doesn't fire)
      const svgLineMouseMove = (e: any) => {
        const el = (e.currentTarget || e.target) as Element;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        let nearest: any = null;
        points.forEach((p, i) => {
          const x = xFor(i);
          const y = yFor(p.avg);
          const dx = x - mx;
          const dy = y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (!nearest || d < nearest.dist) nearest = { p, dist: d };
        });
        if (nearest && nearest.dist < 12) {
          // show tooltip centered in the svg
          showCenteredTooltip(rect, width / 2, height / 2, nearest.p.label, `Média: ${nearest.p.avg}`);
        } else {
          hideTooltip();
        }
      };

      return (
        <View style={[styles.container, style]}>
          <Text style={styles.title}>Evolução - Média numérica</Text>
          <View style={{ alignItems: 'center', justifyContent: 'center' } as any}>
          <svg width={width} height={height} style={{ background: 'transparent', display: 'block' }} onMouseEnter={svgLineMouseMove} onPointerEnter={svgLineMouseMove} onMouseMove={svgLineMouseMove} onPointerMove={svgLineMouseMove} onMouseLeave={hideTooltip} onPointerLeave={hideTooltip} onPointerDown={svgLineMouseMove}>
            {/* grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1={padding} x2={width - padding} y1={padding + t * (height - padding * 2)} y2={padding + t * (height - padding * 2)} stroke="#eee" />
            ))}
            {/* path */}
            <path d={pathD} fill="none" stroke="#1c348e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {/* points */}
            {points.map((p, i) => (
              <g key={p.id}>
                <circle
                  cx={xFor(i)}
                  cy={yFor(p.avg)}
                  r={highlightedEvaluationId === p.id ? 6 : 4}
                  fill={highlightedEvaluationId === p.id ? '#e5c228' : '#1c348e'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPointPress && onPointPress(p.raw)}
                  onPointerDown={() => onPointPress && onPointPress(p.raw)}
                  onMouseEnter={(e: any) => showCenteredFromEvent(e, width / 2, height / 2, p.label, `Média: ${p.avg}`)}
                  onPointerEnter={(e: any) => showCenteredFromEvent(e, width / 2, height / 2, p.label, `Média: ${p.avg}`)}
                  onMouseLeave={hideTooltip}
                  onPointerLeave={hideTooltip}
                />
              </g>
            ))}
          </svg>
          </View>
          {/* tooltip rendered below when visible */}
          <View style={styles.legendRow as any}>
            {points.slice().reverse().map((p) => (
              <TouchableOpacity key={p.id} style={[styles.legendItem, highlightedEvaluationId === p.id && styles.legendItemActive] as any} onPress={() => onPointPress && onPointPress(p.raw)}>
                <Text style={styles.legendText}>{p.label} — {p.avg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // Compute mean series across evaluations for these metricKeys
    const meanSeries: Record<string, number> = {};
    metricKeys.forEach((k) => {
      const vals: number[] = [];
      evaluations.forEach((ev) => {
        let v: any = undefined;
        if (ev.relatorioDesempenho && (ev.relatorioDesempenho as any)[k] !== undefined) v = (ev.relatorioDesempenho as any)[k];
        if (typeof v === 'number') vals.push(v);
      });
      meanSeries[k] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    });

    // Selected series
    const selectedSeries: Record<string, number> = {};
    if (selected) {
      metricKeys.forEach((k) => {
        let v: any = undefined;
        if (selected.relatorioDesempenho && (selected.relatorioDesempenho as any)[k] !== undefined) v = (selected.relatorioDesempenho as any)[k];
        selectedSeries[k] = typeof v === 'number' ? v : 0;
      });
    }

  // Determine maxValue for normalization (metrics are 1..5)
  const maxValue = Math.max(5, ...metricKeys.map((k) => Math.max(meanSeries[k] || 0, selectedSeries[k] || 0)));

    // build points for radar
    const angleStep = (Math.PI * 2) / metricKeys.length;
    const radarPoints = (series: Record<string, number>) => metricKeys.map((k, i) => {
      const v = series[k] || 0;
      const r = (v / maxValue) * radius;
      const angle = -Math.PI / 2 + i * angleStep;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), key: k, value: v };
    });

    const meanPoints = radarPoints(meanSeries);
    const selPoints = radarPoints(selectedSeries);

    const polyFrom = (pts: any[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

    // svg-level mouse move handler for radar: find nearest vertex and show tooltip
    const svgRadarMouseMove = (e: any) => {
      const el = (e.currentTarget || e.target) as Element;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const vertices: any[] = meanPoints.map((p, i) => ({ x: p.x, y: p.y, label: metricKeys[i], value: meanSeries[metricKeys[i]] }));
      if (selected) {
        selPoints.forEach((p: any, i: number) => vertices.push({ x: p.x, y: p.y, label: metricKeys[i], value: selectedSeries[metricKeys[i]] }));
      }
      let nearest: any = null;
      vertices.forEach((v) => {
        const dx = v.x - mx;
        const dy = v.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (!nearest || d < nearest.dist) nearest = { v, dist: d };
      });
      if (nearest && nearest.dist < 14) {
        showCenteredTooltip(rect, cx, cy, humanize(nearest.v.label), `Valor: ${nearest.v.value}`);
      } else {
        hideTooltip();
      }
    };

    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>Gráfico da Avaliação</Text>
  <View style={{ alignItems: 'center', justifyContent: 'center' } as any}>
  <svg width={width} height={height} style={{ background: 'transparent', display: 'block' }} onMouseEnter={svgRadarMouseMove} onPointerEnter={svgRadarMouseMove} onMouseMove={svgRadarMouseMove} onPointerMove={svgRadarMouseMove} onMouseLeave={hideTooltip} onPointerLeave={hideTooltip} onPointerDown={svgRadarMouseMove}>
          {/* concentric rings */}
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <circle key={t} cx={cx} cy={cy} r={radius * t} fill="none" stroke="#7f85888c" />
          ))}
          {/* axis lines and labels */}
          {metricKeys.map((k, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const lx = cx + (radius + 16) * Math.cos(angle);
            const ly = cy + (radius + 16) * Math.sin(angle);
            return (
              <g key={k}>
                <line x1={cx} y1={cy} x2={cx + radius * Math.cos(angle)} y2={cy + radius * Math.sin(angle)} stroke="#7f85888c" />
                <text x={lx} y={ly} fontSize={12} fill="#2c3e50" textAnchor={Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'} dominantBaseline="central">{humanize(k)}</text>
              </g>
            );
          })}

          {/* mean polygon */}
          <polygon points={polyFrom(meanPoints)} fill="#1c348e" fillOpacity={0.08} stroke="#1c348e" strokeWidth={1} />
          {/* selected polygon */}
          {selected && <polygon points={polyFrom(selPoints)} fill="#e5c228" fillOpacity={0.12} stroke="#e5c228" strokeWidth={1.5} />}

          {/* points for selected with hover */}
          {metricKeys.map((k, i) => {
            const mp = meanPoints[i];
            const sp = selPoints[i];
            return (
              <g key={k}>
                <circle
                  cx={mp.x}
                  cy={mp.y}
                  r={3}
                  fill="#1c348e"
                  style={{ cursor: 'default' }}
                  onMouseEnter={(e: any) => showCenteredFromEvent(e, cx, cy, humanize(k), `Média: ${meanSeries[k]}`)}
                  onPointerEnter={(e: any) => showCenteredFromEvent(e, cx, cy, k, `Média: ${meanSeries[k]}`)}
                  onMouseLeave={hideTooltip}
                  onPointerLeave={hideTooltip}
                />
                {selected && (
                  <circle
                    cx={sp.x}
                    cy={sp.y}
                    r={5}
                    fill="#e5c228"
                    style={{ cursor: 'pointer' }}
                      onMouseEnter={(e: any) => showCenteredFromEvent(e, cx, cy, humanize(k), `Valor: ${selectedSeries[k]}`)}
                      onPointerEnter={(e: any) => showCenteredFromEvent(e, cx, cy, humanize(k), `Valor: ${selectedSeries[k]}`)}
                      onMouseLeave={hideTooltip}
                      onPointerLeave={hideTooltip}
                  />
                )}
              </g>
            );
          })}
  </svg>
  </View>
        {tooltip.visible && (
          <div id="aic-tooltip" style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', background: '#111', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, zIndex: 9999, textAlign: 'center' }}>
            <div style={{ fontWeight: 700 }}>{tooltip.title}</div>
            <div>{tooltip.value}</div>
          </div>
        )}

        <View style={{ flexDirection: 'row', marginTop: 8 } as any}>
          <View style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 12, color: '#1c348e' }}>Média histórica</Text>
            <View style={{ width: 12, height: 12, backgroundColor: '#1c348e', marginTop: 4 }} />
          </View>
          {selected && (
            <View>
              <Text style={{ fontSize: 12, color: '#b36f00' }}>Avaliação selecionada</Text>
              <View style={{ width: 12, height: 12, backgroundColor: '#e5c228', marginTop: 4 }} />
            </View>
          )}
        </View>
      </View>
    );
  }

  // Native fallback: horizontal list of cards
  // Native (Expo) renderer: draw radar/line using react-native-svg so visuals match web
    // native sizes (mobile friendly)
    const nWidth = 480;
    const nHeight = 340;
  // center the native svg content exactly in the container
  const nCx = nWidth / 2 ;
  const nCy = nHeight / 2;
    const nRadius = Math.min(nWidth, nHeight) * 0.15;

    const angleStep = (Math.PI * 2) / Math.max(1, metricKeys.length || 1);

    const radarPoints = (series: Record<string, number>) => metricKeys.map((k, i) => {
      const v = series[k] || 0;
      const r = (v / Math.max(5, ...Object.values(series))) * nRadius;
      const angle = -Math.PI / 2 + i * angleStep;
      return { x: nCx + r * Math.cos(angle), y: nCy + r * Math.sin(angle), key: k, value: v };
    });

    const meanPoints = radarPoints(meanSeries);
    const selPoints = radarPoints(selectedSeries);

    const polyFrom = (pts: any[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>Grafico da Avaliação</Text>
        {!metricKeys.length ? (
          // fallback to cards if no metrics
          loading ? <Text>Carregando...</Text> : !points.length ? <Text>Sem avaliações para este atleta.</Text> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              {points.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.card, highlightedEvaluationId === p.id && styles.cardActive]} onPress={() => onPointPress && onPointPress(p.raw)}>
                  <Text style={styles.cardDate}>{p.label}</Text>
                  <Text style={styles.cardValue}>{p.avg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' } as any}>
            <Svg width={nWidth} height={nHeight}>
              {[0.25, 0.5, 0.75, 1].map((t) => (
                <SvgCircle key={`r${t}`} cx={nCx} cy={nCy} r={nRadius * t} fill="none" stroke={ "#bcc3ccff" } />
              ))}

              {metricKeys.map((k, i) => {
                const angle = -Math.PI / 2 + i * angleStep;
                const lx = nCx + (nRadius + 16) * Math.cos(angle);
                const ly = nCy + (nRadius + 16) * Math.sin(angle);
                return (
                  <SvgG key={k}>
                    <SvgLine x1={nCx} y1={nCy} x2={nCx + nRadius * Math.cos(angle)} y2={nCy + nRadius * Math.sin(angle)}   stroke={ "#bcc3ccff" }/>
              <SvgText x={lx} y={ly} fontSize={12} fill="#2c3e50ff" textAnchor={Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'}>{humanize(k)}</SvgText>
                  </SvgG>
                );
              })}

              <SvgPolygon points={polyFrom(meanPoints)} fill="#1c348e" fillOpacity={0.08} stroke="#1c348e" strokeWidth={1} />
              {selected && <SvgPolygon points={polyFrom(selPoints)} fill="#e5c228" fillOpacity={0.12} stroke="#e5c228" strokeWidth={1.5} />}

              {meanPoints.map((p: any, i: number) => (
                <SvgCircle key={`mp${i}`} cx={p.x} cy={p.y} r={3} fill="#1c348e" />
              ))}
                {selected && selPoints.map((p: any, i: number) => (
                <SvgCircle key={`sp${i}`} cx={p.x} cy={p.y} r={5} fill="#e5c228" onPress={() => { setNativeTooltip({ visible: true, title: humanize(metricKeys[i]), value: String(selectedSeries[metricKeys[i]]) }); onPointPress && onPointPress(selected); }} />
              ))}
            </Svg>

            {nativeTooltip.visible && (
              <View style={{ position: 'absolute', top: 8, left: '50%', transform: [{ translateX: -80 }], width: 160, backgroundColor: '#111', padding: 8, borderRadius: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>{nativeTooltip.title}</Text>
                <Text style={{ color: '#fff', textAlign: 'center' }}>{nativeTooltip.value}</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ flexDirection: 'row', marginTop: 8 } as any}>
          <View style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 12, color: '#1c348e' }}>Média histórica</Text>
            <View style={{ width: 12, height: 12, backgroundColor: '#1c348e', marginTop: 4 }} />
          </View>
          {selected && (
            <View>
              <Text style={{ fontSize: 12, color: '#b36f00' }}>Avaliação selecionada</Text>
              <View style={{ width: 12, height: 12, backgroundColor: '#e5c228', marginTop: 4 }} />
            </View>
          )}
        </View>
      </View>
    );
};

// Helpers
function parseDate(raw: string) {
  // Try formats: dd-MM-yyyy then yyyy-MM-dd then ISO
  try {
    const parts = raw.split('-');
    if (parts.length === 3) {
      // detect dd-MM-yyyy if first part length === 2 and >12
      if (parts[0].length === 2) {
        const [d, m, y] = parts;
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
      // else assume yyyy-MM-dd
      const [a, b, c] = parts;
      if (a.length === 4) return new Date(Number(a), Number(b) - 1, Number(c));
    }
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {
    // fallback
  }
  return new Date();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    
    padding: 12,
    marginLeft: -8,
    ...Platform.select({
      web: { minWidth: 400 },
      default: { minWidth: 360, padding: 2 },
    }),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1c348e',
    ...Platform.select({ web: { fontSize: 16 }, default: { fontSize: 14 } }),
  },
  legendRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8 as any,
  },
  legendItem: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  legendItemActive: {
    backgroundColor: '#e5c228',
  },
  legendText: {
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 110,
  },
  cardActive: {
    borderColor: '#e5c228',
    backgroundColor: '#fff9e6',
  },
  cardDate: {
    fontSize: 12,
    color: '#555',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c348e',
  },
});

export default AtletaInteractiveChart;
