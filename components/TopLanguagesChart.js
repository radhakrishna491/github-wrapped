'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TopLanguagesChart({ languages }) {
  if (!languages || languages.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
        <p className="text-gray-300">No language data available</p>
      </div>
    );
  }

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FFCD56', '#C9CBCF', '#7F8C8D', '#2ECC71'
  ];

  const data = {
    labels: languages.map(l => `${l.name} (${l.count})`),
    datasets: [
      {
        data: languages.map(l => l.count),
        backgroundColor: colors.slice(0, languages.length),
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: '🏆 Top Languages',
        color: 'white',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      <Pie data={data} options={options} />
    </div>
  );
}