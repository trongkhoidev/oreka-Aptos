import React from 'react';
import { Badge, Box, Text, Flex, Icon } from '@chakra-ui/react';
import { FiTarget, FiAward, FiStar } from 'react-icons/fi';

interface RankBadgeProps {
  rank: number;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
  const isTopThree = rank <= 3;
  
  const getBadgeProps = () => {
    switch (rank) {
      case 1:
        return { 
          bg: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', 
          color: 'white', 
          icon: '🥇', 
          label: 'Winner' 
        };
      case 2:
        return { 
          bg: 'linear-gradient(135deg, #C0C0C0 0%, #708090 100%)', 
          color: 'white', 
          icon: '🥈', 
          label: 'Runner up' 
        };
      case 3:
        return { 
          bg: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', 
          color: 'white', 
          icon: '🥉', 
          label: 'Third place' 
        };
      default:
        return { 
          bg: 'whiteAlpha.200', 
          color: 'whiteAlpha.700', 
          icon: undefined, 
          label: undefined 
        };
    }
  };

  const { bg, color, icon, label } = getBadgeProps();

  return (
    <Flex align="center" gap={2}>
      <Badge
        bg={bg}
        color={color}
        px={2}
        py={0.5}
        borderRadius="full"
        fontSize="xs"
        fontWeight="bold"
        boxShadow={isTopThree ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none'}
        textTransform="none"
      >
        {icon && <Box as="span" mr={1}>{icon}</Box>}
        #{rank}
      </Badge>
      {isTopThree && label && (
        <Text fontSize="xs" fontWeight="medium" color="whiteAlpha.600" display={{ base: 'none', sm: 'block' }}>
          {label}
        </Text>
      )}
    </Flex>
  );
};
