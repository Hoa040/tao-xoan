import { useState, useEffect } from 'react';
import { AlertCircle, Clock, MapPin, Activity, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AlertsPanel.css';

function AlertsPage() {
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
        const intervalAlert = setInterval(fetchAlerts, 5000);
        return () => clearInterval(intervalAlert);
    }, []);

    return (
        <div className="alerts-page">
            <div className="section-header alerts-header-custom">
                <div className="header-title-wrapper">
                    <div className="alert-icon-wrapper pulse-animation">
                        <AlertCircle size={28} color="#e11d48" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2>Nhật ký Sự cố & Cảnh báo</h2>
                        <p>Hệ thống tự động phát hiện và ghi nhận các thông số môi trường vượt ngưỡng an toàn.</p>
                    </div>
                </div>
                <div className="alerts-stats">
                    <div className="stat-badge">
                        <span className="stat-num">{alerts.length}</span>
                        <span className="stat-label">Sự cố cần xử lý</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Đang phân tích dữ liệu cảm biến...</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                        <Activity size={48} color="#10b981" />
                    </div>
                    <h3>Mọi thứ đang hoạt động hoàn hảo</h3>
                    <p>Không phát hiện chỉ số môi trường nào vượt ngưỡng an toàn trong toàn bộ hệ thống ao nuôi.</p>
                </div>
            ) : (
                <div className="alerts-table-container">
                    <table className="alerts-table">
                        <thead>
                            <tr>
                                <th><div className="th-content"><Clock size={16} /> Thời gian phát hiện</div></th>
                                <th><div className="th-content"><MapPin size={16} /> Vị trí Cụm</div></th>
                                <th>Thông số vi phạm</th>
                                <th>Giá trị đo được</th>
                                <th>Mức cảnh báo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert, idx) => (
                                <tr key={idx} className="alert-row">
                                    <td className="td-time">
                                        <span className="time-text">{new Date(alert.recordedAt).toLocaleTimeString('vi-VN')}</span>
                                        <span className="date-text">{new Date(alert.recordedAt).toLocaleDateString('vi-VN')}</span>
                                    </td>
                                    <td className="td-cluster">
                                        <span className="cluster-name">Cụm {alert.cluster?.name || '---'}</span>
                                    </td>
                                    <td className="td-sensor">
                                        <span className={`sensor-badge ${alert.sensor === 'pH' ? 'bg-purple' : alert.sensor === 'Nhiệt độ' ? 'bg-orange' : 'bg-blue'}`}>
                                            {alert.sensor}
                                        </span>
                                    </td>
                                    <td className="td-value">
                                        <span className="value-danger">{alert.value}</span>
                                        <span className="value-unit">{alert.unit}</span>
                                    </td>
                                    <td className="td-reason">
                                        <div className="reason-wrapper">
                                            <span className="reason-dot"></span>
                                            {alert.reason}
                                        </div>
                                    </td>
                                    <td className="td-action">
                                        <Link to={`/cluster/${alert.cluster?._id}`} className="modern-action-btn">
                                            Chi tiết <ArrowUpRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AlertsPage;
