'use client';

import { useState } from 'react';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RecordsImport() {
  const { state, dispatch } = useData();
  const { universityRecords = [] } = state;

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    reg_no: 'reg_no',
    name: 'name',
    branch: 'branch',
    batch: 'batch',
    cgpa: 'cgpa',
    backlogs: 'backlogs',
    dob: 'dob',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'history'

  // Pre-seed sample CSV template
  const sampleCsv = `reg_no,name,branch,batch,cgpa,backlogs,dob
22BCE1234,Aarav Sharma,CSE,2026,8.4,0,2003-04-15
22BCE1235,Ananya Rao,CSE,2026,8.9,0,2003-08-22
22BIT1042,Rohan Verma,IT,2026,7.8,0,2002-11-05
22BCE1240,Arjun Mehta,CSE,2026,8.2,0,2003-01-18
22BEC1088,Sneha Kulkarni,ECE,2026,8.6,0,2003-06-30
22BCE1244,Rahul Singh,CSE,2026,7.95,1,2002-12-14`;

  function handleLoadSample() {
    setRawText(sampleCsv);
    parseCsv(sampleCsv);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setRawText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  }

  function parseCsv(text) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s"-]/g, '_'));
    const rows = lines.slice(1).map((line, idx) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowObj = { _id: idx };
      headers.forEach((h, hIdx) => {
        rowObj[h] = values[hIdx] || '';
      });
      return rowObj;
    });

    setParsedRows(rows);
  }

  async function handleImportSubmit() {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setResultSummary(null);

    // Map rows according to user column mapping
    const recordsToImport = parsedRows.map(row => ({
      reg_no: row[columnMapping.reg_no] || row.reg_no || row.regno || row.registration_no || '',
      name: row[columnMapping.name] || row.name || row.student_name || '',
      branch: row[columnMapping.branch] || row.branch || 'CSE',
      batch: Number(row[columnMapping.batch] || row.batch) || 2026,
      cgpa: Number(row[columnMapping.cgpa] || row.cgpa) || 0,
      backlogs: Number(row[columnMapping.backlogs] || row.backlogs) || 0,
      dob: row[columnMapping.dob] || row.dob || '',
    })).filter(r => r.reg_no && r.name);

    try {
      const response = await fetch('/api/university/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({ records: recordsToImport }),
      });
      const data = await response.json();

      if (data.success) {
        dispatch({ type: 'IMPORT_UNIVERSITY_RECORDS', payload: { records: recordsToImport } });
        setResultSummary({
          type: 'success',
          text: `Successfully imported ${data.importedCount} student records. Evaluated ${data.evaluatedStudents} active profiles: ${data.autoVerifiedCount} fully auto-verified, ${data.exceptionsCount} discrepancies routed to Exceptions desk.`,
        });
        setParsedRows([]);
        setRawText('');
      } else {
        setResultSummary({ type: 'error', text: data.error || 'Failed to import records.' });
      }
    } catch (err) {
      setResultSummary({ type: 'error', text: 'Network error communicating with server.' });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Layout title="University Registrar Records Import & Automation Desk">
      {/* Overview Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', border: '1px solid #334155', borderRadius: 8, padding: 18, marginBottom: 20, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                Official Registrar Database Synchronization
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
                Batch import verified academic transcripts. Matches auto-verify Personal Info & CGPA; discrepancies route directly to Placement Officer Exceptions queue.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'upload' ? '#2563EB' : '#334155',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              CSV Ingestion
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'history' ? '#2563EB' : '#334155',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Existing Records ({universityRecords.length})
            </button>
          </div>
        </div>
      </div>

      {resultSummary && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            borderRadius: 6,
            background: resultSummary.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${resultSummary.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: resultSummary.type === 'success' ? '#15803D' : '#B91C1C',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {resultSummary.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{resultSummary.text}</span>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div style={{ display: 'grid', gridTemplateColumns: parsedRows.length > 0 ? '1fr 1.6fr' : '1fr', gap: 20 }}>
          {/* Upload Input Card */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              1. Ingest Registrar CSV Data
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748B' }}>
              Upload an official .csv export or paste raw rows below with headers: <code>reg_no, name, branch, batch, cgpa, backlogs, dob</code>.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  border: '2px dashed #CBD5E1',
                  borderRadius: 8,
                  background: '#F8FAFC',
                  cursor: 'pointer',
                }}
              >
                <Upload size={24} color="#64748B" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 8 }}>
                  Click to browse .csv file
                </span>
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  Standard CSV or TSV format
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Or Paste CSV Text:</span>
              <button
                type="button"
                onClick={handleLoadSample}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Load Sample Data
              </button>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={e => {
                setRawText(e.target.value);
                parseCsv(e.target.value);
              }}
              placeholder={`reg_no,name,branch,batch,cgpa,backlogs,dob\n22BCE1234,Aarav Sharma,CSE,2026,8.4,0,2003-04-15...`}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                fontFamily: 'monospace',
                background: '#F8FAFC',
                marginBottom: 14,
              }}
            />

            {parsedRows.length > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleImportSubmit}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: isProcessing ? '#94A3B8' : '#16A34A',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                {isProcessing ? 'Processing Rule Engine...' : `Confirm Import & Run Automated Audits (${parsedRows.length} rows)`}
              </button>
            )}
          </div>

          {/* Live Preview & Mapping Card */}
          {parsedRows.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    2. Data Preview & Column Mapping
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                    Parsed {parsedRows.length} student records from upload. Verify mappings before synchronizing.
                  </p>
                </div>
                <Badge variant="success">{parsedRows.length} Valid Rows</Badge>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: 420, border: '1px solid #E2E8F0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Reg No</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Branch</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Batch</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>CGPA</th>
                      <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 600 }}>Backlogs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>
                          {row.reg_no || row.regno || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#334155' }}>
                          {row.name || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#334155' }}>
                          <span style={{ padding: '2px 6px', background: '#E2E8F0', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            {row.branch || 'CSE'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#334155' }}>{row.batch || 2026}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: Number(row.cgpa) >= 8.0 ? '#16A34A' : '#334155' }}>
                          {Number(row.cgpa || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', color: Number(row.backlogs) > 0 ? '#DC2626' : '#64748B' }}>
                          {row.backlogs ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 15 && (
                <div style={{ textAlign: 'center', fontSize: 11, color: '#64748B', marginTop: 8 }}>
                  Showing first 15 of {parsedRows.length} records.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* History / Existing Records Tab */
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                Master Registrar Database ({universityRecords.length} Records)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Currently active baseline records used by the automated verification rule engine.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                background: '#fff',
                color: '#2563EB',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Upload More Records
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Registration No</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Full Name</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Branch</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Batch</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Official CGPA</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Backlogs</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 600 }}>Imported At</th>
                </tr>
              </thead>
              <tbody>
                {universityRecords.map((r, idx) => (
                  <tr key={r.id || idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>{r.regNo || r.reg_no}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{r.name}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      <span style={{ padding: '2px 6px', background: '#E2E8F0', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                        {r.branch}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{r.batch}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16A34A' }}>
                      {Number(r.cgpa).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', color: Number(r.backlogs) > 0 ? '#DC2626' : '#64748B' }}>
                      {r.backlogs ?? 0}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 11 }}>
                      {r.importedAt ? new Date(r.importedAt).toLocaleDateString() : 'Initial'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

