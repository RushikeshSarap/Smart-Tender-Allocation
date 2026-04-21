import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import Dashboard from './Dashboard';
import { formatCurrency } from './utils';

const loadJson = (key) => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const AdminDashboard = () => {
    const [tenders, setTenders] = useState([]);
    const [selectedTender, setSelectedTender] = useState(null);
    const savedTenderForm = loadJson('tenderForm') || {};
    const [activeSection, setActiveSection] = useState('create');
    const [title, setTitle] = useState(savedTenderForm.title || '');
    const [description, setDescription] = useState(savedTenderForm.description || '');
    const [estimatedBudget, setEstimatedBudget] = useState(savedTenderForm.estimatedBudget || '');
    const [deadline, setDeadline] = useState(savedTenderForm.deadline || '');
    const [requiredExperience, setRequiredExperience] = useState(savedTenderForm.requiredExperience || '');
    const [projectType, setProjectType] = useState(savedTenderForm.projectType || '');
    const [pdfFile, setPdfFile] = useState(null);
    const [ocrPreview, setOcrPreview] = useState(loadJson('ocrPreview'));
    const [ocrDraft, setOcrDraft] = useState(loadJson('ocrDraft'));
    const [resultData, setResultData] = useState(null);
    const [jobState, setJobState] = useState(null);
    const [pollingMessage, setPollingMessage] = useState('');
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchTenders();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4500);
    };

    useEffect(() => {
        localStorage.setItem('ocrPreview', JSON.stringify(ocrPreview));
    }, [ocrPreview]);

    useEffect(() => {
        localStorage.setItem('ocrDraft', JSON.stringify(ocrDraft));
    }, [ocrDraft]);

    useEffect(() => {
        localStorage.setItem('tenderForm', JSON.stringify({
            title,
            description,
            estimatedBudget,
            deadline,
            requiredExperience,
            projectType
        }));
    }, [title, description, estimatedBudget, deadline, requiredExperience, projectType]);

    const fetchTenders = async () => {
        try {
            const res = await axios.get('/tender');
            setTenders(res.data);
        } catch (err) {
            console.error('Failed to load tenders', err);
            showNotification('Unable to load tenders.', 'error');
        }
    };

    const handleCreateTender = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/tender', {
                title,
                description,
                estimated_budget: Number(estimatedBudget) || 0,
                deadline,
                required_experience: requiredExperience,
                project_type: projectType
            });
            setTitle('');
            setDescription('');
            setEstimatedBudget('');
            setDeadline('');
            setRequiredExperience('');
            setProjectType('');
            localStorage.removeItem('tenderForm');
            fetchTenders();
            showNotification('Tender created successfully.', 'success');
        } catch (err) {
            showNotification('Error creating tender: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleExtractPdf = async (e) => {
        e.preventDefault();
        if (!pdfFile) return showNotification('Please select a tender PDF to extract.', 'warning');

        try {
            const payload = new FormData();
            payload.append('file', pdfFile);
            const res = await axios.post('/tender/upload', payload);
            const extracted = res.data.extracted || {};
            const normalizedExtracted = {
                title: extracted.title || '',
                description: extracted.description || '',
                estimated_budget: extracted.estimated_budget || '',
                deadline: extracted.deadline || '',
                required_experience: extracted.required_experience || extracted.experience_required || '',
                project_type: extracted.project_type || ''
            };

            setOcrPreview(normalizedExtracted);
            setOcrDraft(normalizedExtracted);
            setTitle(normalizedExtracted.title);
            setDescription(normalizedExtracted.description);
            setEstimatedBudget(normalizedExtracted.estimated_budget);
            setDeadline(normalizedExtracted.deadline);
            setRequiredExperience(normalizedExtracted.required_experience);
            setProjectType(normalizedExtracted.project_type);
            showNotification('Tender data extracted successfully. Review the OCR draft below.', 'success');
        } catch (err) {
            showNotification('OCR failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleOcrChange = (field, value) => {
        setOcrDraft(prev => ({ ...prev, [field]: value }));
    };

    const fieldChanged = (field) => {
        return ocrPreview && ocrDraft && String(ocrPreview[field] || '').trim() !== String(ocrDraft[field] || '').trim();
    };

    const handleSaveExtractedTender = async () => {
        if (!ocrDraft) return;
        try {
            const budgetValue = Number(String(ocrDraft.estimated_budget || '').replace(/,/g, '')) || 0;
            await axios.post('/tender', {
                title: ocrDraft.title,
                description: ocrDraft.description,
                estimated_budget: budgetValue,
                deadline: ocrDraft.deadline,
                required_experience: ocrDraft.required_experience,
                project_type: ocrDraft.project_type
            });
            setOcrPreview(null);
            setOcrDraft(null);
            setPdfFile(null);
            localStorage.removeItem('ocrPreview');
            localStorage.removeItem('ocrDraft');
            fetchTenders();
            showNotification('Tender created from extracted PDF.', 'success');
        } catch (err) {
            showNotification('Error saving extracted tender: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const pollResult = async (tenderId, attempt = 0) => {
        try {
            const res = await axios.get(`/result/${tenderId}`);
            const status = res.data.evaluation_status;

            if (status === 'completed') {
                setResultData(res.data);
                setJobState(null);
                setPollingMessage('Evaluation completed successfully. Rendering results.');
                showNotification('Evaluation completed successfully.', 'success');
                return;
            }

            if (status === 'failed') {
                setJobState(null);
                setPollingMessage('Evaluation failed. Please inspect logs and bidders.');
                showNotification('Evaluation failed. See details in console.', 'error');
                return;
            }

            if (attempt >= 12) {
                setPollingMessage('Evaluation is still in progress. Refresh to continue polling later.');
                return;
            }

            setPollingMessage(`Waiting for evaluation result... (${attempt + 1}/12)`);
            setTimeout(() => pollResult(tenderId, attempt + 1), 2000);
        } catch (err) {
            setJobState(null);
            setPollingMessage('Unable to fetch evaluation status at this time.');
            showNotification('Unable to poll evaluation status.', 'error');
            console.error('Poll result error', err);
        }
    };

    const handleEvaluate = async (tender) => {
        try {
            const res = await axios.post(`/evaluate/${tender.id}`);
            setJobState(res.data);
            setResultData(null);
            setPollingMessage('Evaluation job queued. Waiting for worker to process the tender.');
            setSelectedTender(tender);
            setActiveSection('pipeline');
            showNotification('Tender evaluation queued.', 'success');
            pollResult(tender.id);
        } catch (err) {
            showNotification('Evaluation queue failed: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const selectTenderDetail = (tender) => {
        setSelectedTender(tender);
        setActiveSection('pipeline');
    };

    const selectedTenderDetail = selectedTender && (
        <div className="tender-detail-card glass-card">
            <div className="panel-header">
                <h3>{selectedTender.title}</h3>
                <p>{selectedTender.description}</p>
            </div>
            <div className="tender-detail-grid">
                <div><span>Budget</span><strong>{formatCurrency(selectedTender.estimated_budget)}</strong></div>
                <div><span>Deadline</span><strong>{new Date(selectedTender.deadline).toLocaleDateString()}</strong></div>
                <div><span>Required Experience</span><strong>{selectedTender.required_experience || 'N/A'}</strong></div>
                <div><span>Project Type</span><strong>{selectedTender.project_type || 'N/A'}</strong></div>
                <div><span>Status</span><strong>{selectedTender.evaluation_status || 'pending'}</strong></div>
            </div>
        </div>
    );

    if (resultData) {
        return (
            <div className="page-shell page-card-shell">
                <button className="btn btn-secondary back-button" onClick={() => setResultData(null)}>Back to Tenders</button>
                <Dashboard data={resultData} />
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="dashboard-header page-header">
                <h1>Admin Dashboard</h1>
                <p className="subtitle">Design, manage and evaluate tenders with transparent cost-driven decisions.</p>
            </div>

            <div className="dashboard-grid">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-brand">Admin Control</div>
                    <nav className="sidebar-nav">
                        <button className={`sidebar-item ${activeSection === 'create' ? 'active' : ''}`} onClick={() => setActiveSection('create')}>Create Tender</button>
                        <button className={`sidebar-item ${activeSection === 'upload' ? 'active' : ''}`} onClick={() => setActiveSection('upload')}>PDF OCR Upload</button>
                        <button className={`sidebar-item ${activeSection === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveSection('pipeline')}>Tender Pipeline</button>
                    </nav>
                    <div className="sidebar-summary">
                        <div className="summary-label">Live Tender Load</div>
                        <div className="summary-value">{tenders.length}</div>
                        <div className="summary-note">Open tenders currently available</div>
                    </div>
                </aside>

                <main className="dashboard-main">
                    {notification && (
                        <div className={`notification-banner ${notification.type}`}>
                            {notification.message}
                        </div>
                    )}

                    <div className="stats-grid">
                        <div className="metric-card glass-card">
                            <p>Open Tenders</p>
                            <h2>{tenders.length}</h2>
                        </div>
                        <div className="metric-card glass-card">
                            <p>Queued Evaluations</p>
                            <h2>{jobState ? '1 Active' : '0 Active'}</h2>
                        </div>
                        <div className="metric-card glass-card">
                            <p>Recent Notifications</p>
                            <h2>{notification ? notification.message : 'No alerts'}</h2>
                        </div>
                    </div>

                    {activeSection === 'create' && (
                        <section className="glass-card form-panel">
                            <div className="panel-header">
                                <h3>Create New Tender</h3>
                                <p>Create a detailed tender with budget, deadline, project type and experience requirements.</p>
                            </div>
                            <form className="tender-form" onSubmit={handleCreateTender}>
                                <input
                                    className="form-field"
                                    type="text"
                                    placeholder="Tender Title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                                <textarea
                                    className="form-field"
                                    placeholder="Tender Description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    required
                                />
                                <div className="form-row">
                                    <input
                                        className="form-field"
                                        type="number"
                                        placeholder="Estimated Budget (₹)"
                                        value={estimatedBudget}
                                        onChange={e => setEstimatedBudget(e.target.value)}
                                        required
                                    />
                                    <input
                                        className="form-field"
                                        type="text"
                                        placeholder="Project Type"
                                        value={projectType}
                                        onChange={e => setProjectType(e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        className="form-field"
                                        type="text"
                                        placeholder="Required Experience"
                                        value={requiredExperience}
                                        onChange={e => setRequiredExperience(e.target.value)}
                                    />
                                    <input
                                        className="form-field"
                                        type="date"
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">Create Tender</button>
                            </form>
                        </section>
                    )}

                    {activeSection === 'upload' && (
                        <section className="glass-card form-panel">
                            <div className="panel-header">
                                <h3>PDF OCR Preview</h3>
                                <p>Upload a tender PDF, extract the data, and edit it before saving.</p>
                            </div>
                            <form className="tender-form" onSubmit={handleExtractPdf}>
                                <input
                                    className="form-field"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={e => setPdfFile(e.target.files[0])}
                                />
                                <button type="submit" className="btn btn-secondary">Extract and Preview</button>
                            </form>

                            {ocrDraft && (
                                <div className="ocr-edit-card glass-card">
                                    <h4>Editable OCR Draft</h4>
                                    <div className="form-row">
                                        <input
                                            className={`form-field ${fieldChanged('title') ? 'changed-field' : ''}`}
                                            value={ocrDraft.title}
                                            onChange={(e) => handleOcrChange('title', e.target.value)}
                                            placeholder="Tender Title"
                                        />
                                        <input
                                            className={`form-field ${fieldChanged('estimated_budget') ? 'changed-field' : ''}`}
                                            value={ocrDraft.estimated_budget}
                                            onChange={(e) => handleOcrChange('estimated_budget', e.target.value)}
                                            placeholder="Estimated Budget"
                                        />
                                    </div>
                                    <textarea
                                        className={`form-field ${fieldChanged('description') ? 'changed-field' : ''}`}
                                        value={ocrDraft.description}
                                        onChange={(e) => handleOcrChange('description', e.target.value)}
                                        rows={4}
                                    />
                                    <div className="form-row">
                                        <input
                                            className={`form-field ${fieldChanged('deadline') ? 'changed-field' : ''}`}
                                            value={ocrDraft.deadline}
                                            onChange={(e) => handleOcrChange('deadline', e.target.value)}
                                            type="date"
                                            placeholder="Deadline"
                                        />
                                        <input
                                            className={`form-field ${fieldChanged('project_type') ? 'changed-field' : ''}`}
                                            value={ocrDraft.project_type}
                                            onChange={(e) => handleOcrChange('project_type', e.target.value)}
                                            placeholder="Project Type"
                                        />
                                    </div>
                                    <input
                                        className={`form-field ${fieldChanged('required_experience') ? 'changed-field' : ''}`}
                                        value={ocrDraft.required_experience}
                                        onChange={(e) => handleOcrChange('required_experience', e.target.value)}
                                        placeholder="Required Experience"
                                    />
                                    <button className="btn btn-primary" onClick={handleSaveExtractedTender}>Save Extracted Tender</button>
                                </div>
                            )}
                        </section>
                    )}

                    {activeSection === 'pipeline' && (
                        <section className="glass-card table-panel">
                            <div className="table-panel-header">
                                <h3>Tender Pipeline</h3>
                                <p>Review all tenders and trigger the AI evaluation workflow when ready.</p>
                            </div>
                            <div className="table-scroll">
                                <table className="bids-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Deadline</th>
                                            <th>Budget</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenders.map((t) => (
                                            <tr key={t.id}>
                                                <td>{t.id}</td>
                                                <td>{t.title}</td>
                                                <td>{new Date(t.deadline).toLocaleDateString()}</td>
                                                <td>{formatCurrency(t.estimated_budget)}</td>
                                                <td>{t.evaluation_status || 'pending'}</td>
                                                <td className="table-actions">
                                                    <button className="btn btn-secondary" onClick={() => selectTenderDetail(t)}>View</button>
                                                    <button className="btn btn-primary" onClick={() => handleEvaluate(t)}>Evaluate</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {selectedTender && (
                        <section className="glass-card tender-detail-wrapper">
                            <h3>Tender Detail</h3>
                            <div className="tender-detail-card">
                                <div className="tender-detail-grid">
                                    <div>
                                        <span>Title</span>
                                        <strong>{selectedTender.title}</strong>
                                    </div>
                                    <div>
                                        <span>Budget</span>
                                        <strong>{formatCurrency(selectedTender.estimated_budget)}</strong>
                                    </div>
                                    <div>
                                        <span>Deadline</span>
                                        <strong>{new Date(selectedTender.deadline).toLocaleDateString()}</strong>
                                    </div>
                                    <div>
                                        <span>Project Type</span>
                                        <strong>{selectedTender.project_type || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span>Required Experience</span>
                                        <strong>{selectedTender.required_experience || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span>Status</span>
                                        <strong>{selectedTender.evaluation_status || 'pending'}</strong>
                                    </div>
                                </div>
                                <div className="tender-detail-description">
                                    <span>Description</span>
                                    <p>{selectedTender.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
