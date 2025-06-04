import { getThemedChartColors } from './themeUtils';

// Enhanced chart data processing with theme support
export const enhanceChartData = (originalData, chartType = 'bar') => {
  if (!originalData || !originalData.datasets) return originalData;

  const themeColors = getThemedChartColors();
  
  const enhancedDatasets = originalData.datasets.map((dataset, index) => {
    const baseColor = index === 0 ? themeColors.primary : themeColors.gradient[index % themeColors.gradient.length];
    
    if (chartType === 'bar') {
      return {
        ...dataset,
        backgroundColor: Array.isArray(dataset.data) 
          ? dataset.data.map((_, i) => `${baseColor}${Math.floor(0.7 * 255).toString(16).padStart(2, '0')}`)
          : `${baseColor}B3`, // 70% opacity
        borderColor: baseColor,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: Array.isArray(dataset.data)
          ? dataset.data.map((_, i) => `${baseColor}E6`) // 90% opacity on hover
          : `${baseColor}E6`,
        hoverBorderColor: themeColors.primaryDark,
        hoverBorderWidth: 3,
        // Add gradient effect for bars
        gradient: {
          backgroundColor: {
            axis: 'y',
            colors: {
              0: `${baseColor}40`, // 25% opacity at bottom
              100: `${baseColor}B3` // 70% opacity at top
            }
          }
        }
      };
    } else if (chartType === 'line') {
      return {
        ...dataset,
        borderColor: baseColor,
        backgroundColor: `${baseColor}20`, // 12% opacity for fill
        pointBackgroundColor: baseColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: themeColors.primaryDark,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        borderWidth: 3,
        fill: true,
        tension: 0.4, // Smooth curves
        // Add shadow effect
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 8,
        shadowColor: `${baseColor}40`
      };
    }
    
    return dataset;
  });

  return {
    ...originalData,
    datasets: enhancedDatasets
  };
};

// Enhanced chart options with theme support and animations
export const getEnhancedChartOptions = (originalOptions = {}, chartType = 'bar') => {
  const themeColors = getThemedChartColors();
  
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: chartType === 'line' ? 'circle' : 'rect',
          font: {
            size: 12,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
          padding: 20,
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: themeColors.primary,
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
        padding: 16,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif'
        },
        footerFont: {
          size: 11,
          style: 'italic'
        },
        caretPadding: 8,
        caretSize: 6,
        // Custom tooltip styling
        titleMarginBottom: 8,
        bodySpacing: 4,
        footerMarginTop: 8,
        // Add shadow effect
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 12,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        callbacks: {
          title: (context) => {
            if (chartType === 'line' && context[0]?.label) {
              return `Time: ${context[0].label}`;
            }
            return context[0]?.label ? `Zone ${context[0].label}` : '';
          },
          label: (context) => {
            const value = context.parsed.y;
            const label = context.dataset.label || '';
            return `${label}: ${value}`;
          },
          footer: () => {
            return 'Click for detailed view';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)',
          borderColor: 'rgba(156, 163, 175, 0.3)',
          borderWidth: 1,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
          tickLength: 8
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: window.innerWidth < 768 ? 10 : window.innerWidth < 1024 ? 11 : 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: window.innerWidth < 768 ? 6 : 8,
          maxRotation: window.innerWidth < 768 ? 30 : 45,
          minRotation: 0
        },
        title: {
          display: true,
          text: chartType === 'line' ? 'Workshop Departure Time' : 'Zones',
          color: '#374151',
          font: {
            size: window.innerWidth < 768 ? 11 : window.innerWidth < 1024 ? 12 : 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: window.innerWidth < 768 ? 12 : 16
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)',
          borderColor: 'rgba(156, 163, 175, 0.3)',
          borderWidth: 1,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
          tickLength: 8
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: window.innerWidth < 768 ? 10 : window.innerWidth < 1024 ? 11 : 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: window.innerWidth < 768 ? 6 : 8,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        title: {
          display: true,
          text: chartType === 'line' ? 'Zones' : 'Number of Vehicles',
          color: '#374151',
          font: {
            size: window.innerWidth < 768 ? 11 : window.innerWidth < 1024 ? 12 : 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: window.innerWidth < 768 ? 12 : 16
        }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart',
      delay: (context) => {
        return context.type === 'data' && context.mode === 'default' 
          ? context.dataIndex * 50 
          : 0;
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3,
        tension: 0.4
      }
    }
  };

  // Merge with original options
  return mergeDeep(baseOptions, originalOptions);
};

// Deep merge utility function
function mergeDeep(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Chart performance optimizations
export const optimizeChartPerformance = (options) => {
  return {
    ...options,
    animation: {
      ...options.animation,
      // Reduce animations on mobile for better performance
      duration: window.innerWidth < 768 ? 600 : (options.animation?.duration || 1200)
    },
    plugins: {
      ...options.plugins,
      // Optimize tooltip performance
      tooltip: {
        ...options.plugins?.tooltip,
        filter: function(tooltipItem) {
          // Only show tooltip for visible data points
          return tooltipItem.parsed.y !== null && tooltipItem.parsed.y !== undefined;
        }
      }
    },
    // Enable hardware acceleration
    devicePixelRatio: window.devicePixelRatio || 1,
    // Optimize for touch devices
    onHover: window.innerWidth < 768 ? undefined : options.onHover
  };
};

// Generate chart color palette based on data length
export const generateChartPalette = (dataLength, baseTheme = null) => {
  const themeColors = baseTheme || getThemedChartColors();
  const colors = [];
  
  for (let i = 0; i < dataLength; i++) {
    const hue = (i * 137.508) % 360; // Golden angle approximation for good color distribution
    const saturation = 70 + (i % 3) * 10; // Vary saturation slightly
    const lightness = 50 + (i % 2) * 10; // Vary lightness slightly
    
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
};

// Add chart accessibility features
export const addChartAccessibility = (options) => {
  return {
    ...options,
    plugins: {
      ...options.plugins,
      // Add ARIA labels and descriptions
      accessibility: {
        enabled: true,
        description: 'Interactive chart showing vehicle data by zones'
      }
    }
  };
};
