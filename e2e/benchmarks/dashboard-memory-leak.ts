//Initial state
const dashboardOnePanel = 'http://localhost:3000/d/WFkD6ySVz/dashboard-performacne-test-stat-panel?orgId=1';

function url() {
  return dashboardOnePanel;
}

// Action to perform
async function action(page) {
  await page.click('button[aria-label="Zoom out time range"]');
  await page.click('a[aria-label="Dashboards"]');
}

// Go back to initial state
async function back(page) {
  await page.goBack();
}

module.exports = { action, back, url };
