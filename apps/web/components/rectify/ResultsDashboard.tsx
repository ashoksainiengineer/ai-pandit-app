export { default as ResultsDashboard } from './ResultsDashboard/index';
export default function ResultsDashboardProxy(props: any) {
  const { default: Dashboard } = require('./ResultsDashboard/index');
  return <Dashboard {...props} />;
}
