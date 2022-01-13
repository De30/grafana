import { LanguageDefinition } from '../monarch/register';

const cloudWatchMetricMathLanguageDefinition: LanguageDefinition = {
  id: 'cloudwatch-MetricMath',
  extensions: [], // not clear what these are used for yet
  aliases: [], // not clear what these are used for yet
  mimetypes: [], // not clear what these are used for yet
  loader: () => import('./language'),
};
export default cloudWatchMetricMathLanguageDefinition;
