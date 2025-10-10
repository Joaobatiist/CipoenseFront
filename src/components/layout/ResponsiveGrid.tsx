import { SPACING } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    largeDesktop?: number;
  };
  gap?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, largeDesktop: 4 },
  gap = SPACING.md,
  style,
}) => {
  const { deviceType } = useResponsive();

  const getColumns = () => {
    return columns[deviceType] || columns.desktop || columns.tablet || columns.mobile || 1;
  };

  const columnCount = getColumns();
  const childrenArray = React.Children.toArray(children);

  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < childrenArray.length; i += columnCount) {
      const rowChildren = childrenArray.slice(i, i + columnCount);
      rows.push(
        <View key={i} style={[styles.row, { marginBottom: gap }]}>
          {rowChildren.map((child, index) => (
            <View
              key={index}
              style={[
                styles.column,
                {
                  flex: 1,
                  marginRight: index < rowChildren.length - 1 ? gap : 0,
                },
              ]}
            >
              {child}
            </View>
          ))}
          {/* Preencher espaços vazios se necessário */}
          {rowChildren.length < columnCount &&
            Array.from({ length: columnCount - rowChildren.length }).map((_, index) => (
              <View key={`empty-${index}`} style={{ flex: 1, marginRight: index < columnCount - rowChildren.length - 1 ? gap : 0 }} />
            ))
          }
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={[styles.container, style]}>
      {renderRows()}
    </View>
  );
};

const styles = {
  container: {
    width: '100%',
  } as ViewStyle,
  row: {
    flexDirection: 'row' as const,
    width: '100%' as const,
  } as ViewStyle,
  column: {
    flexDirection: 'column' as const,
  } as ViewStyle,
};