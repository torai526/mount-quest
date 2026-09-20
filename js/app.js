
function cloneStateSnapshot(s){
  return new State(
    s.rules,
    s.board.map(stack=>stack.map(piece=>({...piece}))),
    s.reserves.map(counts=>[...counts]),
    s.turn
  );
}
function saveHistory(){
  history.push({state:cloneStateSnapshot(state),gameOver,winningLine:[...winningLine],positionHistory:[...positionHistory]});
  if(history.length>80)history.shift();
}
function updateUndoButton(){
  const button=$('#undoBtn');
  if(button)button.disabled=history.length===0||(config.mode==='ai'&&state?.turn===0&&history.length<2&&!gameOver);
}
function undoMove(){
  cancelWorker();clearAllTimers();
  godHint=null;godJobId++;
  if(!state||history.length===0){toast('戻せる手がありません');return}
  aiJobId++;
  aiThinking=false;
  $('#resultModal').classList.remove('open');
  let steps=1;
  if(config.mode==='ai'&&state.turn===0&&history.length>=2)steps=2;
  let previous=null;
  while(steps-- > 0&&history.length)previous=history.pop();
  if(!previous)return;
  state=cloneStateSnapshot(previous.state);
  gameOver=false;
  winningLine=[];
  positionHistory=[...(previous.positionHistory||[])];
  selection=null;
  lastMoveDst=null;lastMoveWasCover=false;returnAnimation=true;
  renderGame();
  updateUndoButton();
  toast(config.mode==='ai'&&state.turn===0?'直前の1往復を戻しました':'一手戻しました');
}
function startGame(){saveCurrentSettings();flushData();config={mode:selected('mode'),size:+selected('size'),difficulty:selected('difficulty'),first:selected('first'),godHelp:selected('godHelp')};if(config.first==='random')config.first=Math.random()<.5?'hero':'demon';rules=new Rules(config.size);state=new State(rules,null,null,config.first==='hero'?0:1);selection=null;gameOver=false;winningLine=[];aiThinking=false;aiJobId++;history=[];positionHistory=[repetitionKey(state)];godHint=null;godThinking=false;godJobId++;lastMoveDst=null;lastMoveWasCover=false;lastRenderedTurn=null;returnAnimation=false;godHint=null;godThinking=false;godJobId++;unlock('firstGame');showScreen('gameScreen');renderGame();if(config.mode==='ai'&&state.turn===1)requestAI()}
$('#launchBtn').addEventListener('click',startGame);

$('#board').addEventListener('click',(event)=>{const cell=event.target.closest('.cell');if(!cell||!$('#board').contains(cell))return;cellClick(Number(cell.dataset.square))});

