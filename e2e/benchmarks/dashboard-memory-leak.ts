function url() {
  return 'http://localhost:3000/d/I0YIojp7z/repeating-a-row-with-a-repeating-vertical-panel?orgId=1';
}
async function action(page) {
  await page.click('button[aria-label="Zoom out time range"]');
  await page.click('a[aria-label="Dashboards"]');
}
async function back(page) {
  await page.goBack();
}

module.exports = { action, back, url };
