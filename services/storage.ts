import { Project, User, DEFAULT_SPRITE_IMAGE } from '../types';

// Mocking a backend with LocalStorage for instant usability without config keys
const STORAGE_KEYS = {
  USER: 'spark_user',
  PROJECTS: 'spark_projects',
};

export const login = async (email: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const user: User = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    name: email.split('@')[0],
    email,
  };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveProject = async (project: Project): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const getProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
};

export const createNewProject = (user: User): Project => {
  return {
    id: 'proj_' + Math.random().toString(36).substr(2, 9),
    title: 'New Project',
    authorId: user.id,
    authorName: user.name,
    createdAt: Date.now(),
    backdrop: '#ffffff',
    sprites: [
      {
        id: 'sprite_1',
        name: 'Cat',
        x: 0,
        y: 0,
        rotation: 90,
        size: 100,
        costumes: [DEFAULT_SPRITE_IMAGE],
        currentCostumeIndex: 0,
        scripts: [],
      }
    ]
  };
};
