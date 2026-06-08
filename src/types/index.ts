export type Priority = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type Category = 'trabalho' | 'pessoal';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
}

export interface QuadrantColors {
  bg: string;
  border: string;
  header: string;
  badge: string;
  button: string;
  text: string;
  glow: string;
  ring: string;
  cardBg: string;
  cardBorder: string;
  cardBar: string;
  cardTitle: string;
}

export interface QuadrantInfo {
  id: Priority;
  title: string;
  subtitle: string;
  action: string;
  emoji: string;
  description: string;
  urgency: boolean;
  importance: boolean;
  colors: QuadrantColors;
}
