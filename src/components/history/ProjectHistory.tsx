import React, { useEffect, useState } from 'react';
import {
    X, FolderOpen, Trash2, Copy, Clock, Layers,
    Loader2, Cloud, HardDrive,
} from 'lucide-react';
import { projectStorage, SavedProject } from '../../services/storage/projectStorage';
import { cloudStorage, CloudCarousel } from '../../services/storage/cloudStorage';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';
import { getTheme } from '../../constants/theme';
import { toast } from 'react-hot-toast';

interface ProjectHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

// Unifica projetos do cloud e local num formato único
interface UnifiedProject {
    id: string;
    name: string;
    slideCount: number;
    updatedAt: string;
    createdAt: string;
    source: 'cloud' | 'local';
    thumbnailDataUrl?: string;
    // Para carregar
    sections: any[];
    config: any;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ isOpen, onClose }) => {
    const theme = useStore(s => s.theme);
    const T = getTheme(theme);
    const setSections = useStore(s => s.setSections);
    const updateConfig = useStore(s => s.updateConfig);
    const setCurrentProjectId = useStore(s => s.setCurrentProjectId);

    const [projects, setProjects] = useState<UnifiedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

            // 3. Merge: cloud first, then local (sem duplicatas por nome)
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

    const handleLoad = async (project: UnifiedProject) => {
        setSections(project.sections);
        updateConfig(project.config);
        setCurrentProjectId(project.source === 'cloud' ? project.id : (project.id === 'auto-backup' ? null : project.id));
        toast.success(`"${project.name}" carregado!`);
        onClose();
    };

    const handleDelete = async (id: string) => {
        const project = projects.find(p => p.id === id);
        if (deletingId === id) {
            // Delete from appropriate source
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

    const handleDuplicate = async (id: string) => {
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
            // Cloud: create a new cloud carousel with "(cópia)"
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dup = await cloudStorage.createCarousel(
                    user.id,
                    `${project.name} (cópia)`,
                    project.sections,
                    project.config,
                );
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
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div
                className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
                style={{ background: T.sidebar, border: `1px solid ${T.border}` }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2">
                        <FolderOpen size={18} style={{ color: T.accent }} />
                        <h2 className="text-sm font-black" style={{ color: T.textPrimary }}>Meus Projetos</h2>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: T.glass, color: T.textFaint }}>
                            {projects.length}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 active:scale-90">
                        <X size={18} style={{ color: T.textSub }} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin" size={24} style={{ color: T.accent }} />
                        </div>
                    ) : projects.length === 0 ? (
                        <p className="text-center py-10 text-xs" style={{ color: T.textFaint }}>
                            Nenhum projeto salvo
                        </p>
                    ) : (
                        projects.map(project => (
                            <div
                                key={`${project.source}-${project.id}`}
                                className="rounded-2xl p-4 transition-all hover:scale-[1.01] cursor-pointer active:scale-[0.99]"
                                style={{ background: T.card, border: `1px solid ${T.border}` }}
                                onClick={() => handleLoad(project)}
                            >
                                <div className="flex items-start gap-3">
                                    {project.thumbnailDataUrl ? (
                                        <img
                                            src={project.thumbnailDataUrl}
                                            alt=""
                                            className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                                            style={{ border: `1px solid ${T.border}` }}
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: T.glass, border: `1px solid ${T.border}` }}
                                        >
                                            <Layers size={16} style={{ color: T.textFaint }} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black truncate" style={{ color: T.textPrimary }}>
                                                {project.name}
                                            </p>
                                            {project.source === 'cloud' ? (
                                                <Cloud size={11} style={{ color: T.accent }} />
                                            ) : (
                                                <HardDrive size={11} style={{ color: T.textFaint }} />
                                            )}
                                        </div>
                                        <div className="flex gap-3 mt-1">
                                            <span className="text-[9px] flex items-center gap-1" style={{ color: T.textFaint }}>
                                                <Layers size={9} /> {project.slideCount} slides
                                            </span>
                                            <span className="text-[9px] flex items-center gap-1" style={{ color: T.textFaint }}>
                                                <Clock size={9} /> {formatDate(project.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleDuplicate(project.id)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90"
                                            title="Duplicar"
                                        >
                                            <Copy size={13} style={{ color: T.textSub }} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 active:scale-90"
                                            title={deletingId === project.id ? 'Confirmar?' : 'Excluir'}
                                        >
                                            <Trash2 size={13} style={{ color: deletingId === project.id ? '#ff4444' : T.textSub }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
