'use strict';

const main = document.querySelector('#main');
const ticketBase = 'https://webticket.meitetsu.co.jp/webticket-user/Product/Detail/';
const towerGuide = 'https://www.nagoya-tv-tower.co.jp/';
const fareGuide = 'https://www.meitetsu.co.jp/plan/campaign/detail/1283199_8034.html';
const schoolGuide = 'https://www.meitetsu.co.jp/train/ticket_fare/ticket/teikiwebyoyaku/index.html';
const cityBusGuide = 'https://ebook.steccorp.co.jp/book/ranranbusguidebook_R8/index.html';
const airportBusGuide = 'https://www.meitetsu-bus.co.jp/airport/limousine/';
const airportRailGuide = 'https://www.meitetsu.co.jp/train/centrair/guidance/index.html';
const scenes = {
  outing: {name:'休日のおでかけ', location:'犬山・栄・長久手', photo:'castle', intro:'今日の午後は空いています。名古屋からひとりで出かけるなら、どこがいい？', question:'どんな午後を過ごしたいですか？', description:'行き先を比べて、過ごし方に合うきっぷを探します。'},
  airport: {name:'セントレアへの行き方', location:'名古屋市内・中部国際空港', photo:'airport', intro:'明日の帰りはセントレアから。空港までどう行けばいい？', question:'どこから空港へ向かいますか？', description:'出発場所や荷物に合わせて、鉄道とバスを案内します。'},
  commute: {name:'通勤・通学のきっぷ', location:'名鉄一宮・名鉄名古屋・東海市', photo:'commute', intro:'これから同じ場所に何度か通います。きっぷをまとめて買う方がいい？', question:'どんな予定で通いますか？', description:'区間・回数・通う人から、きっぷや定期券を選びます。'}
};
const places = {
  castle: {photo:'castle', tab:'お城に入る', short:'犬山城と城下町', place:'犬山', title:'犬山城に入って、城下町へ。', user:'名鉄名古屋から往復して、お城の中にも入りたい。', reason:'城下町を散策して犬山城へ。名鉄名古屋駅から犬山へ往復し、お城にも入るなら、名鉄の乗車券と犬山城の入場券引換がひとつになったきっぷを使えます。', ticket:'犬山城下町きっぷ（CentX版）', price:1840,id:'S20260200004', condition:'中学生以下の設定はありません。1人1端末で利用します。', detail:'設定は2027年2月28日まで。除外日があります。往復の対象区間・入場券の引換方法は商品詳細で確認できます。'},
  city: {photo:'city',tab:'街を見渡す',short:'栄のタワーへ',place:'名古屋・栄',title:'栄で、街並みを展望台から。',user:'市内で過ごしたい。バスで巡って、展望台に上りたい。',reason:'市内をなごやSRTで巡り、中部電力 MIRAI TOWERの通常展望を楽しむプランです。',ticket:'なごやSRT＋展望チケット',price:1700,id:'S20260300025', condition:'大人の料金例。SRTは原則として金・土・日・月・祝日に運行します。',detail:'SRT 1DAYパスと通常展望のセットです。対象日・除外日は商品詳細で確認してください。中学生には専用の商品があります。'},
  park: {photo:'park',tab:'公園で過ごす',short:'長久手の公園',place:'長久手',title:'リニモを降りて、公園を散歩。',user:'外でのんびりしたい。公園まで電車で往復したい。',reason:'藤が丘でリニモに乗り換え、愛・地球博記念公園へ。公園を散策して同じ経路で戻る予定に合います。',ticket:'リニモ往復券',price:800,id:'S20260800001',condition:'藤が丘駅―愛・地球博記念公園駅間の往復運賃です。',detail:'名古屋から藤が丘までの運賃と、有料施設への入場は含まれません。'},
  walk: {photo:'city',tab:'栄で街歩き',short:'栄で地上を散策',place:'名古屋・栄',title:'今日は、栄を歩いてみましょう。',user:'栄で街歩きだけ。展望台には上らないです。',reason:'久屋大通公園からタワー周辺までは、地上を歩いて楽しめます。すでに栄にいて徒歩で過ごすなら、この散策に乗車券や展望券を買う必要はありません。'}
};
const transport = {
  sakae:{tab:'栄からバスで',short:'乗り換えを避けたい',user:'栄のホテルです。荷物が多いので乗り換えたくないです。',from:'伏見・栄の停留所',to:'中部国際空港',photo:'bus',mode:'名鉄空港バスの車両例',title:'乗り換えを避けたいなら、空港バスで。',reason:'荷物を持って乗り換えるのが大変なら、伏見・栄の停留所から空港まで乗り換えずに行けるバスが候補です。お近くの乗り場と出発時刻を確認しましょう。',ticket:'伏見・栄―中部国際空港 片道券',price:2000,id:'T20261000003',condition:'予約はできず、満席時は乗れません。チケットは乗車後、降車までに購入します。',guide:airportBusGuide,guideText:'公式の乗り場・時刻を見る'},
  nagoya:{tab:'名古屋駅から',short:'名鉄電車に乗る',user:'名古屋駅にいます。電車で空港へ行きたいです。',from:'名鉄名古屋駅',to:'中部国際空港駅',photo:'rail',mode:'名鉄電車',title:'名鉄名古屋から、鉄道で空港へ。',reason:'名鉄名古屋駅から中部国際空港駅まで使える片道QRきっぷがあります。列車の時刻を公式案内で確認できます。',ticket:'名鉄名古屋―中部国際空港 片道QRきっぷ',price:980,id:'S20260300019',condition:'特別車を選ぶときは別途、特別車両券が必要です。指定の対応改札で利用します。',guide:airportRailGuide,guideText:'名鉄の空港アクセスを見る'},
  kanayama:{tab:'金山駅から',short:'名鉄電車に乗る',user:'出発は金山駅です。電車で行きます。',from:'金山駅',to:'中部国際空港駅',photo:'rail',mode:'名鉄電車',title:'金山からの片道券があります。',reason:'金山駅から中部国際空港駅まで乗るなら、この区間のQRきっぷを使えます。',ticket:'金山―中部国際空港 片道QRきっぷ',price:910,id:'S20260300018',condition:'特別車には別途、特別車両券が必要です。金山駅は中央・西口の対応改札が対象です。',guide:airportRailGuide,guideText:'名鉄の空港アクセスを見る'}
};
const yen = value => `${value.toLocaleString('ja-JP')}円`;

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const parts = route => route.split('/');
const routeNow = () => location.hash.slice(1).split('?')[0];
const sceneNow = () => parts(routeNow())[0] || 'home';
function parsePath() {
  const [scene = '',key = '',detail = ''] = parts(routeNow());
  return {scene: Object.hasOwn(scenes,scene) || scene==='home' ? scene : '',key,detail};
}
const symbols = {
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  back:'<path d="m15 5-7 7 7 7"/>',
  external:'<path d="M7 17 17 7M7 7h10v10"/>',
  send:'<path d="M12 19V5m-6 6 6-6 6 6"/>',
  outing:'<path d="M2 19h20M3 18l6-10 5 7 2-3 5 6"/><circle cx="16.5" cy="6.5" r="2.5"/>',
  airport:'<path d="m21 4-7 7-1 8-2 1-1-7-5 2-2-1 5-4-5-4 2-1 7 3 6-5c2-1 4-1 3 1Z"/>',
  commute:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Z"/><path d="M15 7v2m0 2v2m0 2v2"/>',
  train:'<rect x="5.5" y="3" width="13" height="15" rx="3"/><path d="M6 8h12M6 12h12M9 18l-3 3m9-3 3 3M8 20h8"/><path d="M9 15h.1m5.9 0h.1"/>',
  bus:'<rect x="3" y="5" width="18" height="13" rx="3"/><path d="M4 8h16M4 13h16M9 8v5m5-5v5M7 18v2m10-2v2M6.5 15.5h.5m10 0h.5"/>',
  controls:'<path d="M4 7h4m4 0h8M4 17h8m4 0h4"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/>',
  history:'<path d="M3 12a9 9 0 1 0 2.5-6M3 4v5h5m4-2v5l3 2"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  fork:'<path d="M6 20v-5c0-3 2-5 6-5h6m-3-3 3 3-3 3M6 4v5"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  turn:'<path d="M19 5v7a2 2 0 0 1-2 2H5m5-5-5 5 5 5"/>'
};
const icon = (name,size=20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name] || ''}</svg>`;
const imageAlt={castle:'犬山城の天守',city:'中部電力 MIRAI TOWERとオアシス21',park:'愛・地球博記念公園の観覧車',commute:'赤い名鉄電車',airport:'中部国際空港',station:'名鉄一宮駅のホーム',bus:'名鉄空港バスの車両例',rail:'中部国際空港駅のホーム'};
const photo = (key,alt=imageAlt[key]) => `<img src="assets/${key}.webp" alt="${escapeHtml(alt)}">`;
const nav = (route,label,style='small-choice',attrs='') => `<a href="#${route}" data-route="${route}" class="${style}" ${attrs}>${label}</a>`;
const external = (url,label,primary=false) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${primary?'cta':'text-link'}">${label} ${icon('external',16)}</a>`;
const chips = entries => `<div class="context" aria-label="現在の条件">${entries.filter(Boolean).map(s=>`<span>${escapeHtml(s)}</span>`).join('')}</div>`;
const money = n => `<strong class="money">${n.toLocaleString('ja-JP')}<small>円</small></strong>`;
const homePrompts = {
  outing:'名古屋から半日、どこに行こう？',
  airport:'栄のホテルからセントレアへ行きたい',
  commute:'一宮から名古屋へ、研修で4往復したい'
};
const initials={outing:'半日でどこかに行きたい。まだ行き先は決めてない',airport:homePrompts.airport,commute:homePrompts.commute};
const fallbackExample={home:'名古屋から半日出かけたい',outing:'やっぱり近場で過ごしたい',airport:'やっぱり金山から電車で',commute:'一宮から研修で3往復します'};
const titles={outing:'休日のおでかけ',airport:'空港への行き方',commute:'通うときのきっぷ',home:'相談内容の確認'};
const travelMemory = new Map();
let serial = 0;
const currentRecord=()=>travelMemory.get(history.state?.consultation) || {turns:[],context:restoreCardContext(routeNow()),carry:''};
const schoolOptions=[['bus','らんらんバスで高校へ','東海市の全線定期'],['child','らんらんバスで小学校へ','小学生以下の運賃'],['train','名鉄電車で高校へ','新規の通学定期']];
const destinationWords={castle:'犬山城に入りたい',city:'SRTで巡って展望台へ',park:'公園でのんびりしたい',walk:'栄を徒歩で散策したい','sakae-plan':'栄で街を見下ろしたい',tower:'展望台だけに行きたい'};
const decisionFor=route=>{
  const [scene,key,detail]=parts(route);
  if(scene==='outing')return destinationWords[key] || homePrompts.outing;
  if(scene==='airport')return detail==='seat'?'座席を指定したい':transport[key]?.user || homePrompts.airport;
  if(scene==='commute'){
    if(key==='work')return detail?detail+'往復する予定です。':'一宮から名古屋へ、研修で通います。';
    if(key==='school')return schoolOptions.find(([id])=>id===detail)?.[1] || '学校へ通いたい';
    return homePrompts.commute;
  }
  return '';
};
function promptRows(){
  return Object.entries(homePrompts).map(([scene,label])=>nav(scene,`<span class="entry-icon ${scene}">${icon(scene,23)}</span><b>${label}</b>${icon('arrow',18)}`,'entry-row')).join('');
}
function inputForm(example,isHome=false) {
  return `<form id="input-form" class="composer ${isHome?'home-composer':''}" autocomplete="off"><label class="sr-only" for="trip-input">相談したいことを入力</label><div class="compose-controls">${isHome?voiceControls(true):''}<div class="input-shell"><input id="trip-input" name="request" type="text" maxlength="90" enterkeyhint="send" autocomplete="off" placeholder="${escapeHtml(isHome?'希望を文字で入力':'例　'+example)}">${isHome?'':voiceControls()}<button class="send" type="submit" aria-label="送信">${icon('send',21)}</button></div></div><span data-voice-status role="status"></span><p hidden id="input-status" class="input-error" role="status"></p></form>`;
}
function home(){
  return `<div class="home"><div class="home-poster"><img src="assets/rail-journey.webp" alt="川を渡る赤い電車と、山並みに囲まれた名鉄沿線を描いた旅のイラスト" fetchpriority="high"></div><div class="home-content"><div class="home-heading"><p class="home-location"><i aria-hidden="true"></i>名古屋・名鉄沿線</p><h1>今日は、<br class="desktop-br">どちらへ？</h1><p class="home-intro">行き先も、乗り方も。<br class="desktop-br">旅の希望を聞かせてください。</p></div><div class="home-actions">${inputForm('',true)}<p class="prompt-label">相談の例</p><div class="entry-list" aria-label="相談の例">${promptRows()}</div></div></div><footer class="home-footer"><span>LINE公式アカウント AIモード 体験デモ</span><a href="credits.html">写真のクレジット</a></footer></div>`;
}
function chooseRows(rows){
  return `<div class="choices choice-list">${rows.map(([route,label,detail,symbol])=>nav(route,`${symbol?`<span class="list-icon">${icon(symbol)}</span>`:''}<span><b>${label}</b><small>${detail}</small></span>${icon('chevron',16)}`,'tile')).join('')}</div>`;
}
function question(title,subtitle='',children=''){
  return `<div class="question"><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${children}`;
}
function alternatives(label,items){
  return `<div class="alternatives"><b>${label}</b><div>${items.join('')}</div></div>`;
}
function ticket(item){
  return `<section class="ticket"><div class="ticket-stub">${icon('commute',23)}<span>きっぷ</span></div><div class="ticket-main"><div class="ticket-heading"><b>${item.ticket}</b>${money(item.price)}</div><p>${item.condition}</p>${item.detail?`<details class="travel-details"><summary>利用条件を詳しく見る</summary><p>${item.detail}</p></details>`:''}<div class="ticket-cta">${external(ticketBase+item.id,'CentXで券の詳細を見る',true)}</div></div></section>`;
}
function suggestedTrips(){
  const trips=[
    ['outing/castle','castle','犬山','城下町を歩いて、お城へ'],
    ['outing/sakae-plan','city','栄','展望台から街を見渡す'],
    ['outing/park','park','長久手','リニモに乗って公園へ']
  ];
  return `<div class="choices destinations">${trips.map(([route,key,name,activity],i)=>nav(route,`<div class="destination-photo">${photo(key)}<span>${icon('arrow',18)}</span></div><b>${name}</b><small>${activity}</small>`,'tile destination',`style="--sequence:${i}"`)).join('')}</div><div class="walk-alternative">${nav('outing/walk',`栄で、きっぷを買わずに街歩き ${icon('arrow',15)}`,'text-link')}</div>`;
}

