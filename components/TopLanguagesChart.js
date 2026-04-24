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
            size: 11,
          },
        },
      },
      title: {
        display: true,
        text: '🏆 Top Languages',
        color: 'white',
        font: {
          size: 14,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
      <Pie data={data} options={options} />
    </div>
  );
}