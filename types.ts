export enum BlockType {
  MOVE_STEPS = 'MOVE_STEPS',
  TURN_RIGHT = 'TURN_RIGHT',
  TURN_LEFT = 'TURN_LEFT',
  GOTO_XY = 'GOTO_XY',
  SAY = 'SAY',
  WAIT = 'WAIT',
  REPEAT = 'REPEAT',
  CHANGE_COSTUME = 'CHANGE_COSTUME',
}

export interface Block {
  id: string;
  type: BlockType;
  params: Record<string, any>;
}

export interface Sprite {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  costumes: string[]; // Base64 data URLs
  currentCostumeIndex: number;
  scripts: Block[];
  bubbleText?: string;
}

export interface Project {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  sprites: Sprite[];
  backdrop: string; // Base64 data URL
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export const DEFAULT_SPRITE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23FFBF00' /%3E%3Ccircle cx='35' cy='40' r='5' fill='%23000' /%3E%3Ccircle cx='65' cy='40' r='5' fill='%23000' /%3E%3Cpath d='M 30 60 Q 50 80 70 60' stroke='%23000' stroke-width='3' fill='none' /%3E%3C/svg%3E";
