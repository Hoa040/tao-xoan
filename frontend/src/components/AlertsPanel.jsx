import { useState, useEffect } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AlertsPanel.css';

function AlertsPanel() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = () => {
            fetch('http://localhost:5000/api/alerts')
                .then(res => res.json())
                .then(data => {
                    setAlerts(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Lỗi khi fetch Alerts:', err);
                    setLoading(false);
                });
        };

        fetchAlerts();
        // Auto-refresh cảnh báo realtime
        const intervalAlert = setInterval(fetchAlerts, 5000);
        return () => clearInterval(intervalAlert);
    }, []);

    if (loading) return null;
    if (alerts.length === 0) return null; // Không có gì nguy hiểm thì ẩn đi

    return (
        <div className="alerts-container">
            <div className="alerts-header">
                <AlertCircle className="alert-icon-title" />
                <h3>Cảnh báo Môi trường ({alerts.length})</h3>
            </div>
            <div className="alerts-list">
                {alerts.map((alert, idx) => (
                    <div key={idx} className="alert-item">
                        <XCircle className="alert-icon-danger" size={20} />
                        <div className="alert-content">
                            <strong>Cụm {alert.cluster?.name || 'Không xác định'}</strong>
                            <p>
                                {alert.sensor} đang bị <b>{alert.reason}</b> (Đo được: <i>{alert.value} {alert.unit}</i>)
                            </p>
                            <span className="alert-time">
                                Thời gian: {new Date(alert.recordedAt).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <Link to={`/cluster/${alert.cluster?._id}`} className="alert-action-btn">
                            Kiểm tra
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AlertsPanel;
