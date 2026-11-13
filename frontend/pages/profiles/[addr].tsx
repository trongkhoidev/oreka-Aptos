import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Spinner, 
  Center,
  Grid,
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
  Select,
  Flex
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiTrendingUp, 
  FiAward, 
  FiActivity, 
  FiStar, 
  FiPieChart, 
  FiCalendar, 
  FiDollarSign,
  FiZap
} from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import { profileService, ProfileStats, BetHistoryEntry } from '../../src/services/profileService';
import { StatCard } from '../../src/components/shared/StatCard';
import { PnlIndicator } from '../../src/components/shared/PnlIndicator';
import { AddressLink } from '../../src/components/shared/AddressLink';
import { PaginationControls } from '../../src/components/shared/PaginationControls';

export default function ProfilePage() {
  const router = useRouter();
  const { addr } = router.query;
  const address = addr as string;
  const toast = useToast();
  
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [history, setHistory] = useState<BetHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyStatus, setHistoryStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyCount, setHistoryCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthlyData, setMonthlyData] = useState<ProfileStats['monthly'] | null>(null);

  // Helper to get last 6 months
  const getRecentMonths = () => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push({ label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), value: ym });
    }
    return months;
  };

  const recentMonths = getRecentMonths();

  useEffect(() => {
    if (!address) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await profileService.getProfile(address.toLowerCase());
        setProfile(data);
        setMonthlyData(data.monthly);
        setSelectedMonth(data.monthly.ym);
        
        // Initial history load
        await loadHistory(1, 'all');
      } catch (err) {
        console.error('Error loading profile:', err);
        toast({
          title: 'Error loading profile',
          description: 'Could not fetch profile data from the server.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [address]);

  const handleMonthChange = async (ym: string) => {
    if (!address) return;
    try {
        setSelectedMonth(ym);
        const data = await profileService.getMonthly(address.toLowerCase(), ym);
        setMonthlyData(data);
    } catch (err) {
        console.error('Error loading monthly data:', err);
    }
  };

  const loadHistory = async (page: number, status: string) => {
    if (!address) return;
    try {
      setIsLoadingHistory(true);
      const limit = 10;
      const res = await profileService.getHistory(address.toLowerCase(), page, limit, status);
      setHistory(res.history);
      setHistoryCount(res.count);
      setTotalPages(Math.ceil(res.count / limit) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setHistoryStatus(status);
    loadHistory(1, status);
  };

  const handlePageChange = (page: number) => {
    loadHistory(page, historyStatus);
  };

  if (isLoading || !profile) {
    return (
      <Box minH="100vh" bg="#020617" pt="100px">
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color="whiteAlpha.600" fontWeight="medium">Loading trader profile...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#020617" pt="100px" pb={20}>
      <Container maxW="container.xl">
        {/* Header Section */}
        <Box 
          mb={10} 
          p={8} 
          borderRadius="2xl" 
          bg="rgba(30, 41, 59, 0.4)" 
          borderWidth="1px" 
          borderColor="whiteAlpha.100"
          backdropFilter="blur(20px)"
        >
          <Grid templateColumns={{ base: "1fr", md: "auto 1fr auto" }} gap={8} alignItems="center">
            <Box 
              w={24} 
              h={24} 
              bgGradient="linear(to-br, blue.600, purple.700)" 
              borderRadius="2xl" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              boxShadow="0 10px 30px rgba(37, 99, 235, 0.3)"
            >
              <Text color="white" fontSize="3xl" fontWeight="black">
                {profile.user_addr.slice(2, 4).toUpperCase()}
              </Text>
            </Box>

            <VStack align="start" spacing={2}>
              <HStack>
                <Heading size="lg" color="white" letterSpacing="tight">Trader Profile</Heading>
                <Badge colorScheme="blue" variant="solid" borderRadius="full" px={3} py={0.5}>
                  Level {profile.metadata.level}
                </Badge>
              </HStack>
              <AddressLink 
                address={profile.user_addr} 
                isTruncated={false} 
                fontSize="md" 
                fontWeight="bold"
              />
              <HStack spacing={4} mt={2}>
                <HStack color="whiteAlpha.500">
                  <Icon as={FiCalendar} />
                  <Text fontSize="xs">Joined {new Date(profile.metadata.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
                </HStack>
                <HStack color="whiteAlpha.500">
                  <Icon as={FiStar} />
                  <Text fontSize="xs">{profile.metadata.rank_label}</Text>
                </HStack>
              </HStack>
            </VStack>

            <Box>
              <VStack align={{ base: "start", md: "end" }} spacing={1}>
                <Text color="whiteAlpha.600" fontSize="xs" fontWeight="bold" textTransform="uppercase">Total Net Profit</Text>
                <PnlIndicator value={profile.totals.pnl.human} fontSize="3xl" prefix="$" />
                <Text color="whiteAlpha.400" fontSize="xs">All-time trading performance</Text>
              </VStack>
            </Box>
          </Grid>
        </Box>

        {/* Global Stats Grid */}
        <Grid templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }} gap={6} mb={10}>
          <StatCard 
            label="Win Rate" 
            value={`${profile.totals.win_rate}%`} 
            icon={FaTrophy} 
            subtitle={<PnlIndicator value={profile.totals.roi} showIcon={false} prefix="ROI: " fontSize="xs" />}
            variant="gradient"
          />
          <StatCard 
            label="Volume" 
            value={`$${profile.totals.bet.human}`} 
            icon={FiActivity} 
            subtitle={`${profile.counts.played} trades placed`}
          />
          <StatCard 
            label="Winnings" 
            value={`$${profile.totals.winning.human}`} 
            icon={FiDollarSign} 
            subtitle={`${profile.counts.won} profitable positions`}
          />
          <StatCard 
            label="Fees Earned" 
            value={`$${profile.totals.owner_fee.human}`} 
            icon={FiAward} 
            subtitle={`From ${profile.counts.created} created markets`}
          />
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={8}>
          {/* Left Column: Monthly Snapshot */}
          <VStack align="stretch" spacing={6}>
            <Box 
              bg="rgba(30, 41, 59, 0.4)" 
              borderRadius="2xl" 
              p={6} 
              borderWidth="1px" 
              borderColor={(monthlyData?.is_profitable ?? profile.monthly.is_profitable) ? "green.500/30" : "red.500/30"}
              boxShadow={(monthlyData?.is_profitable ?? profile.monthly.is_profitable) ? "0 0 20px rgba(72, 187, 120, 0.05)" : "none"}
            >
              <HStack justify="space-between" mb={6}>
                <HStack color="white">
                  <Icon as={FiPieChart} boxSize={5} />
                  <Heading size="sm">Monthly Snapshot</Heading>
                </HStack>
                <Select 
                  size="xs" 
                  w="140px" 
                  bg="whiteAlpha.100" 
                  border="none" 
                  color="white" 
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  _focus={{ ring: 0 }}
                >
                  {recentMonths.map(m => (
                    <option key={m.value} value={m.value} style={{ background: '#020617' }}>{m.label}</option>
                  ))}
                </Select>
              </HStack>

              <VStack align="center" py={4} spacing={2}>
                <Text color="whiteAlpha.600" fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Monthly P&L</Text>
                <PnlIndicator value={monthlyData?.pnl.human || profile.monthly.pnl.human} fontSize="4xl" prefix="$" />
                <Badge colorScheme={(monthlyData?.is_profitable ?? profile.monthly.is_profitable) ? "green" : "red"} variant="subtle" px={4} py={1} borderRadius="full">
                  {(monthlyData?.is_profitable ?? profile.monthly.is_profitable) ? "PROFITABLE" : "LOSS"}
                </Badge>
              </VStack>

              <Grid templateColumns="1fr 1fr" gap={4} mt={8}>
                <VStack align="start" bg="whiteAlpha.50" p={3} borderRadius="xl">
                  <Text color="whiteAlpha.500" fontSize="2xs" fontWeight="bold">WIN RATE</Text>
                  <Text color="white" fontWeight="bold">{monthlyData?.win_rate ?? profile.monthly.win_rate}%</Text>
                </VStack>
                <VStack align="start" bg="whiteAlpha.50" p={3} borderRadius="xl">
                  <Text color="whiteAlpha.500" fontSize="2xs" fontWeight="bold">TRADES</Text>
                  <Text color="white" fontWeight="bold">{monthlyData?.played ?? profile.monthly.played}</Text>
                </VStack>
              </Grid>
            </Box>

            <Box 
              bg="rgba(30, 41, 59, 0.4)" 
              borderRadius="2xl" 
              p={6} 
              borderWidth="1px" 
              borderColor="whiteAlpha.100"
            >
              <HStack mb={4}>
                <Icon as={FiZap} color="orange.400" />
                <Text color="white" fontWeight="bold">Achievements</Text>
              </HStack>
              <HStack spacing={2} wrap="wrap">
                {profile.metadata.achievements.map((achievement, idx) => (
                  <Badge key={idx} colorScheme={idx % 2 === 0 ? "orange" : "purple"} variant="outline" p={1} borderRadius="lg">
                    {achievement}
                  </Badge>
                ))}
                {profile.metadata.achievements.length === 0 && (
                  <Text color="whiteAlpha.400" fontSize="xs">No achievements yet</Text>
                )}
              </HStack>
            </Box>
          </VStack>

          {/* Right Column: Betting History */}
          <Box 
             bg="rgba(30, 41, 59, 0.2)" 
             borderRadius="2xl" 
             borderWidth="1px" 
             borderColor="whiteAlpha.100"
             overflow="hidden"
          >
            <Box p={6}>
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="sm" color="white">Betting History</Heading>
                <HStack spacing={4}>
                  <Tabs size="sm" variant="soft-rounded" colorScheme="blue" onChange={(idx) => {
                    const statuses = ['all', 'active', 'won', 'lost'];
                    handleStatusChange(statuses[idx]);
                  }}>
                    <TabList bg="whiteAlpha.50" p={1} borderRadius="full">
                      <Tab color="whiteAlpha.600" _selected={{ color: 'white', bg: 'blue.500' }}>All</Tab>
                      <Tab color="whiteAlpha.600" _selected={{ color: 'white', bg: 'blue.500' }}>Active</Tab>
                      <Tab color="whiteAlpha.600" _selected={{ color: 'white', bg: 'blue.500' }}>Won</Tab>
                      <Tab color="whiteAlpha.600" _selected={{ color: 'white', bg: 'blue.500' }}>Lost</Tab>
                    </TabList>
                  </Tabs>
                </HStack>
              </Flex>

              <Table variant="simple" size="sm">
                <Thead>
                  <Tr borderBottomWidth="2px" borderColor="whiteAlpha.100">
                    <Th color="whiteAlpha.400">Market</Th>
                    <Th color="whiteAlpha.400">Side</Th>
                    <Th color="whiteAlpha.400" isNumeric>Amount</Th>
                    <Th color="whiteAlpha.400" isNumeric>P&L</Th>
                    <Th color="whiteAlpha.400">Status</Th>
                    <Th color="whiteAlpha.400">Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoadingHistory ? (
                    <Tr>
                      <Td colSpan={6} py={10} textAlign="center">
                        <Spinner color="blue.500" />
                      </Td>
                    </Tr>
                  ) : history.length > 0 ? (
                    history.map((bet) => (
                      <Tr 
                        key={bet.bet_id} 
                        _hover={{ bg: 'whiteAlpha.50' }} 
                        transition="all 0.2s"
                        cursor="pointer"
                        onClick={() => router.push(`/markets/${bet.market_addr}`)}
                      >
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text color="white" fontWeight="bold">{bet.pair_name}</Text>
                            <Text fontSize="2xs" color="whiteAlpha.400">{bet.market_addr.slice(0, 10)}...</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={bet.side === 'Long' ? 'green' : 'red'} variant="subtle">
                            {bet.side.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td isNumeric color="white">${bet.bet_amount}</Td>
                        <Td isNumeric>
                          <PnlIndicator value={bet.pnl} fontSize="xs" showIcon={false} />
                        </Td>
                        <Td>
                          <Badge 
                            variant="solid" 
                            colorScheme={
                              bet.status === 'won' ? 'green' : 
                              bet.status === 'lost' ? 'red' : 
                              bet.status === 'active' ? 'blue' : 'gray'
                            }
                            fontSize="2xs"
                          >
                            {bet.status.toUpperCase()}
                          </Badge>
                        </Td>
                        <Td color="whiteAlpha.600" fontSize="xs">
                          {new Date(bet.bet_time).toLocaleDateString()}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={6} py={10} textAlign="center" color="whiteAlpha.400">
                        No trade history found
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>

            <PaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange}
              isLoading={isLoadingHistory}
            />
          </Box>
        </Grid>
      </Container>
    </Box>
  );
}