const companyPlaces={
  inuyama:{label:'犬山',photo:'castle',meal:['城下町で昼食','町家の和食やカフェを、犬山市観光協会の店一覧から探せます。','https://inuyama.gr.jp/gourmet/','犬山の食事処を見る'],facility:['お城の階段を確かめる','天守内にはエレベーターがなく、車いすでは天守内を見学できません。','https://inuyama-castle.jp/faq/','犬山城の利用案内を見る']},
  sakae:{label:'栄',photo:'city',meal:['オアシス21で昼食','栄の中心で、レストランやカフェを選べます。','https://www.sakaepark.co.jp/shops/','オアシス21の店舗を見る'],facility:['タワー3階でひと休み','中部電力 MIRAI TOWERのカフェから、久屋大通公園を眺められます。','https://www.nagoya-tv-tower.co.jp/floor/f3.html','タワー3階のカフェを見る']},
  park:{label:'長久手',photo:'park',meal:['公園で昼食','愛・地球博記念公園の飲食店と売店を確認できます。','https://www.aichi-koen.com/moricoro/riyouannai/shop/','公園の飲食店を見る'],facility:['園内の休憩所を探す','施設紹介で、休憩所の位置や利用案内を確認できます。','https://www.aichi-koen.com/moricoro/shisetsu/','公園の施設を見る']}
};
function companyView(c){
  const place=companyPlaces[c.place];
  const withWho=[c.child?(c.age!=null?c.age+'歳のお子さまと':c.grade?c.grade+'のお子さまと':'お子さまと'):'',c.elder?'年配の方と':'',c.people?c.people+'人':''].filter(Boolean);
  const terms=[c.day || '',c.halfDay?'半日':'',...withWho,c.rain?'雨の場合':'',c.meal?'昼食あり':'',c.walkMinutes!=null?'歩く時間は'+c.walkMinutes+'分まで':c.access?'歩く負担に配慮':''];
  const use=(said)=>`<button class="small-choice" type="button" data-say="${said}">${said}</button>`;
  if(!place)return `<div class="company-planner">${chips(terms)}${question('どこで過ごしましょうか？','同行する方に合わせて、立ち寄り先や食事を選べます。')}<div class="company-switch">${['犬山に行きたい','栄に変更','長久手の公園に行きたい'].map(use).join('')}</div></div>`;
  const title=place.label+'で'+(c.halfDay?'過ごす半日':'のおでかけ');
  const selections=c.meal&&!(c.rain||c.access||c.elder)?[place.meal]:c.meal?[place.meal,place.facility]:[place.facility];
  const steps=selections.map(([name,body,url,label])=>`<div class="family-stop"><h2>${name}</h2><p>${body}</p>${external(url,label)}</div>`).join('');
  return `<section class="company-planner">${chips(terms)}${question(title,'一緒に行く方の希望に合わせて、立ち寄り先を選べます。')}<div class="company-board"><figure>${photo(place.photo)}<figcaption>${icon('pin',13)}${place.label}</figcaption></figure><div class="family-stops">${steps}</div></div></section>`;
}


