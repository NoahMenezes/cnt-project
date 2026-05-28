export interface UserInfo {
  name: string;
  email: string;
  joinDate: string;
  profileImage: null;
}

export interface ProfileStatistics {
  totalAnalyses: number;
  averageScore: number;
  reportsGenerated: number;
  filesProcessed: number;
}

export interface Session {
  id: string;
  dateTime: string;
  device: string;
  ip: string;
  status: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface ProfileData {
  user: UserInfo;
  statistics: ProfileStatistics;
  sessions: Session[];
  recentActivity: ActivityItem[];
}

const profileData: ProfileData = {
  user: {
    name: "User",
    email: "user@example.com",
    joinDate: new Date().toISOString().split("T")[0],
    profileImage: null,
  },
  statistics: {
    totalAnalyses: 0,
    averageScore: 0,
    reportsGenerated: 0,
    filesProcessed: 0,
  },
  sessions: [],
  recentActivity: [],
};

export default profileData;
