'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MonthlyChart({ monthlyCommits, monthNames }) {
  const data = {
    labels: monthNames,
    datasets: [
      {
        label: 'Commits',
        data: monthlyCommits,
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: '📅 Monthly Commit Activity',
        color: 'white',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
      },
    },
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      <Bar data={data} options={options} />
    </div>
  );
}