function outingView(key){
  if(!key || key==='inuyama-plan')return inuyamaDayView(currentRecord().context,!key);
  if(key==='with-company')return companyView(currentRecord().context.company || {});
  if(key==='sakae-plan'){
    return question('栄では、どう過ごしますか？','展望台に入るか、なごやSRTにも乗るかで、きっぷが変わります。',`<div class="sakae-layout"><figure>${photo('city')}<figcaption>中部電力 MIRAI TOWER</figcaption></figure>${chooseRows([['outing/city','SRTと展望台を楽しむ','市内を巡って通常展望へ'],['outing/tower','展望台だけに行く','SRTは利用しない'],['outing/walk','栄を歩いて回る','タワー周辺を地上から楽しむ']])}</div>`);
  }
  const tower=key==='tower';
  if(!tower && !Object.hasOwn(places,key))return question('どんな午後にしますか？','名古屋から半日、大人ひとりで楽しめる行き先です。',suggestedTrips());
  const item=tower?{photo:'city',place:'名古屋・栄',title:'栄のタワーで、街を一望。',reason:'中部電力 MIRAI TOWERの通常展望を楽しむなら、施設の公式サイトで営業時間と入場方法を確認できます。'}:places[key];
  const more=Object.entries(places).filter(([id])=>id!==key).map(([id,p])=>nav(id==='city'?'outing/sakae-plan':'outing/'+id,p.tab));
  if(tower)more.unshift(nav('outing/sakae-plan','栄での過ごし方'));
  return `<article class="rec outing-result"><div class="place-presentation"><figure>${photo(item.photo)}<figcaption>${icon('pin',13)}${item.place}</figcaption></figure><div>${chips(['名古屋から','半日','大人1人'])}<h1>${item.title}</h1><p class="reason">${item.reason}</p>${tower?external(towerGuide,'MIRAI TOWERの公式案内を見る'):''}</div></div>${item.id?ticket(item):''}</article>${alternatives('行き先を変える',more)}`;
}


