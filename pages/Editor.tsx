import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Project, Sprite, Block, BlockType, User } from '../types';
import { createNewProject, getProjects, saveProject, login } from '../services/storage';
import { Play, Square, Save, RotateCcw, Image as ImageIcon, Plus, Trash2, MousePointer2, Move, RotateCw, MessageSquare, Clock, Repeat, Shirt, Code2, LayoutTemplate, Flag, MousePointerClick } from 'lucide-react';
import PaintModal from '../components/PaintModal';

// Category Definitions
const CATEGORIES = [
  { id: 'events', label: 'Events', color: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-600' },
  { id: 'motion', label: 'Motion', color: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-600' },
  { id: 'looks', label: 'Looks', color: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-600' },
  { id: 'control', label: 'Control', color: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600' },
];

const BLOCK_DEFINITIONS = [
  { type: BlockType.EVENT_FLAG_CLICKED, label: 'When 🚩 clicked', category: 'events', icon: Flag },
  { type: BlockType.EVENT_SPRITE_CLICKED, label: 'When this sprite clicked', category: 'events', icon: MousePointerClick },
  { type: BlockType.MOVE_STEPS, label: 'Move 10 steps', category: 'motion', icon: Move },
  { type: BlockType.TURN_RIGHT, label: 'Turn right 15°', category: 'motion', icon: RotateCw },
  { type: BlockType.TURN_LEFT, label: 'Turn left 15°', category: 'motion', icon: RotateCcw },
  { type: BlockType.GOTO_XY, label: 'Go to x:0 y:0', category: 'motion', icon: MousePointer2 },
  { type: BlockType.SAY, label: 'Say Hello', category: 'looks', icon: MessageSquare },
  { type: BlockType.CHANGE_COSTUME, label: 'Next Costume', category: 'looks', icon: Shirt },
  { type: BlockType.WAIT, label: 'Wait 1 sec', category: 'control', icon: Clock },
  { type: BlockType.REPEAT, label: 'Repeat 4', category: 'control', icon: Repeat },
];

interface EditorProps {
  user: User | null;
  setUser: (u: User) => void;
}

const Editor: React.FC<EditorProps> = ({ user, setUser }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('events');
  const [isRunning, setIsRunning] = useState(false);
  
  // Paint Modal State
  const [showPaint, setShowPaint] = useState(false);
  const [paintTarget, setPaintTarget] = useState<'sprite' | 'backdrop' | 'costume'>('sprite');
  
  // Runtime State
  const [runtimeSprites, setRuntimeSprites] = useState<Sprite[]>([]);
  const runtimeSpritesRef = useRef<Sprite[]>([]);
  const isRunningRef = useRef(false);

  // Auth State
  const [emailInput, setEmailInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (projectId) {
      const projects = getProjects();
      const found = projects.find(p => p.id === projectId);
      if (found) {
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

  const addBlock = (type: BlockType) => {
    if (!selectedSpriteId || !project) return;
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      params: {}
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

  const removeBlock = (blockId: string) => {
      if(!selectedSpriteId || !project) return;
      setProject(prev => {
          if(!prev) return null;
          return {
              ...prev,
              sprites: prev.sprites.map(s => 
                  s.id === selectedSpriteId
                  ? { ...s, scripts: s.scripts.filter(b => b.id !== blockId) }
                  : s
              )
          }
      })
  }

  // --- Runtime Engine ---
  
  // Helper to update a specific sprite in the ref
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

  const executeScript = async (spriteId: string, startIndex: number) => {
      const sprite = runtimeSpritesRef.current.find(s => s.id === spriteId);
      if (!sprite) return;

      const scripts = sprite.scripts;
      
      for (let i = startIndex; i < scripts.length; i++) {
          // If we hit another Hat block, stop execution of this thread
          if (i !== startIndex && (scripts[i].type === BlockType.EVENT_FLAG_CLICKED || scripts[i].type === BlockType.EVENT_SPRITE_CLICKED)) {
              break;
          }

          if (!isRunningRef.current) break;

          const block = scripts[i];
          
          switch (block.type) {
            case BlockType.MOVE_STEPS:
                updateSpriteState(spriteId, (s) => {
                    const rad = (s.rotation - 90) * (Math.PI / 180);
                    s.x += Math.cos(rad) * 10;
                    s.y += Math.sin(rad) * 10;
                    // Boundary checks
                    if (s.x > 240) s.x = 240;
                    if (s.x < -240) s.x = -240;
                    if (s.y > 180) s.y = 180;
                    if (s.y < -180) s.y = -180;
                });
                break;
            case BlockType.TURN_RIGHT:
                updateSpriteState(spriteId, (s) => s.rotation += 15);
                break;
            case BlockType.TURN_LEFT:
                updateSpriteState(spriteId, (s) => s.rotation -= 15);
                break;
            case BlockType.GOTO_XY:
                updateSpriteState(spriteId, (s) => { s.x = 0; s.y = 0; });
                break;
            case BlockType.SAY:
                updateSpriteState(spriteId, (s) => s.bubbleText = "Hello!");
                await new Promise(r => setTimeout(r, 1000));
                updateSpriteState(spriteId, (s) => s.bubbleText = undefined);
                break;
            case BlockType.CHANGE_COSTUME:
                updateSpriteState(spriteId, (s) => {
                    s.currentCostumeIndex = (s.currentCostumeIndex + 1) % s.costumes.length;
                });
                break;
            case BlockType.WAIT:
                 await new Promise(r => setTimeout(r, 1000));
                 break;
            case BlockType.REPEAT:
                 // Simplified repeat: repeats the NEXT block 4 times
                 // In a real implementation, this requires a nested structure or jump logic
                 // For this flat list prototype, we'll just skip complex nesting logic or hardcode a small loop for the next block
                 break;
        }
        // Small delay to visualize execution steps
        await new Promise(r => setTimeout(r, 50));
      }
  };

  const startFlagExecution = async () => {
    if (!project) return;
    setIsRunning(true);
    isRunningRef.current = true;
    
    // Reset sprites to initial project state
    const initialSprites = JSON.parse(JSON.stringify(project.sprites));
    runtimeSpritesRef.current = initialSprites;
    setRuntimeSprites(initialSprites);

    // Find and execute "When Flag Clicked" stacks
    initialSprites.forEach((sprite: Sprite) => {
        sprite.scripts.forEach((block, index) => {
            if (block.type === BlockType.EVENT_FLAG_CLICKED) {
                // Execute blocks AFTER the hat block
                executeScript(sprite.id, index + 1);
            }
        });
        
        // Backward compatibility: if no hat blocks exist, just run from top
        const hasHat = sprite.scripts.some(b => b.type === BlockType.EVENT_FLAG_CLICKED || b.type === BlockType.EVENT_SPRITE_CLICKED);
        if (!hasHat && sprite.scripts.length > 0) {
            executeScript(sprite.id, 0);
        }
    });
  };

  const stopProject = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (project) {
        // Optional: Reset state or just stop updates. 
        // Scratch keeps state where it ended, but stop usually clears bubbles.
        const resetBubbles = runtimeSpritesRef.current.map(s => ({...s, bubbleText: undefined}));
        runtimeSpritesRef.current = resetBubbles;
        setRuntimeSprites(resetBubbles);
    }
  };

  const handleSpriteClick = (spriteId: string) => {
      // Even if not "Running" (Green Flag), click events work in Scratch
      // But we should ensure we are working on the runtime sprites
      if (!isRunning) {
          setIsRunning(true);
          isRunningRef.current = true;
          // If starting fresh from stop, maybe sync ref? 
          // For now, let's assume we operate on current visual state.
      }

      const sprite = runtimeSpritesRef.current.find(s => s.id === spriteId);
      if (sprite) {
          sprite.scripts.forEach((block, index) => {
              if (block.type === BlockType.EVENT_SPRITE_CLICKED) {
                  executeScript(spriteId, index + 1);
              }
          });
      }
  };

  // --- Asset Management ---
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

  // Auth Screen
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

      {/* Main Three-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: Categories & Blocks */}
          <div className="flex w-80 flex-shrink-0 border-r border-gray-200">
             
             {/* Category Tabs */}
             <div className="w-16 flex flex-col items-center py-4 gap-4 border-r border-gray-100 overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex flex-col items-center gap-1 group w-full"
                  >
                    <div className={`w-6 h-6 rounded-full ${cat.color} ${activeCategory === cat.id ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}></div>
                    <span className={`text-[10px] font-medium ${activeCategory === cat.id ? cat.text : 'text-gray-400'}`}>{cat.label}</span>
                  </button>
                ))}
             </div>

             {/* Block Palette */}
             <div className="flex-1 bg-gray-50 overflow-y-auto p-2 scrollbar-thin">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">{CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
                <div className="space-y-2">
                    {BLOCK_DEFINITIONS.filter(b => b.category === activeCategory).map(block => {
                      const catDef = CATEGORIES.find(c => c.id === block.category);
                      const isHat = block.type === BlockType.EVENT_FLAG_CLICKED || block.type === BlockType.EVENT_SPRITE_CLICKED;
                      return (
                        <div 
                          key={block.type}
                          onClick={() => addBlock(block.type)}
                          className={`${catDef?.color} text-white p-3 ${isHat ? 'rounded-t-xl rounded-b-lg mt-2' : 'rounded-lg'} cursor-pointer shadow-sm hover:shadow-md hover:brightness-110 transition-all flex items-center gap-2 text-xs font-medium select-none`}
                        >
                          <block.icon size={14} />
                          {block.label}
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
                 {activeSprite?.scripts.map((block, idx) => {
                     const def = BLOCK_DEFINITIONS.find(b => b.type === block.type);
                     const catDef = CATEGORIES.find(c => c.id === def?.category);
                     const isHat = block.type === BlockType.EVENT_FLAG_CLICKED || block.type === BlockType.EVENT_SPRITE_CLICKED;
                     // Check if previous block was a Hat or a regular block to determine connector
                     const isFirst = idx === 0;
                     const prevBlock = idx > 0 ? activeSprite.scripts[idx-1] : null;
                     const prevIsHat = prevBlock ? (prevBlock.type === BlockType.EVENT_FLAG_CLICKED || prevBlock.type === BlockType.EVENT_SPRITE_CLICKED) : false;
                     
                     // If it's a hat block, add some spacing if it's not the first block
                     const marginTop = (isHat && !isFirst) ? 'mt-6' : 'mt-1';

                     return (
                         <div key={block.id} className={`relative group w-fit ${marginTop}`}>
                             <div className={`${catDef?.color || 'bg-gray-500'} text-white p-3 ${isHat ? 'rounded-t-xl rounded-b-md' : 'rounded-md'} shadow-sm inline-flex items-center gap-2 text-sm font-medium cursor-grab active:cursor-grabbing`}>
                                 {def?.icon && <def.icon size={16} />}
                                 {def?.label}
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                className="absolute -right-8 top-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <Trash2 size={16} />
                             </button>
                             {/* Connector Line logic: visual only */}
                             {idx < activeSprite.scripts.length - 1 && !isHat && (
                                 <div className={`w-1.5 h-1 ml-4 ${catDef?.color || 'bg-gray-500'}`}></div>
                             )}
                         </div>
                     );
                 })}
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
                    {(isRunning ? runtimeSprites : project.sprites).map(sprite => (
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
                                className={`aspect-square rounded-lg cursor-pointer border-2 transition-all flex flex-col items-center justify-center p-1 relative ${selectedSpriteId === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                             >
                                 <div className="w-full h-full flex items-center justify-center mb-1">
                                    <img src={s.costumes[0]} alt={s.name} className="max-w-[80%] max-h-[80%]" />
                                 </div>
                                 <div className="text-[10px] text-center w-full truncate px-1 text-gray-600">{s.name}</div>
                                 
                                 {selectedSpriteId === s.id && (
                                     <div className="absolute top-1 right-1">
                                         <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                     </div>
                                 )}
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
                                <ImageIcon className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={20} />
                            </div>
                        </div>
                        <div className="text-[10px] text-center text-gray-500">Backdrops</div>
                        
                        {activeSprite && (
                            <div className="mt-auto border-t pt-2 space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>X</span>
                                    <input 
                                        type="number" 
                                        value={activeSprite.x}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, x: val} : s) }) : null);
                                        }}
                                        className="w-12 border rounded px-1 text-right"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Y</span>
                                    <input 
                                        type="number" 
                                        value={activeSprite.y}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, y: val} : s) }) : null);
                                        }}
                                        className="w-12 border rounded px-1 text-right"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Size</span>
                                    <input 
                                        type="number" 
                                        value={activeSprite.size}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setProject(prev => prev ? ({ ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, size: val} : s) }) : null);
                                        }}
                                        className="w-12 border rounded px-1 text-right"
                                    />
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
                (activeSprite?.costumes[0])
            }
            isBackground={paintTarget === 'backdrop'}
            onClose={() => setShowPaint(false)}
            onSave={handleAssetSave}
          />
      )}
      
      <style>{`
        .bg-dots {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
        }
        /* Custom scrollbar for blocks */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default Editor;
