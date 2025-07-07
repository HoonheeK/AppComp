export type Task = {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string[];
};