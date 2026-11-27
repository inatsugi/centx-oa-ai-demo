'use strict';

// Deterministic, local dialogue for the three journeys shown in the demo.
window.CentxConversation = (() => {
  const labels = {
    outing:'午後の行き先', 'outing/castle':'犬山城と城下町', 'outing/sakae-plan':'栄での過ごし方',
    'outing/city':'SRTと展望台', 'outing/tower':'展望台のみ', 'outing/walk':'栄で街歩き',
    'outing/park':'長久手の公園', 'outing/with-company':'同行者とのおでかけ', airport:'空港への行き方', 'airport/sakae':'伏見・栄から空港バス',
    'airport/kanayama':'金山から電車', 'airport/nagoya':'名鉄名古屋から電車',
    commute:'通う予定', 'commute/work':'研修の往復回数', 'commute/school':'通学の条件',
    'commute/school/train':'名鉄電車で高校へ', 'commute/school/bus':'らんらんバスで高校へ',
    'commute/school/child':'小学生のらんらんバス'
  };
  function label(route) {
    const [, key, detail] = route.split('/');
    if (key === 'confirm') return '条件の確認';
    if (key === 'work' && detail) return detail + '往復';
    if (detail === 'seat') return labels[route.slice(0, -5)] + '・座席指定';
    return labels[route] || '';
  }

  const numerals = '〇一二三四五六七八九';
  function normalize(value) {
    return value.normalize('NFKC').toLowerCase().replace(/\s+/g, '').replace(/[。、,.!?！？\n]/g, '、')
      .replace(/[〇零一二三四五六七八九十百]+(?=ヶ?か?月|歳|才|人|往復|回|日|週間)/g, digits => {
        if (digits.includes('百')) return '100';
        const parts = digits.replace(/零/g,'〇').split('十');
        if (parts.length === 2) return String((parts[0] ? numerals.indexOf(parts[0]) : 1) * 10 + (parts[1] ? numerals.indexOf(parts[1]) : 0));
        return [...digits].map(n => numerals.indexOf(n)).join('');
      });
  }

  // Negation belongs to the nearby object. Stop before another destination or mode.
  const topic = /犬山城|お城|城下町|タワー|展望(?:台)?|srt|徒歩|公園|金山|名古屋|栄|伏見|電車|鉄道|リニモ|バス|中部国際空港|セントレア|研修|定期券|小学生|高校|名鉄|らんらん|、/;
  const negative = /ではな(?:い|く|し)|じゃな(?:い|く|し)|でなく|はなく|じゃなくて|以外|を除[きく]|[はをにで]?なし|[はをにで]?無し|抜き|不要|やめ|やっぱやめ|行か(?:ず|な)|いか(?:ず|な)|行きません|行きたく(?:は)?な|使(?:わ(?:な|ず)|いません|いたく(?:は)?な)|利用し(?:な|ません|たくな)|乗(?:ら(?:な|ず)|りません|りたく(?:は)?な)|入(?:ら(?:な|ず)|りません|りたく(?:は)?な)|(?:上が|上|登|昇|のぼ)(?:ら(?:な|ず)|り(?:ません|たく(?:は)?な))|するつもり(?:は|が)?な|避け|外し|いやだ|いらな|要らな|寄ら(?:な|ず)|嫌/;
  function preference(text, expression) {
    let status = 0;
    for (const match of text.matchAll(new RegExp(expression.source, 'g'))) {
      const rest = text.slice(match.index + match[0].length);
      const end = rest.search(topic);
      const clause = rest.slice(0, end >= 0 ? Math.min(20, end) : 20);
      status = negative.test(clause) ? -1 : 1;
    }
    return status;
  }
  function exclusions(text) {
    // An unsupported place attached to a familiar station or activity must not select its ticket.
    return /経由|途中下車|別(?:の|な)?(?:区間|駅|路線|空港)|他の(?:区間|駅|路線|空港)|区間外|岐阜|豊橋|豊川|東京|横浜|大阪|京都|博多|熱田|神宮前|新鵜沼|小牧|刈谷|岡崎|常滑|太田川|豊田|津島|新安城|大須|白川公園|鶴舞|東山|ジブリ|成田|羽田|関西空港|県営名古屋|名古屋空港|小田井|知多半田|河和|新可児|名城公園|名古屋城/.test(text);
  }
  function groupOrChild(text) {
    const scope = text.replace(/(?:子供|子ども|こども|子連れ|小児)(?:は|が|も)?(?:いな(?:い|く)|なし|無し|同行しない|連れではない)/g, '')
      .replace(/(?:元は|最初は)?(?:子供|子ども|こども|小児)(?:料金|運賃)?(?:じゃなく(?:て)?|で(?:は)?なく(?:て)?)(?=大人)/g, '');
    return /子ども|子供|こども|児童|小児|幼児|乳児|小学生|中学生|高校生|学生料金|学生運賃|学割|子連れ|親子|家族|家内と|息子|娘|夫婦|友だちと|友達と|友人と|二人|ふたり|みんなで|グループ|団体|(?:[2-9]|\d{2,})人/.test(scope)
      || [...scope.matchAll(/(\d+)(?:歳|才)/g)].some(m=>Number(m[1])<18);
  }
  function hasPass(text) {
    const scope = text.replace(/(?:定期(?:券)?|パス)(?:[はをがもの]|もう|まだ)*(?:持って(?:い)?な(?:い|く)|持って(?:い)?ません|持たず|ありません|ない|無し|なし|使わない|買わない|期限切れ|切れた)/g, '')
      .replace(/(?:定期(?:券)?|パス)(?:を)?持たない/g,'');
    return /定期(?:券)?|フリー(?:パス|きっぷ)|乗り放題|割引券|回数券(?:が|を)?(?:ある|持|所持)|障(?:害|がい)者割引/.test(scope);
  }
  const baggage = /荷物|大荷物|スーツケース|キャリー(?:バッグ|ケース)|トランク|手ぶら/;
  const airportWords = /空港|セントレア|飛行機|フライト|centrair/;
  const outingTime = /今日|このあと|この後|午後|半日|空き時間|空いた時間/;
  const outingPlan = /近場|近く|遊び|遊ぶ|あそび|出かけ|おでかけ|観光|街歩き|散歩|散策|どこ|どちら|過ご|暇|ひま|行き先|行こう/;
  const workTrip = /研修|出張|通勤|出社|仕事|会議|勤務|往復|往く|通う回数|通い(?:たい|ます)|会社に通/;
  const schoolWords = /通学|学校|高校|小学生|らんらんバス/;
  const destinations = /犬山|城下町|お城|展望台|タワー|公園|街歩き|散策|srt|リニモ/;
  const endOfAirportTalk = /(?:帰り|空港|行き方|行きの予定|移動)[^、]{0,15}(?:わかった|分かった|わかりまし|了解|大丈夫|ok|オーケー|解決|決まった|決まり|ありがとう)/;

  function airportToOuting(text, scene) {
    if (scene !== 'airport' || !outingTime.test(text)) return false;
    const split = text.match(endOfAirportTalk);
    const next = split ? text.slice(split.index + split[0].length) : text;
    return (outingPlan.test(next) || destinations.test(next) || (split && /午後|半日/.test(next)))
      && !airportWords.test(next) && !/出かけ(?:ず|ない)|おでかけ(?:せず|しない)/.test(next);
  }
  function namedScene(text, current) {
    if (airportToOuting(text,current)) return 'outing';
    if (airportWords.test(text)) return 'airport';
    if (current === 'commute' && /料金|運賃|何歳|定期|区間|増|減|減ら|足す|少な|多く|もう[0-9]/.test(text) && !destinations.test(text)) return 'commute';
    if (schoolWords.test(text) && (!current || current === 'commute' || /通学|学校[へに]|高校[にへ]通/.test(text))) return 'commute';
    if (workTrip.test(text) && (!/犬山|お城|公園|リニモ|展望|タワー/.test(text) || /研修|通勤/.test(text)) && current !== 'outing' && current !== 'airport') return 'commute';
    if ((childDescription(text) || mobility.test(text)) && /食事|ランチ|お昼|昼食|昼ごはん|おでかけ|散歩|遊び|観光/.test(text)) return 'outing';
    if (destinations.test(text) || (outingTime.test(text) && outingPlan.test(text)) || /(?:名古屋|名駅)から半日/.test(text)) return 'outing';
    return ['outing','airport','commute'].includes(current) ? current : 'home';
  }
  const fromParticle = /から(?:の|は)?|発(?:で|の|です|に|。|、|$)/g;
  const toParticle = /まで|[へに](?=行[きくこけ]|向か|通|戻|帰|移動|変更)|へ(?=、|$)|着(?:です|で|に|、|$)/g;
  const nonLocation = /場合|とき|時|今|明日|今日|昨日|先日|ここ|これ|それ|どこ|そこ|(?:行く|乗る|多い|重い|断っ?た|泊まる|使う|る|ない|です|ました|なので|だから)|[0-9](?:往復|回|日|人|時|月)|(?:[0-9]|[0-9]時)(?:半|分)|研修|学校|仕事|高校|[0-9]日間|半日|座席指定|気軽|ひとり|1人|近く|近場|遠く|ところ|周辺|乗り場|どちら|いま|朝|駅前のホテル/;
  function foreignEndpoint(text, marker, allowed) {
    for (const match of text.matchAll(marker)) {
      let left = text.slice(0, match.index).split(/[、/]/).at(-1);
      if (!left) continue;
      if (allowed.test(left)) continue;
      // The preceding inflection can be temporal or causal ("荷物が多いから").
      if (new RegExp('(?:' + nonLocation.source + ')$').test(left)) continue;
      if (/[ぁ-んァ-ヶ一-龯a-z0-9]$/.test(left)) return true;
    }
    return false;
  }
  const airportOrigin = /(?:伏見|栄|金山|(?:名鉄)?名古屋|名駅)(?:駅|駅前|エリア)?(?:にある|の|付近の|近くの|周辺の)?(?:ホテル|宿泊先|宿|停留所|バス停)?$/;
  const airportDestination = /(?:中部国際空港|中部空港|セントレア|空港)(?:駅)?$/;
  const workOrigin = /(?:名鉄|尾張)?一宮(?:駅)?$/;
  const outingOrigin = /(?:名古屋|名駅|栄|藤が丘)(?:駅)?$/;
  const outingDestination = /(?:お城|犬山(?:城|駅)?|城下町|展望(?:台)?|タワー|tower|展望フロア|栄|市内|街中|公園(?:駅)?|長久手|藤が丘|地上|名駅|名古屋|近場|近く|どこか|お出かけ|遊び)(?:だけ|のみ|の予定|周辺)?$/;
  const privateTransport = /(?<!電|列|汽|特別)車(?:で|に乗|を使|を利用)|自動車|レンタカー|マイカー|自転車|タクシー/;
  const ticketException = /割引|割り引|無料|手帳|優待|クーポン|購入済|入場券(?:は|が|を)?(?:すでに|既に|もう)?(?:ある|あり|持|購入)|(?:きっぷ|切符|乗車券|チケット)(?:は|が|を)(?:すでに|既に|もう)(?:ある|あり|持|買)|(?:きっぷ|切符|乗車券|チケット)(?:は|を)?(?:いらな|買わない|不要)/;
  function otherPark(text) {
    for (const {index} of text.matchAll(/(?:にある|の)公園/g)) {
      if (!/(?:長久手|久屋大通|栄|近く|近所|近場|どこか|街中|市内|沿線|駅前|駅近く|愛・地球博記念公園)(?:市)?$/.test(text.slice(0,index))) return true;
    }
    return /市内の公園|名古屋の公園/.test(text) || /[一-龯々ァ-ヶ]{2,}公園/.test(text.replace(/愛[・･]?地球博記念公園|モリコロパーク|久屋大通公園/g,''));
  }
  const mobility = /祖母|祖父|おばあ|おじい|高齢|長く(?:は)?歩け|あまり歩け|足が(?:悪|痛)|歩く(?:の|距離)(?:が|は)(?:苦手|心配|つら)|歩行|車いす|車椅子|ベビーカー|段差|階段を避け/;
  const familyPlaces = {inuyama:'犬山',sakae:'栄',park:'長久手'};
  function companyTurn(text,previous,key) {
    const areaFromRoute = {castle:'inuyama',city:'sakae','sakae-plan':'sakae',tower:'sakae',walk:'sakae',park:'park'};
    const company = {place:areaFromRoute[key] || '',child:false,elder:false,age:null,people:null,meal:false,rain:false,access:false,walkMinutes:null,day:'',halfDay:false,...previous};
    const oldPlace = company.place;
    const inuyama = preference(text,/犬山(?:城)?|城下町/);
    const sakae = preference(text,/栄|久屋大通|タワー/);
    const park = preference(text,/長久手|愛[・･]?地球博記念公園|モリコロパーク/);
    const namedPlaces = [...text.matchAll(/犬山(?:城)?|城下町|栄|久屋大通|タワー|長久手|愛[・･]?地球博記念公園|モリコロパーク/g)]
      .map(match=>/犬山|城下町/.test(match[0])?'inuyama':/栄|久屋大通|タワー/.test(match[0])?'sakae':'park')
      .filter(place=>({inuyama,sakae,park})[place]>0);
    const mentionsPlace = namedPlaces.length > 0;
    if (mentionsPlace) company.place = namedPlaces.at(-1);
    if (!mentionsPlace && /近場に変更|やっぱり近場|近場がいい/.test(text)) company.place = 'sakae';
    if (childDescription(text)) company.child = true;
    if (/祖母|祖父|おばあ|おじい|高齢/.test(text)) company.elder = true;
    if (/長く(?:は)?歩け|あまり歩け|歩く距離|足が(?:悪|痛)|車いす|車椅子|ベビーカー|階段|段差|歩行/.test(text)) company.access = true;
    const age = [...text.matchAll(/(\d{1,3})(?:歳|才)/g)].find(m=>Number(m[1])<18);
    if (age) { company.child = true; company.age = Number(age[1]); }
    const grade = text.match(/小学(?:校)?(?:生|([1-6一二三四五六])年生?)/);
    if (grade) { company.child = true; company.grade = grade[0]; }
    const counts = [...text.matchAll(/(?:大人|おとな|子ども|子供|こども|小学生)(?:が|は)?(\d{1,2})人/g)];
    const people = text.match(/(?:全員で|合わせて|合計|全部で|みんなで)(\d{1,2})人/);
    if (people) company.people = Number(people[1]);
    else if (counts.length > 1) company.people = counts.reduce((sum,m)=>sum+Number(m[1]),0);
    else if (!counts.length && /\d{1,2}人/.test(text)) company.people = Number(text.match(/(\d{1,2})人/)[1]);
    const minutes = text.match(/(\d{1,3})分(?:くらい|程度|ぐらい|ほど|以内|まで|なら|しか|以下|は|歩)/);
    if (minutes) { company.walkMinutes = Number(minutes[1]); company.access = true; }
    if (/明日|あした/.test(text)) company.day = '明日';
    else if (/今日|きょう/.test(text)) company.day = '今日';
    if (/半日|午後/.test(text)) company.halfDay = true;
    const food = preference(text,/ランチ|昼ご[は飯]|お昼(?:ごはん)?|昼食|食事|食べ歩き|ごはん|ご飯|食べたい|カフェ/);
    if (food) company.meal = food > 0;
    const rain = /雨|ぬれたくな|濡れたくな|屋内|室内/.test(text);
    if (rain) company.rain = !/雨(?:は|が)?(?:降らな|気にしな)|晴れ(?:だったら|なら)/.test(text);
    const place = familyPlaces[company.place] || '';
    const at = place ? place+'で' : '';
    const group = company.child && company.elder ? 'お子さま、お祖父母さまとの' : company.child ? 'お子さまとの' : company.elder ? 'ご家族との' : 'ご一緒の方との';
    const member = company.age !== null ? company.age+'歳のお子さま' : company.grade || 'お子さま';
    if (previous && oldPlace !== company.place && place) {
      const kept = company.meal ? '昼食をとれる場所' : company.access ? '歩く区間' : '立ち寄り先';
      return {company,change:(familyPlaces[oldPlace] || '行き先未定')+' → '+place,
        reply:place==='栄' && company.meal ? '栄に変更しました。'+(company.rain?'雨の場合の昼食には、':'昼食には、')+'オアシス21のレストランやカフェが候補です。' : '行き先を'+place+'に変更して、'+group+'おでかけで'+kept+'を確認しましょう。'};
    }
    if (food > 0) {
      const local = {inuyama:'犬山城下町の町家の和食店やカフェ',sakae:'栄のオアシス21の飲食店やMIRAI TOWER 3階のカフェ',park:'愛・地球博記念公園の飲食施設'}[company.place] || '行き先周辺の飲食店';
      return {company,change:previous?.meal?'昼食の候補を確認':'昼食を予定に追加',reply:group+'昼食は'+local+'が候補です。営業時間や席の利用条件は各店の案内をご確認ください。'};
    }
    if (rain) {
      if (!company.rain) return {company,change:'天候の希望を更新',reply:at+group+'散策を含めて、立ち寄りたい場所を選べます。'};
      const lunch = company.meal && company.place==='inuyama' ? '城下町の町家の和食店やカフェで過ごす時間を取り、駅からお店までの道順を確かめておけます。' : company.meal ? '昼食をとるお店を先に選び、最寄りの駅から歩く区間を確認しましょう。' : '屋内で過ごす場所を選び、駅から入口まで歩く区間を確認しましょう。';
      return {company,change:'雨の場合の過ごし方',reply:'雨の場合は'+at+lunch};
    }
    if (age || grade || people || counts.length || /\d+人/.test(text)) {
      const who = company.child ? member+(company.people ? 'を含む'+company.people+'人' : 'とご一緒') : company.people ? company.people+'人でのおでかけ' : 'ご一緒の方';
      return {company,change:who,reply:who+'ですね。'+(place?place+'の':'希望する場所の')+'施設の入場条件と、利用する交通機関の運賃をご確認ください。'};
    }
    if (company.access && (mobility.test(text) || minutes)) {
      const reply = company.place==='inuyama' ? '犬山城の天守にはエレベーターなどの昇降設備がありません。'+(minutes?'徒歩'+company.walkMinutes+'分以内で立ち寄れる城下町のお店を検討しましょう。':'城下町を中心に過ごす場合、どのくらいの距離なら歩けそうですか。') : minutes ? '徒歩'+company.walkMinutes+'分以内というご希望に合わせて、駅から入口までの距離と段差を施設の案内で確認しましょう。'
        : '一緒に行く方が無理なく移動できるよう、歩ける距離や、階段を避けたい区間を教えてください。';
      return {company,change:'歩く距離を考慮',reply};
    }
    if (previous && company.child && !/子ども|子供|こども/.test(text))
      return {company,change:place+'での過ごし方',reply:at+member+'と訪れる場所を選べます。食事や屋内で過ごす時間のご希望も教えてください。'};
    return {company,change:'同行者を追加',reply:group+'おでかけですね。'+(company.child?'お子さまの年齢や、':'')+'行きたい場所を教えてください。'};
  }
  function childDescription(text) {
    return /子ども|子供|こども|小学生|息子|娘|幼児|乳児|子連れ|親子/.test(text);
  }

  function resolve({text:raw = '',route = '',context = {}} = {}) {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    let text = normalize(raw);
    route = String(route || '').replace(/^#/,'');
    const [current, key = '', detail = ''] = route.split('/');
    const scene = namedScene(text,current);
    const same = current === scene;
    const prior = same && context && typeof context === 'object' ? context : {};
    const state = same && route === scene + '/confirm' && prior.scopeScene === scene ? {...prior} : {};
    function answer(target, reply, additions = {}, change = '') {
      const before = label(route);
      const after = label(target);
      const nextContext = {scopeScene:target.split('/')[0], ...additions};
      return {route:target, change:change || (before && before !== after ? before + ' → ' + after : after || '条件の確認'), reply, context:nextContext};
    }
    function confirm(reply, reason = '', extra = {}) {
      const remembered = {...state};
      if (same && key === 'work') {
        remembered.trainingScope = true;
        if (/^[1-5]$/.test(detail)) remembered.lastWorkCount = Number(detail);
      }
      if (same && scene === 'airport' && ['sakae','nagoya','kanayama'].includes(key)) remembered.lastOrigin = key;
      return answer(scene + '/confirm',reply,{...remembered,...extra,hold:reason});
    }
    if (scene === 'home') {
      if (/栄|伏見|金山|名古屋駅|名駅/.test(text))
        return answer('home/confirm','その場所で過ごすご予定ですか。それとも、そこから空港や通う先へ移動するご予定ですか。');
      return null;
    }
    if (scene === 'airport') {
      text = text.replace(/(?:栄|伏見|名鉄名古屋|名古屋駅|名駅|金山)(?:駅)?から(栄|伏見|名鉄名古屋|名古屋駅|名駅|金山)(?:駅)?(?:発)?[にへ](?:変更|変え|替え|切り替え)/g,'$1から');
    }
    if (scene === 'outing') {
      if (airportToOuting(text,current)) {
        const origin = ({sakae:'伏見・栄からの空港バス',kanayama:'金山から空港への電車',nagoya:'名鉄名古屋から空港への電車'})[key];
        const end = text.match(endOfAirportTalk);
        if (end) text = text.slice(end.index+end[0].length);
        if (!destinations.test(text) && !/栄|長久手/.test(text) && !groupOrChild(text) && !mobility.test(text))
          return answer('outing',origin ? origin + 'の相談はここまでにして、今日の午後に行く場所を選びましょう。' : '今日の午後に訪れる場所を、名古屋から半日の範囲で選びましょう。');
      }
      const previousCompany = same && ['confirm','with-company'].includes(key) ? prior.company : null;
      const solo = /(?:大人|私|自分)(?:1人|ひとり|一名)(?:で|だけ)|今回は(?:1人|ひとり)で/.test(text);
      if (!solo && (previousCompany || groupOrChild(text) || mobility.test(text))) {
        const update = companyTurn(text,previousCompany,key);
        const c = update.company;
        const hold = c.access ? (c.walkMinutes !== null ? 'accessKnown' : 'access') : (c.age !== null || c.grade || c.people ? 'personKnown' : 'person');
        if (exclusions(text) || otherPark(text) || /別の市|別の県/.test(text))
          return confirm('ご希望の場所はどちらですか。ご一緒の方の条件を保ったまま、犬山・栄・長久手の立ち寄り先を選べます。',hold,{company:{...c,place:''}});
        const fullPlan = previousCompany || c.meal || c.day && c.halfDay || c.access && c.walkMinutes !== null;
        if (!fullPlan) return confirm(update.reply,hold,{company:c});
        return answer('outing/with-company',update.reply,{company:c,hold,place:c.place},update.change);
      }
      if (exclusions(text) || privateTransport.test(text) || ticketException.test(text) || /片道|帰りは別|往復しな|お金をかけず|[0-9]+円|予約済|火曜|水曜|木曜/.test(text) || hasPass(text))
        return confirm('移動手段や利用条件が変わるため、行き先と利用する交通機関を確認させてください。','conditions');
      if (foreignEndpoint(text,fromParticle,outingOrigin) || foreignEndpoint(text,toParticle,outingDestination))
        return confirm('出発地と行き先を確認させてください。この相談で案内できるのは名古屋・栄、犬山、長久手の例です。','place');
      if (state.hold === 'conditions' && !/名鉄名古屋から往復|リニモで往復|徒歩だけ|大人1人|電車で往復|車(?:では|じゃ)なく|車は使わな/.test(text))
        return confirm('先ほどの移動条件に合わせるため、利用する交通機関と往復の予定を確認させてください。','conditions');
      const castleContext = ['castlePlan','townOnly'].includes(state.hold) || same && key === 'castle';
      if ((castleContext || /犬山|城下町/.test(text)) && (/城下町(?:で|を|だけ|中心)|城(?:の)?(?:周辺|まわり|周り|外観)(?:だけ|を歩)|入ら(?:ない|ず)|入(?:りません|りたくない)/.test(text)) && !/(?:犬山城|お城|城内|天守|中)(?:にも|に|へ)?入(?:り(?:たい|ます)|る|って|ろ)|にも入/.test(text))
        return confirm('犬山城下町の散策なら、犬山市観光協会の案内で町家のお店やカフェを選べます。','townOnly',{place:'inuyama'});
      let castle = preference(text,/犬山城|お城|城(?=に|は|へ)/);
      if (!castle && castleContext && /(?:中|天守)(?:に|へ|も|まで)*入|^(?:はい、?)?入(?:る|りたい|ります)/.test(text)) castle = 1;
      const park = preference(text,/公園|長久手/);
      const tower = preference(text,/展望(?:台)?|タワー|tower/);
      const srt = preference(text,/srt/);
      const walk = preference(text,/徒歩|街歩き|地上|歩い|歩く|歩き/);
      const city = preference(text,/栄|市内|街中|近場|近く/);
      const priorTower = same && (['tower','city'].includes(key) || (key === 'sakae-plan' && prior.towerRequested));
      const rain = /雨(?:だったら|なら|の場合|が降|がふ|降り|天|に|の|予報|の日|だと|でも)|ぬれたくな|濡れたくな|屋内|室内/.test(text);
      if (rain && !/雨でも(?:公園|外|屋外)|雨は(?:気にし|降ら)な/.test(text)) {
        if (tower > 0 && (/だけ|のみ|入場|上[がりる]|のぼ|登|展望したい/.test(text)))
          return answer('outing/tower','雨なら屋内の展望台で過ごす案があります。中部電力 MIRAI TOWERの公式案内で開館時間を確認できます。',{towerRequested:true});
        return answer('outing/sakae-plan','雨の場合は、栄の中部電力 MIRAI TOWERで屋内から街を眺められます。展望台に入るか選んでみてください。',{towerRequested:false});
      }
      if ((tower > 0 && park > 0) || (castle > 0 && (park > 0 || tower > 0)))
        return confirm('複数の行き先があるので、まず訪れたい場所を一つ選んでください。');
      if (city > 0 && /久屋大通|栄の公園|栄(?:で|にある|にある近くの)公園/.test(text) && (walk > 0 || /散歩|散策|のんびり|公園/.test(text)))
        return answer('outing/walk','栄の公園周辺を徒歩で楽しむご希望なら、久屋大通公園から街を歩けます。');
      if (park > 0 && (/リニモ|長久手|藤が丘|愛[・･]?地球博/.test(text) || /公園(?:[にでへまを]|がいい)|のんびり|過ご|散歩|自然|緑/.test(text))) {
        if (otherPark(text) || /近くの公園|近所の公園|近場の公園/.test(text))
          return confirm('どちらの公園を予定していますか。藤が丘からリニモで案内できるのは、長久手の愛・地球博記念公園です。','place');
        if (/徒歩だけ|歩いて(?:行|い)く|地下鉄で|市バス|路線バス|バスで|jrで/.test(text) || preference(text,/電車|鉄道|リニモ/) < 0)
          return confirm('公園までの行き方を確認させてください。リニモ往復券の区間は藤が丘駅と愛・地球博記念公園駅の間です。','conditions');
        if ((!current || current==='home') && !/リニモ|長久手|藤が丘|愛[・･]?地球博/.test(text))
          return confirm('どちらの公園に出かけますか。長久手の愛・地球博記念公園なら、藤が丘からリニモで行けます。','parkPlan',{place:'park'});
        return answer('outing/park','長久手の愛・地球博記念公園で過ごすなら、藤が丘からリニモで往復する場合の券を確認できます。');
      }
      if (castle > 0 && /(?:入(?:り|る|って|場|ろ)|見学|登(?:り|る)|のぼ|お城の中|天守|犬山城と城下町)/.test(text)) {
        if (preference(text,/名鉄|電車|鉄道/) < 0 || /バスで|地下鉄で|jrで|徒歩で/.test(text))
          return confirm('犬山城下町きっぷには名鉄電車での往復が含まれます。犬山まで利用する交通機関を確認させてください。','conditions');
        if (/城下町だけ|周りだけ|周辺だけ|外(?:から|だけ)|外観だけ/.test(text))
          return confirm('犬山城へ入場するか、城下町だけを歩くかで必要な券が変わります。');
        return answer('outing/castle','犬山城への入場をご希望ですね。名鉄名古屋から往復するなら、乗車券と入場券引換がセットになります。');
      }
      if (srt > 0) {
        if (tower < 0 || /地上だけ|街歩きだけ|srt(?:だけ|のみ)/.test(text))
          return confirm('なごやSRTだけを使う場合は、展望台とのセット券を外します。栄での過ごし方を選んでください。');
        if (tower > 0 || priorTower)
          return answer('outing/city','なごやSRTで移動して展望台にも上るなら、SRTの1DAYパスと通常展望のセットが候補です。',{towerRequested:true});
        return answer('outing/sakae-plan','なごやSRTを使う予定ですね。タワーの展望台にも上りますか。');
      }
      if (walk > 0 && /周辺|周り|外側|外観|見上げ|地上/.test(text) && (city > 0 || tower !== 0 || priorTower))
        return answer('outing/walk','栄でタワーの周りを歩くなら、地上から街並みを眺めながら久屋大通公園を巡れます。');
      if ((tower > 0 || priorTower) && (/だけ|のみ|入場だけ/.test(text) && tower > 0 || srt < 0 || tower > 0 && /徒歩で|歩いて/.test(text)))
        return answer('outing/tower','展望台のみのご予定なら、中部電力 MIRAI TOWERの公式案内で入場方法を確認できます。',{towerRequested:true});
      if (walk > 0 && (city > 0 || (same && ['sakae-plan','city','tower','walk'].includes(key))) && (tower <= 0 || /地上|周辺|周り/.test(text)))
        return answer('outing/walk','栄の地上を歩くご予定なら、久屋大通公園とタワー周辺を徒歩で巡れます。');
      if ((tower > 0 || city > 0 || /見下ろ|見渡|眺め/.test(text)) && castle <= 0 && park <= 0)
        return answer('outing/sakae-plan','名古屋の近場なら栄があります。展望台、なごやSRT、地上の街歩きから過ごし方を選べます。',{towerRequested:tower > 0 || /見下ろ|見渡/.test(text)});
      if (castle !== 0 || /犬山|城下町/.test(text))
        return confirm('犬山の城下町を歩くご予定ですか。それとも犬山城の中にも入りますか。名鉄名古屋からの往復と入場を組み合わせた券があります。','castlePlan',{place:'inuyama'});
      if (park < 0 || tower < 0 || srt < 0)
        return confirm('今回のご希望から外れた候補を取り下げました。次にしたいことを選んでください。');
      if (/半日|午後|空き時間|観光|おでかけ|どこか/.test(text))
        return answer('outing','名古屋から半日で訪れるなら、犬山や栄、長久手から興味のある場所を選べます。');
      return null;
    }

    if (scene === 'airport') {
      const seat = preference(text,/座席|指定席|ミューチケット|特別車/);
      const previousOrigin = same && ['sakae','kanayama','nagoya'].includes(key) ? key : state.lastOrigin || '';
      const rail = preference(text,/電車|鉄道|名鉄線|ミュースカイ/);
      const bus = preference(text,/バス/);
      const origins = [
        ['sakae',preference(text,/栄|伏見/)], ['kanayama',preference(text,/金山/)],
        ['nagoya',preference(text,/名鉄名古屋(?:駅)?|名古屋駅|名駅/)]
      ];
      const departure = origins.filter(([,status]) => status > 0);
      if (groupOrChild(text) || state.hold === 'person' && !/大人(?:1人|ひとり|だけ)|1人で|ひとりで/.test(text))
        return confirm('利用する方の年齢や人数で空港までの運賃が変わります。ここでは大人1人の例を案内しています。','person');
      const origin = departure.length === 1 ? departure[0][0] : previousOrigin;
      if (preference(text,/中部国際空港|セントレア|空港/) < 0 || !departure.length && origins.some(([,status])=>status < 0))
        return confirm('出発地または行き先が変わるのですね。どこからどこへ向かうご予定ですか。','place');
      if (/何時|[0-9]+時|最終|終電|始発|発車時刻|発車時間|遅延|遅れ|時刻表|間に合/.test(text) || state.hold === 'schedule' && !/きっぷ|切符|運賃|料金|値段/.test(text)) {
        const from = {sakae:'伏見・栄からの空港バス',kanayama:'金山から中部国際空港への列車',nagoya:'名鉄名古屋から中部国際空港への列車'}[origin];
        const time = text.match(/([0-2]?\d時(?:半|[0-5]?\d分)?)(?:発|出発)?の?(?:便|飛行機|フライト)/)?.[1] || state.flightTime || '';
        const carrier = /飛行機|フライト|便/.test(text) || time ? (time?time+'の便の':'ご利用便の')+'出発・搭乗手続き時刻は航空会社で、' : '';
        return confirm(carrier+(from || '中部国際空港への列車・バス')+'の時刻は交通各社の公式時刻表でご確認ください。','schedule',{lastOrigin:origin,destination:'centrair',flightTime:time});
      }
      if (exclusions(text) || privateTransport.test(text) || ticketException.test(text) || /(空港|セントレア)(?:駅)?(?:発|から)|往復|予約(?:を|し|済)|満席|[0-9]+円/.test(text) || hasPass(text)
        || /今日(?:の午後|中)|今日はおでかけせず|空港に(?:は)?行かない/.test(text))
        return confirm('空港へ向かう方向、出発地、ご希望の時間や交通手段を確認させてください。','conditions');
      if (departure.length > 1 || foreignEndpoint(text,fromParticle,airportOrigin) || foreignEndpoint(text,toParticle,airportDestination))
        return confirm('どの駅・停留所からセントレアへ向かいますか。伏見・栄のバス、金山・名鉄名古屋の電車が候補です。','place');
      if (!origin) {
        if (airportWords.test(text) || rail || bus || baggage.test(text)) return answer('airport','セントレアへ向かう出発地はどちらですか。栄・伏見、金山、名鉄名古屋の例から選べます。');
        return null;
      }
      if (origin === 'sakae' && (rail > 0 || bus < 0 || seat > 0) || origin !== 'sakae' && (bus > 0 || rail < 0))
        return confirm('ご希望の出発地と交通手段の組み合わせを確認しましょう。栄・伏見発はバス、金山・名鉄名古屋発は電車をご案内できます。','transport',{lastOrigin:origin});
      if (origin !== 'sakae' && seat > 0)
        return answer('airport/'+origin+'/seat','座席を指定する場合は、空港までの乗車券に加えて特別車両券（ミューチケット）が必要です。');
      if (!departure.length && !rail && !bus && !seat && !baggage.test(text) && !/乗り換え|乗換/.test(text)) return null;
      if ((state.hold === 'conditions' || state.hold === 'place') && !departure.length)
        return confirm('出発地から区間を選び直しましょう。栄・伏見、金山、名鉄名古屋のどこから空港へ向かいますか。',state.hold);
      if (origin === 'sakae') {
        if (!bus && !baggage.test(text) && !/ホテル|宿|乗り換え|乗換|空港|セントレア|から/.test(text))
          return answer('airport','栄からは空港バスがあります。バスで空港へ向かうご予定ですか。');
        return answer('airport/sakae','伏見・栄からは空港バスで乗り換えずに行けます。ホテルに近い停留所と発車時刻をご確認ください。');
      }
      const station = origin === 'kanayama' ? '金山' : '名鉄名古屋';
      return answer('airport/'+origin,station+'から電車でセントレアへ向かう区間の片道QRきっぷをご案内します。');
    }

    const workScreen = same && key === 'work';
    const schoolScreen = same && key === 'school';
    const schoolRequest = /学校|通学|らんらんバス|高校[にへ]|小学生が(?:通|乗)/.test(text) || schoolScreen && /高校生|小学生|名鉄(?:の)?電車|鉄道|バス/.test(text);
    if (schoolRequest && !/研修|通勤|子供料金|子ども料金|こども料金/.test(text)) {
      if (exclusions(text) || /大学|中学校|中学生|JR|地下鉄|スクールバス|他社/i.test(text))
        return confirm('どの路線を使い、何年生の方が通いますか。対象の路線と学齢を確認しましょう。');
      const bus = preference(text,/らんらんバス|東海市の(?:循環)?バス/);
      const train = preference(text,/名鉄(?:の)?(?:電車|鉄道|線)/);
      const child = preference(text,/小学生|小学校/);
      const high = preference(text,/高校(?:生)?/);
      if (bus > 0 && train > 0 || child > 0 && high > 0) return confirm('利用する路線と学齢の組み合わせを一つずつ確認させてください。');
      const byBus = bus > 0 || !bus && !train && schoolScreen && ['bus','child'].includes(detail);
      const byTrain = train > 0 || !train && !bus && schoolScreen && detail === 'train';
      const isChild = child > 0 || !child && !high && schoolScreen && detail === 'child';
      const isHigh = high > 0 || !child && !high && schoolScreen && ['bus','train'].includes(detail);
      if (byBus && isChild) return answer('commute/school/child','東海市のらんらんバスは小学生以下が無料です。通学には定期券を購入せずに利用できます。');
      if (byBus && isHigh) return answer('commute/school/bus','高校への通学でらんらんバスを利用する場合は、通勤・通学共通の全線定期を確認できます。');
      if (byTrain && isHigh) return answer('commute/school/train','名鉄電車で高校へ通う場合は、通学定期の専用予約サービスで申込方法を確認できます。');
      return answer('commute/school','通学する方の学齢と、通学に使う鉄道・バスを選んでください。');
    }

    const savedCount = workScreen && /^[1-5]$/.test(detail) ? Number(detail) : state.lastWorkCount || 0;
    const countMention = /([0-9]+)(?:回の?)?往復|([0-9]+)(?:回|日)(?:分)?(?:に|は|で|を|だけ|くらい|ほど|の予定|行く|通う|通い|[、]|$)/g;
    const amounts = [...text.matchAll(countMention)];
    const absolute = amounts.length ? Number(amounts.at(-1)[1] || amounts.at(-1)[2]) : null;
    const relativeCount = text.match(/(?:もう|あと|さらに|更に|追加で|プラス|マイナス)([0-9]+)(?:往復|回|日)|([0-9]+)(?:往復|回|日)(?:分|だけ|ほど|くらい)?(?:を)?(?:増|減|足|少なく|多く|追加|多い|少ない|やめ)/);
    const increaseOrDecrease = /増|減|プラス|マイナス|追加|足す|少なく|多く|もう(?:一|[0-9])|あと[0-9]/.test(text);
    const isWork = workScreen || workTrip.test(text) || absolute !== null || relativeCount || increaseOrDecrease || /一宮|定期|料金|運賃/.test(text) || same && key === 'confirm';
    if (!isWork) return null;
    if (groupOrChild(text) || state.hold === 'person' && !/大人(?:1人|ひとり|だけ)|1人で|ひとりで/.test(text))
      return confirm('この運賃比較は大人1人の場合です。お子さまの運賃や複数人の条件を含む場合は購入条件を確認しましょう。','person');
    if (hasPass(text) || state.hold === 'pass' && !/定期(?:券)?(?:は|を|が)?(?:持って(?:い)?ない|持って(?:い)?ません|なし|無し|ない|ありません|期限切れ|切れた)/.test(text))
      return confirm('お持ちの定期券で乗れる区間によって追加運賃が変わります。定期券の有効区間をご確認ください。','pass');
    const source = /一宮/.test(text);
    const target = /名古屋|名駅/.test(text);
    const reversed = /(?:名古屋(?:駅)?|名駅)(?:から|発)|一宮(?:駅)?(?:まで|着|[へに](?:通|行く|変更|$))/.test(text);
    const otherPlace = foreignEndpoint(text,fromParticle,workOrigin) || foreignEndpoint(text,toParticle,/(?:名鉄)?名古屋(?:駅)?$|名駅$/);
    const separator = /(?:駅|[一-龯])(?:[―−–—⇄→-])(?:名鉄|[一-龯])/.test(text);
    if (exclusions(text) || reversed || otherPlace || preference(text,/一宮/) < 0 || preference(text,/名古屋|名駅/) < 0 || /(?:栄|伏見|金山|犬山|藤が丘)/.test(text) || separator && !(source && target)
      || state.hold === 'place' && !(source && target))
      return confirm('比較できるのは名鉄一宮から名鉄名古屋へ通う場合です。出発駅と到着駅をもう一度ご指定ください。','place');
    const periods = [...text.matchAll(/([0-9]+)(か月|ヶ月|カ月|箇月|週間|日間)/g)];
    if (privateTransport.test(text) || ticketException.test(text) || /片道|年(?:間|を通して)|半年|[3-9]か?月|60日(?:以上|超)|有効期限(?:を|が)過ぎ|別々の人|新幹線|バスで|地下鉄|jr(?:で|線)|回数未定|わからない|分からない|[0-9]+円|毎(?:日|週|月)|週間に|月に|のペース/.test(text)
      || periods.some(([,n,unit]) => Number(n) * (unit === '日間' ? 1 : unit === '週間' ? 7 : 30) > 60))
      return confirm('この比較は約60日以内の同一区間の往復が対象です。期間、区間、回数を確認させてください。','period');
    if (state.hold === 'period' && !/60日以内|約60日|2か月以内|2ヶ月以内|1か月|今月/.test(text))
      return confirm('先ほどの利用期間について、約60日以内に何回往復するかを確認させてください。','period');
    if (/[0-9]\s*(?:〜|~|から|か|または)[0-9](?:回|往復)|[0-9]往復(?:か|または|〜|~)[0-9]/.test(text))
      return confirm('往復回数を一つ決めると、普通運賃と10枚セットを比較できます。');
    if (amounts.length) {
      const last = amounts.at(-1);
      const tail = text.slice(last.index + last[0].length).split('、')[0];
      if (/^(?:は|も)?(?:しない|しません|行かない|通わない|ではな|じゃな|でな|以外|以上|以下|未満|前後)/.test(tail))
        return confirm('変更後の合計回数を教えてください。実際に往復する回数に合わせて比較します。');
    }
    let count = absolute;
    if (relativeCount) {
      if (!savedCount) return confirm('増減する前の回数を確認させてください。名鉄一宮から名鉄名古屋まで、全部で何往復しますか。');
      const delta = Number(relativeCount[1] || relativeCount[2]);
      count = savedCount + (/減|少な|マイナス|やめ/.test(text) ? -delta : delta);
    } else if (increaseOrDecrease && count === null) {
      return confirm('回数の変更ですね。変更後の合計を、往復の回数で教えてください。');
    }
    if (count !== null) {
      if (!Number.isInteger(count) || count < 1 || count > 5) return confirm('この比較で試せるのは1〜5往復です。予定の往復回数を確認させてください。');
      if (!workScreen && !state.trainingScope && !(source && (target || /研修|仕事|通勤/.test(text))))
        return answer('commute/work','名鉄一宮から名鉄名古屋へ、定期券を持っていない大人1人が通うご予定なら、往復回数を選んでください。');
      const total = count * 2 * 400;
      const difference = Math.abs(total - 2800).toLocaleString('ja-JP');
      const condition = /もし|たら|かも|場合|としたら/.test(text) ? 'なら' : 'では';
      const comparison = count + '往復' + condition + '、' + (total < 2800 ? '毎回普通運賃で乗る方' : '10枚セットの方') + 'が' + difference + '円安くなります。';
      return answer('commute/work/'+count,comparison,{count},savedCount && savedCount !== count ? savedCount + '往復 → ' + count + '往復' : '名鉄一宮〜名鉄名古屋・' + count + '往復');
    }
    if (workTrip.test(text) || source)
      return answer('commute/work','名鉄一宮から名鉄名古屋まで、約60日以内に何回往復する予定ですか。');
    return null;
  }
  return Object.freeze({resolve});
})();
