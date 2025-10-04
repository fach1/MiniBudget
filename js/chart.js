import { UI_CLASSES } from './constants.js';

export function createChartModule(state, canvasElement) {
  let doughnutChart = null;

  function initialize() {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Spent', 'Remaining'],
        datasets: [{
          data: [0, 100],
          backgroundColor: ['#FF5252', '#4CAF50'],
          hoverBackgroundColor: ['#FF867F', '#81C784']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `${tooltipItem.label}: $${tooltipItem.raw.toFixed(2)}`
            }
          }
        }
      }
    });
    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    if (doughnutChart) {
      doughnutChart.resize();
      doughnutChart.update();
    }
  }

  function update() {
    if (!doughnutChart) return;
    const spent = state.currentSpending;
    const remaining = Math.max(state.totalBudget - spent, 0);
    doughnutChart.data.datasets[0].data = [spent, remaining];
    doughnutChart.update();
  }

  return { initialize, update };
}
