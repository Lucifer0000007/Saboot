// Farmer and village names in the farmer's script (audit F15): a Punjabi-reading farmer must be able to read their own name in
// the consent sentence they agree to. The synthetic names are built from a short list of words (scripts/gen-scenario.ts), so
// each word is written once here. A name with a word not on the list stays in Latin script, whole. Logs, exports and the
// officer console keep the Latin name. Machine-drafted transliterations: every line needs native review.
import { langReady } from './i18n';
import type { Lang } from '../sim/types';

const WORDS: Record<string, [hi: string, pa: string]> = {
  Harjit: ['हरजीत', 'ਹਰਜੀਤ'], // needs-native-review
  Gurpreet: ['गुरप्रीत', 'ਗੁਰਪ੍ਰੀਤ'], // needs-native-review
  Sunita: ['सुनीता', 'ਸੁਨੀਤਾ'], // needs-native-review
  Manjit: ['मनजीत', 'ਮਨਜੀਤ'], // needs-native-review
  Jaswinder: ['जसविंदर', 'ਜਸਵਿੰਦਰ'], // needs-native-review
  Savita: ['सविता', 'ਸਵਿਤਾ'], // needs-native-review
  Kamla: ['कमला', 'ਕਮਲਾ'], // needs-native-review
  Rekha: ['रेखा', 'ਰੇਖਾ'], // needs-native-review
  Paramjit: ['परमजीत', 'ਪਰਮਜੀਤ'], // needs-native-review
  Amandeep: ['अमनदीप', 'ਅਮਨਦੀਪ'], // needs-native-review
  Pooja: ['पूजा', 'ਪੂਜਾ'], // needs-native-review
  Nirmal: ['निर्मल', 'ਨਿਰਮਲ'], // needs-native-review
  Baldev: ['बलदेव', 'ਬਲਦੇਵ'], // needs-native-review
  Sukhwinder: ['सुखविंदर', 'ਸੁਖਵਿੰਦਰ'], // needs-native-review
  Ramesh: ['रमेश', 'ਰਮੇਸ਼'], // needs-native-review
  Kuldeep: ['कुलदीप', 'ਕੁਲਦੀਪ'], // needs-native-review
  Rajinder: ['राजिंदर', 'ਰਾਜਿੰਦਰ'], // needs-native-review
  Mohinder: ['मोहिंदर', 'ਮੋਹਿੰਦਰ'], // needs-native-review
  Satnam: ['सतनाम', 'ਸਤਨਾਮ'], // needs-native-review
  Inderjit: ['इंदरजीत', 'ਇੰਦਰਜੀਤ'], // needs-native-review
  Balwinder: ['बलविंदर', 'ਬਲਵਿੰਦਰ'], // needs-native-review
  Jagdish: ['जगदीश', 'ਜਗਦੀਸ਼'], // needs-native-review
  Surjit: ['सुरजीत', 'ਸੁਰਜੀਤ'], // needs-native-review
  Avtar: ['अवतार', 'ਅਵਤਾਰ'], // needs-native-review
  Gurnam: ['गुरनाम', 'ਗੁਰਨਾਮ'], // needs-native-review
  Dalip: ['दलीप', 'ਦਲੀਪ'], // needs-native-review
  Sandhu: ['संधू', 'ਸੰਧੂ'], // needs-native-review
  Gill: ['गिल', 'ਗਿੱਲ'], // needs-native-review
  Dhillon: ['ढिल्लों', 'ਢਿੱਲੋਂ'], // needs-native-review
  Sharma: ['शर्मा', 'ਸ਼ਰਮਾ'], // needs-native-review
  Brar: ['बराड़', 'ਬਰਾੜ'], // needs-native-review
  Rana: ['राणा', 'ਰਾਣਾ'], // needs-native-review
  Sidhu: ['सिद्धू', 'ਸਿੱਧੂ'], // needs-native-review
  Yadav: ['यादव', 'ਯਾਦਵ'], // needs-native-review
  Grewal: ['ग्रेवाल', 'ਗਰੇਵਾਲ'], // needs-native-review
  Saini: ['सैनी', 'ਸੈਣੀ'], // needs-native-review
  Kaur: ['कौर', 'ਕੌਰ'], // needs-native-review
  Singh: ['सिंह', 'ਸਿੰਘ'], // needs-native-review
  Kesarpur: ['केसरपुर', 'ਕੇਸਰਪੁਰ'], // needs-native-review
  Neelkot: ['नीलकोट', 'ਨੀਲਕੋਟ'], // needs-native-review
  Ambwali: ['अंबवाली', 'ਅੰਬਵਾਲੀ'], // needs-native-review
  Dhanpura: ['धनपुरा', 'ਧਨਪੁਰਾ'], // needs-native-review
  Sarangwal: ['सारंगवाल', 'ਸਾਰੰਗਵਾਲ'], // needs-native-review
};

/** A synthetic farmer's or village's name in the script of `lang`; Latin when the language is English or a word is unknown. */
export function nameIn(latin: string, lang: Lang): string {
  if (lang === 'en') return latin;
  const words = latin.split(' ');
  if (!words.every((w) => Object.hasOwn(WORDS, w))) return latin;
  return words.map((w) => WORDS[w][lang === 'hi' ? 0 : 1]).join(' ');
}

/** The same, in the language on screen. */
export const nm = (latin: string) => nameIn(latin, langReady.value);
