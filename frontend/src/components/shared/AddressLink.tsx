import React from 'react';
import { Flex, Text, Tooltip, IconButton, Link, useClipboard } from '@chakra-ui/react';
import { FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';
import NextLink from 'next/link';

interface AddressLinkProps {
  address: string;
  isTruncated?: boolean;
  showIcon?: boolean;
  showCopy?: boolean;
  fontWeight?: string;
  fontSize?: string;
}

export const AddressLink: React.FC<AddressLinkProps> = ({ 
  address, 
  isTruncated = true, 
  showIcon = true, 
  showCopy = true,
  fontWeight = 'medium',
  fontSize = 'sm'
}) => {
  const { hasCopied, onCopy } = useClipboard(address);

  const truncatedAddress = isTruncated 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : address;

  return (
    <Flex align="center" gap={1}>
      <Tooltip label={address}>
        <NextLink href={`/profiles/${address}`} passHref legacyBehavior>
          <Link 
            _hover={{ textDecoration: 'none', color: 'blue.400' }}
            fontWeight={fontWeight}
            fontSize={fontSize}
            color="blue.300"
            display="flex"
            alignItems="center"
          >
            {truncatedAddress}
            {showIcon && <IconButton variant="ghost" icon={<FiExternalLink />} aria-label="View Profile" size="xs" ml={0.5} color="whiteAlpha.400" _hover={{ bg: 'transparent', color: 'white' }} />}
          </Link>
        </NextLink>
      </Tooltip>
      
      {showCopy && (
        <Tooltip label={hasCopied ? 'Copied!' : 'Copy Address'}>
          <IconButton 
            aria-label="Copy Address"
            icon={hasCopied ? <FiCheck /> : <FiCopy />}
            size="xs"
            variant="ghost"
            onClick={onCopy}
            color={hasCopied ? 'green.400' : 'whiteAlpha.600'}
            _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
          />
        </Tooltip>
      )}
    </Flex>
  );
};
