'use strict';

const railSeatBooking='https://reservation.meitetsu.co.jp/';
const castleLunch='https://inuyama.gr.jp/gourmet/detail/11/';
const castleTea='https://inuyama.gr.jp/gourmet/detail/17/';
const castleOfficial='https://inuyama-castle.jp/';
const itineraryEdit='先にお城に入って、帰りにお茶したい';
const itineraryTicket='名鉄名古屋から往復。使えるきっぷは？';
const seatComparison='座席を予約しておきたい';
const departurePrep='名鉄名古屋からにする。乗る前に必要なものをまとめて';
const extraTrip='あと1回増えるかも';
const expiredTrip='最後の1回は有効期限のあとなら？';
const visitStops=new Set(['lunch','castle','town','tea']);

function defaultInuyama(){
  return {order:['lunch','castle'],admission:'undecided',ticket:false};
}
function cleanStops(order){
  return Array.isArray(order)?[...new Set(order.filter(x=>visitStops.has(x)))]:[];
}
function fareBreakdown(count,afterPeriod=0,previousCount=count,stage='base'){
  const inPeriod=count-afterPeriod;
  return {count,inPeriod,afterPeriod,previousCount,stage,ordinaryTotal:count*800,bundleTotal:2800+afterPeriod*800,remainingTickets:10-inPeriod*2};
}
// The address carries only the chosen stops, fare counts and seat class.
function restoreCardContext(route){
  const query=new URLSearchParams(location.hash.split('?')[1] || '');
  const [scene,key,detail]=route.split('/');
  if(scene==='outing'&&key==='inuyama-plan'){
    const stops=cleanStops((query.get('stops') || '').split('.'));
    const plan=defaultInuyama();
    if(stops.length)plan.order=stops;
    const admission=query.get('entry');
    if(['yes','no'].includes(admission))plan.admission=admission;
    const avoidStairs=query.get('stairs')==='avoid';
    const company=avoidStairs?{avoidStairs:true,access:true}:query.get('group')==='1'?{}:undefined;
    if(avoidStairs){
      plan.preventTowerStairs=true;
      plan.admission='no';
      plan.order=cleanStops(plan.order.map(id=>id==='castle'?'town':id));
    }
    plan.ticket=plan.admission==='yes' && !company && query.get('ticket')==='1';
    return {inuyamaPlan:plan,company,ticketFirst:plan.ticket&&query.get('focus')!=='day'};
  }
  if(scene==='airport'&&detail==='ready'&&['kanayama','nagoya'].includes(key)){
    return {lastOrigin:key,seatClass:query.get('seat')==='general'?'general':'reserved'};
  }
  if(route==='commute/school/train' && ['prepare','collect'].includes(query.get('step')))return {schoolStep:query.get('step')};
  if(scene==='commute'&&key==='work'&&/^[1-5]$/.test(detail)){
    const count=Number(detail),from=Number(query.get('from')),after=Number(query.get('after'));
    if(from>=1&&from<=5){
      const outside=Number.isInteger(after)&&after>0&&after<=count?after:0;
      return {fare:fareBreakdown(count,outside,from,outside?'expiry':'delta')};
    }
  }
  return {};
}
function cardAddress(route,ctx){
  const query=new URLSearchParams();
  if(route==='outing/inuyama-plan'&&ctx.inuyamaPlan){
    const plan=ctx.inuyamaPlan;
    query.set('stops',cleanStops(plan.order).join('.'));
    if(['yes','no'].includes(plan.admission))query.set('entry',plan.admission);
    if(ctx.company)query.set('group','1');
    if(plan.preventTowerStairs || ctx.company?.avoidStairs)query.set('stairs','avoid');
    if(plan.ticket&&!ctx.company){
      query.set('ticket','1');
      if(!ctx.ticketFirst)query.set('focus','day');
    }
  }else if(route.endsWith('/ready')&&ctx.seatClass==='general'){
    query.set('seat','general');
  }else if(route==='commute/school/train'&&['prepare','collect'].includes(ctx.schoolStep)){
    query.set('step',ctx.schoolStep);
  }else if(route.startsWith('commute/work/')&&['expiry','delta'].includes(ctx.fare?.stage)){
    query.set('from',String(ctx.fare.previousCount));
    if(ctx.fare.afterPeriod)query.set('after',String(ctx.fare.afterPeriod));
  }
  return route+(query.size?'?'+query.toString():'');
}
function inuyamaDayView(context,isExample){
  const plan=context.inuyamaPlan || defaultInuyama();
  const restricted=Boolean(plan.preventTowerStairs || context.company?.avoidStairs);
  const order=cleanStops((plan.order || []).map(id=>restricted&&id==='castle'?'town':id));
  if(!order.length)order.push(...(restricted?['lunch','town']:defaultInuyama().order));
  const entered=!restricted&&plan.admission==='yes',firstCastle=order[0]==='castle',tea=order.includes('tea'),teaLast=order.at(-1)==='tea';
  const canShowTicket=entered && plan.ticket && !context.company;
  const pieces=restricted?['天守を外して、','城下町で過ごす午後。']:order[0]==='tea'?['本町通りでお茶して、','城下町を巡る午後。']:plan.admission==='no'||(!order.includes('castle')&&order.includes('town'))?['城下町を歩いて、',teaLast?'帰りは本町通りでお茶。':'犬山で過ごす午後。']:
    firstCastle?['犬山城を先に、',teaLast?'帰りは本町通りでお茶。':tea?'城下町でお茶と昼食。':'城下町を歩く午後。']:['城下町でお昼、','午後は犬山城へ。'];
  const ticketFirst=canShowTicket&&context.ticketFirst;
  const ticketView=canShowTicket?ticket({...places.castle,condition:'名鉄名古屋発の大人1人。往復乗車券と犬山城の入場券引換を含みます。中学生以下の設定はありません。1回の購入は1枚までです。'}):'';
  const heading=(ticketFirst?['往復と入城は、','犬山城下町きっぷで。']:pieces).map(t=>`<span class="phrase">${t}</span>`).join('');
  const stops={
    lunch:{name:'城下町で昼食',body:'香味茶寮 壽俵屋 犬山井上邸',url:castleLunch,link:'お店の案内'},
    castle:{name:entered?'犬山城の天守に入る':'犬山城の周辺を散策',body:entered?'天守から木曽川と城下町を一望。':'木曽川沿いから天守を眺めます。',url:castleOfficial,link:'犬山城の案内'},
    town:{name:restricted?'城下町で立ち寄り先を探す':'城下町の本町通りを歩く',body:restricted?'入口の段差や移動距離を事前に確認。':'お店をのぞきながら散策します。',url:'https://inuyama.gr.jp/',link:'観光案内'},
    tea:{name:teaLast?'帰りに本町茶寮でお茶':'本町茶寮でお茶',body:'本町通りで、抹茶やぜんざいを。',url:castleTea,link:'お店の案内'}
  };
  const times=firstCastle?['12:30','13:45','15:00','15:45']:['12:30','14:00','15:15','15:45'];
  const rows=order.map((id,index)=>{
    const s=stops[id];
    return `<li data-stop="${id}"><span class="visit-time">${times[index]}</span><i aria-hidden="true"></i><div><h3>${s.name}</h3><p>${s.body} ${external(s.url,s.link)}</p></div></li>`;
  }).join('');
  const image=firstCastle?'castle':'castle-town',caption=firstCastle?'犬山城の天守':'犬山の城下町';
  const c=context.company;
  const party=c?chips([c.day,c.halfDay?'半日':'',c.child?(c.age!=null?c.age+'歳のお子さまと':'お子さまと'):'',c.elder?'年配の方と':'',c.people?c.people+'人':'',c.rain?'雨の場合':'',restricted?'階段を避ける':'',c.walkMinutes!=null?'歩く時間は'+c.walkMinutes+'分まで':'']):'';
  const another=restricted?external('https://inuyama-castle.jp/faq/','犬山城の設備を確認'):nav('outing/choices',`ほかの行き先も見る ${icon('arrow',15)}`,'text-link');
  return `<article class="editable-day ${ticketFirst?'ticket-focus':''}"><div class="case-line">${icon('pin',15)}<span>${ticketFirst?'名鉄名古屋 ⇄ 犬山':isExample?'名古屋から半日のおでかけ案':'犬山の半日プラン'}</span></div>${party}<h1>${heading}</h1><p class="reason">${ticketFirst?'名鉄名古屋から往復して天守に入る予定に合うきっぷです。':isExample?'犬山なら、ランチと城下町の散策をひとつの午後に組めます。':'希望の順番で立ち寄れるよう、午後の行程を組み直しました。'}</p>${ticketFirst?ticketView:''}<div class="day-sheet"><figure>${photo(image,caption)}<figcaption>${caption}</figcaption></figure><div class="day-stops"><div class="sheet-caption"><b>${ticketFirst?'相談した午後の行程':'午後の行程'}</b><small>時刻は過ごし方の目安</small></div><ol>${rows}</ol></div></div>${canShowTicket&&!ticketFirst?ticketView:''}<div class="day-notes"><span>${restricted?'犬山城の天守にはエレベーターがなく、車いすで天守内を見学できません。飲食店の入口や席は各店にご確認ください。':(entered?'犬山城の最終入場は16:30。':'')+'飲食代は別途。お店の営業時間は各案内でご確認ください。'}</span>${another}</div></article>`;
}
function airportHandoff(){
  const plan=currentRecord().plan;
  return nav(plan?.combined?(plan.outing || 'outing'):'outing',`${plan?.combined?'今日の午後の相談へ':'続けて、今日の午後のおでかけを相談'} ${icon('arrow',16)}`,'onward','data-handoff="airport"');
}
function airportSeatOptions(){
  return `<article class="seat-options"><div class="case-line">${icon('airport',15)}伏見・栄からセントレアへ</div><h1><span class="phrase">座席を取っておくなら、</span><span class="phrase">名駅から特別車へ。</span></h1><p class="reason">空港バスは予約できません。名鉄名古屋駅へ移動すれば、列車と座席を指定できます。</p><div class="mode-comparison"><section class="mode-option"><figure>${photo('bus','名鉄空港バスの車両例')}<figcaption>車両の例</figcaption></figure><div><span class="mode-type">${icon('bus',16)}直通の空港バス</span><h2>伏見・栄から直通</h2>${money(2000)}<p>座席は先着順。満席の場合は乗車できません。チケットは乗車後、降車までに購入します。</p>${external(airportBusGuide,'バスの乗り場・時刻')}</div></section><section class="mode-option reserved"><figure>${photo('reserved-seat','名鉄2000系ミュースカイの特別車の座席例')}<figcaption>特別車の座席例</figcaption></figure><div><span class="mode-type">${icon('train',16)}名鉄電車の特別車</span><h2>名駅から座席指定</h2>${money(1430)}<p>乗車券980円＋特別車両券450円。栄・伏見から名鉄名古屋駅までの移動費は別途です。</p>${external(railSeatBooking,'列車・座席の空きを確認')}</div></section></div>${airportHandoff()}</article>`;
}
function airportReadyView(origin,context){
  const p=transport[origin],reserved=context.seatClass!=='general';
  const steps=[{key:'fare',name:'片道の乗車券',price:p.price,note:'出発駅から中部国際空港駅まで。片道QRきっぷは対応改札で使います。',href:ticketBase+p.id,link:'CentXで片道券を確認'}];
  if(reserved)steps.push({key:'seat',name:'特別車両券（ミューチケット）',price:450,note:'乗る列車・指定席を選びます。乗車券とは別に購入します。',href:railSeatBooking,link:'公式で列車・座席を確認'});
  const confirmed=context.prepChecked || {};
  const rows=steps.map((s,i)=>`<li><label><input type="checkbox" data-prep="${s.key}" ${confirmed[s.key]?'checked':''}><span class="check-shape" aria-hidden="true">${icon('check',14)}</span><span>${s.name}<small>内容を確認済みにする</small></span><strong>${yen(s.price)}</strong></label><p>${s.note}</p>${external(s.href,s.link,i===0)}</li>`).join('');
  return `<section class="boarding-kit"><div class="case-line">${icon('train',15)}${p.from} → 中部国際空港駅</div><h1>${reserved?'乗車前に、2枚を準備。':'一般車なら、乗車券1枚で。'}</h1><p class="reason">${reserved?'特別車を利用するには、運賃と座席指定の両方が必要です。':'一般車には特別車両券は不要です。一般車のある列車と出発時刻をご確認ください。'}</p><div class="prep-ticket"><div class="prep-total"><span>大人1人・片道</span>${money(p.price+(reserved?450:0))}</div><div class="prep-items"><div class="sheet-caption"><b>出発前の確認</b><small data-prep-count>${steps.filter(s=>confirmed[s.key]).length} / ${steps.length} 件確認</small></div><ul>${rows}</ul></div></div><div class="kit-bottom">${external('https://www.meitetsu.co.jp/train/timetable/index.html','名鉄の時刻表を見る')}${airportHandoff()}</div></section>`;
}


