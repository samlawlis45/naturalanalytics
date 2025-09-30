'use client';

import { 
  LineChart, 
  Line,
  BarChart, 
  Bar,
  AreaChart,
  Area,
  PieChart, 
  Pie,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'composed' | 'radial' | 'funnel' | 'heatmap' | 'gauge';
  data: Record<string, unknown>[];
  
  // Basic configuration
  title?: string;
  width?: number | string;
  height?: number | string;
  
  // Data configuration
  xKey?: string;
  yKey?: string;
  yKeys?: string[]; // For multi-series charts
  dataKey?: string; // For pie charts
  nameKey?: string;
  
  // Styling
  colors?: string[];
  theme?: 'default' | 'dark' | 'colorful' | 'minimal' | 'professional';
  
  // Axes
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisAngle?: number;
  yAxisFormat?: string;
  
  // Grid and styling
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  // Chart-specific options
  showDataLabels?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  isAnimationActive?: boolean;
  animationDuration?: number;
  
  // Pie chart specific
  innerRadius?: number;
  outerRadius?: number;
  
  // Gauge specific
  min?: number;
  max?: number;
  value?: number;
}

const THEME_COLORS = {
  default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'],
  dark: ['#8B5CF6', '#06D6A0', '#FFD60A', '#FF006E', '#FB8500', '#219EBC'],
  colorful: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
  minimal: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB'],
  professional: ['#1E40AF', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777']
};

const CustomTooltip = ({ active, payload, label, yAxisFormat }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
  yAxisFormat?: string;
}) => {
  if (active && payload && payload.length) {
    const formatValue = (value: number) => {
      if (yAxisFormat === 'currency') return `$${value.toLocaleString()}`;
      if (yAxisFormat === 'percentage') return `${value}%`;
      if (yAxisFormat === 'number') return value.toLocaleString();
      return value;
    };

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${formatValue(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatAxisValue = (value: string | number, format?: string) => {
  if (typeof value !== 'number') return value;
  
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    case 'number':
      return value.toLocaleString();
    default:
      return value;
  }
};

export const ChartRenderer = ({ config }: { config: ChartConfig }) => {
  const {
    type,
    data,
    width = '100%',
    height = 400,
    xKey = 'name',
    yKey = 'value',
    yKeys = [yKey],
    dataKey = 'value',
    nameKey = 'name',
    colors = THEME_COLORS[config.theme || 'default'],
    showXAxis = true,
    showYAxis = true,
    xAxisLabel,
    yAxisLabel,
    xAxisAngle = 0,
    yAxisFormat,
    showGrid = true,
    showTooltip = true,
    showLegend = true,
    legendPosition = 'top',
    showDataLabels = false,
    strokeWidth = 2,
    fillOpacity = 0.8,
    isAnimationActive = true,
    animationDuration = 750,
    innerRadius = 0,
    outerRadius = 80,
    min = 0,
    max = 100,
    value = 0
  } = config;

  // Ensure data is valid
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const commonProps = {
    width: typeof width === 'string' ? undefined : width,
    height: typeof height === 'string' ? undefined : height,
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {showXAxis && (
              <XAxis 
                dataKey={xKey} 
                angle={xAxisAngle}
                textAnchor={xAxisAngle !== 0 ? "end" : "middle"}
                height={xAxisAngle !== 0 ? 60 : 30}
                tickFormatter={(value) => formatAxisValue(value, 'string')}
              />
            )}
            {showYAxis && (
              <YAxis 
                tickFormatter={(value) => formatAxisValue(value, yAxisFormat)}
              />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip yAxisFormat={yAxisFormat} />} />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={isAnimationActive}
                animationDuration={animationDuration}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {showXAxis && (
              <XAxis 
                dataKey={xKey} 
                angle={xAxisAngle}
                textAnchor={xAxisAngle !== 0 ? "end" : "middle"}
                height={xAxisAngle !== 0 ? 60 : 30}
              />
            )}
            {showYAxis && (
              <YAxis tickFormatter={(value) => formatAxisValue(value, yAxisFormat)} />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip yAxisFormat={yAxisFormat} />} />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                fillOpacity={fillOpacity}
                isAnimationActive={isAnimationActive}
                animationDuration={animationDuration}
              >
                {showDataLabels && <LabelList dataKey={key} position="top" />}
              </Bar>
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {showXAxis && <XAxis dataKey={xKey} />}
            {showYAxis && (
              <YAxis tickFormatter={(value) => formatAxisValue(value, yAxisFormat)} />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip yAxisFormat={yAxisFormat} />} />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
                isAnimationActive={isAnimationActive}
                animationDuration={animationDuration}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey={dataKey}
              nameKey={nameKey}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              {showDataLabels && <LabelList dataKey={dataKey} position="center" />}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {showXAxis && <XAxis dataKey={xKey} />}
            {showYAxis && (
              <YAxis tickFormatter={(value) => formatAxisValue(value, yAxisFormat)} />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip yAxisFormat={yAxisFormat} />} />}
            {showLegend && <Legend />}
            <Scatter
              dataKey={yKey}
              fill={colors[0]}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
          </ScatterChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            {showXAxis && <XAxis dataKey={xKey} />}
            {showYAxis && (
              <YAxis tickFormatter={(value) => formatAxisValue(value, yAxisFormat)} />
            )}
            {showTooltip && <Tooltip content={<CustomTooltip yAxisFormat={yAxisFormat} />} />}
            {showLegend && <Legend />}
            <Bar dataKey={yKeys[0]} fill={colors[0]} fillOpacity={fillOpacity} />
            {yKeys.length > 1 && (
              <Line
                type="monotone"
                dataKey={yKeys[1]}
                stroke={colors[1]}
                strokeWidth={strokeWidth}
              />
            )}
          </ComposedChart>
        );

      case 'radial':
        return (
          <RadialBarChart
            {...commonProps}
            cx="50%"
            cy="50%"
            innerRadius="10%"
            outerRadius="80%"
          >
            <RadialBar
              dataKey={dataKey}
              cornerRadius={10}
              fill={colors[0]}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </RadialBarChart>
        );

      case 'funnel':
        return (
          <FunnelChart {...commonProps}>
            <Funnel
              dataKey={dataKey}
              data={data}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              {showDataLabels && <LabelList position="center" />}
            </Funnel>
            {showTooltip && <Tooltip />}
          </FunnelChart>
        );

      case 'gauge':
        const gaugeData = [{ name: 'value', value, fill: colors[0] }];
        const percentage = ((value - min) / (max - min)) * 100;
        
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'value', value: percentage, fill: colors[0] },
                    { name: 'empty', value: 100 - percentage, fill: '#f0f0f0' }
                  ]}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  isAnimationActive={isAnimationActive}
                  animationDuration={animationDuration}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: colors[0] }}>
                {formatAxisValue(value, yAxisFormat)}
              </div>
              <div className="text-sm text-gray-500">
                {min} - {max}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {config.title && (
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
          {config.title}
        </h3>
      )}
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};