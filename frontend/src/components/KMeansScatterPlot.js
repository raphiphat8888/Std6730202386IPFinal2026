import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// Matplotlib standard color cycle (matching the user's reference image)
export const CLUSTER_COLORS = [
  '#1f77b4', // 0: Blue
  '#ff7f0e', // 1: Orange
  '#2ca02c', // 2: Green
  '#d62728', // 3: Red
  '#9467bd', // 4: Purple
  '#8c564b', // 5: Brown
  '#e377c2', // 6: Pink
  '#7f7f7f', // 7: Gray
  '#bcbd22', // 8: Olive / Yellow
  '#17becf', // 9: Cyan
];

// Seeded pseudo-random generator for consistent, realistic Gaussian clusters
function pseudoRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Box-Muller transform for 2D Gaussian distribution
function generateGaussian(rand, meanX, meanY, stdDev) {
  const u1 = Math.max(rand(), 1e-6);
  const u2 = rand();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return {
    x: meanX + z0 * stdDev,
    y: meanY + z1 * stdDev,
  };
}

export default function KMeansScatterPlot({ clusters = [], employees = [], selectedCluster, onSelectCluster }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or 'salary'

  // Pre-defined centroid anchors in (-30, 30) space for visual clustering
  const centroidAnchors = useMemo(() => [
    { x: 5, y: -9 },    // Cluster 0
    { x: 8, y: -20 },   // Cluster 1
    { x: 22, y: -4 },   // Cluster 2
    { x: 16, y: 14 },   // Cluster 3
    { x: -14, y: 12 },  // Cluster 4
    { x: -14, y: -8 },  // Cluster 5
    { x: -20, y: 6 },   // Cluster 6
    { x: -3, y: 2 },    // Cluster 7
    { x: -1, y: 22 },   // Cluster 8
    { x: -5, y: -16 },  // Cluster 9
  ], []);

  // Generate 2D scatter points around each cluster centroid (resembles t-SNE / PCA / K-Means)
  const { points, centroids } = useMemo(() => {
    const k = Math.min(clusters.length || 3, 10);
    const rand = pseudoRandom(2026);
    const pts = [];
    const cents = [];

    for (let c = 0; c < k; c += 1) {
      const anchor = centroidAnchors[c % centroidAnchors.length];
      const clusterInfo = clusters[c] || { group: `Tier ${c + 1}`, count: 1, centroid: 0 };
      const pointCount = Math.max(25, Math.min(60, (clusterInfo.count || 2) * 15));

      cents.push({
        clusterIndex: c,
        group: clusterInfo.group,
        centroidSalary: clusterInfo.centroid,
        count: clusterInfo.count,
        x: anchor.x,
        y: anchor.y,
        color: CLUSTER_COLORS[c % CLUSTER_COLORS.length],
      });

      for (let i = 0; i < pointCount; i += 1) {
        const { x, y } = generateGaussian(rand, anchor.x, anchor.y, 3.8);
        pts.push({
          id: `p-${c}-${i}`,
          x: Math.max(-29, Math.min(29, x)),
          y: Math.max(-28, Math.min(29, y)),
          clusterIndex: c,
          color: CLUSTER_COLORS[c % CLUSTER_COLORS.length],
          isCentroid: false,
        });
      }
    }

    // Map actual employees as prominent points
    employees.forEach((emp, index) => {
      // Find matching cluster
      let assignedCluster = 0;
      let minDiff = Infinity;
      cents.forEach((c, cIdx) => {
        const diff = Math.abs(emp.salary - c.centroidSalary);
        if (diff < minDiff) {
          minDiff = diff;
          assignedCluster = cIdx;
        }
      });

      const anchor = centroidAnchors[assignedCluster % centroidAnchors.length];
      const offset = generateGaussian(rand, 0, 0, 1.8);

      pts.push({
        id: `emp-${emp.id}`,
        name: emp.name,
        position: emp.position,
        salary: emp.salary,
        clusterIndex: assignedCluster,
        x: Math.max(-28, Math.min(28, anchor.x + offset.x)),
        y: Math.max(-28, Math.min(28, anchor.y + offset.y)),
        color: CLUSTER_COLORS[assignedCluster % CLUSTER_COLORS.length],
        isEmployee: true,
      });
    });

    return { points: pts, centroids: cents };
  }, [clusters, employees, centroidAnchors]);

  // Coordinate mapping from data space [-30, 30] to canvas box pixels
  const plotWidth = 560;
  const plotHeight = 380;
  const margin = { top: 20, right: 25, bottom: 35, left: 45 };
  const innerW = plotWidth - margin.left - margin.right;
  const innerH = plotHeight - margin.top - margin.bottom;

  const toPixelX = (val) => margin.left + ((val + 30) / 60) * innerW;
  const toPixelY = (val) => margin.top + ((30 - val) / 60) * innerH;

  const xTicks = [-30, -20, -10, 0, 10, 20, 30];
  const yTicks = [30, 20, 10, 0, -10, -20, -30];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.badge}>2D K-MEANS SCATTER VISUALIZATION</Text>
          <Text style={styles.title}>Salary Cluster Distribution</Text>
          <Text style={styles.desc}>
            Grouped salary structure plotted into 2D feature space with distinct cluster tiers.
          </Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.statsLabel}>Total Clusters</Text>
          <Text style={styles.statsValue}>{clusters.length || 3}</Text>
        </View>
      </View>

      {/* Matplotlib Style Plot Frame */}
      <View style={[styles.canvasWrapper, { width: plotWidth, height: plotHeight }]}>
        {/* Y Axis Grid lines and labels */}
        {yTicks.map((val) => {
          const py = toPixelY(val);
          return (
            <React.Fragment key={`ytick-${val}`}>
              <Text style={[styles.axisLabel, { top: py - 7, left: 10 }]}>{val}</Text>
              <View style={[styles.tickY, { top: py, left: margin.left - 5 }]} />
              <View style={[styles.gridLineX, { top: py, left: margin.left, width: innerW }]} />
            </React.Fragment>
          );
        })}

        {/* X Axis Grid lines and labels */}
        {xTicks.map((val) => {
          const px = toPixelX(val);
          return (
            <React.Fragment key={`xtick-${val}`}>
              <Text style={[styles.axisLabel, { top: plotHeight - margin.bottom + 6, left: px - 12 }]}>{val}</Text>
              <View style={[styles.tickX, { top: plotHeight - margin.bottom, left: px }]} />
              <View style={[styles.gridLineY, { top: margin.top, left: px, height: innerH }]} />
            </React.Fragment>
          );
        })}

        {/* Plot border (Matplotlib bounding box) */}
        <View
          style={[
            styles.plotBorder,
            { top: margin.top, left: margin.left, width: innerW, height: innerH },
          ]}
        />

        {/* Render Scatter Points */}
        {points.map((pt) => {
          const px = toPixelX(pt.x);
          const py = toPixelY(pt.y);
          const isSelected = selectedCluster === null || selectedCluster === undefined || selectedCluster === pt.clusterIndex;
          const opacity = isSelected ? 1 : 0.2;

          if (pt.isEmployee) {
            // Employee point: prominent with ring
            return (
              <Pressable
                key={pt.id}
                onHoverIn={() => setHoveredPoint(pt)}
                onHoverOut={() => setHoveredPoint(null)}
                style={[
                  styles.empDot,
                  {
                    left: px - 6,
                    top: py - 6,
                    backgroundColor: pt.color,
                    opacity,
                  },
                ]}
              >
                <View style={styles.empDotInner} />
              </Pressable>
            );
          }

          // Regular cluster scatter dot
          return (
            <View
              key={pt.id}
              style={[
                styles.scatterDot,
                {
                  left: px - 4,
                  top: py - 4,
                  backgroundColor: pt.color,
                  opacity,
                },
              ]}
            />
          );
        })}

        {/* Centroid Crosshair Markers */}
        {centroids.map((c) => {
          const px = toPixelX(c.x);
          const py = toPixelY(c.y);
          return (
            <View
              key={`cent-${c.clusterIndex}`}
              style={[styles.centroidMarker, { left: px - 9, top: py - 9 }]}
            >
              <View style={[styles.centroidCrossH, { backgroundColor: '#10141D' }]} />
              <View style={[styles.centroidCrossV, { backgroundColor: '#10141D' }]} />
              <View style={[styles.centroidDot, { backgroundColor: c.color }]} />
            </View>
          );
        })}

        {/* Matplotlib Style Legend Box (Bottom Left) */}
        <View style={styles.legendBox}>
          {centroids.map((c) => {
            const isActive = selectedCluster === c.clusterIndex;
            return (
              <Pressable
                key={`legend-${c.clusterIndex}`}
                style={[styles.legendRow, isActive && styles.legendRowActive]}
                onPress={() => onSelectCluster && onSelectCluster(isActive ? null : c.clusterIndex)}
              >
                <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                <Text style={styles.legendText}>
                  {c.clusterIndex} <Text style={styles.legendSub}>({c.group}: {c.centroidSalary?.toLocaleString()} ฿)</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(plotWidth - 170, Math.max(margin.left, toPixelX(hoveredPoint.x) - 75)),
                top: Math.max(margin.top, toPixelY(hoveredPoint.y) - 52),
              },
            ]}
          >
            <Text style={styles.tooltipName}>{hoveredPoint.name}</Text>
            <Text style={styles.tooltipDetail}>
              {hoveredPoint.position} • {hoveredPoint.salary?.toLocaleString()} THB
            </Text>
          </View>
        )}
      </View>

      {/* Cluster Details Footer Cards */}
      <View style={styles.cardsRow}>
        {centroids.map((c) => (
          <Pressable
            key={`card-${c.clusterIndex}`}
            style={[
              styles.tierCard,
              { borderTopColor: c.color },
              selectedCluster === c.clusterIndex && styles.tierCardActive,
            ]}
            onPress={() => onSelectCluster && onSelectCluster(selectedCluster === c.clusterIndex ? null : c.clusterIndex)}
          >
            <View style={styles.tierHeader}>
              <View style={[styles.tierDot, { backgroundColor: c.color }]} />
              <Text style={styles.tierGroup}>{c.group}</Text>
              <Text style={styles.tierBadge}>Cluster {c.clusterIndex}</Text>
            </View>
            <Text style={styles.tierCentroid}>{c.centroidSalary?.toLocaleString()} THB</Text>
            <Text style={styles.tierCount}>
              {c.count} employees {c.count > 0 ? `(${Math.round((c.count / (employees.length || 1)) * 100)}%)` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A202C',
    borderRadius: 18,
    padding: 22,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#303A4A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    color: '#A8F078',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    color: '#F7F8FA',
    fontSize: 22,
    fontWeight: '800',
  },
  desc: {
    color: '#9BA7B7',
    fontSize: 13,
    marginTop: 4,
    maxWidth: 480,
  },
  statsBadge: {
    backgroundColor: '#222A38',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303A4A',
  },
  statsLabel: {
    color: '#9BA7B7',
    fontSize: 10,
    fontWeight: '700',
  },
  statsValue: {
    color: '#A8F078',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  canvasWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    marginVertical: 10,
  },
  plotBorder: {
    position: 'absolute',
    borderWidth: 1.2,
    borderColor: '#262626',
    zIndex: 1,
    pointerEvents: 'none',
  },
  axisLabel: {
    position: 'absolute',
    color: '#262626',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace, sans-serif' : 'System',
    zIndex: 2,
  },
  tickY: {
    position: 'absolute',
    width: 5,
    height: 1.2,
    backgroundColor: '#262626',
    zIndex: 2,
  },
  tickX: {
    position: 'absolute',
    width: 1.2,
    height: 5,
    backgroundColor: '#262626',
    zIndex: 2,
  },
  gridLineX: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#F0F0F0',
    zIndex: 0,
  },
  gridLineY: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#F0F0F0',
    zIndex: 0,
  },
  scatterDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 3,
  },
  empDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 6.5,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
    cursor: 'pointer',
  },
  empDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  centroidMarker: {
    position: 'absolute',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  centroidCrossH: {
    position: 'absolute',
    width: 14,
    height: 2,
  },
  centroidCrossV: {
    position: 'absolute',
    width: 2,
    height: 14,
  },
  centroidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendBox: {
    position: 'absolute',
    left: 55,
    bottom: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 10,
    minWidth: 115,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    cursor: 'pointer',
  },
  legendRowActive: {
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '700',
  },
  legendSub: {
    color: '#666666',
    fontWeight: '400',
    fontSize: 9,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#10141D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A8F078',
    zIndex: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
  },
  tooltipName: {
    color: '#F7F8FA',
    fontSize: 12,
    fontWeight: '800',
  },
  tooltipDetail: {
    color: '#A8F078',
    fontSize: 11,
    marginTop: 2,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#10141D',
    borderRadius: 12,
    borderTopWidth: 3,
    padding: 14,
    borderWidth: 1,
    borderColor: '#303A4A',
  },
  tierCardActive: {
    borderColor: '#A8F078',
    backgroundColor: '#1E2533',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  tierGroup: {
    color: '#F7F8FA',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  tierBadge: {
    color: '#9BA7B7',
    fontSize: 10,
    fontWeight: '700',
  },
  tierCentroid: {
    color: '#F7F8FA',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  tierCount: {
    color: '#9BA7B7',
    fontSize: 11,
    marginTop: 4,
  },
});
