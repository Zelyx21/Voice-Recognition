import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import pcaEng from './stats/pca_eng.html?raw';
import pcaFr from './stats/pca_fr.html?raw';
import umapEng from './stats/umap_eng.html?raw';
import umapFr from './stats/umap_fr.html?raw';
import './styles/Statistics.css';

const METRICS_DATA = {
  eng: {
    verification: [
      { key: 'intra_similarity', value: '0.6192' },
      { key: 'inter_similarity', value: '0.0998' },
      { key: 'separation', value: '0.5194' },
      { key: 'auc_roc', value: '0.9947' },
      { key: 'eer', value: '1.98%' },
    ],
    identification: [
      { key: 'top1_accuracy', value: '99.57%' },
      { key: 'top5_accuracy', value: '99.91%' },
      { key: 'speakers', value: '917' },
      { key: 'recordings', value: '39,953' },
      { key: 'precision', value: '94,19%' },
      { key: 'recall', value: '91,16%' },
      { key: 'f1', value: '91,38%' },
    ],
    clustering: [
      { key: 'silhouette', value: '0.0816' },
      { key: 'nmi', value: '0.8647' },
      { key: 'purity', value: '0.7939' },
    ],
  },

  fr: {
    verification: [
      { key: 'intra_similarity', value: '0.6253' },
      { key: 'inter_similarity', value: '0.1743' },
      { key: 'separation', value: '0.4510' },
      { key: 'auc_roc', value: '0.9954' },
      { key: 'eer', value: '1.91%' },
    ],
    identification: [
      { key: 'top1_accuracy', value: '99.33%' },
      { key: 'top5_accuracy', value: '99.93%' },
      { key: 'speakers', value: '917' },
      { key: 'recordings', value: '39 953' },
      { key: 'precision', value: '94,58%' },
      { key: 'recall', value: '90,63%' },
      { key: 'f1', value: '91,52%' },
    ],
    clustering: [
      { key: 'silhouette', value: '0.0998' },
      { key: 'nmi', value: '0.8729' },
      { key: 'purity', value: '0.9315' },
    ],
  },
};

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function MetricsSection({ title, sectionKey, language, t }) {
  const metrics = METRICS_DATA[language][sectionKey];

  return (
    <div className="metrics-section">
      <h3 className="metrics-title">{title}</h3>

      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <MetricCard
            key={i}
            label={t(`statistics.metrics.${m.key}`)}
            value={m.value}
          />
        ))}
      </div>
    </div>
  );
}

export default function Statistics() {
  const { t, i18n } = useTranslation();

  const language = i18n.language.startsWith('fr') ? 'fr' : 'eng';

  const [viz, setViz] = useState('pca');

  const getHtml = () => {
    const stats = {
      pca: {
        eng: pcaEng,
        fr: pcaFr,
      },
      umap: {
        eng: umapEng,
        fr: umapFr,
      },
    };

    return stats[viz][language];
  };

  const iframeSrc = useMemo(() => {
    const blob = new Blob([getHtml()], {
      type: 'text/html;charset=utf-8',
    });

    return URL.createObjectURL(blob);
  }, [language, viz]);

  return (
    <main>
      <div className="box">
        <div className="stats-header">
          <h2>{t('statistics.title')}</h2>

          <p className="stats-subtitle">
            {t('statistics.subtitle')}
          </p>
        </div>

        <div className="stats-controls">
          <div className="control-group">
            <span className="control-label">
              {t('statistics.visualization')}
            </span>

            <div className="button-group">
              <button
                className={`button ${viz === 'pca' ? 'active' : ''
                  }`}
                onClick={() => setViz('pca')}
              >
                PCA
              </button>

              <button
                className={`button ${viz === 'umap' ? 'active' : ''
                  }`}
                onClick={() => setViz('umap')}
              >
                UMAP
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="box">
        <div className="viz-container">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title={`${viz.toUpperCase()} ${t(
              'statistics.visualization'
            )}`}
            className="viz-iframe"
          />
        </div>
      </div>

      <div className="box">
        <MetricsSection
          title={t('statistics.verification_title')}
          sectionKey="verification"
          language={language}
          t={t}
        />

        <MetricsSection
          title={t('statistics.identification_title')}
          sectionKey="identification"
          language={language}
          t={t}
        />

        <MetricsSection
          title={t('statistics.clustering_title')}
          sectionKey="clustering"
          language={language}
          t={t}
        />
      </div>
    </main>
  );
}