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
        if (!records[defId]) {
            const res = await fetch(`${API}/${defId}/GetAllRecords`);
            const data = await res.json();
            setRecords(prev => ({ ...prev, [defId]: data.data || [] }));
        }
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

    if (loading) return (
        <div className="loader-container"><div className="loader"></div><p>Đang tải dữ liệu...</p></div>
    );

    return (
        <div className="definitions-page">
            <div className="section-header">
                <h2><Database size={22} /> Quản lý Cấu trúc Cảm biến (Definitions)</h2>
                <p>Xem và quản lý toàn bộ cấu trúc định nghĩa cảm biến và các dữ liệu ghi nhận liên quan.</p>
            </div>

            {!token && (
                <div className="no-auth-banner">
                    <Activity size={18} />
                    Bạn đang ở chế độ xem. <strong>Đăng nhập Admin</strong> để sử dụng chức năng Xóa và Cập nhật dữ liệu.
                </div>
            )}

            <div className="definitions-list">
                {definitions.map(def => (
                    <div key={def._id} className={`def-card ${expandedId === def._id ? 'expanded' : ''}`}>
                        {/* Header của từng definition */}
                        <div className="def-header" onClick={() => toggleExpand(def._id)}>
                            <div className="def-info">
                                <div className="def-title-row">
                                    <h3>{def.name}</h3>
                                    {def.isActive
                                        ? <span className="badge active-badge">● ACTIVE</span>
                                        : <span className="badge inactive-badge">○ Không hoạt động</span>
                                    }
                                </div>
                                <p className="def-desc">{def.description}</p>
                                <div className="sensor-tags">
                                    {(def.sensorList || []).map(s => (
                                        <span key={s} className="sensor-tag">{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="def-expand-icon">
                                {expandedId === def._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {/* Danh sách Records khi mở rộng */}
                        {expandedId === def._id && (
                            <div className="def-records">
                                <div className="records-toolbar">
                                    <span className="records-count">
                                        <PlusCircle size={16} /> {(records[def._id] || []).length} bản ghi
                                    </span>
                                    {token && (
                                        <>
                                            {confirmDelete === def._id ? (
                                                <div className="confirm-delete">
                                                    <span>Xác nhận xóa tất cả?</span>
                                                    <button className="btn-confirm-yes" onClick={() => deleteAllRecords(def._id)}>Xóa</button>
                                                    <button className="btn-confirm-no" onClick={() => setConfirmDelete(null)}>Hủy</button>
                                                </div>
                                            ) : (
                                                <button className="btn-delete-all" onClick={() => setConfirmDelete(def._id)}>
                                                    <Trash2 size={16} /> Xóa tất cả Records
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {(records[def._id] || []).length === 0 ? (
                                    <p className="no-records">Không có dữ liệu ghi nhận nào.</p>
                                ) : (
                                    <table className="records-table">
                                        <thead>
                                            <tr>
                                                <th>Thời gian</th>
                                                <th>Giá trị (value)</th>
                                                <th>Dữ liệu phụ (data)</th>
                                                {token && <th>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(records[def._id] || []).map(r => (
                                                <tr key={r._id}>
                                                    <td className="td-time-small">
                                                        {new Date(r.recordedAt).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td>
                                                        {editingRecord === r._id ? (
                                                            <input
                                                                className="inline-edit-input"
                                                                type="number"
                                                                step="0.01"
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span className="value-display">{r.value ?? '—'}</span>
                                                        )}
                                                    </td>
                                                    <td className="td-data">
                                                        {r.data ? (
                                                            <code>{JSON.stringify(r.data)}</code>
                                                        ) : '—'}
                                                    </td>
                                                    {token && (
                                                        <td>
                                                            {editingRecord === r._id ? (
                                                                <div className="action-btns">
                                                                    <button className="btn-save" onClick={() => saveRecord(def._id, r._id)}><Check size={16} /></button>
                                                                    <button className="btn-cancel" onClick={() => setEditingRecord(null)}><X size={16} /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="action-btns">
                                                                    <button className="btn-edit" onClick={() => { setEditingRecord(r._id); setEditValue(r.value ?? ''); }}>
                                                                        <Edit3 size={15} /> Sửa
                                                                    </button>
                                                                    <button className="btn-delete-row" onClick={() => deleteRecord(def._id, r._id)}>
                                                                        <Trash2 size={15} /> Xóa
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
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DefinitionsPage;
