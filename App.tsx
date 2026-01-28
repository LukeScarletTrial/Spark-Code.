import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from './services/storage';
import { User } from './types';
import Editor from './pages/Editor';
import Explore from './pages/Explore';
import { Home, Compass, PlusCircle, LogOut, Code2, Menu } from 'lucide-react';

const NavBar = ({ user, setUser }: { user: User | null, setUser: (u: User | null) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-area-inset-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-indigo-900 tracking-tight">SparkCode</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive('/')}`}>
              <Compass size={18} /> Explore
            </Link>
            {user ? (
              <>
                <Link to="/create" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive('/create')}`}>
                  <PlusCircle size={18} /> Create
                </Link>
                <div className="h-6 w-px bg-gray-300 mx-2"></div>
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                Login / Start Creating
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
             <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 rounded-md">
               <Menu size={24} />
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t p-2 space-y-1 shadow-lg absolute w-full z-50">
           <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
             <Compass size={18}/> Explore
           </Link>
           {user ? (
             <>
               <Link to="/create" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                 <PlusCircle size={18}/> Create Project
               </Link>
               <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                 <LogOut size={18}/> Logout ({user.name})
               </button>
             </>
           ) : (
             <Link to="/create" onClick={() => setMenuOpen(false)} className="block w-full text-center mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium">
               Login to Create
             </Link>
           )}
        </div>
      )}
    </nav>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar user={user} setUser={setUser} />
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/create" element={<Editor user={user} setUser={setUser} />} />
            <Route path="/project/:projectId" element={<Editor user={user} setUser={setUser} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
