import { useState, useMemo } from 'react';
import pcaEng from './stats/pca_eng.html?raw';
import pcaFr from './stats/pca_fr.html?raw';
import umapEng from './stats/umap_eng.html?raw';
import umapFr from './stats/umap_fr.html?raw';

const METRICS = {
  eng: {
    verification: [
      { label: 'Intra-speaker similarity', value: '0.6192' },
      { label: 'Inter-speaker similarity', value: '0.0969' },
      { label: 'Separation', value: '0.5223' },
      { label: 'AUC ROC', value: '0.9947' },
      { label: 'EER', value: '1.98%' },
    ],
    identification: [
      { label: 'Top-1 Accuracy', value: '99.57%' },
      { label: 'Top-5 Accuracy', value: '99.91%' },
      { label: 'Speakers', value: '917' },
      { label: 'Recordings', value: '39,953' },
    ],
    clustering: [
      { label: 'Silhouette Score', value: '0.0816' },
      { label: 'NMI', value: '0.8647' },
      { label: 'Purity', value: '0.7939' },
    ],
  },
  fr: {
    verification: [
      { label: 'Similarité intra-locuteur', value: '0.6192' },
      { label: 'Similarité inter-locuteur', value: '0.0969' },
      { label: 'Séparation', value: '0.5223' },
      { label: 'AUC ROC', value: '0.9947' },
      { label: 'EER', value: '1.98%' },
    ],
    identification: [
      { label: 'Précision Top-1', value: '99.57%' },
      { label: 'Précision Top-5', value: '99.91%' },
      { label: 'Locuteurs', value: '917' },
      { label: 'Enregistrements', value: '39 953' },
    ],
    clustering: [
      { label: 'Silhouette Score', value: '0.0816' },
      { label: 'NMI', value: '0.8647' },
      { label: 'Pureté', value: '0.7939' },
    ],
  },
};

function MetricCard({ label, value }) {
  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #16213e',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center',
      flex: '1 1 calc(50% - 8px)',
      minWidth: '150px',
    }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d9ff' }}>
        {value}
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

  const metrics = METRICS[language];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => setLanguage('eng')}>English</button>
        <button onClick={() => setLanguage('fr')}>Français</button>
        <button onClick={() => setViz('pca')}>PCA</button>
        <button onClick={() => setViz('umap')}>UMAP</button>
      </div>

      {/* Métriques */}
      <div style={{ marginBottom: '30px' }}>
        <h2>{language === 'eng' ? 'Speaker Verification' : 'Vérification de Locuteur'}</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {metrics.verification.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>

        <h2>{language === 'eng' ? 'Speaker Identification' : 'Identification de Locuteur'}</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {metrics.identification.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>

        <h2>{language === 'eng' ? 'Clustering' : 'Clustering'}</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {metrics.clustering.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>
      </div>

      {/* Visualizations */}
      <iframe 
        key={iframeSrc}
        src={iframeSrc} 
        style={{ width: '100%', height: '800px', border: 'none' }}
      />
    </div>
  );
}