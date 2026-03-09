import { useState, useEffect, useCallback } from 'react';
import { Database, ChevronDown, ChevronUp, Trash2, Edit3, Check, X, PlusCircle, Activity } from 'lucide-react';
import './DefinitionsPage.css';

const API = 'http://localhost:5000/api/Sensors';

function DefinitionsPage({ token }) {
    const [definitions, setDefinitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [records, setRecords] = useState({});
    const [editingRecord, setEditingRecord] = useState(null);   // { id, field, value }
    const [editValue, setEditValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);   // definition._id
    const [showAddForm, setShowAddForm] = useState(null);       // definition._id
    const [newValue, setNewValue] = useState('');

    const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};

    // Load danh sách definitions
    const loadDefinitions = useCallback(async () => {
        const res = await fetch(`${API}/definitions`);
        const data = await res.json();
        if (data.success) setDefinitions(data.data);
        setLoading(false);
    }, []);

    useEffect(() => { loadDefinitions(); }, [loadDefinitions]);

    // Load records cho definition khi expand
    const toggleExpand = async (defId) => {
        if (expandedId === defId) { setExpandedId(null); return; }
        setExpandedId(defId);
        
        // Luôn fetch lại dữ liệu mới nhất khi chuyển đổi hoặc mở lại
        const res = await fetch(`${API}/${defId}/GetAllRecords`);
        const data = await res.json();
        setRecords(prev => ({ ...prev, [defId]: data.data || [] }));
    };

    // Xóa tất cả records của definition (cần JWT)
    const deleteAllRecords = async (defId) => {
        const res = await fetch(`${API}/${defId}/DeleteRecords`, {
            method: 'POST', headers: authHeaders,
        });
        const data = await res.json();
        if (data.success) {
            setRecords(prev => ({ ...prev, [defId]: [] }));
            setConfirmDelete(null);
            alert(`✅ ${data.message}`);
        } else {
            alert('❌ ' + data.message);
        }
    };

    // Lưu thay đổi record (cần JWT)
    const saveRecord = async (defId, recordId) => {
        const res = await fetch(`${API}/${defId}/UpdateRecordById/${recordId}`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ value: parseFloat(editValue) }),
        });
        const data = await res.json();
        if (data.success) {
            // Cập nhật lại state records tại chỗ
            setRecords(prev => ({
                ...prev,
                [defId]: prev[defId].map(r => r._id === recordId ? { ...r, value: parseFloat(editValue) } : r),
            }));
            setEditingRecord(null);
        } else {
            alert('❌ ' + data.message);
        }
    };

    // Xóa 1 record duy nhất (cần JWT)
    const deleteRecord = async (defId, recordId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;

        const res = await fetch(`${API}/${defId}/DeleteRecordById/${recordId}`, {
            method: 'POST',
            headers: authHeaders,
        });
        const data = await res.json();
        if (data.success) {
            // Cập nhật lại state records tại chỗ bằng cách lọc bỏ record đã xóa
            setRecords(prev => ({
                ...prev,
                [defId]: prev[defId].filter(r => r._id !== recordId),
            }));
        } else {
            alert('❌ ' + data.message);
        }
    };

    // Tạo mới một record (cần JWT)
    const createRecord = async (defId) => {
        if (!newValue || isNaN(parseFloat(newValue))) {
            alert('Vui lòng nhập giá trị hợp lệ.');
            return;
        }

        const res = await fetch(`${API}/${defId}/CreateRecord`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ value: parseFloat(newValue) }),
        });
        const data = await res.json();
        if (data.success) {
            // Thêm record mới vào đầu danh sách
            setRecords(prev => ({
                ...prev,
                [defId]: [data.data, ...(prev[defId] || [])],
            }));
            setNewValue('');
            setShowAddForm(null);
        } else {
            alert('❌ ' + data.message);
        }
    };

    if (loading) return (
        <div className="loader-container"><div className="loader"></div><p>Đang tải dữ liệu...</p></div>
    );

    return (
        <div className="definitions-container">
            {/* Sidebar: Danh sách các Definition */}
            <div className="def-sidebar">
                <div className="sidebar-header">
                    <h3><Database size={18} /> Cảm biến</h3>
                    <span className="count-badge">{definitions.length}</span>
                </div>
                <div className="sidebar-list">
                    {definitions.map(def => (
                        <div
                            key={def._id}
                            className={`sidebar-item ${expandedId === def._id ? 'active' : ''}`}
                            onClick={() => toggleExpand(def._id)}
                        >
                            <div className="item-dot" style={{ backgroundColor: def.isActive ? '#10b981' : '#9ca3af' }}></div>
                            <div className="item-info">
                                <span className="item-name">{def.name}</span>
                                <span className="item-sub">{def.sensorList?.length || 0} cảm biến</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: Chi tiết và Records */}
            <div className="def-main-content">
                {expandedId ? (
                    (() => {
                        const def = definitions.find(d => d._id === expandedId);
                        if (!def) return null;
                        return (
                            <div className="detail-view">
                                <div className="detail-header">
                                    <div className="header-title">
                                        <div className="title-row">
                                            <h2>{def.name}</h2>
                                            {def.isActive ? (
                                                <span className="status-pill active">Đang hoạt động</span>
                                            ) : (
                                                <span className="status-pill inactive">Ngừng nhận tin</span>
                                            )}
                                        </div>
                                        <p className="description">{def.description}</p>
                                        <div className="tag-cloud">
                                            {(def.sensorList || []).map(s => (
                                                <span key={s} className="tag-item">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {!token && (
                                        <div className="mini-auth-alert">
                                            <Activity size={14} /> Chế độ xem (Đăng nhập để quản lý)
                                        </div>
                                    )}
                                </div>

                                <div className="detail-body">
                                    <div className="records-section-header">
                                        <div className="records-info">
                                            <Activity size={18} className="icon-pulse" />
                                            <h3>Lịch sử dữ liệu</h3>
                                            <span className="records-badge">{(records[def._id] || []).length} bản ghi</span>
                                        </div>

                                        {token && (
                                            <div className="header-actions">
                                                {showAddForm === def._id ? (
                                                    <div className="inline-add-form">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Giá trị..."
                                                            value={newValue}
                                                            onChange={e => setNewValue(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button className="btn-confirm-add" onClick={() => createRecord(def._id)} title="Lưu"><Check size={18} /></button>
                                                        <button className="btn-close-add" onClick={() => { setShowAddForm(null); setNewValue(''); }} title="Đóng"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    <button className="btn-trigger-add" onClick={() => setShowAddForm(def._id)}>
                                                        <PlusCircle size={16} /> Thêm dữ liệu
                                                    </button>
                                                )}

                                                {confirmDelete === def._id ? (
                                                    <div className="confirm-all-box">
                                                        <span>Xóa sạch?</span>
                                                        <button className="btn-yes" onClick={() => deleteAllRecords(def._id)}>Có</button>
                                                        <button className="btn-no" onClick={() => setConfirmDelete(null)}>Không</button>
                                                    </div>
                                                ) : (
                                                    <button className="btn-trigger-delete" onClick={() => setConfirmDelete(def._id)}>
                                                        <Trash2 size={16} /> Xóa hết
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="table-container">
                                        {(records[def._id] || []).length === 0 ? (
                                            <div className="empty-state">
                                                <PlusCircle size={40} />
                                                <p>Chưa có bản ghi nào cho cấu trúc này.</p>
                                            </div>
                                        ) : (
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Thời gian ghi nhận</th>
                                                        <th>Giá trị đo</th>
                                                        <th>Dữ liệu JSON</th>
                                                        {token && <th className="text-right">Thao tác</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(records[def._id] || []).map(r => (
                                                        <tr key={r._id}>
                                                            <td className="col-time">
                                                                {new Date(r.recordedAt).toLocaleString('vi-VN')}
                                                            </td>
                                                            <td className="col-value">
                                                                {editingRecord === r._id ? (
                                                                    <input
                                                                        className="table-edit-input"
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <span className="val-text">{r.value ?? '0'}</span>
                                                                )}
                                                            </td>
                                                            <td className="col-data">
                                                                {r.data ? (
                                                                    <pre className="json-preview">{JSON.stringify(r.data)}</pre>
                                                                ) : <span className="null-text">null</span>}
                                                            </td>
                                                            {token && (
                                                                <td className="col-actions text-right">
                                                                    {editingRecord === r._id ? (
                                                                        <div className="row-action-btns">
                                                                            <button className="row-btn save" onClick={() => saveRecord(def._id, r._id)}><Check size={14} /></button>
                                                                            <button className="row-btn cancel" onClick={() => setEditingRecord(null)}><X size={14} /></button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="row-action-btns">
                                                                            <button className="row-btn edit" onClick={() => { setEditingRecord(r._id); setEditValue(r.value ?? ''); }}>
                                                                                <Edit3 size={14} />
                                                                            </button>
                                                                            <button className="row-btn delete" onClick={() => deleteRecord(def._id, r._id)}>
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="welcome-state">
                        <Database size={60} strokeWidth={1} />
                        <h2>Quản lý Cấu trúc Dữ liệu</h2>
                        <p>Vui lòng chọn một định nghĩa cảm biến từ danh sách bên trái để xem chi tiết và lịch sử dữ liệu.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DefinitionsPage;
