// Hindi. Machine-drafted: every string is flagged for native review (see docs/translation-review.md).
// When a native speaker has checked a line, change its flag to `// reviewed`.
const hi: Record<string, string | string[]> = {
  'nav.farmer': 'किसान ऐप', // needs-native-review
  'nav.how': 'यह कैसे काम करता है', // needs-native-review
  'nav.settings': 'सेटिंग्स', // needs-native-review
  days: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'], // needs-native-review
  months: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'], // needs-native-review
  'u.d': 'दि', // needs-native-review
  'u.h': 'घं', // needs-native-review
  'u.m': 'मि', // needs-native-review

  'skip.main': 'मुख्य सामग्री पर जाएँ', // needs-native-review
  'ann.label': 'सिमुलेशन सूचना', // needs-native-review
  'ann.text': 'सिमुलेशन: कृत्रिम डेटा, काल्पनिक ज़िला', // needs-native-review
  'ann.skip': 'डेमो पर जाएँ', // needs-native-review
  'brand.home': 'ऊपर जाएँ', // needs-native-review
  'nav.label': 'खंड', // needs-native-review
  'nav.problem': 'समस्या', // needs-native-review
  'nav.sim': 'सिमुलेशन', // needs-native-review
  'nav.limits': 'ईमानदार सीमाएँ', // needs-native-review
  'nav.run': 'सिमुलेशन चलाएँ', // needs-native-review
  'nav.menu': 'मेन्यू खोलें', // needs-native-review
  'nav.menuTitle': 'मेन्यू', // needs-native-review
  'nav.close': 'मेन्यू बंद करें', // needs-native-review
  'nav.lang': 'भाषा', // needs-native-review
  'lang.name.en': 'अंग्रेज़ी', // needs-native-review
  'lang.name.hi': 'हिन्दी', // needs-native-review
  'lang.name.pa': 'पंजाबी', // needs-native-review
  'sim.tag': 'सिमुलेशन', // needs-native-review
  'sim.tagShort': 'SIM', // needs-native-review
  'hero.eyebrow': 'आपदा में फ़सल-नुकसान के प्रमाण की परत', // needs-native-review
  'hero.h': 'घड़ी तूफ़ान के साथ शुरू होती है।', // needs-native-review
  'hero.l1': 'सबूत पंजीकृत खेतों पर बारिश, नदी और सैटेलाइट संकेतों पर नज़र रखता है, बाढ़ की आशंका होते ही प्रमाण की घड़ी शुरू करता है और किसान को उसकी भाषा में फ़ोन करता है।', // needs-native-review
  'hero.l2': 'यह ऑफ़लाइन भी चलने वाली फ़ोटो में मदद करता है और उन्हें इस तरह सील करता है कि कोई भी बदलाव दिख जाए। नुकसान का आकलन करने वाले अधिकारी को क्रमबद्ध, जाँचने लायक रिकॉर्ड मिलता है।', // needs-native-review
  'hero.run': 'सिमुलेशन चलाएँ', // needs-native-review
  'hero.how': 'यह कैसे काम करता है', // needs-native-review
  'hero.clockLabel': 'चित्र: एक घड़ी, जो तूफ़ान के साथ गिनना शुरू करती है', // needs-native-review
  'hero.clockCap': 'घटना के समय से गिनती, फ़ोन कॉल से नहीं', // needs-native-review

  'pb.eyebrow': 'समस्या', // needs-native-review
  'pb.h': 'प्रमाण आकलन से पहले ही फीके पड़ जाते हैं।', // needs-native-review
  'pb.1.t': 'पानी उतरने के बाद आकलन', // needs-native-review
  'pb.1.b': 'नुकसान का आकलन आमतौर पर बाढ़ उतरने के बाद खेतों में घूमकर होता है, जब तक प्रमाण फीके पड़ चुके होते हैं।', // needs-native-review
  'pb.2.t': 'किसान को कोई नहीं बताता कि क्या खींचना है', // needs-native-review
  'pb.2.b': 'पानी किसी भी संदेश से पहले आ जाता है। किसान को शायद ही कभी पता चलता है कि नुकसान की घड़ी शुरू हो गई है, या कौन-सा प्रमाण काम आएगा।', // needs-native-review
  'pb.3.t': 'प्रमाण, जिस पर सवाल उठ सकते हैं', // needs-native-review
  'pb.3.b': 'भरोसेमंद समय और जगह के बिना फ़ोटो पर शक करना आसान है। देर से मिला या संदिग्ध प्रमाण निष्पक्ष आकलन को मुश्किल बनाता है।', // needs-native-review

  'sim.eyebrow': 'सिमुलेशन', // needs-native-review
  'sim.h': 'एक बाढ़, शुरू से अंत तक।', // needs-native-review
  'sim.lead': '{plots} काल्पनिक खेतों पर एक हफ़्ते का कृत्रिम मौसम। इसे चलाएँ, आगे-पीछे करें या किसी पल पर जाएँ। किसान का फ़ोन आपके हाथ में है; अधिकारी प्रमाण देखता है।', // needs-native-review
  'rail.group': 'सबूत किस प्रक्रिया में मदद करता है', // needs-native-review
  'rail.label': 'प्रक्रिया', // needs-native-review
  'rail.relief': 'राहत आकलन', // needs-native-review
  'rail.pmfby': 'पीएमएफ़बीवाई सूचना', // needs-native-review
  'rail.d.relief': 'बाढ़ के नुकसान का राज्य या ज़िला स्तर का आकलन। अधिकारी क्रम तय करता और जाँचता है; किसान सील किया हुआ प्रमाण देता है। जल्दी फ़ोटो लेने की सलाह कोई समय-सीमा नहीं है। किसी राज्य का नाम नहीं लिया गया है।', // needs-native-review
  'rail.d.pmfby': 'स्थानीय आपदा की 72 घंटे की सूचना, उस राज्य के लिए जहाँ पीएमएफ़बीवाई चलती है। {state} का एक काल्पनिक ज़िला।', // needs-native-review
  'cad.label': 'रडार पास', // needs-native-review
  'cad.demo': 'हर {n} घंटे (डेमो)', // needs-native-review
  'cad.slow': 'हर {n} घंटे (धीमा)', // needs-native-review
  'cad.d': 'दोनों चक्र सिमुलेटेड हैं। धीमा चक्र दिखाता है कि देर से आने वाला रडार पास क्या करता है।', // needs-native-review
  'sim.tabs': 'सिमुलेशन दृश्य', // needs-native-review
  'sim.tab.farmer': 'किसान', // needs-native-review
  'sim.tab.insurer': 'बीमा कंपनी', // needs-native-review
  'sim.tab.insurer.relief': 'अधिकारी', // needs-native-review
  'sim.tab.ledger': 'लेजर', // needs-native-review
  'sim.tab.explainer': 'व्याख्या', // needs-native-review
  'sim.phoneCap': 'किसान का फ़ोन, आपके ब्राउज़र में सचमुच चल रहा है', // needs-native-review
  'sim.loading': 'बाढ़ का रीप्ले लोड हो रहा है…', // needs-native-review
  'sim.loadError': 'परिदृश्य डेटा लोड नहीं हो सका ({err})। पेज दोबारा लोड करें।', // needs-native-review
  'lazy.failed': 'पेज का यह हिस्सा लोड नहीं हो सका। कनेक्शन जाँचें, फिर पेज दोबारा लोड करें।', // needs-native-review
  'lazy.reload': 'पेज दोबारा लोड करें', // needs-native-review
  'sim.consoleNote': 'बीमा कंपनी और ज़िले का कंसोल अंग्रेज़ी में दिखाया गया है।', // needs-native-review
  'sim.consoleNote.relief': 'अधिकारी का कंसोल अंग्रेज़ी में दिखाया गया है।', // needs-native-review
  'tour.invite': 'पहली बार? 2 मिनट का जज टूर लें।', // needs-native-review
  'tour.start': 'टूर शुरू करें', // needs-native-review
  'tour.dismiss': 'हटाएँ', // needs-native-review

  'ctl.label': 'सिमुलेशन नियंत्रण', // needs-native-review
  'ctl.play': 'रीप्ले चलाएँ', // needs-native-review
  'ctl.pause': 'रीप्ले रोकें', // needs-native-review
  'ctl.scrub': 'रीप्ले समय, शुरुआत के बाद के घंटे', // needs-native-review
  'ctl.speed': 'रीप्ले की गति', // needs-native-review
  'ctl.jump': 'किसी पल पर जाएँ', // needs-native-review
  'ctl.reset': 'रीसेट', // needs-native-review
  'ctl.resetDone': 'रीप्ले T+0 पर रीसेट हुआ। आपकी गतिविधियाँ हटा दी गईं।', // needs-native-review
  'ctl.more': 'और नियंत्रण', // needs-native-review
  'ctl.moreTitle': 'रीप्ले नियंत्रण', // needs-native-review
  'ctl.net': 'फ़ोन नेटवर्क', // needs-native-review
  'net.online': 'ऑनलाइन', // needs-native-review
  'net.weak': 'कमज़ोर (2G)', // needs-native-review
  'net.offline': 'ऑफ़लाइन', // needs-native-review
  'm.trigger': 'ट्रिगर', // needs-native-review
  'm.alert': 'चेतावनी', // needs-native-review
  'm.capture': 'फ़ोटो', // needs-native-review
  'm.deadline': 'सलाह खत्म', // needs-native-review
  'm.deadline.pmfby': 'समय-सीमा', // needs-native-review
  'm.confirm': 'पुष्टि', // needs-native-review
  'm.draft': 'मसौदा सूची', // needs-native-review

  'faq.eyebrow': 'ईमानदार सीमाएँ', // needs-native-review
  'faq.h': 'सबूत क्या नहीं करता।', // needs-native-review
  'faq.q1': 'सबूत क्या है, और क्या नहीं है?', // needs-native-review
  'faq.a1': [ // needs-native-review
    'सबूत आपदा के बाद फ़सल-नुकसान के लिए प्रमाण की एक परत है। यह संकेतों पर नज़र रखता है, घटना के समय से घड़ी शुरू करता है, किसान से फ़ोटो माँगता है, उन्हें सील करता है और अधिकारियों को क्रमबद्ध, जाँचने लायक रिकॉर्ड देता है।',
    'यह दावा-प्रणाली, बीमा कंपनी या सरकारी पोर्टल नहीं है। यह कुछ जमा नहीं करता, कुछ भुगतान नहीं करता, कोई असली कॉल नहीं करता और किसी सरकारी प्रणाली से नहीं जुड़ता।',
  ],
  'faq.q2': 'क्या सबूत तय करता है कि कौन पात्र है या कितना भुगतान होगा?', // needs-native-review
  'faq.a2': [ // needs-native-review
    'नहीं। सबूत प्रमाण इकट्ठा करता है और समीक्षा के लिए उसका क्रम बनाता है। फ़ैसला विभाग या बीमा कंपनी का व्यक्ति करता है, सबूत के बाहर।',
    'स्क्रीन पर हर स्कोर एक प्रमाण-स्तर है, पात्रता या मुआवज़े का फ़ैसला नहीं, और हर स्तर अपनी अनिश्चितता दिखाता है।',
  ],
  'faq.q3': 'ओलावृष्टि को यह कैसे संभालता है?', // needs-native-review
  'faq.a3': [ // needs-native-review
    'इस डेमो में सबूत जिन संकेतों पर नज़र रखता है, उनसे वह ओलावृष्टि की पुष्टि नहीं कर सकता, इसलिए वह इसे पहचानने का दावा कभी नहीं करता।',
    'वह तूफ़ान के रास्ते के किसानों को कम-भरोसे वाला संदेश भेजकर पूछता है कि क्या उनके खेत में ओले गिरे। इसके बाद की हर चीज़ पर “किसान द्वारा बताया गया” लिखा होता है।',
  ],
  'faq.q4': 'क्या ऑफ़लाइन समय-मुहरें छेड़छाड़ से सुरक्षित हैं?', // needs-native-review
  'faq.a4': [ // needs-native-review
    'नहीं। फ़ोन की घड़ी बदली जा सकती है। सबूत फ़ोन का समय और सर्वर को मिलने का समय साथ-साथ दर्ज करता है और बड़े अंतर को जाँच के लिए चिह्नित करता है।',
    'हैश चेन दिखाती है कि कोई रिकॉर्ड बनने के बाद बदला गया या नहीं। वह यह साबित नहीं कर सकती कि फ़ोन की घड़ी सही थी।',
  ],
  'faq.q5': 'प्रमाण पर नियंत्रण किसका है?', // needs-native-review
  'faq.a5': [ // needs-native-review
    'सबूत एक निष्पक्ष प्रमाण-परत बनने के लिए है। किसान अपने पैकेट की एक प्रति अपने फ़ोन पर रखता है, और बीमा कंपनी व अधिकारी उसे केवल किसान की सहमति से देखते हैं।',
    'इस सिमुलेशन में सब कुछ आपके फ़ोन पर चलता है और जब तक आप ख़ुद साझा न करें, कुछ भी फ़ोन से बाहर नहीं जाता।',
  ],
  'faq.q6': 'यहाँ क्या असली है और क्या सिमुलेटेड?', // needs-native-review
  'faq.a6': [ // needs-native-review
    'आपके ब्राउज़र में असली: कैमरा और लोकेशन, SHA-256 फ़िंगरप्रिंट और हैश चेन, ऑफ़लाइन कतार, आवाज़ चलाना और ऑफ़लाइन ऐप खुद।',
    'सिमुलेटेड: बारिश, नदी के मापक, सैटेलाइट बाढ़-नक्शे, सर्वर, फ़ोन कॉल, अधिकारी या बीमा कंपनी, दर्ज करने का माध्यम, और सभी {plots} खेत व उनके किसान। स्क्रीन की हर संख्या सिमुलेशन से आती है।',
    'असली सैटेलाइट रडार एक ही खेत के ऊपर से केवल कुछ दिनों में गुज़रता है। डेमो में हर {cadence} घंटे में एक पास माना गया है और धीमे विकल्प में हर {slow} घंटे में; दोनों चक्र सिमुलेटेड हैं।',
  ],
  'faq.q7': 'क्या यह सब असली बाढ़ों पर परखा गया है?', // needs-native-review
  'faq.a7': [ // needs-native-review
    'नहीं। स्क्रीन पर दिखने वाली प्रिसिज़न और रिकॉल सिमुलेटर के अपने कृत्रिम सच के विरुद्ध एक संगति-जाँच है, परख नहीं। रीप्ले में नदी का नियम इसलिए चलता है कि मापक की शृंखला उसी सिमुलेटेड बाढ़ से बनी है।',
    'असली डेटा पर परख, यानी बीती बाढ़ों को उन गाँवों के विरुद्ध दोहराना जिन्हें किसी आधिकारिक प्रक्रिया ने बाद में प्रभावित माना, अभी नहीं की गई है। असली रिपोर्ट आने तक उत्पाद यही बताता है।',
  ],
  'faq.q8': 'इसका ख़र्च कौन उठाएगा?', // needs-native-review
  'faq.a8': [ // needs-native-review
    'हमारा प्रस्ताव, कोई मौजूदा व्यवस्था नहीं: राज्य या ज़िले का विभाग सबूत का लाइसेंस लेता है और हर घटना पर शुल्क देता है। किसान कुछ नहीं देते। बीमा कंपनियाँ बाद में पीएमएफ़बीवाई वाले रास्ते पर जुड़ सकती हैं।',
  ],
  'foot.note': 'कृत्रिम डेटा और काल्पनिक ज़िले वाला सिमुलेशन। किसी बीमा कंपनी या सरकारी योजना से संबद्ध नहीं।', // needs-native-review
  'foot.team': 'टीम', // needs-native-review
  'foot.project': 'प्रोजेक्ट', // needs-native-review
  'foot.track': 'ट्रैक', // needs-native-review
  'foot.event': 'आयोजन', // needs-native-review
  'foot.code': 'GitHub पर सोर्स कोड', // needs-native-review

  'tour.step': 'जज टूर · {n} / {total}', // needs-native-review
  'tour.skip': 'टूर छोड़ें', // needs-native-review
  'tour.prev': 'पिछला कदम', // needs-native-review
  'tour.pause': 'रोकें', // needs-native-review
  'tour.resume': 'जारी रखें', // needs-native-review
  'tour.restart': 'फिर से शुरू करें', // needs-native-review
  'tour.next': 'आगे', // needs-native-review
  'tour.finish': 'समाप्त', // needs-native-review
  'tour.manual': 'आपका डिवाइस कम गति (रिड्यूस्ड मोशन) चाहता है, इसलिए टूर अपने आप आगे नहीं बढ़ेगा।', // needs-native-review
  'tour.s1.t': 'घड़ी तूफ़ान के साथ शुरू होती है', // needs-native-review
  'tour.s1.b': 'बाढ़ के बाद आकलन अक्सर तब होता है जब प्रमाण फीके पड़ चुके होते हैं। सबूत घटना के समय से घड़ी शुरू करता है, यानी जब पानी पहुँचता है तब से, न कि जब किसान को पता चलता है। यहाँ सब कुछ कृत्रिम डेटा वाला सिमुलेशन है।', // needs-native-review
  'tour.s1.b.pmfby': 'बाढ़ में फ़सल बीमा नुकसान की सूचना 72 घंटे के भीतर देनी होती है, जो पानी आने के समय से गिने जाते हैं, किसान को पता चलने से नहीं। सबूत यही दूरी पाटता है। यहाँ सब कुछ कृत्रिम डेटा वाला सिमुलेशन है।', // needs-native-review
  'tour.s2.t': 'पहचान: अंदाज़ा नहीं, नियम', // needs-native-review
  'tour.s2.b': '{gauge} मापक पर बारिश भारी-बारिश की रेखा पार करती है, और निचले खेतों पर इससे घड़ी शुरू होती है। नदी का मापक अपने ख़तरे के स्तर को पार करे तो नदी किनारे के खेतों के लिए भी यही होता है। रडार बाद में पुष्टि करता है। घड़ी नियम तय करते हैं।', // needs-native-review
  'tour.s3.t': 'चेतावनी: घड़ी पहले से चल रही थी', // needs-native-review
  'tour.s3.b': '{name} को {language} में फ़ोन आता है, घटना शुरू होने के {focus} बाद, और जल्दी फ़ोटो लेने को कहा जाता है। इस रीप्ले में बीच के किसान (माध्यिका) को घटना के {median} बाद फ़ोन आता है; सबसे धीमे दसवें हिस्से को {p90} इंतज़ार करना पड़ता है, क्योंकि उनके खेत सिर्फ़ रडार को दिखते हैं। यह सलाह है, समय-सीमा नहीं।', // needs-native-review
  'tour.s3.b.pmfby': '{name} को {language} में फ़ोन आता है, घटना शुरू होने के {focus} बाद। उलटी गिनती पहले ही {left} दिखाती है, क्योंकि सबूत घटना के समय से गिनता है। इस रीप्ले में बीच के किसान (माध्यिका) को घटना के {median} बाद फ़ोन आता है; सबसे धीमे दसवें हिस्से को {p90} इंतज़ार करना पड़ता है।', // needs-native-review
  'tour.s4.t': 'तीन निर्देशित फ़ोटो, ऑफ़लाइन भी', // needs-native-review
  'tour.s4.b': 'पूरा खेत, पास से, पहचान चिह्न। हर फ़ोटो को फ़ोन पर ही समय, जगह और SHA-256 फ़िंगरप्रिंट मिलता है। नेटवर्क को कमज़ोर या ऑफ़लाइन करें: चीज़ें कतार में रुकती हैं, और सिंक रिकॉर्ड फ़ोन का समय और सर्वर का समय दिखाता है।', // needs-native-review
  'tour.s5.t': 'हर बदलाव दिखाने वाला प्रमाण', // needs-native-review
  'tour.s5.b': 'हर कार्रवाई अपनी पिछली कार्रवाई से जुड़ी है। बाद में कुछ भी बदलें, समय भी, तो जाँच विफल हो जाती है। किसान सील किया हुआ प्रमाण अधिकारी को दिखाता है; सबूत न कुछ जमा करता है, न फ़ैसला करता है।', // needs-native-review
  'tour.s5.b.pmfby': 'हर कार्रवाई पिछली से जुड़ी होती है। बाद में कुछ भी बदलें, समय भी, तो जाँच विफल हो जाती है। किसान आधिकारिक माध्यम से दावा दर्ज करता है; सबूत न दर्ज करता है, न फ़ैसला करता है।', // needs-native-review
  'tour.s6.t': 'क्रम में प्रमाण, फ़ैसले नहीं', // needs-native-review
  'tour.s6.b': 'अधिकारी को प्रमाण-स्तरों और उनकी अनिश्चितता के साथ क्रमबद्ध कार्य-सूची, समीक्षा के लिए मसौदा सूची और ऑडिट लेजर दिखता है। फ़ैसला सबूत के बाहर, किसी व्यक्ति द्वारा होता है।', // needs-native-review
  'tour.s6.b.pmfby': 'बीमा कंपनी और ज़िला अधिकारी अनिश्चितता के साथ प्रमाण-स्तर, निरीक्षण कतार और ऑडिट लेजर देखते हैं। फ़ैसला सबूत के बाहर, एक व्यक्ति करता है।', // needs-native-review

  'how.eyebrow': 'यह कैसे काम करता है', // needs-native-review
  'how.h': 'प्रमाण, फ़ैसले नहीं।', // needs-native-review
  'how.lead': 'समझदारी वाला हिस्सा सर्वर पर चलता है (यहाँ सिमुलेटेड)। किसान वाला हिस्सा फ़ोन पर चलता है और कमज़ोर या बिना सिग्नल के भी काम करता रहता है।', // needs-native-review
  'how.local': 'इस डेमो में सब कुछ आपके अपने फ़ोन या लैपटॉप पर चलता है। फ़ोटो और आपकी असली लोकेशन तब तक डिवाइस से बाहर नहीं जाती जब तक आप ख़ुद साझा न करें।', // needs-native-review
  'how.model': 'रीप्ले में एक काल्पनिक ज़िला और गढ़ी गई मानसूनी बाढ़ है। कोई असली जगह, व्यक्ति या रिकॉर्ड इसमें नहीं है।', // needs-native-review
  'how.model.pmfby': 'रीप्ले में {state} का एक काल्पनिक ज़िला है, उस राज्य का जहाँ यह योजना चलती है, और गढ़ी गई मानसूनी बाढ़। कोई असली जगह, व्यक्ति या रिकॉर्ड इसमें नहीं है।', // needs-native-review
  'arch.server': 'सर्वर (सिमुलेटेड)', // needs-native-review
  'arch.phone': 'यह फ़ोन (असली, आपके ब्राउज़र में)', // needs-native-review
  'arch.out': 'प्रमाण का उपयोग करने वाले लोग', // needs-native-review
  'arch.src': 'स्रोत', // needs-native-review
  'arch.src.s': 'बारिश और नदी के मापक, रडार, भू-भाग, पंजीकृत खेत', // needs-native-review
  'arch.det': 'घटना पहचान', // needs-native-review
  'arch.det.s': 'तय नियम A, B और C', // needs-native-review
  'arch.pl': 'विश्वसनीयता स्कोर', // needs-native-review
  'arch.pl.s': 'कारक × भार, अनिश्चितता के साथ', // needs-native-review
  'arch.clk': 'प्रमाण की घड़ी', // needs-native-review
  'arch.clk.pmfby': '72 घंटे की घड़ी', // needs-native-review
  'arch.clk.s': 'घटना के समय से शुरू', // needs-native-review
  'arch.al': 'किसान को चेतावनी', // needs-native-review
  'arch.al.s': 'उसकी भाषा में आवाज़ संदेश · इस प्रोटोटाइप में कोई AI नहीं', // needs-native-review
  'arch.cap': 'निर्देशित फ़ोटो', // needs-native-review
  'arch.cap.s': 'समय और जगह की मुहर, ऑफ़लाइन भी · फ़ोटो की जाँच योजना में है, बनी नहीं', // needs-native-review
  'arch.pk': 'प्रमाण पैकेट', // needs-native-review
  'arch.pk.s': 'SHA-256 हैश चेन, फ़ोन पर सील', // needs-native-review
  'arch.ins': 'अधिकारी कंसोल', // needs-native-review
  'arch.ins.pmfby': 'बीमा कंसोल', // needs-native-review
  'arch.ins.s': 'क्रम में प्रमाण-स्तर', // needs-native-review
  'arch.tri': 'आकलन कार्य-सूची', // needs-native-review
  'arch.tri.pmfby': 'ज़िला प्राथमिकता', // needs-native-review
  'arch.tri.s': 'कारणों के साथ क्रम में', // needs-native-review
  'arch.tri.s.pmfby': 'निरीक्षण कतार', // needs-native-review
  'arch.fil': 'प्रमाण सौंपना', // needs-native-review
  'arch.fil.pmfby': 'दावा दर्ज कराने में मदद', // needs-native-review
  'arch.fil.s': 'किसान सील किया प्रमाण अधिकारी को दिखाता है', // needs-native-review
  'arch.fil.s.pmfby': 'किसान आधिकारिक माध्यम से दर्ज करता है', // needs-native-review
  'arch.aud': 'ऑडिट लेजर', // needs-native-review
  'arch.aud.s': 'केवल जुड़ने वाला, जाँचने योग्य', // needs-native-review
  'arch.caption': 'स्रोत सर्वर पर घटना पहचान, विश्वसनीयता स्कोर और प्रमाण की घड़ी को डेटा देते हैं। घड़ी फ़ोन पर किसान की चेतावनी, निर्देशित फ़ोटो और सील किए प्रमाण पैकेट को शुरू करती है। पैकेट अधिकारी कंसोल, आकलन कार्य-सूची, प्रमाण सौंपने और ऑडिट लेजर को डेटा देता है। इस श्रृंखला में सबूत कुछ भी तय नहीं करता।', // needs-native-review
  'arch.caption.pmfby': 'स्रोत सर्वर पर घटना पहचान, विश्वसनीयता स्कोर और 72 घंटे की घड़ी को डेटा देते हैं। घड़ी फ़ोन पर किसान की चेतावनी, निर्देशित फ़ोटो और सील किए प्रमाण पैकेट को शुरू करती है। पैकेट बीमा कंसोल, ज़िला प्राथमिकता, दावा दर्ज कराने और ऑडिट लेजर तक जाता है। इस पूरी कड़ी में सबूत कहीं भी दावे का फ़ैसला नहीं करता।', // needs-native-review
  'wf.h': 'पाँच कदम', // needs-native-review
  'wf.1.t': 'पहचान', // needs-native-review
  'wf.1.b': 'नियम हर पंजीकृत खेत पर बारिश, नदी, भू-भाग और रडार पर नज़र रखते हैं और संभावित बाढ़ को चिह्नित करते हैं।', // needs-native-review
  'wf.2.t': 'चेतावनी', // needs-native-review
  'wf.2.b': 'प्रमाण की घड़ी घटना के समय शुरू होती है, किसान को पता चलने पर नहीं। उसकी भाषा में आवाज़ कॉल जल्दी फ़ोटो माँगती है।', // needs-native-review
  'wf.2.b.pmfby': '72 घंटे की घड़ी घटना के समय शुरू होती है, किसान को पता चलने पर नहीं। उसकी भाषा में आवाज़ कॉल यही बताती है।', // needs-native-review
  'wf.3.t': 'फ़ोटो', // needs-native-review
  'wf.3.b': 'तीन निर्देशित फ़ोटो (पूरा खेत, पास से, पहचान चिह्न), समय और जगह की मुहर के साथ। बिना सिग्नल भी काम करता है।', // needs-native-review
  'wf.4.t': 'पैकेट', // needs-native-review
  'wf.4.b': 'हर फ़ोटो और हर कार्रवाई का SHA-256 फ़िंगरप्रिंट बनता है और कड़ी में जुड़ता है, इसलिए बाद का कोई भी बदलाव दिख जाता है।', // needs-native-review
  'wf.5.t': 'सौंपना और नज़र रखना', // needs-native-review
  'wf.5.b': 'किसान सील किया हुआ प्रमाण अधिकारी को दिखाता है। सबूत ऑडिट रिकॉर्ड रखता है और अधिकारी की पुष्टि पर नज़र रखता है; फ़ैसला अधिकारी करता है, Saboot के बाहर।', // needs-native-review
  'wf.5.b.pmfby': 'जानकारी आधिकारिक माध्यम के लिए तैयार रहती है (भारत में, उदाहरण के लिए, फ़सल बीमा ऐप या 14447 हेल्पलाइन)। सबूत पुष्टि पर नज़र रखता है और देर होने पर शिकायत आगे बढ़ाता है।', // needs-native-review
  'rs.h': 'क्या असली है और क्या सिमुलेटेड', // needs-native-review
  'rs.c': 'हिस्सा', // needs-native-review
  'rs.demo': 'इस डेमो में', // needs-native-review
  'rs.status': 'स्थिति', // needs-native-review
  'rs.prod': 'असली उत्पाद में', // needs-native-review
  'rs.real': 'असली', // needs-native-review
  'rs.sim': 'सिमुलेटेड', // needs-native-review
  'rs.mixed': 'आंशिक रूप से असली', // needs-native-review
  'rs.none': 'अभी नहीं', // needs-native-review
  'rs.1.c': 'बारिश', // needs-native-review
  'rs.1.d': '{n} मापकों की कृत्रिम घंटेवार शृंखला', // needs-native-review
  'rs.1.p': 'मौसम एजेंसी और राज्य के स्वचालित मौसम केंद्र', // needs-native-review
  'rs.2.c': 'बाढ़ का नक्शा', // needs-native-review
  'rs.2.d': 'कृत्रिम रडार बाढ़-नक्शे, डेमो में हर {n} घंटे और धीमे विकल्प में हर {slow} घंटे में एक बार (सिमुलेटेड अंतराल)', // needs-native-review
  'rs.2.p': 'सैटेलाइट रडार बाढ़ मानचित्रण, जो किसी खेत के ऊपर से कुछ दिनों में एक बार गुज़रता है', // needs-native-review
  'rs.3.c': 'भू-भाग', // needs-native-review
  'rs.3.d': 'कृत्रिम ऊँचाई ग्रिड', // needs-native-review
  'rs.3.p': 'डिजिटल ऊँचाई मॉडल', // needs-native-review
  'rs.4.c': 'खेत और किसान', // needs-native-review
  'rs.4.d': '{n} कृत्रिम खेत, बनाए गए नाम, काल्पनिक ज़िला', // needs-native-review
  'rs.4.p': 'बीमा पंजीकरण और भूमि रिकॉर्ड, सहमति के साथ', // needs-native-review
  'rs.5.c': 'घटना नियम और प्रमाण की घड़ी', // needs-native-review
  'rs.5.c.pmfby': 'घटना नियम और 72 घंटे की घड़ी', // needs-native-review
  'rs.5.d': 'आपके ब्राउज़र में चलता असली कोड', // needs-native-review
  'rs.5.p': 'वही तय नियम, सर्वर पर', // needs-native-review
  'rs.6.c': 'आवाज़ चेतावनी', // needs-native-review
  'rs.6.d': 'ब्राउज़र में असली ऑडियो या बोलने वाली आवाज़; कोई कॉल नहीं होती', // needs-native-review
  'rs.6.p': 'टेलीफ़ोन वॉइस-कॉल सेवा', // needs-native-review
  'rs.7.c': 'कैमरा और लोकेशन', // needs-native-review
  'rs.7.d': 'फ़ोन का असली कैमरा और GPS; मना करने पर सिमुलेटेड विकल्प', // needs-native-review
  'rs.7.p': 'वही', // needs-native-review
  'rs.8.c': 'SHA-256 हैश चेन', // needs-native-review
  'rs.8.d': 'असली WebCrypto हैशिंग और जाँच', // needs-native-review
  'rs.8.p': 'वही, साथ में सर्वर पर पुष्टि', // needs-native-review
  'rs.9.c': 'ऑफ़लाइन कतार और सिंक', // needs-native-review
  'rs.9.d': 'असली IndexedDB कतार और सर्विस वर्कर; सर्वर सिमुलेटेड है', // needs-native-review
  'rs.9.p': 'असली सिंक सेवा', // needs-native-review
  'rs.10.c': 'प्रमाण सौंपना', // needs-native-review
  'rs.10.c.pmfby': 'दावा दर्ज करना', // needs-native-review
  'rs.10.d': 'केवल मार्गदर्शन और रसीद संख्या दर्ज करना; कुछ भी जमा नहीं होता', // needs-native-review
  'rs.10.d.pmfby': 'केवल मार्गदर्शन और संदर्भ संख्या दर्ज करना; कुछ भी जमा नहीं होता', // needs-native-review
  'rs.10.p': 'किसान प्रमाण अधिकारी को दिखाता है', // needs-native-review
  'rs.10.p.pmfby': 'किसान आधिकारिक माध्यम से दर्ज करता है', // needs-native-review
  'rs.11.c': 'अधिकारी की पुष्टि और शिकायत', // needs-native-review
  'rs.11.c.pmfby': 'बीमा पुष्टि और शिकायत', // needs-native-review
  'rs.11.d': 'पहले से तय समय', // needs-native-review
  'rs.11.p': 'विभाग और ज़िले की प्रणालियाँ', // needs-native-review
  'rs.11.p.pmfby': 'बीमा कंपनी और ज़िले की प्रणालियाँ', // needs-native-review
  'rs.12.c': 'प्रमाण-स्तर और प्राथमिकता', // needs-native-review
  'rs.12.d': 'कृत्रिम डेटा पर असली सूत्र', // needs-native-review
  'rs.12.p': 'पुराने दावों पर तय किए गए भार', // needs-native-review
  'rs.13.c': 'प्रभाव के आँकड़े', // needs-native-review
  'rs.13.d': 'कृत्रिम रीप्ले से गणना', // needs-native-review
  'rs.13.p': 'खेत में पायलट', // needs-native-review
  'rs.14.c': 'नदी के मापक', // needs-native-review
  'rs.14.d': '{n} मापकों की कृत्रिम घंटेवार नदी-स्तर शृंखला, उसी सिमुलेटेड बाढ़ से बनी', // needs-native-review
  'rs.14.p': 'राज्य का जल संसाधन विभाग और राष्ट्रीय बाढ़-पूर्वानुमान मापक', // needs-native-review
  'rs.15.c': 'असली डेटा पर परख', // needs-native-review
  'rs.15.d': 'अभी नहीं की गई। दिखाई गई प्रिसिज़न और रिकॉल एक सिमुलेटेड संगति-जाँच हैं', // needs-native-review
  'rs.15.p': 'बीती बाढ़ों को उन गाँवों के विरुद्ध दोहराना जिन्हें किसी आधिकारिक प्रक्रिया ने बाद में प्रभावित माना', // needs-native-review

  'f.nav.home': 'होम', // needs-native-review
  'f.nav.photos': 'फ़ोटो', // needs-native-review
  'f.nav.packet': 'सबूत', // needs-native-review
  'f.nav.file': 'साझा करें', // needs-native-review
  'f.nav.file.pmfby': 'रिपोर्ट', // needs-native-review
  'f.nav.status': 'स्थिति', // needs-native-review
  'f.read': 'सुनें', // needs-native-review
  'f.stop': 'रोकें', // needs-native-review
  'f.captions': 'कैप्शन', // needs-native-review
  'f.voiceNA': 'इस फ़ोन पर इस भाषा में आवाज़ उपलब्ध नहीं है। कृपया कैप्शन पढ़ें।', // needs-native-review
  'conn.label': 'फ़ोन नेटवर्क', // needs-native-review
  'conn.online': 'ऑनलाइन', // needs-native-review
  'conn.weak': 'कमज़ोर सिग्नल (2G)', // needs-native-review
  'conn.offline': 'ऑफ़लाइन', // needs-native-review
  'conn.waiting': '{n} बाकी', // needs-native-review
  'conn.sending': 'भेज रहे हैं…', // needs-native-review
  'conn.allSent': 'सब भेजा गया', // needs-native-review
  'conn.live.offline': 'फ़ोन ऑफ़लाइन है। फ़ोटो फ़ोन में सहेजी गई हैं और बाद में भेजी जाएँगी।', // needs-native-review
  'conn.live.weak': 'कमज़ोर सिग्नल। पहले फ़िंगरप्रिंट भेजे जा रहे हैं; सिग्नल सुधरने पर फ़ोटो जाएँगी।', // needs-native-review
  'conn.live.online': 'फिर से ऑनलाइन। सहेजी चीज़ें भेजी जा रही हैं।', // needs-native-review
  'sync.title': 'सिंक रिकॉर्ड', // needs-native-review
  'sync.help': 'फ़ोन का समय वह है जब फ़ोटो ली गई। सर्वर का समय वह है जब सिमुलेटेड सर्वर को मिली।', // needs-native-review
  'sync.device': 'फ़ोन', // needs-native-review
  'sync.server': 'सर्वर', // needs-native-review
  'sync.gap': 'अंतर', // needs-native-review
  'sync.st.synced': 'सिंक हुआ', // needs-native-review
  'sync.st.queued': 'कतार में', // needs-native-review
  'sync.st.gap': 'अंतर चिह्नित', // needs-native-review
  'sync.st.hash': 'फ़िंगरप्रिंट भेजा, फ़ोटो बाकी', // needs-native-review
  'sync.packet': 'सील किया पैकेट', // needs-native-review
  'sync.empty': 'अभी भेजने को कुछ नहीं।', // needs-native-review

  'reg.title': 'आपका खेत पंजीकृत है', // needs-native-review
  'reg.watching': 'सबूत आपके खेत पर बारिश, नदी और सैटेलाइट संकेतों पर नज़र रख रहा है।', // needs-native-review
  'reg.allClear': 'सब ठीक है', // needs-native-review
  'reg.watch': 'भारी बारिश की चेतावनी', // needs-native-review
  'reg.rain': 'पिछले 24 घंटे की बारिश: {mm} मिमी', // needs-native-review
  'reg.crop': 'फ़सल', // needs-native-review
  'reg.policy': 'रिकॉर्ड नं.', // needs-native-review
  'reg.policy.pmfby': 'पॉलिसी', // needs-native-review
  'reg.plot': 'खेत', // needs-native-review
  'reg.khasra': 'खसरा नं.', // needs-native-review
  'reg.season': 'मौसम', // needs-native-review
  'reg.kharif': 'ख़रीफ़ 2026', // needs-native-review
  'reg.voice': 'आपका खेत पंजीकृत है। अगर आपके खेत में बाढ़ आती है, तो सबूत आपको फ़ोन करेगा और तीन फ़ोटो माँगेगा।', // needs-native-review
  'reg.voice.pmfby': 'आपका खेत पंजीकृत है। अगर आपके खेत में बाढ़ आती है, तो सबूत आपको फ़ोन करेगा। फिर आपके पास रिपोर्ट करने के लिए 72 घंटे होंगे।', // needs-native-review
  'reg.listen': 'सुनें', // needs-native-review
  'crop.Paddy': 'धान', // needs-native-review
  'crop.Maize': 'मक्का', // needs-native-review
  'crop.Cotton': 'कपास', // needs-native-review
  'crop.Sugarcane': 'गन्ना', // needs-native-review
  'crop.Vegetables': 'सब्ज़ियाँ', // needs-native-review

  'al.title': 'आपके खेत में बाढ़ की आशंका', // needs-native-review
  'al.msg': 'आपके खेत के पास भारी बारिश या नदी का बढ़ता पानी देखा गया है। बाढ़ का पानी आने की आशंका है।', // needs-native-review
  'al.clock': 'इसके भीतर फ़ोटो लेना बेहतर', // needs-native-review
  'al.clock.pmfby': 'रिपोर्ट करने का बचा समय', // needs-native-review
  'al.started': 'घड़ी लगभग {time} पर शुरू हुई, जब भारी बारिश या नदी का बढ़ता पानी पहली बार दिखा। जब तक पानी दिख रहा है, फ़ोटो सबसे ज़्यादा काम की होती हैं। यह सलाह है, कानूनी समय-सीमा नहीं।', // needs-native-review
  'al.started.pmfby': '72 घंटे की घड़ी {time} पर शुरू हुई, जब घटना शुरू हुई — इस संदेश के मिलने पर नहीं।', // needs-native-review
  'al.voice': 'सबूत अलर्ट। आपके खेत में बाढ़ की आशंका है। कृपया जल्दी तीन फ़ोटो लें। यह सलाह है, समय-सीमा नहीं।', // needs-native-review
  'al.voice.pmfby': 'सबूत चेतावनी। आपके खेत में बाढ़ पाई गई है। रिपोर्ट करने की 72 घंटे की घड़ी शुरू हो गई है। “अभी फ़ोटो लें” दबाएँ और तीन फ़ोटो लें।', // needs-native-review
  'al.cta': 'अभी फ़ोटो लें', // needs-native-review
  'al.noDamage': 'मेरे खेत में नुकसान नहीं', // needs-native-review
  'al.help': 'कोई मेरी मदद करेगा', // needs-native-review
  'al.play': 'आवाज़ संदेश सुनें', // needs-native-review
  'al.expired': 'जल्दी फ़ोटो लेने की सलाह का समय बीत गया', // needs-native-review
  'al.expired.pmfby': 'रिपोर्ट का समय ख़त्म', // needs-native-review
  'al.expiredMsg': 'सुझाया गया फ़ोटो लेने का समय {time} पर खत्म हुआ। यह समय-सीमा नहीं है। आप अब भी फ़ोटो ले सकते हैं, और अधिकारी उन्हें देखेगा।', // needs-native-review
  'al.expiredMsg.pmfby': '72 घंटे का समय {time} पर ख़त्म हुआ। आप अब भी फ़ोटो सहेज सकते हैं और कृषि अधिकारी से बात कर सकते हैं।', // needs-native-review
  'al.reminder': 'याद दिलाना: सुझाए गए समय में लगभग {left} बचा है। फ़ोटो में 2 मिनट लगते हैं।', // needs-native-review
  'al.reminder.pmfby': 'याद दिलाना: {left} बचे हैं। फ़ोटो में 2 मिनट लगते हैं।', // needs-native-review
  'al.lastHours': 'जल्दी फ़ोटो लें', // needs-native-review
  'al.advice': 'सलाह, समय-सीमा नहीं', // needs-native-review
  'al.lastHours.pmfby': 'आख़िरी घंटे', // needs-native-review
  'al.noDamageDone': 'धन्यवाद। हमने दर्ज किया: कोई नुकसान नहीं। आपसे और कुछ नहीं चाहिए।', // needs-native-review
  'al.noDamageDone.pmfby': 'धन्यवाद। हमने दर्ज किया: कोई नुकसान नहीं। कोई दावा शुरू नहीं होगा।', // needs-native-review
  'al.undo': 'वापस लें', // needs-native-review
  'al.done': 'फ़ोटो ले ली गई हैं। अब अपना प्रमाण साझा करें।', // needs-native-review
  'al.done.pmfby': 'फ़ोटो ले ली गईं। अब अपने नुकसान की रिपोर्ट करें।', // needs-native-review
  'al.next': 'मेरा सबूत देखें', // needs-native-review

  'cap.title': '3 फ़ोटो लें', // needs-native-review
  'cap.step': 'फ़ोटो {n} / 3', // needs-native-review
  'shot.wide': 'पूरा खेत', // needs-native-review
  'shot.wide.d': 'किनारे पर खड़े हों। पूरा खेत और पानी दिखाएँ।', // needs-native-review
  'shot.close': 'ख़राब फ़सल, पास से', // needs-native-review
  'shot.close.d': 'पौधे और पानी की ऊँचाई दिखाएँ।', // needs-native-review
  'shot.landmark': 'पहचान चिह्न', // needs-native-review
  'shot.landmark.d': 'कोई स्थिर चीज़ दिखाएँ: पंप घर, पेड़ या मेड़ का पत्थर।', // needs-native-review
  'cap.open': 'कैमरा खोलें', // needs-native-review
  'cap.shutter': 'फ़ोटो लें', // needs-native-review
  'cap.sim': 'सिमुलेटेड फ़ोटो लें', // needs-native-review
  'cap.retake': 'फिर से लें', // needs-native-review
  'cap.done': 'मेरा सबूत सील करें', // needs-native-review
  'cap.locating': 'जगह ढूँढ रहे हैं…', // needs-native-review
  'cap.gps': 'GPS ±{acc} मी', // needs-native-review
  'cap.simGps': 'सिमुलेटेड जगह', // needs-native-review
  'cap.hashing': 'फ़ोटो सुरक्षित कर रहे हैं…', // needs-native-review
  'cap.old': 'यह फ़ोटो इस सत्र से पुरानी है। कृपया कैमरे से नई फ़ोटो लें।', // needs-native-review
  'cap.queued': 'फ़ोन में सहेजी गई। नेटवर्क आने पर भेजी जाएगी।', // needs-native-review
  'cap.sent': 'भेजी गई', // needs-native-review
  'cap.helper': 'सहायक ने ली: {name}', // needs-native-review
  'cap.taken': 'ली गई', // needs-native-review
  'sec.http': 'यह पेज सादे HTTP पर खुला है। यहाँ कैमरा, लोकेशन और साइनिंग बंद हैं। QR कोड वाला HTTPS लिंक खोलें। नकली फ़ोटो को फिर भी फ़िंगरप्रिंट मिलता है।', // needs-native-review

  'pk.title': 'आपका सबूत', // needs-native-review
  'pk.sealed': 'सील किया गया', // needs-native-review
  'pk.unsealed': 'अभी सील नहीं', // needs-native-review
  'pk.location': 'जगह', // needs-native-review
  'pk.hash': 'फ़िंगरप्रिंट', // needs-native-review
  'pk.chain': 'छेड़छाड़-रोधी रिकॉर्ड', // needs-native-review
  'pk.chainHelp': 'हर प्रविष्टि पिछली से जुड़ी है। कोई भी बदलाव कड़ी तोड़ देता है।', // needs-native-review
  'pk.queued': 'नेटवर्क का इंतज़ार: {n} कतार में', // needs-native-review
  'pk.synced': 'सर्वर को {time} पर मिला', // needs-native-review
  'pk.gap': 'फ़ोटो के समय और सर्वर के समय में {gap} का अंतर — जाँच के लिए चिह्नित।', // needs-native-review
  'pk.cta': 'आगे: अपना प्रमाण साझा करें', // needs-native-review
  'pk.cta.pmfby': 'अगला: नुकसान की रिपोर्ट करें', // needs-native-review
  'pk.empty': 'अभी कोई फ़ोटो नहीं।', // needs-native-review
  'pk.device': 'फ़ोन का समय', // needs-native-review
  'pk.server': 'सर्वर का समय', // needs-native-review
  'pk.syncNow': 'अभी भेजें', // needs-native-review
  'pk.prev': 'पिछला', // needs-native-review

  'k.title': 'जजों के लैपटॉप पर दिखाएँ', // needs-native-review
  'k.body': 'अपने सील किए पैकेट को हस्ताक्षरित कोड में बदलें। केवल फ़िंगरप्रिंट, समय और अनुमानित जगह साझा होती है; फ़ोटो इसी फ़ोन में रहती हैं।', // needs-native-review
  'k.btn': 'QR कोड से साझा करें', // needs-native-review
  'k.sheet': 'हस्ताक्षरित प्रमाण कोड', // needs-native-review
  'k.lead': 'यह QR कोड लैपटॉप के कैमरे को दिखाएँ, या कोड या लिंक कॉपी करें। कुछ भी किसी सर्वर पर नहीं भेजा जाता।', // needs-native-review
  'k.qr': 'आपके हस्ताक्षरित प्रमाण कोड वाला QR कोड', // needs-native-review
  'k.copyCode': 'कोड कॉपी करें', // needs-native-review
  'k.copyLink': 'लिंक कॉपी करें', // needs-native-review
  'k.bundle': 'सबूत बंडल निकालें (JSON)', // needs-native-review
  'k.bundleNote': 'खुला प्रारूप, जिसे दूसरे सिस्टम पढ़ सकें। यह किसी सिस्टम से जुड़ा हुआ नहीं है। फ़ोटो फ़ोन में ही रहती हैं।', // needs-native-review
  'k.share': 'लिंक साझा करें', // needs-native-review
  'k.copied': 'कॉपी हो गया', // needs-native-review
  'k.code': 'कोड', // needs-native-review
  'k.making': 'आपके पैकेट पर हस्ताक्षर हो रहे हैं…', // needs-native-review
  'k.stay': 'फ़ोटो इसी फ़ोन में रहती हैं। कोड में केवल उनके फ़िंगरप्रिंट हैं।', // needs-native-review
  'k.fail': 'कोड नहीं बन सका। जाँचें कि आपकी फ़ोटो सील हो गई हैं, फिर दोबारा कोशिश करें।', // needs-native-review
  'cap.camDenied': 'कैमरा बंद है या उपलब्ध नहीं है। अपनी ब्राउज़र सेटिंग में कैमरे की अनुमति दें और फिर कोशिश करें। आप सिमुलेटेड फ़ोटो भी ले सकते हैं; उस पर "सिमुलेटेड" लिखा होगा।', // needs-native-review
  'cap.saveFail': 'फ़ोटो इस फ़ोन में सहेजी नहीं जा सकी। थोड़ी जगह खाली करें और फिर कोशिश करें।', // needs-native-review
  'db.memory': 'यह फ़ोन आपकी फ़ोटो सहेज नहीं रहा है। भेजे जाने तक इस पेज को खुला रखें।', // needs-native-review
  'prov.live': 'लाइव', // needs-native-review
  'prov.replay': 'रीप्ले', // needs-native-review
  'prov.sim': 'सिमुलेटेड', // needs-native-review
  'prov.hand': 'हाथ से दर्ज', // needs-native-review
  'prov.by': '{who} द्वारा', // needs-native-review
  'prov.none': 'स्रोत दर्ज नहीं', // needs-native-review
  'fl.title': 'अपना प्रमाण साझा करें', // needs-native-review
  'fl.title.pmfby': 'नुकसान की रिपोर्ट करें', // needs-native-review
  'fl.intro': 'सबूत कुछ भी जमा नहीं करता। अपने गाँव का आकलन करने वाले अधिकारी को अपना सील किया हुआ प्रमाण दिखाएँ। आपका ब्योरा तैयार है।', // needs-native-review
  'fl.intro.pmfby': 'सबूत आपकी ओर से दावा दर्ज नहीं करता। आधिकारिक माध्यम से रिपोर्ट करें। आपकी जानकारी तैयार है।', // needs-native-review
  'fl.summary': 'आपकी जानकारी', // needs-native-review
  'fl.copy': 'जानकारी कॉपी करें', // needs-native-review
  'fl.copied': 'कॉपी हो गया', // needs-native-review
  'fl.copyFail': 'कॉपी नहीं हो सका। कृपया जानकारी पढ़कर सुनाएँ।', // needs-native-review
  'fl.steps': 'रिपोर्ट कैसे करें', // needs-native-review
  'fl.s1': 'अपने गाँव का आकलन करने वाले अधिकारी को बताएँ कि आपके पास बाढ़ की सील की हुई फ़ोटो हैं।', // needs-native-review
  'fl.s1.pmfby': 'फ़सल बीमा हेल्पलाइन पर फ़ोन करें, या आधिकारिक फ़सल बीमा ऐप खोलें।', // needs-native-review
  'fl.s2': 'अपना खेत नंबर बताएँ और इस स्क्रीन का ब्योरा दिखाएँ।', // needs-native-review
  'fl.s2.pmfby': 'कहें: बाढ़ से फ़सल का नुकसान। अपना पॉलिसी नंबर और खेत नंबर बताएँ।', // needs-native-review
  'fl.s3': 'पूछे जाने पर अपने सबूत का फ़िंगरप्रिंट पढ़कर सुनाएँ।', // needs-native-review
  'fl.s4': 'आपको जो भी रसीद या प्रविष्टि नंबर मिले, उसे लिख लें।', // needs-native-review
  'fl.s4.pmfby': 'वे जो संदर्भ संख्या दें, उसे लिख लें।', // needs-native-review
  'fl.ref': 'रसीद या प्रविष्टि नंबर', // needs-native-review
  'fl.ref.pmfby': 'संदर्भ संख्या', // needs-native-review
  'fl.refHelp': 'अक्षर और अंक, जैसे आपको दिए गए।', // needs-native-review
  'fl.save': 'रसीद नंबर सहेजें', // needs-native-review
  'fl.save.pmfby': 'संदर्भ संख्या सहेजें', // needs-native-review
  'fl.saved': 'सहेजा गया: {ref}', // needs-native-review
  'fl.bad': 'कम से कम 4 अक्षर या अंक लिखें।', // needs-native-review
  'fl.cause': 'कारण', // needs-native-review
  'fl.flood': 'बाढ़ / जलभराव', // needs-native-review
  'fl.deadline': 'बेहतर होगा इससे पहले (सलाह)', // needs-native-review
  'fl.deadline.pmfby': 'इससे पहले रिपोर्ट करें', // needs-native-review
  'fl.farmer': 'किसान', // needs-native-review
  'fl.event': 'घटना शुरू हुई', // needs-native-review

  'st.title': 'दावे की स्थिति', // needs-native-review
  'st.note': 'सबूत नज़र रखता है। फ़ैसला अधिकारी करता है।', // needs-native-review
  'st.note.pmfby': 'सबूत नज़र रखता है। फ़ैसला बीमा कंपनी करती है।', // needs-native-review
  'st.detected': 'घटना पहचानी गई', // needs-native-review
  'st.alerted': 'चेतावनी मिली', // needs-native-review
  'st.captured': 'फ़ोटो ली गईं', // needs-native-review
  'st.synced': 'सबूत मिला', // needs-native-review
  'st.filed': 'अधिकारी को दिखाया', // needs-native-review
  'st.filed.pmfby': 'नुकसान की रिपोर्ट हुई', // needs-native-review
  'st.ack': 'अधिकारी ने पुष्टि की', // needs-native-review
  'st.ack.pmfby': 'बीमा कंपनी ने पुष्टि की', // needs-native-review
  'st.survey': 'खेत का दौरा', // needs-native-review
  'st.survey.pmfby': 'खेत का निरीक्षण', // needs-native-review
  'st.decision': 'अधिकारी का फ़ैसला', // needs-native-review
  'st.decision.pmfby': 'बीमा कंपनी का फ़ैसला', // needs-native-review
  'st.due': 'बेहतर होगा {time} तक', // needs-native-review
  'st.due.pmfby': '{time} तक', // needs-native-review
  'st.waiting': 'इंतज़ार', // needs-native-review
  'st.overdue': 'देर हो गई', // needs-native-review
  'st.reminders': 'याद दिलाना और शिकायत', // needs-native-review
  'st.rCapture': 'याद दिलाने वाला फ़ोन: फ़ोटो अभी नहीं ली गईं', // needs-native-review
  'st.rRef': 'याद दिलाना: अपना रसीद नंबर सहेजें', // needs-native-review
  'st.rRef.pmfby': 'याद दिलाना: अपनी संदर्भ संख्या सहेजें', // needs-native-review
  'st.rAck': 'अधिकारी को याद दिलाया: पुष्टि बाकी है', // needs-native-review
  'st.rAck.pmfby': 'बीमा कंपनी को याद दिलाया: पुष्टि बाकी है', // needs-native-review
  'st.escalated': 'ज़िला कार्यालय को भेजा गया', // needs-native-review
  'st.escalated.pmfby': 'ज़िला कृषि कार्यालय को भेजा गया', // needs-native-review
  'st.none': 'अभी याद दिलाने की ज़रूरत नहीं।', // needs-native-review
  'st.decisionNote': 'सबूत कभी फ़ैसला नहीं करता। अधिकारी करता है।', // needs-native-review
  'st.decisionNote.pmfby': 'सबूत कभी दावों का फ़ैसला नहीं करता।', // needs-native-review
  'st.surveyAt': '{time} को तय', // needs-native-review
  'ob.title': 'अधिकारी की मसौदा सूची', // needs-native-review
  'ob.soon': 'आगे चलकर अधिकारी एक मसौदा सूची जारी करेंगे। यह सिमुलेशन है: लगभग {time}। अगर आपकी प्रविष्टि ग़लत लगे, तो {until} तक अपना सील किया हुआ सबूत जोड़ सकते हैं।', // needs-native-review
  'ob.open': 'अधिकारी की मसौदा सूची आ गई है (सिमुलेटेड)। अगर आपकी प्रविष्टि ग़लत लगे, तो अपना सील किया हुआ सबूत जोड़ें। यह {until} तक खुला है।', // needs-native-review
  'ob.attach': 'मेरा सील किया हुआ सबूत जोड़ें', // needs-native-review
  'ob.needSeal': 'पहले अपनी फ़ोटो लें और उन्हें सील करें। फिर यहाँ जोड़ सकते हैं।', // needs-native-review
  'ob.filed': 'आपका सील किया हुआ सबूत आपकी प्रविष्टि से जुड़ गया ({time})। फ़ैसला अधिकारी करता है, Saboot के बाहर।', // needs-native-review
  'ob.answered': 'अधिकारी ने जवाब दिया ({time}), Saboot के बाहर। Saboot सिर्फ़ इतना दिखाता है कि जवाब आया।', // needs-native-review
  'ob.closed': 'सबूत जोड़ने का समय खत्म हो गया (सिमुलेटेड)।', // needs-native-review

  'as.title': 'फ़ोटो लेने में मदद लें', // needs-native-review
  'as.intro': 'परिवार का कोई सदस्य या गाँव का स्वयंसेवक आपकी अनुमति से फ़ोटो ले सकता है।', // needs-native-review
  'as.name': 'सहायक का नाम', // needs-native-review
  'as.role': 'सहायक कौन है', // needs-native-review
  'as.family': 'परिवार का सदस्य', // needs-native-review
  'as.volunteer': 'गाँव का स्वयंसेवक', // needs-native-review
  'as.bank': 'बैंक या दफ़्तर का कर्मचारी', // needs-native-review
  'as.consent': 'किसान की सहमति', // needs-native-review
  'as.consentText': 'मैं, {farmer}, {helper} को अपने खेत की फ़ोटो लेने और उन्हें मेरी फ़सल नुकसान रिपोर्ट के लिए भेजने की अनुमति देता/देती हूँ।', // needs-native-review
  'as.hold': 'सहमति के लिए दबाकर रखें', // needs-native-review
  'as.holding': 'दबाए रखें…', // needs-native-review
  'as.record': 'बोलकर सहमति रिकॉर्ड करें', // needs-native-review
  'as.recording': 'रिकॉर्डिंग… रोकने के लिए दबाएँ', // needs-native-review
  'as.done': 'सहमति {time} पर दर्ज हुई', // needs-native-review
  'as.start': 'फ़ोटो शुरू करें', // needs-native-review
  'as.needName': 'पहले सहायक का नाम लिखें।', // needs-native-review
  'as.voiceSha': 'आवाज़ से सहमति · फ़िंगरप्रिंट {h}', // needs-native-review
  'as.holdMethod': 'दबाकर रखने से सहमति दी गई', // needs-native-review
  'as.noMic': 'माइक्रोफ़ोन उपलब्ध नहीं। दबाकर रखने वाला तरीका अपनाएँ।', // needs-native-review
  'as.means': 'इसका मतलब', // needs-native-review
  'as.means1': 'फ़ोटो इसी फ़ोन में रहती हैं। सिर्फ़ उनकी पहचान-छाप, समय और लगभग 100 मीटर तक गोल की हुई जगह साझा की जा सकती है।', // needs-native-review
  'as.means2': 'सहायक सिर्फ़ फ़ोटो लेता है। फ़ैसला अधिकारी करता है। सबूत कोई फ़ैसला नहीं करता।', // needs-native-review
  'as.means2.pmfby': 'सहायक सिर्फ़ फ़ोटो लेता है। फ़ैसला बीमा कंपनी करती है। सबूत कोई फ़ैसला नहीं करता।', // needs-native-review
  'as.means3': 'आप कभी भी अपनी कॉपी माँग सकते हैं, या इस फ़ोन से सब कुछ मिटवा सकते हैं।', // needs-native-review
  'hm.consentTitle': 'किसान {farmer} की सहमति', // needs-native-review
  'hm.consentIntro': '{farmer} को यह पढ़कर सुनाइए। {farmer} बटन को दबाकर रखकर, या बोलकर सहमति देते हैं। इसके बिना कुछ भी दर्ज नहीं होता।', // needs-native-review
  'hm.title': 'सहायक मोड', // needs-native-review
  'hm.sub': 'कई किसानों के लिए फ़ोटो लें', // needs-native-review
  'hm.intro': 'सरपंच, सीएससी संचालक, सहकारी समिति या विस्तार कार्यकर्ता के लिए। इसी फ़ोन से कई किसानों के लिए फ़ोटो लें। हर किसान अपनी सहमति देता है और हर किसान का सबूत अलग सील होता है।', // needs-native-review
  'hm.name': 'आपका नाम', // needs-native-review
  'hm.role': 'आप हैं', // needs-native-review
  'hm.needName': 'शुरू करने के लिए अपना नाम लिखें।', // needs-native-review
  'hm.start': 'सहायक सत्र शुरू करें', // needs-native-review
  'hm.session': 'सहायक: {name}, {role}', // needs-native-review
  'hm.progress': '{n} में से {done} किसानों का काम पूरा', // needs-native-review
  'hm.queue': 'आपकी सूची के किसान', // needs-native-review
  'hm.speaks': 'भाषा: {lang}', // needs-native-review
  'hm.by': '{name}, {role} ने फ़ोटो लीं', // needs-native-review
  'hm.s.noalert': 'अभी चेतावनी नहीं', // needs-native-review
  'hm.s.consent': 'सहमति का इंतज़ार', // needs-native-review
  'hm.s.ready': 'सहमति दर्ज', // needs-native-review
  'hm.s.photos': 'फ़ोटो {n} / 3', // needs-native-review
  'hm.s.sealed': 'सबूत सील हुआ', // needs-native-review
  'hm.s.nodamage': 'किसान ने बताया: कोई नुकसान नहीं', // needs-native-review
  'hm.wait': 'इस खेत की चेतावनी रीप्ले में आगे आएगी।', // needs-native-review
  'hm.a.start': 'शुरू करें', // needs-native-review
  'hm.a.continue': 'जारी रखें', // needs-native-review
  'hm.a.view': 'देखें', // needs-native-review
  'hm.note': 'हर किसान की सहमति और फ़ोटो उसी किसान के अपने लॉग में सील होती हैं, हर फ़ोटो पर आपका नाम रहता है। आप सिर्फ़ फ़ोटो लेते हैं। सबूत कोई फ़ैसला नहीं करता।', // needs-native-review
  'hm.phoneBtn': 'बिना स्मार्टफ़ोन वाला किसान (डिज़ाइन सिमुलेशन)', // needs-native-review
  'hm.end': 'सहायक सत्र खत्म करें', // needs-native-review
  'hm.r.sarpanch': 'सरपंच', // needs-native-review
  'hm.r.csc': 'सीएससी संचालक', // needs-native-review
  'hm.r.coop': 'सहकारी समिति कार्यकर्ता', // needs-native-review
  'hm.r.ext': 'विस्तार कार्यकर्ता', // needs-native-review
  'hm.bar': '{farmer} ({plot}) के लिए फ़ोटो ले रहे हैं', // needs-native-review
  'hm.back': 'सूची पर वापस', // needs-native-review
  'hm.card.title': 'दूसरे किसानों की मदद कर रहे हैं?', // needs-native-review
  'hm.card.body': 'सरपंच, सीएससी संचालक, सहकारी समिति या विस्तार कार्यकर्ता: इसी फ़ोन से कई किसानों के लिए फ़ोटो लें। हर किसान अपनी सहमति देता है।', // needs-native-review
  'hm.card.btn': 'सहायक मोड खोलें', // needs-native-review
  'hm.noDamage': 'किसान ने बताया: कोई नुकसान नहीं', // needs-native-review
  'hm.next': 'अगला किसान', // needs-native-review
  'pk.by': 'फ़ोटो किसने लीं', // needs-native-review
  'pk.byValue': '{name}, {role}', // needs-native-review
  'fp.title': 'बिना स्मार्टफ़ोन वाला किसान', // needs-native-review
  'fp.badge': 'डिज़ाइन सिमुलेशन', // needs-native-review
  'fp.note': 'यहाँ कोई असली फ़ोन कॉल नहीं होती और कोई एसएमएस या व्हाट्सऐप संदेश नहीं जाता। यह सिर्फ़ दिखाता है कि प्रक्रिया कैसे चलेगी, और रीप्ले में कुछ नहीं बदलता।', // needs-native-review
  'fp.stepsLabel': 'कॉल के चरण', // needs-native-review
  'fp.s1': 'मिस्ड कॉल', // needs-native-review
  'fp.s2': 'सबूत वापस कॉल करता है', // needs-native-review
  'fp.s3': 'कीपैड से जवाब', // needs-native-review
  'fp.s4': 'सहायक फ़ोटो लेता है', // needs-native-review
  'fp.s1.b': 'किसान गाँव की सूचना-पट्टी पर लिखे नंबर पर मिस्ड कॉल देता है। डिज़ाइन में सबूत वापस कॉल करके चेतावनी बोलकर सुनाता है।', // needs-native-review
  'fp.call': 'मिस्ड कॉल दें', // needs-native-review
  'fp.incoming': 'सबूत की कॉल', // needs-native-review
  'fp.press': 'सुनिए, फिर 1 या 2 दबाइए।', // needs-native-review
  'fp.k1': 'आपने 1 दबाया: नुकसान।', // needs-native-review
  'fp.k2': 'आपने 2 दबाया: कोई नुकसान नहीं।', // needs-native-review
  'fp.kother': 'नुकसान के लिए 1 या कोई नुकसान नहीं के लिए 2 दबाइए।', // needs-native-review
  'fp.prompt': 'नमस्ते। यह सबूत है। आपके खेत के पास भारी बारिश या नदी का बढ़ता पानी पाया गया है। अगर खेत में पानी से नुकसान है तो 1 दबाइए। अगर नुकसान नहीं है तो 2 दबाइए।', // needs-native-review
  'fp.play': 'कॉल सुनें', // needs-native-review
  'fp.keypad': 'फ़ोन का कीपैड', // needs-native-review
  'fp.key1': 'नुकसान', // needs-native-review
  'fp.key2': 'कोई नुकसान नहीं', // needs-native-review
  'fp.out1': 'सबूत आपके पास के किसी सहायक से कहता है कि वह आकर आपके लिए फ़ोटो ले। इस कॉल से कोई रिपोर्ट दर्ज नहीं होती।', // needs-native-review
  'fp.out2': 'सबूत इस खेत के लिए “कोई नुकसान नहीं” दर्ज करता है और कुछ शुरू नहीं करता।', // needs-native-review
  'fp.logHead': 'सबूत क्या दर्ज करेगा', // needs-native-review
  'fp.helper': 'सहायक स्मार्टफ़ोन लेकर आता है, किसान के साथ सहमति बोलकर पढ़ता है, तीन फ़ोटो लेता है और पैकेट सील करता है। पैकेट में सहायक का नाम और किसान की सहमति दर्ज रहती है।', // needs-native-review
  'fp.open': 'सहायक मोड खोलें', // needs-native-review
  'fp.again': 'फिर से शुरू करें', // needs-native-review
  'f.rewound': 'रीप्ले आपकी आख़िरी कार्रवाई तक आगे बढ़ गया, इसलिए आपका किया हुआ कुछ भी नहीं खोया।', // needs-native-review
  'f.ok': 'ठीक है', // needs-native-review
  'set.title': 'सेटिंग्स', // needs-native-review
  'set.lang': 'भाषा', // needs-native-review
  'set.text': 'अक्षरों का आकार', // needs-native-review
  'set.t100': 'सामान्य', // needs-native-review
  'set.t125': 'बड़ा (+25%)', // needs-native-review
  'set.t150': 'और बड़ा (+50%)', // needs-native-review
  'set.voice': 'आवाज़ मोड', // needs-native-review
  'set.voiceHelp': 'हर स्क्रीन पढ़कर सुनाता है।', // needs-native-review
  'set.lowData': 'कम डेटा मोड', // needs-native-review
  'set.lowDataHelp': 'ग़ैर-ज़रूरी नक्शे और तस्वीरें छिपाता है।', // needs-native-review
  'set.contrast': 'हाई कंट्रास्ट', // needs-native-review
  'set.close': 'बंद करें', // needs-native-review
  'set.data': 'इस फ़ोन पर आपका डेटा', // needs-native-review
  'set.dataHelp': 'फ़ोटो, सहमति और सील किए गए पैकेट सिर्फ़ इसी फ़ोन में रहते हैं। कुछ भी अपलोड नहीं होता। आप इनकी कॉपी ले सकते हैं या सब मिटा सकते हैं।', // needs-native-review
  'set.export': 'मेरा डेटा निकालें (JSON)', // needs-native-review
  'set.delete': 'इस फ़ोन से मेरा डेटा मिटाएँ', // needs-native-review
  'set.deleteAsk': 'इस फ़ोन की फ़ोटो, सहमति और सील किए गए पैकेट मिटाएँ? इसे वापस नहीं किया जा सकता।', // needs-native-review
  'set.deleteYes': 'हाँ, मिटाएँ', // needs-native-review
  'set.deleteNo': 'मेरा डेटा रहने दें', // needs-native-review
  'set.deleted': 'आपका डेटा इस फ़ोन से मिटा दिया गया।', // needs-native-review
};
export default hi;
