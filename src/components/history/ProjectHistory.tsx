import React, { useEffect, useState } from 'react';
import {
    X, FolderOpen, Trash2, Copy, Clock, Layers,
    Loader2,
} from 'lucide-react';
import { projectStorage, SavedProject } from '../../services/storage/projectStorage';
import { useStore } from '../../store';
import { getTheme } from '../../constants/theme';
import { toast } from 'react-hot-toast';

interface ProjectHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ isOpen, onClose }) => {
    const theme = useStore(s => s.theme);
    const T = getTheme(theme);
    const setSections = useStore(s => s.setSections);
    const updateConfig = useStore(s => s.updateConfig);

    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const list = await projectStorage.getAllProjects();
            setProjects(list);
        } catch {
            toast.error('Erro ao carregar projetos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadProjects();
    }, [isOpen]);

    const handleLoad = async (project: SavedProject) => {
        setSections(project.sections);
        updateConfig(project.config);
        toast.success(`"${project.name}" carregado!`);
        onClose();
    };

    const handleDelete = async (id: string) => {
        if (deletingId === id) {
            await projectStorage.deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            setDeletingId(null);
            toast.success('Projeto removido');
        } else {
            setDeletingId(id);
            setTimeout(() => setDeletingId(null), 3000);
        }
    };

    const handleDuplicate = async (id: string) => {
        const dup = await projectStorage.duplicateProject(id);
        if (dup) {
            setProjects(prev => [dup, ...prev]);
            toast.success('Projeto duplicado!');
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col animate-scale-in"
                style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadowStrong }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3">
                        <FolderOpen size={20} style={{ color: T.accent }} />
                        <div>
                            <h2 className="text-lg font-black" style={{ color: T.textPrimary }}>Meus Carrosséis</h2>
                            <p className="text-[10px]" style={{ color: T.textDim }}>{projects.length} projeto{projects.length !== 1 ? 's' : ''} salvo{projects.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110 active:scale-90"
                        style={{ color: T.textDim, border: `1px solid ${T.border}` }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Lista de projetos */}
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-3">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin" size={24} style={{ color: T.textDim }} />
                        </div>
                    )}

                    {!loading && projects.length === 0 && (
                        <div className="text-center py-12">
                            <FolderOpen size={40} style={{ color: T.textFaint, margin: '0 auto 12px' }} />
                            <p className="text-sm font-bold" style={{ color: T.textDim }}>Nenhum carrossel salvo ainda</p>
                            <p className="text-[10px] mt-1" style={{ color: T.textFaint }}>
                                Seus carrosséis serão salvos automaticamente aqui
                            </p>
                        </div>
                    )}

                    {!loading && projects.map((p, idx) => (
                        <div
                            key={p.id}
                            className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] cursor-pointer group animate-fade-in"
                            style={{
                                background: T.glass,
                                border: `1px solid ${T.border}`,
                                animationDelay: `${idx * 30}ms`,
                            }}
                            onClick={() => handleLoad(p)}
                        >
                            {/* Thumbnail */}
                            <div
                                className="w-14 h-[4.7rem] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                                style={{
                                    background: p.thumbnailDataUrl ? undefined : T.glassMd,
                                    border: `1px solid ${T.border}`,
                                }}
                            >
                                {p.thumbnailDataUrl ? (
                                    <img src={p.thumbnailDataUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Layers size={18} style={{ color: T.textFaint }} />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black truncate" style={{ color: T.textPrimary }}>
                                    {p.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: T.textDim }}>
                                        <Layers size={10} /> {p.slideCount} slide{p.slideCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: T.textFaint }}>
                                        <Clock size={10} /> {formatDate(p.updatedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDuplicate(p.id); }}
                                    className="p-2 rounded-lg transition-all hover:scale-110"
                                    style={{ color: T.textDim }}
                                    title="Duplicar"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                    className="p-2 rounded-lg transition-all hover:scale-110"
                                    style={{ color: deletingId === p.id ? '#ef4444' : T.textDim }}
                                    title={deletingId === p.id ? 'Clique novamente para confirmar' : 'Remover'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
