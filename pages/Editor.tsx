import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Project, Sprite, Block, BlockType, User, DEFAULT_SPRITE_IMAGE } from '../types';
import { createNewProject, getProjects, saveProject, login } from '../services/storage';
import { Play, Pause, Square, Save, RotateCcw, Image as ImageIcon, Plus, Trash2, MousePointer2, Move, RotateCw, MessageSquare, Clock, Repeat, Shirt, Code2 } from 'lucide-react';
import PaintModal from '../components/PaintModal';

const BLOCK_DEFINITIONS = [
  { type: BlockType.MOVE_STEPS, label: 'Move 10 steps', color: 'bg-blue-500', icon: Move },
  { type: BlockType.TURN_RIGHT, label: 'Turn right 15°', color: 'bg-blue-500', icon: RotateCw },
  { type: BlockType.TURN_LEFT, label: 'Turn left 15°', color: 'bg-blue-500', icon: RotateCcw },
  { type: BlockType.GOTO_XY, label: 'Go to x:0 y:0', color: 'bg-blue-500', icon: MousePointer2 },
  { type: BlockType.SAY, label: 'Say Hello', color: 'bg-purple-500', icon: MessageSquare },
  { type: BlockType.CHANGE_COSTUME, label: 'Next Costume', color: 'bg-purple-500', icon: Shirt },
  { type: BlockType.WAIT, label: 'Wait 1 sec', color: 'bg-orange-500', icon: Clock },
  { type: BlockType.REPEAT, label: 'Repeat 4', color: 'bg-orange-500', icon: Repeat },
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
  const [isRunning, setIsRunning] = useState(false);
  
  // Paint Modal State
  const [showPaint, setShowPaint] = useState(false);
  const [paintTarget, setPaintTarget] = useState<'sprite' | 'backdrop' | 'costume'>('sprite');
  
  // Runtime State
  const [runtimeSprites, setRuntimeSprites] = useState<Sprite[]>([]);

  // Auth State (Simple modal simulation)
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
        if (found.sprites.length > 0) setSelectedSpriteId(found.sprites[0].id);
      } else {
        // Fallback for demo
        const newP = createNewProject(user);
        setProject(newP);
        setRuntimeSprites(newP.sprites);
        setSelectedSpriteId(newP.sprites[0].id);
      }
    } else {
      const newP = createNewProject(user);
      setProject(newP);
      setRuntimeSprites(newP.sprites);
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
  const stopProject = () => {
    setIsRunning(false);
    if (project) {
        // Reset sprites to initial state (simplification: just clear bubbles, reset position could be added)
        setRuntimeSprites(project.sprites.map(s => ({...s, bubbleText: undefined})));
    }
  };

  const runProject = async () => {
    if (!project) return;
    setIsRunning(true);
    
    // Deep copy initial state
    let currentSprites = JSON.parse(JSON.stringify(project.sprites));
    setRuntimeSprites(currentSprites);

    // This is a simplified synchronous interpreter for demo purposes
    // A real Scratch engine requires a complex VM with async yields
    const executeBlock = async (sprite: Sprite, block: Block) => {
        switch (block.type) {
            case BlockType.MOVE_STEPS:
                const rad = (sprite.rotation - 90) * (Math.PI / 180);
                sprite.x += Math.cos(rad) * 10;
                sprite.y += Math.sin(rad) * 10;
                break;
            case BlockType.TURN_RIGHT:
                sprite.rotation += 15;
                break;
            case BlockType.TURN_LEFT:
                sprite.rotation -= 15;
                break;
            case BlockType.GOTO_XY:
                sprite.x = 0;
                sprite.y = 0;
                break;
            case BlockType.SAY:
                sprite.bubbleText = "Hello!";
                // In a real app we'd wait, here we just set it. 
                // We'd need a delay to clear it, but let's keep it simple.
                break;
            case BlockType.CHANGE_COSTUME:
                sprite.currentCostumeIndex = (sprite.currentCostumeIndex + 1) % sprite.costumes.length;
                break;
            case BlockType.WAIT:
                 await new Promise(r => setTimeout(r, 1000));
                 break;
        }
        // Bounds checking
        if (sprite.x > 240) sprite.x = 240;
        if (sprite.x < -240) sprite.x = -240;
        if (sprite.y > 180) sprite.y = 180;
        if (sprite.y < -180) sprite.y = -180;
    };

    // Very naive run loop: execute all scripts once
    // A real engine runs a loop 60fps
    for (let i=0; i < 50; i++) { // Run 50 frames
       if(!isRunning) break; // Check interrupt (won't work well in this sync loop without yields)
       
       const nextSprites = [...currentSprites];
       for(let sIdx = 0; sIdx < nextSprites.length; sIdx++) {
           const sprite = nextSprites[sIdx];
           for (const block of sprite.scripts) {
               await executeBlock(sprite, block);
           }
       }
       setRuntimeSprites([...nextSprites]);
       await new Promise(r => setTimeout(r, 100)); // Frame delay
    }
    
    setIsRunning(false);
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
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Toolbar */}
      <div className="bg-indigo-700 text-white p-2 flex items-center justify-between shadow-md z-10">
         <div className="flex items-center gap-4">
             <input 
                className="bg-indigo-800 border border-indigo-600 rounded px-2 py-1 text-sm font-medium focus:ring-1 focus:ring-white outline-none"
                value={project.title}
                onChange={e => setProject({...project, title: e.target.value})}
             />
             <div className="flex items-center gap-2 bg-indigo-900/50 rounded-lg p-1">
                 <button onClick={runProject} disabled={isRunning} className="p-1 hover:bg-green-600 rounded text-green-400 hover:text-white transition-colors">
                     <Play className="fill-current w-6 h-6" />
                 </button>
                 <button onClick={stopProject} className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors">
                     <Square className="fill-current w-6 h-6" />
                 </button>
             </div>
         </div>
         <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-400 rounded text-sm font-medium transition-colors">
             <Save size={16} /> Save
         </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
          
          {/* Left: Block Palette */}
          <div className="w-full md:w-64 bg-gray-100 border-r border-gray-200 flex flex-col flex-shrink-0">
              <div className="p-2 bg-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">Blocks</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {BLOCK_DEFINITIONS.map(block => (
                      <div 
                        key={block.type}
                        onClick={() => addBlock(block.type)}
                        className={`${block.color} text-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md hover:brightness-110 transition-all flex items-center gap-2 text-sm font-medium select-none`}
                      >
                        <block.icon size={16} />
                        {block.label}
                      </div>
                  ))}
              </div>
          </div>

          {/* Middle: Script Area */}
          <div className="flex-1 bg-gray-50 flex flex-col relative overflow-hidden">
             <div className="p-2 bg-white border-b flex justify-between items-center h-10">
                 <span className="text-xs font-bold text-gray-400 uppercase">
                     {activeSprite ? `Coding: ${activeSprite.name}` : 'No Sprite Selected'}
                 </span>
             </div>
             <div className="flex-1 p-4 overflow-auto bg-dots">
                 {activeSprite && activeSprite.scripts.length === 0 && (
                     <div className="text-center mt-20 text-gray-400">
                         <Code2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                         <p>Click blocks to add them here</p>
                     </div>
                 )}
                 {activeSprite?.scripts.map((block, idx) => {
                     const def = BLOCK_DEFINITIONS.find(b => b.type === block.type);
                     return (
                         <div key={block.id} className="relative group mb-1">
                             <div className={`${def?.color || 'bg-gray-500'} text-white p-3 rounded-lg shadow-sm inline-flex items-center gap-2 text-sm font-medium`}>
                                 {def?.icon && <def.icon size={16} />}
                                 {def?.label}
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                className="absolute -right-8 top-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <Trash2 size={16} />
                             </button>
                             {/* Connector Line */}
                             {idx < activeSprite.scripts.length - 1 && (
                                 <div className={`w-1 h-3 ml-4 ${def?.color || 'bg-gray-500'}`}></div>
                             )}
                         </div>
                     );
                 })}
             </div>
          </div>

          {/* Right: Stage & Sprites */}
          <div className="w-full md:w-[480px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
             {/* Stage */}
             <div className="relative bg-gray-200 w-full aspect-[4/3] overflow-hidden select-none">
                 {/* Backdrop */}
                 {project.backdrop && (
                     <img src={project.backdrop} alt="bg" className="absolute inset-0 w-full h-full object-cover" />
                 )}
                 
                 {/* Sprites */}
                 {/* We display runtime sprites if running, else editor sprites */}
                 {(isRunning ? runtimeSprites : project.sprites).map(sprite => (
                     <div
                        key={sprite.id}
                        className="absolute transform transition-transform duration-100 will-change-transform"
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

             {/* Sprite Management Pane */}
             <div className="flex-1 bg-white p-2 flex flex-col border-t border-gray-200">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-gray-500 uppercase">Sprites</span>
                     <div className="flex gap-2">
                        <button 
                            onClick={() => { setPaintTarget('backdrop'); setShowPaint(true); }}
                            className="p-1.5 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 flex items-center gap-1"
                        >
                            <ImageIcon size={14} /> Stage
                        </button>
                        <button 
                            onClick={() => { setPaintTarget('sprite'); setShowPaint(true); }}
                            className="p-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 shadow-sm"
                        >
                            <Plus size={14} /> New Sprite
                        </button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-2 space-x-2">
                     {project.sprites.map(s => (
                         <div 
                            key={s.id}
                            onClick={() => setSelectedSpriteId(s.id)}
                            className={`inline-block w-20 p-2 rounded-lg cursor-pointer border-2 transition-all ${selectedSpriteId === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-gray-100'}`}
                         >
                             <div className="w-16 h-16 bg-white rounded border border-gray-200 mb-1 flex items-center justify-center overflow-hidden">
                                 <img src={s.costumes[0]} alt={s.name} className="max-w-full max-h-full" />
                             </div>
                             <div className="text-center text-xs truncate">{s.name}</div>
                         </div>
                     ))}
                 </div>
                 
                 {/* Sprite Properties */}
                 {activeSprite && (
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t pt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">X</span>
                            <input 
                                type="number" 
                                className="w-full border rounded px-1 text-sm"
                                value={activeSprite.x}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setProject(prev => {
                                        if(!prev) return null;
                                        return { ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, x: val} : s) };
                                    });
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Y</span>
                            <input 
                                type="number" 
                                className="w-full border rounded px-1 text-sm"
                                value={activeSprite.y}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setProject(prev => {
                                        if(!prev) return null;
                                        return { ...prev, sprites: prev.sprites.map(s => s.id === activeSprite.id ? {...s, y: val} : s) };
                                    });
                                }}
                            />
                        </div>
                    </div>
                 )}
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
      `}</style>
    </div>
  );
};

export default Editor;