import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, MapPin, Activity, ArrowRight, Layers } from 'lucide-react';

function Dashboard() {
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            fetch('http://localhost:5000/api/clusters')
                .then(res => res.json())
                .then(data => {
                    setClusters(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Lỗi khi fetch API:', err);
                    setLoading(false);
                });
        };

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-view">
            <div className="section-header">
                <h2><Layers size={28} className="text-primary" /> Tổng quan Khu vực Nuôi</h2>
                <p>Theo dõi trạng thái thời gian thực của các hồ và bể nuôi.</p>
            </div>

            {loading ? (
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Đang đồng bộ dữ liệu...</p>
                </div>
            ) : (
                <div className="clusters-grid">
                    {clusters.length === 0 ? (
                        <div className="empty-state">
                            <p>Chưa có cụm cảm biến nào được kích hoạt.</p>
                        </div>
                    ) : (
                        clusters.map(cluster => (
                            <Link to={`/cluster/${cluster._id}`} className="card cluster-card" key={cluster._id}>
                                <div className="card-header">
                                    <h3>{cluster.name || 'Unnamed Cluster'}</h3>
                                    <span className="badge">{cluster.type}</span>
                                </div>

                                <div className="cluster-meta">
                                    <div className="meta-item">
                                        <MapPin size={18} className="text-muted" />
                                        <span>{cluster.location}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Activity size={18} className="text-muted" />
                                        <span><strong>{cluster.sensors ? cluster.sensors.length : 0}</strong> thiết bị hoạt động</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <span className="btn-link" style={{display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'}}>
                                        Chi tiết <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
