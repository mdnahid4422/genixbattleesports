
export enum RoomStatus {
  UPCOMING = 'Upcoming',
  CANCELLED = 'Cancelled',
  COMPLETE = 'Complete'
}

export type UserRole = 'owner' | 'admin' | 'moderator' | 'player';

export type PlayerPosition = 
  | 'Captain' 
  | '1st Rusher' 
  | '2nd Rusher' 
  | 'Supporter' 
  | 'Sniper Player' 
  | 'Backup Player' 
  | 'Coach' 
  | 'Manager';

export type SpecialBadge = 
  | 'Best Rusher' 
  | 'Best IGL' 
  | 'Best Supporter' 
  | 'Best Sniper';

export interface TaskProgress {
  id: string;
  count: number;
  completed: boolean;
  lastUpdated: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  photoURL?: string;
  role: UserRole;
  position?: PlayerPosition;
  specialBadges?: SpecialBadge[];
  teamId?: string;
  email: string;
  bio?: string;
  totalKills?: number;
  // Level System Fields
  level?: number;
  exp?: number; // This is current level progress EXP (resets on level up)
  totalExp?: number; // This is lifetime total EXP (never resets)
  dailyAdsCount?: number;
  lastAdDate?: string;
  tasksProgress?: TaskProgress[];
}

export interface TeamMatchStats {
  position: number;
  kills: number;
}

export interface MatchResult {
  teamName: string;
  teamLogo?: string;
  matchStats: TeamMatchStats[];
}

export interface Room {
  id: string;
  title: string;
  status: RoomStatus;
  time: string;
  totalSlots: number;
  remainingSlots: number;
  thumbnail: string;
  roomId?: string;
  password?: string;
  waitingMessage?: string;
  teams: string[]; 
  results?: MatchResult[];
  matchCount: number;
  entryFee: number;
  prizePool: number;
}

export interface Order {
  id: string;
  roomId: string;
  roomTitle: string;
  teamName: string;
  captainUid: string;
  captainName: string;
  method: 'bkash' | 'nagad' | 'rocket';
  senderNumber: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Team {
  id: string;
  teamName: string;
  teamLogo?: string;
  teamEmail: string;
  captainFullName: string;
  captainName: string; 
  captainUid: string;
  captainAccountName?: string; 
  player2Name?: string;
  player2Uid?: string;
  player2AccountName?: string;
  player2Position?: PlayerPosition;
  player3Name?: string;
  player3Uid?: string;
  player3AccountName?: string;
  player3Position?: PlayerPosition;
  player4Name?: string;
  player4Uid?: string;
  player4AccountName?: string;
  player4Position?: PlayerPosition;
  player5Name?: string;
  player5Uid?: string;
  player5AccountName?: string;
  player5Position?: PlayerPosition;
  phone: string;
  registrationDate: string;
  isApproved: boolean; 
  userUid?: string; 
  likes?: string[];
}

export interface AppData {
  rooms: Room[];
  teams: Team[];
  posters: Poster[];
  points: PointEntry[];
  rules: string[];
}

export interface Poster {
  id: string;
  imageUrl: string;
  title: string;
}

export interface PointEntry {
  id: string;
  teamName: string;
  matchesPlayed: number;
  rankPoints: number;
  killPoints: number;
  totalPoints: number;
}
