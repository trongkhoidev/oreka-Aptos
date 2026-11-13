import React from 'react';
import { Badge, Flex, Text, Icon } from '@chakra-ui/react';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

interface PnlIndicatorProps {
  value: string | number;
  showIcon?: boolean;
  fontSize?: string;
  prefix?: string;
}

export const PnlIndicator: React.FC<PnlIndicatorProps> = ({ 
  value, 
  showIcon = true, 
  fontSize = 'sm',
  prefix = ''
}) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPositive = numValue > 0;
  const isNegative = numValue < 0;
  
  const color = isPositive ? 'green.400' : isNegative ? 'red.400' : 'gray.400';
  const displayValue = Math.abs(numValue).toFixed(2);
  const sign = isPositive ? '+' : isNegative ? '-' : '';

  return (
    <Flex align="center" gap={1}>
      {showIcon && (
        <Icon 
          as={isPositive ? FiArrowUpRight : isNegative ? FiArrowDownRight : undefined} 
          color={color}
          boxSize={4}
        />
      )}
      <Text fontWeight="bold" color={color} fontSize={fontSize}>
        {sign}{prefix}{displayValue}
      </Text>
    </Flex>
  );
};
