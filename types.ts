
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
  secretCode: string;
  thumbnail: string;
  roomId?: string;
  password?: string;
  teams: string[];
  results?: MatchResult[];
  matchCount: number;
}

export interface Team {
  id: string;
  teamName: string;
  teamLogo?: string;
  teamEmail: string;
  captainFullName: string;
  captainName: string; // This is In-Game Name
  captainUid: string;
  captainAccountName?: string; // Display name of the captain's account
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
  likes?: string[]; // Array of UIDs who liked the team
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
