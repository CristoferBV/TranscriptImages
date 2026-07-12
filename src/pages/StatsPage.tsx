import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Images, AlignLeft, CheckCircle,
  XCircle, TrendingUp, Download, BarChart2, Calendar,
} from 'lucide-react';
import { useFirestore, ProjectData } from '../hooks/useFirestore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Sidebar from '../components/ui/Sidebar';

/* ── helpers ── */
const totalPages = (projects: ProjectData[]) =>
  projects.reduce((s, p) => s + p.pages.length, 0);

const totalWords = (projects: ProjectData[]) =>
  projects.reduce((s, p) =>
    s + p.pages.reduce((ps, pg) => {
      const t = pg.fullText.trim();
      return ps + (t ? t.split(/\s+/).length : 0);
    }, 0), 0);

const failedPages = (projects: ProjectData[]) =>
  projects.reduce((s, p) => s + p.pages.filter(pg => !pg.fullText.trim()).length, 0);

const avgWordsPerPage = (projects: ProjectData[]) => {
  const pages = totalPages(projects);
  return pages === 0 ? 0 : Math.round(totalWords(projects) / pages);
};

const ocrSuccessRate = (projects: ProjectData[]) => {
  const pages = totalPages(projects);
  if (pages === 0) return 100;
  return Math.round(((pages - failedPages(projects)) / pages) * 100);
};

const docsByMonth = (projects: ProjectData[]) => {
  const map: Record<string, number> = {};
  projects.forEach(p => {
    const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt as any);
    const key = date.toLocaleDateString('es-CR', { year: 'numeric', month: 'short' });
    map[key] = (map[key] || 0) + 1;
  });
  // last 6 months only
  return Object.entries(map).slice(-6);
};

const topDocument = (projects: ProjectData[]) =>
  [...projects].sort((a, b) => {
    const wa = a.pages.reduce((s, pg) => s + (pg.fullText.trim() ? pg.fullText.trim().split(/\s+/).length : 0), 0);
    const wb = b.pages.reduce((s, pg) => s + (pg.fullText.trim() ? pg.fullText.trim().split(/\s+/).length : 0), 0);
    return wb - wa;
  })[0] || null;

/* ── stat card ── */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}> = ({ icon, label, value, sub, accent }) => (
  <div className={`bg-surface-container border rounded-lg p-5 flex flex-col gap-3 ${accent ? 'border-primary/30' : 'border-outline-variant'}`}>
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-primary/15' : 'bg-surface-container-high'}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-semibold text-on-surface">{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      {sub && <p className="text-xs text-outline mt-1">{sub}</p>}
    </div>
  </div>
);

/* ── bar chart ── */
const BarChart: React.FC<{ data: [string, number][] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d[1]), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map(([label, count]) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-on-surface-variant">{count}</span>
          <div
            className="w-full rounded-t bg-primary/60 transition-all duration-500"
            style={{ height: `${(count / max) * 80}px`, minHeight: count > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-outline text-center leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
};

/* ── page ── */
const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getUserProjects } = useFirestore();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProjects().then(p => { setProjects(p); setLoading(false); });
  }, []);

  const monthData = docsByMonth(projects);
  const top = topDocument(projects);
  const successRate = ocrSuccessRate(projects);
  const failed = failedPages(projects);
  const pages = totalPages(projects);

  return (
    <div className="min-h-screen bg-app-bg flex">
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />

      <Sidebar documentCount={projects.length} onNewScan={() => navigate('/dashboard')} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden auth-glass-card border-b border-white/5 sticky top-0 z-30 px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-on-surface">Estadísticas</span>
        </header>

        <main className="flex-1 relative z-10 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl w-full mx-auto">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl lg:text-2xl font-semibold text-on-surface">Estadísticas de uso</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Resumen de tu actividad en Digidoc CR</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart2 className="w-12 h-12 text-outline mb-4" />
              <p className="text-on-surface-variant text-sm">Aún no tienes documentos escaneados.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-auth-primary mt-4 px-6 py-2.5 rounded-full text-sm font-semibold">
                Ir al dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<FileText className="w-4 h-4 text-primary" />}
                  label="Documentos escaneados"
                  value={projects.length}
                  accent
                />
                <StatCard
                  icon={<Images className="w-4 h-4 text-on-surface-variant" />}
                  label="Páginas procesadas"
                  value={pages}
                  sub={`~${(projects.length > 0 ? (pages / projects.length).toFixed(1) : 0)} págs/doc`}
                />
                <StatCard
                  icon={<AlignLeft className="w-4 h-4 text-on-surface-variant" />}
                  label="Palabras extraídas"
                  value={totalWords(projects).toLocaleString('es-CR')}
                  sub={`~${avgWordsPerPage(projects)} palabras/página`}
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4 text-on-surface-variant" />}
                  label="Tasa de éxito OCR"
                  value={`${successRate}%`}
                  sub={failed > 0 ? `${failed} página(s) sin texto` : 'Sin fallos detectados'}
                />
              </div>

              {/* OCR success bar + top doc */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* OCR quality */}
                <div className="bg-surface-container border border-outline-variant rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-on-surface">Calidad del OCR</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                        <span>Páginas con texto</span>
                        <span>{pages - failed} / {pages}</span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        <span>{pages - failed} exitosas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <XCircle className="w-3.5 h-3.5 text-error" />
                        <span>{failed} sin texto</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top document */}
                {top && (
                  <div className="bg-surface-container border border-outline-variant rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-on-surface">Documento con más texto</span>
                    </div>
                    <button
                      onClick={() => navigate(`/document/${top.id}`)}
                      className="w-full text-left group"
                    >
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {top.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {top.pages.reduce((s, pg) => s + (pg.fullText.trim() ? pg.fullText.trim().split(/\s+/).length : 0), 0).toLocaleString('es-CR')} palabras
                        · {top.pages.length} {top.pages.length === 1 ? 'página' : 'páginas'}
                      </p>
                      <p className="text-xs text-primary mt-2 group-hover:underline">Ver documento →</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Activity chart */}
              {monthData.length > 0 && (
                <div className="bg-surface-container border border-outline-variant rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-on-surface">Documentos por mes</span>
                  </div>
                  <BarChart data={monthData} />
                </div>
              )}

              {/* Pages per doc distribution */}
              <div className="bg-surface-container border border-outline-variant rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-on-surface">Distribución de páginas por documento</span>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(n => {
                    const count = n < 4
                      ? projects.filter(p => p.pages.length === n).length
                      : projects.filter(p => p.pages.length >= 4).length;
                    const pct = projects.length > 0 ? (count / projects.length) * 100 : 0;
                    return (
                      <div key={n}>
                        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                          <span>{n < 4 ? `${n} página${n > 1 ? 's' : ''}` : '4+ páginas'}</span>
                          <span>{count} doc{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StatsPage;
