# Punjabi review: edit the Punjabi column in place

Every Punjabi string was machine-drafted. Read the English, correct the Punjabi in the third column where it is wrong or unnatural
(keep it short and plain; a farmer under stress is reading it on a phone), and put `ok` or `fixed` in the last column. Leave the
last column empty for anything you did not get to. Rows are in the order a judge sees them: the alert first, the site last.
Do not translate the brand (सबूत / ਸਬੂਤ stays), and never add a promise the English does not make.

| Key | English | Punjabi | ok / fixed |
|---|---|---|---|
| `al.title` | Flood likely at your field | ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਖ਼ਤਰਾ |  |
| `al.msg` | Heavy rain or a rising river was detected near your plot. Flood water is likely. | ਤੁਹਾਡੇ ਖੇਤ ਕੋਲ ਭਾਰੀ ਮੀਂਹ ਜਾਂ ਦਰਿਆ ਦਾ ਵਧਦਾ ਪਾਣੀ ਵੇਖਿਆ ਗਿਆ ਹੈ। ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਦੀ ਸੰਭਾਵਨਾ ਹੈ। |  |
| `al.clock` | Best to capture within | ਇਸ ਦੇ ਅੰਦਰ ਫ਼ੋਟੋ ਲੈਣਾ ਬਿਹਤਰ |  |
| `al.clock.pmfby` | Time left to report | ਰਿਪੋਰਟ ਕਰਨ ਲਈ ਬਾਕੀ ਸਮਾਂ |  |
| `al.started` | The clock started at about {time}, when heavy rain or a rising river was first detected. Photos are most useful while the water is still visible. This is advice, not a legal deadline. | ਘੜੀ ਲਗਭਗ {time} ਵਜੇ ਸ਼ੁਰੂ ਹੋਈ, ਜਦੋਂ ਭਾਰੀ ਮੀਂਹ ਜਾਂ ਦਰਿਆ ਦਾ ਵਧਦਾ ਪਾਣੀ ਪਹਿਲੀ ਵਾਰ ਵੇਖਿਆ ਗਿਆ। ਜਦੋਂ ਤੱਕ ਪਾਣੀ ਦਿਸ ਰਿਹਾ ਹੈ, ਫ਼ੋਟੋਆਂ ਸਭ ਤੋਂ ਵੱਧ ਕੰਮ ਦੀਆਂ ਹੁੰਦੀਆਂ ਹਨ। ਇਹ ਸਲਾਹ ਹੈ, ਕਾਨੂੰਨੀ ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ। |  |
| `al.started.pmfby` | The 72‑hour clock started at {time}, when the event began — not when this message reached you. | 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ {time} ਵਜੇ ਸ਼ੁਰੂ ਹੋਈ, ਜਦੋਂ ਘਟਨਾ ਸ਼ੁਰੂ ਹੋਈ — ਇਹ ਸੁਨੇਹਾ ਮਿਲਣ ਵੇਲੇ ਨਹੀਂ। |  |
| `al.voice` | Saboot alert. A flood is likely at your field. Please take three photos soon. This is advice, not a deadline. | ਸਬੂਤ ਅਲਰਟ। ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਦਾ ਖ਼ਤਰਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਜਲਦੀ ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਲਓ। ਇਹ ਸਲਾਹ ਹੈ, ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ। |  |
| `al.voice.pmfby` | Saboot alert. Flooding detected at your field. Your 72‑hour reporting clock has started. Tap “Take photos now” and take three photos. | ਸਬੂਤ ਚੇਤਾਵਨੀ। ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਮਿਲਿਆ ਹੈ। ਰਿਪੋਰਟ ਕਰਨ ਦੀ 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ ਸ਼ੁਰੂ ਹੋ ਗਈ ਹੈ। “ਹੁਣੇ ਫ਼ੋਟੋ ਖਿੱਚੋ” ਦਬਾਓ ਅਤੇ ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ। |  |
| `al.cta` | Take photos now | ਹੁਣੇ ਫ਼ੋਟੋ ਖਿੱਚੋ |  |
| `al.noDamage` | No damage at my field | ਮੇਰੇ ਖੇਤ ਵਿੱਚ ਨੁਕਸਾਨ ਨਹੀਂ |  |
| `al.help` | Someone will help me | ਕੋਈ ਮੇਰੀ ਮਦਦ ਕਰੇਗਾ |  |
| `al.play` | Play voice message | ਆਵਾਜ਼ ਸੁਨੇਹਾ ਸੁਣੋ |  |
| `al.expired` | Capture-soon advice has passed | ਜਲਦੀ ਫ਼ੋਟੋ ਲੈਣ ਦੀ ਸਲਾਹ ਦਾ ਸਮਾਂ ਲੰਘ ਗਿਆ |  |
| `al.expired.pmfby` | Reporting time is over | ਰਿਪੋਰਟ ਦਾ ਸਮਾਂ ਖ਼ਤਮ |  |
| `al.expiredMsg` | The suggested capture time ended at {time}. This is not a deadline. You can still take photos, and an officer will review them. | ਸੁਝਾਇਆ ਗਿਆ ਫ਼ੋਟੋ ਲੈਣ ਦਾ ਸਮਾਂ {time} ਵਜੇ ਖ਼ਤਮ ਹੋਇਆ। ਇਹ ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ ਹੈ। ਤੁਸੀਂ ਹੁਣ ਵੀ ਫ਼ੋਟੋਆਂ ਲੈ ਸਕਦੇ ਹੋ, ਅਤੇ ਅਧਿਕਾਰੀ ਉਨ੍ਹਾਂ ਨੂੰ ਵੇਖੇਗਾ। |  |
| `al.expiredMsg.pmfby` | The 72‑hour window closed at {time}. You can still save photos and talk to your agriculture officer. | 72 ਘੰਟਿਆਂ ਦਾ ਸਮਾਂ {time} ਵਜੇ ਖ਼ਤਮ ਹੋਇਆ। ਤੁਸੀਂ ਅਜੇ ਵੀ ਫ਼ੋਟੋਆਂ ਸੰਭਾਲ ਸਕਦੇ ਹੋ ਅਤੇ ਖੇਤੀਬਾੜੀ ਅਫ਼ਸਰ ਨਾਲ ਗੱਲ ਕਰ ਸਕਦੇ ਹੋ। |  |
| `al.reminder` | Reminder: about {left} left in the suggested time. Photos take 2 minutes. | ਯਾਦ ਦਿਵਾਉਣਾ: ਸੁਝਾਏ ਸਮੇਂ ਵਿੱਚ ਲਗਭਗ {left} ਬਾਕੀ ਹੈ। ਫ਼ੋਟੋਆਂ ਵਿੱਚ 2 ਮਿੰਟ ਲੱਗਦੇ ਹਨ। |  |
| `al.reminder.pmfby` | Reminder: {left} left. Photos take 2 minutes. | ਯਾਦ ਰੱਖੋ: {left} ਬਾਕੀ ਹਨ। ਫ਼ੋਟੋਆਂ ਵਿੱਚ 2 ਮਿੰਟ ਲੱਗਦੇ ਹਨ। |  |
| `al.lastHours` | Capture soon | ਜਲਦੀ ਫ਼ੋਟੋ ਲਓ |  |
| `al.about` | about {t} | ਲਗਭਗ {t} |  |
| `al.passedWords` | the advice window has passed | ਸਲਾਹ ਦੀ ਮਿਆਦ ਲੰਘ ਗਈ |  |
| `al.advice` | Advice, not a deadline | ਸਲਾਹ, ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ |  |
| `al.lastHours.pmfby` | Last hours | ਆਖ਼ਰੀ ਘੰਟੇ |  |
| `al.noDamageDone` | Thank you. We recorded: no damage. Nothing more is needed from you. | ਧੰਨਵਾਦ। ਅਸੀਂ ਦਰਜ ਕੀਤਾ: ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ। ਤੁਹਾਡੇ ਤੋਂ ਹੋਰ ਕੁਝ ਨਹੀਂ ਚਾਹੀਦਾ। |  |
| `al.noDamageDone.pmfby` | Thank you. We recorded: no damage. No claim will be started. | ਧੰਨਵਾਦ। ਅਸੀਂ ਦਰਜ ਕੀਤਾ: ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ। ਕੋਈ ਦਾਅਵਾ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋਵੇਗਾ। |  |
| `al.undo` | Undo | ਵਾਪਸ ਲਓ |  |
| `al.done` | Photos taken. Next, share your evidence. | ਫ਼ੋਟੋਆਂ ਲੈ ਲਈਆਂ ਗਈਆਂ ਹਨ। ਹੁਣ ਆਪਣਾ ਪ੍ਰਮਾਣ ਸਾਂਝਾ ਕਰੋ। |  |
| `al.done.pmfby` | Photos taken. Next, report your loss. | ਫ਼ੋਟੋਆਂ ਖਿੱਚੀਆਂ ਗਈਆਂ। ਹੁਣ ਆਪਣੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਕਰੋ। |  |
| `al.next` | See my evidence | ਮੇਰਾ ਸਬੂਤ ਵੇਖੋ |  |
| `cap.title` | Take 3 photos | 3 ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ |  |
| `cap.step` | Photo {n} of 3 | ਫ਼ੋਟੋ {n} / 3 |  |
| `cap.open` | Open camera | ਕੈਮਰਾ ਖੋਲ੍ਹੋ |  |
| `cap.shutter` | Take photo | ਫ਼ੋਟੋ ਖਿੱਚੋ |  |
| `cap.sim` | Use simulated photo | ਸਿਮੂਲੇਟਡ ਫ਼ੋਟੋ ਵਰਤੋ |  |
| `cap.retake` | Retake | ਦੁਬਾਰਾ ਖਿੱਚੋ |  |
| `cap.done` | Seal my evidence | ਮੇਰਾ ਸਬੂਤ ਸੀਲ ਕਰੋ |  |
| `cap.locating` | Finding location… | ਥਾਂ ਲੱਭ ਰਹੇ ਹਾਂ… |  |
| `cap.gps` | GPS ±{acc} m | GPS ±{acc} ਮੀ |  |
| `cap.simGps` | Simulated location | ਸਿਮੂਲੇਟਡ ਥਾਂ |  |
| `cap.hashing` | Securing photo… | ਫ਼ੋਟੋ ਸੁਰੱਖਿਅਤ ਕਰ ਰਹੇ ਹਾਂ… |  |
| `cap.old` | This photo is older than this session. Please take a new photo with the camera. | ਇਹ ਫ਼ੋਟੋ ਇਸ ਸੈਸ਼ਨ ਤੋਂ ਪੁਰਾਣੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੈਮਰੇ ਨਾਲ ਨਵੀਂ ਫ਼ੋਟੋ ਖਿੱਚੋ। |  |
| `cap.queued` | Saved on phone. Will send when network returns. | ਫ਼ੋਨ ਵਿੱਚ ਸੰਭਾਲੀ ਗਈ। ਨੈੱਟਵਰਕ ਆਉਣ ਉੱਤੇ ਭੇਜੀ ਜਾਵੇਗੀ। |  |
| `cap.sent` | Sent | ਭੇਜੀ ਗਈ |  |
| `cap.helper` | Taken by helper: {name} | ਸਹਾਇਕ ਨੇ ਖਿੱਚੀ: {name} |  |
| `cap.taken` | Taken | ਖਿੱਚੀ ਗਈ |  |
| `cap.camDenied` | The camera is blocked or not available. Allow the camera in your browser settings and try again. You can also use a simulated photo, which is labelled Simulated. | ਕੈਮਰਾ ਬੰਦ ਹੈ ਜਾਂ ਉਪਲਬਧ ਨਹੀਂ। ਆਪਣੀ ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗ ਵਿੱਚ ਕੈਮਰੇ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ ਅਤੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ। ਤੁਸੀਂ ਸਿਮੂਲੇਟਡ ਫ਼ੋਟੋ ਵੀ ਲੈ ਸਕਦੇ ਹੋ; ਉਸ ਉੱਤੇ "ਸਿਮੂਲੇਟਡ" ਲਿਖਿਆ ਹੋਵੇਗਾ। |  |
| `cap.saveFail` | The photo could not be saved on this phone. Free some space and try again. | ਫ਼ੋਟੋ ਇਸ ਫ਼ੋਨ ਵਿੱਚ ਸੰਭਾਲੀ ਨਹੀਂ ਜਾ ਸਕੀ। ਕੁਝ ਥਾਂ ਖਾਲੀ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। |  |
| `cap.badPhoto` | This photo could not be read. Take it again. | ਇਹ ਫ਼ੋਟੋ ਪੜ੍ਹੀ ਨਹੀਂ ਜਾ ਸਕੀ। ਇਸ ਨੂੰ ਦੁਬਾਰਾ ਲਓ। |  |
| `cap.needConsent` | {farmer} has not agreed yet. Ask for their consent before you take any photo. | {farmer} ਨੇ ਹਾਲੇ ਸਹਿਮਤੀ ਨਹੀਂ ਦਿੱਤੀ। ਕੋਈ ਵੀ ਫ਼ੋਟੋ ਲੈਣ ਤੋਂ ਪਹਿਲਾਂ ਉਨ੍ਹਾਂ ਦੀ ਸਹਿਮਤੀ ਲਓ। |  |
| `cap.askConsent` | Ask for consent | ਸਹਿਮਤੀ ਲਓ |  |
| `shot.wide` | Whole field | ਪੂਰਾ ਖੇਤ |  |
| `shot.wide.d` | Stand at the edge. Show the whole field and the water. | ਕਿਨਾਰੇ ਉੱਤੇ ਖੜ੍ਹੇ ਹੋਵੋ। ਪੂਰਾ ਖੇਤ ਅਤੇ ਪਾਣੀ ਵਿਖਾਓ। |  |
| `shot.close` | Damaged crop, up close | ਖ਼ਰਾਬ ਫ਼ਸਲ, ਨੇੜਿਓਂ |  |
| `shot.close.d` | Show the plants and how high the water is. | ਬੂਟੇ ਅਤੇ ਪਾਣੀ ਦੀ ਉਚਾਈ ਵਿਖਾਓ। |  |
| `shot.landmark` | Landmark | ਪਛਾਣ ਚਿੰਨ੍ਹ |  |
| `shot.landmark.d` | Show something fixed: pump house, tree or boundary stone. | ਕੋਈ ਪੱਕੀ ਚੀਜ਼ ਵਿਖਾਓ: ਮੋਟਰ ਵਾਲਾ ਕਮਰਾ, ਰੁੱਖ ਜਾਂ ਵੱਟ ਦਾ ਪੱਥਰ। |  |
| `as.title` | Get help to take photos | ਫ਼ੋਟੋਆਂ ਲਈ ਮਦਦ ਲਓ |  |
| `as.intro` | A family member or village volunteer can take the photos, with your permission. | ਪਰਿਵਾਰ ਦਾ ਕੋਈ ਜੀਅ ਜਾਂ ਪਿੰਡ ਦਾ ਵਲੰਟੀਅਰ ਤੁਹਾਡੀ ਇਜਾਜ਼ਤ ਨਾਲ ਫ਼ੋਟੋਆਂ ਖਿੱਚ ਸਕਦਾ ਹੈ। |  |
| `as.name` | "Helper's name" | ਸਹਾਇਕ ਦਾ ਨਾਂ |  |
| `as.role` | Helper is | ਸਹਾਇਕ ਕੌਣ ਹੈ |  |
| `as.family` | Family member | ਪਰਿਵਾਰ ਦਾ ਜੀਅ |  |
| `as.volunteer` | Village volunteer | ਪਿੰਡ ਦਾ ਵਲੰਟੀਅਰ |  |
| `as.bank` | Bank or office staff | ਬੈਂਕ ਜਾਂ ਦਫ਼ਤਰ ਦਾ ਮੁਲਾਜ਼ਮ |  |
| `as.consent` | "Farmer's consent" | ਕਿਸਾਨ ਦੀ ਸਹਿਮਤੀ |  |
| `as.consentText` | I, {farmer}, allow {helper} to take photos of my field and send them for my crop loss report. | ਮੈਂ, {farmer}, {helper} ਨੂੰ ਆਪਣੇ ਖੇਤ ਦੀਆਂ ਫ਼ੋਟੋਆਂ ਖਿੱਚਣ ਅਤੇ ਉਹਨਾਂ ਨੂੰ ਮੇਰੀ ਫ਼ਸਲ ਨੁਕਸਾਨ ਰਿਪੋਰਟ ਲਈ ਭੇਜਣ ਦੀ ਇਜਾਜ਼ਤ ਦਿੰਦਾ/ਦਿੰਦੀ ਹਾਂ। |  |
| `as.hold` | Press and hold to agree | ਸਹਿਮਤੀ ਲਈ ਦਬਾ ਕੇ ਰੱਖੋ |  |
| `as.holding` | Keep holding… | ਦਬਾਈ ਰੱਖੋ… |  |
| `as.record` | Record spoken consent | ਬੋਲ ਕੇ ਸਹਿਮਤੀ ਰਿਕਾਰਡ ਕਰੋ |  |
| `as.recording` | Recording… tap to stop | ਰਿਕਾਰਡਿੰਗ… ਰੋਕਣ ਲਈ ਦਬਾਓ |  |
| `as.done` | Consent recorded at {time} | ਸਹਿਮਤੀ {time} ਵਜੇ ਦਰਜ ਹੋਈ |  |
| `as.doneToast` | Consent recorded. | ਸਹਿਮਤੀ ਦਰਜ ਹੋਈ। |  |
| `as.start` | Start photos | ਫ਼ੋਟੋਆਂ ਸ਼ੁਰੂ ਕਰੋ |  |
| `as.needName` | Enter the helper’s name first. | ਪਹਿਲਾਂ ਸਹਾਇਕ ਦਾ ਨਾਂ ਲਿਖੋ। |  |
| `as.voiceSha` | Voice consent · fingerprint {h} | ਆਵਾਜ਼ ਨਾਲ ਸਹਿਮਤੀ · ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ {h} |  |
| `as.holdMethod` | Consent given by press-and-hold | ਦਬਾ ਕੇ ਰੱਖਣ ਨਾਲ ਸਹਿਮਤੀ ਦਿੱਤੀ |  |
| `as.noMic` | Microphone not available. Use press-and-hold instead. | ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਉਪਲਬਧ ਨਹੀਂ। ਦਬਾ ਕੇ ਰੱਖਣ ਵਾਲਾ ਤਰੀਕਾ ਵਰਤੋ। |  |
| `as.means` | What this means | ਇਸ ਦਾ ਮਤਲਬ |  |
| `as.means1` | The photos stay on this phone. Only their fingerprints, the time and a place rounded to about 100 m can be shared. | ਫ਼ੋਟੋਆਂ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਰਹਿੰਦੀਆਂ ਹਨ। ਸਿਰਫ਼ ਉਨ੍ਹਾਂ ਦੀ ਪਛਾਣ-ਛਾਪ, ਸਮਾਂ ਅਤੇ ਲਗਭਗ 100 ਮੀਟਰ ਤੱਕ ਗੋਲ ਕੀਤੀ ਹੋਈ ਥਾਂ ਸਾਂਝੀ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ। |  |
| `as.means2` | The helper only takes the photos. The officer decides. Saboot decides nothing. | ਸਹਾਇਕ ਸਿਰਫ਼ ਫ਼ੋਟੋਆਂ ਖਿੱਚਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ। ਸਬੂਤ ਕੋਈ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। |  |
| `as.means2.pmfby` | The helper only takes the photos. The insurer decides. Saboot decides nothing. | ਸਹਾਇਕ ਸਿਰਫ਼ ਫ਼ੋਟੋਆਂ ਖਿੱਚਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਬੀਮਾ ਕੰਪਨੀ ਕਰਦੀ ਹੈ। ਸਬੂਤ ਕੋਈ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। |  |
| `as.means3` | You can ask for a copy, or for everything to be deleted from this phone, at any time. | ਤੁਸੀਂ ਕਦੇ ਵੀ ਆਪਣੀ ਕਾਪੀ ਮੰਗ ਸਕਦੇ ਹੋ, ਜਾਂ ਇਸ ਫ਼ੋਨ ਤੋਂ ਸਭ ਕੁਝ ਮਿਟਵਾ ਸਕਦੇ ਹੋ। |  |
| `pk.title` | Your evidence | ਤੁਹਾਡਾ ਸਬੂਤ |  |
| `pk.sealed` | Sealed | ਸੀਲ ਕੀਤਾ |  |
| `pk.unsealed` | Not sealed yet | ਅਜੇ ਸੀਲ ਨਹੀਂ |  |
| `pk.location` | Location | ਥਾਂ |  |
| `pk.hash` | Fingerprint | ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ |  |
| `pk.tech` | Technical details: fingerprint, sync log and tamper-evident log | ਤਕਨੀਕੀ ਵੇਰਵੇ: ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ, ਸਿੰਕ ਲੌਗ ਅਤੇ ਛੇੜਛਾੜ-ਸੂਚਕ ਲੌਗ |  |
| `pk.chain` | Tamper-evident log | ਛੇੜਛਾੜ-ਰੋਧੀ ਰਿਕਾਰਡ |  |
| `pk.chainHelp` | Each entry is locked to the one before. Any change breaks the chain. | ਹਰ ਐਂਟਰੀ ਪਿਛਲੀ ਨਾਲ ਜੁੜੀ ਹੈ। ਕੋਈ ਵੀ ਬਦਲਾਅ ਕੜੀ ਤੋੜ ਦਿੰਦਾ ਹੈ। |  |
| `pk.queued` | Waiting for network: {n} queued | ਨੈੱਟਵਰਕ ਦੀ ਉਡੀਕ: {n} ਕਤਾਰ ਵਿੱਚ |  |
| `pk.synced` | Received by server at {time} | ਸਰਵਰ ਨੂੰ {time} ਵਜੇ ਮਿਲਿਆ |  |
| `pk.gap` | Delay of {gap} between photo time and server time — flagged for review. | ਫ਼ੋਟੋ ਦੇ ਸਮੇਂ ਅਤੇ ਸਰਵਰ ਦੇ ਸਮੇਂ ਵਿੱਚ {gap} ਦਾ ਫ਼ਰਕ — ਜਾਂਚ ਲਈ ਨਿਸ਼ਾਨਬੱਧ। |  |
| `pk.cta` | Next: share your evidence | ਅੱਗੇ: ਆਪਣਾ ਪ੍ਰਮਾਣ ਸਾਂਝਾ ਕਰੋ |  |
| `pk.cta.pmfby` | Next: report your loss | ਅੱਗੇ: ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਕਰੋ |  |
| `pk.empty` | No photos yet. | ਅਜੇ ਕੋਈ ਫ਼ੋਟੋ ਨਹੀਂ। |  |
| `pk.device` | Phone time | ਫ਼ੋਨ ਦਾ ਸਮਾਂ |  |
| `pk.server` | Server time | ਸਰਵਰ ਦਾ ਸਮਾਂ |  |
| `pk.syncNow` | Send now | ਹੁਣੇ ਭੇਜੋ |  |
| `pk.prev` | previous | ਪਿਛਲਾ |  |
| `pk.by` | Captured by | ਫ਼ੋਟੋਆਂ ਕਿਸ ਨੇ ਖਿੱਚੀਆਂ |  |
| `pk.byValue` | {name}, {role} | {name}, {role} |  |
| `k.title` | Show it on the judges’ laptop | ਜੱਜਾਂ ਦੇ ਲੈਪਟਾਪ ਉੱਤੇ ਵਿਖਾਓ |  |
| `k.body` | Turn your sealed packet into a signed code. Only fingerprints, times and a rough location are shared; the photos stay on this phone. | ਆਪਣੇ ਸੀਲ ਕੀਤੇ ਪੈਕੇਟ ਨੂੰ ਦਸਤਖ਼ਤੀ ਕੋਡ ਵਿੱਚ ਬਦਲੋ। ਸਿਰਫ਼ ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ, ਸਮਾਂ ਅਤੇ ਅੰਦਾਜ਼ਨ ਥਾਂ ਸਾਂਝੀ ਹੁੰਦੀ ਹੈ; ਫ਼ੋਟੋਆਂ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਰਹਿੰਦੀਆਂ ਹਨ। |  |
| `k.btn` | Share as a QR code | QR ਕੋਡ ਨਾਲ ਸਾਂਝਾ ਕਰੋ |  |
| `k.sheet` | Signed evidence code | ਦਸਤਖ਼ਤੀ ਪ੍ਰਮਾਣ ਕੋਡ |  |
| `k.lead` | Show this QR code to the laptop’s camera, or copy the code or the link. Nothing is sent to any server. | ਇਹ QR ਕੋਡ ਲੈਪਟਾਪ ਦੇ ਕੈਮਰੇ ਨੂੰ ਵਿਖਾਓ, ਜਾਂ ਕੋਡ ਜਾਂ ਲਿੰਕ ਕਾਪੀ ਕਰੋ। ਕੁਝ ਵੀ ਕਿਸੇ ਸਰਵਰ ਉੱਤੇ ਨਹੀਂ ਭੇਜਿਆ ਜਾਂਦਾ। |  |
| `k.qr` | QR code holding your signed evidence code | ਤੁਹਾਡੇ ਦਸਤਖ਼ਤੀ ਪ੍ਰਮਾਣ ਕੋਡ ਵਾਲਾ QR ਕੋਡ |  |
| `k.copyCode` | Copy code | ਕੋਡ ਕਾਪੀ ਕਰੋ |  |
| `k.copyLink` | Copy link | ਲਿੰਕ ਕਾਪੀ ਕਰੋ |  |
| `k.bundle` | Export evidence bundle (JSON) | ਸਬੂਤ ਬੰਡਲ ਕੱਢੋ (JSON) |  |
| `k.bundleNote` | Open format, designed to be ingestible by other systems. It is not an integration with any system. Photos stay on the phone. | ਖੁੱਲ੍ਹਾ ਫਾਰਮੈਟ, ਜਿਸ ਨੂੰ ਹੋਰ ਸਿਸਟਮ ਪੜ੍ਹ ਸਕਣ। ਇਹ ਕਿਸੇ ਸਿਸਟਮ ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ ਨਹੀਂ ਹੈ। ਫ਼ੋਟੋਆਂ ਫ਼ੋਨ ਵਿੱਚ ਹੀ ਰਹਿੰਦੀਆਂ ਹਨ। |  |
| `k.share` | Share link | ਲਿੰਕ ਸਾਂਝਾ ਕਰੋ |  |
| `k.copied` | Copied | ਕਾਪੀ ਹੋ ਗਿਆ |  |
| `k.code` | The code | ਕੋਡ |  |
| `k.making` | Signing your packet… | ਤੁਹਾਡੇ ਪੈਕੇਟ ਉੱਤੇ ਦਸਤਖ਼ਤ ਹੋ ਰਹੇ ਹਨ… |  |
| `k.stay` | Photos stay on this phone. The code holds only their fingerprints. | ਫ਼ੋਟੋਆਂ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਰਹਿੰਦੀਆਂ ਹਨ। ਕੋਡ ਵਿੱਚ ਸਿਰਫ਼ ਉਹਨਾਂ ਦੇ ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਹਨ। |  |
| `k.fail` | Could not make the code. Check that your photos are sealed, then try again. | ਕੋਡ ਨਹੀਂ ਬਣ ਸਕਿਆ। ਜਾਂਚ ਕਰੋ ਕਿ ਤੁਹਾਡੀਆਂ ਫ਼ੋਟੋਆਂ ਸੀਲ ਹੋ ਗਈਆਂ ਹਨ, ਫਿਰ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। |  |
| `set.title` | Settings | ਸੈਟਿੰਗਾਂ |  |
| `set.lang` | Language | ਭਾਸ਼ਾ |  |
| `set.text` | Text size | ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ |  |
| `set.t100` | Normal | ਆਮ |  |
| `set.t125` | Large (+25%) | ਵੱਡਾ (+25%) |  |
| `set.t150` | Larger (+50%) | ਹੋਰ ਵੱਡਾ (+50%) |  |
| `set.voice` | Voice mode | ਆਵਾਜ਼ ਮੋਡ |  |
| `set.voiceHelp` | Reads each screen aloud. | ਹਰ ਸਕਰੀਨ ਪੜ੍ਹ ਕੇ ਸੁਣਾਉਂਦਾ ਹੈ। |  |
| `set.lowData` | Low-data mode | ਘੱਟ ਡਾਟਾ ਮੋਡ |  |
| `set.lowDataHelp` | Hides maps and pictures that are not needed. | ਬੇਲੋੜੇ ਨਕਸ਼ੇ ਅਤੇ ਤਸਵੀਰਾਂ ਲੁਕਾਉਂਦਾ ਹੈ। |  |
| `set.contrast` | High contrast | ਹਾਈ ਕੰਟ੍ਰਾਸਟ |  |
| `set.close` | Close | ਬੰਦ ਕਰੋ |  |
| `set.data` | Your data on this phone | ਇਸ ਫ਼ੋਨ ਉੱਤੇ ਤੁਹਾਡਾ ਡਾਟਾ |  |
| `set.dataHelp` | Photos, consent and sealed packets are kept only on this phone. Nothing is uploaded. You can take a copy or delete it all. | ਫ਼ੋਟੋਆਂ, ਸਹਿਮਤੀ ਅਤੇ ਸੀਲ ਕੀਤੇ ਪੈਕੇਟ ਸਿਰਫ਼ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਰਹਿੰਦੇ ਹਨ। ਕੁਝ ਵੀ ਅੱਪਲੋਡ ਨਹੀਂ ਹੁੰਦਾ। ਤੁਸੀਂ ਇਨ੍ਹਾਂ ਦੀ ਕਾਪੀ ਲੈ ਸਕਦੇ ਹੋ ਜਾਂ ਸਭ ਮਿਟਾ ਸਕਦੇ ਹੋ। |  |
| `set.export` | Export my data (JSON) | ਮੇਰਾ ਡਾਟਾ ਕੱਢੋ (JSON) |  |
| `set.delete` | Delete my data from this phone | ਇਸ ਫ਼ੋਨ ਤੋਂ ਮੇਰਾ ਡਾਟਾ ਮਿਟਾਓ |  |
| `set.deleteAsk` | Delete the photos, consent records and sealed packets on this phone? This cannot be undone. | ਇਸ ਫ਼ੋਨ ਦੀਆਂ ਫ਼ੋਟੋਆਂ, ਸਹਿਮਤੀ ਅਤੇ ਸੀਲ ਕੀਤੇ ਪੈਕੇਟ ਮਿਟਾਉਣੇ ਹਨ? ਇਸ ਨੂੰ ਵਾਪਸ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ। |  |
| `set.deleteYes` | Yes, delete | ਹਾਂ, ਮਿਟਾਓ |  |
| `set.deleteNo` | Keep my data | ਮੇਰਾ ਡਾਟਾ ਰਹਿਣ ਦਿਓ |  |
| `set.deleted` | Your data was deleted from this phone. | ਤੁਹਾਡਾ ਡਾਟਾ ਇਸ ਫ਼ੋਨ ਤੋਂ ਮਿਟਾ ਦਿੱਤਾ ਗਿਆ। |  |
| `reg.title` | Your plot is registered | ਤੁਹਾਡਾ ਖੇਤ ਰਜਿਸਟਰ ਹੈ |  |
| `reg.watching` | Saboot is watching rain, river and satellite signals over your field. | ਸਬੂਤ ਤੁਹਾਡੇ ਖੇਤ ਉੱਤੇ ਮੀਂਹ, ਦਰਿਆ ਅਤੇ ਸੈਟੇਲਾਈਟ ਸੰਕੇਤਾਂ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖ ਰਿਹਾ ਹੈ। |  |
| `reg.allClear` | All clear | ਸਭ ਠੀਕ ਹੈ |  |
| `reg.watch` | Heavy rain watch | ਭਾਰੀ ਮੀਂਹ ਦੀ ਚੇਤਾਵਨੀ |  |
| `reg.rain` | Rain last 24 hours: {mm} mm | ਪਿਛਲੇ 24 ਘੰਟਿਆਂ ਦਾ ਮੀਂਹ: {mm} ਮਿਮੀ |  |
| `reg.crop` | Crop | ਫ਼ਸਲ |  |
| `reg.policy` | Record no. | ਰਿਕਾਰਡ ਨੰ. |  |
| `reg.policy.pmfby` | Policy | ਪਾਲਿਸੀ |  |
| `reg.plot` | Plot | ਖੇਤ |  |
| `reg.khasra` | Khasra no. | ਖਸਰਾ ਨੰ. |  |
| `reg.season` | Season | ਮੌਸਮ |  |
| `reg.kharif` | Kharif 2026 | ਸਾਉਣੀ 2026 |  |
| `reg.voice` | Your field is registered. If a flood hits your field, Saboot will call you and ask for three photos. | ਤੁਹਾਡਾ ਖੇਤ ਰਜਿਸਟਰਡ ਹੈ। ਜੇ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਆਉਂਦਾ ਹੈ, ਤਾਂ ਸਬੂਤ ਤੁਹਾਨੂੰ ਫ਼ੋਨ ਕਰੇਗਾ ਅਤੇ ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਮੰਗੇਗਾ। |  |
| `reg.voice.pmfby` | Your field is registered. If a flood hits your field, Saboot will call you. You will then have 72 hours to report. | ਤੁਹਾਡਾ ਖੇਤ ਰਜਿਸਟਰ ਹੈ। ਜੇ ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਹੜ੍ਹ ਆਉਂਦਾ ਹੈ, ਤਾਂ ਸਬੂਤ ਤੁਹਾਨੂੰ ਫ਼ੋਨ ਕਰੇਗਾ। ਫਿਰ ਤੁਹਾਡੇ ਕੋਲ ਰਿਪੋਰਟ ਕਰਨ ਲਈ 72 ਘੰਟੇ ਹੋਣਗੇ। |  |
| `reg.listen` | Listen | ਸੁਣੋ |  |
| `hm.consentTitle` | Consent from {farmer} | ਕਿਸਾਨ {farmer} ਦੀ ਸਹਿਮਤੀ |  |
| `hm.consentIntro` | Read this out to {farmer}. {farmer} agrees by pressing and holding the button, or by speaking. Nothing is captured without it. | {farmer} ਨੂੰ ਇਹ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ। {farmer} ਬਟਨ ਦਬਾ ਕੇ ਰੱਖ ਕੇ, ਜਾਂ ਬੋਲ ਕੇ ਸਹਿਮਤੀ ਦਿੰਦੇ ਹਨ। ਇਸ ਤੋਂ ਬਿਨਾਂ ਕੁਝ ਵੀ ਦਰਜ ਨਹੀਂ ਹੁੰਦਾ। |  |
| `hm.title` | Helper mode | ਸਹਾਇਕ ਮੋਡ |  |
| `hm.sub` | Capture for several farmers | ਕਈ ਕਿਸਾਨਾਂ ਲਈ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ |  |
| `hm.intro` | For a sarpanch, CSC operator, cooperative or extension worker. Capture for several farmers on this phone. Each farmer gives their own consent, and each farmer’s evidence is sealed on its own. | ਸਰਪੰਚ, ਸੀਐੱਸਸੀ ਚਲਾਉਣ ਵਾਲੇ, ਸਹਿਕਾਰੀ ਸਭਾ ਜਾਂ ਪਸਾਰ ਕਰਮਚਾਰੀ ਲਈ। ਇਸੇ ਫ਼ੋਨ ਤੋਂ ਕਈ ਕਿਸਾਨਾਂ ਲਈ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ। ਹਰ ਕਿਸਾਨ ਆਪਣੀ ਸਹਿਮਤੀ ਦਿੰਦਾ ਹੈ ਅਤੇ ਹਰ ਕਿਸਾਨ ਦਾ ਸਬੂਤ ਵੱਖਰਾ ਸੀਲ ਹੁੰਦਾ ਹੈ। |  |
| `hm.name` | Your name | ਤੁਹਾਡਾ ਨਾਂ |  |
| `hm.role` | You are | ਤੁਸੀਂ ਹੋ |  |
| `hm.needName` | Enter your name to start. | ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣਾ ਨਾਂ ਲਿਖੋ। |  |
| `hm.start` | Start helper session | ਸਹਾਇਕ ਸੈਸ਼ਨ ਸ਼ੁਰੂ ਕਰੋ |  |
| `hm.session` | Helper: {name}, {role} | ਸਹਾਇਕ: {name}, {role} |  |
| `hm.progress` | {done} of {n} farmers done | {n} ਵਿੱਚੋਂ {done} ਕਿਸਾਨਾਂ ਦਾ ਕੰਮ ਪੂਰਾ |  |
| `hm.queue` | Farmers in your queue | ਤੁਹਾਡੀ ਸੂਚੀ ਦੇ ਕਿਸਾਨ |  |
| `hm.speaks` | Speaks {lang} | ਭਾਸ਼ਾ: {lang} |  |
| `hm.by` | Captured by {name}, {role} | {name}, {role} ਨੇ ਫ਼ੋਟੋਆਂ ਖਿੱਚੀਆਂ |  |
| `hm.s.noalert` | No alert yet | ਅਜੇ ਚੇਤਾਵਨੀ ਨਹੀਂ |  |
| `hm.s.consent` | Waiting for consent | ਸਹਿਮਤੀ ਦੀ ਉਡੀਕ |  |
| `hm.s.ready` | Consent recorded | ਸਹਿਮਤੀ ਦਰਜ |  |
| `hm.s.photos` | Photos {n} of 3 | ਫ਼ੋਟੋਆਂ {n} / 3 |  |
| `hm.s.sealed` | Evidence sealed | ਸਬੂਤ ਸੀਲ ਹੋਇਆ |  |
| `hm.s.nodamage` | Farmer reports no damage | ਕਿਸਾਨ ਨੇ ਦੱਸਿਆ: ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ |  |
| `hm.wait` | The alert for this plot comes later in the replay. | ਇਸ ਖੇਤ ਦੀ ਚੇਤਾਵਨੀ ਰੀਪਲੇ ਵਿੱਚ ਅੱਗੇ ਆਵੇਗੀ। |  |
| `hm.a.start` | Start | ਸ਼ੁਰੂ ਕਰੋ |  |
| `hm.a.continue` | Continue | ਜਾਰੀ ਰੱਖੋ |  |
| `hm.a.view` | View | ਵੇਖੋ |  |
| `hm.note` | Each farmer’s consent and photos are sealed in that farmer’s own log, with your name on every photo. You only capture. Saboot decides nothing. | ਹਰ ਕਿਸਾਨ ਦੀ ਸਹਿਮਤੀ ਅਤੇ ਫ਼ੋਟੋਆਂ ਉਸੇ ਕਿਸਾਨ ਦੇ ਆਪਣੇ ਲਾਗ ਵਿੱਚ ਸੀਲ ਹੁੰਦੀਆਂ ਹਨ, ਹਰ ਫ਼ੋਟੋ ਉੱਤੇ ਤੁਹਾਡਾ ਨਾਂ ਰਹਿੰਦਾ ਹੈ। ਤੁਸੀਂ ਸਿਰਫ਼ ਫ਼ੋਟੋਆਂ ਖਿੱਚਦੇ ਹੋ। ਸਬੂਤ ਕੋਈ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। |  |
| `hm.phoneBtn` | A farmer without a smartphone (design simulation) | ਬਿਨਾਂ ਸਮਾਰਟਫ਼ੋਨ ਵਾਲਾ ਕਿਸਾਨ (ਡਿਜ਼ਾਈਨ ਸਿਮੂਲੇਸ਼ਨ) |  |
| `hm.end` | End helper session | ਸਹਾਇਕ ਸੈਸ਼ਨ ਖ਼ਤਮ ਕਰੋ |  |
| `hm.r.sarpanch` | Sarpanch | ਸਰਪੰਚ |  |
| `hm.r.csc` | CSC operator | ਸੀਐੱਸਸੀ ਚਲਾਉਣ ਵਾਲਾ |  |
| `hm.r.coop` | Cooperative worker | ਸਹਿਕਾਰੀ ਸਭਾ ਕਰਮਚਾਰੀ |  |
| `hm.r.ext` | Extension worker | ਪਸਾਰ ਕਰਮਚਾਰੀ |  |
| `hm.bar` | Capturing for {farmer} ({plot}) | {farmer} ({plot}) ਲਈ ਫ਼ੋਟੋਆਂ ਖਿੱਚ ਰਹੇ ਹੋ |  |
| `hm.back` | Back to the queue | ਸੂਚੀ ਉੱਤੇ ਵਾਪਸ |  |
| `hm.card.title` | Helping other farmers? | ਹੋਰ ਕਿਸਾਨਾਂ ਦੀ ਮਦਦ ਕਰ ਰਹੇ ਹੋ? |  |
| `hm.card.body` | Sarpanch, CSC operator, cooperative or extension worker: capture for several farmers on this phone. Each farmer gives their own consent. | ਸਰਪੰਚ, ਸੀਐੱਸਸੀ ਚਲਾਉਣ ਵਾਲੇ, ਸਹਿਕਾਰੀ ਸਭਾ ਜਾਂ ਪਸਾਰ ਕਰਮਚਾਰੀ: ਇਸੇ ਫ਼ੋਨ ਤੋਂ ਕਈ ਕਿਸਾਨਾਂ ਲਈ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ। ਹਰ ਕਿਸਾਨ ਆਪਣੀ ਸਹਿਮਤੀ ਦਿੰਦਾ ਹੈ। |  |
| `hm.card.btn` | Open helper mode | ਸਹਾਇਕ ਮੋਡ ਖੋਲ੍ਹੋ |  |
| `hm.noDamage` | The farmer reports no damage | ਕਿਸਾਨ ਨੇ ਦੱਸਿਆ: ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ |  |
| `hm.next` | Next farmer | ਅਗਲਾ ਕਿਸਾਨ |  |
| `fl.title` | Share your evidence | ਆਪਣਾ ਪ੍ਰਮਾਣ ਸਾਂਝਾ ਕਰੋ |  |
| `fl.title.pmfby` | Report your loss | ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਕਰੋ |  |
| `fl.intro` | Saboot does not submit anything. Show your sealed evidence to the officer who assesses your village. Your details are ready. | ਸਬੂਤ ਕੁਝ ਵੀ ਜਮ੍ਹਾ ਨਹੀਂ ਕਰਦਾ। ਆਪਣੇ ਪਿੰਡ ਦਾ ਮੁਲਾਂਕਣ ਕਰਨ ਵਾਲੇ ਅਧਿਕਾਰੀ ਨੂੰ ਆਪਣਾ ਸੀਲ ਕੀਤਾ ਹੋਇਆ ਪ੍ਰਮਾਣ ਵਿਖਾਓ। ਤੁਹਾਡਾ ਵੇਰਵਾ ਤਿਆਰ ਹੈ। |  |
| `fl.intro.pmfby` | Saboot does not file for you. Report through the official channel. Your details are ready. | ਸਬੂਤ ਤੁਹਾਡੇ ਵੱਲੋਂ ਦਾਅਵਾ ਦਰਜ ਨਹੀਂ ਕਰਦਾ। ਸਰਕਾਰੀ ਰਾਹ ਰਾਹੀਂ ਰਿਪੋਰਟ ਕਰੋ। ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਤਿਆਰ ਹੈ। |  |
| `fl.summary` | Your details | ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ |  |
| `fl.copy` | Copy details | ਜਾਣਕਾਰੀ ਕਾਪੀ ਕਰੋ |  |
| `fl.copied` | Copied | ਕਾਪੀ ਹੋ ਗਈ |  |
| `fl.copyFail` | Could not copy. Please read the details aloud instead. | ਕਾਪੀ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਜਾਣਕਾਰੀ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ। |  |
| `fl.steps` | How to report | ਰਿਪੋਰਟ ਕਿਵੇਂ ਕਰੀਏ |  |
| `fl.s1` | Tell the officer who assesses your village that you have sealed photos of the flood. | ਆਪਣੇ ਪਿੰਡ ਦਾ ਮੁਲਾਂਕਣ ਕਰਨ ਵਾਲੇ ਅਧਿਕਾਰੀ ਨੂੰ ਦੱਸੋ ਕਿ ਤੁਹਾਡੇ ਕੋਲ ਹੜ੍ਹ ਦੀਆਂ ਸੀਲ ਕੀਤੀਆਂ ਫ਼ੋਟੋਆਂ ਹਨ। |  |
| `fl.s1.pmfby` | Call the crop insurance helpline, or open the official crop insurance app. | ਫ਼ਸਲ ਬੀਮਾ ਹੈਲਪਲਾਈਨ ਉੱਤੇ ਫ਼ੋਨ ਕਰੋ, ਜਾਂ ਸਰਕਾਰੀ ਫ਼ਸਲ ਬੀਮਾ ਐਪ ਖੋਲ੍ਹੋ। |  |
| `fl.s2` | Give your plot number and show the details on this screen. | ਆਪਣਾ ਖੇਤ ਨੰਬਰ ਦੱਸੋ ਅਤੇ ਇਸ ਸਕ੍ਰੀਨ ਦਾ ਵੇਰਵਾ ਵਿਖਾਓ। |  |
| `fl.s2.pmfby` | Say: crop loss from flood. Give your policy number and plot number. | ਕਹੋ: ਹੜ੍ਹ ਨਾਲ ਫ਼ਸਲ ਦਾ ਨੁਕਸਾਨ। ਆਪਣਾ ਪਾਲਿਸੀ ਨੰਬਰ ਅਤੇ ਖੇਤ ਨੰਬਰ ਦੱਸੋ। |  |
| `fl.s3` | If asked, read out your evidence fingerprint. | ਪੁੱਛੇ ਜਾਣ ਉੱਤੇ ਆਪਣੇ ਸਬੂਤ ਦਾ ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ। |  |
| `fl.s4` | Write down any receipt or entry number you are given. | ਤੁਹਾਨੂੰ ਜੋ ਵੀ ਰਸੀਦ ਜਾਂ ਐਂਟਰੀ ਨੰਬਰ ਮਿਲੇ, ਉਹ ਲਿਖ ਲਓ। |  |
| `fl.s4.pmfby` | Write down the reference number they give you. | ਉਹ ਜੋ ਹਵਾਲਾ ਨੰਬਰ ਦੇਣ, ਉਸ ਨੂੰ ਲਿਖ ਲਓ। |  |
| `fl.ref` | Receipt or entry number | ਰਸੀਦ ਜਾਂ ਐਂਟਰੀ ਨੰਬਰ |  |
| `fl.ref.pmfby` | Reference number | ਹਵਾਲਾ ਨੰਬਰ |  |
| `fl.refHelp` | Letters and numbers, as given to you. | ਅੱਖਰ ਅਤੇ ਅੰਕ, ਜਿਵੇਂ ਤੁਹਾਨੂੰ ਦਿੱਤੇ ਗਏ। |  |
| `fl.save` | Save receipt number | ਰਸੀਦ ਨੰਬਰ ਸੰਭਾਲੋ |  |
| `fl.save.pmfby` | Save reference number | ਹਵਾਲਾ ਨੰਬਰ ਸੰਭਾਲੋ |  |
| `fl.saved` | Saved: {ref} | ਸੰਭਾਲਿਆ: {ref} |  |
| `fl.bad` | Please enter at least 4 letters or numbers. | ਘੱਟੋ-ਘੱਟ 4 ਅੱਖਰ ਜਾਂ ਅੰਕ ਲਿਖੋ। |  |
| `fl.cause` | Cause | ਕਾਰਨ |  |
| `fl.flood` | Flood / inundation | ਹੜ੍ਹ / ਪਾਣੀ ਭਰਨਾ |  |
| `fl.deadline` | Best before (advice) | ਇਸ ਤੋਂ ਪਹਿਲਾਂ ਬਿਹਤਰ (ਸਲਾਹ) |  |
| `fl.deadline.pmfby` | Report before | ਇਸ ਤੋਂ ਪਹਿਲਾਂ ਰਿਪੋਰਟ ਕਰੋ |  |
| `fl.farmer` | Farmer | ਕਿਸਾਨ |  |
| `fl.event` | Event began | ਘਟਨਾ ਸ਼ੁਰੂ ਹੋਈ |  |
| `st.title` | Claim status | ਦਾਅਵੇ ਦੀ ਸਥਿਤੀ |  |
| `st.note` | Saboot tracks. The officer decides. | ਸਬੂਤ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ। |  |
| `st.note.pmfby` | Saboot tracks. The insurer decides. | ਸਬੂਤ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਬੀਮਾ ਕੰਪਨੀ ਕਰਦੀ ਹੈ। |  |
| `st.detected` | Event detected | ਘਟਨਾ ਪਛਾਣੀ ਗਈ |  |
| `st.alerted` | Alert received | ਚੇਤਾਵਨੀ ਮਿਲੀ |  |
| `st.captured` | Photos taken | ਫ਼ੋਟੋਆਂ ਖਿੱਚੀਆਂ |  |
| `st.synced` | Evidence received | ਸਬੂਤ ਮਿਲਿਆ |  |
| `st.filed` | Shown to the officer | ਅਧਿਕਾਰੀ ਨੂੰ ਵਿਖਾਇਆ |  |
| `st.filed.pmfby` | Loss reported | ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਹੋਈ |  |
| `st.ack` | Officer acknowledged | ਅਧਿਕਾਰੀ ਨੇ ਪੁਸ਼ਟੀ ਕੀਤੀ |  |
| `st.ack.pmfby` | Insurer acknowledged | ਬੀਮਾ ਕੰਪਨੀ ਨੇ ਪੁਸ਼ਟੀ ਕੀਤੀ |  |
| `st.survey` | Field visit | ਖੇਤ ਦਾ ਦੌਰਾ |  |
| `st.survey.pmfby` | Field inspection | ਖੇਤ ਦੀ ਜਾਂਚ |  |
| `st.decision` | Officer’s decision | ਅਧਿਕਾਰੀ ਦਾ ਫ਼ੈਸਲਾ |  |
| `st.decision.pmfby` | Insurer decision | ਬੀਮਾ ਕੰਪਨੀ ਦਾ ਫ਼ੈਸਲਾ |  |
| `st.due` | Best by {time} | ਬਿਹਤਰ ਹੋਵੇਗਾ {time} ਤੱਕ |  |
| `st.due.pmfby` | Due by {time} | {time} ਤੱਕ |  |
| `st.waiting` | Waiting | ਉਡੀਕ |  |
| `st.overdue` | Overdue | ਦੇਰ ਹੋ ਗਈ |  |
| `st.reminders` | Reminders and escalation | ਯਾਦ ਦਿਵਾਉਣਾ ਅਤੇ ਸ਼ਿਕਾਇਤ |  |
| `st.rCapture` | Reminder call: photos not taken yet | ਯਾਦ ਦਿਵਾਉਣ ਵਾਲਾ ਫ਼ੋਨ: ਫ਼ੋਟੋਆਂ ਅਜੇ ਨਹੀਂ ਖਿੱਚੀਆਂ |  |
| `st.rRef` | Reminder: save your receipt number | ਯਾਦ ਦਿਵਾਉਣਾ: ਆਪਣਾ ਰਸੀਦ ਨੰਬਰ ਸੰਭਾਲੋ |  |
| `st.rRef.pmfby` | Reminder: save your reference number | ਯਾਦ ਰੱਖੋ: ਆਪਣਾ ਹਵਾਲਾ ਨੰਬਰ ਸੰਭਾਲੋ |  |
| `st.rAck` | Officer reminded: acknowledgement is due | ਅਧਿਕਾਰੀ ਨੂੰ ਯਾਦ ਦਿਵਾਇਆ: ਪੁਸ਼ਟੀ ਬਾਕੀ ਹੈ |  |
| `st.rAck.pmfby` | Insurer reminded: acknowledgement is due | ਬੀਮਾ ਕੰਪਨੀ ਨੂੰ ਯਾਦ ਦਿਵਾਇਆ: ਪੁਸ਼ਟੀ ਬਾਕੀ ਹੈ |  |
| `st.escalated` | Escalated to the district office | ਜ਼ਿਲ੍ਹਾ ਦਫ਼ਤਰ ਨੂੰ ਭੇਜਿਆ ਗਿਆ |  |
| `st.escalated.pmfby` | Escalated to the district agriculture office | ਜ਼ਿਲ੍ਹਾ ਖੇਤੀਬਾੜੀ ਦਫ਼ਤਰ ਨੂੰ ਭੇਜਿਆ ਗਿਆ |  |
| `st.none` | No reminders needed. | ਅਜੇ ਯਾਦ ਦਿਵਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ। |  |
| `st.decisionNote` | Saboot never decides. The officer does. | ਸਬੂਤ ਕਦੇ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ। |  |
| `st.decisionNote.pmfby` | Saboot never decides claims. | ਸਬੂਤ ਕਦੇ ਵੀ ਦਾਅਵਿਆਂ ਦਾ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। |  |
| `st.surveyAt` | Scheduled {time} | {time} ਲਈ ਤੈਅ |  |
| `f.nav.home` | Home | ਹੋਮ |  |
| `f.nav.photos` | Photos | ਫ਼ੋਟੋ |  |
| `f.nav.packet` | Proof | ਸਬੂਤ |  |
| `f.nav.file` | Share | ਸਾਂਝਾ ਕਰੋ |  |
| `f.nav.file.pmfby` | Report | ਰਿਪੋਰਟ |  |
| `f.nav.status` | Status | ਸਥਿਤੀ |  |
| `f.read` | Read aloud | ਸੁਣੋ |  |
| `f.stop` | Stop | ਰੋਕੋ |  |
| `f.captions` | Captions | ਕੈਪਸ਼ਨ |  |
| `f.voiceNA` | Voice is not available on this phone for this language. Please read the captions. | ਇਸ ਫ਼ੋਨ ਉੱਤੇ ਇਸ ਭਾਸ਼ਾ ਵਿੱਚ ਆਵਾਜ਼ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੈਪਸ਼ਨ ਪੜ੍ਹੋ। |  |
| `f.rewound` | The replay moved forward to your latest action, so nothing you did is lost. | ਰੀਪਲੇ ਤੁਹਾਡੀ ਆਖ਼ਰੀ ਕਾਰਵਾਈ ਤੱਕ ਅੱਗੇ ਵਧ ਗਿਆ, ਇਸ ਲਈ ਤੁਹਾਡਾ ਕੀਤਾ ਹੋਇਆ ਕੁਝ ਵੀ ਨਹੀਂ ਗੁਆਚਿਆ। |  |
| `f.ok` | OK | ਠੀਕ ਹੈ |  |
| `prov.live` | Live | ਲਾਈਵ |  |
| `prov.replay` | Replay | ਰੀਪਲੇ |  |
| `prov.sim` | Simulated | ਸਿਮੂਲੇਟਡ |  |
| `prov.hand` | Entered by hand | ਹੱਥ ਨਾਲ ਦਰਜ |  |
| `prov.by` | by {who} | {who} ਵੱਲੋਂ |  |
| `prov.none` | Origin not recorded | ਸਰੋਤ ਦਰਜ ਨਹੀਂ |  |
| `net.online` | Online | ਆਨਲਾਈਨ |  |
| `net.weak` | Weak (2G) | ਕਮਜ਼ੋਰ (2G) |  |
| `net.offline` | Offline | ਆਫ਼ਲਾਈਨ |  |
| `ctl.label` | Simulation controls | ਸਿਮੂਲੇਸ਼ਨ ਕੰਟਰੋਲ |  |
| `ctl.play` | Play replay | ਰੀਪਲੇ ਚਲਾਓ |  |
| `ctl.pause` | Pause replay | ਰੀਪਲੇ ਰੋਕੋ |  |
| `ctl.scrub` | Replay time, hours after the start | ਰੀਪਲੇ ਸਮਾਂ, ਸ਼ੁਰੂਆਤ ਤੋਂ ਬਾਅਦ ਦੇ ਘੰਟੇ |  |
| `ctl.speed` | Replay speed | ਰੀਪਲੇ ਦੀ ਰਫ਼ਤਾਰ |  |
| `ctl.jump` | Jump to a moment | ਕਿਸੇ ਪਲ ਉੱਤੇ ਜਾਓ |  |
| `ctl.reset` | Reset | ਰੀਸੈੱਟ |  |
| `ctl.resetDone` | Replay reset to T+0. Your actions were cleared. | ਰੀਪਲੇ T+0 ਉੱਤੇ ਰੀਸੈੱਟ ਹੋਇਆ। ਤੁਹਾਡੀਆਂ ਕਾਰਵਾਈਆਂ ਹਟਾ ਦਿੱਤੀਆਂ ਗਈਆਂ। |  |
| `ctl.ask.t` | Clear what this phone captured? | ਇਸ ਫ਼ੋਨ ਉੱਤੇ ਜੋ ਲਿਆ ਗਿਆ, ਉਸ ਨੂੰ ਮਿਟਾਉਣਾ ਹੈ? |  |
| `ctl.ask.b` | Starting over deletes the photos, the consent records and the sealed code on this phone, for every farmer a helper captured for as well. This cannot be undone. | ਮੁੜ ਸ਼ੁਰੂ ਕਰਨ ਨਾਲ ਇਸ ਫ਼ੋਨ ਦੀਆਂ ਫ਼ੋਟੋਆਂ, ਸਹਿਮਤੀ ਦੇ ਰਿਕਾਰਡ ਅਤੇ ਸੀਲ ਕੀਤਾ ਕੋਡ ਮਿਟ ਜਾਣਗੇ, ਉਨ੍ਹਾਂ ਕਿਸਾਨਾਂ ਦੇ ਵੀ ਜਿਨ੍ਹਾਂ ਲਈ ਮਦਦਗਾਰ ਨੇ ਲਿਆ। ਇਸ ਨੂੰ ਵਾਪਸ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ। |  |
| `ctl.ask.keep` | Keep what was captured | ਜੋ ਲਿਆ ਗਿਆ ਹੈ ਉਸ ਨੂੰ ਰੱਖੋ |  |
| `ctl.ask.go` | Clear it and start over | ਮਿਟਾ ਕੇ ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ |  |
| `ctl.more` | More controls | ਹੋਰ ਕੰਟਰੋਲ |  |
| `ctl.moreTitle` | Replay controls | ਰੀਪਲੇ ਕੰਟਰੋਲ |  |
| `ctl.net` | Phone network | ਫ਼ੋਨ ਨੈੱਟਵਰਕ |  |
| `sim.tag` | Simulation | ਸਿਮੂਲੇਸ਼ਨ |  |
| `sim.tagShort` | Sim | SIM |  |
| `sim.eyebrow` | Simulation | ਸਿਮੂਲੇਸ਼ਨ |  |
| `sim.h` | One flood, end to end. | ਇੱਕ ਹੜ੍ਹ, ਸ਼ੁਰੂ ਤੋਂ ਅੰਤ ਤੱਕ। |  |
| `sim.lead` | A week of synthetic weather over {plots} fictional plots. Play it, scrub it or jump to a moment. You hold the farmer’s phone; the officer sees the evidence. | {plots} ਕਾਲਪਨਿਕ ਖੇਤਾਂ ਉੱਤੇ ਇੱਕ ਹਫ਼ਤੇ ਦਾ ਨਕਲੀ ਮੌਸਮ। ਇਸ ਨੂੰ ਚਲਾਓ, ਅੱਗੇ-ਪਿੱਛੇ ਕਰੋ ਜਾਂ ਕਿਸੇ ਪਲ ਉੱਤੇ ਜਾਓ। ਕਿਸਾਨ ਦਾ ਫ਼ੋਨ ਤੁਹਾਡੇ ਹੱਥ ਵਿੱਚ ਹੈ; ਅਧਿਕਾਰੀ ਪ੍ਰਮਾਣ ਵੇਖਦਾ ਹੈ। |  |
| `sim.tabs` | Simulation views | ਸਿਮੂਲੇਸ਼ਨ ਦ੍ਰਿਸ਼ |  |
| `sim.tab.farmer` | Farmer | ਕਿਸਾਨ |  |
| `sim.tab.insurer` | Insurer | ਬੀਮਾ ਕੰਪਨੀ |  |
| `sim.tab.insurer.relief` | Officer | ਅਧਿਕਾਰੀ |  |
| `sim.tab.ledger` | Ledger | ਲੇਜਰ |  |
| `sim.tab.explainer` | Explainer | ਵਿਆਖਿਆ |  |
| `sim.phoneCap` | The farmer’s phone, running for real in your browser | ਕਿਸਾਨ ਦਾ ਫ਼ੋਨ, ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਸੱਚਮੁੱਚ ਚੱਲ ਰਿਹਾ ਹੈ |  |
| `sim.loading` | Loading the flood replay… | ਹੜ੍ਹ ਦਾ ਰੀਪਲੇ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ… |  |
| `sim.loadError` | The simulation data did not load. Check your connection and try again. | ਸਿਮੂਲੇਸ਼ਨ ਦਾ ਡਾਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ। ਆਪਣਾ ਕਨੈਕਸ਼ਨ ਵੇਖੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। |  |
| `sim.retry` | Try again | ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ |  |
| `sim.consoleNote` | The insurer and district console is shown in English. | ਬੀਮਾ ਕੰਪਨੀ ਅਤੇ ਜ਼ਿਲ੍ਹੇ ਦਾ ਕੰਸੋਲ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਵਿਖਾਇਆ ਗਿਆ ਹੈ। |  |
| `sim.consoleNote.relief` | The officer console is shown in English. | ਅਧਿਕਾਰੀ ਦਾ ਕੰਸੋਲ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਵਿਖਾਇਆ ਗਿਆ ਹੈ। |  |
| `nav.farmer` | Farmer app | ਕਿਸਾਨ ਐਪ |  |
| `nav.how` | How it works | ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ |  |
| `nav.settings` | Settings | ਸੈਟਿੰਗਾਂ |  |
| `nav.label` | Sections | ਭਾਗ |  |
| `nav.problem` | Problem | ਸਮੱਸਿਆ |  |
| `nav.sim` | Simulation | ਸਿਮੂਲੇਸ਼ਨ |  |
| `nav.limits` | Honest limits | ਇਮਾਨਦਾਰ ਹੱਦਾਂ |  |
| `nav.run` | Run the simulation | ਸਿਮੂਲੇਸ਼ਨ ਚਲਾਓ |  |
| `nav.menu` | Open menu | ਮੀਨੂ ਖੋਲ੍ਹੋ |  |
| `nav.menuTitle` | Menu | ਮੀਨੂ |  |
| `nav.close` | Close menu | ਮੀਨੂ ਬੰਦ ਕਰੋ |  |
| `nav.lang` | Language | ਭਾਸ਼ਾ |  |
| `hero.eyebrow` | Disaster crop-loss evidence layer | ਆਫ਼ਤ ਵਿੱਚ ਫ਼ਸਲ-ਨੁਕਸਾਨ ਦੇ ਪ੍ਰਮਾਣ ਦੀ ਪਰਤ |  |
| `hero.h` | The clock starts at the storm. | ਘੜੀ ਤੂਫ਼ਾਨ ਨਾਲ ਸ਼ੁਰੂ ਹੁੰਦੀ ਹੈ। |  |
| `hero.l1` | Saboot watches rain, river and satellite signals over registered fields, starts the evidence clock when a flood is likely, and calls the farmer in their language. | ਸਬੂਤ ਰਜਿਸਟਰਡ ਖੇਤਾਂ ਉੱਤੇ ਮੀਂਹ, ਦਰਿਆ ਅਤੇ ਸੈਟੇਲਾਈਟ ਸੰਕੇਤਾਂ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ, ਹੜ੍ਹ ਦਾ ਖ਼ਤਰਾ ਹੁੰਦੇ ਹੀ ਪ੍ਰਮਾਣ ਦੀ ਘੜੀ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ ਅਤੇ ਕਿਸਾਨ ਨੂੰ ਉਸ ਦੀ ਭਾਸ਼ਾ ਵਿੱਚ ਫ਼ੋਨ ਕਰਦਾ ਹੈ। |  |
| `hero.l2` | It guides photos that work offline and seals them so any edit shows. The officer who assesses the loss gets a ranked, checkable trail. | ਇਹ ਆਫ਼ਲਾਈਨ ਵੀ ਚੱਲਣ ਵਾਲੀਆਂ ਫ਼ੋਟੋਆਂ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਇਸ ਤਰ੍ਹਾਂ ਸੀਲ ਕਰਦਾ ਹੈ ਕਿ ਕੋਈ ਵੀ ਤਬਦੀਲੀ ਦਿਸ ਜਾਵੇ। ਨੁਕਸਾਨ ਦਾ ਮੁਲਾਂਕਣ ਕਰਨ ਵਾਲੇ ਅਧਿਕਾਰੀ ਨੂੰ ਕ੍ਰਮਵਾਰ, ਜਾਂਚਣ ਯੋਗ ਰਿਕਾਰਡ ਮਿਲਦਾ ਹੈ। |  |
| `hero.run` | Run the simulation | ਸਿਮੂਲੇਸ਼ਨ ਚਲਾਓ |  |
| `hero.how` | How it works | ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ |  |
| `hero.clockLabel` | Illustration: a clock that starts counting at the storm | ਚਿੱਤਰ: ਇੱਕ ਘੜੀ, ਜੋ ਤੂਫ਼ਾਨ ਨਾਲ ਗਿਣਤੀ ਸ਼ੁਰੂ ਕਰਦੀ ਹੈ |  |
| `hero.clockCap` | Counted from the event, not from the phone call | ਘਟਨਾ ਦੇ ਸਮੇਂ ਤੋਂ ਗਿਣਤੀ, ਫ਼ੋਨ ਕਾਲ ਤੋਂ ਨਹੀਂ |  |
| `pb.eyebrow` | The problem | ਸਮੱਸਿਆ |  |
| `pb.h` | Evidence fades faster than assessments happen. | ਪ੍ਰਮਾਣ ਮੁਲਾਂਕਣ ਤੋਂ ਪਹਿਲਾਂ ਹੀ ਫਿੱਕੇ ਪੈ ਜਾਂਦੇ ਹਨ। |  |
| `pb.1.t` | Assessed after the water is gone | ਪਾਣੀ ਉੱਤਰਨ ਤੋਂ ਬਾਅਦ ਮੁਲਾਂਕਣ |  |
| `pb.1.b` | A loss assessment is usually a walk through the fields once the flood has gone down, when the evidence has already faded. | ਨੁਕਸਾਨ ਦਾ ਮੁਲਾਂਕਣ ਆਮ ਤੌਰ ਉੱਤੇ ਹੜ੍ਹ ਉੱਤਰਨ ਤੋਂ ਬਾਅਦ ਖੇਤਾਂ ਵਿੱਚ ਘੁੰਮ ਕੇ ਹੁੰਦਾ ਹੈ, ਜਦੋਂ ਤੱਕ ਪ੍ਰਮਾਣ ਫਿੱਕੇ ਪੈ ਚੁੱਕੇ ਹੁੰਦੇ ਹਨ। |  |
| `pb.2.t` | Nobody tells the farmer what to capture | ਕਿਸਾਨ ਨੂੰ ਕੋਈ ਨਹੀਂ ਦੱਸਦਾ ਕਿ ਕੀ ਖਿੱਚਣਾ ਹੈ |  |
| `pb.2.b` | The water arrives before any message does. A farmer rarely hears that a loss clock has started, or which proof will help. | ਪਾਣੀ ਕਿਸੇ ਵੀ ਸੁਨੇਹੇ ਤੋਂ ਪਹਿਲਾਂ ਆ ਜਾਂਦਾ ਹੈ। ਕਿਸਾਨ ਨੂੰ ਸ਼ਾਇਦ ਹੀ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਨੁਕਸਾਨ ਦੀ ਘੜੀ ਸ਼ੁਰੂ ਹੋ ਗਈ ਹੈ, ਜਾਂ ਕਿਹੜਾ ਪ੍ਰਮਾਣ ਕੰਮ ਆਵੇਗਾ। |  |
| `pb.3.t` | Proof that can be questioned | ਪ੍ਰਮਾਣ, ਜਿਸ ਉੱਤੇ ਸਵਾਲ ਉੱਠ ਸਕਦੇ ਹਨ |  |
| `pb.3.b` | A photo without a trusted time and place is easy to doubt. Late or doubtful evidence makes a fair assessment harder. | ਭਰੋਸੇਯੋਗ ਸਮੇਂ ਅਤੇ ਥਾਂ ਤੋਂ ਬਿਨਾਂ ਫ਼ੋਟੋ ਉੱਤੇ ਸ਼ੱਕ ਕਰਨਾ ਸੌਖਾ ਹੈ। ਦੇਰ ਨਾਲ ਮਿਲਿਆ ਜਾਂ ਸ਼ੱਕੀ ਪ੍ਰਮਾਣ ਨਿਰਪੱਖ ਮੁਲਾਂਕਣ ਨੂੰ ਔਖਾ ਬਣਾਉਂਦਾ ਹੈ। |  |
| `faq.eyebrow` | Honest limits | ਇਮਾਨਦਾਰ ਹੱਦਾਂ |  |
| `faq.h` | What Saboot does not do. | ਸਬੂਤ ਕੀ ਨਹੀਂ ਕਰਦਾ। |  |
| `faq.q1` | What is Saboot, and what is it not? | ਸਬੂਤ ਕੀ ਹੈ, ਅਤੇ ਕੀ ਨਹੀਂ ਹੈ? |  |
| `faq.a1` | Saboot is an evidence layer for crop losses after disasters. It watches signals, starts a clock at the event, asks the farmer for photos, seals them, and gives officers a ranked, checkable trail.' 'It is not a claims system, an insurer or a government portal. It files nothing, pays nothing, places no real calls and connects to no government system. | ਸਬੂਤ ਆਫ਼ਤ ਤੋਂ ਬਾਅਦ ਫ਼ਸਲ-ਨੁਕਸਾਨ ਲਈ ਪ੍ਰਮਾਣ ਦੀ ਇੱਕ ਪਰਤ ਹੈ। ਇਹ ਸੰਕੇਤਾਂ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ, ਘਟਨਾ ਦੇ ਸਮੇਂ ਤੋਂ ਘੜੀ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ, ਕਿਸਾਨ ਤੋਂ ਫ਼ੋਟੋਆਂ ਮੰਗਦਾ ਹੈ, ਉਨ੍ਹਾਂ ਨੂੰ ਸੀਲ ਕਰਦਾ ਹੈ ਅਤੇ ਅਧਿਕਾਰੀਆਂ ਨੂੰ ਕ੍ਰਮਵਾਰ, ਜਾਂਚਣ ਯੋਗ ਰਿਕਾਰਡ ਦਿੰਦਾ ਹੈ।' 'ਇਹ ਦਾਅਵਾ-ਪ੍ਰਣਾਲੀ, ਬੀਮਾ ਕੰਪਨੀ ਜਾਂ ਸਰਕਾਰੀ ਪੋਰਟਲ ਨਹੀਂ ਹੈ। ਇਹ ਕੁਝ ਜਮ੍ਹਾ ਨਹੀਂ ਕਰਦਾ, ਕੋਈ ਭੁਗਤਾਨ ਨਹੀਂ ਕਰਦਾ, ਕੋਈ ਅਸਲੀ ਕਾਲ ਨਹੀਂ ਕਰਦਾ ਅਤੇ ਕਿਸੇ ਸਰਕਾਰੀ ਪ੍ਰਣਾਲੀ ਨਾਲ ਨਹੀਂ ਜੁੜਦਾ। |  |
| `faq.q2` | Does Saboot decide who is eligible or what is paid? | ਕੀ ਸਬੂਤ ਤੈਅ ਕਰਦਾ ਹੈ ਕਿ ਕੌਣ ਯੋਗ ਹੈ ਜਾਂ ਕਿੰਨਾ ਭੁਗਤਾਨ ਹੋਵੇਗਾ? |  |
| `faq.a2` | No. Saboot assembles evidence and ranks it for review. A person at the department or the insurer decides, outside Saboot.' 'Every score on screen is an evidence tier, not a decision about eligibility or compensation, and every tier shows its uncertainty. | ਨਹੀਂ। ਸਬੂਤ ਪ੍ਰਮਾਣ ਇਕੱਠਾ ਕਰਦਾ ਹੈ ਅਤੇ ਸਮੀਖਿਆ ਲਈ ਉਸ ਦਾ ਕ੍ਰਮ ਬਣਾਉਂਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਵਿਭਾਗ ਜਾਂ ਬੀਮਾ ਕੰਪਨੀ ਦਾ ਵਿਅਕਤੀ ਕਰਦਾ ਹੈ, ਸਬੂਤ ਦੇ ਬਾਹਰ।' 'ਸਕ੍ਰੀਨ ਉੱਤੇ ਹਰ ਸਕੋਰ ਇੱਕ ਪ੍ਰਮਾਣ-ਪੱਧਰ ਹੈ, ਯੋਗਤਾ ਜਾਂ ਮੁਆਵਜ਼ੇ ਦਾ ਫ਼ੈਸਲਾ ਨਹੀਂ, ਅਤੇ ਹਰ ਪੱਧਰ ਆਪਣੀ ਅਨਿਸ਼ਚਿਤਤਾ ਦਿਖਾਉਂਦਾ ਹੈ। |  |
| `faq.q3` | How does it handle hail? | ਗੜੇਮਾਰੀ ਨੂੰ ਇਹ ਕਿਵੇਂ ਸੰਭਾਲਦਾ ਹੈ? |  |
| `faq.a3` | Saboot cannot confirm hail from the signals it watches in this demo, so it never claims to detect it.' 'It sends a low-confidence prompt to farmers in the storm’s path and asks whether hail hit their field. Everything that follows is labelled farmer-reported. | ਇਸ ਡੈਮੋ ਵਿੱਚ ਸਬੂਤ ਜਿਨ੍ਹਾਂ ਸੰਕੇਤਾਂ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ, ਉਹਨਾਂ ਨਾਲ ਉਹ ਗੜੇਮਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਨਹੀਂ ਕਰ ਸਕਦਾ, ਇਸ ਲਈ ਉਹ ਇਸ ਨੂੰ ਪਛਾਣਨ ਦਾ ਦਾਅਵਾ ਕਦੇ ਨਹੀਂ ਕਰਦਾ।' 'ਉਹ ਤੂਫ਼ਾਨ ਦੇ ਰਾਹ ਵਿਚਲੇ ਕਿਸਾਨਾਂ ਨੂੰ ਘੱਟ-ਭਰੋਸੇ ਵਾਲਾ ਸੁਨੇਹਾ ਭੇਜ ਕੇ ਪੁੱਛਦਾ ਹੈ ਕਿ ਕੀ ਉਹਨਾਂ ਦੇ ਖੇਤ ਵਿੱਚ ਗੜੇ ਪਏ। ਉਸ ਤੋਂ ਬਾਅਦ ਦੀ ਹਰ ਚੀਜ਼ ਉੱਤੇ “ਕਿਸਾਨ ਵੱਲੋਂ ਦੱਸਿਆ” ਲਿਖਿਆ ਹੁੰਦਾ ਹੈ। |  |
| `faq.q4` | Are offline timestamps tamper-proof? | ਕੀ ਆਫ਼ਲਾਈਨ ਸਮਾਂ-ਮੋਹਰਾਂ ਛੇੜਛਾੜ ਤੋਂ ਸੁਰੱਖਿਅਤ ਹਨ? |  |
| `faq.a4` | No. A phone clock can be changed. Saboot records the phone time and the server receipt time side by side and flags large gaps for review.' 'The hash chain shows whether a record changed after it was made. It cannot prove that the phone clock was right. | ਨਹੀਂ। ਫ਼ੋਨ ਦੀ ਘੜੀ ਬਦਲੀ ਜਾ ਸਕਦੀ ਹੈ। ਸਬੂਤ ਫ਼ੋਨ ਦਾ ਸਮਾਂ ਅਤੇ ਸਰਵਰ ਨੂੰ ਮਿਲਣ ਦਾ ਸਮਾਂ ਨਾਲ-ਨਾਲ ਦਰਜ ਕਰਦਾ ਹੈ ਅਤੇ ਵੱਡੇ ਫ਼ਰਕ ਨੂੰ ਜਾਂਚ ਲਈ ਨਿਸ਼ਾਨਬੱਧ ਕਰਦਾ ਹੈ।' 'ਹੈਸ਼ ਚੇਨ ਵਿਖਾਉਂਦੀ ਹੈ ਕਿ ਕੋਈ ਰਿਕਾਰਡ ਬਣਨ ਤੋਂ ਬਾਅਦ ਬਦਲਿਆ ਗਿਆ ਜਾਂ ਨਹੀਂ। ਇਹ ਸਾਬਤ ਨਹੀਂ ਕਰ ਸਕਦੀ ਕਿ ਫ਼ੋਨ ਦੀ ਘੜੀ ਸਹੀ ਸੀ। |  |
| `faq.q5` | Who controls the evidence? | ਪ੍ਰਮਾਣ ਉੱਤੇ ਕੰਟਰੋਲ ਕਿਸ ਦਾ ਹੈ? |  |
| `faq.a5` | Saboot is meant to be a neutral evidence layer. The farmer keeps a copy of their packet on their phone, and insurers and officers see it only with the farmer’s consent.' 'In this simulation everything runs on your phone and nothing leaves it unless you choose to share it. | ਸਬੂਤ ਇੱਕ ਨਿਰਪੱਖ ਪ੍ਰਮਾਣ-ਪਰਤ ਬਣਨ ਲਈ ਹੈ। ਕਿਸਾਨ ਆਪਣੇ ਪੈਕੇਟ ਦੀ ਇੱਕ ਕਾਪੀ ਆਪਣੇ ਫ਼ੋਨ ਉੱਤੇ ਰੱਖਦਾ ਹੈ, ਅਤੇ ਬੀਮਾ ਕੰਪਨੀ ਤੇ ਅਫ਼ਸਰ ਉਸ ਨੂੰ ਸਿਰਫ਼ ਕਿਸਾਨ ਦੀ ਸਹਿਮਤੀ ਨਾਲ ਵੇਖਦੇ ਹਨ।' 'ਇਸ ਸਿਮੂਲੇਸ਼ਨ ਵਿੱਚ ਸਭ ਕੁਝ ਤੁਹਾਡੇ ਫ਼ੋਨ ਉੱਤੇ ਚੱਲਦਾ ਹੈ ਅਤੇ ਜਦੋਂ ਤੱਕ ਤੁਸੀਂ ਆਪ ਸਾਂਝਾ ਨਾ ਕਰੋ, ਕੁਝ ਵੀ ਫ਼ੋਨ ਤੋਂ ਬਾਹਰ ਨਹੀਂ ਜਾਂਦਾ। |  |
| `faq.q6` | What is real and what is simulated? | ਇੱਥੇ ਕੀ ਅਸਲੀ ਹੈ ਅਤੇ ਕੀ ਸਿਮੂਲੇਟਡ? |  |
| `faq.a6` | Real in your browser: camera and location, SHA-256 fingerprints and the hash chain, the offline queue, voice playback and the offline app itself.' 'Simulated: the rain, the river gauges, the satellite flood maps, the server, the voice call, the officer or insurer, the filing channel, and all {plots} plots and their farmers. Every number on screen comes from the simulation.' // {{VERIFY: Sentinel-1 radar revisit interval over India (about 6–12 days) — ESA Sentinel-1 mission overview, sentinels.copernicus.eu}} 'Real satellite radar passes the same field only every few days. The demo assumes a pass every {cadence} hours, and the slower option every {slow} hours; both cadences are simulated. | ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਅਸਲੀ: ਕੈਮਰਾ ਅਤੇ ਲੋਕੇਸ਼ਨ, SHA-256 ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਅਤੇ ਹੈਸ਼ ਚੇਨ, ਆਫ਼ਲਾਈਨ ਕਤਾਰ, ਆਵਾਜ਼ ਚਲਾਉਣਾ ਅਤੇ ਆਫ਼ਲਾਈਨ ਐਪ ਆਪ।' 'ਸਿਮੂਲੇਟ ਕੀਤਾ: ਮੀਂਹ, ਦਰਿਆ ਦੇ ਮਾਪਕ, ਸੈਟੇਲਾਈਟ ਹੜ੍ਹ-ਨਕਸ਼ੇ, ਸਰਵਰ, ਫ਼ੋਨ ਕਾਲ, ਅਧਿਕਾਰੀ ਜਾਂ ਬੀਮਾ ਕੰਪਨੀ, ਦਰਜ ਕਰਨ ਦਾ ਰਾਹ, ਅਤੇ ਸਾਰੇ {plots} ਖੇਤ ਤੇ ਉਨ੍ਹਾਂ ਦੇ ਕਿਸਾਨ। ਸਕ੍ਰੀਨ ਦੀ ਹਰ ਗਿਣਤੀ ਸਿਮੂਲੇਸ਼ਨ ਤੋਂ ਆਉਂਦੀ ਹੈ।' 'ਅਸਲੀ ਸੈਟੇਲਾਈਟ ਰਡਾਰ ਇੱਕੋ ਖੇਤ ਦੇ ਉੱਪਰੋਂ ਸਿਰਫ਼ ਕੁਝ ਦਿਨਾਂ ਵਿੱਚ ਲੰਘਦਾ ਹੈ। ਡੈਮੋ ਵਿੱਚ ਹਰ {cadence} ਘੰਟੇ ਵਿੱਚ ਇੱਕ ਪਾਸ ਮੰਨਿਆ ਗਿਆ ਹੈ ਅਤੇ ਹੌਲੀ ਵਿਕਲਪ ਵਿੱਚ ਹਰ {slow} ਘੰਟੇ ਵਿੱਚ; ਦੋਵੇਂ ਚੱਕਰ ਸਿਮੂਲੇਟ ਕੀਤੇ ਹਨ। |  |
| `faq.q7` | Has any of this been validated on real floods? | ਕੀ ਇਹ ਸਭ ਅਸਲੀ ਹੜ੍ਹਾਂ ਉੱਤੇ ਪਰਖਿਆ ਗਿਆ ਹੈ? |  |
| `faq.a7` | No. The precision and recall on screen are a consistency check against the simulator’s own synthetic truth, not a validation. The river rule works in the replay because the gauge series come from the same simulated flood.' 'Real-data validation, replaying past floods against villages that an official process later confirmed as affected, has not been run yet. The product says so until a real report exists. | ਨਹੀਂ। ਸਕ੍ਰੀਨ ਉੱਤੇ ਦਿਖਦੀ ਪ੍ਰਿਸੀਜ਼ਨ ਅਤੇ ਰਿਕਾਲ ਸਿਮੂਲੇਟਰ ਦੇ ਆਪਣੇ ਨਕਲੀ ਸੱਚ ਦੇ ਵਿਰੁੱਧ ਇੱਕ ਸੰਗਤੀ-ਜਾਂਚ ਹੈ, ਪਰਖ ਨਹੀਂ। ਰੀਪਲੇ ਵਿੱਚ ਦਰਿਆ ਦਾ ਨਿਯਮ ਇਸ ਲਈ ਚੱਲਦਾ ਹੈ ਕਿ ਮਾਪਕ ਦੀ ਲੜੀ ਉਸੇ ਸਿਮੂਲੇਟ ਕੀਤੇ ਹੜ੍ਹ ਤੋਂ ਬਣੀ ਹੈ।' 'ਅਸਲੀ ਡਾਟੇ ਉੱਤੇ ਪਰਖ, ਯਾਨੀ ਬੀਤੇ ਹੜ੍ਹਾਂ ਨੂੰ ਉਨ੍ਹਾਂ ਪਿੰਡਾਂ ਦੇ ਵਿਰੁੱਧ ਦੁਹਰਾਉਣਾ ਜਿਨ੍ਹਾਂ ਨੂੰ ਕਿਸੇ ਅਧਿਕਾਰਤ ਪ੍ਰਕਿਰਿਆ ਨੇ ਬਾਅਦ ਵਿੱਚ ਪ੍ਰਭਾਵਿਤ ਮੰਨਿਆ, ਅਜੇ ਨਹੀਂ ਕੀਤੀ ਗਈ। ਅਸਲੀ ਰਿਪੋਰਟ ਆਉਣ ਤੱਕ ਉਤਪਾਦ ਇਹੀ ਦੱਸਦਾ ਹੈ। |  |
| `faq.q8` | Who pays for it? | ਇਸ ਦਾ ਖ਼ਰਚਾ ਕੌਣ ਚੁੱਕੇਗਾ? |  |
| `faq.a8` | Our proposal, not an existing arrangement: a state or district department licenses Saboot and pays a fee per event. Farmers pay nothing. Insurers could join later on the PMFBY rail. | ਸਾਡਾ ਪ੍ਰਸਤਾਵ, ਕੋਈ ਮੌਜੂਦਾ ਪ੍ਰਬੰਧ ਨਹੀਂ: ਰਾਜ ਜਾਂ ਜ਼ਿਲ੍ਹੇ ਦਾ ਵਿਭਾਗ ਸਬੂਤ ਦਾ ਲਾਇਸੰਸ ਲੈਂਦਾ ਹੈ ਅਤੇ ਹਰ ਘਟਨਾ ਉੱਤੇ ਫ਼ੀਸ ਦਿੰਦਾ ਹੈ। ਕਿਸਾਨ ਕੁਝ ਨਹੀਂ ਦਿੰਦੇ। ਬੀਮਾ ਕੰਪਨੀਆਂ ਬਾਅਦ ਵਿੱਚ ਪੀਐੱਮਐੱਫ਼ਬੀਵਾਈ ਵਾਲੇ ਰਾਹ ਉੱਤੇ ਜੁੜ ਸਕਦੀਆਂ ਹਨ। |  |
| `foot.note` | A simulation with synthetic data and a fictional district. Not affiliated with any insurer or government scheme. | ਨਕਲੀ ਡਾਟਾ ਅਤੇ ਕਾਲਪਨਿਕ ਜ਼ਿਲ੍ਹੇ ਵਾਲਾ ਸਿਮੂਲੇਸ਼ਨ। ਕਿਸੇ ਬੀਮਾ ਕੰਪਨੀ ਜਾਂ ਸਰਕਾਰੀ ਯੋਜਨਾ ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ। |  |
| `foot.team` | Team | ਟੀਮ |  |
| `foot.project` | Project | ਪ੍ਰੋਜੈਕਟ |  |
| `foot.track` | Track | ਟ੍ਰੈਕ |  |
| `foot.event` | Event | ਸਮਾਗਮ |  |
| `foot.code` | Source code on GitHub | GitHub ਉੱਤੇ ਸੋਰਸ ਕੋਡ |  |
| `tour.invite` | New here? Take the 2-minute judge tour. | ਪਹਿਲੀ ਵਾਰ? 2 ਮਿੰਟ ਦਾ ਜੱਜ ਟੂਰ ਲਓ। |  |
| `tour.start` | Start tour | ਟੂਰ ਸ਼ੁਰੂ ਕਰੋ |  |
| `tour.dismiss` | Dismiss | ਹਟਾਓ |  |
| `tour.step` | Judge tour · {n} / {total} | ਜੱਜ ਟੂਰ · {n} / {total} |  |
| `tour.skip` | Skip tour | ਟੂਰ ਛੱਡੋ |  |
| `tour.prev` | Previous step | ਪਿਛਲਾ ਕਦਮ |  |
| `tour.pause` | Pause | ਰੋਕੋ |  |
| `tour.resume` | Resume | ਜਾਰੀ ਰੱਖੋ |  |
| `tour.restart` | Restart | ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ |  |
| `tour.next` | Next | ਅੱਗੇ |  |
| `tour.finish` | Finish | ਸਮਾਪਤ |  |
| `tour.manual` | Auto-advance is off because your device asks for reduced motion. | ਤੁਹਾਡਾ ਡਿਵਾਈਸ ਘੱਟ ਹਿਲਜੁਲ (ਰਿਡਿਊਸਡ ਮੋਸ਼ਨ) ਚਾਹੁੰਦਾ ਹੈ, ਇਸ ਲਈ ਟੂਰ ਆਪਣੇ ਆਪ ਅੱਗੇ ਨਹੀਂ ਵਧੇਗਾ। |  |
| `tour.s1.t` | The clock starts at the storm | ਘੜੀ ਤੂਫ਼ਾਨ ਨਾਲ ਸ਼ੁਰੂ ਹੁੰਦੀ ਹੈ |  |
| `tour.s1.b` | After a flood, the assessment often happens once the evidence has faded. Saboot starts a clock at the event, counted from when the water arrives, not from when the farmer hears. Everything here is a simulation with synthetic data. | ਹੜ੍ਹ ਤੋਂ ਬਾਅਦ ਮੁਲਾਂਕਣ ਅਕਸਰ ਉਦੋਂ ਹੁੰਦਾ ਹੈ ਜਦੋਂ ਪ੍ਰਮਾਣ ਫਿੱਕੇ ਪੈ ਚੁੱਕੇ ਹੁੰਦੇ ਹਨ। ਸਬੂਤ ਘਟਨਾ ਦੇ ਸਮੇਂ ਤੋਂ ਘੜੀ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ, ਯਾਨੀ ਜਦੋਂ ਪਾਣੀ ਪਹੁੰਚਦਾ ਹੈ ਉਦੋਂ ਤੋਂ, ਨਾ ਕਿ ਜਦੋਂ ਕਿਸਾਨ ਨੂੰ ਪਤਾ ਲੱਗਦਾ ਹੈ। ਇੱਥੇ ਸਭ ਕੁਝ ਨਕਲੀ ਡਾਟੇ ਵਾਲਾ ਸਿਮੂਲੇਸ਼ਨ ਹੈ। |  |
| `tour.s1.b.pmfby` | For a flood, crop-insurance loss has to be reported within 72 hours, counted from when the water arrives, not from when the farmer hears. Saboot closes that gap. Everything here is a simulation with synthetic data. | ਹੜ੍ਹ ਵਿੱਚ ਫ਼ਸਲ ਬੀਮਾ ਨੁਕਸਾਨ ਦੀ ਸੂਚਨਾ 72 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਦੇਣੀ ਪੈਂਦੀ ਹੈ, ਜੋ ਪਾਣੀ ਆਉਣ ਦੇ ਸਮੇਂ ਤੋਂ ਗਿਣੇ ਜਾਂਦੇ ਹਨ, ਕਿਸਾਨ ਨੂੰ ਪਤਾ ਲੱਗਣ ਤੋਂ ਨਹੀਂ। ਸਬੂਤ ਇਹੀ ਫ਼ਾਸਲਾ ਮਿਟਾਉਂਦਾ ਹੈ। ਇੱਥੇ ਸਭ ਕੁਝ ਨਕਲੀ ਡਾਟਾ ਵਾਲਾ ਸਿਮੂਲੇਸ਼ਨ ਹੈ। |  |
| `tour.s2.t` | Detection: rules, not guesses | ਪਛਾਣ: ਅੰਦਾਜ਼ਾ ਨਹੀਂ, ਨਿਯਮ |  |
| `tour.s2.b` | Rain at the {gauge} gauge crosses the heavy-rain line, and on low-lying plots that starts the clock. A river gauge crossing its danger level does the same for riverside plots. Radar confirms later. Deterministic rules own the clock. | {gauge} ਮਾਪਕ ਉੱਤੇ ਮੀਂਹ ਭਾਰੀ-ਮੀਂਹ ਦੀ ਰੇਖਾ ਪਾਰ ਕਰਦਾ ਹੈ, ਅਤੇ ਨੀਵੇਂ ਖੇਤਾਂ ਉੱਤੇ ਇਸ ਨਾਲ ਘੜੀ ਸ਼ੁਰੂ ਹੁੰਦੀ ਹੈ। ਦਰਿਆ ਦਾ ਮਾਪਕ ਆਪਣੇ ਖ਼ਤਰੇ ਦੇ ਪੱਧਰ ਨੂੰ ਪਾਰ ਕਰੇ ਤਾਂ ਦਰਿਆ ਕੰਢੇ ਦੇ ਖੇਤਾਂ ਲਈ ਵੀ ਇਹੀ ਹੁੰਦਾ ਹੈ। ਰਡਾਰ ਬਾਅਦ ਵਿੱਚ ਪੁਸ਼ਟੀ ਕਰਦਾ ਹੈ। ਘੜੀ ਨਿਯਮ ਤੈਅ ਕਰਦੇ ਹਨ। |  |
| `tour.s3.t` | The alert: the clock was already running | ਚੇਤਾਵਨੀ: ਘੜੀ ਪਹਿਲਾਂ ਹੀ ਚੱਲ ਰਹੀ ਸੀ |  |
| `tour.s3.b` | {name} gets a voice call in {language}, {focus} after the event began, and is asked to capture soon. The median farmer in this replay is called {median} after the event; the slowest tenth wait {p90}, because only radar can see their plots. The advice is not a deadline. | {name} ਨੂੰ {language} ਵਿੱਚ ਫ਼ੋਨ ਆਉਂਦਾ ਹੈ, ਘਟਨਾ ਸ਼ੁਰੂ ਹੋਣ ਤੋਂ {focus} ਬਾਅਦ, ਅਤੇ ਜਲਦੀ ਫ਼ੋਟੋਆਂ ਲੈਣ ਲਈ ਕਿਹਾ ਜਾਂਦਾ ਹੈ। ਇਸ ਰੀਪਲੇ ਵਿੱਚ ਵਿਚਕਾਰਲੇ ਕਿਸਾਨ (ਮੱਧਮਾਨ) ਨੂੰ ਘਟਨਾ ਤੋਂ {median} ਬਾਅਦ ਫ਼ੋਨ ਆਉਂਦਾ ਹੈ; ਸਭ ਤੋਂ ਹੌਲੀ ਦਸਵੇਂ ਹਿੱਸੇ ਨੂੰ {p90} ਉਡੀਕ ਕਰਨੀ ਪੈਂਦੀ ਹੈ, ਕਿਉਂਕਿ ਉਨ੍ਹਾਂ ਦੇ ਖੇਤ ਸਿਰਫ਼ ਰਡਾਰ ਨੂੰ ਦਿਸਦੇ ਹਨ। ਇਹ ਸਲਾਹ ਹੈ, ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ। |  |
| `tour.s3.b.pmfby` | {name} gets a voice call in {language}, {focus} after the event began. The countdown already reads {left}, because Saboot counts from the event. The median farmer in this replay is called {median} after the event; the slowest tenth wait {p90}. | {name} ਨੂੰ {language} ਵਿੱਚ ਫ਼ੋਨ ਆਉਂਦਾ ਹੈ, ਘਟਨਾ ਸ਼ੁਰੂ ਹੋਣ ਤੋਂ {focus} ਬਾਅਦ। ਉਲਟੀ ਗਿਣਤੀ ਪਹਿਲਾਂ ਹੀ {left} ਦਿਖਾਉਂਦੀ ਹੈ, ਕਿਉਂਕਿ ਸਬੂਤ ਘਟਨਾ ਦੇ ਸਮੇਂ ਤੋਂ ਗਿਣਦਾ ਹੈ। ਇਸ ਰੀਪਲੇ ਵਿੱਚ ਵਿਚਕਾਰਲੇ ਕਿਸਾਨ (ਮੱਧਮਾਨ) ਨੂੰ ਘਟਨਾ ਤੋਂ {median} ਬਾਅਦ ਫ਼ੋਨ ਆਉਂਦਾ ਹੈ; ਸਭ ਤੋਂ ਹੌਲੀ ਦਸਵੇਂ ਹਿੱਸੇ ਨੂੰ {p90} ਉਡੀਕ ਕਰਨੀ ਪੈਂਦੀ ਹੈ। |  |
| `tour.s4.t` | Three guided photos, even offline | ਤਿੰਨ ਨਿਰਦੇਸ਼ਿਤ ਫ਼ੋਟੋਆਂ, ਆਫ਼ਲਾਈਨ ਵੀ |  |
| `tour.s4.b` | Whole field, close-up, landmark. Each photo gets time, place and a SHA-256 fingerprint on the phone. Switch the network to Weak or Offline: items wait, and the sync log shows phone time against server time. | ਪੂਰਾ ਖੇਤ, ਨੇੜਿਓਂ, ਪਛਾਣ ਚਿੰਨ੍ਹ। ਹਰ ਫ਼ੋਟੋ ਨੂੰ ਫ਼ੋਨ ਉੱਤੇ ਹੀ ਸਮਾਂ, ਥਾਂ ਅਤੇ SHA-256 ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਮਿਲਦਾ ਹੈ। ਨੈੱਟਵਰਕ ਨੂੰ ਕਮਜ਼ੋਰ ਜਾਂ ਆਫ਼ਲਾਈਨ ਕਰੋ: ਚੀਜ਼ਾਂ ਕਤਾਰ ਵਿੱਚ ਰੁਕਦੀਆਂ ਹਨ, ਅਤੇ ਸਿੰਕ ਰਿਕਾਰਡ ਫ਼ੋਨ ਦਾ ਸਮਾਂ ਅਤੇ ਸਰਵਰ ਦਾ ਸਮਾਂ ਵਿਖਾਉਂਦਾ ਹੈ। |  |
| `tour.s5.t` | Evidence that shows any edit | ਹਰ ਬਦਲਾਅ ਵਿਖਾਉਣ ਵਾਲਾ ਪ੍ਰਮਾਣ |  |
| `tour.s5.b` | Every action is chained to the one before. Change anything later, even a timestamp, and verification fails. The farmer shows the sealed evidence to the officer; Saboot never files and never decides. | ਹਰ ਕਾਰਵਾਈ ਆਪਣੀ ਪਿਛਲੀ ਕਾਰਵਾਈ ਨਾਲ ਜੁੜੀ ਹੈ। ਬਾਅਦ ਵਿੱਚ ਕੁਝ ਵੀ ਬਦਲੋ, ਸਮਾਂ ਵੀ, ਤਾਂ ਜਾਂਚ ਫ਼ੇਲ੍ਹ ਹੋ ਜਾਂਦੀ ਹੈ। ਕਿਸਾਨ ਸੀਲ ਕੀਤਾ ਹੋਇਆ ਪ੍ਰਮਾਣ ਅਧਿਕਾਰੀ ਨੂੰ ਵਿਖਾਉਂਦਾ ਹੈ; ਸਬੂਤ ਨਾ ਕੁਝ ਜਮ੍ਹਾ ਕਰਦਾ ਹੈ, ਨਾ ਫ਼ੈਸਲਾ ਕਰਦਾ ਹੈ। |  |
| `tour.s5.b.pmfby` | Every action is chained to the one before. Change anything later, even a timestamp, and verification fails. The farmer files through the official channel; Saboot never files and never decides. | ਹਰ ਕਾਰਵਾਈ ਪਿਛਲੀ ਨਾਲ ਜੁੜੀ ਹੁੰਦੀ ਹੈ। ਬਾਅਦ ਵਿੱਚ ਕੁਝ ਵੀ ਬਦਲੋ, ਸਮਾਂ ਵੀ, ਤਾਂ ਜਾਂਚ ਫ਼ੇਲ੍ਹ ਹੋ ਜਾਂਦੀ ਹੈ। ਕਿਸਾਨ ਸਰਕਾਰੀ ਰਾਹ ਰਾਹੀਂ ਦਾਅਵਾ ਦਰਜ ਕਰਦਾ ਹੈ; ਸਬੂਤ ਨਾ ਦਰਜ ਕਰਦਾ ਹੈ, ਨਾ ਫ਼ੈਸਲਾ ਕਰਦਾ ਹੈ। |  |
| `tour.s6.t` | Ranked evidence, not verdicts | ਤਰਤੀਬਵਾਰ ਪ੍ਰਮਾਣ, ਫ਼ੈਸਲੇ ਨਹੀਂ |  |
| `tour.s6.b` | Officers see a ranked worklist with evidence tiers and their uncertainty, a draft list for review and an audit ledger. The decision is made outside Saboot, by a person. | ਅਧਿਕਾਰੀ ਨੂੰ ਪ੍ਰਮਾਣ-ਪੱਧਰਾਂ ਅਤੇ ਉਨ੍ਹਾਂ ਦੀ ਅਨਿਸ਼ਚਿਤਤਾ ਸਮੇਤ ਕ੍ਰਮਵਾਰ ਕੰਮ-ਸੂਚੀ, ਸਮੀਖਿਆ ਲਈ ਖਰੜਾ ਸੂਚੀ ਅਤੇ ਆਡਿਟ ਲੇਜਰ ਦਿਖਦਾ ਹੈ। ਫ਼ੈਸਲਾ ਸਬੂਤ ਦੇ ਬਾਹਰ, ਕਿਸੇ ਵਿਅਕਤੀ ਵੱਲੋਂ ਹੁੰਦਾ ਹੈ। |  |
| `tour.s6.b.pmfby` | Insurers and district officers see evidence tiers with their uncertainty, an inspection queue and an audit ledger. The decision is made outside Saboot, by a person. | ਬੀਮਾ ਕੰਪਨੀ ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਅਫ਼ਸਰ ਅਨਿਸ਼ਚਿਤਤਾ ਸਮੇਤ ਪ੍ਰਮਾਣ-ਪੱਧਰ, ਜਾਂਚ ਕਤਾਰ ਅਤੇ ਆਡਿਟ ਲੇਜਰ ਵੇਖਦੇ ਹਨ। ਫ਼ੈਸਲਾ ਸਬੂਤ ਤੋਂ ਬਾਹਰ, ਇੱਕ ਵਿਅਕਤੀ ਕਰਦਾ ਹੈ। |  |
| `arch.server` | Server (simulated) | ਸਰਵਰ (ਸਿਮੂਲੇਟਡ) |  |
| `arch.phone` | This phone (real, in your browser) | ਇਹ ਫ਼ੋਨ (ਅਸਲੀ, ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ) |  |
| `arch.out` | People who use the evidence | ਪ੍ਰਮਾਣ ਵਰਤਣ ਵਾਲੇ ਲੋਕ |  |
| `arch.src` | Sources | ਸਰੋਤ |  |
| `arch.src.s` | Rain and river gauges, radar, terrain, registered plots | ਮੀਂਹ ਅਤੇ ਦਰਿਆ ਦੇ ਮਾਪਕ, ਰਡਾਰ, ਜ਼ਮੀਨ, ਰਜਿਸਟਰਡ ਖੇਤ |  |
| `arch.det` | Event detector | ਘਟਨਾ ਪਛਾਣ |  |
| `arch.det.s` | Deterministic rules A, B and C | ਤੈਅ ਨਿਯਮ A, B ਅਤੇ C |  |
| `arch.pl` | Plausibility score | ਭਰੋਸਯੋਗਤਾ ਸਕੋਰ |  |
| `arch.pl.s` | Factors × weights, with uncertainty | ਕਾਰਕ × ਭਾਰ, ਅਨਿਸ਼ਚਿਤਤਾ ਸਮੇਤ |  |
| `arch.clk` | Evidence clock | ਪ੍ਰਮਾਣ ਦੀ ਘੜੀ |  |
| `arch.clk.pmfby` | 72‑hour clock | 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ |  |
| `arch.clk.s` | Starts at the event time | ਘਟਨਾ ਦੇ ਸਮੇਂ ਤੋਂ ਸ਼ੁਰੂ |  |
| `arch.al` | Farmer alert | ਕਿਸਾਨ ਨੂੰ ਚੇਤਾਵਨੀ |  |
| `arch.al.s` | Voice message in their language · no AI in this prototype | ਉਸ ਦੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਵਾਜ਼ ਸੁਨੇਹਾ · ਇਸ ਪ੍ਰੋਟੋਟਾਈਪ ਵਿੱਚ ਕੋਈ AI ਨਹੀਂ |  |
| `arch.cap` | Guided capture | ਨਿਰਦੇਸ਼ਿਤ ਫ਼ੋਟੋਆਂ |  |
| `arch.cap.s` | Time- and place-stamped, works offline · a photo check is planned, not built | ਸਮੇਂ ਅਤੇ ਥਾਂ ਦੀ ਮੋਹਰ, ਆਫ਼ਲਾਈਨ ਵੀ · ਫ਼ੋਟੋ ਦੀ ਜਾਂਚ ਯੋਜਨਾ ਵਿੱਚ ਹੈ, ਬਣੀ ਨਹੀਂ |  |
| `arch.pk` | Evidence packet | ਪ੍ਰਮਾਣ ਪੈਕੇਟ |  |
| `arch.pk.s` | SHA-256 hash chain, sealed on the phone | SHA-256 ਹੈਸ਼ ਚੇਨ, ਫ਼ੋਨ ਉੱਤੇ ਸੀਲ |  |
| `arch.ins` | Officer console | ਅਧਿਕਾਰੀ ਕੰਸੋਲ |  |
| `arch.ins.pmfby` | Insurer console | ਬੀਮਾ ਕੰਸੋਲ |  |
| `arch.ins.s` | Ranked evidence tiers | ਤਰਤੀਬਵਾਰ ਪ੍ਰਮਾਣ-ਪੱਧਰ |  |
| `arch.tri` | Assessment worklist | ਮੁਲਾਂਕਣ ਕੰਮ-ਸੂਚੀ |  |
| `arch.tri.pmfby` | District triage | ਜ਼ਿਲ੍ਹਾ ਤਰਜੀਹ |  |
| `arch.tri.s` | Ranked, with the reasons | ਕਾਰਨਾਂ ਸਮੇਤ ਤਰਤੀਬ ਵਿੱਚ |  |
| `arch.tri.s.pmfby` | Inspection queue | ਜਾਂਚ ਕਤਾਰ |  |
| `arch.fil` | Evidence handoff | ਪ੍ਰਮਾਣ ਸੌਂਪਣਾ |  |
| `arch.fil.pmfby` | Filing handoff | ਦਾਅਵਾ ਦਰਜ ਕਰਾਉਣ ਵਿੱਚ ਮਦਦ |  |
| `arch.fil.s` | The farmer shows sealed evidence to the officer | ਕਿਸਾਨ ਸੀਲ ਕੀਤਾ ਪ੍ਰਮਾਣ ਅਧਿਕਾਰੀ ਨੂੰ ਵਿਖਾਉਂਦਾ ਹੈ |  |
| `arch.fil.s.pmfby` | The farmer files through the official channel | ਕਿਸਾਨ ਸਰਕਾਰੀ ਰਾਹ ਰਾਹੀਂ ਦਰਜ ਕਰਦਾ ਹੈ |  |
| `arch.aud` | Audit ledger | ਆਡਿਟ ਲੇਜਰ |  |
| `arch.aud.s` | Append-only, verifiable | ਸਿਰਫ਼ ਜੁੜਨ ਵਾਲਾ, ਜਾਂਚਣਯੋਗ |  |
| `arch.caption` | Sources feed the event detector, the plausibility score and the evidence clock on the server. The clock triggers the farmer alert, guided capture and the sealed evidence packet on the phone. The packet feeds the officer console, the assessment worklist, the evidence handoff and the audit ledger. Saboot decides nothing in this chain. | ਸਰੋਤ ਸਰਵਰ ਉੱਤੇ ਘਟਨਾ ਪਛਾਣ, ਭਰੋਸਯੋਗਤਾ ਸਕੋਰ ਅਤੇ ਪ੍ਰਮਾਣ ਦੀ ਘੜੀ ਨੂੰ ਡਾਟਾ ਦਿੰਦੇ ਹਨ। ਘੜੀ ਫ਼ੋਨ ਉੱਤੇ ਕਿਸਾਨ ਦੀ ਚੇਤਾਵਨੀ, ਨਿਰਦੇਸ਼ਿਤ ਫ਼ੋਟੋਆਂ ਅਤੇ ਸੀਲ ਕੀਤੇ ਪ੍ਰਮਾਣ ਪੈਕੇਟ ਨੂੰ ਸ਼ੁਰੂ ਕਰਦੀ ਹੈ। ਪੈਕੇਟ ਅਧਿਕਾਰੀ ਕੰਸੋਲ, ਮੁਲਾਂਕਣ ਕੰਮ-ਸੂਚੀ, ਪ੍ਰਮਾਣ ਸੌਂਪਣ ਅਤੇ ਆਡਿਟ ਲੇਜਰ ਨੂੰ ਡਾਟਾ ਦਿੰਦਾ ਹੈ। ਇਸ ਲੜੀ ਵਿੱਚ ਸਬੂਤ ਕੁਝ ਵੀ ਤੈਅ ਨਹੀਂ ਕਰਦਾ। |  |
| `arch.caption.pmfby` | Sources feed the event detector, the plausibility score and the 72‑hour clock on the server. The clock triggers the farmer alert, guided capture and the sealed evidence packet on the phone. The packet feeds the insurer console, district triage, the filing handoff and the audit ledger. Nobody in this chain is Saboot deciding a claim. | ਸਰੋਤ ਸਰਵਰ ਉੱਤੇ ਘਟਨਾ ਪਛਾਣ, ਭਰੋਸਯੋਗਤਾ ਸਕੋਰ ਅਤੇ 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ ਨੂੰ ਡਾਟਾ ਦਿੰਦੇ ਹਨ। ਘੜੀ ਫ਼ੋਨ ਉੱਤੇ ਕਿਸਾਨ ਦੀ ਚੇਤਾਵਨੀ, ਨਿਰਦੇਸ਼ਿਤ ਫ਼ੋਟੋਆਂ ਅਤੇ ਸੀਲ ਕੀਤੇ ਪ੍ਰਮਾਣ ਪੈਕੇਟ ਨੂੰ ਸ਼ੁਰੂ ਕਰਦੀ ਹੈ। ਪੈਕੇਟ ਬੀਮਾ ਕੰਸੋਲ, ਜ਼ਿਲ੍ਹਾ ਤਰਜੀਹ, ਦਾਅਵਾ ਦਰਜ ਕਰਾਉਣ ਅਤੇ ਆਡਿਟ ਲੇਜਰ ਤੱਕ ਜਾਂਦਾ ਹੈ। ਇਸ ਸਾਰੀ ਕੜੀ ਵਿੱਚ ਸਬੂਤ ਕਿਤੇ ਵੀ ਦਾਅਵੇ ਦਾ ਫ਼ੈਸਲਾ ਨਹੀਂ ਕਰਦਾ। |  |
| `wf.h` | Five steps | ਪੰਜ ਕਦਮ |  |
| `wf.1.t` | Detect | ਪਛਾਣ |  |
| `wf.1.b` | Rules watch rain, river, terrain and radar over every registered plot and flag a likely flood. | ਨਿਯਮ ਹਰ ਰਜਿਸਟਰਡ ਖੇਤ ਉੱਤੇ ਮੀਂਹ, ਦਰਿਆ, ਜ਼ਮੀਨ ਅਤੇ ਰਡਾਰ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖਦੇ ਹਨ ਅਤੇ ਸੰਭਾਵੀ ਹੜ੍ਹ ਨੂੰ ਨਿਸ਼ਾਨਬੱਧ ਕਰਦੇ ਹਨ। |  |
| `wf.2.t` | Alert | ਚੇਤਾਵਨੀ |  |
| `wf.2.b` | The evidence clock starts at the event, not when the farmer finds out. A voice call in their language asks for photos soon. | ਪ੍ਰਮਾਣ ਦੀ ਘੜੀ ਘਟਨਾ ਦੇ ਸਮੇਂ ਸ਼ੁਰੂ ਹੁੰਦੀ ਹੈ, ਕਿਸਾਨ ਨੂੰ ਪਤਾ ਲੱਗਣ ਵੇਲੇ ਨਹੀਂ। ਉਸ ਦੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਵਾਜ਼ ਕਾਲ ਜਲਦੀ ਫ਼ੋਟੋਆਂ ਮੰਗਦੀ ਹੈ। |  |
| `wf.2.b.pmfby` | The 72‑hour clock starts at the event, not when the farmer finds out. A voice call in their language says so. | 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ ਘਟਨਾ ਦੇ ਸਮੇਂ ਸ਼ੁਰੂ ਹੁੰਦੀ ਹੈ, ਕਿਸਾਨ ਨੂੰ ਪਤਾ ਲੱਗਣ ਵੇਲੇ ਨਹੀਂ। ਉਸ ਦੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਵਾਜ਼ ਕਾਲ ਇਹੀ ਦੱਸਦੀ ਹੈ। |  |
| `wf.3.t` | Capture | ਫ਼ੋਟੋਆਂ |  |
| `wf.3.b` | Three guided photos (whole field, close-up, landmark), stamped with time and place. Works with no signal. | ਤਿੰਨ ਨਿਰਦੇਸ਼ਿਤ ਫ਼ੋਟੋਆਂ (ਪੂਰਾ ਖੇਤ, ਨੇੜਿਓਂ, ਪਛਾਣ ਚਿੰਨ੍ਹ), ਸਮੇਂ ਅਤੇ ਥਾਂ ਦੀ ਮੋਹਰ ਨਾਲ। ਬਿਨਾਂ ਸਿਗਨਲ ਵੀ ਕੰਮ ਕਰਦਾ ਹੈ। |  |
| `wf.4.t` | Package | ਪੈਕੇਟ |  |
| `wf.4.b` | Every photo and action is fingerprinted with SHA-256 and chained, so any later edit shows. | ਹਰ ਫ਼ੋਟੋ ਅਤੇ ਹਰ ਕਾਰਵਾਈ ਦਾ SHA-256 ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਬਣਦਾ ਹੈ ਅਤੇ ਕੜੀ ਵਿੱਚ ਜੁੜਦਾ ਹੈ, ਇਸ ਲਈ ਬਾਅਦ ਦਾ ਕੋਈ ਵੀ ਬਦਲਾਅ ਦਿਸ ਪੈਂਦਾ ਹੈ। |  |
| `wf.5.t` | Hand off and track | ਸੌਂਪਣਾ ਅਤੇ ਨਜ਼ਰ ਰੱਖਣਾ |  |
| `wf.5.b` | The farmer shows the sealed evidence to the officer. Saboot keeps the audit trail and tracks the officer’s acknowledgement; the officer decides, outside Saboot. | ਕਿਸਾਨ ਸੀਲ ਕੀਤਾ ਹੋਇਆ ਪ੍ਰਮਾਣ ਅਧਿਕਾਰੀ ਨੂੰ ਵਿਖਾਉਂਦਾ ਹੈ। ਸਬੂਤ ਆਡਿਟ ਰਿਕਾਰਡ ਰੱਖਦਾ ਹੈ ਅਤੇ ਅਧਿਕਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ; ਫ਼ੈਸਲਾ ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ, ਸਬੂਤ ਦੇ ਬਾਹਰ। |  |
| `wf.5.b.pmfby` | Details are ready for the official channel (in India, for example, the Crop Insurance App or the 14447 helpline). Saboot tracks the acknowledgement and escalates if it slips. | ਜਾਣਕਾਰੀ ਸਰਕਾਰੀ ਰਾਹ ਲਈ ਤਿਆਰ ਰਹਿੰਦੀ ਹੈ (ਭਾਰਤ ਵਿੱਚ, ਮਿਸਾਲ ਵਜੋਂ, ਫ਼ਸਲ ਬੀਮਾ ਐਪ ਜਾਂ 14447 ਹੈਲਪਲਾਈਨ)। ਸਬੂਤ ਪੁਸ਼ਟੀ ਉੱਤੇ ਨਜ਼ਰ ਰੱਖਦਾ ਹੈ ਅਤੇ ਦੇਰ ਹੋਣ ਉੱਤੇ ਸ਼ਿਕਾਇਤ ਅੱਗੇ ਵਧਾਉਂਦਾ ਹੈ। |  |
| `rs.h` | What is real and what is simulated | ਕੀ ਅਸਲੀ ਹੈ ਅਤੇ ਕੀ ਸਿਮੂਲੇਟਡ |  |
| `rs.c` | Part | ਹਿੱਸਾ |  |
| `rs.demo` | In this demo | ਇਸ ਡੈਮੋ ਵਿੱਚ |  |
| `rs.status` | Status | ਸਥਿਤੀ |  |
| `rs.prod` | In production | ਅਸਲੀ ਉਤਪਾਦ ਵਿੱਚ |  |
| `rs.real` | Real | ਅਸਲੀ |  |
| `rs.sim` | Simulated | ਸਿਮੂਲੇਟਡ |  |
| `rs.mixed` | Partly real | ਅੰਸ਼ਕ ਤੌਰ ਉੱਤੇ ਅਸਲੀ |  |
| `rs.none` | Not yet | ਅਜੇ ਨਹੀਂ |  |
| `rs.1.c` | Rainfall | ਮੀਂਹ |  |
| `rs.1.d` | Synthetic hourly series for {n} gauges (seeded) | {n} ਮਾਪਕਾਂ ਦੀ ਨਕਲੀ ਘੰਟੇਵਾਰ ਲੜੀ |  |
| `rs.1.p` | Weather agency and state automatic weather stations | ਮੌਸਮ ਏਜੰਸੀ ਅਤੇ ਰਾਜ ਦੇ ਸਵੈਚਾਲਿਤ ਮੌਸਮ ਕੇਂਦਰ |  |
| `rs.2.c` | Flood mapping | ਹੜ੍ਹ ਦਾ ਨਕਸ਼ਾ |  |
| `rs.2.d` | Synthetic radar flood maps, a pass every {n} hours in the demo or every {slow} hours in the slower option (simulated cadence) | ਨਕਲੀ ਰਡਾਰ ਹੜ੍ਹ-ਨਕਸ਼ੇ, ਡੈਮੋ ਵਿੱਚ ਹਰ {n} ਘੰਟੇ ਅਤੇ ਹੌਲੀ ਵਿਕਲਪ ਵਿੱਚ ਹਰ {slow} ਘੰਟੇ ਵਿੱਚ ਇੱਕ ਵਾਰ (ਸਿਮੂਲੇਟਡ ਵਕਫ਼ਾ) |  |
| `rs.2.p` | Satellite radar flood mapping, which revisits a field only every few days | ਸੈਟੇਲਾਈਟ ਰਡਾਰ ਹੜ੍ਹ ਮੈਪਿੰਗ, ਜੋ ਕਿਸੇ ਖੇਤ ਉੱਤੋਂ ਕੁਝ ਦਿਨਾਂ ਵਿੱਚ ਇੱਕ ਵਾਰ ਲੰਘਦੀ ਹੈ |  |
| `rs.3.c` | Terrain | ਜ਼ਮੀਨ |  |
| `rs.3.d` | Synthetic elevation grid | ਨਕਲੀ ਉਚਾਈ ਗਰਿੱਡ |  |
| `rs.3.p` | Digital elevation model | ਡਿਜੀਟਲ ਉਚਾਈ ਮਾਡਲ |  |
| `rs.4.c` | Plots and farmers | ਖੇਤ ਅਤੇ ਕਿਸਾਨ |  |
| `rs.4.d` | {n} synthetic plots, generated names, fictional district | {n} ਨਕਲੀ ਖੇਤ, ਬਣਾਏ ਨਾਂ, ਕਾਲਪਨਿਕ ਜ਼ਿਲ੍ਹਾ |  |
| `rs.4.p` | Insurance enrolment and land records, with consent | ਬੀਮਾ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਤੇ ਜ਼ਮੀਨੀ ਰਿਕਾਰਡ, ਸਹਿਮਤੀ ਨਾਲ |  |
| `rs.5.c` | Event rules and the evidence clock | ਘਟਨਾ ਨਿਯਮ ਅਤੇ ਪ੍ਰਮਾਣ ਦੀ ਘੜੀ |  |
| `rs.5.c.pmfby` | Event rules and the 72‑hour clock | ਘਟਨਾ ਨਿਯਮ ਅਤੇ 72 ਘੰਟਿਆਂ ਦੀ ਘੜੀ |  |
| `rs.5.d` | Real code running in your browser | ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਚੱਲਦਾ ਅਸਲੀ ਕੋਡ |  |
| `rs.5.p` | The same deterministic rules, on a server | ਉਹੀ ਤੈਅ ਨਿਯਮ, ਸਰਵਰ ਉੱਤੇ |  |
| `rs.6.c` | Voice alert | ਆਵਾਜ਼ ਚੇਤਾਵਨੀ |  |
| `rs.6.d` | Real audio or speech synthesis in the browser; no call is placed | ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਅਸਲੀ ਆਡੀਓ ਜਾਂ ਬੋਲਣ ਵਾਲੀ ਆਵਾਜ਼; ਕੋਈ ਕਾਲ ਨਹੀਂ ਹੁੰਦੀ |  |
| `rs.6.p` | Telephone voice-call provider | ਟੈਲੀਫ਼ੋਨ ਵੌਇਸ-ਕਾਲ ਸੇਵਾ |  |
| `rs.7.c` | Camera and location | ਕੈਮਰਾ ਅਤੇ ਲੋਕੇਸ਼ਨ |  |
| `rs.7.d` | Real phone camera and GPS, with a simulated fallback if you say no | ਫ਼ੋਨ ਦਾ ਅਸਲੀ ਕੈਮਰਾ ਅਤੇ GPS; ਨਾਂਹ ਕਰਨ ਉੱਤੇ ਸਿਮੂਲੇਟਡ ਬਦਲ |  |
| `rs.7.p` | The same | ਉਹੀ |  |
| `rs.8.c` | SHA-256 hash chain | SHA-256 ਹੈਸ਼ ਚੇਨ |  |
| `rs.8.d` | Real WebCrypto hashing and verification | ਅਸਲੀ WebCrypto ਹੈਸ਼ਿੰਗ ਅਤੇ ਜਾਂਚ |  |
| `rs.8.p` | The same, plus server-side anchoring | ਉਹੀ, ਨਾਲ ਸਰਵਰ ਉੱਤੇ ਪੁਸ਼ਟੀ |  |
| `rs.9.c` | Offline queue and sync | ਆਫ਼ਲਾਈਨ ਕਤਾਰ ਅਤੇ ਸਿੰਕ |  |
| `rs.9.d` | Real IndexedDB queue and service worker; the server is simulated | ਅਸਲੀ IndexedDB ਕਤਾਰ ਅਤੇ ਸਰਵਿਸ ਵਰਕਰ; ਸਰਵਰ ਸਿਮੂਲੇਟਡ ਹੈ |  |
| `rs.9.p` | A real sync service | ਅਸਲੀ ਸਿੰਕ ਸੇਵਾ |  |
| `rs.10.c` | Evidence handoff | ਪ੍ਰਮਾਣ ਸੌਂਪਣਾ |  |
| `rs.10.c.pmfby` | Filing | ਦਾਅਵਾ ਦਰਜ ਕਰਨਾ |  |
| `rs.10.d` | Guidance and receipt-number capture only; nothing is submitted | ਸਿਰਫ਼ ਅਗਵਾਈ ਅਤੇ ਰਸੀਦ ਨੰਬਰ ਦਰਜ ਕਰਨਾ; ਕੁਝ ਵੀ ਜਮ੍ਹਾਂ ਨਹੀਂ ਹੁੰਦਾ |  |
| `rs.10.d.pmfby` | Guidance and reference-number capture only; nothing is submitted | ਸਿਰਫ਼ ਅਗਵਾਈ ਅਤੇ ਹਵਾਲਾ ਨੰਬਰ ਦਰਜ ਕਰਨਾ; ਕੁਝ ਵੀ ਜਮ੍ਹਾਂ ਨਹੀਂ ਹੁੰਦਾ |  |
| `rs.10.p` | The farmer shows the evidence to the officer | ਕਿਸਾਨ ਪ੍ਰਮਾਣ ਅਧਿਕਾਰੀ ਨੂੰ ਵਿਖਾਉਂਦਾ ਹੈ |  |
| `rs.10.p.pmfby` | The farmer files through the official channel | ਕਿਸਾਨ ਸਰਕਾਰੀ ਰਾਹ ਰਾਹੀਂ ਦਰਜ ਕਰਦਾ ਹੈ |  |
| `rs.11.c` | Officer acknowledgement and escalation | ਅਧਿਕਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਅਤੇ ਸ਼ਿਕਾਇਤ |  |
| `rs.11.c.pmfby` | Insurer acknowledgement and escalation | ਬੀਮਾ ਪੁਸ਼ਟੀ ਅਤੇ ਸ਼ਿਕਾਇਤ |  |
| `rs.11.d` | Scripted timings | ਪਹਿਲਾਂ ਤੋਂ ਤੈਅ ਸਮਾਂ |  |
| `rs.11.p` | Department and district systems | ਵਿਭਾਗ ਅਤੇ ਜ਼ਿਲ੍ਹੇ ਦੇ ਸਿਸਟਮ |  |
| `rs.11.p.pmfby` | Insurer and district systems | ਬੀਮਾ ਕੰਪਨੀ ਅਤੇ ਜ਼ਿਲ੍ਹੇ ਦੇ ਸਿਸਟਮ |  |
| `rs.12.c` | Evidence tiers and priority | ਪ੍ਰਮਾਣ-ਪੱਧਰ ਅਤੇ ਤਰਜੀਹ |  |
| `rs.12.d` | A real formula on synthetic inputs | ਨਕਲੀ ਡਾਟਾ ਉੱਤੇ ਅਸਲੀ ਫ਼ਾਰਮੂਲਾ |  |
| `rs.12.p` | Weights calibrated on past claims | ਪੁਰਾਣੇ ਦਾਅਵਿਆਂ ਉੱਤੇ ਤੈਅ ਕੀਤੇ ਭਾਰ |  |
| `rs.13.c` | Impact numbers | ਅਸਰ ਦੇ ਅੰਕੜੇ |  |
| `rs.13.d` | Computed from the synthetic replay | ਨਕਲੀ ਰੀਪਲੇ ਤੋਂ ਗਿਣਤੀ |  |
| `rs.13.p` | Field pilots | ਖੇਤ ਵਿੱਚ ਪਾਇਲਟ |  |
| `rs.14.c` | River gauges | ਦਰਿਆ ਦੇ ਮਾਪਕ |  |
| `rs.14.d` | Synthetic hourly river-stage series for {n} gauges, made from the same simulated flood | {n} ਮਾਪਕਾਂ ਦੀ ਨਕਲੀ ਘੰਟੇਵਾਰ ਦਰਿਆ-ਪੱਧਰ ਲੜੀ, ਉਸੇ ਸਿਮੂਲੇਟ ਕੀਤੇ ਹੜ੍ਹ ਤੋਂ ਬਣੀ |  |
| `rs.14.p` | State water resources department and national flood-forecasting gauges | ਰਾਜ ਦਾ ਜਲ ਸਰੋਤ ਵਿਭਾਗ ਅਤੇ ਰਾਸ਼ਟਰੀ ਹੜ੍ਹ-ਪੂਰਵ-ਅਨੁਮਾਨ ਮਾਪਕ |  |
| `rs.15.c` | Real-data validation | ਅਸਲੀ ਡਾਟੇ ਉੱਤੇ ਪਰਖ |  |
| `rs.15.d` | Not run yet. The precision and recall shown are a simulated consistency check | ਅਜੇ ਨਹੀਂ ਕੀਤੀ ਗਈ। ਵਿਖਾਈ ਗਈ ਪ੍ਰਿਸੀਜ਼ਨ ਅਤੇ ਰਿਕਾਲ ਇੱਕ ਸਿਮੂਲੇਟ ਕੀਤੀ ਸੰਗਤੀ-ਜਾਂਚ ਹਨ |  |
| `rs.15.p` | Replays of past floods against villages that an official process later confirmed as affected | ਬੀਤੇ ਹੜ੍ਹਾਂ ਨੂੰ ਉਨ੍ਹਾਂ ਪਿੰਡਾਂ ਦੇ ਵਿਰੁੱਧ ਦੁਹਰਾਉਣਾ ਜਿਨ੍ਹਾਂ ਨੂੰ ਕਿਸੇ ਅਧਿਕਾਰਤ ਪ੍ਰਕਿਰਿਆ ਨੇ ਬਾਅਦ ਵਿੱਚ ਪ੍ਰਭਾਵਿਤ ਮੰਨਿਆ |  |
| `how.eyebrow` | How it works | ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ |  |
| `how.h` | Evidence, not decisions. | ਪ੍ਰਮਾਣ, ਫ਼ੈਸਲੇ ਨਹੀਂ। |  |
| `how.lead` | The intelligence layer runs on a server (simulated here). The farmer’s side runs on the phone and keeps working with a weak signal or none at all. | ਸਮਝਦਾਰੀ ਵਾਲਾ ਹਿੱਸਾ ਸਰਵਰ ਉੱਤੇ ਚੱਲਦਾ ਹੈ (ਇੱਥੇ ਸਿਮੂਲੇਟਡ)। ਕਿਸਾਨ ਵਾਲਾ ਹਿੱਸਾ ਫ਼ੋਨ ਉੱਤੇ ਚੱਲਦਾ ਹੈ ਅਤੇ ਕਮਜ਼ੋਰ ਜਾਂ ਬਿਨਾਂ ਸਿਗਨਲ ਦੇ ਵੀ ਕੰਮ ਕਰਦਾ ਰਹਿੰਦਾ ਹੈ। |  |
| `how.local` | Everything in this demo runs on your own phone or laptop. Photos and your real location never leave the device unless you choose to share them. | ਇਸ ਡੈਮੋ ਵਿੱਚ ਸਭ ਕੁਝ ਤੁਹਾਡੇ ਆਪਣੇ ਫ਼ੋਨ ਜਾਂ ਲੈਪਟਾਪ ਉੱਤੇ ਚੱਲਦਾ ਹੈ। ਫ਼ੋਟੋਆਂ ਅਤੇ ਤੁਹਾਡੀ ਅਸਲੀ ਲੋਕੇਸ਼ਨ ਉਦੋਂ ਤੱਕ ਡਿਵਾਈਸ ਤੋਂ ਬਾਹਰ ਨਹੀਂ ਜਾਂਦੀ ਜਦੋਂ ਤੱਕ ਤੁਸੀਂ ਆਪ ਸਾਂਝਾ ਨਾ ਕਰੋ। |  |
| `how.model` | The replay uses a fictional district and an invented monsoon flood. No real place, person or record appears. | ਰੀਪਲੇ ਵਿੱਚ ਇੱਕ ਕਾਲਪਨਿਕ ਜ਼ਿਲ੍ਹਾ ਅਤੇ ਘੜਿਆ ਗਿਆ ਮਾਨਸੂਨੀ ਹੜ੍ਹ ਹੈ। ਕੋਈ ਅਸਲੀ ਥਾਂ, ਵਿਅਕਤੀ ਜਾਂ ਰਿਕਾਰਡ ਇਸ ਵਿੱਚ ਨਹੀਂ ਹੈ। |  |
| `how.model.pmfby` | The replay uses a fictional district in {state}, a state that runs the scheme, and an invented monsoon flood. No real place, person or record appears. | ਰੀਪਲੇ ਵਿੱਚ {state} ਦਾ ਇੱਕ ਕਾਲਪਨਿਕ ਜ਼ਿਲ੍ਹਾ ਹੈ, ਉਸ ਰਾਜ ਦਾ ਜਿੱਥੇ ਇਹ ਯੋਜਨਾ ਚੱਲਦੀ ਹੈ, ਅਤੇ ਘੜਿਆ ਗਿਆ ਮਾਨਸੂਨੀ ਹੜ੍ਹ। ਕੋਈ ਅਸਲੀ ਥਾਂ, ਵਿਅਕਤੀ ਜਾਂ ਰਿਕਾਰਡ ਇਸ ਵਿੱਚ ਨਹੀਂ ਹੈ। |  |
| `days` | ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] | ['ਐਤ', 'ਸੋਮ', 'ਮੰਗਲ', 'ਬੁੱਧ', 'ਵੀਰ', 'ਸ਼ੁੱਕਰ', 'ਸ਼ਨੀ'] |  |
| `months` | ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] | ['ਜਨ', 'ਫ਼ਰ', 'ਮਾਰਚ', 'ਅਪ੍ਰੈ', 'ਮਈ', 'ਜੂਨ', 'ਜੁਲਾ', 'ਅਗ', 'ਸਤੰ', 'ਅਕਤੂ', 'ਨਵੰ', 'ਦਸੰ'] |  |
| `u.d` | d | ਦਿ |  |
| `u.h` | h | ਘੰ |  |
| `u.m` | m | ਮਿ |  |
| `u.day` | day | ਦਿਨ |  |
| `u.days` | days | ਦਿਨ |  |
| `u.min` | min | ਮਿੰਟ |  |
| `skip.main` | Skip to content | ਮੁੱਖ ਸਮੱਗਰੀ ਉੱਤੇ ਜਾਓ |  |
| `ann.label` | Simulation notice | ਸਿਮੂਲੇਸ਼ਨ ਸੂਚਨਾ |  |
| `ann.text` | SIMULATION: synthetic data, fictional district | ਸਿਮੂਲੇਸ਼ਨ: ਨਕਲੀ ਡਾਟਾ, ਕਾਲਪਨਿਕ ਜ਼ਿਲ੍ਹਾ |  |
| `ann.skip` | Skip to demo | ਡੈਮੋ ਉੱਤੇ ਜਾਓ |  |
| `brand.home` | back to top | ਉੱਪਰ ਜਾਓ |  |
| `lang.name.en` | English | ਅੰਗਰੇਜ਼ੀ |  |
| `lang.name.hi` | Hindi | ਹਿੰਦੀ |  |
| `lang.name.pa` | Punjabi | ਪੰਜਾਬੀ |  |
| `rail.group` | Which process Saboot supports | ਸਬੂਤ ਕਿਸ ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ |  |
| `rail.label` | Process | ਪ੍ਰਕਿਰਿਆ |  |
| `rail.relief` | Relief assessment | ਰਾਹਤ ਮੁਲਾਂਕਣ |  |
| `rail.pmfby` | PMFBY intimation | ਪੀਐੱਮਐੱਫ਼ਬੀਵਾਈ ਸੂਚਨਾ |  |
| `rail.d.relief` | A state or district assessment of flood losses. The officer ranks and verifies; the farmer supplies sealed evidence. The capture-soon advice is not a deadline. No state is named. | ਹੜ੍ਹ ਦੇ ਨੁਕਸਾਨ ਦਾ ਰਾਜ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਪੱਧਰ ਦਾ ਮੁਲਾਂਕਣ। ਅਧਿਕਾਰੀ ਕ੍ਰਮ ਤੈਅ ਕਰਦਾ ਅਤੇ ਜਾਂਚਦਾ ਹੈ; ਕਿਸਾਨ ਸੀਲ ਕੀਤਾ ਹੋਇਆ ਪ੍ਰਮਾਣ ਦਿੰਦਾ ਹੈ। ਜਲਦੀ ਫ਼ੋਟੋ ਲੈਣ ਦੀ ਸਲਾਹ ਕੋਈ ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ ਹੈ। ਕਿਸੇ ਰਾਜ ਦਾ ਨਾਮ ਨਹੀਂ ਲਿਆ ਗਿਆ। |  |
| `rail.d.pmfby` | The 72‑hour intimation of a localized calamity, for a state that runs PMFBY. A fictional district in {state}. | ਸਥਾਨਕ ਆਫ਼ਤ ਦੀ 72 ਘੰਟਿਆਂ ਦੀ ਸੂਚਨਾ, ਉਸ ਰਾਜ ਲਈ ਜਿੱਥੇ ਪੀਐੱਮਐੱਫ਼ਬੀਵਾਈ ਚੱਲਦੀ ਹੈ। {state} ਦਾ ਇੱਕ ਕਾਲਪਨਿਕ ਜ਼ਿਲ੍ਹਾ। |  |
| `cad.label` | Radar passes | ਰਡਾਰ ਪਾਸ |  |
| `cad.demo` | Every {n} h (demo) | ਹਰ {n} ਘੰਟੇ (ਡੈਮੋ) |  |
| `cad.slow` | Every {n} h (slower) | ਹਰ {n} ਘੰਟੇ (ਹੌਲੀ) |  |
| `cad.d` | Both cadences are simulated. The slower one shows what a late radar pass does. | ਦੋਵੇਂ ਚੱਕਰ ਸਿਮੂਲੇਟ ਕੀਤੇ ਹਨ। ਹੌਲੀ ਚੱਕਰ ਦਿਖਾਉਂਦਾ ਹੈ ਕਿ ਦੇਰ ਨਾਲ ਆਉਣ ਵਾਲਾ ਰਡਾਰ ਪਾਸ ਕੀ ਕਰਦਾ ਹੈ। |  |
| `lang.fail` | Could not load {lang}. Check your connection and try again. | {lang} ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀ। ਆਪਣਾ ਕਨੈਕਸ਼ਨ ਵੇਖੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ। |  |
| `app.offlineReady` | Ready to work offline. | ਆਫ਼ਲਾਈਨ ਚੱਲਣ ਲਈ ਤਿਆਰ। |  |
| `lazy.failed` | This part of the page did not load. Check the connection, then reload the page. | ਪੰਨੇ ਦਾ ਇਹ ਹਿੱਸਾ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ, ਫਿਰ ਪੰਨਾ ਦੁਬਾਰਾ ਲੋਡ ਕਰੋ। |  |
| `lazy.reload` | Reload the page | ਪੰਨਾ ਦੁਬਾਰਾ ਲੋਡ ਕਰੋ |  |
| `m.trigger` | Trigger | ਟ੍ਰਿਗਰ |  |
| `m.alert` | Alert | ਚੇਤਾਵਨੀ |  |
| `m.capture` | Capture | ਫ਼ੋਟੋ |  |
| `m.deadline` | Advice ends | ਸਲਾਹ ਖ਼ਤਮ |  |
| `m.deadline.pmfby` | Deadline | ਸਮਾਂ-ਸੀਮਾ |  |
| `m.confirm` | Confirmation | ਪੁਸ਼ਟੀ |  |
| `m.draft` | Draft list | ਖਰੜਾ ਸੂਚੀ |  |
| `conn.label` | Phone network | ਫ਼ੋਨ ਨੈੱਟਵਰਕ |  |
| `conn.online` | Online | ਆਨਲਾਈਨ |  |
| `conn.weak` | Weak signal (2G) | ਕਮਜ਼ੋਰ ਸਿਗਨਲ (2G) |  |
| `conn.offline` | Offline | ਆਫ਼ਲਾਈਨ |  |
| `conn.waiting` | {n} waiting | {n} ਬਾਕੀ |  |
| `conn.sending` | Sending… | ਭੇਜ ਰਹੇ ਹਾਂ… |  |
| `conn.allSent` | All sent | ਸਭ ਭੇਜਿਆ ਗਿਆ |  |
| `conn.live.offline` | The phone is offline. Photos are saved on the phone and will be sent later. | ਫ਼ੋਨ ਆਫ਼ਲਾਈਨ ਹੈ। ਫ਼ੋਟੋਆਂ ਫ਼ੋਨ ਵਿੱਚ ਸੰਭਾਲੀਆਂ ਗਈਆਂ ਹਨ ਅਤੇ ਬਾਅਦ ਵਿੱਚ ਭੇਜੀਆਂ ਜਾਣਗੀਆਂ। |  |
| `conn.live.weak` | Weak signal. Sending fingerprints first; photos follow when the signal improves. | ਕਮਜ਼ੋਰ ਸਿਗਨਲ। ਪਹਿਲਾਂ ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਭੇਜੇ ਜਾ ਰਹੇ ਹਨ; ਸਿਗਨਲ ਸੁਧਰਨ ਉੱਤੇ ਫ਼ੋਟੋਆਂ ਜਾਣਗੀਆਂ। |  |
| `conn.live.online` | Back online. Sending saved items. | ਫਿਰ ਆਨਲਾਈਨ। ਸੰਭਾਲੀਆਂ ਚੀਜ਼ਾਂ ਭੇਜੀਆਂ ਜਾ ਰਹੀਆਂ ਹਨ। |  |
| `sync.title` | Sync log | ਸਿੰਕ ਰਿਕਾਰਡ |  |
| `sync.help` | Phone time is when it was taken. Server time is when the simulated server received it. | ਫ਼ੋਨ ਦਾ ਸਮਾਂ ਉਹ ਹੈ ਜਦੋਂ ਫ਼ੋਟੋ ਖਿੱਚੀ ਗਈ। ਸਰਵਰ ਦਾ ਸਮਾਂ ਉਹ ਹੈ ਜਦੋਂ ਸਿਮੂਲੇਟਡ ਸਰਵਰ ਨੂੰ ਮਿਲੀ। |  |
| `sync.device` | Phone | ਫ਼ੋਨ |  |
| `sync.server` | Server | ਸਰਵਰ |  |
| `sync.gap` | Gap | ਫ਼ਰਕ |  |
| `sync.st.synced` | Synced | ਸਿੰਕ ਹੋਇਆ |  |
| `sync.st.queued` | Queued | ਕਤਾਰ ਵਿੱਚ |  |
| `sync.st.gap` | Gap flagged | ਫ਼ਰਕ ਨਿਸ਼ਾਨਬੱਧ |  |
| `sync.st.hash` | Fingerprint sent, photo waiting | ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਭੇਜਿਆ, ਫ਼ੋਟੋ ਬਾਕੀ |  |
| `sync.packet` | Sealed packet | ਸੀਲ ਕੀਤਾ ਪੈਕੇਟ |  |
| `sync.empty` | Nothing to send yet. | ਅਜੇ ਭੇਜਣ ਲਈ ਕੁਝ ਨਹੀਂ। |  |
| `crop.Paddy` | Paddy | ਝੋਨਾ |  |
| `crop.Maize` | Maize | ਮੱਕੀ |  |
| `crop.Cotton` | Cotton | ਨਰਮਾ |  |
| `crop.Sugarcane` | Sugarcane | ਗੰਨਾ |  |
| `crop.Vegetables` | Vegetables | ਸਬਜ਼ੀਆਂ |  |
| `sec.http` | Opened over plain HTTP. The camera, location and signing are off here. Open the HTTPS link from the QR code. Simulated photos still get a fingerprint. | ਇਹ ਪੰਨਾ ਸਾਦੇ HTTP ਉੱਤੇ ਖੁੱਲ੍ਹਾ ਹੈ। ਇੱਥੇ ਕੈਮਰਾ, ਲੋਕੇਸ਼ਨ ਅਤੇ ਸਾਈਨਿੰਗ ਬੰਦ ਹਨ। QR ਕੋਡ ਵਾਲਾ HTTPS ਲਿੰਕ ਖੋਲ੍ਹੋ। ਨਕਲੀ ਫ਼ੋਟੋ ਨੂੰ ਫਿਰ ਵੀ ਫ਼ਿੰਗਰਪ੍ਰਿੰਟ ਮਿਲਦਾ ਹੈ। |  |
| `db.memory` | This phone is not saving your photos. Keep this page open until they are sent. | ਇਹ ਫ਼ੋਨ ਤੁਹਾਡੀਆਂ ਫ਼ੋਟੋਆਂ ਨੂੰ ਸੰਭਾਲ ਨਹੀਂ ਰਿਹਾ। ਭੇਜੇ ਜਾਣ ਤੱਕ ਇਹ ਪੇਜ ਖੁੱਲ੍ਹਾ ਰੱਖੋ। |  |
| `ob.title` | Officer’s draft list | ਅਧਿਕਾਰੀ ਦੀ ਖਰੜਾ ਸੂਚੀ |  |
| `ob.soon` | Later, the officer publishes a draft list. This is simulated: about {time}. If your entry looks wrong, you can attach your sealed evidence until {until}. | ਅੱਗੇ ਚੱਲ ਕੇ ਅਧਿਕਾਰੀ ਇੱਕ ਖਰੜਾ ਸੂਚੀ ਜਾਰੀ ਕਰਨਗੇ। ਇਹ ਸਿਮੂਲੇਸ਼ਨ ਹੈ: ਲਗਭਗ {time}। ਜੇ ਤੁਹਾਡੀ ਐਂਟਰੀ ਗ਼ਲਤ ਲੱਗੇ, ਤਾਂ {until} ਤੱਕ ਆਪਣਾ ਸੀਲ ਕੀਤਾ ਸਬੂਤ ਜੋੜ ਸਕਦੇ ਹੋ। |  |
| `ob.open` | The officer’s draft list is out (simulated). If your entry looks wrong, attach your sealed evidence. This is open until {until}. | ਅਧਿਕਾਰੀ ਦੀ ਖਰੜਾ ਸੂਚੀ ਆ ਗਈ ਹੈ (ਸਿਮੂਲੇਟਿਡ)। ਜੇ ਤੁਹਾਡੀ ਐਂਟਰੀ ਗ਼ਲਤ ਲੱਗੇ, ਤਾਂ ਆਪਣਾ ਸੀਲ ਕੀਤਾ ਸਬੂਤ ਜੋੜੋ। ਇਹ {until} ਤੱਕ ਖੁੱਲ੍ਹਾ ਹੈ। |  |
| `ob.attach` | Attach my sealed evidence | ਮੇਰਾ ਸੀਲ ਕੀਤਾ ਸਬੂਤ ਜੋੜੋ |  |
| `ob.needSeal` | Take and seal your photos first. Then you can attach them here. | ਪਹਿਲਾਂ ਆਪਣੀਆਂ ਫ਼ੋਟੋਆਂ ਖਿੱਚੋ ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਸੀਲ ਕਰੋ। ਫਿਰ ਇੱਥੇ ਜੋੜ ਸਕਦੇ ਹੋ। |  |
| `ob.filed` | Your sealed evidence is attached to your entry ({time}). The officer decides, outside Saboot. | ਤੁਹਾਡਾ ਸੀਲ ਕੀਤਾ ਸਬੂਤ ਤੁਹਾਡੀ ਐਂਟਰੀ ਨਾਲ ਜੁੜ ਗਿਆ ({time})। ਫ਼ੈਸਲਾ ਅਧਿਕਾਰੀ ਕਰਦਾ ਹੈ, Saboot ਤੋਂ ਬਾਹਰ। |  |
| `ob.answered` | The officer has responded ({time}), outside Saboot. Saboot only shows that a response came. | ਅਧਿਕਾਰੀ ਨੇ ਜਵਾਬ ਦਿੱਤਾ ({time}), Saboot ਤੋਂ ਬਾਹਰ। Saboot ਸਿਰਫ਼ ਇੰਨਾ ਦਿਖਾਉਂਦਾ ਹੈ ਕਿ ਜਵਾਬ ਆਇਆ। |  |
| `ob.closed` | The time to attach evidence has ended (simulated). | ਸਬੂਤ ਜੋੜਨ ਦਾ ਸਮਾਂ ਮੁੱਕ ਗਿਆ (ਸਿਮੂਲੇਟਿਡ)। |  |
| `fp.title` | A farmer without a smartphone | ਬਿਨਾਂ ਸਮਾਰਟਫ਼ੋਨ ਵਾਲਾ ਕਿਸਾਨ |  |
| `fp.badge` | Design simulation | ਡਿਜ਼ਾਈਨ ਸਿਮੂਲੇਸ਼ਨ |  |
| `fp.note` | Nothing here places a real call or sends an SMS or WhatsApp message. It shows how the flow would work, and it changes nothing in the replay. | ਇੱਥੇ ਕੋਈ ਅਸਲੀ ਫ਼ੋਨ ਕਾਲ ਨਹੀਂ ਹੁੰਦੀ ਅਤੇ ਕੋਈ ਐੱਸਐੱਮਐੱਸ ਜਾਂ ਵਟਸਐਪ ਸੁਨੇਹਾ ਨਹੀਂ ਜਾਂਦਾ। ਇਹ ਸਿਰਫ਼ ਦਿਖਾਉਂਦਾ ਹੈ ਕਿ ਪ੍ਰਕਿਰਿਆ ਕਿਵੇਂ ਚੱਲੇਗੀ, ਅਤੇ ਰੀਪਲੇ ਵਿੱਚ ਕੁਝ ਨਹੀਂ ਬਦਲਦਾ। |  |
| `fp.stepsLabel` | Steps of the call | ਕਾਲ ਦੇ ਪੜਾਅ |  |
| `fp.s1` | Missed call | ਮਿਸਡ ਕਾਲ |  |
| `fp.s2` | Saboot calls back | ਸਬੂਤ ਵਾਪਸ ਕਾਲ ਕਰਦਾ ਹੈ |  |
| `fp.s3` | Keypad answer | ਕੀਪੈਡ ਨਾਲ ਜਵਾਬ |  |
| `fp.s4` | A helper records the photos | ਸਹਾਇਕ ਫ਼ੋਟੋਆਂ ਖਿੱਚਦਾ ਹੈ |  |
| `fp.s1.b` | The farmer gives a missed call to the number shown on the village noticeboard. In the design, Saboot calls back and reads the alert aloud. | ਕਿਸਾਨ ਪਿੰਡ ਦੇ ਸੂਚਨਾ-ਬੋਰਡ ਉੱਤੇ ਲਿਖੇ ਨੰਬਰ ਉੱਤੇ ਮਿਸਡ ਕਾਲ ਦਿੰਦਾ ਹੈ। ਡਿਜ਼ਾਈਨ ਵਿੱਚ ਸਬੂਤ ਵਾਪਸ ਕਾਲ ਕਰਕੇ ਚੇਤਾਵਨੀ ਬੋਲ ਕੇ ਸੁਣਾਉਂਦਾ ਹੈ। |  |
| `fp.call` | Give a missed call | ਮਿਸਡ ਕਾਲ ਦਿਓ |  |
| `fp.incoming` | Call from Saboot | ਸਬੂਤ ਦੀ ਕਾਲ |  |
| `fp.press` | Listen, then press 1 or 2. | ਸੁਣੋ, ਫਿਰ 1 ਜਾਂ 2 ਦਬਾਓ। |  |
| `fp.k1` | You pressed 1: damage. | ਤੁਸੀਂ 1 ਦਬਾਇਆ: ਨੁਕਸਾਨ। |  |
| `fp.k2` | You pressed 2: no damage. | ਤੁਸੀਂ 2 ਦਬਾਇਆ: ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ। |  |
| `fp.kother` | Please press 1 for damage or 2 for no damage. | ਨੁਕਸਾਨ ਲਈ 1 ਜਾਂ ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ ਲਈ 2 ਦਬਾਓ। |  |
| `fp.prompt` | Namaste. This is Saboot. Heavy rain or a rising river was detected near your field. Press 1 if your field has water damage. Press 2 if it has no damage. | ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ। ਇਹ ਸਬੂਤ ਹੈ। ਤੁਹਾਡੇ ਖੇਤ ਕੋਲ ਭਾਰੀ ਮੀਂਹ ਜਾਂ ਦਰਿਆ ਦਾ ਵਧਦਾ ਪਾਣੀ ਮਿਲਿਆ ਹੈ। ਜੇ ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਨਾਲ ਨੁਕਸਾਨ ਹੈ ਤਾਂ 1 ਦਬਾਓ। ਜੇ ਨੁਕਸਾਨ ਨਹੀਂ ਹੈ ਤਾਂ 2 ਦਬਾਓ। |  |
| `fp.play` | Play the call | ਕਾਲ ਸੁਣੋ |  |
| `fp.keypad` | Phone keypad | ਫ਼ੋਨ ਦਾ ਕੀਪੈਡ |  |
| `fp.key1` | Damage | ਨੁਕਸਾਨ |  |
| `fp.key2` | No damage | ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ |  |
| `fp.out1` | Saboot asks a helper near you to visit and record the photos for you. This call files nothing. | ਸਬੂਤ ਤੁਹਾਡੇ ਨੇੜੇ ਦੇ ਕਿਸੇ ਸਹਾਇਕ ਨੂੰ ਕਹਿੰਦਾ ਹੈ ਕਿ ਉਹ ਆ ਕੇ ਤੁਹਾਡੇ ਲਈ ਫ਼ੋਟੋਆਂ ਖਿੱਚੇ। ਇਸ ਕਾਲ ਨਾਲ ਕੋਈ ਰਿਪੋਰਟ ਦਰਜ ਨਹੀਂ ਹੁੰਦੀ। |  |
| `fp.out2` | Saboot logs “no damage” for this plot and starts nothing. | ਸਬੂਤ ਇਸ ਖੇਤ ਲਈ “ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ” ਦਰਜ ਕਰਦਾ ਹੈ ਅਤੇ ਕੁਝ ਸ਼ੁਰੂ ਨਹੀਂ ਕਰਦਾ। |  |
| `fp.logHead` | What Saboot would record | ਸਬੂਤ ਕੀ ਦਰਜ ਕਰੇਗਾ |  |
| `fp.helper` | The helper visits with a smartphone, reads the consent aloud with the farmer, takes the three photos and seals the packet. The packet names the helper and carries the farmer’s consent. | ਸਹਾਇਕ ਸਮਾਰਟਫ਼ੋਨ ਲੈ ਕੇ ਆਉਂਦਾ ਹੈ, ਕਿਸਾਨ ਨਾਲ ਸਹਿਮਤੀ ਬੋਲ ਕੇ ਪੜ੍ਹਦਾ ਹੈ, ਤਿੰਨ ਫ਼ੋਟੋਆਂ ਖਿੱਚਦਾ ਹੈ ਅਤੇ ਪੈਕੇਟ ਸੀਲ ਕਰਦਾ ਹੈ। ਪੈਕੇਟ ਵਿੱਚ ਸਹਾਇਕ ਦਾ ਨਾਂ ਅਤੇ ਕਿਸਾਨ ਦੀ ਸਹਿਮਤੀ ਦਰਜ ਰਹਿੰਦੀ ਹੈ। |  |
| `fp.open` | Open helper mode | ਸਹਾਇਕ ਮੋਡ ਖੋਲ੍ਹੋ |  |
| `fp.again` | Start again | ਫਿਰ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ |  |
