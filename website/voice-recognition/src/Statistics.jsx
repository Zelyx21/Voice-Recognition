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
      { key: 'precision', value: '94,19%'},
      { key: 'recall', value: '91,16%'},
      { key: 'f1', value: '91,38%'},
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
      { key: 'precision', value: '94,58%'},
      { key: 'recall', value: '90,63%'},
      { key: 'f1', value: '91,52%'},
    ],
    clustering: [
      { key: 'silhouette', value: '0.0998' },
      { key: 'nmi', value: '0.8729' },
      { key: 'purity', value: '0.9315' },
    ],
  },
};

const LABELS = {
  eng: {
    intra_similarity: 'Intra-speaker similarity',
    inter_similarity: 'Inter-speaker similarity',
    separation: 'Separation',
    auc_roc: 'AUC ROC',
    eer: 'EER',
    top1_accuracy: 'Top-1 Accuracy',
    top5_accuracy: 'Top-5 Accuracy',
    speakers: 'Speakers',
    recordings: 'Recordings',
    silhouette: 'Silhouette Score',
    nmi: 'NMI',
    purity: 'Purity',
    precision:'Precision',
    recall: 'Recall',
    f1: 'F1-Score',
  },
  fr: {
    intra_similarity: 'Similarité intra-locuteur',
    inter_similarity: 'Similarité inter-locuteur',
    separation: 'Séparation',
    auc_roc: 'AUC ROC',
    eer: 'EER',
    top1_accuracy: 'Précision Top-1',
    top5_accuracy: 'Précision Top-5',
    speakers: 'Locuteurs',
    recordings: 'Enregistrements',
    silhouette: 'Silhouette Score',
    nmi: 'NMI',
    purity: 'Pureté',
    precision:'Precision',
    recall: 'Recall',
    f1: 'F1-Score',
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

function MetricsSection({ title, sectionKey, language }) {
  const metrics = METRICS_DATA[language][sectionKey];
  const labels = LABELS[language];

  return (
    <div className="metrics-section">
      <h3 className="metrics-title">{title}</h3>
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <MetricCard
            key={i}
            label={labels[m.key]}
            value={m.value}
          />
        ))}
      </div>
    </div>
  );
}

export default function Statistics() {
  const [language, setLanguage] = useState('eng');
  const [viz, setViz] = useState('pca');

  const getHtml = () => {
    const stats = { pca: { eng: pcaEng, fr: pcaFr }, umap: { eng: umapEng, fr: umapFr } };
    return stats[viz][language];
  };

  const iframeSrc = useMemo(() => {
    const blob = new Blob([getHtml()], { type: 'text/html;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [language, viz]);

  const isEnglish = language === 'eng';

  return (
    <main>
      <div className="box">
        <div className="stats-header">
          <h2>{isEnglish ? 'VoiceID Statistics' : 'Statistiques VoiceID'}</h2>
          <p className="stats-subtitle">
            {isEnglish
              ? 'Speaker recognition and voice cloning performance metrics'
              : 'Métriques de performance de la reconnaissance de locuteur et du clonage vocal'}
          </p>
        </div>

        {/* Controls */}
        <div className="stats-controls">
          <div className="control-group">
            <span className="control-label">{isEnglish ? 'Language' : 'Langue'}</span>
            <div className="button-group">
              <button
                className={`button ${language === 'eng' ? 'active' : ''}`}
                onClick={() => setLanguage('eng')}
              >
                English
              </button>
              <button
                className={`button ${language === 'fr' ? 'active' : ''}`}
                onClick={() => setLanguage('fr')}
              >
                Français
              </button>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">{isEnglish ? 'Visualization' : 'Visualisation'}</span>
            <div className="button-group">
              <button
                className={`button ${viz === 'pca' ? 'active' : ''}`}
                onClick={() => setViz('pca')}
              >
                PCA
              </button>
              <button
                className={`button ${viz === 'umap' ? 'active' : ''}`}
                onClick={() => setViz('umap')}
              >
                UMAP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="box">
        <div className="viz-container">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title={`${viz.toUpperCase()} Visualization`}
            className="viz-iframe"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="box">
        <MetricsSection
          title={isEnglish ? 'Speaker Verification' : 'Vérification de Locuteur'}
          sectionKey="verification"
          language={language}
        />
        <MetricsSection
          title={isEnglish ? 'Speaker Identification' : 'Identification de Locuteur'}
          sectionKey="identification"
          language={language}
        />
        <MetricsSection
          title={isEnglish ? 'Clustering' : 'Clustering'}
          sectionKey="clustering"
          language={language}
        />
      </div>
    </main>
  );
}