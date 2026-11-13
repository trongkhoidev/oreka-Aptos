import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Spinner, 
  Center,
  Container,
  Heading,
  Icon,
  Tabs,
  TabList,
  Tab,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Flex,
  Avatar,
  ButtonGroup,
  Button,
  SimpleGrid 
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiActivity, 
  FiUsers, 
  FiPieChart, 
  FiClock
} from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import { leaderboardService, LeaderboardEntry } from '../src/services/leaderboardService';
import { RankBadge } from '../src/components/shared/RankBadge';
import { AddressLink } from '../src/components/shared/AddressLink';
import { PnlIndicator } from '../src/components/shared/PnlIndicator';

export default function LeaderboardsPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('alltime');
  const [category, setCategory] = useState(0); // 0: Profit, 1: Volume, 2: Participants, 3: Pools
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const toast = useToast();

  const categories = [
    { name: 'Most Profitable', icon: FiTrendingUp },
    { name: 'Highest Volume', icon: FiActivity },
    { name: 'Top Creators (Users)', icon: FiUsers },
    { name: 'Largest Pools', icon: FiPieChart },
  ];

  const timeRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'All Time', value: 'alltime' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [range, category]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      let res;
      switch (category) {
        case 0: res = await leaderboardService.getProfitable(range); break;
        case 1: res = await leaderboardService.getVolume(range); break;
        case 2: res = await leaderboardService.getOwnerParticipants(range); break;
        case 3: res = await leaderboardService.getOwnerPools(range); break;
        default: res = await leaderboardService.getProfitable(range);
      }
      setEntries(res.entries);
      setLastUpdated(res.last_updated);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      toast({
        title: 'Error loading leaderboard',
        description: 'Failed to fetch ranking data.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <Box minH="100vh" bg="#020617" pt="100px" pb={20}>
      <Container maxW="container.xl">
        {/* Header Section */}
        <Flex justify="space-between" align="end" mb={10} direction={{ base: 'column', md: 'row' }} gap={6}>
          <VStack align="start" spacing={2}>
            <HStack color="yellow.400">
              <Icon as={FaTrophy} boxSize={8} />
              <Heading size="xl" color="white" letterSpacing="tight">Global Leaderboard</Heading>
            </HStack>
            <Text color="whiteAlpha.600" fontSize="md">The top performers and market creators in the OREKA ecosystem.</Text>
          </VStack>

          <VStack align={{ base: 'start', md: 'end' }} spacing={3}>
            <HStack color="whiteAlpha.400" fontSize="xs" fontWeight="bold">
              <Icon as={FiClock} />
              <Text>LAST UPDATED: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '---'}</Text>
            </HStack>
            <ButtonGroup size="sm" isAttached variant="outline" colorScheme="whiteAlpha">
              {timeRanges.map((r) => (
                <Button 
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  isActive={range === r.value}
                  _active={{ bg: 'blue.600', color: 'white', borderColor: 'blue.600' }}
                  color="whiteAlpha.700"
                >
                  {r.label}
                </Button>
              ))}
            </ButtonGroup>
          </VStack>
        </Flex>

        {/* Top 3 Podium Recognition */}
        {!isLoading && topThree.length > 0 && (
          <Box mb={20} pos="relative">
            <SimpleGrid 
              columns={{ base: 1, md: 3 }} 
              spacing={{ base: 8, md: 0 }} 
              alignItems="flex-end"
              maxW="900px"
              mx="auto"
              pt={10}
            >
              {/* Rank 2 - Silver */}
              {topThree[1] && (
                <Box 
                  as={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  order={{ base: 2, md: 1 }}
                  px={4}
                >
                  <VStack spacing={4} pb={4}>
                    <Box pos="relative">
                      <Avatar 
                        size="xl" 
                        name={topThree[1].user_addr || topThree[1].owner_addr} 
                        border="3px solid" 
                        borderColor="slate.400"
                        boxShadow="0 0 20px rgba(148, 163, 184, 0.2)"
                      />
                      <Box 
                        pos="absolute" 
                        bottom={-2} 
                        right={-2} 
                        bg="linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" 
                        w={8} h={8} 
                        borderRadius="full" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        fontWeight="black" 
                        color="white" 
                        boxShadow="lg"
                        border="2px solid #1e293b"
                      >2</Box>
                    </Box>
                    <VStack spacing={0}>
                      <AddressLink address={(topThree[1].user_addr || topThree[1].owner_addr)!} fontWeight="bold" />
                      <Text color="whiteAlpha.500" fontSize="xs" textTransform="uppercase" letterSpacing="widest">Runner Up</Text>
                    </VStack>
                  </VStack>
                  <Box 
                    h="160px" 
                    bg="linear-gradient(to top, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.4))"
                    borderTopRadius="xl"
                    borderWidth="1px"
                    borderBottomWidth="0"
                    borderColor="whiteAlpha.100"
                    backdropFilter="blur(10px)"
                    p={6}
                    textAlign="center"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    boxShadow="0 -10px 30px rgba(0,0,0,0.3)"
                  >
                    <Text color="slate.300" fontSize="sm" fontWeight="bold" mb={1}>
                      {category === 0 ? 'PnL' : category === 1 ? 'Volume' : category === 2 ? 'Users' : 'Pools'}
                    </Text>
                    <Text color="white" fontSize="2xl" fontWeight="black">
                      {category === 0 ? `$${topThree[1].pnl?.human}` : category === 1 ? `$${topThree[1].volume?.human}` : category === 2 ? topThree[1].total_participants : `$${topThree[1].total_pool?.human}`}
                    </Text>
                  </Box>
                </Box>
              )}

              {/* Rank 1 - Gold */}
              {topThree[0] && (
                <Box 
                  as={motion.div}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  order={{ base: 1, md: 2 }}
                  px={4}
                  pos="relative"
                  zIndex={2}
                >
                  <Box 
                    pos="absolute" 
                    top="-40px" 
                    left="50%" 
                    transform="translateX(-50%)" 
                    color="yellow.400"
                    filter="drop-shadow(0 0 10px rgba(234, 179, 8, 0.4))"
                  >
                    <Icon as={FaTrophy} boxSize={10} />
                  </Box>
                  
                  <VStack spacing={4} pb={4}>
                    <Box pos="relative">
                      <Avatar 
                        size="2xl" 
                        name={topThree[0].user_addr || topThree[0].owner_addr} 
                        border="4px solid" 
                        borderColor="yellow.500"
                        boxShadow="0 0 30px rgba(234, 179, 8, 0.3)"
                      />
                      <Box 
                        pos="absolute" 
                        bottom={0} 
                        right={0} 
                        bg="linear-gradient(135deg, #eab308 0%, #ca8a04 100%)" 
                        w={12} h={12} 
                        borderRadius="full" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        fontWeight="black" 
                        color="white" 
                        boxShadow="xl"
                        fontSize="xl"
                        border="3px solid #1e293b"
                      >1</Box>
                    </Box>
                    <VStack spacing={1}>
                      <AddressLink address={(topThree[0].user_addr || topThree[0].owner_addr)!} fontSize="lg" fontWeight="black" color="yellow.400" />
                      <Badge colorScheme="yellow" variant="solid" px={3} py={0.5} borderRadius="full" fontSize="xs" boxShadow="0 2px 10px rgba(234, 179, 8, 0.2)">LEGENDARY</Badge>
                    </VStack>
                  </VStack>
                  <Box 
                    h="240px" 
                    bg="linear-gradient(to top, rgba(234, 179, 8, 0.15), rgba(30, 41, 59, 0.6))"
                    borderTopRadius="2xl"
                    borderWidth="2px"
                    borderBottomWidth="0"
                    borderColor="yellow.500/30"
                    backdropFilter="blur(15px)"
                    p={8}
                    textAlign="center"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    boxShadow="0 -15px 40px rgba(234, 179, 8, 0.1)"
                    overflow="hidden"
                  >
                    <Box 
                      pos="absolute" 
                      top={0} left={0} right={0} h="100%" 
                      bg="linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.05) 50%, transparent 55%)"
                      backgroundSize="200% 200%"
                      as={motion.div}
                      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <Text color="yellow.200" fontSize="sm" fontWeight="bold" mb={2} textTransform="uppercase" letterSpacing="wider">
                      {category === 0 ? 'Net Profit' : category === 1 ? 'Total Volume' : category === 2 ? 'Total Users' : 'Pool Liquidity'}
                    </Text>
                    <Text color="white" fontSize="4xl" fontWeight="900" lineHeight="1">
                       {category === 0 ? `$${topThree[0].pnl?.human}` : category === 1 ? `$${topThree[0].volume?.human}` : category === 2 ? topThree[0].total_participants : `$${topThree[0].total_pool?.human}`}
                    </Text>
                  </Box>
                </Box>
              )}

              {/* Rank 3 - Bronze */}
              {topThree[2] && (
                <Box 
                  as={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  order={{ base: 3, md: 3 }}
                  px={4}
                >
                  <VStack spacing={4} pb={4}>
                    <Box pos="relative">
                      <Avatar 
                        size="xl" 
                        name={topThree[2].user_addr || topThree[2].owner_addr} 
                        border="3px solid" 
                        borderColor="orange.700"
                        boxShadow="0 0 20px rgba(194, 65, 12, 0.2)"
                      />
                      <Box 
                        pos="absolute" 
                        bottom={-2} 
                        right={-2} 
                        bg="linear-gradient(135deg, #c2410c 0%, #9a3412 100%)" 
                        w={8} h={8} 
                        borderRadius="full" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        fontWeight="black" 
                        color="white" 
                        boxShadow="lg"
                        border="2px solid #1e293b"
                      >3</Box>
                    </Box>
                    <VStack spacing={0}>
                      <AddressLink address={(topThree[2].user_addr || topThree[2].owner_addr)!} fontWeight="bold" />
                      <Text color="whiteAlpha.500" fontSize="xs" textTransform="uppercase" letterSpacing="widest">3rd Place</Text>
                    </VStack>
                  </VStack>
                  <Box 
                    h="120px" 
                    bg="linear-gradient(to top, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.4))"
                    borderTopRadius="xl"
                    borderWidth="1px"
                    borderBottomWidth="0"
                    borderColor="whiteAlpha.100"
                    backdropFilter="blur(10px)"
                    p={6}
                    textAlign="center"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    boxShadow="0 -5px 20px rgba(0,0,0,0.2)"
                  >
                    <Text color="orange.200" fontSize="xs" fontWeight="bold" mb={1}>
                      {category === 0 ? 'PnL' : category === 1 ? 'Volume' : category === 2 ? 'Users' : 'Pools'}
                    </Text>
                    <Text color="white" fontSize="xl" fontWeight="black">
                      {category === 0 ? `$${topThree[2].pnl?.human}` : category === 1 ? `$${topThree[2].volume?.human}` : category === 2 ? topThree[2].total_participants : `$${topThree[2].total_pool?.human}`}
                    </Text>
                  </Box>
                </Box>
              )}
            </SimpleGrid>
            
            {/* Podium Base Line */}
            <Box h="2px" bg="whiteAlpha.100" maxW="900px" mx="auto" mt={0} />
          </Box>
        )}

        {/* Category Tabs & Table */}
        <Box 
          bg="rgba(30, 41, 59, 0.2)" 
          borderRadius="3xl" 
          borderWidth="1px" 
          borderColor="whiteAlpha.100"
          overflow="hidden"
          backdropFilter="blur(10px)"
        >
          <Tabs isFitted variant="unstyled" index={category} onChange={setCategory}>
            <TabList bg="whiteAlpha.50" p={2} borderBottomWidth="1px" borderColor="whiteAlpha.100">
              {categories.map((cat, idx) => (
                <Tab 
                  key={idx}
                  py={4}
                  borderRadius="2xl"
                  _selected={{ bg: 'blue.600', color: 'white', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)' }}
                  color="whiteAlpha.600"
                  fontWeight="bold"
                  transition="all 0.3s"
                >
                  <HStack spacing={2}>
                    <Icon as={cat.icon} />
                    <Text fontSize={{ base: 'xs', md: 'sm' }}>{cat.name}</Text>
                  </HStack>
                </Tab>
              ))}
            </TabList>

            <Box p={6}>
              {isLoading ? (
                <Center py={20}>
                  <Spinner size="xl" color="blue.500" thickness="4px" />
                </Center>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr borderBottomWidth="2px" borderColor="whiteAlpha.100">
                      <Th color="whiteAlpha.400" py={6}>RANK</Th>
                      <Th color="whiteAlpha.400" py={6}>TRADER / OWNER</Th>
                      <Th color="whiteAlpha.400" py={6} isNumeric>
                        {category === 0 ? 'PNL' : category === 1 ? 'TOTAL VOLUME' : category === 2 ? 'PARTICIPANTS' : 'POOL VOLUME'}
                      </Th>
                      <Th color="whiteAlpha.400" py={6} isNumeric>
                        {category < 2 ? 'TRADES' : 'MARKETS'}
                      </Th>
                      <Th color="whiteAlpha.400" py={6} isNumeric>
                        {category === 0 ? 'WIN RATE' : category === 1 ? 'PNL' : 'FEES EARNED'}
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {entries.map((entry) => (
                      <Tr 
                        key={entry.user_addr || entry.owner_addr}
                        _hover={{ bg: 'whiteAlpha.50' }}
                        transition="all 0.2s"
                        borderBottomWidth="1px"
                        borderColor="whiteAlpha.50"
                      >
                        <Td py={5}>
                          <RankBadge rank={entry.rank} />
                        </Td>
                        <Td py={5}>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={entry.user_addr || entry.owner_addr} />
                            <AddressLink address={(entry.user_addr || entry.owner_addr)!} fontWeight="bold" />
                          </HStack>
                        </Td>
                        <Td py={5} isNumeric>
                          <Text color="white" fontWeight="black" fontSize="lg">
                            {category === 0 ? `$${entry.pnl?.human}` : category === 1 ? `$${entry.volume?.human}` : category === 2 ? entry.total_participants : `$${entry.total_pool?.human}`}
                          </Text>
                        </Td>
                        <Td py={5} isNumeric>
                          <Text color="whiteAlpha.700" fontWeight="medium">
                             {category < 2 ? entry.markets_played : entry.markets_created}
                          </Text>
                        </Td>
                        <Td py={5} isNumeric>
                          {category === 0 ? (
                            <Text color="white" fontWeight="bold">
                              {entry.win_rate !== undefined ? `${Number(entry.win_rate).toFixed(1)}%` : '--'}
                            </Text>
                          ) : category === 1 ? (
                            entry.pnl ? <PnlIndicator value={entry.pnl.human} prefix="$" showIcon={true} /> : <Text color="whiteAlpha.500">--</Text>
                          ) : (
                            <Text color="green.400" fontWeight="bold">+${entry.fee_earned?.human || '0.00'}</Text>
                          )}
                        </Td>
                      </Tr>
                    ))}
                    {entries.length === 0 && (
                      <Tr>
                        <Td colSpan={5} py={20} textAlign="center">
                          <Text color="whiteAlpha.400" fontWeight="bold">No data available for this range</Text>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              )}
            </Box>
          </Tabs>
        </Box>
      </Container>
    </Box>
  );
}
