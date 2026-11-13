import React from 'react';
import { Box, Flex, Text, Icon, VStack, SkeletonText, Tooltip } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  subtitle?: string | React.ReactNode;
  isLoading?: boolean;
  tooltip?: string;
  variant?: 'normal' | 'gradient';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  subtitle, 
  isLoading = false,
  tooltip,
  variant = 'normal'
}) => {
  const isGradient = variant === 'gradient';

  return (
    <Box
      p={6}
      borderRadius="xl"
      bg="rgba(15, 23, 42, 0.4)"
      borderWidth="1px"
      borderColor={isGradient ? 'blue.400' : 'whiteAlpha.100'}
      backdropFilter="blur(12px)"
      boxShadow={isGradient ? '0 0 20px rgba(59, 130, 246, 0.2)' : 'none'}
      transition="all 0.2s"
      _hover={{ borderColor: isGradient ? 'blue.300' : 'whiteAlpha.300', transform: 'translateY(-2px)' }}
      pos="relative"
      overflow="hidden"
    >
      {isGradient && (
        <Box 
          pos="absolute" 
          top="-50%" 
          left="-50%" 
          w="200%" 
          h="200%" 
          bg="radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 50%)" 
          zIndex={0}
          pointerEvents="none"
        />
      )}
      
      <Flex justify="space-between" align="start" pos="relative" zIndex={1}>
        <VStack align="start" spacing={1}>
          <Flex align="center" gap={1}>
            <Text fontSize="xs" fontWeight="semibold" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="wider">
              {label}
            </Text>
            {tooltip && (
              <Tooltip label={tooltip}>
                <Box as="span" cursor="help">
                  <Icon as={FiInfo} boxSize={3} color="whiteAlpha.400" />
                </Box>
              </Tooltip>
            )}
          </Flex>
          
          {isLoading ? (
            <SkeletonText noOfLines={1} skeletonHeight="6" width="100px" mt={1} />
          ) : (
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color="white"
              lineHeight="shorter"
            >
              {value}
            </Text>
          )}

          {subtitle && !isLoading && (
            <Box mt={1}>
              {typeof subtitle === 'string' ? (
                <Text fontSize="xs" color="whiteAlpha.500">
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )}
            </Box>
          )}
        </VStack>
        
        <Box 
          p={2.5} 
          borderRadius="lg" 
          bg={isGradient ? 'blue.500' : 'whiteAlpha.100'} 
          color={isGradient ? 'white' : 'whiteAlpha.700'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="inner"
        >
          <Icon as={icon} boxSize={5} />
        </Box>
      </Flex>
    </Box>
  );
};