function renderGame(){updateUndoButton();const godBtn=$('#godBtn');if(godBtn){const show=config.godHelp==='on'&&!gameOver;const unavailable=godThinking||aiThinking||(config.mode==='ai'&&state?.turn!==0);godBtn.classList.toggle('hidden',!show);godBtn.disabled=unavailable;godBtn.querySelector('span').textContent=godThinking?'神託を受信中…':aiThinking?'魔王AIが思考中…':(config.mode==='ai'&&state?.turn!==0?'勇者軍の手番で利用可能':'絶対神に問う')}const st=$('#status');const turnChanged=lastRenderedTurn!==null&&lastRenderedTurn!==state.turn;st.textContent=gameOver?'対局終了':aiThinking?'魔王AIが思考中…':`${PLAYER_NAMES[state.turn]}の手番`;st.className=`status ${state.turn===0?'hero-side':'demon-side'}`;if(turnChanged){st.classList.add('turn-change');setTimeout(()=>st.classList.remove('turn-change'),520)}lastRenderedTurn=state.turn;renderReserve('#heroReserve',0);renderReserve('#demonReserve',1);const board=$('#board');board.className=`board n${rules.n}`;board.innerHTML='';for(let i=0;i<state.board.length;i++){const c=document.createElement('button');c.className='cell';c.type='button';if(selection?.src===i)c.classList.add('selected');if(winningLine.includes(i))c.classList.add('winning');if(i===lastMoveDst)c.classList.add('last-move');if(godHint?.src===i)c.classList.add('god-source');if(godHint?.dst===i)c.classList.add('god-target');if(selection&&state.legal({src:selection.src,dst:i,size:selection.size}))c.classList.add('legal-target');const p=state.top(i);if(p){const d=document.createElement('div');d.className=`board-piece p${p.player} s${p.size}`;if(i===lastMoveDst)d.classList.add(returnAnimation?'piece-return':(lastMoveWasCover?'piece-cover':'piece-enter'));const meta=PIECES[p.player][p.size-1];d.innerHTML=`<span class="turn-aura"></span>${imageTag(meta.asset,meta.name)}<span class="badge">${p.size}</span>`;c.appendChild(d)}c.dataset.square=String(i);board.appendChild(c)}}
function renderReserve(sel,player){const el=$(sel);el.innerHTML=`<div class="reserve-title">${PLAYER_NAMES[player]}の持ち駒</div>`;PIECES[player].forEach(piece=>{const count=state.reserves[player][piece.size-1],b=document.createElement('button');b.type='button';b.className='reserve-piece';if(selection?.src===null&&selection.size===piece.size&&state.turn===player)b.classList.add('selected');if(godHint?.src===null&&godHint?.size===piece.size&&state.turn===player)b.classList.add('god-source');b.disabled=gameOver||aiThinking||state.turn!==player||count===0||(config.mode==='ai'&&player===1);b.innerHTML=`${imageTag(piece.asset,piece.name)}<span>${piece.name}</span><span class="piece-count">×${count}</span>`;b.addEventListener('click',()=>{
  const sameSelection=selection?.src===null&&selection?.size===piece.size;
  selection=sameSelection?null:{src:null,size:piece.size};
  renderGame();
});el.appendChild(b)})}
function cellClick(i){
  godHint=null;
  if(gameOver||aiThinking||(config.mode==='ai'&&state.turn===1))return;
  if(selection?.src===i){
    selection=null;
    renderGame();
    return;
  }
  if(selection){const m={src:selection.src,dst:i,size:selection.size};if(state.legal(m)){playMove(m,false);return}toast('そこには置けません')}const p=state.top(i);if(p&&p.player===state.turn){selection={src:i,size:p.size};renderGame()}}

