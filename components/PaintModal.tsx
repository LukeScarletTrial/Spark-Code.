import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Brush, Eraser } from 'lucide-react';

interface PaintModalProps {
  initialImage?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  isBackground?: boolean;
}

const PaintModal: React.FC<PaintModalProps> = ({ initialImage, onSave, onClose, isBackground = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 480;
    canvas.height = 360;

    // Load initial image if exists
    if (initialImage && initialImage.startsWith('data:')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialImage;
    } else if (isBackground && initialImage) {
        // If it's a hex color background
        ctx.fillStyle = initialImage;
        ctx.fillRect(0,0, canvas.width, canvas.height);
    } else {
       // Clear
       ctx.fillStyle = '#ffffff';
       if(!isBackground) ctx.clearRect(0,0, canvas.width, canvas.height); // Transparent for sprites
       else ctx.fillRect(0,0, canvas.width, canvas.height); // White for bg
    }
  }, [initialImage, isBackground]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
       x = e.touches[0].clientX - rect.left;
       y = e.touches[0].clientY - rect.top;
    } else {
       x = (e as React.MouseEvent).nativeEvent.offsetX;
       y = (e as React.MouseEvent).nativeEvent.offsetY;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Brush className="w-5 h-5" />
            {isBackground ? 'Paint Backdrop' : 'Paint Sprite'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-gray-50 border-b flex flex-wrap gap-4 items-center justify-between">
           <div className="flex gap-2 items-center">
              <button 
                onClick={() => setTool('brush')}
                className={`p-2 rounded ${tool === 'brush' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              >
                <Brush size={20} />
              </button>
              <button 
                onClick={() => setTool('eraser')}
                className={`p-2 rounded ${tool === 'eraser' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              >
                <Eraser size={20} />
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-2"></div>

              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none"
              />
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushSize} 
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
           </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-200 p-4 overflow-auto flex items-center justify-center relative touch-none">
          <canvas
            ref={canvasRef}
            className="bg-white shadow-lg cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
            <Check className="w-4 h-4" /> Save Asset
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaintModal;