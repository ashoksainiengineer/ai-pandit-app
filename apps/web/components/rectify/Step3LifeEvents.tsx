export { default as Step3LifeEvents } from './Step3LifeEvents/index';
export default function Step3LifeEventsProxy(props: Record<string, unknown>) {
  const { default: Step3 } = require('./Step3LifeEvents/index');
  return <Step3 {...props} />;
}
