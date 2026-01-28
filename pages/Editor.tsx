import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Project, Sprite, Block, BlockType, User, Variable } from '../types';
import { createNewProject, getProjects, saveProject, login } from '../services/storage';
import { Play, Square, Save, RotateCcw, Image as ImageIcon, Plus, Trash2, MousePointer2, Move, RotateCw, MessageSquare, Clock, Repeat, Shirt, Code2, LayoutTemplate, Flag, MousePointerClick, Volume2, HelpCircle, GripHorizontal, Settings, Pencil, CheckSquare, Layers } from 'lucide-react';
import PaintModal from '../components/PaintModal';

// --- BLOCK DEFINITIONS ---

interface BlockDef {
  type: BlockType;
  label: string; // Use {paramName} for inputs
  category: string;
  icon?: any;
  defaultParams?: Record<string, any>;
  shape?: 'hat' | 'stack' | 'c-block' | 'cap' | 'reporter' | 'boolean';
}

const CATEGORIES = [
  { id: 'motion', label: 'Motion', color: 'bg-blue-500', border: 'border-blue-700', text: 'text-white' },
  { id: 'looks', label: 'Looks', color: 'bg-purple-500', border: 'border-purple-700', text: 'text-white' },
  { id: 'sound', label: 'Sound', color: 'bg-pink-500', border: 'border-pink-700', text: 'text-white' },
  { id: 'events', label: 'Events', color: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-white' },
  { id: 'control', label: 'Control', color: 'bg-orange-500', border: 'border-orange-700', text: 'text-white' },
  { id: 'sensing', label: 'Sensing', color: 'bg-cyan-500', border: 'border-cyan-700', text: 'text-white' },
  { id: 'operators', label: 'Operators', color: 'bg-green-500', border: 'border-green-700', text: 'text-white' },
  { id: 'variables', label: 'Variables', color: 'bg-orange-600', border: 'border-orange-800', text: 'text-white' },
];

const BLOCK_REGISTRY: BlockDef[] = [
  // Events
  { type: BlockType.EVENT_FLAG_CLICKED, label: 'When 🚩 clicked', category: 'events', icon: Flag, shape: 'hat' },
  { type: BlockType.EVENT_SPRITE_CLICKED, label: 'When this sprite clicked', category: 'events', icon: MousePointerClick, shape: 'hat' },
  { type: BlockType.EVENT_KEY_PRESSED, label: 'When {KEY} key pressed', category: 'events', defaultParams: { KEY: 'space' }, shape: 'hat' },

  // Motion
  { type: BlockType.MOVE_STEPS, label: 'Move {STEPS} steps', category: 'motion', defaultParams: { STEPS: 10 } },
  { type: BlockType.TURN_RIGHT, label: 'Turn right ↷ {DEGREES} degrees', category: 'motion', defaultParams: { DEGREES: 15 }, icon: RotateCw },
  { type: BlockType.TURN_LEFT, label: 'Turn left ↶ {DEGREES} degrees', category: 'motion', defaultParams: { DEGREES: 15 }, icon: RotateCcw },
  { type: BlockType.GOTO_XY, label: 'Go to x: {X} y: {Y}', category: 'motion', defaultParams: { X: 0, Y: 0 } },
  { type: BlockType.GOTO_MOUSE, label: 'Go to random position', category: 'motion' },
  { type: BlockType.GLIDE_TO_XY, label: 'Glide {SECS} secs to x: {X} y: {Y}', category: 'motion', defaultParams: { SECS: 1, X: 0, Y: 0 } },
  { type: BlockType.POINT_DIRECTION, label: 'Point in direction {DIR}', category: 'motion', defaultParams: { DIR: 90 } },
  { type: BlockType.SET_X, label: 'Set x to {X}', category: 'motion', defaultParams: { X: 0 } },
  { type: BlockType.CHANGE_X, label: 'Change x by {DX}', category: 'motion', defaultParams: { DX: 10 } },
  { type: BlockType.SET_Y, label: 'Set y to {Y}', category: 'motion', defaultParams: { Y: 0 } },
  { type: BlockType.CHANGE_Y, label: 'Change y by {DY}', category: 'motion', defaultParams: { DY: 10 } },
  { type: BlockType.IF_ON_EDGE_BOUNCE, label: 'If on edge, bounce', category: 'motion' },
  // Motion Reporters
  { type: BlockType.MOTION_X_POSITION, label: 'x position', category: 'motion', shape: 'reporter' },
  { type: BlockType.MOTION_Y_POSITION, label: 'y position', category: 'motion', shape: 'reporter' },
  { type: BlockType.MOTION_DIRECTION, label: 'direction', category: 'motion', shape: 'reporter' },

  // Looks
  { type: BlockType.SAY_FOR_SECS, label: 'Say {TEXT} for {SECS} seconds', category: 'looks', defaultParams: { TEXT: 'Hello!', SECS: 2 } },
  { type: BlockType.SAY, label: 'Say {TEXT}', category: 'looks', defaultParams: { TEXT: 'Hello!' } },
  { type: BlockType.THINK_FOR_SECS, label: 'Think {TEXT} for {SECS} seconds', category: 'looks', defaultParams: { TEXT: 'Hmm...', SECS: 2 } },
  { type: BlockType.CHANGE_COSTUME, label: 'Next costume', category: 'looks' },
  { type: BlockType.SWITCH_COSTUME, label: 'Switch costume to {INDEX}', category: 'looks', defaultParams: { INDEX: 1 } },
  { type: BlockType.CHANGE_SIZE, label: 'Change size by {AMOUNT}', category: 'looks', defaultParams: { AMOUNT: 10 } },
  { type: BlockType.SET_SIZE, label: 'Set size to {SIZE}%', category: 'looks', defaultParams: { SIZE: 100 } },
  { type: BlockType.SHOW, label: 'Show', category: 'looks' },
  { type: BlockType.HIDE, label: 'Hide', category: 'looks' },
  { type: BlockType.GO_TO_FRONT, label: 'Go to front layer', category: 'looks' },
  // Looks Reporters
  { type: BlockType.LOOKS_COSTUME_NUMBER, label: 'costume number', category: 'looks', shape: 'reporter' },
  { type: BlockType.LOOKS_BACKDROP_NUMBER, label: 'backdrop number', category: 'looks', shape: 'reporter' },
  { type: BlockType.LOOKS_SIZE, label: 'size', category: 'looks', shape: 'reporter' },

  // Sound
  { type: BlockType.PLAY_SOUND, label: 'Play sound Meow until done', category: 'sound', icon: Volume2 },
  { type: BlockType.CHANGE_VOLUME, label: 'Change volume by {VAL}', category: 'sound', defaultParams: { VAL: -10 } },
  { type: BlockType.SET_VOLUME, label: 'Set volume to {VAL}%', category: 'sound', defaultParams: { VAL: 100 } },
  // Sound Reporters
  { type: BlockType.SOUND_VOLUME, label: 'volume', category: 'sound', shape: 'reporter' },

  // Control
  { type: BlockType.WAIT, label: 'Wait {SECS} seconds', category: 'control', defaultParams: { SECS: 1 } },
  { type: BlockType.REPEAT, label: 'Repeat {TIMES}', category: 'control', defaultParams: { TIMES: 10 }, shape: 'c-block' },
  { type: BlockType.FOREVER, label: 'Forever', category: 'control', shape: 'c-block' },
  { type: BlockType.IF, label: 'If {CONDITION} then', category: 'control', defaultParams: { CONDITION: 'true' }, shape: 'c-block' },
  { type: BlockType.IF_ELSE, label: 'If {CONDITION} then / else', category: 'control', defaultParams: { CONDITION: 'true' }, shape: 'c-block' },
  { type: BlockType.STOP_ALL, label: 'Stop all', category: 'control', shape: 'cap' },

  // Sensing
  { type: BlockType.ASK_AND_WAIT, label: 'Ask {QUESTION} and wait', category: 'sensing', defaultParams: { QUESTION: "What's your name?" } },
  { type: BlockType.TOUCHING_MOUSE, label: 'Touching mouse-pointer?', category: 'sensing', shape: 'boolean' },
  { type: BlockType.KEY_PRESSED, label: 'Key {KEY} pressed?', category: 'sensing', defaultParams: { KEY: 'space' }, shape: 'boolean' },
  { type: BlockType.RESET_TIMER, label: 'Reset timer', category: 'sensing' },
  // Sensing Reporters
  { type: BlockType.SENSING_MOUSE_X, label: 'mouse x', category: 'sensing', shape: 'reporter' },
  { type: BlockType.SENSING_MOUSE_Y, label: 'mouse y', category: 'sensing', shape: 'reporter' },
  { type: BlockType.SENSING_TIMER, label: 'timer', category: 'sensing', shape: 'reporter' },
  { type: BlockType.SENSING_USERNAME, label: 'username', category: 'sensing', shape: 'reporter' },

  // Operators
  { type: BlockType.OP_ADD, label: '{A} + {B}', category: 'operators', defaultParams: { A: 0, B: 0 }, shape: 'reporter' },
  { type: BlockType.OP_SUBTRACT, label: '{A} - {B}', category: 'operators', defaultParams: { A: 0, B: 0 }, shape: 'reporter' },
  { type: BlockType.OP_RANDOM, label: 'Pick random {MIN} to {MAX}', category: 'operators', defaultParams: { MIN: 1, MAX: 10 }, shape: 'reporter' },
  { type: BlockType.OP_GREATER, label: '{A} > {B}', category: 'operators', defaultParams: { A: 50, B: 50 }, shape: 'boolean' },
  { type: BlockType.OP_EQUALS, label: '{A} = {B}', category: 'operators', defaultParams: { A: 50, B: 50 }, shape: 'boolean' },
  { type: BlockType.OP_JOIN, label: 'Join {A} {B}', category: 'operators', defaultParams: { A: 'apple', B: ' banana' }, shape: 'reporter' },

  // Variables
  { type: BlockType.VAR_SET, label: 'Set {VAR} to {VAL}', category: 'variables', defaultParams: { VAR: 'my variable', VAL: 0 } },
  { type: BlockType.VAR_CHANGE, label: 'Change {VAR} by {VAL}', category: 'variables', defaultParams: { VAR: 'my variable', VAL: 1 } },
  { type: BlockType.VAR_SHOW, label: 'Show variable {VAR}', category: 'variables', defaultParams: { VAR: 'my variable' } },
  { type: BlockType.VAR_HIDE, label: 'Hide variable {VAR}', category: 'variables', defaultParams: { VAR: 'my variable' } },
];

interface EditorProps {
  user: User | null;
  setUser: (u: User) => void;
}

const Editor: React.FC<EditorProps> = ({ user, setUser }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('motion');
  const [isRunning, setIsRunning] = useState(false);
  
  // Paint Modal State
  const [showPaint, setShowPaint] = useState(false);
  const [paintTarget, setPaintTarget] = useState<'sprite' | 'backdrop' | 'costume'>('sprite');

  // Variable Modal
  const [showVarModal, setShowVarModal] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [isCloudVar, setIsCloudVar] = useState(false);
  
  // Runtime State
  const [runtimeSprites, setRuntimeSprites] = useState<Sprite[]>([]);
  const runtimeSpritesRef = useRef<Sprite[]>([]);
  const runtimeVariablesRef = useRef<Record<string, any>>({});
  const isRunningRef = useRef(false);
  
  // Global Inputs
  const mousePosRef = useRef({ x: 0, y: 0 });
  const timerStartRef = useRef<number>(Date.now());

  // Auth State
  const [emailInput, setEmailInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- INITIALIZATION ---

  useEffect(() => {
    // Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
        // Normalize to Scratch Coordinates (-240 to 240, -180 to 180)
        // Assuming stage is centered in window or finding the stage element
        // For simplicity in this demo, we'll just track generic movement or relative to center of screen
        // In a real app, calculate relative to Stage rect.
        // Mock implementation: 
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mousePosRef.current = {
            x: Math.round((e.clientX - centerX) / 2), // Rough scaling
            y: Math.round(-(e.clientY - centerY) / 2) // Invert Y
        };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (projectId) {
      const projects = getProjects();
      const found = projects.find(p => p.id === projectId);
      if (found) {
        // Ensure variables array exists
        if (!found.variables) found.variables = [];
        setProject(found);
        setRuntimeSprites(found.sprites);
        runtimeSpritesRef.current = found.sprites;
        if (found.sprites.length > 0) setSelectedSpriteId(found.sprites[0].id);
      } else {
        const newP = createNewProject(user);
        setProject(newP);
        setRuntimeSprites(newP.sprites);
        runtimeSpritesRef.current = newP.sprites;
        setSelectedSpriteId(newP.sprites[0].id);
      }
    } else {
      const newP = createNewProject(user);
      setProject(newP);
      setRuntimeSprites(newP.sprites);
      runtimeSpritesRef.current = newP.sprites;
      setSelectedSpriteId(newP.sprites[0].id);
    }
  }, [projectId, user]);

  // Cloud Variables Sync
  useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
          if (e.key && e.key.startsWith('cloud_')) {
              const varId = e.key.replace('cloud_', '');
              // Update runtime variable if it exists in project
              if (project?.variables.find(v => v.id === varId)) {
                  runtimeVariablesRef.current[project.variables.find(v => v.id === varId)!.name] = Number(e.newValue);
                  // Force re-render to show value update? Not strictly needed for runtime but good for watchers if we had them
              }
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, [project]);

  // --- ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!emailInput) return;
    setIsLoggingIn(true);
    const u = await login(emailInput);
    setUser(u);
    setIsLoggingIn(false);
  };

  const handleSave = async () => {
    if (!project || !user) return;
    await saveProject(project);
    alert('Project Saved!');
  };

  const createVariable = () => {
      if(!newVarName || !project) return;
      const newVar: Variable = {
          id: 'var_' + Date.now(),
          name: newVarName,
          value: 0,
          isCloud: isCloudVar
      };
      setProject({ ...project, variables: [...project.variables, newVar] });
      setShowVarModal(false);
      setNewVarName('');
      setIsCloudVar(false);
      
      if(isCloudVar) {
          localStorage.setItem('cloud_' + newVar.id, '0');
      }
  };

  const addBlock = (type: BlockType, defaultParams: any = {}, shape?: string) => {
    if (!selectedSpriteId || !project) return;
    
    // If it's a reporter, maybe we just show its value temporarily since we can't drag to input easily?
    if (shape === 'reporter' || shape === 'boolean') {
        const s = runtimeSpritesRef.current.find(sp => sp.id === selectedSpriteId);
        if (s) {
            const val = resolveValue(BLOCK_REGISTRY.find(b => b.type === type)?.label || '', s.id);
            alert(`${BLOCK_REGISTRY.find(b => b.type === type)?.label}: ${val}`);
        }
        return; 
    }

    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      params: { ...defaultParams },
      children: [],
      elseChildren: []
    };
    
    setProject(prev => {
      if(!prev) return null;
      return {
        ...prev,
        sprites: prev.sprites.map(s => 
          s.id === selectedSpriteId 
            ? { ...s, scripts: [...s.scripts, newBlock] } 
            : s
        )
      };
    });
  };

  const updateBlockParams = (blockId: string, paramName: string, value: any) => {
      if (!selectedSpriteId || !project) return;
      
      const updateBlockInTree = (blocks: Block[]): Block[] => {
          return blocks.map(b => {
              if (b.id === blockId) {
                  return { ...b, params: { ...b.params, [paramName]: value } };
              }
              if (b.children) b.children = updateBlockInTree(b.children);
              if (b.elseChildren) b.elseChildren = updateBlockInTree(b.elseChildren);
              return b;
          });
      };

      setProject(prev => prev ? ({
          ...prev,
          sprites: prev.sprites.map(s => 
              s.id === selectedSpriteId 
              ? { ...s, scripts: updateBlockInTree(s.scripts) }
              : s
          )
      }) : null);
  };

  const removeBlock = (blockId: string) => {
      if(!selectedSpriteId || !project) return;
      
      const filterTree = (blocks: Block[]): Block[] => {
          return blocks.filter(b => b.id !== blockId).map(b => ({
              ...b,
              children: b.children ? filterTree(b.children) : [],
              elseChildren: b.elseChildren ? filterTree(b.elseChildren) : []
          }));
      };

      setProject(prev => prev ? ({
          ...prev,
          sprites: prev.sprites.map(s => 
              s.id === selectedSpriteId 
              ? { ...s, scripts: filterTree(s.scripts) }
              : s
          )
      }) : null);
  }

  // --- RUNTIME ENGINE ---
  
  // Resolve value: literal, variable lookup, or system variable
  const resolveValue = (val: any, spriteId?: string) => {
      if (typeof val === 'string') {
          const s = spriteId ? runtimeSpritesRef.current.find(sp => sp.id === spriteId) : null;
          const lowerVal = val.toLowerCase().trim();

          // System Variables (Reporters)
          if (lowerVal === 'x position' && s) return s.x;
          if (lowerVal === 'y position' && s) return s.y;
          if (lowerVal === 'direction' && s) return s.rotation;
          if (lowerVal === 'size' && s) return s.size;
          if (lowerVal === 'costume number' && s) return s.currentCostumeIndex + 1;
          if (lowerVal === 'backdrop number') return 1; // Mock
          if (lowerVal === 'volume') return 100; // Mock
          if (lowerVal === 'mouse x') return mousePosRef.current.x;
          if (lowerVal === 'mouse y') return mousePosRef.current.y;
          if (lowerVal === 'timer') return (Date.now() - timerStartRef.current) / 1000;
          if (lowerVal === 'username') return user?.name || 'Guest';

          // Custom Variables
          if (runtimeVariablesRef.current.hasOwnProperty(val)) {
              return runtimeVariablesRef.current[val];
          }
          
          // Try parsing as number if it looks like one
          if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
      }
      return val;
  };

  const updateSpriteState = (spriteId: string, updater: (s: Sprite) => void) => {
      const sprites = [...runtimeSpritesRef.current];
      const idx = sprites.findIndex(s => s.id === spriteId);
      if (idx !== -1) {
          const newSprite = { ...sprites[idx] };
          updater(newSprite);
          sprites[idx] = newSprite;
          runtimeSpritesRef.current = sprites;
          setRuntimeSprites(sprites);
      }
  };

  const executeStack = async (blocks: Block[], spriteId: string) => {
      for (const block of blocks) {
          if (!isRunningRef.current) break;
          
          // Resolve params
          const p: Record<string, any> = {};
          for (const key in block.params) {
              p[key] = resolveValue(block.params[key], spriteId);
          }

          switch (block.type) {
              // Motion
              case BlockType.MOVE_STEPS:
                  updateSpriteState(spriteId, s => {
                      const rad = (s.rotation - 90) * (Math.PI / 180);
                      s.x += Math.cos(rad) * (Number(p.STEPS) || 0);
                      s.y += Math.sin(rad) * (Number(p.STEPS) || 0);
                  });
                  break;
              case BlockType.TURN_RIGHT:
                  updateSpriteState(spriteId, s => s.rotation += (Number(p.DEGREES) || 0));
                  break;
              case BlockType.TURN_LEFT:
                  updateSpriteState(spriteId, s => s.rotation -= (Number(p.DEGREES) || 0));
                  break;
              case BlockType.GOTO_XY:
                  updateSpriteState(spriteId, s => { s.x = Number(p.X); s.y = Number(p.Y); });
                  break;
              case BlockType.SET_X:
                  updateSpriteState(spriteId, s => s.x = Number(p.X));
                  break;
              case BlockType.SET_Y:
                  updateSpriteState(spriteId, s => s.y = Number(p.Y));
                  break;
              case BlockType.CHANGE_X:
                  updateSpriteState(spriteId, s => s.x += Number(p.DX));
                  break;
              case BlockType.CHANGE_Y:
                  updateSpriteState(spriteId, s => s.y += Number(p.DY));
                  break;
              case BlockType.GOTO_MOUSE:
                  updateSpriteState(spriteId, s => {
                       // Random position for now as Mouse is tricky in mock
                       s.x = (Math.random() * 400) - 200;
                       s.y = (Math.random() * 300) - 150;
                  });
                  break;
              case BlockType.IF_ON_EDGE_BOUNCE:
                  updateSpriteState(spriteId, s => {
                      if (s.x > 240 || s.x < -240 || s.y > 180 || s.y < -180) {
                          s.rotation = (s.rotation + 180) % 360;
                          // Bump back
                          if(s.x > 240) s.x = 240; if(s.x < -240) s.x = -240;
                          if(s.y > 180) s.y = 180; if(s.y < -180) s.y = -180;
                      }
                  });
                  break;

              // Looks
              case BlockType.SAY:
                  updateSpriteState(spriteId, s => s.bubbleText = String(p.TEXT));
                  break;
              case BlockType.SAY_FOR_SECS:
                  updateSpriteState(spriteId, s => s.bubbleText = String(p.TEXT));
                  await new Promise(r => setTimeout(r, (Number(p.SECS) || 1) * 1000));
                  updateSpriteState(spriteId, s => s.bubbleText = undefined);
                  break;
              case BlockType.CHANGE_COSTUME:
                  updateSpriteState(spriteId, s => { s.currentCostumeIndex = (s.currentCostumeIndex + 1) % s.costumes.length; });
                  break;
              case BlockType.SWITCH_COSTUME:
                  updateSpriteState(spriteId, s => { 
                      const idx = (Number(p.INDEX) - 1); 
                      if(idx >= 0 && idx < s.costumes.length) s.currentCostumeIndex = idx; 
                  });
                  break;
              case BlockType.CHANGE_SIZE:
                  updateSpriteState(spriteId, s => s.size += Number(p.AMOUNT));
                  break;
              case BlockType.SET_SIZE:
                  updateSpriteState(spriteId, s => s.size = Number(p.SIZE));
                  break;
              case BlockType.SHOW:
                  updateSpriteState(spriteId, s => s.visible = true);
                  break;
              case BlockType.HIDE:
                  updateSpriteState(spriteId, s => s.visible = false);
                  break;
              case BlockType.GO_TO_FRONT:
                  // Mock: Just ensuring it's on top of our list render usually does this naturally if last
                  // Reorder sprites array in project would be needed for real depth
                  break;

              // Control
              case BlockType.WAIT:
                  await new Promise(r => setTimeout(r, (Number(p.SECS) || 1) * 1000));
                  break;
              case BlockType.REPEAT:
                  const times = Number(p.TIMES) || 1;
                  for(let i=0; i<times; i++) {
                      if(!isRunningRef.current) break;
                      if(block.children) await executeStack(block.children, spriteId);
                      await new Promise(r => setTimeout(r, 10)); // Yield
                  }
                  break;
              case BlockType.FOREVER:
                  while(isRunningRef.current) {
                      if(block.children) await executeStack(block.children, spriteId);
                      await new Promise(r => setTimeout(r, 10)); // Yield
                  }
                  break;
              case BlockType.IF:
                  // Simple truthy check for now
                  if(p.CONDITION && p.CONDITION !== 'false' && p.CONDITION !== 0) {
                      if(block.children) await executeStack(block.children, spriteId);
                  }
                  break;
              case BlockType.IF_ELSE:
                  if(p.CONDITION && p.CONDITION !== 'false' && p.CONDITION !== 0) {
                      if(block.children) await executeStack(block.children, spriteId);
                  } else {
                      if(block.elseChildren) await executeStack(block.elseChildren, spriteId);
                  }
                  break;
              case BlockType.STOP_ALL:
                  setIsRunning(false);
                  isRunningRef.current = false;
                  break;

              // Sensing
              case BlockType.RESET_TIMER:
                  timerStartRef.current = Date.now();
                  break;

              // Variables
              case BlockType.VAR_SET:
                  const vNameSet = String(block.params.VAR);
                  runtimeVariablesRef.current[vNameSet] = resolveValue(block.params.VAL, spriteId);
                  // Sync if Cloud
                  const vSet = project?.variables.find(v => v.name === vNameSet);
                  if (vSet?.isCloud) localStorage.setItem('cloud_' + vSet.id, String(runtimeVariablesRef.current[vNameSet]));
                  break;
              case BlockType.VAR_CHANGE:
                  const vNameChg = String(block.params.VAR);
                  const currentVal = Number(runtimeVariablesRef.current[vNameChg] || 0);
                  const newVal = currentVal + Number(block.params.VAL);
                  runtimeVariablesRef.current[vNameChg] = newVal;
                  // Sync if Cloud
                  const vChg = project?.variables.find(v => v.name === vNameChg);
                  if (vChg?.isCloud) localStorage.setItem('cloud_' + vChg.id, String(newVal));
                  break;
          }
          await new Promise(r => setTimeout(r, 10)); // Micro-yield
      }
  };

  const startFlagExecution = async () => {
    if (!project) return;
    setIsRunning(true);
    isRunningRef.current = true;
    timerStartRef.current = Date.now();
    
    // Init state
    const initialSprites = JSON.parse(JSON.stringify(project.sprites));
    runtimeSpritesRef.current = initialSprites;
    setRuntimeSprites(initialSprites);

    // Init variables
    const initVars: Record<string, any> = {};
    project.variables.forEach(v => {
        // Use Cloud value if available
        if (v.isCloud) {
            const saved = localStorage.getItem('cloud_' + v.id);
            initVars[v.name] = saved ? Number(saved) : v.value;
        } else {
            initVars[v.name] = v.value;
        }
    });
    runtimeVariablesRef.current = initVars;

    // Execute scripts
    initialSprites.forEach((sprite: Sprite) => {
        sprite.scripts.forEach((block) => {
            if (block.type === BlockType.EVENT_FLAG_CLICKED) {
                // Execute children if we structure it that way, or subsequent blocks? 
                // For this implementation, I am sticking to the "Sequence in Script" model
                // But since I changed Block to have children, linear scripts are weird.
                // Wait, in my addBlock logic, I am just appending to scripts array.
                // I need to handle "Stack" logic.
                
                // FIX: Scripts are arrays of "Root" blocks. 
                // A "When Flag Clicked" block usually has a "next" connection, but in my flat array model, 
                // the subsequent blocks are just next in the array.
                // However, `executeStack` iterates the array. 
                // So if script = [Hat, Move, Move], executeStack does Hat (noop), then Move, then Move.
                // This works fine for linear stacks!
                
                // What about C-blocks? [Hat, Repeat(children=[Move])]
                // executeStack: Hat -> noop. Repeat -> runs executeStack(children).
                // This works perfectly.
                executeStack(sprite.scripts, sprite.id);
            }
        });
    });
  };

  const stopProject = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (project) {
        const resetBubbles = runtimeSpritesRef.current.map(s => ({...s, bubbleText: undefined}));
        runtimeSpritesRef.current = resetBubbles;
        setRuntimeSprites(resetBubbles);
    }
  };

  const handleSpriteClick = (spriteId: string) => {
      if (!isRunning) {
          setIsRunning(true);
          isRunningRef.current = true;
      }
      const sprite = runtimeSpritesRef.current.find(s => s.id === spriteId);
      if (sprite) {
          // Find logic for sprite click
          // We need to find the specific Stack that starts with EVENT_SPRITE_CLICKED
          // But in the flat list, we might have multiple stacks mixed?
          // Simplification: In this editor, a Script is a linear list. We don't support multiple disjoint stacks in one array visually well yet.
          // But `executeStack` iterates all. 
          // So if we have [WhenFlag, Move, WhenClick, Say], it runs all. 
          // Flag ignores WhenClick blocks. 
          
          // Let's filter the stack to start at the trigger?
          // No, proper Scratch execution finds the Hat and runs downwards.
          
          // In the current data model `scripts` is one big list.
          // We should scan for the Hat block and run subsequent blocks until another Hat or End.
          
          // Improved Execution Logic for Events:
          let startIndex = -1;
          for(let i=0; i<sprite.scripts.length; i++) {
              if (sprite.scripts[i].type === BlockType.EVENT_SPRITE_CLICKED) {
                 // Found a trigger. Execute from here until next hat.
                 const subStack = [];
                 for(let j=i+1; j<sprite.scripts.length; j++) {
                     const b = sprite.scripts[j];
                     if (b.type.startsWith('EVENT_')) break; // Stop at next hat
                     subStack.push(b);
                 }
                 executeStack(subStack, spriteId);
              }
          }
      }
  };

  const handleAssetSave = (dataUrl: string) => {
      if(!project) return;
      if (paintTarget === 'backdrop') {
          setProject({ ...project, backdrop: dataUrl });
      } else if (paintTarget === 'sprite') {
          const newSprite: Sprite = {
              id: 'sprite_' + Date.now(),
              name: 'Sprite ' + (project.sprites.length + 1),
              x: 0, 
              y: 0,
              rotation: 90,
              size: 100,
              visible: true,
              costumes: [dataUrl],
              currentCostumeIndex: 0,
              scripts: []
          };
          setProject({ ...project, sprites: [...project.sprites, newSprite]});
          setSelectedSpriteId(newSprite.id);
      } else if (paintTarget === 'costume' && selectedSpriteId) {
          setProject({
              ...project,
              sprites: project.sprites.map(s => 
                  s.id === selectedSpriteId 
                  ? { ...s, costumes: [...s.costumes, dataUrl] }
                  : s
              )
          });
      }
  };

  // --- RENDERING ---

  const renderBlockInputs = (label: string, params: Record<string, any>, blockId: string) => {
      const parts = label.split(/({.*?})/);
      return (
          <div className="flex items-center gap-1 flex-wrap">
              {parts.map((part, idx) => {
                  if (part.startsWith('{') && part.endsWith('}')) {
                      const paramName = part.slice(1, -1);
                      return (
                          <input 
                              key={idx}
                              type="text"
                              value={params[paramName] || ''}
                              onChange={(e) => updateBlockParams(blockId, paramName, e.target.value)}
                              onClick={(e) => e.stopPropagation()} // Prevent drag/click block
                              className="mx-1 h-6 min-w-[30px] w-12 px-1 rounded-full text-center text-black bg-white border border-gray-300 text-xs shadow-inner focus:ring-2 focus:ring-yellow-400 outline-none"
                          />
                      );
                  }
                  return <span key={idx}>{part}</span>;
              })}
          </div>
      );
  };

  // Recursive Block Renderer
  const BlockRenderer = ({ block, index, depth = 0 }: { block: Block, index: number, depth?: number }) => {
      const def = BLOCK_REGISTRY.find(b => b.type === block.type);
      const catDef = CATEGORIES.find(c => c.id === def?.category);
      
      const isHat = def?.shape === 'hat';
      const isCBlock = def?.shape === 'c-block';
      const isCap = def?.shape === 'cap';
      const isReporter = def?.shape === 'reporter' || def?.shape === 'boolean';
      
      return (
          <div className="flex flex-col items-start">
             {/* Main Block Header */}
             <div className={`
                relative group flex items-center gap-2 px-3 py-2
                ${catDef?.color || 'bg-gray-500'} ${catDef?.border || 'border-gray-600'} ${catDef?.text || 'text-white'}
                ${isHat ? 'rounded-t-2xl rounded-br-lg mt-4 mb-1' : 'rounded-lg my-[1px]'}
                ${isCBlock ? 'rounded-br-none' : ''}
                ${isReporter ? 'rounded-full px-4' : ''}
                border-b-2 shadow-sm cursor-grab active:cursor-grabbing select-none
             `}>
                 {def?.icon && <def.icon size={16} />}
                 <div className="font-bold text-xs">
                    {renderBlockInputs(def?.label || block.type, block.params, block.id)}
                 </div>
                 
                 <button 
                    onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                    className="ml-2 text-white/50 hover:text-white"
                 >
                     <Trash2 size={14} />
                 </button>
             </div>

             {/* C-Block Body */}
             {isCBlock && (
                 <div className={`pl-4 border-l-4 ${catDef?.border || 'border-gray-600'} flex flex-col w-full min-h-[40px] bg-black/5`}>
                     {/* Nested Blocks */}
                     {block.children && block.children.map((child, i) => (
                         <BlockRenderer key={child.id} block={child} index={i} depth={depth + 1} />
                     ))}
                     {/* Drop hint if empty */}
                     {(!block.children || block.children.length === 0) && (
                         <div className="text-[10px] text-gray-400 p-2 italic">Drag blocks here (todo)</div>
                     )}
                     
                     {/* C-Block Footer */}
                     <div className={`h-4 ${catDef?.color} w-full rounded-b-lg -ml-1 mt-[1px] opacity-90`}></div>
                 </div>
             )}
             
             {/* If Else second part */}
             {block.type === BlockType.IF_ELSE && (
                 <>
                    <div className={`px-3 py-1 ${catDef?.color} ${catDef?.border} border-l-4 border-b text-xs font-bold text-white w-full`}>else</div>
                    <div className={`pl-4 border-l-4 ${catDef?.border} flex flex-col w-full min-h-[40px] bg-black/5`}>
                        {block.elseChildren && block.elseChildren.map((child, i) => (
                             <BlockRenderer key={child.id} block={child} index={i} depth={depth + 1} />
                        ))}
                         <div className={`h-4 ${catDef?.color} w-full rounded-b-lg -ml-1 mt-[1px] opacity-90`}></div>
                    </div>
                 </>
             )}
          </div>
      );
  };

  // --- AUTH GUARD ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">Welcome to Spark Code</h1>
            <p className="text-gray-500 mb-6">Create, code, and share your interactive stories.</p>
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    required
                />
                <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {isLoggingIn ? 'Logging in...' : 'Start Creating'}
                </button>
            </form>
            <p className="mt-4 text-xs text-gray-400">No password required for this demo.</p>
        </div>
      </div>
    );
  }

  if (!project) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  const activeSprite = project.sprites.find(s => s.id === selectedSpriteId);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      
      {/* Top Menu Bar */}
      <div className="bg-indigo-700 text-white p-2 flex items-center justify-between shadow-md z-20 shrink-0 h-14">
         <div className="flex items-center gap-4">
             <input 
                className="bg-indigo-800 border border-indigo-600 rounded px-2 py-1 text-sm font-medium focus:ring-1 focus:ring-white outline-none w-48"
                value={project.title}
                onChange={e => setProject({...project, title: e.target.value})}
             />
         </div>
         <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-400 rounded text-sm font-medium transition-colors">
             <Save size={16} /> Save Now
         </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: Categories & Blocks */}
          <div className="flex w-80 flex-shrink-0 border-r border-gray-200">
             
             {/* Category Tabs */}
             <div className="w-20 flex flex-col items-center py-4 gap-3 border-r border-gray-100 overflow-y-auto bg-gray-50">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex flex-col items-center gap-1 group w-full px-1"
                  >
                    <div className={`w-5 h-5 rounded-full ${cat.color} ${activeCategory === cat.id ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}></div>
                    <span className={`text-[10px] font-medium ${activeCategory === cat.id ? 'text-indigo-600' : 'text-gray-400'}`}>{cat.label}</span>
                  </button>
                ))}
             </div>

             {/* Block Palette */}
             <div className="flex-1 bg-gray-50 overflow-y-auto p-2 scrollbar-thin">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">{CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
                
                {/* Special Variables UI */}
                {activeCategory === 'variables' && (
                    <div className="mb-4">
                        <button 
                            onClick={() => setShowVarModal(true)}
                            className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold text-gray-700 mb-4"
                        >
                            Make a Variable
                        </button>
                        <div className="space-y-2">
                            {project.variables.map(v => (
                                <div key={v.id} className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-full shadow-sm text-xs font-bold">
                                    <span>{v.name}</span>
                                    {v.isCloud && <span className="text-[8px] bg-orange-700 px-1 rounded">☁️</span>}
                                </div>
                            ))}
                        </div>
                        <div className="my-2 border-t"></div>
                    </div>
                )}

                <div className="space-y-2 pb-10">
                    {BLOCK_REGISTRY.filter(b => b.category === activeCategory).map(def => {
                      const catDef = CATEGORIES.find(c => c.id === def.category);
                      const isHat = def.shape === 'hat';
                      const isReporter = def.shape === 'reporter' || def.shape === 'boolean';
                      
                      return (
                        <div 
                          key={def.type}
                          onClick={() => addBlock(def.type, def.defaultParams, def.shape)}
                          className={`
                            ${catDef?.color} ${catDef?.border} text-white 
                            p-2 px-3 
                            ${isHat ? 'rounded-t-xl rounded-br-lg mt-2' : isReporter ? 'rounded-full px-4' : 'rounded-lg'}
                            border-b-2
                            cursor-pointer shadow-sm hover:brightness-110 transition-all 
                            flex items-center gap-2 text-xs font-bold select-none
                          `}
                        >
                          {def.icon && <def.icon size={14} />}
                          <span>{def.label.replace(/{.*?}/g, ' [ ] ')}</span>
                        </div>
                      )
                    })}
                </div>
             </div>
          </div>

          {/* MIDDLE COLUMN: Script Area */}
          <div className="flex-1 bg-white flex flex-col relative overflow-hidden min-w-[300px]">
             <div className="p-2 bg-gray-50 border-b flex justify-between items-center h-10 shrink-0">
                 <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                     <Code2 size={14} />
                     {activeSprite ? `Scripts for ${activeSprite.name}` : 'No Sprite Selected'}
                 </span>
                 <div className="flex gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-400"><Plus size={16} /></button>
                 </div>
             </div>
             
             <div className="flex-1 p-6 overflow-auto bg-dots">
                 {activeSprite && activeSprite.scripts.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-gray-300 pointer-events-none">
                         <Code2 className="w-16 h-16 mb-4 opacity-20" />
                         <p className="text-sm">Drag blocks here to start coding</p>
                     </div>
                 )}
                 {activeSprite?.scripts.map((block, idx) => (
                     <BlockRenderer key={block.id} block={block} index={idx} />
                 ))}
             </div>
          </div>

          {/* RIGHT COLUMN: Stage & Sprites */}
          <div className="w-[440px] flex-shrink-0 bg-gray-100 border-l border-gray-200 flex flex-col">
             
             {/* Top: Stage Control Header */}
             <div className="p-2 bg-white border-b flex justify-between items-center h-10 shrink-0">
                 <div className="flex items-center gap-2">
                    <button onClick={startFlagExecution} className="p-1 bg-green-100 hover:bg-green-200 rounded text-green-600 transition-colors">
                        <Flag className="fill-current w-5 h-5" />
                    </button>
                    <button onClick={stopProject} className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors">
                        <Square className="fill-current w-5 h-5" />
                    </button>
                 </div>
                 <div className="flex gap-2 text-gray-400">
                    <LayoutTemplate size={16} />
                 </div>
             </div>

             {/* Stage Preview */}
             <div className="p-4 flex justify-center bg-gray-200">
                <div className="relative bg-white w-[400px] h-[300px] shadow-lg overflow-hidden select-none rounded border border-gray-300">
                    {/* Backdrop */}
                    {project.backdrop ? (
                        <img src={project.backdrop} alt="bg" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-white"></div>
                    )}
                    
                    {/* Sprites */}
                    {(isRunning ? runtimeSprites : project.sprites).map(sprite => sprite.visible !== false && (
                        <div
                            key={sprite.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSpriteClick(sprite.id);
                            }}
                            className="absolute transform transition-transform duration-100 will-change-transform cursor-pointer hover:brightness-110"
                            style={{
                                left: '50%',
                                top: '50%',
                                width: `${sprite.size}px`,
                                height: `${sprite.size}px`,
                                transform: `translate(${sprite.x}px, ${-sprite.y}px) rotate(${sprite.rotation - 90}deg) translate(-50%, -50%)`,
                            }}
                        >
                            {sprite.bubbleText && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-800 rounded-xl px-3 py-1 text-sm whitespace-nowrap z-20 shadow-md">
                                    {sprite.bubbleText}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-gray-800 transform rotate-45"></div>
                                </div>
                            )}
                            <img 
                                src={sprite.costumes[sprite.currentCostumeIndex]} 
                                alt={sprite.name} 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ))}
                    
                    {/* Variable Watchers (Simple Overlay) */}
                    <div className="absolute top-2 left-2 flex flex-col gap-2 pointer-events-none">
                        {project.variables.filter(v => v.value !== undefined).map(v => (
                             <div key={v.id} className="bg-gray-100/90 border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-600 shadow-sm flex gap-2">
                                 <span>{v.name}</span>
                                 <span className="bg-orange-500 text-white px-1.5 rounded">{runtimeVariablesRef.current[v.name] ?? v.value}</span>
                             </div>
                        ))}
                    </div>
                </div>
             </div>

             {/* Bottom: Sprite & Stage Pane */}
             <div className="flex-1 bg-white p-2 border-t border-gray-200 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 px-1">
                     <span className="text-xs font-bold text-gray-500 uppercase">Sprites</span>
                     <span className="text-xs font-bold text-gray-500 uppercase">Stage</span>
                </div>

                <div className="flex-1 flex gap-2 overflow-hidden">
                    {/* Sprite List */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 content-start pr-1">
                        {project.sprites.map(s => (
                             <div 
                                key={s.id}
                                onClick={() => setSelectedSpriteId(s.id)}
                                className={`group aspect-square rounded-lg cursor-pointer border-2 transition-all flex flex-col items-center justify-center p-1 relative ${selectedSpriteId === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                             >
                                 <div className="w-full h-full flex items-center justify-center mb-1">
                                    <img src={s.costumes[0]} alt={s.name} className="max-w-[80%] max-h-[80%]" />
                                 </div>
                                 <div className="text-[10px] text-center w-full truncate px-1 text-gray-600">{s.name}</div>
                                 
                                 {/* Edit Button */}
                                 <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSpriteId(s.id);
                                        setPaintTarget('costume');
                                        setShowPaint(true);
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-white border rounded-full opacity-0 group-hover:opacity-100 hover:bg-indigo-50 transition-opacity"
                                    title="Edit Costume"
                                 >
                                    <Pencil size={10} className="text-indigo-600" />
                                 </button>
                             </div>
                        ))}
                        
                        {/* New Sprite Button */}
                        <button 
                            onClick={() => { setPaintTarget('sprite'); setShowPaint(true); }}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors gap-1"
                        >
                            <Plus size={24} />
                            <span className="text-[10px] font-medium">New</span>
                        </button>
                    </div>

                    {/* Stage/Backdrop Tile */}
                    <div className="w-24 flex-shrink-0 flex flex-col gap-2 border-l pl-2">
                        <div 
                            onClick={() => { setPaintTarget('backdrop'); setShowPaint(true); }}
                            className="w-full aspect-[4/3] bg-gray-100 rounded border hover:border-indigo-400 cursor-pointer overflow-hidden relative group"
                        >
                            {project.backdrop ? (
                                <img src={project.backdrop} alt="Stage" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white"></div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <Pencil className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={20} />
                            </div>
                        </div>
                        <div className="text-[10px] text-center text-gray-500">Backdrops</div>
                        
                        {/* Sprite properties editor */}
                        {activeSprite && (
                            <div className="mt-auto border-t pt-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-gray-400">X</label>
                                        <input 
                                            type="number" 
                                            value={activeSprite.x}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, x: val} : s) }) : null);
                                            }}
                                            className="border rounded px-1 text-sm w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-gray-400">Y</label>
                                        <input 
                                            type="number" 
                                            value={activeSprite.y}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, y: val} : s) }) : null);
                                            }}
                                            className="border rounded px-1 text-sm w-full"
                                        />
                                    </div>
                                     <div className="flex flex-col">
                                        <label className="text-[10px] text-gray-400">Size</label>
                                        <input 
                                            type="number" 
                                            value={activeSprite.size}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, size: val} : s) }) : null);
                                            }}
                                            className="border rounded px-1 text-sm w-full"
                                        />
                                    </div>
                                     <div className="flex flex-col">
                                        <label className="text-[10px] text-gray-400">Dir</label>
                                        <input 
                                            type="number" 
                                            value={activeSprite.rotation}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, rotation: val} : s) }) : null);
                                            }}
                                            className="border rounded px-1 text-sm w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </div>
      </div>

      {showPaint && (
          <PaintModal 
            initialImage={
                paintTarget === 'sprite' ? undefined : 
                paintTarget === 'backdrop' ? project.backdrop : 
                (activeSprite?.costumes[activeSprite.currentCostumeIndex || 0])
            }
            isBackground={paintTarget === 'backdrop'}
            onClose={() => setShowPaint(false)}
            onSave={handleAssetSave}
          />
      )}

      {showVarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">New Variable</h3>
                  <input 
                    type="text" 
                    placeholder="Variable name" 
                    className="w-full border p-2 rounded mb-4"
                    value={newVarName}
                    onChange={e => setNewVarName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mb-6">
                      <input 
                        type="checkbox" 
                        id="cloud"
                        checked={isCloudVar}
                        onChange={e => setIsCloudVar(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <label htmlFor="cloud" className="text-sm text-gray-700 select-none">Cloud Variable (Stored on server)</label>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowVarModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={createVariable} className="px-4 py-2 bg-indigo-600 text-white rounded font-medium">OK</button>
                  </div>
              </div>
          </div>
      )}
      
      <style>{`
        .bg-dots {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default Editor;