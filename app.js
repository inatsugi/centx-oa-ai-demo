'use strict';

const main = document.querySelector('#main');
const ticketBase = 'https://webticket.meitetsu.co.jp/webticket-user/Product/Detail/';
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
  castle: {photo:'castle', tab:'お城に入る', short:'犬山城と城下町', place:'犬山', title:'犬山城に入って、城下町へ。', user:'名鉄名古屋から往復して、お城の中にも入りたい。', reason:'お城の見学と城下町の散策を楽しむなら犬山へ。名鉄名古屋からの往復と犬山城の入場券引換がひとつになります。', ticket:'犬山城下町きっぷ（CentX版）', price:1840,id:'S20260200004', condition:'中学生以下の設定はありません。1人1端末で利用します。', detail:'設定は2027年2月28日まで。除外日があります。往復の対象区間・入場券の引換方法は商品詳細で確認できます。'},
  city: {photo:'city',tab:'街を見渡す',short:'栄のタワーへ',place:'名古屋・栄',title:'栄で、街並みを展望台から。',user:'市内で過ごしたい。バスで巡って、展望台に上りたい。',reason:'市内をなごやSRTで巡り、中部電力 MIRAI TOWERの通常展望を楽しむプランです。',ticket:'なごやSRT＋展望チケット',price:1700,id:'S20260300025', condition:'大人の料金例。SRTは原則として金・土・日・月・祝日に運行します。',detail:'SRT 1DAYパスと通常展望のセットです。対象日・除外日は商品詳細で確認してください。中学生には専用の商品があります。'},
  park: {photo:'park',tab:'公園で過ごす',short:'長久手の公園',place:'長久手',title:'リニモを降りて、公園を散歩。',user:'外でのんびりしたい。公園まで電車で往復したい。',reason:'藤が丘でリニモに乗り換え、愛・地球博記念公園へ。公園を散策して同じ経路で戻る予定に合います。',ticket:'リニモ往復券',price:800,id:'S20260800001',condition:'藤が丘駅―愛・地球博記念公園駅間の往復運賃です。',detail:'名古屋から藤が丘までの運賃と、有料施設への入場は含まれません。'},
  walk: {photo:'city',tab:'栄で街歩き',short:'栄で地上を散策',place:'名古屋・栄',title:'今日は、栄を歩いてみましょう。',user:'栄で街歩きだけ。展望台には上らないです。',reason:'久屋大通公園からタワー周辺までは、地上を歩いて楽しめます。すでに栄にいて徒歩で過ごすなら、この散策に乗車券や展望券を買う必要はありません。'}
};
const transport = {
  sakae:{tab:'栄からバスで',short:'乗り換えを避けたい',user:'栄のホテルです。荷物が多いので乗り換えたくないです。',from:'伏見・栄の停留所',to:'中部国際空港',photo:'bus',mode:'名鉄空港バスの車両例',title:'栄から、乗り換えずに空港へ。',reason:'栄の停留所から空港に向かうバスがあります。ホテルに近い乗り場と出発時刻を確認しましょう。',ticket:'伏見・栄―中部国際空港 片道券',price:2000,id:'T20261000003',condition:'予約はできず、満席時は乗れません。チケットは乗車後、降車までに購入します。',guide:airportBusGuide,guideText:'公式の乗り場・時刻を見る'},
  nagoya:{tab:'名古屋駅から',short:'名鉄電車に乗る',user:'名古屋駅にいます。電車で空港へ行きたいです。',from:'名鉄名古屋駅',to:'中部国際空港駅',photo:'rail',mode:'名鉄電車',title:'名鉄名古屋から、鉄道で空港へ。',reason:'名鉄名古屋駅から中部国際空港駅まで使える片道QRきっぷがあります。列車の時刻を公式案内で確認できます。',ticket:'名鉄名古屋―中部国際空港 片道QRきっぷ',price:980,id:'S20260300019',condition:'特別車を選ぶときは別途、特別車両券が必要です。指定の対応改札で利用します。',guide:airportRailGuide,guideText:'名鉄の空港アクセスを見る'},
  kanayama:{tab:'金山駅から',short:'名鉄電車に乗る',user:'出発は金山駅です。電車で行きます。',from:'金山駅',to:'中部国際空港駅',photo:'rail',mode:'名鉄電車',title:'金山からの片道券があります。',reason:'金山駅から中部国際空港駅まで乗るなら、この区間のQRきっぷを使えます。',ticket:'金山―中部国際空港 片道QRきっぷ',price:910,id:'S20260300018',condition:'特別車には別途、特別車両券が必要です。金山駅は中央・西口の対応改札が対象です。',guide:airportRailGuide,guideText:'名鉄の空港アクセスを見る'}
};
const yen = value => `${value.toLocaleString('ja-JP')}円`;
const escapeHtml = text => String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const sourceLink = (url, label, primary = false) => `<a class="${primary ? 'cta' : 'link'}" href="${url}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
const photo = (key, alt = '') => `<img src="assets/${key}.webp" alt="${escapeHtml(alt)}">`;
const nav = (route, label, className = 'small-choice', extra = '') => `<a href="#${route}" data-route="${route}" class="${className}" ${extra}>${label}</a>`;
const pin = text => `<span class="location"><i class="pin" aria-hidden="true"></i>${text}</span>`;
const chips = entries => `<div class="context" aria-label="相談の条件">${entries.filter(Boolean).map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>`;
const quote = text => `<p class="user-line">${escapeHtml(text)}</p>`;
const messages = new Map();
const visitStarted = Date.now();
let nextMessage = 0;
function sessionState(){
  const state=history.state || {};
  return {carry:state.carry || '',said:messages.get(state.turn) || ''};
}
function tile(route,label,detail,image){
  return nav(route,`${image ? photo(image) : ''}<span class="tile-text"><b>${label}</b><small>${detail}</small></span><span class="tile-arrow" aria-hidden="true">›</span>`, `tile${image ? '' : ' noimg'}`);
}
function optionGroup(label, buttons){return `<div class="below"><p>${label}</p><div class="options">${buttons.join('')}</div></div>`;}
function ask(question, explanation, children){return `<div class="ask-set"><h2 class="ask">${question}</h2>${explanation ? `<p class="explain">${explanation}</p>` : ''}${children}</div>`;}
function input(placeholder){return `<div class="input-area"><form id="input-form"><label for="trip-input">例に近い言葉で希望を伝える</label><div class="input-form"><input id="trip-input" name="request" type="text" maxlength="90" placeholder="${escapeHtml(placeholder)}" autocomplete="off"><button type="submit" class="send">送信</button></div><p class="error" id="input-status" role="status" hidden></p></form></div>`;}
function trail(initial,question,user){return `<details class="trail"><summary>最初の相談を見る</summary><p class="initial">あなた　${escapeHtml(initial)}</p></details><p class="ai-prompt"><i class="spark" aria-hidden="true">✦</i><span>${escapeHtml(question)}</span></p>${quote(sessionState().said || user)}`;}
function product({ticket,price,id,condition,detail},secondary=''){return `<div class="ticket"><div class="ticket-head"><b>${ticket}</b><strong>${yen(price)}</strong></div><p class="notes">${condition}</p>${detail ? `<details class="travel-details"><summary>利用条件を詳しく見る</summary><p>${detail}</p></details>` : ''}<div class="buttons">${sourceLink(ticketBase+id,'CentXで券の詳細を見る',true)}${secondary}</div></div>`;}
function imageCard(item,content){return `<article class="rec"><div class="rec-photo">${photo(item.photo)}<span>${item.place || item.mode}</span></div><div class="rec-body"><h2>${item.title}</h2><p class="reason">${item.reason}</p>${content}</div></article>`;}
function home(){
  const content=[['outing','午後はどこへ？','名古屋から半日。気分で選ぶ行き先。'],['airport','空港への行き方','出発場所や荷物から、鉄道とバスを選ぶ。'],['commute','通うならどの券？','通う回数や路線に合う買い方を比べる。']];
  return `<div class="home"><div class="home-intro"><div>${pin('名古屋・沿線エリア')}<h1>どんな予定ですか？</h1></div><p>相談を選んで、行き先やきっぷを見つけましょう。</p></div><div class="home-grid">${content.map(([key,title,subtitle],i)=>{const scene=scenes[key];return nav(key,`${photo(scene.photo)}<div class="home-text">${pin(scene.name)}<h2>${title}</h2><p>${subtitle}</p><span class="home-open" aria-hidden="true">↗</span></div>`,`home-card${i===0 ? ' big' : ''}`);}).join('')}</div><p class="home-note">相談に合わせて画面が変わる提案用デモです。購入はリンク先の公式サービスで行います。</p></div>`;
}
function firstOuting(){
  return sessionState().carry ? '帰りの空港への行き方は分かった。今日の午後はどこに行こう？' : scenes.outing.intro;
}
function outingView(key){
  const initial=firstOuting();const scene=scenes.outing;const journeyContext=sessionState().carry;
  const context=journeyContext ? `<p class="carry">${escapeHtml(journeyContext)}の相談に続いて</p>` : '';
  if(!Object.hasOwn(places,key)){
    return `${context}${quote(initial)}${ask(scene.question,'名古屋から大人ひとりで半日出かける例です。気分に近いものを選んでください。',`<div class="choices">${Object.entries(places).map(([id,p])=>tile('outing/'+id,p.tab,p.short,p.photo)).join('')}</div>`)}${input('例　公園でのんびりしたい')}`;
  }
  const selected=places[key];const rest=Object.entries(places).filter(([id])=>id!==key).map(([id,p])=>nav('outing/'+id,p.tab));
  return `${context}${trail(initial,scene.question,selected.user)}${chips(['名古屋から','半日','大人1人',selected.tab])}<div class="response">${imageCard(selected,selected.id ? product(selected) : '')}</div>${optionGroup('過ごし方を変えてみる',rest)}${input('例　やっぱりお城に入りたい')}`;
}
function airportView(key,modifier){
  const scene=scenes.airport;
  if(!Object.hasOwn(transport,key)){
    return `${quote(scene.intro)}${ask(scene.question,'荷物や、乗り換えについての希望も教えてください。',`<div class="choices">${Object.entries(transport).map(([id,p])=>tile('airport/'+id,p.tab,p.short,id==='sakae'?'bus':null)).join('')}</div>`)}${input('例　栄のホテルから。荷物が多いです')}`;
  }
  const selected=transport[key];const seat=key!=='sakae'&&modifier==='seat';
  const routeMap=`<div class="route-map" aria-label="対象区間"><b>${selected.from}</b><i class="track" aria-hidden="true"></i><b>${selected.to}</b></div>`;
  const railDetails=seat ? '<p class="explain">座席を指定する場合は、乗車券に加えて特別車両券（ミューチケット）を用意します。対象列車・空席は公式サービスでご確認ください。</p>' : '';
  const alternatives=Object.entries(transport).filter(([id])=>id!==key).map(([id,p])=>nav('airport/'+id,p.tab));
  if(key!=='sakae'&&!seat) alternatives.unshift(nav('airport/'+key+'/seat','座席を指定したい'));
  const onward=nav('outing','<span><small>続けて、おでかけを相談</small><b>帰りは分かった。今日の午後は？</b></span><span aria-hidden="true">→</span>','next-scenario','data-handoff="airport"');
  return `${trail(scene.intro,scene.question,seat?'電車の座席は指定できますか？':selected.user)}${chips([selected.from, key==='sakae'?'荷物が多い':'鉄道で移動',seat?'座席指定を希望':''])}<div class="response">${imageCard(selected,`${routeMap}${railDetails}${product(selected,sourceLink(selected.guide,selected.guideText))}`)}</div>${onward}${optionGroup('条件を変えてみる',alternatives)}${input('例　金山駅から乗りたい')}`;
}
function journeySelector(){return `<div class="choices">${tile('commute/work','ときどき研修へ','名鉄一宮―名鉄名古屋','commute')}${tile('commute/school','学校へ通いたい','鉄道や地域のバス','city')}</div>`;}
function workView(number){
  const initial='名鉄一宮から名鉄名古屋まで、研修で何度か往復します。';
  const question='約60日間で、何回往復しますか？';
  if(!/^[1-5]$/.test(number || ''))return `${quote(sessionState().said || initial)}${ask(question,'名鉄一宮から名鉄名古屋まで、定期券を持っていない大人1人が通う例です。この区間と条件に合う場合は回数を選んでください。',`<div class="options">${[1,2,3,4,5].map(n=>nav('commute/work/'+n,n+'往復')).join('')}</div>`)}${nav('commute','通う予定を選び直す','reset')}${input('例　研修は3往復です')}`;
  const count=Number(number);const normal=count*2*400;const bundle=2800;const buySet=bundle<normal;
  const winner=buySet?`10枚セットの方が${yen(normal-bundle)}安くなります。`:`毎回払えば${yen(bundle-normal)}安くなります。`;
  const next=buySet?`片道${count*2}回分を利用します。${count===5?'10枚を使い切る予定です。':`残る${10-count*2}枚は有効期間内に同じ対象区間で使えます。`}`:'予定の回数なら、普通運賃での乗車を案内します。';
  const buy=buySet ? sourceLink(ticketBase+'S20260300015','CentXで10枚セットを見る',true) : sourceLink(fareGuide,'名鉄の運賃比較を見る',true);
  return `${trail(initial,question,`${count}往復する予定です。`)}${chips(['名鉄一宮―名鉄名古屋','大人1人','定期券なし','約60日以内'])}<section class="fare-module" aria-labelledby="compare"><h2 id="compare" class="ask">通う回数で比べてみましょう。</h2><div class="num-select"><div><b>往復する回数</b><p>1〜5往復の例</p></div><div class="stepper"><button ${count===1?'disabled':''} data-count="${count-1}" aria-label="往復回数を1減らす">−</button><strong>${count}往復</strong><button ${count===5?'disabled':''} data-count="${count+1}" aria-label="往復回数を1増やす">＋</button></div></div><div class="fare-row"><div class="fare-item ${buySet?'':'winner'}"><span>毎回、普通運賃で乗る</span><b>${yen(normal)}</b><span>${count*2}回 × 400円</span></div><div class="fare-item ${buySet?'winner':''}"><span>10枚セットを買う</span><b>2,800円</b><span>片道QRきっぷ10枚</span></div></div><p class="fare-answer"><strong>${winner}</strong><br>${next}</p></section><div class="buttons">${buy}</div><p class="notes">「名古屋・金山 特別きっぷ（名鉄一宮駅発）」との比較です。金山着や学生の定期運賃とは金額が異なります。</p>${optionGroup('ほかの通い方を相談する',[nav('commute/school','学校へ通いたい')])}${input('例　予定が変わって4往復です')}`;
}
const schoolOptions=[['bus','らんらんバス','高校へ通う'],['child','らんらんバス','小学生が通う'],['train','名鉄電車','高校へ通う']];
function schoolView(key){
  const question='通学に使うのは、どの路線ですか？';
  const options=schoolOptions.map(([id,label,detail])=>tile('commute/school/'+id,label,detail));
  if(!schoolOptions.some(([id])=>id===key))return `${quote('学校に通い始めます。どの定期券が使えますか？')}${ask(question,'通う人の学齢によっても、合うきっぷや手続きが変わります。',`<div class="choices">${options.join('')}</div>`)}${nav('commute','通う予定を選び直す','reset')}${input('例　高校生で、らんらんバスを使う')}`;
  const train=key==='train';const child=key==='child';const user=train?'高校へ名鉄電車で通います。新しい通学定期を申し込みたいです。':child?'東海市のらんらんバスで、小学生の子どもが通います。':'高校へ東海市のらんらんバスで通います。';
  const title=train?'通学定期は専用の予約サービスへ。':child?'小学生は、らんらんバスが無料です。':'らんらんバスは共通の全線定期です。';
  const reason=train?'名鉄電車の対象となるmanaca定期券は、専用Webサービスで予約できます。新規の通学定期は学校の証明書類を提出し、審査の後に駅の対応券売機などで購入します。':child?'東海市のらんらんバスは小学生以下の運賃が無料です。この路線での通学には、定期券の購入は不要です。':'東海市のらんらんバスは通勤・通学共通の全線定期を使えます。1か月定期はCentXで購入できます。';
  const detail=train?sourceLink(schoolGuide,'名鉄の通学定期の手続きへ',true):child?sourceLink(cityBusGuide,'東海市のバスガイドを見る',true):sourceLink(ticketBase+'T20260300107','CentXで1か月定期を見る',true);
  return `${trail('学校に通いたいです。',question,user)}${chips([train?'名鉄電車':'東海市・らんらんバス',child?'小学生':'高校生'])}<section class="simple-result"><h2>${title}</h2><p>${reason}</p>${(!train&&!child)?'<p><b>1か月 2,000円</b>　1乗車の普通運賃は100円です。</p>':''}<div class="buttons">${detail}</div></section>${optionGroup('ほかの条件を試す',schoolOptions.filter(([id])=>id!==key).map(([id,label,detail])=>nav('commute/school/'+id,label+'・'+detail)))}${nav('commute/work','研修で通う場合を比べる','reset')}${input('例　名鉄電車で高校に通います')}`;
}
function commuteView(key,detail){if(key==='work')return workView(detail);if(key==='school')return schoolView(detail);return `${quote(scenes.commute.intro)}${ask(scenes.commute.question,'研修は、定期券のない大人1人が名鉄一宮から名鉄名古屋へ通う例です。通学は、使う路線と学齢を選びます。',journeySelector())}${input('例　一宮から研修で3往復します')}`;}
function clarification(scene){
  const prior=sessionState().said;
  const options={
    outing:[
      ['outing/castle','犬山城に入る','名鉄名古屋から往復'],
      ['outing/city','栄で展望台へ','SRTと通常展望'],
      ['outing/park','公園まで電車で往復','藤が丘からリニモ'],
      ['outing/walk','栄を徒歩で散策','現地から地上を歩く']
    ],
    airport:[
      ['airport/sakae','栄からバス','空港まで乗り換えなし'],
      ['airport/nagoya','名鉄名古屋から電車','中部国際空港駅まで'],
      ['airport/kanayama','金山から電車','中部国際空港駅まで']
    ],
    commute:[
      ['commute/work','研修で通う','定期券なし／名鉄一宮―名鉄名古屋'],
      ['commute/school','学校へ通う','路線と学齢を選ぶ']
    ]
  };
  const guidance={
    outing:'このデモで試せるのは、大人1人が名古屋から半日出かける次の例です。ご希望と合うものがあれば選んでください。',
    airport:'このデモでは、市内からセントレアに向かう次の3通りを試せます。ご希望の出発地と交通手段を選んでください。',
    commute:'このデモでは、次の通い方を試せます。お持ちのきっぷや利用区間も確認して、ご希望に合う例を選んでください。'
  };
  const examples={outing:'例　お城に入りたい',airport:'例　金山駅から乗りたい',commute:'例　一宮から研修で3往復します'};
  const choices=options[scene].map(([route,label,detail])=>tile(route,label,detail)).join('');
  return `${prior?quote(prior):''}<section class="clarification" aria-labelledby="confirm-title"><h2 class="ask" id="confirm-title">ご希望の条件を確認させてください。</h2><p class="explain">${guidance[scene]}</p><div class="choices">${choices}</div></section>${input(examples[scene])}`;
}
function parsePath(){
  const parts=location.hash.slice(1).split('/');
  const [scene,key,detail]=parts;
  return {scene:Object.hasOwn(scenes,scene)?scene:'',key:key||'',detail:detail||''};
}
function render(moveFocus=false){
  const {scene,key,detail}=parsePath();
  if(!scene){main.innerHTML=home();document.title='名鉄エリアの移動・おでかけ相談｜体験デモ';}
  else {
    const meta=scenes[scene];
    const inside=key==='confirm'?clarification(scene):scene==='outing'?outingView(key):scene==='airport'?airportView(key,detail):commuteView(key,detail);
    document.title=`${meta.name}｜移動・おでかけ相談 体験デモ`;
    main.innerHTML=`<div class="scene-wrap">${nav('','<span aria-hidden="true">←</span> 相談一覧','back')}<div class="journey"><aside class="scene-aside">${photo(scene==='outing'&&key==='castle'?'city':meta.photo)}<div class="aside-copy">${pin(meta.location)}<h1>${meta.name}</h1><p>${meta.description}</p></div></aside><section class="session" aria-label="相談体験"><div class="session-top"><span class="mode"><i class="spark" aria-hidden="true">✦</i>名鉄エリアのAIモード</span><span class="session-scope">体験デモ</span></div><div class="inside">${inside}</div></section></div></div>`;
  }
  if(moveFocus){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function navigate(route,{said='',handoff=false,keepPosition=false}={}){
  const before=parsePath();const prior=sessionState();const target=route.split('/')[0];
  const carry=handoff&&before.scene==='airport'?'空港への行き方':target==='outing'&&before.scene==='outing'?(prior.carry||''):'';
  const state={carry};
  if(said){state.turn=visitStarted+'-'+(++nextMessage);messages.set(state.turn,said.slice(0,90));}
  if(location.hash.slice(1)===route)history.replaceState(state,'',route?'#'+route:location.pathname+location.search);
  else history.pushState(state,'',route?'#'+route:location.pathname+location.search);
  render(!keepPosition);
}
// Every accepted phrase describes one of the visible choices in full.
// Longer requests may add constraints that change the fare or route.
function normalizeUtterance(value){
  return value.normalize('NFKC').trim().replace(/[\s。.,、!?！？「」]/g,'');
}
const acceptedPhrases = {
  'outing/castle':[places.castle.tab,places.castle.user,'お城に入りたい','お城に入りたいです','やっぱりお城に入りたい','犬山城に入りたい','犬山城に入りたいです','犬山城と城下町'],
  'outing/city':[places.city.tab,places.city.user,'展望台に上りたい','栄の展望台に上りたい','栄のタワーへ','SRTと展望台'],
  'outing/park':[places.park.tab,places.park.user,'公園でのんびり','公園でのんびりしたい','公園でのんびりしたいです','公園まで電車で往復','長久手の公園に行きたい'],
  'outing/walk':[places.walk.tab,places.walk.user,'栄で街歩きだけ','栄で街歩きだけです','栄を徒歩で散策','栄で徒歩だけ','栄で地上を散策'],
  'airport/sakae':[transport.sakae.tab,transport.sakae.user,'栄のホテル','栄のホテルから','栄のホテルから荷物が多いです','栄から空港までバスに乗りたい','栄のホテルから空港へバスで行きたい','伏見からバスで空港に行きたい'],
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
  const {scene,key}=parsePath();
  const route=knownRoutes.get(text);
  if(route && route.split('/')[0]===scene)return route;

  if(scene==='airport'&&Object.hasOwn(transport,key)){
    if(['帰りは分かった今日の午後は','帰りは分かった今日の午後はどこに行こう','今日の午後はどこに行こう','今日の午後はどこへ'].includes(text))return 'outing';
    if(key!=='sakae'&&['座席を指定したい','座席指定','指定席にしたい','電車の座席は指定できますか'].includes(text))return 'airport/'+key+'/seat';
    if(key==='sakae'&&['荷物が多い','乗り換えたくない'].includes(text))return 'airport/sakae';
  }
  if(scene==='commute'){
    const countFrom=/^(?:名鉄)?一宮(?:駅)?から(?:(?:名鉄)?名古屋(?:駅)?(?:まで|へ))?(?:研修(?:で|は|に))?([1-5])往復(?:です|します|する予定です|の予定です)?$/.exec(text);
    if(countFrom)return 'commute/work/'+countFrom[1];
    const countOnly=/^(?:研修(?:で|は|に)|予定が変わって|やっぱり|今回は|あもう1日増えて)?([1-5])往復(?:です|します|する予定です|の予定です)?$/.exec(text);
    if(countOnly)return key==='work'?'commute/work/'+countOnly[1]:'commute/work';
  }
  return null;
}
function handleInput(event){
  if(event.target.id!=='input-form')return;
  event.preventDefault();const field=document.querySelector('#trip-input');const value=field.value.trim();const error=document.querySelector('#input-status');
  if(!value){error.hidden=false;error.textContent='希望を入力するか、画面の選択肢から選んでください。';field.focus();return;}
  const route=classify(value);
  if(!route){navigate(parsePath().scene+'/confirm',{said:value});return;}
  navigate(route,{said:value,handoff:parsePath().scene==='airport'&&route==='outing'});
}
const dialog=document.querySelector('#about');
document.querySelector('#about-trigger').addEventListener('click',()=>dialog.showModal());
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
document.addEventListener('submit',handleInput);
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  if(event.target.closest('.skip')){event.preventDefault();main.focus();return;}
  const counter=event.target.closest('button[data-count]');
  if(counter){const count=Number(counter.dataset.count);if(count>=1&&count<=5){const increment=counter.getAttribute('aria-label').includes('増や');navigate('commute/work/'+count,{keepPosition:true});const selector=increment?'増やす':'減らす';document.querySelector(`.stepper button:not(:disabled)[aria-label$="${selector}"]`)?.focus({preventScroll:true});}return;}
  const anchor=event.target.closest('a[data-route]');if(!anchor)return;
  event.preventDefault();navigate(anchor.dataset.route,{handoff:anchor.hasAttribute('data-handoff')});
});
window.history.scrollRestoration='manual';
window.addEventListener('popstate',()=>render(true));
window.addEventListener('hashchange',()=>{if(location.hash!=='#main')render(false);});
render();
