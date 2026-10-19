import React, { useEffect, useState, useMemo } from 'react';
import {
    X, FolderOpen, Trash2, Copy, Clock, Layers,
    Loader2, Cloud, HardDrive, Search, Filter, Play, Menu, Star
} from 'lucide-react';
import { projectStorage } from '../../services/storage/projectStorage';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';
import { getTheme } from '../../constants/theme';
import { toast } from 'react-hot-toast';

interface ProjectsGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UnifiedProject {
    id: string;
    name: string;
    slideCount: number;
    updatedAt: string;
    createdAt: string;
    source: 'cloud' | 'local';
    thumbnailDataUrl?: string;
    sections: any[];
    config: any;
}

export const ProjectsGalleryModal: React.FC<ProjectsGalleryModalProps> = ({ isOpen, onClose }) => {
    const theme = useStore(s => s.theme);
    const T = getTheme(theme);
    const setSections = useStore(s => s.setSections);
    const updateConfig = useStore(s => s.updateConfig);
    const setCurrentProjectId = useStore(s => s.setCurrentProjectId);

    const [projects, setProjects] = useState<UnifiedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'cloud' | 'local'>('all');

    const loadProjects = async () => {
        setLoading(true);
        try {
            // 1. Carregar projetos locais (IndexedDB)
            const localProjects = await projectStorage.getAllProjects();
            const localUnified: UnifiedProject[] = localProjects
                .filter(p => p.id !== 'auto-backup')
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    slideCount: p.slideCount,
                    updatedAt: p.updatedAt,
                    createdAt: p.createdAt,
                    source: 'local' as const,
                    thumbnailDataUrl: p.thumbnailDataUrl,
                    sections: p.sections,
                    config: p.config,
                }));

            // 2. Carregar projetos do cloud (Supabase)
            let cloudUnified: UnifiedProject[] = [];
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const cloudProjects = await cloudStorage.getUserCarousels(user.id);
                    cloudUnified = cloudProjects.map(c => ({
                        id: c.id,
                        name: c.name,
                        slideCount: c.slide_count,
                        updatedAt: c.updated_at,
                        createdAt: c.created_at,
                        source: 'cloud' as const,
                        thumbnailDataUrl: c.thumbnail_url,
                        sections: c.sections,
                        config: c.config,
                    }));
                }
            } catch { /* cloud fetch failed, show local only */ }

            // Merge
            const cloudNames = new Set(cloudUnified.map(c => c.name));
            const uniqueLocal = localUnified.filter(l => !cloudNames.has(l.name));
            const merged = [...cloudUnified, ...uniqueLocal]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

            setProjects(merged);
        } catch {
            toast.error('Erro ao carregar projetos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadProjects();
    }, [isOpen]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (activeTab === 'cloud' && p.source !== 'cloud') return false;
            if (activeTab === 'local' && p.source !== 'local') return false;
            if (searchQuery.trim() === '') return true;
            return p.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [projects, activeTab, searchQuery]);

    const handleLoad = async (project: UnifiedProject) => {
        setSections(project.sections);
        updateConfig(project.config);
        setCurrentProjectId(project.source === 'cloud' ? project.id : (project.id === 'auto-backup' ? null : project.id));
        toast.success(`"${project.name}" carregado!`);
        onClose();
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const project = projects.find(p => p.id === id);
        if (deletingId === id) {
            if (project?.source === 'cloud') {
                await cloudStorage.deleteCarousel(id);
            } else {
                await projectStorage.deleteProject(id);
            }
            setProjects(prev => prev.filter(p => p.id !== id));
            setDeletingId(null);
            toast.success('Projeto removido');
        } else {
            setDeletingId(id);
            setTimeout(() => setDeletingId(null), 3000);
        }
    };

    const handleDuplicate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const project = projects.find(p => p.id === id);
        if (!project) return;

        if (project.source === 'local') {
            const dup = await projectStorage.duplicateProject(id);
            if (dup) {
                setProjects(prev => [{
                    id: dup.id,
                    name: dup.name,
                    slideCount: dup.slideCount,
                    updatedAt: dup.updatedAt,
                    createdAt: dup.createdAt,
                    source: 'local',
                    thumbnailDataUrl: dup.thumbnailDataUrl,
                    sections: dup.sections,
                    config: dup.config,
                }, ...prev]);
                toast.success('Projeto duplicado!');
            }
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dup = await cloudStorage.createCarousel(user.id, `${project.name} (cópia)`, project.sections, project.config);
                if (dup) {
                    setProjects(prev => [{
                        id: dup.id,
                        name: dup.name,
                        slideCount: dup.slide_count,
                        updatedAt: dup.updated_at,
                        createdAt: dup.created_at,
                        source: 'cloud',
                        sections: dup.sections,
                        config: dup.config,
                    }, ...prev]);
                    toast.success('Projeto duplicado na nuvem!');
                }
            }
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-300" style={{ background: T.bgCanvas }}>
            <div className="flex-1 flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
                
                {/* Header Navbar */}
                <div className="flex items-center justify-between mb-8 shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 active:scale-95 transition-all" style={{ border: `1px solid ${T.border}` }}>
                            <X size={20} style={{ color: T.textPrimary }} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight" style={{ color: T.textPrimary }}>Minha Biblioteca</h2>
                            <p className="text-xs font-medium" style={{ color: T.textFaint }}>Você tem {projects.length} projetos salvos</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: T.textSub }} />
                            <input 
                                type="text"
                                placeholder="Buscar projetos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-9 pr-4 py-2.5 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2"
                                style={{ background: T.sidebar, color: T.textPrimary, border: `1px solid ${T.border}` }}
                            />
                        </div>
                        <div className="flex rounded-2xl p-1" style={{ background: T.sidebar, border: `1px solid ${T.border}` }}>
                            <button onClick={() => setActiveTab('all')} className="px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{ background: activeTab === 'all' ? T.glass : 'transparent', color: activeTab === 'all' ? T.textPrimary : T.textSub }}>Todos</button>
                            <button onClick={() => setActiveTab('cloud')} className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5" style={{ background: activeTab === 'cloud' ? T.glass : 'transparent', color: activeTab === 'cloud' ? '#00E5C3' : T.textSub }}><Cloud size={12}/> Nuvem</button>
                            <button onClick={() => setActiveTab('local')} className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5" style={{ background: activeTab === 'local' ? T.glass : 'transparent', color: activeTab === 'local' ? '#94a3b8' : T.textSub }}><HardDrive size={12}/> Local</button>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto pb-20 no-scrollbar pr-2">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin" size={40} style={{ color: T.accent }} />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                            <FolderOpen size={64} style={{ color: T.textFaint, marginBottom: 16 }} />
                            <h3 className="text-lg font-bold" style={{ color: T.textPrimary }}>Nenhum projeto encontrado</h3>
                            <p className="text-sm mt-1" style={{ color: T.textSub }}>Crie um novo carrossel ou mude as abas de filtro.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {filteredProjects.map(project => (
                                <div 
                                    key={`${project.source}-${project.id}`}
                                    onClick={() => handleLoad(project)}
                                    className="group relative flex flex-col cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {/* Thumbnail Card */}
                                    <div 
                                        className="relative w-full aspect-[1080/1440] rounded-3xl overflow-hidden mb-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                        style={{ background: T.sidebar, border: `1px solid ${T.border}` }}
                                    >
                                        {project.thumbnailDataUrl ? (
                                            <img src={project.thumbnailDataUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-30">
                                                <Layers size={40} style={{ color: T.textFaint }} />
                                            </div>
                                        )}
                                        
                                        {/* Overlay Hover Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={(e) => handleDuplicate(project.id, e)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all" title="Duplicar">
                                                    <Copy size={14} />
                                                </button>
                                                <button onClick={(e) => handleDelete(project.id, e)} className="p-2 rounded-xl bg-black/30 hover:bg-red-500/80 backdrop-blur-md text-white transition-all" title={deletingId === project.id ? 'Confirmar?' : 'Excluir'}>
                                                    {deletingId === project.id ? <Trash2 size={14} className="animate-pulse" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-center mb-10">
                                                <div className="bg-white text-black rounded-full p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                                    <Play fill="black" size={20} className="ml-1" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-3 left-3 flex gap-1.5">
                                            <div className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm backdrop-blur-md" 
                                                 style={{ background: project.source === 'cloud' ? 'rgba(0, 229, 195, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: project.source === 'cloud' ? '#00E5C3' : '#fff', border: `1px solid ${project.source === 'cloud' ? 'rgba(0, 229, 195, 0.3)' : 'rgba(255, 255, 255, 0.2)'}` }}>
                                                {project.source === 'cloud' ? <Cloud size={10} /> : <HardDrive size={10} />}
                                                {project.source}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Info */}
                                    <div className="px-1 flex flex-col gap-1">
                                        <h3 className="text-sm font-bold truncate tracking-tight transition-colors group-hover:text-[#00E5C3]" style={{ color: T.textPrimary }}>{project.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-medium opacity-60 flex items-center gap-1" style={{ color: T.textFaint }}><Layers size={10}/> {project.slideCount} slides</p>
                                            <p className="text-[10px] font-medium opacity-60" style={{ color: T.textFaint }}>{formatDate(project.updatedAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
