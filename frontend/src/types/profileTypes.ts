export interface Skill {
  skill_id: number;
  skill_name: string;
  score: number;
  targetLevel?: 4;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  Team?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    name: string;
    userId: string;
  };
  hr?: {
    id: string;
    name: string;
    userId: string;
  };
  userId?: string;
  createdAt?: string;
  skills?: Skill[];
  data?: Skill[];
}