const arrivalLabels={sakae:'伏見・栄からバス',nagoya:'名鉄名古屋から電車',kanayama:'金山から電車'};
function airportView(key,modifier){
  if(key==='seat-options')return airportSeatOptions();
  if(modifier==='ready'&&['nagoya','kanayama'].includes(key))return airportReadyView(key,currentRecord().context);
  const isExample=!key;
  if(isExample)key='sakae';
  if(!Object.hasOwn(transport,key)){
    return question('どこから空港へ向かいますか？','出発地に合う電車やバス、乗車前に確かめたいことをご案内します。',`<div class="airport-choices">${chooseRows([['airport/sakae','伏見・栄のホテルから','荷物を持って、乗り換えずに','bus'],['airport/nagoya','名古屋駅から','名鉄電車で空港へ','train'],['airport/kanayama','金山駅から','名鉄電車で空港へ','train']])}<figure>${photo('airport')}<figcaption>中部国際空港（セントレア）</figcaption></figure></div>`);
  }
  const p=transport[key],bus=key==='sakae',seat=!bus&&modifier==='seat';
  const alternativesFrom=Object.entries(transport).filter(([id])=>id!==key).map(([id,x])=>nav('airport/'+id,x.tab));
  if(!bus)alternativesFrom.push(nav('airport/'+key+(seat?'':'/seat'),seat?'普通車に戻す':'座席を指定したい'));
  const plan=currentRecord().plan;
  const onward=plan?.combined
    ?nav(plan.outing || 'outing',`今日の午後の相談へ ${icon('arrow',18)}`,'onward','data-handoff="airport"')
    :nav('outing',`<span>帰りは分かった。<b>今日、半日ならどこへ？</b></span>${icon('arrow',19)}`,'onward','data-handoff="airport"');
  return `<article class="rec airport-result">${isExample?'<div class="case-line">栄・伏見から出発する場合</div>':''}<h1>${bus?'栄から空港へ、バスで直通。':(key==='nagoya'?'名鉄名古屋':'金山')+'から、電車で空港へ。'}</h1><p class="reason">${bus?'荷物が多いときも、乗り換えずにセントレアまで行けます。':seat?'座席を指定する場合は、乗車券に加えて特別車両券（ミューチケット）を用意します。':'中部国際空港駅まで、この区間の片道QRきっぷが使えます。'}</p><div class="route-board"><div class="route-mode">${icon(bus?'bus':'train',18)}${bus?'名鉄空港バス':'名鉄電車'}</div><div class="route-content"><div class="route-stations"><div class="station"><span>出発</span><b>${p.from}</b></div><i class="route-line"></i><div class="station"><span>到着</span><b>${p.to}</b></div></div><div class="route-price"><span>大人・片道</span>${money(p.price)}</div></div></div><div class="boarding"><div><h2>乗る前に</h2><p>${p.condition}${seat?' 対象列車・空席は公式案内で確認できます。':''}</p></div><div class="flight-links">${external(p.guide,p.guideText)}${external(ticketBase+p.id,'CentXで片道券を見る',true)}</div></div></article>${alternatives('出発地・座席を変える',alternativesFrom)}${onward}`;
}
function workView(detail){
  const valid=/^[1-5]$/.test(detail);
  if(!valid)return question('研修には、何回往復しますか？','名鉄一宮から名鉄名古屋まで、約60日間に通う例です。',`<div class="work-setup">${chips(['大人1人','定期券なし'])}<div class="setup-stations">名鉄一宮 <span aria-hidden="true">⇄</span> 名鉄名古屋</div><div class="count-options">${[1,2,3,4,5].map(n=>nav('commute/work/'+n,`<b>${n}</b>往復`,'count-option')).join('')}</div></div>`);
  return fareWorkbench(Number(detail),currentRecord().context);
}
function schoolView(key){
  const step=currentRecord().context.schoolStep;
  if(key==='train'&&['prepare','collect'].includes(step))return schoolBookingView(step);
  const condition=schoolOptions.find(([k])=>k===key);
  if(!condition)return question('通学に使うのは、どの路線ですか？','通う人の学齢に合わせて、ご案内します。',chooseRows(schoolOptions.map(([id,label,detail])=>['commute/school/'+id,label,detail,id==='train'?'train':'bus'])));
  const train=key==='train',child=key==='child';
  const title=train?'通学定期は、専用の予約サービスへ。':child?'小学生は、らんらんバスが無料です。':'らんらんバスは、共通の全線定期で。';
  const reason=train?'対象のmanaca定期券は専用Webサービスで予約できます。新規の通学定期は学校の証明書類を提出し、審査の後に駅の対応券売機などで購入します。':child?'東海市のらんらんバスは小学生以下の運賃が無料です。この通学に定期券を買う必要はありません。':'通勤・通学共通の全線定期を使えます。1か月定期はCentXで購入できます。1乗車の普通運賃は100円です。';
  const link=train?external(schoolGuide,'名鉄の通学定期の手続きへ',true):child?external(cityBusGuide,'東海市のバスガイドを見る',true):external(ticketBase+'T20260300107','CentXで1か月定期を見る',true);
  return `<article class="school-result">${chips([train?'名鉄電車':'東海市・らんらんバス',child?'小学生':'高校生'])}<h1>${title}</h1><p class="reason">${reason}</p>${!train&&!child?`<div class="school-fare"><span>1か月定期</span>${money(2000)}</div>`:''}${link}</article>${alternatives('通い方を変える',[...schoolOptions.filter(([id])=>id!==key).map(([id,label])=>nav('commute/school/'+id,label)),nav('commute/work','研修で通う')])}`;
}
function commuteView(key,detail){
  if(!key)return fareWorkbench(4,currentRecord().context,true);
  if(key==='work')return workView(detail);
  if(key==='school')return schoolView(detail);
  return question('どんな予定で通いますか？','研修は通う回数から、通学は使う路線と学齢から、買い方を選べます。',chooseRows([['commute/work','ときどき研修へ','名鉄一宮 ⇄ 名鉄名古屋／定期券を持たない大人1人','commute'],['commute/school','学校へ通いたい','東海市のらんらんバス・名鉄電車','train']]));
}
const guidance={
  home:'名古屋周辺のおでかけ、空港への移動、通うときのきっぷについて相談できます。',
  outing:'名古屋から半日、大人1人で出かける例を案内できます。近い希望を選んでください。',
  airport:'名古屋からセントレアに向かう3通りを案内できます。出発場所と交通手段を選んでください。',
  commute:'研修は名鉄一宮から名鉄名古屋へ通う場合です。通学は利用する路線と学齢をご確認ください。'
};
function choiceSet(scene){
  if(scene==='outing')return [['outing/castle','犬山城に入りたい','名鉄名古屋から往復'],['outing/sakae-plan','栄で街を見下ろしたい','展望台と交通手段を選ぶ'],['outing/park','公園まで電車で往復','藤が丘からリニモ'],['outing/walk','栄で街歩きだけ','地上を歩いて散策']];
  if(scene==='airport')return [['airport/sakae','伏見・栄からバス','乗り換えずに空港へ','bus'],['airport/nagoya','名鉄名古屋から電車','中部国際空港駅まで','train'],['airport/kanayama','金山から電車','中部国際空港駅まで','train']];
  if(scene==='commute')return [['commute/work','研修で通う','名鉄一宮 ⇄ 名鉄名古屋','commute'],['commute/school','学校へ通う','路線と学齢を選ぶ','train']];
  return [];
}
function clarification(scene){
  const context=currentRecord().context || {},hold=context.hold || '';
  if(scene==='outing' && hold==='townOnly'){
    return `<section class="clarification">${question('犬山の城下町を歩く午後。','城下町で散策や食事を楽しむなら、犬山市観光協会の案内で立ち寄り先を探せます。')}<div class="scope-actions">${external('https://inuyama.gr.jp/gourmet/','城下町の食事処を見る')}</div></section>`;
  }
  if(scene==='airport' && hold==='schedule'){
    const origin=transport[context.lastOrigin],bus=context.lastOrigin==='sakae';
    const route=origin?origin.from+' → '+origin.to:'市内 → 中部国際空港';
    const links=origin?external(bus?airportBusGuide:'https://www.meitetsu.co.jp/train/timetable/index.html',bus?'名鉄バスの乗り場・時刻を調べる':'名鉄の列車時刻を調べる',true):external(airportRailGuide,'名鉄の空港アクセスを見る',true)+external(airportBusGuide,'名鉄バスの時刻を見る');
    return `<section class="clarification schedule-check">${question('乗る便に合わせて、時刻を確認。','公式の時刻表で、当日の出発時刻と空港到着時刻を確認できます。')}<div class="schedule-stop">${icon(bus?'bus':'train',19)}<b>${route}</b>${context.flightTime?`<span>搭乗予定　${escapeHtml(context.flightTime)}の便</span>`:''}</div><div class="scope-actions">${links}</div></section>${nav('outing','続けて、今日の午後も相談する '+icon('arrow',16),'onward','data-handoff')}`;
  }
  if(scene==='outing' && hold==='castlePlan'){
    return `<section class="clarification">${question('犬山城の中にも入りますか？','城下町を歩くか、天守にも入るかで、きっぷが変わります。')}<div class="scope-actions"><button class="small-choice" type="button" data-say="名鉄名古屋から往復して、犬山城の中にも入りたい">名鉄名古屋から往復して、犬山城の中にも入りたい</button></div></section>`;
  }
  if(['person','personKnown','access','accessKnown'].includes(hold)){
    const settled=hold.endsWith('Known');
    const title=settled?'利用条件を確認しましょう':hold==='access'?'移動で気になることは？':'利用する方について';
    const guide=scene==='airport'?external(airportRailGuide,'名鉄の空港アクセスを見る'):external('https://www.meitetsu.co.jp/train/','名鉄の公式案内を見る');
    return `<section class="clarification">${question(title,'利用する方の条件を確認します。')}<div class="scope-actions">${guide}${nav(scene,'大人1人の例で相談し直す','small-choice','data-reset-scope')}</div></section>`;
  }
  return `<section class="clarification">${question('ご希望の条件を確認します。',guidance[scene]||guidance.home,scene==='home'?`<div class="entry-list">${promptRows()}</div>`:chooseRows(choiceSet(scene)))}</section>`;
}


