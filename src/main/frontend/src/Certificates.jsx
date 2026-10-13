import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AuthContext } from './AuthContext';
import { Award, Lock, Download, CheckCircle2, ShieldCheck, Sparkles, Eye, RefreshCw, Code, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BanyanSilhouette } from './components/AmbientArt';
import { formatDate } from './utils/dateUtils';
import './Certificates.css';

/* =========================================================
   GEOMETRIC CORNER FLOURISH (KODIFY THEME)
   ========================================================= */

function CornerFlourish({ className }) {
  return (
    <svg className={`cert-corner ${className}`} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 3 33 L 3 9 C 3 5.68 5.68 3 9 3 L 33 3" stroke="#B88727" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 7 29 L 7 11 C 7 8.79 8.79 7 11 7 L 29 7" stroke="#004E64" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="12,8 16,12 12,16 8,12" fill="#B88727" opacity="0.9" />
      <circle cx="12" cy="12" r="1.5" fill="#004E64" />
      <circle cx="26" cy="3" r="1.2" fill="#B88727" />
      <circle cx="3" cy="26" r="1.2" fill="#B88727" />
    </svg>
  );
}

function Certificates() {
  const { user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/certificates');
      const list = res.data || [];
      setCertificates(list);
      if (list.length > 0) {
        setSelectedCert(prev => {
          if (!prev) return list[0];
          const found = list.find(c => c.id === prev.id);
          return found || list[0];
        });
      } else {
        setSelectedCert(null);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError("Unable to load certificates.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert) => {
    if (!cert?.unlocked || !cert?.downloadable) {
      alert("Certificate is locked. Complete all requirement targets to unlock download.");
      return;
    }

    const safeName = (user?.name || user?.username || 'User').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCert = (cert.name || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `KODIFY_${safeCert}_${safeName}.pdf`;

    try {
      setDownloadingId(cert.id);

      const certElement = document.getElementById('kodify-certificate-node');
      if (certElement) {
        // High-DPI canvas capture matching on-screen preview 1:1
        const canvas = await html2canvas(certElement, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FBFAF4',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        // Standard A4 landscape format (297mm x 210mm)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
        pdf.save(fileName);
      } else {
        // Fallback to backend PDF generation endpoint
        const response = await axios.get(`/api/certificates/${cert.id}/download`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download error, attempting backend fallback:", err);
      try {
        const response = await axios.get(`/api/certificates/${cert.id}/download`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (fallbackErr) {
        alert("Failed to download certificate. Please ensure all requirements are met.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const getMetricHumanLabel = (type, target) => {
    switch (type) {
      case 'CONTESTS_PARTICIPATED':
        return `Participate in ${target} Contest${target > 1 ? 's' : ''}`;
      case 'CONTESTS_CONDUCTED':
        return `Host ${target} Contest${target > 1 ? 's' : ''}`;
      case 'CONTEST_WINS':
        return `Win ${target} Contest${target > 1 ? 's' : ''}`;
      case 'PROBLEMS_SOLVED':
      default:
        return `Solve ${target} Unique Problem${target > 1 ? 's' : ''}`;
    }
  };

  const activeCert = selectedCert || (certificates.length > 0 ? certificates[0] : null);
  const progress = activeCert?.currentProgress || 0;
  const target = activeCert?.target || 1;
  const progressPercent = Math.min(100, Math.round((progress / target) * 100));
  const isUnlocked = activeCert?.unlocked || false;
  const templateStyle = (activeCert?.templateStyle || 'STANDARD').toUpperCase();

  const getTierDetails = (style) => {
    if (style.includes('ELITE')) {
      return {
        label: 'ELITE ACHIEVEMENT TIER',
        sealTop: 'ELITE',
        sealBottom: 'ACHIEVER',
        badgeColor: '#B88727'
      };
    }
    if (style.includes('ADVANCED')) {
      return {
        label: 'ADVANCED PROFESSIONAL TIER',
        sealTop: 'SKILLED',
        sealBottom: 'LEARNER',
        badgeColor: '#0081A7'
      };
    }
    return {
      label: 'STANDARD CREDENTIAL TIER',
      sealTop: 'VERIFIED',
      sealBottom: 'STUDENT',
      badgeColor: '#004E64'
    };
  };

  const tierInfo = getTierDetails(templateStyle);

  const formatIssueDate = (isoString) => {
    if (!isoString) return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

      {/* HEADER */}
      <div className="dashboard-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={24} color="var(--primary)" /> Kodify Certificates
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Official verified credentials across Standard, Advanced, and Elite milestone tiers.
            </p>
          </div>
          <button
            onClick={fetchCertificates}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading certificate collection...</p>
        </div>
      )}

      {error && (
        <div className="dashboard-card error-msg">{error}</div>
      )}

      {!loading && !error && certificates.length === 0 && (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <Award size={40} color="var(--primary)" style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
          <h4 style={{ margin: 0, color: 'var(--text)' }}>No Certificates Available</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontSize: '0.85rem' }}>Platform certificates will be posted here soon by administrators.</p>
        </div>
      )}

      {!loading && !error && certificates.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* CERTIFICATE CARDS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--text)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Milestone Certificates ({certificates.length})
            </h4>

            {certificates.map(cert => {
              const isSelected = activeCert?.id === cert.id;
              const certUnlocked = cert.unlocked;
              const certProgress = cert.currentProgress || 0;
              const certTarget = cert.target || 1;
              const certPercent = Math.min(100, Math.round((certProgress / certTarget) * 100));
              const styleTier = (cert.templateStyle || 'STANDARD').toUpperCase();

              return (
                <div
                  key={cert.id}
                  className="dashboard-card"
                  style={{
                    padding: '1.1rem 1.25rem',
                    margin: 0,
                    borderRadius: '9px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                    background: isSelected ? 'rgba(0, 129, 167, 0.05)' : 'var(--card-bg)',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: styleTier.includes('ELITE') ? '#d97706' : (styleTier.includes('ADVANCED') ? 'var(--primary)' : 'var(--text-muted)'), textTransform: 'uppercase', marginBottom: '2px' }}>
                        {styleTier.includes('ELITE') ? '★ Elite Tier' : (styleTier.includes('ADVANCED') ? '◆ Advanced Tier' : '● Standard Tier')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                        {cert.name}
                      </div>
                    </div>

                    {certUnlocked ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 7px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        ✓ Unlocked
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--tag-bg)', padding: '2px 7px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </div>

                  {cert.description && (
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                      {cert.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' }}>
                    <span>Progress:</span>
                    <span style={{ fontWeight: 800, color: certUnlocked ? '#16a34a' : 'var(--primary)' }}>
                      {certProgress} / {certTarget} ({certPercent}%)
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{ height: '6px', background: 'var(--tag-bg)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                    <div style={{
                      width: `${certPercent}%`,
                      height: '100%',
                      background: certUnlocked ? '#16a34a' : 'var(--primary)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={13} /> Preview
                    </button>

                    {certUnlocked ? (
                      <button
                        onClick={() => handleDownload(cert)}
                        disabled={downloadingId === cert.id}
                        className="btn btn-primary btn-sm"
                        style={{
                          width: 'auto',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.8rem',
                          background: '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download size={13} /> {downloadingId === cert.id ? 'Generating...' : 'Download (PDF)'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.8rem',
                          cursor: 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: 0.7
                        }}
                      >
                        <Lock size={12} /> {Math.max(0, certTarget - certProgress)} more needed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE CERTIFICATE DETAIL & REDESIGNED PREVIEW */}
          {activeCert && (
            <div style={{ display: 'grid', gap: '1.25rem', position: 'sticky', top: '70px' }}>

              {/* STATUS & ACTION BANNER */}
              <div
                className="dashboard-card"
                style={{
                  margin: 0,
                  padding: '1.1rem 1.35rem',
                  border: isUnlocked ? '1.5px solid #16a34a' : '1px solid var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                    {isUnlocked ? (
                      <>
                        <Sparkles size={18} color="#16a34a" />
                        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.05rem' }}>
                          Certificate Unlocked 🎉
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} color="var(--coral)" />
                        <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.05rem' }}>
                          Certificate Locked
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 600 }}>
                    {progress} / {target} {getMetricHumanLabel(activeCert.achievementType, target)} ({progressPercent}%)
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => handleDownload(activeCert)}
                      disabled={downloadingId === activeCert.id}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '0.55rem 1.25rem',
                        fontSize: '0.875rem',
                        background: '#16a34a',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={15} /> {downloadingId === activeCert.id ? 'Generating...' : 'Download Certificate (PDF)'}
                    </button>
                  ) : (
                    <Link
                      to="/problems"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.825rem', fontWeight: 600 }}
                    >
                      Solve Problems &rarr;
                    </Link>
                  )}
                </div>
              </div>

              {/* REDESIGNED ACADEMIC & TECHNICAL CERTIFICATE PREVIEW */}
              <div id="kodify-certificate-node" className={`kodify-cert-wrapper ${!isUnlocked ? 'preview-locked' : ''}`}>

                {/* Layer 1: Outer Dark Blue / Teal Border */}
                <div className="kodify-cert-layer1-outer">

                  {/* Layer 2: Thick 8px Gold Border */}
                  <div className="kodify-cert-layer2-gold-8px">

                    {/* Layer 3: Teal 3px Border */}
                    <div className="kodify-cert-layer3-teal-3px">

                      {/* Layer 4: Thin Gold Inner Accent Border */}
                      <div className="kodify-cert-layer4-inner-gold">

                        {/* 4 Corner Flourishes */}
                        <CornerFlourish className="cert-corner-tl" />
                        <CornerFlourish className="cert-corner-tr" />
                        <CornerFlourish className="cert-corner-bl" />
                        <CornerFlourish className="cert-corner-br" />

                        {/* Subtle Banyan Tree Watermark */}
                        <div className="cert-watermark">
                          <BanyanSilhouette width={260} height={200} opacity={0.04} color="#004E64" />
                        </div>

                        {/* Gold Achievement Seal Badge (Top Right) */}
                        <div className="cert-seal-badge">
                          <div className="cert-seal-outer">
                            <span className="cert-seal-text-top">{tierInfo.sealTop}</span>
                            <span className="cert-seal-star">★</span>
                            <span className="cert-seal-text-bottom">{tierInfo.sealBottom}</span>
                          </div>
                          <div className="cert-ribbon-tails">
                            <div className="cert-ribbon-tail cert-ribbon-tail-left" />
                            <div className="cert-ribbon-tail cert-ribbon-tail-right" />
                          </div>
                        </div>

                        {/* SECTION 1: KODIFY BRANDING */}
                        <div className="cert-header">
                          <div className="cert-brand-wrapper">
                            <span style={{ color: '#B88727', fontSize: '1rem', fontWeight: 900 }}>&lt;</span>
                            <h1 className="cert-brand-name">KODIFY</h1>
                            <span style={{ color: '#B88727', fontSize: '1rem', fontWeight: 1000 }}>/&gt;</span>
                          </div>
                          <p className="cert-brand-motto">
                            LEARN &bull; PRACTICE &bull; BUILD
                          </p>
                        </div>

                        {/* SECTION 2: MAIN HEADING */}
                        <div className="cert-title-section">
                          <h2 className="cert-heading-main">CERTIFICATE OF ACHIEVEMENT</h2>
                          <div className="cert-divider-ornament">
                            <div className="cert-divider-line" />
                            <div className="cert-diamond-ornament" />
                            <div className="cert-divider-line" />
                          </div>
                        </div>

                        {/* SECTION 3: RECIPIENT */}
                        <div className="cert-recipient-section">
                          <p className="cert-presented-label">
                            THIS IS PROUDLY PRESENTED TO
                          </p>
                          <div className="cert-recipient-name">
                            {user?.name || user?.username || 'STUDENT NAME'}
                          </div>
                          <div className="cert-recipient-underline" />
                        </div>

                        {/* SECTION 4: CITATION & DESCRIPTION */}
                        <div className="cert-description-section">
                          <p className="cert-description-text">
                            {activeCert.description || (
                              <>
                                For outstanding dedication and technical excellence in completing all <span className="cert-milestone-highlight">{target} milestone challenges</span> on the KODIFY platform.
                              </>
                            )}
                          </p>
                        </div>

                        {/* SECTION 5: 3-COLUMN FOOTER */}
                        <div className="cert-footer-section">
                          {/* LEFT: DATE */}
                          <div className="cert-footer-left">
                            <div className="cert-footer-label">DATE OF ISSUE</div>
                            <div className="cert-footer-value">
                              {formatDate(activeCert.unlockedAt || new Date())}
                            </div>
                          </div>

                          {/* CENTER: VERIFICATION STATUS */}
                          <div className="cert-footer-center">
                            <div className={`cert-verification-pill ${isUnlocked ? 'verified' : 'preview'}`}>
                              {isUnlocked ? <Check size={12} strokeWidth={3} /> : <ShieldCheck size={12} />}
                              <span>{isUnlocked ? 'VERIFIED' : 'PREVIEW'}</span>
                            </div>
                            <div className="cert-id-text">
                              ID: {activeCert.certificateId || `KODIFY-CERT-${activeCert.id || '1'}`}
                            </div>
                          </div>

                          {/* RIGHT: AUTHORITY SIGNATURE */}
                          <div className="cert-footer-right">
                            <div className="cert-signature-name">Kodify Academic Board</div>
                            <div className="cert-authority-title">AUTHORIZED VERIFICATION</div>
                          </div>
                        </div>

                        {/* SECTION 6: FOOTER MOTTO */}
                        <div className="cert-bottom-motto-row">
                          <div className="cert-motto-line" />
                          <span className="cert-motto-text">CODE TODAY &bull; CREATE TOMORROW</span>
                          <div className="cert-motto-line" />
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default Certificates;
