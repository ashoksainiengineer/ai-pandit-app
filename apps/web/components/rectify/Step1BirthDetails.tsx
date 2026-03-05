export { default as Step1BirthDetails } from './Step1BirthDetails/index';
export default function Step1BirthDetailsProxy(props: any) {
  const { default: Step1 } = require('./Step1BirthDetails/index');
  return <Step1 {...props} />;
}