function mountPhrase(player,size){
  if(player===0)return size===3?["勇者奥義","勇者が敵を完全制圧！"]:size===2?["鉄壁強襲","戦士が前線を制圧！"]:["魔導封印","魔法使いが敵を封じた！"];
  return size===3?["魔王降臨","魔王がすべてを支配！"]:size===2?["魔界強襲","魔人が敵陣を制圧！"]:["奇襲成功","ゴブリンが敵を奪った！"];
}
function showMountEffect(dst,player,size){
  const layer=$('#mountFx'),cell=$('#board').children[dst];if(!layer||!cell)return;
  const rect=cell.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  layer.style.setProperty('--fx-x',`${x}px`);layer.style.setProperty('--fx-y',`${y}px`);
  const [kicker,sub]=mountPhrase(player,size);$('#fxKicker').textContent=kicker;$('#fxSub').textContent=sub;
  layer.querySelectorAll('.fx-particle').forEach(p=>p.remove());
  const colors=player===0?["#60a5fa","#fbbf24","#ffffff"]:["#ef4444","#a855f7","#fbbf24"];
  for(let i=0;i<22;i++){const p=document.createElement('i');p.className='fx-particle';p.style.setProperty('--angle',`${i*360/22}deg`);p.style.setProperty('--distance',`${75+Math.random()*110}px`);p.style.setProperty('--delay',`${Math.random()*90}ms`);p.style.setProperty('--particle',colors[i%colors.length]);layer.appendChild(p)}
  layer.classList.remove('active');void layer.offsetWidth;layer.classList.add('active');
  const board=$('#board');board.classList.remove('shake');void board.offsetWidth;board.classList.add('shake');
  setTimeout(()=>{layer.classList.remove('active');board.classList.remove('shake')},1200);
}
function playMove(move,fromAI){godHint=null;godJobId++;saveHistory();const mover=state.turn,result=state.apply(move);lastMoveDst=move.dst;lastMoveWasCover=result.covered;returnAnimation=false;state=result.state;selection=null;if(result.covered){const d=loadData();d.covers++;saveData(d);if(d.covers>=10)unlock('cover10')}const wins=state.winners();if(wins.length>=2){finishDraw('両軍のラインが同時に完成しました');return}if(wins.length===1){finish(wins[0].player,wins[0].line);return}if(state.moves().length===0){finish(mover,[]);return}positionHistory.push(repetitionKey(state));if(threefold(positionHistory)){finishDraw('同一局面が3回連続で繰り返されました');return}renderGame();if(result.covered)scheduleTimer(()=>showMountEffect(move.dst,mover,move.size),40);if(config.mode==='ai'&&state.turn===1&&!fromAI)requestAI()}
function showVictoryEffect(winner){
  const layer=$('#victoryFx'),word=$('#victoryWord');if(!layer)return;
  word.textContent=winner===0?'VICTORY!':'DEFEATED';
  word.style.color=winner===0?'#fff7c2':'#fecaca';
  layer.querySelectorAll('.confetti').forEach(x=>x.remove());
  const colors=winner===0?["#fbbf24","#60a5fa","#ffffff","#22c55e"]:["#ef4444","#a855f7","#111827","#fbbf24"];
  for(let i=0;i<52;i++){const c=document.createElement('i');c.className='confetti';c.style.left=`${Math.random()*100}%`;c.style.setProperty('--c',colors[i%colors.length]);c.style.setProperty('--x',`${(Math.random()-.5)*160}px`);c.style.setProperty('--drift',`${(Math.random()-.5)*220}px`);c.style.setProperty('--rot',`${Math.random()*360}deg`);c.style.setProperty('--dur',`${1.6+Math.random()*1.3}s`);c.style.setProperty('--delay',`${Math.random()*.55}s`);layer.appendChild(c)}
  layer.classList.remove('active');void layer.offsetWidth;layer.classList.add('active');setTimeout(()=>layer.classList.remove('active'),2800);
}
function finishDraw(reason){gameOver=true;winningLine=[];renderGame();if(config.mode==='ai'){const d=loadData();d.games++;d.draws=(d.draws||0)+1;saveData(d)}$('#resultIcon').textContent='🤝';$('#resultTitle').textContent='引き分け';$('#resultText').textContent=reason;scheduleTimer(()=>$('#resultModal').classList.add('open'),450)}
function finish(winner,line){gameOver=true;winningLine=line;renderGame();if(config.mode==='ai'){const d=loadData();d.games++;if(winner===0){d.wins++;d.byDifficulty[config.difficulty].w++}else{d.losses++;d.byDifficulty[config.difficulty].l++}saveData(d);if(winner===0){unlock('firstWin');if(config.difficulty==='hard')unlock('hardWin');if(config.difficulty==='expert')unlock('expertWin');if(d.wins>=10)unlock('tenWins')}}$('#resultIcon').textContent=winner===0?'✨⚔️✨':'🔥👑🔥';$('#resultTitle').textContent=`${PLAYER_NAMES[winner]}の勝利！`;$('#resultText').textContent=winner===0?'勇者軍が魔王軍を打ち破りました。':'魔王軍が世界を支配しました。';setTimeout(()=>showVictoryEffect(winner),180);setTimeout(()=>$('#resultModal').classList.add('open'),1850)}

