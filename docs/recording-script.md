# Recording script: real Hindi and Punjabi voice lines

Today the voice alert is a recorded clip in English and the phone's own speech engine in Hindi and Punjabi (many phones have no
Punjabi voice, and the app then says so). Captions are always on screen. To add real audio, a native speaker records the
eight lines below: four in Hindi, four in Punjabi, one pair per rail.

> Generated from `src/i18n/*.ts` by `scripts/recording-script.mjs`: rerun it after any of these lines change.
> The Hindi and Punjabi lines are machine-drafted and flagged `needs-native-review`. Read each one aloud first: if a word is
> wrong or unnatural, say it correctly, and send the corrected text back so `src/i18n/hi.ts` or `pa.ts` is fixed to match the
> recording. Do not translate the brand (सबूत / ਸਬੂਤ stays), and do not add a promise the English does not make.

## How to record

1. A quiet room, the phone about a hand's length away, one take per line, a normal speaking pace. Under 8 seconds each: the
   importer compresses to at most 20 KB per clip (about 12 to 18 KB is normal).
2. Save each as `alert-relief-hi.m4a`, `reg-relief-hi.m4a`, `alert-pmfby-hi.m4a`, `reg-pmfby-hi.m4a`, and the same four for `pa`.
   Any format ffmpeg reads works.
3. Import each one (Windows, with ffmpeg installed by you; nothing here installs it):

```
npm run audio:import -- -In C:\rec\alert-relief-hi.m4a -Clip alert-relief -Lang hi -Ffmpeg C:\path\to\ffmpeg.exe
```

   `-Clip` is one of `alert-relief`, `reg-relief`, `alert-pmfby`, `reg-pmfby`; `-Lang` is `hi` or `pa`. The script writes
   `public/audio/<clip>-<lang>.webm` and regenerates `src/lib/clips.ts`, which the app reads. Then `npm run build` and listen
   once on a phone.
4. Run `node scripts/budgets.mjs`: each clip must stay at or under 20 KB.

## The eight lines

### `alert-relief`: The alert call, relief rail

| Language | Say | Save as |
|---|---|---|
| English (already recorded) | Saboot alert. A flood is likely at your field. Please take three photos soon. This is advice, not a deadline. | `alert-relief-en.webm` |
| Hindi | सबूत अलर्ट। आपके खेत में बाढ़ की आशंका है। कृपया जल्दी तीन फ़ोटो लें। यह सलाह है, समय-सीमा नहीं। | `alert-relief-hi.webm` |
| Punjabi | ਸਬੂਤ ਅਲਰਟ। ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਖ਼ਤਰਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਜਲਦੀ ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਲਓ। ਇਹ ਸਲਾਹ ਹੈ, ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ। | `alert-relief-pa.webm` |

### `reg-relief`: The registration call, relief rail

| Language | Say | Save as |
|---|---|---|
| English (already recorded) | Your field is registered. If a flood hits your field, Saboot will call you and ask for three photos. | `reg-relief-en.webm` |
| Hindi | आपका खेत पंजीकृत है। अगर आपके खेत में बाढ़ आती है, तो सबूत आपको फ़ोन करेगा और तीन फ़ोटो माँगेगा। | `reg-relief-hi.webm` |
| Punjabi | ਤੁਹਾਡਾ ਖੇਤ ਰਜਿਸਟਰਡ ਹੈ। ਜੇ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਆਉਂਦਾ ਹੈ, ਤਾਂ ਸਬੂਤ ਤੁਹਾਨੂੰ ਫ਼ੋਨ ਕਰੇਗਾ ਅਤੇ ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਮੰਗੇਗਾ। | `reg-relief-pa.webm` |

### `alert-pmfby`: The alert call, crop-insurance rail

| Language | Say | Save as |
|---|---|---|
| English (already recorded) | Saboot alert. Flooding detected at your field. Your 72‑hour reporting clock has started. Tap “Take photos now” and take three photos. | `alert-pmfby-en.webm` |
| Hindi | सबूत चेतावनी। आपके खेत में बाढ़ पाई गई है। रिपोर्ट करने की 72 घंटे की घड़ी शुरू हो गई है। “अभी फ़ोटो लें” दबाएँ और तीन फ़ोटो लें। | `alert-pmfby-hi.webm` |
| Punjabi | ਸਬੂਤ ਚੇਤਾਵਨੀ। ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਮਿਲਿਆ ਹੈ। ਰਿਪੋਰਟ ਕਰਨ ਦੀ 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ ਸ਼ੁਰੂ ਹੋ ਗਈ ਹੈ। “ਹੁਣੇ ਫ਼ੋਟੋ ਖਿੱਚੋ” ਦਬਾਓ ਅਤੇ ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ। | `alert-pmfby-pa.webm` |

### `reg-pmfby`: The registration call, crop-insurance rail

| Language | Say | Save as |
|---|---|---|
| English (already recorded) | Your field is registered. If a flood hits your field, Saboot will call you. You will then have 72 hours to report. | `reg-pmfby-en.webm` |
| Hindi | आपका खेत पंजीकृत है। अगर आपके खेत में बाढ़ आती है, तो सबूत आपको फ़ोन करेगा। फिर आपके पास रिपोर्ट करने के लिए 72 घंटे होंगे। | `reg-pmfby-hi.webm` |
| Punjabi | ਤੁਹਾਡਾ ਖੇਤ ਰਜਿਸਟਰ ਹੈ। ਜੇ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਆਉਂਦਾ ਹੈ, ਤਾਂ ਸਬੂਤ ਤੁਹਾਨੂੰ ਫ਼ੋਨ ਕਰੇਗਾ। ਫਿਰ ਤੁਹਾਡੇ ਕੋਲ ਰਿਪੋਰਟ ਕਰਨ ਲਈ 72 ਘੰਟੇ ਹੋਣਗੇ। | `reg-pmfby-pa.webm` |
