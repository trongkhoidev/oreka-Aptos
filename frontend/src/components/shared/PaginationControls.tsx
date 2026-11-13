import React from 'react';
import { Flex, Button, Text, IconButton, HStack } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  isLoading = false 
}) => {
  if (totalPages <= 1) return null;

  return (
    <Flex 
      justify="center" 
      align="center" 
      py={6} 
      borderTopWidth="1px" 
      borderColor="whiteAlpha.100" 
      gap={4}
    >
      <HStack spacing={2}>
        <IconButton
          aria-label="Previous Page"
          icon={<FiChevronLeft />}
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage <= 1 || isLoading}
          variant="outline"
          size="sm"
          colorScheme="whiteAlpha"
        />
        
        <Flex align="center" px={4}>
          <Text fontSize="sm" color="whiteAlpha.700">
            Page <Text as="span" color="white" fontWeight="bold">{currentPage}</Text> of <Text as="span" color="white" fontWeight="bold">{totalPages}</Text>
          </Text>
        </Flex>

        <IconButton
          aria-label="Next Page"
          icon={<FiChevronRight />}
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage >= totalPages || isLoading}
          variant="outline"
          size="sm"
          colorScheme="whiteAlpha"
        />
      </HStack>
    </Flex>
  );
};
