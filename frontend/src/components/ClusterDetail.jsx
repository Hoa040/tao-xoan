import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Thermometer, Droplets, Wind, Gauge, Sun, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';

// ─── Ngưỡng an toàn ───────────────────────────
const SAFE_BOUNDS = {
    'pH': { min: 8, max: 10 },
    'Nhiệt độ': { min: 25, max: 35 },
    'CO2': { min: 1, max: 2 },
    'Độ mặn': { min: 1, max: 2 },
};

const isAlert = (name, value) => {
    const b = SAFE_BOUNDS[name];
    return b ? (value < b.min || value > b.max) : false;
};

// --- Sub-component cho từng Card biểu đồ ---
const SensorChart = ({ name, records, icon }) => {
    const b = SAFE_BOUNDS[name];
    
    // Tạo ID an toàn cho SVG (loại bỏ dấu và khoảng trắng)
    const safeId = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

    const filteredRecords = records
        .filter(r => r.sensorTypeId?.name === name)
        .slice(0, 30)
        .reverse();

    const chartData = filteredRecords.map(r => ({
        time: new Date(r.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        value: r.value,
        alert: isAlert(name, r.value),
    }));

    const latest = filteredRecords[filteredRecords.length - 1];
    const unit = latest?.sensorTypeId?.unit || '';
    const color = isAlert(name, latest?.value) ? "#ef4444" : "#3b82f6"; // Dùng màu Xanh biển mới

    return (
        <div className="sensor-chart-card">
            <div className="sensor-chart-header">
                <div className="sensor-chart-title">
                    {icon}
                    <span>{name}</span>
                </div>
                <div className="sensor-chart-value">
                    {latest?.value ?? '--'} <small>{unit}</small>
                </div>
            </div>

            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`color-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" hide />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        {b && (
                            <>
                                <ReferenceLine y={b.max} stroke="#ef4444" strokeDasharray="3 3" />
                                <ReferenceLine y={b.min} stroke="#f59e0b" strokeDasharray="3 3" />
                            </>
                        )}
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={color} 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill={`url(#color-${safeId})`} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div style={{marginTop:'8px', fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'right'}}>
                {b ? `Ngưỡng: ${b.min} - ${b.max} ${unit}` : 'Chưa thiết lập ngưỡng'}
            </div>
        </div>
    );
};

function ClusterDetail() {
    const { id } = useParams();
    const [cluster, setCluster] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' hoặc 'table'

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('http://localhost:5000/api/clusters').then(r => r.json()),
            fetch(`http://localhost:5000/api/records/${id}`).then(r => r.json())
        ]).then(([clustersData, recordsData]) => {
            setCluster(clustersData.find(c => c._id === id));
            setRecords(recordsData);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const getIcon = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('nhiệt')) return <Thermometer size={18} className="text-orange-500" />;
        if (n.includes('ph') || n.includes('do')) return <Droplets size={18} className="text-cyan-500" />;
        if (n.includes('ánh sáng')) return <Sun size={18} className="text-yellow-500" />;
        if (n.includes('co2')) return <Wind size={18} className="text-gray-500" />;
        return <Activity size={18} />;
    };

    const sensorNames = [...new Set(records.map(r => r.sensorTypeId?.name).filter(Boolean))];
    const alertCount = records.filter(r => isAlert(r.sensorTypeId?.name, r.value)).length;

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!cluster) return <div className="error-state">Không tìm thấy cụm. <Link to="/">Quay lại</Link></div>;

    return (
        <div className="detail-view">
            <Link to="/" className="back-link"><ArrowLeft size={18} /> Quay lại Dashboard</Link>

            <div className="section-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%'}}>
                    <div>
                        <h2 style={{margin:0}}>Theo dõi Cụm: {cluster.name}</h2>
                        <p style={{marginTop:'4px', color:'var(--text-muted)'}}>📍 {cluster.location} • {cluster.type}</p>
                    </div>
                    <div style={{display:'flex', gap:'12px'}}>
                        <button 
                            className={`detail-tab ${viewMode === 'grid' ? 'active' : ''}`} 
                            onClick={() => setViewMode('grid')}
                            style={{padding:'8px 16px', borderRadius:'8px', border:'1px solid #e2e8f0'}}
                        >
                            <BarChart3 size={16} /> Biểu đồ Grid
                        </button>
                        <button 
                            className={`detail-tab ${viewMode === 'table' ? 'active' : ''}`} 
                            onClick={() => setViewMode('table')}
                            style={{padding:'8px 16px', borderRadius:'8px', border:'1px solid #e2e8f0'}}
                        >
                            <Activity size={16} /> Bảng dữ liệu
                        </button>
                    </div>
                </div>
            </div>

            {alertCount > 0 && (
                <div className="badge" style={{background:'#fee2e2', color:'#ef4444', padding:'12px 20px', width:'100%', marginBottom:'24px', borderRadius:'12px', justifyContent:'center'}}>
                    <AlertTriangle size={18} /> <strong>CẢNH BÁO:</strong> Phát hiện {alertCount} chỉ số ngoài ngưỡng an toàn trong 24h qua.
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="sensor-charts-grid">
                    {sensorNames.map(name => (
                        <SensorChart 
                            key={name} 
                            name={name} 
                            records={records} 
                            icon={getIcon(name)} 
                        />
                    ))}
                </div>
            ) : (
                <div className="chart-section card">
                    <div className="records-scroll" style={{maxHeight:'600px', overflowY:'auto'}}>
                        <table className="alerts-table">
                            <thead style={{position:'sticky', top:0, zIndex:10}}>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Cảm biến</th>
                                    <th>Giá trị đo</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r, i) => {
                                    const alert = isAlert(r.sensorTypeId?.name, r.value);
                                    return (
                                        <tr key={i}>
                                            <td style={{color:'var(--text-muted)'}}>{new Date(r.recordedAt).toLocaleString('vi-VN')}</td>
                                            <td style={{fontWeight:600}}>{r.sensorTypeId?.name}</td>
                                            <td style={{fontWeight:700, color: alert ? 'var(--danger)' : 'inherit'}}>
                                                {r.value} {r.sensorTypeId?.unit}
                                            </td>
                                            <td>
                                                {alert 
                                                    ? <span className="status-badge danger">Vượt ngưỡng</span> 
                                                    : <span className="status-badge ok">An toàn</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClusterDetail;
