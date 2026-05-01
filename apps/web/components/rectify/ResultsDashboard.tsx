export { default as ResultsDashboard } from './ResultsDashboard/index';
export default function ResultsDashboardProxy(props: Record<string, unknown>) {
  const { default: Dashboard } = require('./ResultsDashboard/index');
  return <Dashboard {...props} />;
}
