
export enum RoomStatus {
  UPCOMING = 'Upcoming',
  CANCELLED = 'Cancelled',
  COMPLETE = 'Complete'
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
  waitingMessage?: string; // New: Custom message when ID/Pass is empty
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
  player3Name?: string;
  player3Uid?: string;
  player3AccountName?: string;
  player4Name?: string;
  player4Uid?: string;
  player4AccountName?: string;
  player5Name?: string;
  player5Uid?: string;
  player5AccountName?: string;
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
