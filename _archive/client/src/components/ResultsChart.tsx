import React from 'react';
import { Line } from 'react-chartjs-2';

interface ResultsChartProps {
  data: number[];
  labels: string[];
}

const ResultsChart: React.FC<ResultsChartProps> = ({ data, labels }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Prediction Results',
        data: data,
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h2>Prediction Results Chart</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ResultsChart;