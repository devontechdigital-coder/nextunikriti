'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Form, Spinner, Table } from 'react-bootstrap';
import { FiCheckSquare, FiDownload, FiRefreshCw, FiSquare, FiUpload } from 'react-icons/fi';

export default function AdminDataImportExportPage() {
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState('upsert');
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState(null);

  const selectedSet = useMemo(() => new Set(selectedModels), [selectedModels]);
  const allSelected = models.length > 0 && selectedModels.length === models.length;

  const loadModels = async ({ clearMessage = true } = {}) => {
    setIsLoading(true);
    if (clearMessage) {
      setMessage(null);
    }
    try {
      const response = await fetch('/api/admin/data', { credentials: 'include' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load model list.');
      }

      setModels(result.data || []);
      setSelectedModels((current) => {
        const allowed = new Set((result.data || []).map((model) => model.key));
        const next = current.filter((key) => allowed.has(key));
        return next.length ? next : (result.data || []).map((model) => model.key);
      });
    } catch (error) {
      setMessage({ type: 'danger', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const toggleModel = (key) => {
    setSelectedModels((current) => (
      current.includes(key)
        ? current.filter((modelKey) => modelKey !== key)
        : [...current, key]
    ));
  };

  const toggleAll = () => {
    setSelectedModels(allSelected ? [] : models.map((model) => model.key));
  };

  const downloadExport = async () => {
    if (!selectedModels.length) {
      setMessage({ type: 'warning', text: 'Select at least one model to export.' });
      return;
    }

    setIsExporting(true);
    setMessage(null);
    try {
      const query = new URLSearchParams({
        action: 'export',
        models: selectedModels.join(','),
      });
      const response = await fetch(`/api/admin/data?${query.toString()}`, { credentials: 'include' });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Export failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition') || '';
      const fileName = disposition.match(/filename="(.+)"/)?.[1] || `nextlms-data-export-${Date.now()}.json`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Export file generated.' });
    } catch (error) {
      setMessage({ type: 'danger', text: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const runImport = async () => {
    if (!importFile) {
      setMessage({ type: 'warning', text: 'Choose a JSON file to import.' });
      return;
    }

    if (!selectedModels.length) {
      setMessage({ type: 'warning', text: 'Select at least one model to import.' });
      return;
    }

    setIsImporting(true);
    setMessage(null);
    try {
      const text = await importFile.text();
      const payload = JSON.parse(text);
      const response = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: importMode,
          models: selectedModels,
          payload,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Import failed.');
      }

      const importedCount = Object.values(result.data || {}).reduce((sum, item) => sum + (item.imported || 0), 0);
      setMessage({ type: 'success', text: `Import completed. ${importedCount} records processed.` });
      await loadModels({ clearMessage: false });
    } catch (error) {
      setMessage({ type: 'danger', text: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="admin-data-page">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Import / Export Data</h2>
          <p className="text-muted mb-0">Choose models, export JSON backups, or import data back into the database.</p>
        </div>
        <Button variant="outline-secondary" onClick={loadModels} disabled={isLoading}>
          <FiRefreshCw className="me-2" />
          Refresh
        </Button>
      </div>

      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4">
        <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <h5 className="fw-bold mb-1">Model List</h5>
            <span className="text-muted small">{selectedModels.length} of {models.length} selected</span>
          </div>
          <ButtonGroup>
            <Button variant="outline-primary" onClick={toggleAll} disabled={isLoading || !models.length}>
              {allSelected ? <FiSquare className="me-2" /> : <FiCheckSquare className="me-2" />}
              {allSelected ? 'Clear All' : 'Select All'}
            </Button>
            <Button variant="primary" onClick={downloadExport} disabled={isExporting || isLoading || !selectedModels.length}>
              {isExporting ? <Spinner animation="border" size="sm" className="me-2" /> : <FiDownload className="me-2" />}
              Export
            </Button>
          </ButtonGroup>
        </div>

        {isLoading ? (
          <div className="p-5 text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 56 }}></th>
                <th>Model</th>
                <th>Collection</th>
                <th className="text-end">Records</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.key}>
                  <td>
                    <Form.Check
                      aria-label={`Select ${model.label}`}
                      checked={selectedSet.has(model.key)}
                      onChange={() => toggleModel(model.key)}
                    />
                  </td>
                  <td className="fw-semibold">{model.label}</td>
                  <td><code>{model.collection}</code></td>
                  <td className="text-end">
                    <Badge bg="light" text="dark" className="border">{model.count}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <div className="bg-white rounded shadow-sm p-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">
          <div className="flex-grow-1">
            <h5 className="fw-bold mb-3">Import JSON</h5>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Backup file</Form.Label>
              <Form.Control
                type="file"
                accept="application/json,.json"
                onChange={(event) => setImportFile(event.target.files?.[0] || null)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-semibold">Import mode</Form.Label>
              <Form.Select value={importMode} onChange={(event) => setImportMode(event.target.value)}>
                <option value="upsert">Upsert selected models</option>
                <option value="replace">Replace selected models</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Replace deletes the selected collections before restoring them from the file.
              </Form.Text>
            </Form.Group>
          </div>
          <div className="d-flex align-items-end">
            <Button variant="success" size="lg" onClick={runImport} disabled={isImporting || isLoading || !selectedModels.length}>
              {isImporting ? <Spinner animation="border" size="sm" className="me-2" /> : <FiUpload className="me-2" />}
              Import Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
