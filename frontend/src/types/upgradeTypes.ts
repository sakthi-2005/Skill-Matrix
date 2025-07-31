export interface Resource {
  id: string;
  title: string;
  type: "Course" | "Documentation" | "Tutorial" | "Book";
  url: string;
}

export interface LearningPath {
  id: number;
  skillId: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  priority: "High" | "Medium" | "Low";
}

export interface Skill {
  id: string;
  name: string;
  level?: number;
}

export interface UpgradeGuide {
  id: string;
  skillId: number;
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink?: string;
}
