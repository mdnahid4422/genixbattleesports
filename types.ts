
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
  player2Name?: string;
  player2Uid?: string;
  player3Name?: string;
  player3Uid?: string;
  player4Name?: string;
  player4Uid?: string;
  player5Name?: string;
  player5Uid?: string;
  phone: string;
  registrationDate: string;
  isApproved: boolean; // Field for admin moderation
  userUid?: string; // Reference to the user who registered the team
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

export interface AppData {
  rooms: Room[];
  teams: Team[];
  posters: Poster[];
  points: PointEntry[];
  rules: string[];
}