function fareWorkbench(n,context,isExample=false){
  const f=context.fare?.count===n ? context.fare : fareBreakdown(n);
  const {stage,previousCount,inPeriod,afterPeriod,ordinaryTotal,bundleTotal,remainingTickets}=f;
  const buySet=bundleTotal<ordinaryTotal,difference=Math.abs(ordinaryTotal-bundleTotal);
  const split=stage==='expiry',changed=stage==='delta'&&previousCount!==n;
  const title=split?'期限後の往復は、普通運賃で。':changed?(previousCount<n?`${n}往復に増えた場合の買い方。`:`${n}往復になった場合の買い方。`):`${n}往復なら、${buySet?'10枚セット':'普通運賃で'}。`;
  const caseLabel=isExample?'研修で通う例':'研修で通う場合';
  const stepper=`<div class="stepper"><span>往復回数</span><div><button type="button" data-count="${n-1}" aria-label="往復回数を1減らす" ${n===1?'disabled':''}>−</button><strong>${n}<small>往復</small></strong><button type="button" data-count="${n+1}" aria-label="往復回数を1増やす" ${n===5?'disabled':''}>＋</button></div></div>`;
  const ribbon=`<div class="ticket-ribbon"><div><b>10枚セットの内訳</b><small>${inPeriod*2}枚使用・${remainingTickets}枚${split?'が期限切れ':'残り'}</small></div><div class="punch-strip" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i<inPeriod*2?'consumed':split?'expired':'unused'}"></i>`).join('')}</div></div>`;
  const basic=`<div class="fare-row"><div class="fare-item ${!buySet?'winner':''}"><div class="fare-label"><b>毎回、普通運賃</b></div><span data-fare-total="ordinary">${money(ordinaryTotal)}</span><small>片道400円 × ${n*2}回</small></div><div class="fare-item ${buySet?'winner':''}"><div class="fare-label"><b>片道10枚セット</b></div><span data-fare-total="bundle">${money(bundleTotal)}</span><small>同じ対象区間で利用</small></div></div>`;
  const delta=`<div class="comparison-table"><table><caption class="sr-only">往復が増減した場合の支払額と残枚数</caption><thead><tr><th scope="col">同じ区間・期限内</th><th scope="col">もとの${previousCount}往復</th><th scope="col">${n}往復なら</th></tr></thead><tbody><tr class="fare-item ${buySet?'':'winner'}"><th scope="row">毎回、普通運賃</th><td>${yen(previousCount*800)}</td><td data-fare-total="ordinary">${yen(ordinaryTotal)}</td></tr><tr class="fare-item ${buySet?'winner':''}"><th scope="row">10枚セット</th><td>2,800円</td><td data-fare-total="bundle">${yen(bundleTotal)}</td></tr><tr><th scope="row">セットの残り</th><td>${10-previousCount*2}枚</td><td>${remainingTickets}枚</td></tr></tbody></table></div>`;
  const expiry=`<div class="comparison-table expiry-table"><table><caption class="sr-only">期限内と期限後の費用を合計</caption><thead><tr><th scope="col">買い方</th><th scope="col">期限内<br>${inPeriod}往復</th><th scope="col">期限後<br>${afterPeriod}往復</th><th scope="col">合計</th></tr></thead><tbody><tr class="fare-item ${buySet?'':'winner'}"><th scope="row">毎回、<wbr>普通運賃</th><td>${yen(inPeriod*800)}</td><td>${yen(afterPeriod*800)}</td><td data-fare-total="ordinary">${yen(ordinaryTotal)}</td></tr><tr class="fare-item ${buySet?'winner':''}"><th scope="row">10枚セット<br>＋普通運賃</th><td>2,800円</td><td>${yen(afterPeriod*800)}</td><td data-fare-total="bundle">${yen(bundleTotal)}</td></tr></tbody></table></div>`;
  return `<section class="fare-module working-fares"><div class="case-line">${icon('commute',15)}${caseLabel} · 名鉄一宮 ⇄ 名鉄名古屋</div><div class="fare-top"><h1 id="compare">${title}</h1>${stepper}</div><p class="reason">${split?`期限後の${afterPeriod}往復には残った券を使えないため、片道400円を${afterPeriod*2}回追加します。`:changed?'通う区間はそのまま、予定が変わった場合の費用を並べました。':'大人1人・定期券を持っていない場合で、普通運賃と10枚セットを比べます。'}</p>${split?expiry:changed?delta:basic}${ribbon}<div class="fare-conclusion"><b>${buySet?'10枚セットを使う':'普通運賃で乗る'}方が${yen(difference)}安くなります。</b><p>${split?'使い始めたセットの残券は払い戻せません。':'セットの有効期間内に同じ区間を往復する場合です。'}</p>${external(buySet?ticketBase+'S20260300015':fareGuide,buySet?'CentXで10枚セットを見る':'名鉄の運賃比較を見る',true)}</div><div class="fare-foot"><small>有効期間は約60日。正確な日時は券面の利用開始期限でご確認ください。</small>${nav('commute/school','学校へ通う場合 '+icon('arrow',14),'text-link')}</div></section>`;
}
function cardQuickReply(route,context){
  const [scene,key,detail]=route.split('/');
  if(scene==='outing'&&(!key||key==='inuyama-plan')){
    const p=context.inuyamaPlan || defaultInuyama();
    if(p.preventTowerStairs||context.company?.avoidStairs||p.admission==='no')return p.order?.includes('tea')?'栄で屋内の休憩場所を探したい':'城下町でお茶もしたい';
    if(p.ticket)return 'お城には入らず、城下町だけにしたい';
    if(p.admission==='yes'&&!context.company)return itineraryTicket;
    if(p.order?.includes('tea')&&p.admission==='no')return 'やっぱり近場で';
    return itineraryEdit;
  }
  if(scene==='airport'){
    if(key==='seat-options')return departurePrep;
    if(detail==='ready')return context.seatClass==='general'?'やっぱり座席を指定したい':'やっぱり一般車にする';
    if(!key||key==='sakae')return seatComparison;
  }
  if(route==='commute/school/train'){
    return context.schoolStep==='prepare'?'どこで受け取る？':context.schoolStep==='collect'?'準備する書類をもう一度見たい':'新規の通学定期は何を用意する？';
  }
  if(scene==='commute'&&(!key||key==='work'&&/^[1-5]$/.test(detail))){
    if(context.fare?.stage==='expiry')return context.fare.afterPeriod>1?'すべて期限内にすると？':'最後の1回も期限内なら？';
    if(context.fare?.stage==='delta'||Number(detail)===5)return expiredTrip;
    return extraTrip;
  }
  return '';
}
function exampleContext(route){
  if(route==='outing')return {examplePlace:'inuyama'};
  if(route==='airport')return {exampleOrigin:'sakae'};
  if(route==='commute')return {exampleCount:4};
  return {};
}
function storePrepCheck(input){
  const record=currentRecord();
  record.context.prepChecked={...record.context.prepChecked,[input.dataset.prep]:input.checked};
  let id=history.state?.consultation;
  if(!id){
    id=Date.now().toString(36)+'-'+(++serial);
    history.replaceState({consultation:id},'',location.href);
  }
  travelMemory.set(id,record);
  const inputs=[...main.querySelectorAll('[data-prep]')];
  const label=main.querySelector('[data-prep-count]');
  if(label)label.textContent=`${inputs.filter(el=>el.checked).length} / ${inputs.length} 件確認`;
}


function captureCardLayout(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return null;
  const schedule=document.querySelector('.day-stops ol');
  if(schedule){
    const top=schedule.getBoundingClientRect().top;
    return {kind:'day',positions:new Map([...schedule.querySelectorAll('[data-stop]')].map(row=>[row.dataset.stop,row.getBoundingClientRect().top-top]))};
  }
  const strip=document.querySelector('.punch-strip');
  if(strip)return {kind:'fare',tickets:[...strip.children].map(el=>el.className),totals:new Map([...document.querySelectorAll('[data-fare-total]')].map(el=>[el.dataset.fareTotal,el.textContent]))};
  return null;
}
function animateCardEdit(prior){
  if(!prior || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const content=document.querySelector('.answer-content');
  if(prior.kind==='day'){
    const schedule=content.querySelector('.day-stops ol');
    if(!schedule)return;
    content.style.animation='none';
    const top=schedule.getBoundingClientRect().top;
    for(const row of schedule.querySelectorAll('[data-stop]')){
      const old=prior.positions.get(row.dataset.stop);
      if(old===undefined){
        row.animate([{opacity:0,transform:'translateX(12px)',backgroundColor:'#e8ddbe'},{opacity:1,transform:'translateX(0)',backgroundColor:'transparent'}],{duration:370,easing:'ease-out'});
        continue;
      }
      const offset=old-(row.getBoundingClientRect().top-top);
      if(Math.abs(offset)>1)row.animate([{transform:`translateY(${offset}px)`,backgroundColor:'#f3e9ce'},{transform:'translateY(0)',backgroundColor:'transparent'}],{duration:350,easing:'cubic-bezier(.25,.7,.3,1)'});
    }
  }else if(prior.kind==='fare'){
    const strip=content.querySelector('.punch-strip');
    if(!strip)return;
    content.style.animation='none';
    [...strip.children].forEach((ticket,i)=>{
      if(prior.tickets[i]!==ticket.className)ticket.animate([{backgroundColor:'#dbac64',transform:'translateY(-3px)'},{backgroundColor:'#dbac64',offset:.4},{transform:'translateY(0)'}],{duration:520,easing:'ease-out'});
    });
    for(const amount of content.querySelectorAll('[data-fare-total]')){
      if(prior.totals.get(amount.dataset.fareTotal)!==amount.textContent)
        amount.animate([{backgroundColor:'#f4dda9',color:'#784818'},{backgroundColor:'#f4dda9',offset:.44},{backgroundColor:'transparent'}],{duration:540,easing:'ease-out'});
    }
  }
}


function schoolBookingView(step){
  const collect=step==='collect';
  const steps=collect?[
    ['承認メールを開く','名鉄の審査・承認後に、登録したメールアドレスへ通知が届きます。'],
    ['「定期券」と書かれた券売機へ','対応する駅の券売機にメールのQRコードをかざすか、購入予約番号を入力します。'],
    ['暗証番号を入力して購入','Web予約で自分が設定した暗証番号を使います。通用開始日の14日前から購入できます。']
  ]:[
    ['学校の証明書を用意','学校が発行した「通学証明書」または「通学定期乗車券購入兼用証明書」を用意します。'],
    ['証明書の写真を撮る','氏名・住所・生年月日、有効期間、学校名・所在地、卒業予定年月日が読み取れる状態で撮影します。'],
    ['専用サイトで申し込む','区間や開始日を入力し、証明書の写真をアップロード。名鉄の審査結果をメールで受け取ります。']
  ];
  return `<section class="school-booking"><div class="case-line">${icon('train',15)}名鉄電車 · 新規の通学manaca定期券</div><h1>${collect?'<span class="phrase">承認メールが届いたら、</span><span class="phrase">駅の券売機へ。</span>':'まず、学校の証明書を用意。'}</h1><p class="reason">${collect?'予約した定期券は「定期券」と表示された対応券売機で購入します。':'高校へ通う新規の通学定期は、専用Webサービスで学校の証明書を提出します。'}</p><ol>${steps.map(([name,description])=>`<li><div><b>${name}</b><p>${description}</p></div></li>`).join('')}</ol>${external(schoolGuide,collect?'名鉄の対応券売機・購入方法を確認':'名鉄の通学定期の手続きへ',true)}${alternatives('利用する路線を変える',[nav('commute/school/bus','らんらんバスで高校へ'),nav('commute/school/child','らんらんバスで小学校へ')])}</section>`;
}
