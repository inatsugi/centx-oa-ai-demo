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
    'commute/school/child':'小学生のらんらんバス', 'outing/inuyama-plan':'犬山の半日プラン', 'airport/seat-options':'座席と乗り換えの比較',
    'airport/nagoya/ready':'名鉄名古屋での乗車準備', 'airport/kanayama/ready':'金山での乗車準備'
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
      const skipping = /食べ(?:な|ず|ません)|飲(?:ま(?:な|ず)|みません)|休憩(?:しな|せず|しません)|とら(?:な|ず)|寄りません|取り消|キャンセル/.test(clause);
      status = negative.test(clause) || skipping ? -1 : 1;
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
      if (new RegExp('(?:' + nonLocation.source + ')$').test(left) || /(?:して|見て|入って|登って|食べて|取って|歩いて|降りて|乗って|飲んで|寄って|済ませて|終わって|選んで|泊まって|休んで|着いて|出て)$/.test(left)) continue;
      if (/[ぁ-んァ-ヶ一-龯a-z0-9]$/.test(left)) return true;
    }
    return false;
  }
  const airportOrigin = /(?:伏見|栄|金山|(?:名鉄)?名古屋|名駅)(?:駅|駅前|エリア)?(?:にある|の|付近の|近くの|周辺の)?(?:ホテル|宿泊先|宿|停留所|バス停)?$/;
  const airportDestination = /(?:中部国際空港|中部空港|セントレア|空港)(?:駅)?$/;
  const workOrigin = /(?:名鉄|尾張)?一宮(?:駅)?$/;
  const outingOrigin = /(?:名古屋|名駅|栄|藤が丘)(?:駅)?$/;
  const outingDestination = /(?:お城|犬山(?:城|駅)?|城下町|展望(?:台)?|タワー|tower|展望フロア|栄|市内|街中|公園(?:駅)?|長久手|藤が丘|地上|名駅|名古屋|近場|近く|どこか|お出かけ|遊び)(?:だけ|のみ|の予定|周辺)?$/;
  const privateTransport = /(?<!電|列|汽|特別|普通|一般)車(?:で|に乗|を使|を利用)|自動車|レンタカー|マイカー|自転車|タクシー/;
  const ticketException = /割引|割り引|無料|手帳|優待|クーポン|購入済|入場券(?:は|が|を)?(?:すでに|既に|もう)?(?:ある|あり|持|購入)|(?:きっぷ|切符|乗車券|チケット)(?:は|が|を)(?:すでに|既に|もう)(?:ある|あり|持|買)|(?:きっぷ|切符|乗車券|チケット)(?:は|を)?(?:いらな|買わない|不要)/;
  function otherPark(text) {
    for (const {index} of text.matchAll(/(?:にある|の)公園/g)) {
      if (!/(?:長久手|久屋大通|栄|近く|近所|近場|どこか|街中|市内|沿線|駅前|駅近く|愛・地球博記念公園)(?:市)?$/.test(text.slice(0,index))) return true;
    }
    return /市内の公園|名古屋の公園/.test(text) || /[一-龯々ァ-ヶ]{2,}公園/.test(text.replace(/愛[・･]?地球博記念公園|モリコロパーク|久屋大通公園/g,''));
  }
  const mobility = /祖母|祖父|おばあ|おじい|高齢|長く(?:は)?歩け|あまり歩け|足が(?:悪|痛)|歩く(?:の|距離)(?:が|は)(?:苦手|心配|つら)|歩行|車いす|車椅子|ベビーカー|段差|階段を避け/;
  function stairPreference(text) {
    const withoutChair = /車(?:いす|イス|椅子)(?:は|を)?(?:使わない|使いません|不要|なし|無し)/;
    const chair = /車(?:いす|イス|椅子)/.test(text) && !withoutChair.test(text) && !/貸出|貸し出し|借りられ(?:る|ますか)/.test(text);
    const cannotClimb = /(?:階段|段差)[^、]{0,12}(?:(?:上|のぼ|登|昇)(?:が)?(?:れ|られ|ることができ)(?:ない|ません)|使え(?:ない|ません)|避けたい|避けます|厳しい|無理|不可|難しい|つらい|がない所|なしで|を通らず)/.test(text);
    if (chair || cannotClimb) return 'avoid';
    if (/(?:階段|段差)[^、]{0,10}(?:問題(?:は)?(?:ない|ありません)|大丈夫|使え(?:る|ます)|(?:上|登|のぼ)(?:が)?(?:れ|られ)(?:る|ます)|避けなくて(?:も)?(?:よい|いい))/.test(text)) return 'clear';
    return '';
  }
  function soloTrip(text) {
    return /(?:大人|私|自分)(?:1人|ひとり|一名)(?:で|だけ)|(?:今回|今日|今度|次)(?:は|からは)?(?:私だけ|ひとり|1人)(?:で|です|が|、|$)|(?:1人|ひとり)で(?:行きます|行く|出かけ|回ります|参加)/.test(text) && !/一緒|同行する|と[2-9]人/.test(text);
  }
  const stairsReply = '犬山城の天守にはエレベーターなどの昇降設備がありません。城下町での昼食や休憩を候補に、移動経路の段差と施設の入口を公式案内で確認しましょう。';
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
    const stairs = stairPreference(text);
    if (stairs==='avoid') { company.avoidStairs=true; company.access=true; }
    else if (stairs==='clear') { company.avoidStairs=false; company.access=company.walkMinutes!==null; }
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
    const indoor = /屋内|室内|建物の中/.test(text);
    if (indoor) company.indoor = true;
    const rain = /雨|ぬれたくな|濡れたくな/.test(text);
    if (rain) company.rain = !/雨(?:は|が)?(?:降らな|気にしな)|晴れ(?:だったら|なら)/.test(text);
    const place = familyPlaces[company.place] || '';
    const at = place ? place+'で' : '';
    const group = company.child && company.elder ? 'お子さま、お祖父母さまとの' : company.child ? 'お子さまとの' : company.elder ? 'ご家族との' : 'ご一緒の方との';
    const member = company.age !== null ? company.age+'歳のお子さま' : company.grade || 'お子さま';
    if (stairs==='avoid' && company.place==='inuyama') return {company,change:'天守への階段を外す',reply:stairsReply};
    if (indoor && company.place==='sakae' && company.avoidStairs)
      return {company,change:'栄の屋内で休憩',reply:'栄のオアシス21の飲食店やMIRAI TOWER 3階のカフェが休憩の候補です。駅からの経路、段差、利用できる入口を各施設の公式案内で確認しましょう。'};
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
  const midday = /お昼(?:ごはん|ご飯|ごはん)?|昼(?:ごはん|ご飯|飯|食|休み)|ランチ|食事|ごはん|ご飯/;
  const teaBreak = /お茶|カフェ|喫茶|コーヒー|休憩|ひと休み|一休み/;
  const palace = /犬山城|お城|天守|城下町|おしろ|城(?=を|に|が|は|へ|の)/;
  function dayPlan(text,previous,company,admissionBefore) {
    const plan = {order:['lunch','castle'],admission:admissionBefore || 'undecided',roundTrip:false,ticket:false,...previous};
    if (previous?.ticket && previous.roundTrip===undefined) plan.roundTrip = true;
    let order = [...plan.order];
    const enter = /(?:犬山城|お城|天守|中)(?:の中)?(?:を|に|にも|へ|まで)?(?:入(?:りたい|る|って|りま|ろ)|見学|登(?:って|りたい|る))|入(?:場|城)(?:したい|する|して|も)|中も見(?:る|たい)/.test(text);
    const stayOutside = /入(?:ら(?:な|ず)|りません|りたく(?:は)?な)|入(?:場|城)(?:は|を)?(?:しない|不要|なし)|(?:城下町|外観|外から)(?:を歩く)?だけ|外(?:から|で)(?:見る|眺める)だけ/.test(text);
    if (stayOutside) plan.admission = 'no';
    else if (enter) plan.admission = 'yes';
    const stairs = stairPreference(text);
    if (stairs==='avoid' || company?.avoidStairs) plan.preventTowerStairs = true;
    else if (soloTrip(text) || stairs==='clear') plan.preventTowerStairs = false;
    if (plan.preventTowerStairs) plan.admission = 'no';
    const visit = plan.admission === 'no' ? 'town' : 'castle';
    order = order.map(step=>step==='town' || step==='castle'?visit:step);
    const wantsLunch = preference(text,midday);
    const wantsTea = preference(text,teaBreak);
    if (wantsLunch < 0) order = order.filter(step=>step!=='lunch');
    else if (wantsLunch > 0 && !order.includes('lunch')) order.unshift('lunch');
    if (wantsTea < 0) order = order.filter(step=>step!=='tea');
    else if (wantsTea > 0 && !order.includes('tea')) order.push('tea');
    const activities = [[visit,palace],['lunch',midday],['tea',teaBreak]];
    function move(step,first) {
      if (!order.includes(step)) return;
      order = order.filter(item=>item!==step);
      if (first) order.unshift(step); else order.push(step);
    }
    for (const [step,pattern] of activities) {
      const activity = '(?:'+pattern.source+')';
      if (new RegExp('(?:先に|まず|最初に|初めに|先は)'+activity+'|'+activity+'(?:を|に|が)?先(?:に|で|が|、|$)').test(text)) move(step,true);
      if (new RegExp('(?:帰(?:り|る前)に|最後に|締めに|あとで|後で)'+activity+'|'+activity+'(?:を|は)?(?:最後|帰り)(?:に|で|、|$)').test(text)) move(step,false);
    }
    for (const [before,first] of activities) {
      if (!order.includes(before)) continue;
      for (const [after,second] of activities) {
        if (before===after || !order.includes(after) || order.indexOf(before)<order.indexOf(after)) continue;
        const sequence = new RegExp('(?:'+first.source+')[^、]{0,8}?(?:てから|のあと|の後|の次|を済ませたら|を食べたら|を見たら)(?:に|は|で)?、?(?:'+second.source+')');
        if (sequence.test(text)) {
          order = order.filter(step=>step!==before);
          order.splice(order.indexOf(after),0,before);
        }
      }
    }
    if (/(?:お昼|昼食|ランチ|食事)(?:を食べる)?(?:の)?前に(?:お城|城|天守)/.test(text)) move(visit,true);
    if (/(?:お城|城|天守)(?:に入る|に行く)?(?:の)?前に(?:お昼|昼食|ランチ|食事)/.test(text)) move('lunch',true);
    plan.order = order;
    const invalidRide = privateTransport.test(text) || /徒歩(?:だけ|のみ|で犬山)|片道|帰りは別|往復しな|(?:名鉄|電車)(?:には|は|を)?(?:乗らな|使わな)/.test(text);
    const specificReturn = /(?:名鉄名古屋(?:駅)?|名古屋駅|名駅)(?:発|から)[^、]{0,22}(?:往復|行って帰)|(?:往復|行き帰り)[^、]{0,18}(?:名鉄名古屋(?:駅)?|名古屋駅|名駅)/.test(text);
    if (specificReturn) plan.roundTrip = true;
    if (invalidRide) plan.roundTrip = false;
    const ticketWords = /きっぷ|切符|チケット|セット券|乗車券/;
    const wantsTicket = ticketWords.test(text) && preference(text,ticketWords) > 0 && !/買わない|買いません|いらな|不要|買いたくな/.test(text);
    if (ticketWords.test(text)) plan.ticket = wantsTicket;
    plan.ticket = !!(plan.ticket && plan.roundTrip && plan.admission==='yes' && !company && !invalidRide && !ticketException.test(text) && !hasPass(text));
    let change = '犬山の立ち寄り順';
    let reply = '犬山では、'+order.map(step=>({lunch:'城下町で昼食',castle:plan.admission==='yes'?'犬山城に入場':'犬山城周辺を散策',town:'城下町を散策',tea:'カフェでお茶'})[step]).join('、')+'の順で半日を過ごせます。';
    if (ticketWords.test(text)) {
      change = plan.ticket?'往復と入場のきっぷ':'行程と利用条件';
      if (plan.ticket) reply = '名鉄名古屋からの往復と犬山城への入場には、犬山城下町きっぷが使えます。';
      else if (!wantsTicket) reply = 'きっぷの案内を外し、犬山での立ち寄り順を残しました。';
      else if (company) reply = 'ご一緒の方の年齢や人数で条件が変わるため、各施設と交通機関の案内で料金を確認しましょう。';
      else if (plan.admission!=='yes') reply = '城下町の散策と入城では必要な券が変わります。犬山城の中にも入るご予定ですか。';
      else reply = '名鉄名古屋から犬山まで往復するご予定ですか。乗車区間と入城の両方が合うきっぷを確認できます。';
    }
    if (plan.preventTowerStairs && (stairs==='avoid' || enter || ticketWords.test(text))) {
      change = '城下町と移動経路を確認';
      reply = stairsReply;
    } else if (/エレベーター|昇降(?:設備|機)/.test(text)) {
      change = '天守の昇降設備を確認';
      reply = '犬山城の天守にはエレベーターなどの昇降設備がありません。階段を利用できるか、犬山城の公式案内で構造や利用条件をご確認ください。';
    }
    return {plan,change,reply};
  }
  function fareCase(count,previousCount,afterPeriod,stage) {
    const inPeriod = count-afterPeriod;
    return {stage,previousCount,count,inPeriod,afterPeriod,ordinaryTotal:count*800,bundleTotal:2800+afterPeriod*800,remainingTickets:10-2*inPeriod};
  }
  const formatYen = amount=>amount.toLocaleString('ja-JP')+'円';

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
          return answer('outing',origin ? origin+'で空港へ向かう予定を残し、今日の午後は犬山で過ごす半日プランを一例にしました。' : '今日の午後は、名古屋から半日で訪れる犬山のプランを一例にしました。');
      }
      const previousCompany = same && ['confirm','with-company','inuyama-plan'].includes(key) ? prior.company : null;
      const solo = soloTrip(text);
      const previousPlan = same && key==='inuyama-plan' ? prior.inuyamaPlan : null;
      const atInuyama = /犬山|お城/.test(text) || same && (['castle','inuyama-plan'].includes(key) || prior.examplePlace==='inuyama' || prior.place==='inuyama' || previousCompany?.place==='inuyama');
      const otherArea = /栄|長久手|タワー|公園|近場|近くで|名古屋市内/.test(text);
      const arranging = /(?:プラン|行程|予定|コース)(?:を|も|に|が|は)?(?:作|組|入|考|立て|変え|お願い)|半日(?:の)?(?:プラン|コース)|順番|帰りに|先に|まず|最初に|最後に|前に/.test(text);
      const planUpdate = previousPlan && (midday.test(text) || teaBreak.test(text) || /入ら|入る|入って|入りたい|往復|きっぷ|切符|チケット|徒歩|車で|城下町だけ|外観だけ/.test(text));
      const stairs = stairPreference(text);
      const accessibilityQuestion = /エレベーター|昇降(?:設備|機)/.test(text);
      const companyChange = previousPlan && (groupOrChild(text) || mobility.test(text) || stairs || previousCompany && /歳|才|人|雨|分|歩|今日|明日/.test(text));
      const makePlan = atInuyama && !otherArea && (arranging || planUpdate || companyChange || accessibilityQuestion || previousPlan && solo || !previousCompany && (key==='castle' || prior.examplePlace==='inuyama') && (midday.test(text)||teaBreak.test(text)));
      if (makePlan && !exclusions(text) && !foreignEndpoint(text,fromParticle,outingOrigin)) {
        const hasCompany = !solo && (previousCompany || groupOrChild(text) || mobility.test(text) || stairs==='avoid');
        const party = hasCompany ? companyTurn(text,previousCompany,'castle') : null;
        const company = party?.company;
        const selected = previousPlan || (same && key==='castle'?{admission:'yes',roundTrip:true,ticket:true}:null);
        const update = dayPlan(text,selected,company,state.hold==='townOnly'?'no':'undecided');
        const partyReply = companyChange && party && !accessibilityQuestion && !(update.plan.preventTowerStairs && (stairs==='avoid' || planUpdate));
        return answer('outing/inuyama-plan',partyReply?party.reply:update.reply,{inuyamaPlan:update.plan,place:'inuyama',...(company?{company}:{})},partyReply?party.change:update.change);
      }
      if (!solo && (previousCompany || groupOrChild(text) || mobility.test(text) || stairs==='avoid')) {
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
        return answer('outing','名古屋から半日で出かける一例として、犬山で過ごす午後を組みました。立ち寄る順番や行き先を変更できます。');
      return null;
    }

    if (scene === 'airport') {
      const seat = preference(text,/座席|指定席|ミューチケット|特別車|席を(?:取|と|確保)|席の予約/);
      const ordinary = /一般車|普通車|自由席|指定(?:しない|なし|しなくて|は不要)|指定席(?:は|を|が)?(?:いらな|要らな|やめ|不要)|(?:席(?:の|は)?|座席は)?予約(?:は|を)?(?:不要|やめ|しな(?:い|く))/.test(text) && preference(text,/一般車|普通車|自由席/) >= 0;
      const reserve = !ordinary && (seat > 0 || /(?:バス|席)(?:の|は|を|って)?予約(?:したい|できる|できますか)|席(?:は|を|が|って)?(?:とりたい|とって|取って|予約|確保)|座っ(?:て行|てい)きたい|座りたい/.test(text)) && seat >= 0;
      const previousOrigin = same && ['sakae','kanayama','nagoya'].includes(key) ? key : key==='seat-options' ? prior.lastOrigin || 'sakae' : state.lastOrigin || '';
      const inComparison = same && key==='seat-options';
      const prepare = /乗る前|乗車前|用意|準備|必要な(?:もの|物|券|きっぷ)|何(?:が|を)(?:要る|買|持)|持ち物|買い方|チェックリスト|まとめて/.test(text);
      const rail = preference(text,/電車|鉄道|名鉄線|ミュースカイ/);
      const bus = preference(text,/バス/);
      const origins = [
        ['sakae',preference(text,/栄|伏見/)], ['kanayama',preference(text,/金山/)],
        ['nagoya',preference(text,/名鉄名古屋(?:駅)?|名古屋駅|名駅/)]
      ];
      const departure = origins.filter(([,status]) => status > 0);
      if (groupOrChild(text) || state.hold === 'person' && !/大人(?:1人|ひとり|だけ)|1人で|ひとりで/.test(text))
        return confirm('利用する方の年齢や人数で空港までの運賃が変わります。ここでは大人1人の例を案内しています。','person');
      let origin = departure.length === 1 ? departure[0][0] : previousOrigin;
      if (!origin && !key && prior.exampleOrigin==='sakae' && reserve) origin='sakae';
      if (bus > 0 && !departure.length && (inComparison || prior.busOrigin==='sakae') && /戻|やっぱり|にする|で行|に変|がいい/.test(text)) origin='sakae';
      if (preference(text,/中部国際空港|セントレア|空港/) < 0 || !departure.length && origins.some(([,status])=>status < 0))
        return confirm('出発地または行き先が変わるのですね。どこからどこへ向かうご予定ですか。','place');
      if (/何時|[0-9]+時|最終|終電|始発|発車時刻|発車時間|遅延|遅れ|時刻表|間に合/.test(text) || state.hold === 'schedule' && !/きっぷ|切符|運賃|料金|値段/.test(text)) {
        const from = {sakae:'伏見・栄からの空港バス',kanayama:'金山から中部国際空港への列車',nagoya:'名鉄名古屋から中部国際空港への列車'}[origin];
        const time = text.match(/([0-2]?\d時(?:半|[0-5]?\d分)?)(?:発|出発)?の?(?:便|飛行機|フライト)/)?.[1] || state.flightTime || '';
        const carrier = /飛行機|フライト|便/.test(text) || time ? (time?time+'の便の':'ご利用便の')+'出発・搭乗手続き時刻は航空会社で、' : '';
        return confirm(carrier+(from || '中部国際空港への列車・バス')+'の時刻は交通各社の公式時刻表でご確認ください。','schedule',{lastOrigin:origin,destination:'centrair',flightTime:time});
      }
      if (exclusions(text) || privateTransport.test(text) || ticketException.test(text) || /(空港|セントレア)(?:駅)?(?:発|から)|往復|予約済|満席|[0-9]+円/.test(text) || /予約(?:を|し)/.test(text) && !reserve && !ordinary || hasPass(text)
        || /今日(?:の午後|中)|今日はおでかけせず|空港に(?:は)?行かない/.test(text))
        return confirm('空港へ向かう方向、出発地、ご希望の時間や交通手段を確認させてください。','conditions');
      const stationsText = text.replace(/(?:バス|電車|一般車|普通車|特別車)(?:に|へ)(?:戻|変更)|(?:から|発)に変更/g,'');
      if (departure.length > 1 || foreignEndpoint(stationsText,fromParticle,airportOrigin) || foreignEndpoint(stationsText,toParticle,airportDestination))
        return confirm('どの駅・停留所からセントレアへ向かいますか。伏見・栄のバス、金山・名鉄名古屋の電車が候補です。','place');
      if (!origin) {
        if (airportWords.test(text) || rail || bus || reserve || prepare || baggage.test(text)) return answer('airport','出発地の一例として、栄・伏見からセントレアへ直通する空港バスを表示しています。実際の出発駅に合わせて変更できます。');
        return null;
      }
      if (origin==='sakae' && reserve && bus >= 0 && rail >= 0)
        return answer('airport/seat-options','伏見・栄の空港バスは予約できません。座席を決めておきたい場合は、名鉄名古屋などから空港行きの特別車に乗る方法があります。',{lastOrigin:'sakae',busOrigin:'sakae',seatClass:'reserved'},'バスと指定席のある電車を比較');
      if (origin === 'sakae' && (rail > 0 || bus < 0 || seat > 0) || origin !== 'sakae' && (bus > 0 || rail < 0))
        return confirm('ご希望の出発地と交通手段の組み合わせを確認しましょう。栄・伏見発はバス、金山・名鉄名古屋発は電車をご案内できます。','transport',{lastOrigin:origin});
      if (origin!=='sakae' && (prepare || detail==='ready' && (ordinary || seat || departure.length))) {
        const station = origin==='nagoya'?'名鉄名古屋':'金山';
        const reserved = !ordinary && seat >= 0 && (reserve || inComparison || detail==='seat' || prior.seatClass==='reserved');
        const reply = reserved ? station+'では、空港までの乗車券と、利用列車の特別車両券（ミューチケット、450円）を乗車前に用意します。' : station+'から一般車を利用するなら、空港までの乗車券を用意します。一般車がある列車と発車時刻を確認してください。';
        return answer('airport/'+origin+'/ready',reply,{lastOrigin:origin,seatClass:reserved?'reserved':'general',busOrigin:prior.busOrigin || ''},reserved?'乗車券と指定席の準備':'一般車での乗車準備');
      }
      if (origin !== 'sakae' && (reserve || inComparison && departure.length && !ordinary && seat>=0))
        return answer('airport/'+origin+'/seat','座席を指定する場合は、空港までの乗車券に加えて特別車両券（ミューチケット）が必要です。',{lastOrigin:origin,seatClass:'reserved',busOrigin:prior.busOrigin || ''});
      if (!departure.length && !rail && !bus && !seat && !ordinary && !baggage.test(text) && !/乗り換え|乗換/.test(text)) return null;
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
    if (schoolScreen && /期限|有効期間|往復(?:増|減)|あと[0-9]+回|もう[0-9]+日/.test(text) && !/研修|出社|勤務/.test(text))
      return confirm('通学定期の有効期間は券面で確認できます。学校へ通う路線や学齢に合わせてご案内します。','school');
    const schoolRequest = /学校|通学|らんらんバス|高校[にへ]|小学生が(?:通|乗)/.test(text) || schoolScreen && /高校生|小学生|名鉄(?:の)?電車|鉄道|バス/.test(text);
    const trainSchool = schoolScreen && detail==='train' && !/バス|らんらん|区間|小学生|大学|中学生/.test(text);
    if (trainSchool && /受け取|受取|受けと|どこで(?:買|購入|発券)|審査(?:が|の)?(?:済|後|終わ)/.test(text))
      return answer('commute/school/train','審査が済んだら、駅の対応券売機などで通学定期を購入します。利用できる券売機と購入方法は名鉄の専用サービスで確認できます。',{schoolStep:'collect'},'審査後の購入場所');
    if (trainSchool && /申込|手続き|用意|準備|必要/.test(text))
      return answer('commute/school/train','新規の通学定期は、専用サービスで学校の証明書類を提出し、審査が済んだら駅の対応券売機などで購入します。',{schoolStep:'prepare'},'通学定期の申込み');
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

    const displayedExample = same && !key && Number.isInteger(prior.exampleCount) && prior.exampleCount>=1 && prior.exampleCount<=5 ? prior.exampleCount : 0;
    const savedCount = workScreen && /^[1-5]$/.test(detail) ? Number(detail) : state.lastWorkCount || displayedExample;
    if (savedCount && state.hold==='expiry' && /^[0-9]+(?:回|往復)(?:だけ|です|になります|の予定|かな|くらい|、|$)/.test(text)) text = '期限後は'+text;
    const deadlineWords = /(?:有効|利用)(?:開始)?期限|有効期間|期限(?:内|外|後|前|切れ|の|を|が)|期間(?:内|外|後|が過ぎ)|60日(?:を|が)?(?:過ぎ|越え|超え)|61日目/;
    const countMention = /([0-9]+)(?:回の?)?往復|([0-9]+)(?:回|日)(?:分)?(?:に|は|で|を|だけ|くらい|ほど|の予定|行く|通う|通い|[、]|$)/g;
    const amounts = [...text.matchAll(countMention)];
    const absolute = amounts.length ? Number(amounts.at(-1)[1] || amounts.at(-1)[2]) : null;
    const relativeCount = text.match(/(?:もう|あと|さらに|更に|追加で|プラス|マイナス)([0-9]+)(?:往復|回|日)|([0-9]+)(?:往復|回|日)(?:分|だけ|ほど|くらい)?(?:を)?(?:増|減|足|少なく|多く|追加|多い|少ない|やめ)/);
    const increaseOrDecrease = /増|減|プラス|マイナス|追加|足す|少なく|多く|もう(?:一|[0-9])|あと[0-9]/.test(text);
    const isWork = workScreen || workTrip.test(text) || absolute !== null || relativeCount || increaseOrDecrease || deadlineWords.test(text) || /一宮|定期|料金|運賃/.test(text) || same && key === 'confirm';
    if (!isWork) return null;
    if (groupOrChild(text) || state.hold === 'person' && !/大人(?:1人|ひとり|だけ)|1人で|ひとりで/.test(text))
      return confirm('この運賃比較は大人1人の場合です。お子さまの運賃や複数人の条件を含む場合は購入条件を確認しましょう。','person');
    if (hasPass(text) || state.hold === 'pass' && !/定期(?:券)?(?:は|を|が)?(?:持って(?:い)?ない|持って(?:い)?ません|なし|無し|ない|ありません|期限切れ|切れた)/.test(text))
      return confirm('お持ちの定期券で乗れる区間によって追加運賃が変わります。定期券の有効区間をご確認ください。','pass');
    const source = /一宮/.test(text);
    const target = /名古屋|名駅/.test(text);
    const reversed = /(?:名古屋(?:駅)?|名駅)(?:から|発)|一宮(?:駅)?(?:まで|着|[へに](?:通|行く|変更|$))/.test(text);
    const stationsText = text.replace(/期限(?:を|が)?(?:過ぎて|切れて)から|期限まで|期間まで|[0-9]+(?:往復|回)目から|(?:元の回数|元|[0-9]+(?:往復|回))に戻/g,'');
    const otherPlace = foreignEndpoint(stationsText,fromParticle,workOrigin) || foreignEndpoint(stationsText,toParticle,/(?:名鉄)?名古屋(?:駅)?$|名駅$/);
    const separator = /(?:駅|[一-龯])(?:[―−–—⇄→-])(?:名鉄|[一-龯])/.test(text);
    if (exclusions(text) || reversed || otherPlace || preference(text,/一宮/) < 0 || preference(text,/名古屋|名駅/) < 0 || /(?:栄|伏見|金山|犬山|藤が丘)/.test(text) || separator && !(source && target)
      || state.hold === 'place' && !(source && target))
      return confirm('比較できるのは名鉄一宮から名鉄名古屋へ通う場合です。出発駅と到着駅をもう一度ご指定ください。','place');
    if (deadlineWords.test(text) && !/片道|支払済|購入済|買ってある|もう買った|払戻|払い戻|返金|手数料/.test(text) && !hasPass(text) && !ticketException.test(text) && !privateTransport.test(text)) {
      const late = /期限(?:の|より|を|が|から)?(?:あ?と|あと|後|外|切れ|過ぎ|越|超)|期限切れ|有効期間(?:の|より|を|が)?(?:あと|後|外|過ぎ|越|超)|期間外|60日(?:を|が)?(?:過ぎ|超え|越え)|61日目/.test(text);
      const inside = /期限(?:より|の)?前|期限内|期間内|60日以内/.test(text);
      const allInside = inside && /すべて|全て|全部|全回|みんな|ことごとく/.test(text);
      const returnSome = text.match(/(?:のうち|の内|最後の?|ラストの?|うち)?(\d+)(?:回|往復)(?:分)?(?:だけ|も|を|は|が|とも|分|だけは)*(?:有効)?(?:期限内|期間内|期限(?:より|の)?前|60日以内)/);
      const finalInside = inside && /最後(?:の往復|だけ|も|は|が)|ラスト(?:だけ|も|は|が)/.test(text);
      const onTime = allInside || returnSome || finalInside || /期限(?:を|は)?(?:過ぎない|越えない)|期限(?:の)?後(?:では|じゃ)な/.test(text);
      if (late || onTime) {
        if (!savedCount || (!workScreen && !displayedExample && !state.trainingScope))
          return confirm('期限内と期限後の回数を分けて比べます。名鉄一宮から名鉄名古屋までの合計と、そのうち期限後になる往復回数を教えてください。','expiry');
        const nBefore = text.match(/(?:最後の?|ラストの?|残り(?:の)?|うち(?:の|の最後の)?)?([0-9]+)(?:往復|回)(?:だけ|分|ぶん)?(?:が|は|を|も|だけ|のみ|なら)?(?:有効|利用)?(?:開始)?(?:期限|期間)(?:の|を|より|が)?(?:あ?と|あと|後|外|切れ|過ぎ|越え|超え)/);
        const nAfter = text.match(/(?:期限|期間)(?:の|より)?(?:あと|後|外|切れ後|が過ぎてから)(?:に|が|は|で|になるのは)?([0-9]+)(?:往復|回)/);
        const numbered = text.match(/(\d+)(?:回|往復)目(から|以降|だけ|が|は|も)/);
        let after = null;
        if (allInside) after=0;
        else if (returnSome || finalInside) {
          const moved = returnSome ? Number(returnSome[1]) : 1;
          const before = text.match(/(?:期限|期間)(?:の)?(?:後|あと|外)(?:に|の|だった|になる)?(\d+)(?:回|往復)(?:のうち|の内)/);
          const hadOutside = before ? Number(before[1]) : prior.fare?.afterPeriod || 0;
          if (hadOutside>savedCount || moved>savedCount || before && moved>hadOutside)
            return confirm('予定は'+savedCount+'往復です。変更後、期限より後に残るのは何往復ですか。','expiry',{lastWorkCount:savedCount,trainingScope:true});
          after = Math.max(0,hadOutside-moved);
        }
        else if (onTime) after = 0;
        else if (numbered && Number(numbered[1])<=savedCount && Number(numbered[1])>0)
          after = /から|以降/.test(numbered[2]) ? savedCount-Number(numbered[1])+1 : 1;
        else if (nBefore || nAfter) after = Number((nBefore || nAfter)[1]);
        else if (/最後|ラスト/.test(text)) after = 1;
        if (after===null || after>savedCount)
          return confirm('予定は合計'+savedCount+'往復です。そのうち、期限の後になるのは何往復ですか。','expiry',{lastWorkCount:savedCount,trainingScope:true});
        const previousCount = prior.fare?.previousCount || savedCount;
        const fare = fareCase(savedCount,previousCount,after,after>0?'expiry':previousCount!==savedCount?'delta':'base');
        const reply = after ? '期限内の'+fare.inPeriod+'往復をセット、期限後の'+after+'往復を普通運賃で乗ると合計'+formatYen(fare.bundleTotal)+'です。すべて普通運賃なら'+formatYen(fare.ordinaryTotal)+'です。' : savedCount+'往復すべてが期限内なら、10枚セットは2,800円、毎回普通運賃なら'+formatYen(fare.ordinaryTotal)+'です。';
        return answer('commute/work/'+savedCount,reply,{count:savedCount,fare},'期限内'+fare.inPeriod+'往復・期限後'+after+'往復');
      }
    }
    const periods = [...text.matchAll(/([0-9]+)(か月|ヶ月|カ月|箇月|週間|日間)/g)];
    if (privateTransport.test(text) || ticketException.test(text) || /片道|年(?:間|を通して)|半年|[3-9]か?月|60日(?:以上|超)|有効期限(?:を|が)過ぎ|別々の人|新幹線|バスで|地下鉄|jr(?:で|線)|回数未定|わからない|分からない|[0-9]+円|毎(?:日|週|月)|週間に|月に|のペース/.test(text)
      || periods.some(([,n,unit]) => Number(n) * (unit === '日間' ? 1 : unit === '週間' ? 7 : 30) > 60))
      return confirm('この比較は約60日以内の同一区間の往復が対象です。期間、区間、回数を確認させてください。','period');
    if (state.hold === 'period' && !/60日以内|約60日|2か月以内|2ヶ月以内|1か月|今月/.test(text))
      return confirm('先ほどの利用期間について、約60日以内に何回往復するかを確認させてください。','period');
    const alternatives = text.match(/(\d+)(?:往復|回)?(?:か|または|〜|~|から)(\d+)(?:往復|回)/);
    if (alternatives) {
      const lower = Math.min(Number(alternatives[1]),Number(alternatives[2]));
      const higher = Math.max(Number(alternatives[1]),Number(alternatives[2]));
      if (savedCount===lower && higher===lower+1 && higher<=5 && !prior.fare?.afterPeriod) {
        const fare = fareCase(higher,lower,0,'delta');
        const use = fare.remainingTickets?'残りは'+fare.remainingTickets+'枚です。':'10枚を使い切ります。';
        return answer('commute/work/'+higher,lower+'往復と'+higher+'往復を比べます。10枚セットはどちらも2,800円で、'+higher+'往復なら'+use,{count:higher,fare},lower+'往復と'+higher+'往復を比較');
      }
      return confirm('比べたい回数を一つずつ教えてください。名鉄一宮から名鉄名古屋までの普通運賃と10枚セットを比べます。');
    }
    if (amounts.length) {
      const last = amounts.at(-1);
      const tail = text.slice(last.index + last[0].length).split('、')[0];
      if (/^(?:は|も)?(?:しない|しません|行かない|通わない|ではな|じゃな|でな|以外|以上|以下|未満|前後)/.test(tail))
        return confirm('変更後の合計回数を教えてください。実際に往復する回数に合わせて比較します。');
    }
    let count = absolute;
    const undo = !absolute && prior.fare && /追加(?:分|の予定)?(?:は|を|が)?(?:なし|無し|やめ|取消|取り消)|増(?:えない|やさない)|元(?:の回数)?に戻|増やすの(?:は|を)やめ/.test(text);
    if (undo) count = prior.fare.previousCount;
    else if (relativeCount) {
      if (!savedCount) return confirm('増減する前の回数を確認させてください。名鉄一宮から名鉄名古屋まで、全部で何往復しますか。');
      const delta = Number(relativeCount[1] || relativeCount[2]);
      count = savedCount + (/減|少な|マイナス|やめ/.test(text) ? -delta : delta);
    } else if (increaseOrDecrease && count === null) {
      return confirm('回数の変更ですね。変更後の合計を、往復の回数で教えてください。');
    }
    if (count !== null) {
      if (!Number.isInteger(count) || count < 1 || count > 5) return confirm('この比較で試せるのは1〜5往復です。予定の往復回数を確認させてください。');
      if (!workScreen && !displayedExample && !state.trainingScope && !(source && (target || /研修|仕事|通勤/.test(text))))
        return answer('commute/work','名鉄一宮から名鉄名古屋へ、定期券を持っていない大人1人が通うご予定なら、往復回数を選んでください。');
      const total = count * 2 * 400;
      const difference = Math.abs(total - 2800).toLocaleString('ja-JP');
      const condition = /もし|たら|かも|場合|としたら/.test(text) ? 'なら' : 'では';
      const comparison = count + '往復' + condition + '、' + (total < 2800 ? '毎回普通運賃で乗る方' : '10枚セットの方') + 'が' + difference + '円安くなります。';
      const changed = savedCount && savedCount !== count;
      const late = undo ? 0 : Math.min(count,prior.fare?.afterPeriod || 0);
      const fare = changed ? fareCase(count,savedCount,late,late ? 'expiry' : 'delta') : null;
      const reply = fare?.afterPeriod ? '期限後の'+fare.afterPeriod+'往復を残して合計'+count+'往復に変更すると、セットと普通運賃の併用は'+formatYen(fare.bundleTotal)+'、すべて普通運賃なら'+formatYen(fare.ordinaryTotal)+'です。' : comparison;
      return answer('commute/work/'+count,reply,{count,...(fare?{fare}:{})},changed ? savedCount + '往復 → ' + count + '往復' : '名鉄一宮〜名鉄名古屋・' + count + '往復');
    }
    if (workTrip.test(text) || source)
      return answer('commute/work','名鉄一宮から名鉄名古屋まで、約60日以内に何回往復する予定ですか。');
    return null;
  }
  return Object.freeze({resolve});
})();
