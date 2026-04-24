'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function YearlyProgressChart({ monthlyCommits, monthNames, monthlyPercentages }) {
  const nonZeroMonths = [];
  const nonZeroCommits = [];
  const nonZeroPercentages = [];
  
  for (let i = 0; i < 12; i++) {
    if (monthlyCommits[i] > 0) {
      nonZeroMonths.push(monthNames[i]);
      nonZeroCommits.push(monthlyCommits[i]);
      nonZeroPercentages.push(monthlyPercentages[i]);
    }
  }
  
  if (nonZeroMonths.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
        <p className="text-gray-300">No commit data available for this year</p>
      </div>
    );
  }
  
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FFCD56', '#C9CBCF', '#7F8C8D', '#2ECC71',
    '#E74C3C', '#3498DB'
  ];
  
  const data = {
    labels: nonZeroMonths.map((month, i) => `${month} (${nonZeroPercentages[i]}%)`),
    datasets: [
      {
        data: nonZeroCommits,
        backgroundColor: colors.slice(0, nonZeroMonths.length),
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
        position: 'right',
        labels: {
          color: 'white',
          font: {
            size: 10,
          },
        },
      },
      title: {
        display: true,
        text: '📅 Yearly Progress',
        color: 'white',
        font: {
          size: 14,
          weight: 'bold',
        },
      },
    },
  };
  
  const totalCommits = nonZeroCommits.reduce((a, b) => a + b, 0);
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
      <Pie data={data} options={options} />
      <div className="text-center mt-3">
        <p className="text-gray-300 text-xs">
          Total: <span className="text-purple-400 font-bold">{totalCommits}</span> commits
        </p>
      </div>
    </div>
  );
}