import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalProject = {
  id: string;
  user_id: string;
  nom: string;
  video_source_url?: string | null;
  miniature_url?: string | null;
  timeline_data?: any;
  created_at: string;
  updated_at: string;
};

const PROJECTS_KEY = 'clipx.offline.projects';

async function readProjects(): Promise<LocalProject[]> {
  const raw = await AsyncStorage.getItem(PROJECTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeProjects(projects: LocalProject[]) {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function getOfflineProjects() {
  const projects = await readProjects();
  return projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getOfflineProject(id: string) {
  const projects = await readProjects();
  return projects.find(project => project.id === id) || null;
}

export async function createOfflineProject(input: Pick<LocalProject, 'user_id' | 'nom'> & Partial<LocalProject>) {
  const now = new Date().toISOString();
  const project: LocalProject = {
    id: `local-${Date.now()}`,
    user_id: input.user_id,
    nom: input.nom,
    video_source_url: input.video_source_url || null,
    miniature_url: input.miniature_url || null,
    timeline_data: input.timeline_data || null,
    created_at: now,
    updated_at: now,
  };
  const projects = await readProjects();
  await writeProjects([project, ...projects]);
  return project;
}

export async function updateOfflineProject(id: string, patch: Partial<LocalProject>) {
  const projects = await readProjects();
  let updated: LocalProject | null = null;
  const nextProjects = projects.map(project => {
    if (project.id !== id) return project;
    updated = { ...project, ...patch, updated_at: patch.updated_at || new Date().toISOString() };
    return updated;
  });
  await writeProjects(nextProjects);
  return updated;
}

export async function deleteOfflineProject(id: string) {
  const projects = await readProjects();
  await writeProjects(projects.filter(project => project.id !== id));
}

export async function clearOfflineProjects() {
  await AsyncStorage.removeItem(PROJECTS_KEY);
}