function defaultLine(route){
  const [scene,key,detail]=parts(route);
  if(key==='inuyama-plan')return '犬山で過ごす午後の順番を考えたい';
  if(key==='seat-options')return seatComparison;
  if(detail==='ready')return '空港へ行く前に必要なものを確認したい';
  if(key==='confirm')return '';
  if(!key)return initials[scene] || '';
  if(scene==='outing')return key==='tower'?'展望台だけに行きます。SRTは使いません。':places[key]?.user || destinationWords[key];
  if(scene==='airport')return detail==='seat'?'電車の座席は指定できますか？':transport[key]?.user || '';
  return decisionFor(route);
}
function summaryFor(route){
  const [scene,key,detail]=parts(route);
  if(key==='confirm')return '希望に近い条件を確認します。';
  if(!key)return {outing:'犬山の城下町で昼食をとり、午後は犬山城へ向かう半日案です。',airport:'栄・伏見からはセントレアまで直通の空港バスで移動できます。',commute:'名鉄一宮から名鉄名古屋へ4往復する例は、10枚セットが400円安くなります。'}[scene]||'相談内容を確認します。';
  if(key==='inuyama-plan')return '希望に合わせて、犬山を訪れる行程を組みました。';
  if(key==='seat-options')return '空港バスは先着順。名鉄名古屋からの特別車なら事前に列車と座席を指定できます。';
  if(detail==='ready')return '空港駅まで乗るためのきっぷを、出発前のリストで確認できます。';
  if(scene==='airport')return transport[key]?(arrivalLabels[key]+'で空港へ。大人片道'+yen(transport[key].price)+'です。'):scenes.airport.question;
  if(scene==='outing')return places[key]?.title || (key==='tower'?'展望台だけのご案内です。':key==='sakae-plan'?'栄での過ごし方を選べます。':scenes.outing.question);
  if(scene==='commute' && key==='work')return detail?(Number(detail)<=3?'普通運賃':'10枚セット')+'の方がお得です。':'約60日間で何回往復しますか？';
  if(scene==='commute' && key==='school')return (schoolOptions.find(([id])=>detail===id)?.[1] || '通学の路線と学齢')+'をご案内します。';
  return scenes[scene]?.question || 'どんな相談をしましょうか？';
}
const visibleTurns = () => {
  const r=currentRecord();
  if(r.turns.length)return r.turns;
  const text=defaultLine(routeNow());
  return text?[{said:text,reply:summaryFor(routeNow())}]:[];
};
function planAfter(prior,from,to,handoff){
  const [oldScene,oldKey]=parts(from),[scene,key]=parts(to);
  if(!['outing','airport'].includes(scene))return null;
  if(!from || !['outing','airport'].includes(oldScene))return {airport:scene==='airport'&&transport[key]?key:'',outing:'',combined:false};
  const plan={airport:oldScene==='airport'&&transport[oldKey]?oldKey:'',outing:'',combined:false,...prior};
  if(handoff && !plan.airport && ['','seat-options'].includes(oldKey) && oldScene==='airport')plan.airport='sakae';
  if(handoff && plan.airport)plan.combined=true;
  if(scene==='airport'&&Object.hasOwn(transport,key))plan.airport=key;
  if(scene==='outing'&&(Object.hasOwn(places,key)||key==='tower'))plan.outing=to;
  return plan;
}
function itinerary(plan){
  if(!plan?.combined)return '';
  const outing=parts(plan.outing||'')[1],when=plan.outingName || (outing?(places[outing]?.short || '栄で展望台へ'):'行き先を選ぶ');
  return `<section class="itinerary" aria-label="相談中の旅程"><b>${icon('fork',16)}相談中の旅程</b><div>${nav('outing',`<small>今日の午後</small><strong>${when}</strong>${icon('chevron',13)}`,'plan-stop','data-plan-edit="outing"')}${nav('airport',`<small>明日の空港</small><strong>${arrivalLabels[plan.airport]}${plan.checkSchedule?'・時刻確認':''}</strong>${icon('chevron',13)}`,'plan-stop carry','data-plan-edit="airport"')}</div></section>`;
}
function quickSuggestions(route){
  const nextReply=cardQuickReply(route,currentRecord().context);
  if(nextReply)return [nextReply];
  const [scene,key,detail]=parts(route);
  if(key==='confirm')return [];
  if(scene==='outing'&&!key)return ['もし雨だったら？'];
  if(!key)return [];
  if(scene==='outing'){
    if(key==='with-company'){
      const c=currentRecord().context.company || {};
      return [!c.rain?'雨でも楽しめるところは？':!c.meal?'昼ごはんも食べたい':'',c.place==='sakae'?'犬山に変えたい':'やっぱり栄に変更'].filter(Boolean);
    }
    if(key==='castle'||key==='park')return ['やっぱり近場で','もし雨だったら？'];
    if(key==='sakae-plan')return ['展望台だけにしたい'];
    if(key==='tower'||key==='walk')return ['じゃあSRTで行く'];
    return ['SRTは使わない'];
  }
  if(scene==='airport')return key==='sakae'?['金山から電車で空港へ']:detail==='seat'?['栄からセントレアへ。荷物が多いんです']:['座席を指定したい'];
  if(scene==='commute'&&key==='work'&&detail)return Number(detail)<5?['もう1日通うかも']:['予定が変わって4往復です'];
  if(scene==='commute'&&key==='school')return detail==='train'?['高校生で、らんらんバスを使う']:['名鉄電車で高校に通います'];
  return [];
}
function voiceControls(isHome=false){
  return `<button type="button" data-voice hidden class="voice-button ${isHome?'home-voice':''}" aria-label="音声で入力"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-3 0h6"/></svg>${isHome?'<span>話して相談</span>':''}</button>`;
}
const speakControl=`<button type="button" data-speak hidden class="speak-button" aria-label="返答を読み上げる"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3Z"/><path d="M16 9a4.5 4.5 0 0 1 0 6m2.5-9a8 8 0 0 1 0 12"/></svg></button>`;
function renderShell(){
  main.innerHTML=`<div class="workbench"><div class="workspace-head"><nav class="breadcrumbs" aria-label="現在の相談">${nav('',`${icon('back',14)}相談一覧`,'back')}<span class="crumb-slash" aria-hidden="true">/</span><b id="topic-name"></b></nav><button type="button" class="history-control" data-tool="history">${icon('history',15)}履歴</button></div><div class="stream" id="stream"><div class="session-body"><div id="plan-slot"></div><div id="turn-slot"></div><div id="answer"></div></div></div><div class="composer-band"><div class="composer-inner"><div id="quick-replies"></div><div class="composer-line"><button class="changes" type="button" data-tool="choices">${icon('controls',17)}<span>条件を変える</span></button>${inputForm('希望を入力')}</div></div></div></div>`;
}
function render(moveFocus=false){
  const route=routeNow(),{scene,key,detail}=parsePath();
  document.body.dataset.rendered=route;
  document.body.classList.toggle('in-conversation',Boolean(scene));
  if(!scene){
    main.innerHTML=home();document.title='名鉄沿線のおでかけ相談｜AIモード 体験デモ';
    if(moveFocus){main.focus({preventScroll:true});window.scrollTo(0,0);}
    return;
  }
  const oldCards=captureCardLayout();
  if(!main.querySelector('.workbench'))renderShell();
  const record=currentRecord(),latest=visibleTurns().at(-1)||{},answer=document.querySelector('#answer');
  document.title=`${titles[scene]}｜名鉄沿線のおでかけ相談`;
  document.querySelector('#topic-name').textContent=titles[scene];
  document.querySelector('#plan-slot').innerHTML=itinerary(record.plan);
  document.querySelector('#turn-slot').innerHTML=latest.said?`<div class="exchange"><span class="user-line">${escapeHtml(latest.said)}</span></div>`:'';
  const view=key==='confirm'?clarification(scene):scene==='outing'?outingView(key):scene==='airport'?airportView(key,detail):commuteView(key,detail);
  const feedback=latest.change?`<div class="update-note"><b>${icon('fork',14)}${escapeHtml(latest.change)}</b></div>`:'';
  answer.innerHTML=`<div class="answer-content">${feedback}${view}</div>`;
  const bridgeSlot=answer.querySelector('.question>p, .reason, .fare-conclusion>b');
  if(latest.bridge && bridgeSlot)bridgeSlot.textContent=latest.bridge;
  const title=answer.querySelector('h1');
  if(title){
    const voiceText=(latest.bridge && bridgeSlot) || answer.querySelector('.reason') || title;
    voiceText.dataset.voiceReply='';
    title.insertAdjacentHTML('afterend',speakControl);
    const wrap=document.createElement('div');
    wrap.className='answer-title';
    title.before(wrap);
    wrap.append(title,title.nextElementSibling);
    title.tabIndex=-1;
  }
  const quick=quickSuggestions(route);
  document.querySelector('#quick-replies').innerHTML=quick.length?`<div class="replies"><span>続けて聞く</span>${quick.map(s=>`<button type="button" data-say="${escapeHtml(s)}">${escapeHtml(s)} ${icon('turn',13)}</button>`).join('')}</div>`:'';
  const field=document.querySelector('#trip-input');
  field.value='';
  field.placeholder=quick.length?'ほかの希望を伝える':key==='confirm'?'条件を入力する':'例　'+fallbackExample[scene];
  document.querySelector('#input-status').hidden=true;
  document.querySelector('.history-control').hidden=!latest.said;
  if(moveFocus){title?.focus({preventScroll:true});document.querySelector('#stream').scrollTop=0;window.scrollTo(0,0);}
  animateCardEdit(oldCards);
  const live=document.querySelector('#live-status');live.textContent=latest.change?latest.change+'。'+(title?.textContent || ''):(title?.textContent || '');
}
function knownChange(before,after){
  const [scene,key,detail]=parts(after),[oldScene,oldKey,oldDetail]=parts(before);
  if(oldScene!==scene)return '';
  if(scene==='commute'&&key==='work'&&oldKey==='work'&&detail&&oldDetail&&detail!==oldDetail)return `${oldDetail}往復 → ${detail}往復`;
  if(scene==='airport'&&transport[oldKey]&&transport[key]&&oldKey!==key)return `${arrivalLabels[oldKey]} → ${arrivalLabels[key]}`;
  if(scene==='outing'&&destinationWords[oldKey]&&destinationWords[key]&&oldKey!==key){
    const label=k=>k==='sakae-plan'?'名古屋・栄':k==='tower'?'展望台のみ':places[k]?.short || k;
    return label(oldKey)+' → '+label(key);
  }
  return '';
}
function animateChange(before,after){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const [oldScene,oldKey,oldDetail]=parts(before),[scene,key,detail]=parts(after);
  if(scene==='commute'&&oldScene===scene&&key==='work'&&oldKey===key&&/^[1-5]$/.test(oldDetail)&&/^[1-5]$/.test(detail)&&oldDetail!==detail){
    const fill=document.querySelector('.fare-track i');
    fill?.animate([{width:(Number(oldDetail)*20)+'%'},{width:(Number(detail)*20)+'%'}],{duration:460,easing:'cubic-bezier(.2,.7,.3,1)'});
    if((Number(oldDetail)>3)!==(Number(detail)>3)){
      document.querySelector('.fare-item.winner')?.animate([{backgroundColor:'#cee3be'},{backgroundColor:'#e6efdf'}],{duration:700});
    }
  }
  if(scene==='airport'&&oldScene===scene&&transport[key]&&transport[oldKey]&&oldKey!==key){
    document.querySelector('.route-price .money')?.animate([{opacity:.1,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:360});
  }
}
function navigate(route,{said='',handoff=false,resolution=null,planEdit=false}={}){
  const before=routeNow(),prior=currentRecord(),[scene,key,detail]=parts(route);
  if(!route){
    if(route!==before)history.pushState({},'',location.pathname+location.search);
    render(true);return;
  }
  const value=said || (planEdit?(scene==='airport'?'明日の空港への行き方を選び直す':'今日の午後の行き先を選び直す'):handoff?'帰りは分かった。今日、半日ならどこへ？':decisionFor(route));
  const existing=before?visibleTurns():[];
  const changed=knownChange(before,route);
  const change=resolution?.change || changed;
  const reply=resolution?.reply || summaryFor(route);
  const entry={said:value,reply,bridge:resolution?.reply || '',change};
  const next={
    plan:planAfter(prior.plan,before,route,handoff),
    context:{...(resolution?.context || {}),route,scene,key,detail},
    turns:[...existing,entry].filter(t=>t.said)
  };
  if(next.plan && scene==='airport' && key==='confirm' && Object.hasOwn(transport,next.context.lastOrigin)){
    next.plan.airport=next.context.lastOrigin;
    next.plan.checkSchedule=next.context.hold==='schedule';
  }
  if(next.plan && scene==='airport' && Object.hasOwn(transport,key))next.plan.checkSchedule=false;
  if(next.plan && scene==='outing' && key==='confirm'){
    if(handoff && !resolution && next.plan.pendingContext)Object.assign(next.context,next.plan.pendingContext);
    if(next.context.hold==='castlePlan' || next.context.hold==='townOnly'){
      next.plan.outing=route;
      next.plan.outingName=next.context.hold==='castlePlan'?'犬山（入場を確認中）':'犬山の城下町';
      next.plan.pendingContext={...next.context};
    }
  }
  if(next.plan && scene==='outing' && key==='sakae-plan'){
    next.plan.outing=route;
    next.plan.outingName='栄（過ごし方を確認中）';
  }
  if(next.plan && scene==='outing' && key!=='confirm')delete next.plan.pendingContext;
  if(scene==='outing'&&key==='inuyama-plan'&&next.context.inuyamaPlan?.ticket){
    next.context.ticketFirst=/きっぷ|切符|乗車券|料金|運賃/.test(value);
  }
  if(next.plan && scene==='outing' && key==='inuyama-plan'){
    if(!resolution && next.plan.inuyamaContext)Object.assign(next.context,next.plan.inuyamaContext);
    next.plan.outing=route;
    next.plan.inuyamaContext={...next.context};
    next.plan.outingName='犬山の半日プラン';
  }
  if(next.plan && scene==='airport' && key==='seat-options' && !next.plan.airport)next.plan.airport='sakae';
  if(next.plan && scene==='outing' && key==='with-company'){
    next.plan.outing=route;
    const company=next.context.company || next.plan.company;
    if(company){next.context.company=company;next.plan.company=company;}
    next.plan.outingName=companyPlaces[company?.place]?.label || '同行者とのおでかけ';
  }
  if(next.plan && scene==='outing' && Object.hasOwn(places,key))next.plan.outingName=places[key].short;
  if(next.plan && scene==='outing' && key==='tower')next.plan.outingName='栄で展望台へ';
  if(!resolution && scene==='outing' && ['sakae-plan','tower','city'].includes(key))next.context.towerRequested=true;
  if(scene==='commute'&&key==='work'&&/^[1-5]$/.test(detail))next.context.count=Number(detail);
  if(detail==='ready' && ['nagoya','kanayama'].includes(key)){
    const previous=prior.context;
    if(previous.lastOrigin===key && previous.prepChecked){
      next.context.prepChecked={fare:previous.prepChecked.fare,seat:previous.seatClass===next.context.seatClass&&previous.prepChecked.seat};
    }
  }
  const id=Date.now().toString(36)+'-'+(++serial);
  travelMemory.set(id,next);
  history.pushState({consultation:id},'','#'+cardAddress(route,next.context));
  render(true);
  animateChange(before,route);
}

function normalizeUtterance(value){
  return value.normalize('NFKC').trim().replace(/[\s。.,、!?！？「」]/g,'');
}
const acceptedPhrases = {
  'outing':['半日でどこかに行きたい。まだ行き先は決めてない','名古屋から半日'],
  'outing/castle':['城下町を歩いて、犬山城にも入りたい',places.castle.tab,places.castle.user,'お城に入りたい','お城に入りたいです','やっぱりお城に入りたい','犬山城に入りたい','犬山城に入りたいです','犬山城と城下町'],
  'outing/sakae-plan':['近場がいい。栄で街を見下ろしてみたい',places.city.tab,'展望台に上りたい','栄の展望台に上りたい','栄のタワーへ','栄での過ごし方'],
  'outing/city':[places.city.user,'SRTと展望台','SRTで巡って展望台へ','市内をSRTで巡って展望台へ','市内をSRTで巡って展望台'],
  'outing/tower':['展望台だけ','展望台だけに行く','展望台だけに行きます。SRTは使いません。','展望台だけに行きたい'],
  'outing/park':[places.park.tab,places.park.user,'公園でのんびり','公園でのんびりしたい','公園でのんびりしたいです','公園まで電車で往復','長久手の公園に行きたい'],
  'outing/walk':['栄で地上を街歩き',places.walk.tab,places.walk.user,'栄で街歩きだけ','栄で街歩きだけです','栄を徒歩で散策','栄で徒歩だけ','栄で地上を散策'],
  'airport/sakae':['栄からセントレアへ。荷物が多いんです',transport.sakae.tab,transport.sakae.user,'栄のホテル','栄のホテルから','栄のホテルから荷物が多いです','栄から空港までバスに乗りたい','栄のホテルから空港へバスで行きたい','伏見からバスで空港に行きたい'],
  'airport/nagoya':[transport.nagoya.tab,transport.nagoya.user,'名古屋駅','名鉄名古屋駅','名古屋駅から乗りたい','名古屋駅から電車で','名鉄名古屋から電車で空港へ','名古屋駅から空港に行きたい'],
  'airport/kanayama':[transport.kanayama.tab,transport.kanayama.user,'金山駅','金山駅から乗りたい','金山から電車で','金山から電車で空港へ','金山から空港まで電車に乗りたい'],
  'commute/work':['ときどき研修へ','研修で通う','研修です','一宮から研修に通います','名鉄一宮から名鉄名古屋へ研修で通います'],
  'commute/school':['学校へ通いたい','通学','学校に通う','通学定期を買いたい','学校に通い始めます。どの定期券が使えますか？'],
  'commute/school/bus':['高校生で、らんらんバスを使う','高校へ東海市のらんらんバスで通います','らんらんバスで高校に通う','東海市のらんらんバスで高校に通います'],
  'commute/school/child':['東海市のらんらんバスで、小学生の子どもが通います','小学生がらんらんバスで通います','小学生でらんらんバスを使う'],
  'commute/school/train':['名鉄電車で高校に通います','高校へ名鉄電車で通います','高校へ名鉄電車で通います。新しい通学定期を申し込みたいです','高校生で、名鉄電車を使う']
};
const knownRoutes = new Map(
  Object.entries(acceptedPhrases).flatMap(([route,phrases])=>phrases.map(phrase=>[normalizeUtterance(phrase),route]))
);
function classify(value){
  const text=normalizeUtterance(value);
  const {scene,key,detail}=parsePath();
  const route=knownRoutes.get(text);
  if(route && route.split('/')[0]===scene)return route;

  if(scene==='airport'&&Object.hasOwn(transport,key)){
    if(['帰りは分かった今日半日ならどこへ','帰りは分かった今日の午後は','帰りは分かった今日の午後はどこに行こう','今日の午後はどこに行こう','今日の午後はどこへ'].includes(text))return 'outing';
    if(key!=='sakae'&&['座席を指定したい','座席指定','指定席にしたい','電車の座席は指定できますか'].includes(text))return 'airport/'+key+'/seat';
    if(key==='sakae'&&['荷物が多い','乗り換えたくない'].includes(text))return 'airport/sakae';
  }
  if(scene==='commute'){
    if(text==='もう1日通うかも'){
      if(key==='work'&&/^[1-4]$/.test(detail))return 'commute/work/'+(Number(detail)+1);
      return null;
    }
    const fullRoute=/^大人1人で名鉄一宮[―−–—-]名鉄名古屋を研修で([1-5])往復$/.exec(text);
    if(fullRoute)return 'commute/work/'+fullRoute[1];
    const countFrom=/^(?:名鉄)?一宮(?:駅)?から(?:(?:名鉄)?名古屋(?:駅)?(?:まで|へ))?(?:研修(?:で|は|に))?([1-5])往復(?:です|します|する予定です|の予定です)?$/.exec(text);
    if(countFrom)return 'commute/work/'+countFrom[1];
    const countOnly=/^(?:研修(?:で|は|に)|予定が変わって|やっぱり|今回は|あもう1日増えて)?([1-5])往復(?:です|します|する予定です|の予定です|になった)?$/.exec(text);
    if(countOnly)return key==='work'?'commute/work/'+countOnly[1]:'commute/work';
  }
  return null;
}

function submitWords(value){
  const record=currentRecord(),route=routeNow();
  const resolved=window.CentxConversation?.resolve({text:value,route,context:{...exampleContext(route),...record.context}});
  const target=resolved?.route || classify(value) || (!route?knownRoutes.get(normalizeUtterance(value)):null) || (sceneNow()+'/confirm');
  const handoff=sceneNow()==='airport'&&parts(target)[0]==='outing';
  navigate(target,{said:value,handoff,resolution:resolved});
}
function handleInput(event){
  if(event.target.id!=='input-form')return;
  event.preventDefault();
  const field=document.querySelector('#trip-input'),value=field.value.trim();
  if(!value){
    const error=document.querySelector('#input-status');
    error.hidden=false;error.textContent='希望を入力するか、画面の選択肢から選んでください。';field.focus();return;
  }
  submitWords(value);
}
const about=document.querySelector('#about'),toolsDialog=document.querySelector('#conversation-tools');
function showTool(type){
  const scene=sceneNow(),content=document.querySelector('#tool-content');
  if(type==='history'){
    const turns=visibleTurns(),rows=items=>items.map(t=>`<div class="history-turn"><div><small>あなた</small><p>${escapeHtml(t.said)}</p></div><div><small>おでかけ相談</small><p>${escapeHtml(t.reply)}</p></div></div>`).join('');
    const past=turns.length>3?`<details class="past-turns"><summary>以前の会話（${turns.length-3}件）</summary>${rows(turns.slice(0,-3))}</details>`:'';
    content.innerHTML=`<h2 id="tool-heading">相談の履歴</h2><div class="history-list">${past}${rows(turns.slice(-3))}</div>`;
  }else if(scene==='outing' && currentRecord().context.company && ['with-company','inuyama-plan','confirm'].includes(parsePath().key)){
    const ideas=['犬山に変更','やっぱり栄に変更','長久手の公園に行きたい','雨でも楽しめるところは？','昼ごはんも食べたい'];
    content.innerHTML=`<h2 id="tool-heading">相談の条件を変える</h2><div class="company-switch">${ideas.map(idea=>`<button class="small-choice" type="button" data-say="${idea}">${idea}</button>`).join('')}</div>`;
  }else{
    const base=scene==='home'?`<div class="entry-list">${promptRows()}</div>`:chooseRows(choiceSet(scene));
    content.innerHTML=`<h2 id="tool-heading">相談の条件を変える</h2>${base}`;
  }
  toolsDialog.showModal();
}
document.querySelector('#about-trigger').addEventListener('click',()=>about.showModal());
for(const dialog of [about,toolsDialog])dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});
document.addEventListener('submit',handleInput);
document.addEventListener('change',event=>{
  if(event.target.matches('input[data-prep]'))storePrepCheck(event.target);
});
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  if(event.target.closest('.skip')){event.preventDefault();main.focus();return;}
  const tool=event.target.closest('[data-tool]');
  if(tool){showTool(tool.dataset.tool);return;}
  const quick=event.target.closest('[data-say]');
  if(quick){if(toolsDialog.open)toolsDialog.close();submitWords(quick.dataset.say);return;}
  const counter=event.target.closest('button[data-count]');
  if(counter){
    const count=Number(counter.dataset.count);
    if(count>=1&&count<=5){
      const label=counter.getAttribute('aria-label');
      const previous=currentRecord().context.fare,oldCount=Number(parsePath().detail)||4;
      const outside=Math.min(previous?.afterPeriod || 0,count),fare=fareBreakdown(count,outside,oldCount,outside?'expiry':'delta');
      navigate('commute/work/'+count,{said:count+'往復で比べたい',resolution:{context:{fare},change:oldCount+'往復 → '+count+'往復',reply:outside?'期限後の'+outside+'往復を残して、合計を計算し直しました。':count+'往復の場合の支払額と残枚数を計算しました。'}});
      const buttons=[...document.querySelectorAll('.stepper button:not(:disabled)')];
      (buttons.find(el=>el.getAttribute('aria-label')===label) || buttons[0])?.focus({preventScroll:true});
    }
    return;
  }
  const anchor=event.target.closest('a[data-route]');
  if(!anchor)return;
  event.preventDefault();
  if(toolsDialog.open)toolsDialog.close();
  const handoff=anchor.hasAttribute('data-handoff'),planEdit=anchor.hasAttribute('data-plan-edit');
  const label=anchor.classList.contains('destination')?anchor.querySelector('small').textContent:(anchor.querySelector('b')?.textContent || anchor.textContent).trim();
  const target=planEdit&&anchor.dataset.route==='outing'&&currentRecord().plan?.outing==='outing/with-company'?'outing/with-company':anchor.dataset.route;
  navigate(target,{said:handoff&&!planEdit?anchor.textContent.trim():planEdit?'':label,handoff,planEdit});
});
window.history.scrollRestoration='manual';
let previousLocation=location.href,previousTurn=history.state?.consultation;
function restore(){
  if(previousLocation===location.href && previousTurn===history.state?.consultation && document.body.dataset.rendered===routeNow())return;
  render(true);previousLocation=location.href;previousTurn=history.state?.consultation;
}
window.addEventListener('popstate',()=>{render(true);previousLocation=location.href;previousTurn=history.state?.consultation;});
window.addEventListener('hashchange',restore);
render();

