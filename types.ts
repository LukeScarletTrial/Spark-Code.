
export enum BlockType {
  // Events
  EVENT_FLAG_CLICKED = 'EVENT_FLAG_CLICKED',
  EVENT_SPRITE_CLICKED = 'EVENT_SPRITE_CLICKED',
  EVENT_KEY_PRESSED = 'EVENT_KEY_PRESSED',
  EVENT_BROADCAST = 'EVENT_BROADCAST',
  EVENT_RECEIVE_BROADCAST = 'EVENT_RECEIVE_BROADCAST',

  // Motion
  MOVE_STEPS = 'MOVE_STEPS',
  TURN_RIGHT = 'TURN_RIGHT',
  TURN_LEFT = 'TURN_LEFT',
  GOTO_XY = 'GOTO_XY',
  GOTO_MOUSE = 'GOTO_MOUSE',
  GLIDE_TO_XY = 'GLIDE_TO_XY',
  POINT_DIRECTION = 'POINT_DIRECTION',
  POINT_TOWARDS = 'POINT_TOWARDS',
  CHANGE_X = 'CHANGE_X',
  SET_X = 'SET_X',
  CHANGE_Y = 'CHANGE_Y',
  SET_Y = 'SET_Y',
  IF_ON_EDGE_BOUNCE = 'IF_ON_EDGE_BOUNCE',
  // Motion Reporters
  MOTION_X_POSITION = 'MOTION_X_POSITION', // New
  MOTION_Y_POSITION = 'MOTION_Y_POSITION', // New
  MOTION_DIRECTION = 'MOTION_DIRECTION', // New

  // Looks
  SAY = 'SAY',
  SAY_FOR_SECS = 'SAY_FOR_SECS',
  THINK = 'THINK',
  THINK_FOR_SECS = 'THINK_FOR_SECS',
  CHANGE_COSTUME = 'CHANGE_COSTUME',
  SWITCH_COSTUME = 'SWITCH_COSTUME',
  NEXT_BACKDROP = 'NEXT_BACKDROP',
  CHANGE_SIZE = 'CHANGE_SIZE',
  SET_SIZE = 'SET_SIZE',
  SHOW = 'SHOW',
  HIDE = 'HIDE',
  GO_TO_FRONT = 'GO_TO_FRONT',
  // Looks Reporters
  LOOKS_COSTUME_NUMBER = 'LOOKS_COSTUME_NUMBER', // New
  LOOKS_BACKDROP_NUMBER = 'LOOKS_BACKDROP_NUMBER', // New
  LOOKS_SIZE = 'LOOKS_SIZE', // New

  // Sound
  PLAY_SOUND = 'PLAY_SOUND',
  CHANGE_VOLUME = 'CHANGE_VOLUME',
  SET_VOLUME = 'SET_VOLUME',
  // Sound Reporters
  SOUND_VOLUME = 'SOUND_VOLUME', // New

  // Control
  WAIT = 'WAIT',
  REPEAT = 'REPEAT',
  FOREVER = 'FOREVER',
  IF = 'IF',
  IF_ELSE = 'IF_ELSE',
  WAIT_UNTIL = 'WAIT_UNTIL',
  STOP_ALL = 'STOP_ALL',
  CREATE_CLONE = 'CREATE_CLONE',

  // Sensing
  ASK_AND_WAIT = 'ASK_AND_WAIT',
  TOUCHING_MOUSE = 'TOUCHING_MOUSE',
  KEY_PRESSED = 'KEY_PRESSED',
  RESET_TIMER = 'RESET_TIMER',
  // Sensing Reporters
  SENSING_MOUSE_X = 'SENSING_MOUSE_X', // New
  SENSING_MOUSE_Y = 'SENSING_MOUSE_Y', // New
  SENSING_TIMER = 'SENSING_TIMER', // New
  SENSING_USERNAME = 'SENSING_USERNAME', // New

  // Operators
  OP_ADD = 'OP_ADD',
  OP_SUBTRACT = 'OP_SUBTRACT',
  OP_MULTIPLY = 'OP_MULTIPLY',
  OP_DIVIDE = 'OP_DIVIDE',
  OP_RANDOM = 'OP_RANDOM',
  OP_GREATER = 'OP_GREATER',
  OP_LESS = 'OP_LESS',
  OP_EQUALS = 'OP_EQUALS',
  OP_AND = 'OP_AND',
  OP_OR = 'OP_OR',
  OP_NOT = 'OP_NOT',
  OP_JOIN = 'OP_JOIN',

  // Variables
  VAR_SET = 'VAR_SET',
  VAR_CHANGE = 'VAR_CHANGE',
  VAR_SHOW = 'VAR_SHOW',
  VAR_HIDE = 'VAR_HIDE',
}

export interface Block {
  id: string;
  type: BlockType;
  params: Record<string, any>;
  children?: Block[]; // For C-blocks (e.g., inside REPEAT, IF)
  elseChildren?: Block[]; // For IF_ELSE
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
  visible: boolean;
}

export interface Variable {
    id: string;
    name: string;
    value: string | number;
    isCloud: boolean;
}

export interface Project {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  sprites: Sprite[];
  backdrop: string; // Base64 data URL
  variables: Variable[];
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export const DEFAULT_SPRITE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23FFBF00' /%3E%3Ccircle cx='35' cy='40' r='5' fill='%23000' /%3E%3Ccircle cx='65' cy='40' r='5' fill='%23000' /%3E%3Cpath d='M 30 60 Q 50 80 70 60' stroke='%23000' stroke-width='3' fill='none' /%3E%3C/svg%3E";