function moveDescription(move){
  const piece=PIECES[state.turn][move.size-1].name;
  const row=Math.floor(move.dst/rules.n)+1,col=move.dst%rules.n+1;
  return move.src===null?`${piece}を ${row}行${col}列へ配置せよ`:`${piece}を ${row}行${col}列へ進めよ`;
}
function showGodRevelation(move){
  const overlay=$('#godOverlay');$('#godSubText').textContent=moveDescription(move);
  overlay.classList.remove('active');void overlay.offsetWidth;overlay.classList.add('active');
  setTimeout(()=>overlay.classList.remove('active'),2200);
}
async function askAbsoluteGod(){if(config.godHelp!=='on'||gameOver||godThinking||aiThinking)return;if(config.mode==='ai'&&state.turn!==0)return toast('勇者軍の手番で利用できます');const job=++godJobId,snapshot=state;godThinking=true;godHint=null;renderGame();try{const r=await workerSearch('GOD',snapshot,'expert',1100);if(job!==godJobId||state!==snapshot||gameOver)return;godThinking=false;if(!r.move||!state.legal(r.move)){renderGame();return toast('神託を授けられる手がありません')}godHint={...r.move};renderGame();showGodRevelation(r.move);scheduleTimer(()=>{if(job===godJobId){godHint=null;renderGame()}},9000)}catch(e){if(job!==godJobId)return;godThinking=false;renderGame();toast('神託が乱れました')}}
async function requestAI(){if(gameOver||config.mode!=='ai'||state.turn!==1)return;const job=++aiJobId,snapshot=state;aiThinking=true;renderGame();try{const r=await workerSearch('AI',snapshot,config.difficulty,AI_LIMITS[config.difficulty]||180);if(job!==aiJobId||state!==snapshot||gameOver)return;aiThinking=false;if(r.move&&state.legal(r.move))playMove(r.move,true);else{const m=state.moves()[0];m?playMove(m,true):finish(0,[])}}catch(e){if(job!==aiJobId)return;aiThinking=false;const m=state.moves()[0];m?playMove(m,true):finish(0,[])}}
class AI{
 static choose(s,diff,limit){
   const start=performance.now(),deadline=start+limit;
   let moves=s.moves();
   if(!moves.length)return null;
   const fallback=moves[Math.floor(Math.random()*moves.length)];
   for(const m of moves){
     if(performance.now()>=deadline)return fallback;
     const ns=s.apply(m).state;
     if(ns.winners().some(w=>w.player===s.turn))return m;
   }
   if(diff==='easy')return fallback;
   const safe=[];
   for(const m of moves){
     if(performance.now()>=deadline)break;
     const ns=s.apply(m).state;
     let loses=false;
     const replies=ns.moves();
     for(const om of replies){
       if(performance.now()>=deadline)break;
       if(ns.apply(om).state.winners().some(w=>w.player===1-s.turn)){loses=true;break}
     }
     if(!loses)safe.push(m);
   }
   if(safe.length)moves=safe;
   moves=this.order(s,moves);
   const maxDepth={medium:2,hard:3,expert:5}[diff]||2;
   let best=moves[0]||fallback;
   for(let depth=1;depth<=maxDepth;depth++){
     if(performance.now()>=deadline)break;
     let localBest=null,localScore=-Infinity;
     for(const m of moves){
       if(performance.now()>=deadline)break;
       const score=this.search(s.apply(m).state,depth-1,-Infinity,Infinity,s.turn,deadline);
       if(score>localScore){localScore=score;localBest=m}
     }
     if(localBest)best=localBest;
   }
   return best;
 }
 static search(s,depth,a,b,root,deadline){
   if(performance.now()>=deadline)return this.eval(s,root);
   const ws=s.winners();
   if(ws.some(w=>w.player===root))return 100000+depth;
   if(ws.some(w=>w.player===1-root))return -100000-depth;
   if(depth<=0)return this.eval(s,root);
   const moves=this.order(s,s.moves());
   if(!moves.length)return 0;
   const maximizing=s.turn===root;
   let value=maximizing?-Infinity:Infinity;
   for(const m of moves){
     if(performance.now()>=deadline)break;
     const v=this.search(s.apply(m).state,depth-1,a,b,root,deadline);
     if(maximizing){value=Math.max(value,v);a=Math.max(a,value)}
     else{value=Math.min(value,v);b=Math.min(b,value)}
     if(b<=a)break;
   }
   return Number.isFinite(value)?value:this.eval(s,root);
 }
 static eval(s,root){
   let score=0,n=s.rules.n;
   for(const line of s.rules.lines){
     let mine=0,opp=0,sizeMine=0,sizeOpp=0;
     for(const q of line){const p=s.top(q);if(!p)continue;if(p.player===root){mine++;sizeMine+=p.size}else{opp++;sizeOpp+=p.size}}
     if(mine&&!opp)score+=Math.pow(8,mine)+sizeMine*3;
     if(opp&&!mine)score-=Math.pow(9,opp)+sizeOpp*3;
     if(mine===n-1&&!opp)score+=900;
     if(opp===n-1&&!mine)score-=1100;
   }
   const centers=n===3?[4]:[5,6,9,10];
   for(const q of centers){const p=s.top(q);if(p)score+=(p.player===root?1:-1)*(12+p.size*2)}
   return score;
 }
 static order(s,moves){
   const centers=s.rules.n===3?[4]:[5,6,9,10];
   return [...moves].sort((a,b)=>this.priority(s,b,centers)-this.priority(s,a,centers));
 }
 static priority(s,m,centers){
   let v=m.size*4+(centers.includes(m.dst)?15:0)+(s.top(m.dst)?20:0);
   const ns=s.apply(m).state;
   if(ns.winners().some(w=>w.player===s.turn))v+=10000;
   return v;
 }
}
$('#quitBtn').addEventListener('click',()=>{if(confirm('対局を終了してタイトルへ戻りますか？')){cancelWorker();clearAllTimers();aiJobId++;aiThinking=false;showScreen('homeScreen')}});
$('#godBtn').addEventListener('click',askAbsoluteGod);
$('#undoBtn').addEventListener('click',undoMove);
$('#resetBtn').addEventListener('click',()=>{if(confirm('同じ設定で最初からやり直しますか？')){cancelWorker();clearAllTimers();aiJobId++;aiThinking=false;rules=new Rules(config.size);state=new State(rules,null,null,config.first==='hero'?0:1);selection=null;gameOver=false;winningLine=[];history=[];positionHistory=[repetitionKey(state)];godHint=null;godThinking=false;godJobId++;lastMoveDst=null;lastMoveWasCover=false;lastRenderedTurn=null;returnAnimation=false;renderGame();if(config.mode==='ai'&&state.turn===1)requestAI()}});
$('#rulesBtn').addEventListener('click',()=>$('#rulesModal').classList.add('open'));$('#closeRulesBtn').addEventListener('click',()=>$('#rulesModal').classList.remove('open'));
$('#rematchBtn').addEventListener('click',()=>{$('#resultModal').classList.remove('open');cancelWorker();clearAllTimers();aiJobId++;aiThinking=false;rules=new Rules(config.size);state=new State(rules,null,null,config.first==='hero'?0:1);selection=null;gameOver=false;winningLine=[];history=[];positionHistory=[repetitionKey(state)];godHint=null;godThinking=false;godJobId++;lastMoveDst=null;lastMoveWasCover=false;lastRenderedTurn=null;returnAnimation=false;renderGame();if(config.mode==='ai'&&state.turn===1)requestAI()});
$('#resultHomeBtn').addEventListener('click',()=>{$('#resultModal').classList.remove('open');showScreen('homeScreen')});
function renderStats(){const d=loadData(),decided=d.wins+d.losses,rate=decided?Math.round(d.wins/decided*100):0;$('#statsGrid').innerHTML=`<div class="stat"><strong>${d.games}</strong>AI対局</div><div class="stat"><strong>${d.wins}</strong>勝利</div><div class="stat"><strong>${d.losses}</strong>敗北</div><div class="stat"><strong>${d.draws||0}</strong>引き分け</div><div class="stat"><strong>${rate}%</strong>勝率（引分除外）</div><div class="stat"><strong>${d.covers}</strong>マウント</div><div class="stat"><strong>${Object.keys(d.unlocked||{}).length}</strong>実績解除</div>`}
function renderAchievements(){const d=loadData();$('#achievementList').innerHTML=ACHIEVEMENTS.map(a=>`<div class="achievement ${d.unlocked?.[a.id]?'unlocked':''}"><span class="achievement-icon">${d.unlocked?.[a.id]?a.icon:'🔒'}</span><div><strong>${a.name}</strong><small>${a.desc}</small></div></div>`).join('')}
$('#clearStatsBtn').addEventListener('click',()=>{if(!confirm('戦績と実績をすべて削除しますか？'))return;const settings={...loadData().settings};cachedData={...defaultData(),settings};saveData(cachedData,{immediate:true});renderStats();renderAchievements();toast('戦績と実績をリセットしました')});
$('#clearSettingsBtn').addEventListener('click',()=>{if(!confirm('ゲーム設定を初期状態へ戻しますか？'))return;const d=loadData();d.settings={...DEFAULT_SETTINGS};saveData(d,{immediate:true});applySavedSettings();toast('ゲーム設定を初期化しました')});
let toastTimer;function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1700)}
applySavedSettings();
window.addEventListener('pagehide',()=>{flushData();cancelWorker();clearAllTimers()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushData()});

