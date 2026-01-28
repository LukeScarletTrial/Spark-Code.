import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/storage';
import { Project } from '../types';
import { Play } from 'lucide-react';

const Explore = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-indigo-900 mb-4">Explore Projects</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">Discover what others are creating. Remix, learn, and play with community projects.</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-lg">No projects found. Be the first to create one!</p>
          <Link to="/create" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">Start Creating &rarr;</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/project/${project.id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {project.backdrop ? (
                   <img src={project.backdrop} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-200">
                       <Play size={48} />
                   </div>
                )}
                
                {/* Overlay Preview of Sprites */}
                {project.sprites.slice(0, 3).map((s, i) => (
                    <img 
                        key={s.id} 
                        src={s.costumes[0]} 
                        className="absolute w-12 h-12 object-contain" 
                        style={{ bottom: '10px', right: `${10 + (i * 30)}px`, zIndex: 10 - i }}
                    />
                ))}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">by <span className="font-medium text-gray-700">{project.authorName}</span></p>
                    <span className="text-xs text-gray-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
