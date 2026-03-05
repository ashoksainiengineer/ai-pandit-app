export { default as Step2PhysicalTraits } from './Step2PhysicalTraits/index';
export default function Step2PhysicalTraitsProxy(props: any) {
    const { default: Step2 } = require('./Step2PhysicalTraits/index');
    return <Step2 {...props} />;
}
