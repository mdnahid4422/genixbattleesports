import { RoomStatus, AppData, Team } from './types';

/**
 * ============================================================
 * HOW TO ADD A TEAM MANUALLY VIA CODE:
 * ============================================================
 * 1. Copy the block below inside the 'teams: [' array.
 * 2. Replace the values with your team details.
 * 3. For the logo, you can use a URL or a Base64 string.
 * 
 * {
 *   id: 'manual_' + Date.now(),
 *   teamName: 'MY NEW TEAM',
 *   teamEmail: 'admin@genix.com',
 *   captainFullName: 'John Doe',
 *   captainName: 'LEGEND',
 *   captainUid: 'ID12345',
 *   player2Name: 'Player 2', player2Uid: 'ID2',
 *   player3Name: 'Player 3', player3Uid: 'ID3',
 *   player4Name: 'Player 4', player4Uid: 'ID4',
 *   phone: '01XXXXXXXXX',
 *   registrationDate: new Date().toISOString(),
 *   isApproved: true
 * },
 */

export const INITIAL_DATA: AppData = {
  posters: [
    { id: '1', imageUrl: 'https://picsum.photos/1200/600?random=1', title: 'Grand Finale Tournament 2024' },
    { id: '2', imageUrl: 'https://picsum.photos/1200/600?random=2', title: 'Weekly Scrims: Season 5' },
    { id: '3', imageUrl: 'https://picsum.photos/1200/600?random=3', title: 'Night Battle Championship' }
  ],
  rooms: [
    {
      id: 'r1',
      title: 'GENIX Alpha Battle #001',
      status: RoomStatus.UPCOMING,
      time: '2024-12-20T20:00',
      totalSlots: 20,
      remainingSlots: 4,
      // Fix: Removed 'secretCode' and added 'entryFee' & 'prizePool' to match 'Room' interface
      thumbnail: 'https://picsum.photos/400/300?random=10',
      roomId: '987212',
      password: 'genix_password',
      teams: ['Team Liquid', 'Natus Vincere', 'G2 Esports'],
      matchCount: 1,
      entryFee: 50,
      prizePool: 500
    },
    {
      id: 'r2',
      title: 'Pro Invitational Cup',
      status: RoomStatus.COMPLETE,
      time: '2024-12-18T18:00',
      totalSlots: 16,
      remainingSlots: 0,
      // Fix: Removed 'secretCode' and added 'entryFee' & 'prizePool' to match 'Room' interface
      thumbnail: 'https://picsum.photos/400/300?random=11',
      roomId: '112233',
      password: 'done',
      teams: ['T1', 'Fnatic', 'Cloud9'],
      matchCount: 3,
      results: [],
      entryFee: 100,
      prizePool: 1000
    }
  ],
  teams: [
    {
      id: 't1',
      teamName: 'Team GENIX',
      teamEmail: 'contact@genix.com',
      captainFullName: 'Zenith Prime',
      captainName: 'Zenith',
      captainUid: 'GX1001',
      player2Name: 'Nexus',
      player2Uid: 'GX1002',
      player3Name: 'Void',
      player3Uid: 'GX1003',
      player4Name: 'Eclipse',
      player4Uid: 'GX1004',
      phone: '8801305098283',
      registrationDate: '2024-12-01',
      isApproved: true
    }
  ],
  points: [
    { id: 'p1', teamName: 'Team GENIX', matchesPlayed: 5, rankPoints: 40, killPoints: 25, totalPoints: 65 },
    { id: 'p2', teamName: 'Shadow Kings', matchesPlayed: 5, rankPoints: 35, killPoints: 22, totalPoints: 57 }
  ],
  rules: [
    "No emulators allowed.",
    "Teams must check-in 15 minutes before the start time.",
    "Hacking or use of third-party tools will lead to immediate ban.",
    "Screenshots must be uploaded for verification of kills.",
    "A stable internet connection is the player's responsibility."
  ]
};