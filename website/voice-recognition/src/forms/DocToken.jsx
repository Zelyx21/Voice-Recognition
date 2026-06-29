// DocToken.jsx
import { useTranslation } from 'react-i18next'
import './../styles/styleDoc.css';

export default function DocToken() {
  const { t } = useTranslation()

  const vocalBursts = [
    { 
      token: '[breath]', 
      descriptionKey: 'forms.doctoken.bursts.breath.description',
      usageKey: 'forms.doctoken.bursts.breath.usage'
    },
    { 
      token: '[quick_breath]', 
      descriptionKey: 'forms.doctoken.bursts.quick_breath.description',
      usageKey: 'forms.doctoken.bursts.quick_breath.usage'
    },
    { 
      token: '[laughter]', 
      descriptionKey: 'forms.doctoken.bursts.laughter.description',
      usageKey: 'forms.doctoken.bursts.laughter.usage'
    },
    { 
      token: '[sigh]', 
      descriptionKey: 'forms.doctoken.bursts.sigh.description',
      usageKey: 'forms.doctoken.bursts.sigh.usage'
    },
    { 
      token: '[cough]', 
      descriptionKey: 'forms.doctoken.bursts.cough.description',
      usageKey: 'forms.doctoken.bursts.cough.usage'
    },
    { 
      token: '[lipsmack]', 
      descriptionKey: 'forms.doctoken.bursts.lipsmack.description',
      usageKey: 'forms.doctoken.bursts.lipsmack.usage'
    },
    { 
      token: '[mn]', 
      descriptionKey: 'forms.doctoken.bursts.mn.description',
      usageKey: 'forms.doctoken.bursts.mn.usage'
    },
  ];

  return (
    <div className="doc-token-wrapper">
      <h2 className="doc-token-main-title">{t('forms.doctoken.title')}</h2>
      <p className="doc-token-intro">
        {t('forms.doctoken.intro')}
      </p>

      {/* Human expressions */}
      <h3 className="doc-token-section-title">{t('forms.doctoken.section1_title')}</h3>
      <p className="doc-token-text">
        {t('forms.doctoken.section1_tip')}
      </p>
      <div className="doc-token-table-responsive">
        <table className="doc-token-table">
          <thead>
            <tr className="doc-token-th-row">
              <th className="doc-token-th">{t('forms.doctoken.table_header_token')}</th>
              <th className="doc-token-th">{t('forms.doctoken.table_header_effect')}</th>
              <th className="doc-token-th">{t('forms.doctoken.table_header_example')}</th>
            </tr>
          </thead>
          <tbody>
            {vocalBursts.map((b) => (
              <tr key={b.token}>
                <td className="doc-token-td-token"><code>{b.token}</code></td>
                <td className="doc-token-td">
                  <strong>{t(b.descriptionKey)}</strong>
                  <div className="doc-token-sub-text">{t(b.usageKey)}</div>
                </td>
                <td className="doc-token-td-example">
                  {t('forms.doctoken.example_prefix')} <span className="doc-token-highlight">{b.token}</span> {t('forms.doctoken.example_suffix')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Intonation tags */}
      <h3 className="doc-token-section-title">{t('forms.doctoken.section2_title')}</h3>
      <div className="doc-token-card-container">
        <div className="doc-token-card">
          <div className="doc-token-card-header">
            <code>&lt;strong&gt;text&lt;/strong&gt;</code>
          </div>
          <p className="doc-token-card-body">
            <strong>{t('forms.doctoken.strong_label')}:</strong> {t('forms.doctoken.strong_description')}
            <br />
            <span className="doc-token-sub-text">{t('forms.doctoken.strong_example')}</span>
          </p>
        </div>

        <div className="doc-token-card">
          <div className="doc-token-card-header">
            <code>[accent]</code>
          </div>
          <p className="doc-token-card-body">
            <strong>{t('forms.doctoken.accent_label')}:</strong> {t('forms.doctoken.accent_description')}
            <br />
            <span className="doc-token-sub-text">{t('forms.doctoken.accent_example')}</span>
          </p>
        </div>
      </div>

      {/* Phonemes */}
      <h3 className="doc-token-section-title">{t('forms.doctoken.section3_title')}</h3>
      <p className="doc-token-text">
        {t('forms.doctoken.section3_description')}
      </p>
      <div className="doc-token-alert-box">
        <strong>💡 {t('forms.doctoken.english_format')}:</strong> {t('forms.doctoken.english_format_description')}
        <br /><br />
        <strong>💡 {t('forms.doctoken.mandarin_format')}:</strong> {t('forms.doctoken.mandarin_format_description')}
      </div>
    </div>
  );
}