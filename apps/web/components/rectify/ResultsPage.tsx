export { default as ResultsPage } from './ResultsPage/index';
export default function ResultsPageProxy(props: any) {
  const { default: Results } = require('./ResultsPage/index');
  return <Results {...props} />;
}
