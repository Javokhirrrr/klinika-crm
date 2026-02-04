import React from 'react';
import { FiActivity, FiUsers, FiDollarSign, FiClock } from 'react-icons/fi';
import { TbTrendingUp, TbTrendingDown } from 'react-icons/tb';
import './MetricCard.css';

const MetricCard = ({
    title,
    value,
    unit = '',
    trend,
    trendValue,
    badge,
    icon: Icon,
    color = 'primary'
}) => {
    const isPositiveTrend = trend === 'up';

    return (
        <div className={`metric-card metric-card-${color}`}>
            <div className="metric-card-header">
                <div className="metric-icon-wrapper">
                    {Icon && <Icon className="metric-icon" />}
                </div>
                {badge && (
                    <span className={`metric-badge metric-badge-${badge}`}>
                        {badge}
                    </span>
                )}
            </div>

            <div className="metric-content">
                <div className="metric-value-wrapper">
                    <h2 className="metric-value">
                        {value}
                        {unit && <span className="metric-unit">{unit}</span>}
                    </h2>
                </div>

                <p className="metric-title">{title}</p>

                {trendValue && (
                    <div className={`metric-trend ${isPositiveTrend ? 'trend-up' : 'trend-down'}`}>
                        {isPositiveTrend ? (
                            <TbTrendingUp className="trend-icon" />
                        ) : (
                            <TbTrendingDown className="trend-icon" />
                        )}
                        <span className="trend-value">{trendValue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricCard;
