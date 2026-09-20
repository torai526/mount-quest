






const APP_VERSION='3.0.0';
let welcomePage=0;
function renderHomeProfile(){const d=loadData(),title=(typeof TITLES!=='undefined'?TITLES.find(t=>t.id===d.selectedTitle):null);$('#homeLevel').textContent=`Lv.${d.level||1}`;$('#homeTitle').textContent=title?.name||'駆け出し冒険者';$('#homeBestStreak').textContent=d.bestStreak||0;$('#homeQuestStars').textContent=`${totalQuestStars(d)} / 15`}
function renderWelcomePage(){const pages=$$('[data-welcome-page]'),dots=$$('#welcomeDots i');pages.forEach((page,index)=>page.classList.toggle('active',index===welcomePage));dots.forEach((dot,index)=>dot.classList.toggle('active',index===welcomePage));$('#welcomeBackBtn').disabled=welcomePage===0;$('#welcomeNextBtn').textContent=welcomePage===pages.length-1?'冒険を始める':'次へ'}
function completeOnboarding(){const d=loadData();d.onboardingComplete=true;d.lastSeenVersion=APP_VERSION;saveData(d,{immediate:true});$('#welcomeModal').classList.remove('open')}
function showStartupNotices(){const d=loadData();renderHomeProfile();if(!d.onboardingComplete){welcomePage=0;renderWelcomePage();$('#welcomeModal').classList.add('open');return}if(d.lastSeenVersion!==APP_VERSION){d.lastSeenVersion=APP_VERSION;saveData(d,{immediate:true});$('#releaseModal').classList.add('open')}}
function validatedBackupData(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('データ形式が正しくありません');const migrated=migrateData(raw);if(!Number.isFinite(migrated.level)||migrated.level<1)throw new Error('レベル情報が正しくありません');return migrated}
function backupEnvelope(){return{app:'mount-quest',format:1,version:APP_VERSION,exportedAt:new Date().toISOString(),data:loadData()}}
function backupJson(pretty=true){return JSON.stringify(backupEnvelope(),null,pretty?2:0)}
function renderSaveSummary(){const d=loadData();$('#saveSummary').innerHTML=`<div><strong>Lv.${d.level}</strong>冒険者レベル</div><div><strong>${d.games}</strong>AI対局</div><div><strong>${totalQuestStars(d)}</strong>クエスト星</div><div><strong>${d.dailyStamps||0}</strong>スタンプ</div><div><strong>${Object.keys(d.titles||{}).filter(k=>d.titles[k]).length}</strong>称号</div><div><strong>v${DATA_VERSION}</strong>保存形式</div>`}
function exportSaveFile(){const blob=new Blob([backupJson(true)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'),date=localDateKey();a.href=url;a.download=`mount-quest-save-${date}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('バックアップを書き出しました')}
function restoreBackupObject(envelope){if(!envelope||envelope.app!=='mount-quest'||!envelope.data)throw new Error('マウントクエストのバックアップではありません');cachedData=validatedBackupData(envelope.data);saveData(cachedData,{immediate:true});location.reload()}
async function importSaveFile(file){const text=await file.text(),parsed=JSON.parse(text);restoreBackupObject(parsed)}
async function copySaveString(){const text=backupJson(false);$('#saveTextArea').value=text;try{await navigator.clipboard.writeText(text);toast('バックアップ文字列をコピーしました')}catch{toast('文字列を表示しました。手動でコピーしてください')}}
function restoreSaveText(){const text=$('#saveTextArea').value.trim();if(!text)return toast('バックアップ文字列を入力してください');try{restoreBackupObject(JSON.parse(text))}catch(error){alert(`復元できませんでした。\n${error.message}`)}}
const BOARD_THEMES=[
 {id:'default',name:'王国の石畳',desc:'最初から使用可能',colors:['#1e3a5f','#25324a','#60a5fa'],unlocked:()=>true},
 {id:'forest',name:'精霊の森',desc:'クエストの星を5個獲得',colors:['#365314','#166534','#86efac'],unlocked:d=>totalQuestStars(d)>=5},
 {id:'inferno',name:'魔王城の祭壇',desc:'上級AIに1回勝利',colors:['#7f1d1d','#450a0a','#fca5a5'],unlocked:d=>(d.byDifficulty?.hard?.w||0)>=1},
 {id:'celestial',name:'天空神殿',desc:'デイリースタンプを3個獲得',colors:['#312e81','#581c87','#c4b5fd'],unlocked:d=>(d.dailyStamps||0)>=3},
 {id:'golden',name:'黄金の盤',desc:'冒険者レベル10に到達',colors:['#a16207','#713f12','#fde68a'],unlocked:d=>(d.level||1)>=10}
];
const CHARACTER_SKINS=[
 {id:'default',name:'通常装備',desc:'最初から使用可能',icon:'⚔️',unlocked:()=>true},
 {id:'silver',name:'白銀装備',desc:'いずれかの熟練度Lv.3',icon:'🛡️',unlocked:d=>Object.values(d.characterStats||{}).some(r=>masteryLevel(r)>=3)},
 {id:'golden',name:'黄金装備',desc:'いずれかの熟練度Lv.5',icon:'👑',unlocked:d=>Object.values(d.characterStats||{}).some(r=>masteryLevel(r)>=5)},
 {id:'divine',name:'神聖装備',desc:'デイリースタンプを7個獲得',icon:'✨',unlocked:d=>(d.dailyStamps||0)>=7}
];
function validSelectedCustomization(){const d=loadData(),theme=BOARD_THEMES.find(x=>x.id===d.selectedTheme),skin=CHARACTER_SKINS.find(x=>x.id===d.selectedSkin);if(!theme||!theme.unlocked(d))d.selectedTheme='default';if(!skin||!skin.unlocked(d))d.selectedSkin='default';saveData(d)}
function applyCustomization(){validSelectedCustomization();const d=loadData();document.body.classList.remove(...BOARD_THEMES.map(x=>`theme-${x.id}`));document.body.classList.add(`theme-${d.selectedTheme}`);const board=$('#board');if(board){board.classList.remove(...BOARD_THEMES.map(x=>`theme-${x.id}`),...CHARACTER_SKINS.map(x=>`skin-${x.id}`));board.classList.add(`theme-${d.selectedTheme}`,`skin-${d.selectedSkin}`)}}
function renderCustomization(){validSelectedCustomization();const d=loadData();$('#themeList').innerHTML=BOARD_THEMES.map(theme=>{const unlocked=theme.unlocked(d);return`<button class="customize-item ${unlocked?'':'locked'} ${d.selectedTheme===theme.id?'selected':''}" data-theme-id="${theme.id}" ${unlocked?'':'disabled'}><span class="customize-swatch">${theme.colors.map(color=>`<i style="background:${color}"></i>`).join('')}</span>${unlocked?'':'<span class="customize-lock">🔒</span>'}<strong>${theme.name}</strong><small>${theme.desc}</small></button>`}).join('');$('#skinList').innerHTML=CHARACTER_SKINS.map(skin=>{const unlocked=skin.unlocked(d);return`<button class="customize-item ${unlocked?'':'locked'} ${d.selectedSkin===skin.id?'selected':''}" data-skin-id="${skin.id}" ${unlocked?'':'disabled'}>${unlocked?'':'<span class="customize-lock">🔒</span>'}<div style="font-size:2rem;margin-bottom:7px">${skin.icon}</div><strong>${skin.name}</strong><small>${skin.desc}</small></button>`}).join('');const preview=$('#customizePreviewBoard');preview.className=`preview-board theme-${d.selectedTheme} skin-${d.selectedSkin}`}
function selectTheme(id){const d=loadData(),theme=BOARD_THEMES.find(x=>x.id===id);if(!theme||!theme.unlocked(d))return;d.selectedTheme=id;saveData(d,{immediate:true});applyCustomization();renderCustomization();toast(`盤面テーマ：${theme.name}`)}
function selectSkin(id){const d=loadData(),skin=CHARACTER_SKINS.find(x=>x.id===id);if(!skin||!skin.unlocked(d))return;d.selectedSkin=id;saveData(d,{immediate:true});applyCustomization();renderCustomization();toast(`スキン：${skin.name}`)}
const DAILY_TASK_POOL=[
 {type:'play',icon:'⚔️',title:'対局を1回完了する',target:1},
 {type:'win',icon:'🏆',title:'AI対戦で1回勝利する',target:1},
 {type:'mount',icon:'💥',title:'合計3回マウントする',target:3},
 {type:'god',icon:'✨',title:'絶対神の助言を1回使う',target:1},
 {type:'quest',icon:'🗺️',title:'クエストを1回クリアする',target:1},
 {type:'moves',icon:'♟️',title:'駒を10回動かす',target:10},
 {type:'analysis',icon:'📈',title:'対局解析を1回完了する',target:1},
 {type:'noUndoWin',icon:'💎',title:'一手戻るなしでAIに勝利する',target:1}
];
function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return`${y}-${m}-${d}`}
function seededDailyIndexes(key){let seed=0;for(const ch of key)seed=(seed*31+ch.charCodeAt(0))>>>0;const indexes=DAILY_TASK_POOL.map((_,i)=>i);for(let i=indexes.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[indexes[i],indexes[j]]=[indexes[j],indexes[i]]}return indexes.slice(0,3)}
function ensureDaily(){const d=loadData(),today=localDateKey();if(d.daily.date!==today){d.daily={date:today,claimed:false,tasks:seededDailyIndexes(today).map(index=>({...DAILY_TASK_POOL[index],progress:0}))};saveData(d,{immediate:true})}return d.daily}
function updateDaily(type,amount=1){const d=loadData(),daily=ensureDaily();if(daily.claimed)return;let changed=false;for(const task of daily.tasks)if(task.type===type&&task.progress<task.target){task.progress=Math.min(task.target,(task.progress||0)+amount);changed=true}if(changed){d.daily=daily;saveData(d,{immediate:true});if(daily.tasks.every(t=>t.progress>=t.target))toast('デイリークエスト達成！報酬を受け取れます')};return changed}
function renderDaily(){const d=loadData(),daily=ensureDaily();$('#dailyDate').textContent=daily.date.replaceAll('-',' / ');$('#dailyStampCount').textContent=d.dailyStamps||0;$('#dailyTaskList').innerHTML=daily.tasks.map(task=>{const complete=task.progress>=task.target,pct=Math.min(100,task.progress/task.target*100);return`<div class="daily-task ${complete?'complete':''}"><span class="daily-check">${complete?'✓':'!'}</span><span><strong>${task.icon} ${task.title}</strong><small><span class="daily-progress-bar"><i style="width:${pct}%"></i></span></small></span><span class="daily-progress">${task.progress}/${task.target}</span></div>`}).join('');const all=daily.tasks.every(t=>t.progress>=t.target);$('#claimDailyBtn').disabled=!all||daily.claimed;$('#claimDailyBtn').textContent=daily.claimed?'受取済み':'報酬を受け取る'}
function claimDailyReward(){const d=loadData(),daily=ensureDaily();if(daily.claimed||!daily.tasks.every(t=>t.progress>=t.target))return;daily.claimed=true;d.daily=daily;d.dailyStamps=(d.dailyStamps||0)+1;saveData(d,{immediate:true});awardProgress({xp:100,source:'daily'});renderDaily();$('#dailyCompleteModal').classList.add('open')}
const CHARACTER_BOOK=[
 {id:'wizard',player:0,size:1,name:'魔法使い',role:'勇者軍・小サイズ',lore:'遠距離から戦況を見通す術士。小さな体で空いたマスへ入り、勝利への道を作る。'},
 {id:'warrior',player:0,size:2,name:'戦士',role:'勇者軍・中サイズ',lore:'攻守の要となる前衛。小サイズの駒をマウントし、盤面の主導権を握る。'},
 {id:'hero',player:0,size:3,name:'勇者',role:'勇者軍・大サイズ',lore:'王国の希望を背負う最大の駒。小・中サイズを覆い、戦況を一手で変える。'},
 {id:'goblin',player:1,size:1,name:'ゴブリン',role:'魔王軍・小サイズ',lore:'素早く隙へ入り込む魔物。空いたマスを利用し、勇者軍の計画を乱す。'},
 {id:'demon',player:1,size:2,name:'魔人',role:'魔王軍・中サイズ',lore:'力と策略を兼ね備えた魔界の戦士。小さな駒を支配して戦線を押し上げる。'},
 {id:'demonlord',player:1,size:3,name:'魔王',role:'魔王軍・大サイズ',lore:'魔界を統べる最大の駒。強大な力で盤面を覆い、勇者軍を追い詰める。'},
 {id:'absolute-god',player:null,size:0,name:'絶対神',role:'神託・解析',lore:'盤上の無数の未来を見通す存在。最善手の助言と対局後の評価を授ける。',god:true}
];
function emptyCharacterRecord(){return{uses:0,mounts:0,lineWins:0,masteryXp:0}}
function getCharacterRecord(id){const d=loadData();return{...emptyCharacterRecord(),...(d.characterStats[id]||{})}}
function addCharacterProgress(id,{uses=0,mounts=0,lineWins=0,xp=0}={}){const d=loadData(),r={...emptyCharacterRecord(),...(d.characterStats[id]||{})};r.uses+=uses;r.mounts+=mounts;r.lineWins+=lineWins;r.masteryXp+=xp;d.characterStats[id]=r;saveData(d)}
function masteryLevel(record){return Math.max(1,Math.min(10,1+Math.floor(record.masteryXp/80)))}
function masteryProgress(record){const level=masteryLevel(record);if(level>=10)return 100;return Math.min(100,(record.masteryXp%80)/80*100)}
function masteryName(level){if(level>=10)return'虹耀の盟友';if(level>=7)return'黄金の達人';if(level>=5)return'熟練の戦友';if(level>=3)return'銀の仲間';return'駆け出し'}
function imageForCharacter(ch){return ch.god?'assets/absolute-god.png?v=27':`assets/webp/${ch.id}.webp?v=27`}
function renderEncyclopedia(){const d=loadData();$('#encyclopediaGrid').innerHTML=CHARACTER_BOOK.map(ch=>{const r={...emptyCharacterRecord(),...(d.characterStats[ch.id]||{})},level=masteryLevel(r),cls=level>=10?'mastery-10':level>=5?'mastery-5':level>=3?'mastery-3':'mastery-1';return `<button class="character-card ${cls} ${ch.god?'god-card':''}" data-character-id="${ch.id}"><span class="mastery-badge">熟練 Lv.${level}</span><img src="${imageForCharacter(ch)}" data-fallback="assets/${ch.id}.png?v=27" alt="${ch.name}" decoding="async" onerror="if(this.dataset.fallback)this.src=this.dataset.fallback"><strong>${ch.name}</strong><small>${ch.role}</small></button>`}).join('')}
function showCharacterDetail(id){const ch=CHARACTER_BOOK.find(x=>x.id===id);if(!ch)return;const r=getCharacterRecord(id),level=masteryLevel(r);$('#characterDetailName').textContent=ch.name;const image=$('#characterDetailImage');image.src=imageForCharacter(ch);image.alt=ch.name;$('#characterDetailMastery').textContent=`熟練度 Lv.${level}　${masteryName(level)}`;$('#characterMasteryBar').style.width=`${masteryProgress(r)}%`;$('#characterDetailStats').innerHTML=ch.god?`<div class="character-stat"><strong>${r.uses}</strong>神託回数</div><div class="character-stat"><strong>${r.lineWins}</strong>解析完了</div><div class="character-stat"><strong>${r.masteryXp}</strong>熟練XP</div>`:`<div class="character-stat"><strong>${r.uses}</strong>出撃</div><div class="character-stat"><strong>${r.mounts}</strong>マウント</div><div class="character-stat"><strong>${r.lineWins}</strong>勝利完成</div><div class="character-stat"><strong>${r.masteryXp}</strong>熟練XP</div>`;$('#characterDetailLore').textContent=ch.lore;$('#characterDetailModal').classList.add('open')}
function pieceAssetId(player,size){return PIECES[player][size-1].asset}
function recordWinningLine(winner,line){if(!Array.isArray(line))return;const ids=new Set();for(const square of line){const piece=state.top(square);if(piece&&piece.player===winner)ids.add(pieceAssetId(piece.player,piece.size))}for(const id of ids)addCharacterProgress(id,{lineWins:1,xp:25})}
const TITLES=[
 {id:'rookie',icon:'🗺️',name:'駆け出し冒険者',desc:'冒険を始める'},
 {id:'slayer',icon:'⚔️',name:'魔王討伐者',desc:'上級AIに勝利する'},
 {id:'legend',icon:'👑',name:'伝説の勇者',desc:'最強AIに勝利する'},
 {id:'oracle',icon:'✨',name:'神託を受けし者',desc:'絶対神を10回利用する'},
 {id:'mountMaster',icon:'💥',name:'マウント職人',desc:'累計50回マウントする'},
 {id:'streak5',icon:'🔥',name:'盤上の支配者',desc:'AI対戦で5連勝する'},
 {id:'questMaster',icon:'⭐',name:'草原の覇者',desc:'第1章で星15個を獲得する'},
 {id:'perfect',icon:'💎',name:'完全なる勝利',desc:'一手戻る・絶対神なしで最強AIに勝利する'}
];
function xpForLevel(level){return 100+(level-1)*40}
function totalQuestStars(data){return Object.values(data.questProgress||{}).reduce((sum,q)=>sum+(q.stars||0),0)}
function unlockTitle(id){const d=loadData();if(d.titles[id])return false;d.titles[id]=true;saveData(d,{immediate:true});const t=TITLES.find(x=>x.id===id);if(t)toast(`称号獲得：${t.name}`);return true}
function evaluateTitles(){const d=loadData();if(d.byDifficulty.hard.w>0)unlockTitle('slayer');if(d.byDifficulty.expert.w>0)unlockTitle('legend');if((d.godUses||0)>=10)unlockTitle('oracle');if(d.covers>=50)unlockTitle('mountMaster');if(d.bestStreak>=5)unlockTitle('streak5');if(totalQuestStars(d)>=15)unlockTitle('questMaster')}
function awardProgress({xp=0,result=null,difficulty=null,perfect=false,source='match'}={}){
  const d=loadData(),before={xp:d.xp,level:d.level,currentStreak:d.currentStreak,bestStreak:d.bestStreak,titles:{...d.titles}};let remaining=xp;d.xp+=remaining;
  while(d.xp>=xpForLevel(d.level)){d.xp-=xpForLevel(d.level);d.level++}
  if(result==='win'){d.currentStreak++;d.bestStreak=Math.max(d.bestStreak,d.currentStreak)}else if(result==='loss')d.currentStreak=0;
  if(perfect&&difficulty==='expert')d.titles.perfect=true;
  saveData(d,{immediate:true});lastProgressAward={before,source};evaluateTitles();
  if(d.level>before.level){$('#levelUpText').textContent=`冒険者レベルが ${d.level} になりました！`;scheduleTimer(()=>$('#levelUpModal').classList.add('open'),500)}
  return d.level;
}
function rollbackProgressAward(){if(!lastProgressAward)return;const d=loadData(),b=lastProgressAward.before;d.xp=b.xp;d.level=b.level;d.currentStreak=b.currentStreak;d.bestStreak=b.bestStreak;d.titles={...b.titles};saveData(d,{immediate:true});lastProgressAward=null}
function renderProfile(){evaluateTitles();const d=loadData(),need=xpForLevel(d.level);$('#profileLevel').textContent=d.level;$('#profileXpText').textContent=`${d.xp} / ${need} XP`;$('#profileXpBar').style.width=`${Math.min(100,d.xp/need*100)}%`;const selected=TITLES.find(t=>t.id===d.selectedTitle)||TITLES[0];$('#activeTitle').textContent=`${selected.icon} ${selected.name}`;$('#streakPanel').innerHTML=`<div class="streak-card"><strong>${d.currentStreak}</strong>現在の連勝</div><div class="streak-card"><strong>${d.bestStreak}</strong>最高連勝</div>`;$('#titleList').innerHTML=TITLES.map(t=>`<button class="title-item ${d.selectedTitle===t.id?'active':''}" data-title-id="${t.id}" ${d.titles[t.id]?'':'disabled'}><span class="title-icon">${d.titles[t.id]?t.icon:'🔒'}</span><span><strong>${t.name}</strong><small>${t.desc}</small></span><span>${d.selectedTitle===t.id?'使用中':''}</span></button>`).join('')}
function awardMatchXp(result){const base=result==='win'?100:result==='draw'?50:30,diff={easy:0,medium:20,hard:50,expert:100}[config.difficulty]||0,mount=matchMountCount*10,perfect=result==='win'&&config.difficulty==='expert'&&matchUndoCount===0&&matchGodCount===0;awardProgress({xp:base+diff+mount,result,difficulty:config.difficulty,perfect});}
const QUESTS=[
 {id:'1-1',title:'勝利への一手',description:'あと1手で勝利せよ',board:3,turn:0,maxPlayerMoves:1,goal:'win',noUndoStar:true,noGodStar:true,setup(state){state.board[0].push({player:0,size:1});state.board[1].push({player:0,size:2});state.board[4].push({player:1,size:1})}},
 {id:'1-2',title:'魔王軍を阻止せよ',description:'魔王軍の勝利を防ぎ、その後勝利せよ',board:3,turn:0,maxPlayerMoves:4,goal:'win',mustBlock:true,noUndoStar:true,setup(state){state.board[0].push({player:1,size:1});state.board[1].push({player:1,size:2});state.board[3].push({player:0,size:1});state.board[4].push({player:0,size:2})}},
 {id:'1-3',title:'二手の決着',description:'勇者軍の2手以内に勝利せよ',board:3,turn:0,maxPlayerMoves:2,goal:'win',noUndoStar:true,noGodStar:true,setup(state){state.board[0].push({player:0,size:1});state.board[4].push({player:0,size:2});state.board[1].push({player:1,size:1});state.board[5].push({player:1,size:2})}},
 {id:'1-4',title:'マウントの極意',description:'1回以上マウントして勝利せよ',board:3,turn:0,maxPlayerMoves:5,goal:'win',minMounts:1,noUndoStar:true,setup(state){state.board[0].push({player:0,size:1});state.board[4].push({player:1,size:1});state.board[8].push({player:0,size:2})}},
 {id:'1-5',title:'勇者なき勝利',description:'勇者を使わずに勝利せよ',board:3,turn:0,maxPlayerMoves:5,goal:'win',forbidHero:true,noUndoStar:true,noGodStar:true,setup(state){state.board[0].push({player:0,size:1});state.board[3].push({player:0,size:2});state.board[4].push({player:1,size:1});state.reserves[0][2]=0}}
];
function questProgress(){return loadData().questProgress||{}}
function renderQuestList(){const progress=questProgress();$('#questList').innerHTML=QUESTS.map((q,i)=>{const record=progress[q.id],unlocked=i===0||progress[QUESTS[i-1].id]?.cleared,stars=record?.stars||0;return `<button class="quest-card" data-quest-id="${q.id}" ${unlocked?'':'disabled'}><span class="quest-number">${i+1}</span><span><strong>${q.title}</strong><small>${q.description}</small>${record?`<small>最少 ${record.bestMoves}手・最高 ${record.bestRank||'-'}</small>`:''}</span><span class="quest-star-line">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span></button>`}).join('')}
function showQuestBrief(id){const q=QUESTS.find(x=>x.id===id);if(!q)return;currentQuest=q;$('#questBriefTitle').textContent=`QUEST ${q.id} ${q.title}`;$('#questBriefText').textContent=q.description;const conditions=[`★ クエストをクリア`,`★★ 勇者軍${q.maxPlayerMoves}手以内`,q.noUndoStar||q.noGodStar?'★★★ 一手戻る・絶対神なし':'★★★ 追加条件を達成'];$('#questConditions').innerHTML=conditions.map(x=>`<div class="quest-condition">${x}</div>`).join('');$('#questBriefModal').classList.add('open')}
function startSelectedQuest(){if(!currentQuest)return;questMode=true;config={mode:'ai',size:currentQuest.board,difficulty:currentQuest.id==='1-5'?'hard':'medium',first:'hero',godHelp:'on'};initializeMatch();state.turn=currentQuest.turn;currentQuest.setup(state);positionHistory=[repetitionKey(state)];questPlayerMoves=0;questUsedHero=false;questFailedReason='';$('#questBriefModal').classList.remove('open');showScreen('gameScreen');renderGame();const status=$('#status');status.insertAdjacentHTML('beforebegin',`<div id="questHud" class="quest-hud">QUEST ${currentQuest.id}　${currentQuest.description}</div>`)}
function questStars(winner){if(winner!==0)return 0;if(currentQuest.minMounts&&matchMountCount<currentQuest.minMounts)return 0;if(currentQuest.forbidHero&&questUsedHero)return 0;let stars=1;if(questPlayerMoves<=currentQuest.maxPlayerMoves)stars++;if(matchUndoCount===0&&matchGodCount===0)stars++;return Math.min(3,stars)}
function saveQuestResult(stars,rank='-'){if(!currentQuest||stars<1)return;const d=loadData(),old=d.questProgress[currentQuest.id]||{};d.questProgress[currentQuest.id]={cleared:true,stars:Math.max(stars,old.stars||0),bestMoves:Math.min(questPlayerMoves,old.bestMoves??Infinity),bestRank:betterRank(rank,old.bestRank)};saveData(d,{immediate:true})}
function betterRank(a,b){const order={S:5,A:4,B:3,C:2,D:1,'-':0};return(order[a]||0)>=(order[b]||0)?a:(b||'-')}
function finishQuest(winner){const stars=questStars(winner);gameOver=true;renderGame();$('#questResultIcon').textContent=stars?'✨⭐✨':'💨';$('#questResultTitle').textContent=stars?'QUEST CLEAR!':'QUEST FAILED';$('#questStars').textContent=stars?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆☆☆';$('#questResultText').textContent=stars?`${questPlayerMoves}手・マウント${matchMountCount}回でクリア`:(questFailedReason||'条件を達成できませんでした');if(stars){updateDaily('quest',1);const first=!questProgress()[currentQuest.id]?.cleared;saveQuestResult(stars);awardProgress({xp:(first?150:50)+stars*20,source:'quest'})}scheduleTimer(()=>$('#questResultModal').classList.add('open'),800)}
function leaveQuestMode(){questMode=false;currentQuest=null;$('#questHud')?.remove();clearAnalysisData()}
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
  matchUndoCount++;
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
function clearAnalysisData(){analysisSessionId++;analysisRunning=false;analysisMoves=[];analysisResults=[];analysisSelectedIndex=-1;}
function initializeMatch(){
  $('#questHud')?.remove();
  clearAnalysisData();
  matchUndoCount=0;matchGodCount=0;matchMountCount=0;
  cancelWorker();
  clearAllTimers();
  aiJobId++;
  godJobId++;
  aiThinking=false;
  godThinking=false;
  godHint=null;
  rules=new Rules(config.size);
  state=new State(rules,null,null,config.first==='hero'?0:1);
  selection=null;
  gameOver=false;
  winningLine=[];
  history=[];
  positionHistory=[repetitionKey(state)];
  lastMoveDst=null;
  lastMoveWasCover=false;
  lastRenderedTurn=null;
  returnAnimation=false;
}
function beginMatch(){
  initializeMatch();
  renderGame();
  if(config.mode==='ai'&&state.turn===1)requestAI();
}
function startGame(){
  saveCurrentSettings();
  flushData();
  config={mode:selected('mode'),size:+selected('size'),difficulty:selected('difficulty'),first:selected('first'),godHelp:selected('godHelp')};
  if(config.first==='random')config.first=Math.random()<.5?'hero':'demon';
  unlock('firstGame');
  showScreen('gameScreen');
  beginMatch();
}
$('#launchBtn').addEventListener('click',startGame);

$('#board').addEventListener('click',(event)=>{const cell=event.target.closest('.cell');if(!cell||!$('#board').contains(cell))return;cellClick(Number(cell.dataset.square))});

function renderGame(){updateUndoButton();const godBtn=$('#godBtn');if(godBtn){const show=config.godHelp==='on'&&!gameOver;const unavailable=godThinking||aiThinking||(config.mode==='ai'&&state?.turn!==0);godBtn.classList.toggle('hidden',!show);godBtn.disabled=unavailable;godBtn.querySelector('span').textContent=godThinking?'神託を受信中…':aiThinking?'魔王AIが思考中…':(config.mode==='ai'&&state?.turn!==0?'勇者軍の手番で利用可能':'絶対神に問う')}const st=$('#status');const turnChanged=lastRenderedTurn!==null&&lastRenderedTurn!==state.turn;st.textContent=gameOver?'対局終了':aiThinking?'魔王AIが思考中…':`${PLAYER_NAMES[state.turn]}の手番`;st.className=`status ${state.turn===0?'hero-side':'demon-side'}`;if(turnChanged){st.classList.add('turn-change');scheduleTimer(()=>st.classList.remove('turn-change'),520)}lastRenderedTurn=state.turn;renderReserve('#heroReserve',0);renderReserve('#demonReserve',1);const board=$('#board');board.className=`board n${rules.n}`;applyCustomization();board.innerHTML='';for(let i=0;i<state.board.length;i++){const c=document.createElement('button');c.className='cell';c.type='button';if(selection?.src===i)c.classList.add('selected');if(winningLine.includes(i))c.classList.add('winning');if(i===lastMoveDst)c.classList.add('last-move');if(godHint?.src===i)c.classList.add('god-source');if(godHint?.dst===i)c.classList.add('god-target');if(selection&&state.legal({src:selection.src,dst:i,size:selection.size}))c.classList.add('legal-target');const p=state.top(i);if(p){const d=document.createElement('div');d.className=`board-piece p${p.player} s${p.size}`;if(i===lastMoveDst)d.classList.add(returnAnimation?'piece-return':(lastMoveWasCover?'piece-cover':'piece-enter'));const meta=PIECES[p.player][p.size-1];d.innerHTML=`<span class="turn-aura"></span>${imageTag(meta.asset,meta.name)}<span class="badge">${p.size}</span>`;c.appendChild(d)}c.dataset.square=String(i);board.appendChild(c)}}
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
  scheduleTimer(()=>{layer.classList.remove('active');board.classList.remove('shake')},1200);
}
function playMove(move,fromAI){godHint=null;godJobId++;saveHistory();const beforeState=cloneStateSnapshot(state),mover=state.turn,result=state.apply(move);if(questMode&&mover===0){questPlayerMoves++;if(move.size===3)questUsedHero=true;}lastMoveDst=move.dst;lastMoveWasCover=result.covered;returnAnimation=false;state=result.state;selection=null;analysisMoves.push({moveNumber:analysisMoves.length+1,player:mover,move:{...move},beforeState,afterState:cloneStateSnapshot(state),pieceName:PIECES[mover][move.size-1].name,wasMount:result.covered});addCharacterProgress(pieceAssetId(mover,move.size),{uses:1,mounts:result.covered?1:0,xp:10+(result.covered?20:0)});updateDaily('moves',1);if(result.covered)updateDaily('mount',1);if(result.covered){matchMountCount++;const d=loadData();d.covers++;saveData(d);if(d.covers>=10)unlock('cover10')}const wins=state.winners();if(wins.length>=2){if(questMode){questFailedReason='両軍同時完成は失敗です';finishQuest(-1)}else finishDraw('両軍のラインが同時に完成しました');return}if(wins.length===1){if(questMode){recordWinningLine(wins[0].player,wins[0].line);finishQuest(wins[0].player)}else finish(wins[0].player,wins[0].line);return}if(state.moves().length===0){if(questMode)finishQuest(mover);else finish(mover,[]);return}if(questMode&&questPlayerMoves>=currentQuest.maxPlayerMoves&&state.turn===0){questFailedReason='規定手数内に勝利できませんでした';finishQuest(1);return}positionHistory.push(repetitionKey(state));if(threefold(positionHistory)){finishDraw('同一局面が3回連続で繰り返されました');return}renderGame();if(result.covered)scheduleTimer(()=>showMountEffect(move.dst,mover,move.size),40);if(config.mode==='ai'&&state.turn===1&&!fromAI)requestAI()}
function showVictoryEffect(winner){
  const layer=$('#victoryFx'),word=$('#victoryWord');if(!layer)return;
  word.textContent=winner===0?'VICTORY!':'DEFEATED';
  word.style.color=winner===0?'#fff7c2':'#fecaca';
  layer.querySelectorAll('.confetti').forEach(x=>x.remove());
  const colors=winner===0?["#fbbf24","#60a5fa","#ffffff","#22c55e"]:["#ef4444","#a855f7","#111827","#fbbf24"];
  for(let i=0;i<52;i++){const c=document.createElement('i');c.className='confetti';c.style.left=`${Math.random()*100}%`;c.style.setProperty('--c',colors[i%colors.length]);c.style.setProperty('--x',`${(Math.random()-.5)*160}px`);c.style.setProperty('--drift',`${(Math.random()-.5)*220}px`);c.style.setProperty('--rot',`${Math.random()*360}deg`);c.style.setProperty('--dur',`${1.6+Math.random()*1.3}s`);c.style.setProperty('--delay',`${Math.random()*.55}s`);layer.appendChild(c)}
  layer.classList.remove('active');void layer.offsetWidth;layer.classList.add('active');scheduleTimer(()=>layer.classList.remove('active'),2800);
}
function finishDraw(reason){if(questMode){questFailedReason=reason;finishQuest(-1);return}lastRecordedOutcome={type:'draw',difficulty:config.difficulty};gameOver=true;winningLine=[];renderGame();if(config.mode==='ai'){const d=loadData();d.games++;d.draws=(d.draws||0)+1;saveData(d);updateDaily('play',1);awardMatchXp('draw')}$('#resultIcon').textContent='🤝';$('#resultTitle').textContent='引き分け';$('#resultText').textContent=reason;scheduleTimer(()=>{ $('#resultModal').classList.add('open');scheduleTimer(showAnalysisQuestion,350)},450)}
function finish(winner,line){
  if(questMode){if(winner>=0)recordWinningLine(winner,line);finishQuest(winner);return}
  if(winner>=0)recordWinningLine(winner,line)
  lastRecordedOutcome={type:winner===0?'win':'loss',winner,difficulty:config.difficulty};
  gameOver=true;winningLine=line;renderGame();
  if(config.mode==='ai'){
    const d=loadData();d.games++;
    if(winner===0){d.wins++;d.byDifficulty[config.difficulty].w++}
    else{d.losses++;d.byDifficulty[config.difficulty].l++}
    saveData(d);
    if(winner===0){unlock('firstWin');if(config.difficulty==='hard')unlock('hardWin');if(config.difficulty==='expert')unlock('expertWin');if(d.wins>=10)unlock('tenWins')}
    updateDaily('play',1);if(winner===0){updateDaily('win',1);if(matchUndoCount===0)updateDaily('noUndoWin',1)}awardMatchXp(winner===0?'win':'loss');
  }
  $('#resultIcon').textContent=winner===0?'✨⚔️✨':'🔥👑🔥';
  $('#resultTitle').textContent=`${PLAYER_NAMES[winner]}の勝利！`;
  $('#resultText').textContent=winner===0?'勇者軍が魔王軍を打ち破りました。':'魔王軍が世界を支配しました。';
  scheduleTimer(()=>showVictoryEffect(winner),180);
  scheduleTimer(()=>{$('#resultModal').classList.add('open');scheduleTimer(showAnalysisQuestion,350)},1850);
}
function moveDescription(move){
  const piece=PIECES[state.turn][move.size-1].name;
  const row=Math.floor(move.dst/rules.n)+1,col=move.dst%rules.n+1;
  return move.src===null?`${piece}を ${row}行${col}列へ配置せよ`:`${piece}を ${row}行${col}列へ進めよ`;
}
function showGodRevelation(move){
  const overlay=$("#godOverlay"),image=$("#godCharacter"),fallback=$("#godFallback");
  $("#godSubText").textContent=moveDescription(move);
  if(image){
    image.style.display="block";
    image.style.opacity="1";
    if(fallback)fallback.style.display="none";
    if(!image.complete)image.src="assets/absolute-god.png?v=201";
  }
  overlay.classList.remove("active");
  void overlay.offsetWidth;
  requestAnimationFrame(()=>overlay.classList.add("active"));
  scheduleTimer(()=>overlay.classList.remove("active"),2400);
}
async function askAbsoluteGod(){if(config.godHelp!=='on'||gameOver||godThinking||aiThinking)return;if(config.mode==='ai'&&state.turn!==0)return toast('勇者軍の手番で利用できます');const job=++godJobId,snapshot=state;matchGodCount++;addCharacterProgress('absolute-god',{uses:1,xp:12});updateDaily('god',1);{const d=loadData();d.godUses=(d.godUses||0)+1;saveData(d)}godThinking=true;godHint=null;renderGame();try{const r=await workerSearch('GOD',snapshot,'expert',3000);if(job!==godJobId||state!==snapshot||gameOver)return;godThinking=false;if(!r.move||!state.legal(r.move)){renderGame();return toast('神託を授けられる手がありません')}godHint={...r.move};renderGame();showGodRevelation(r.move);scheduleTimer(()=>{if(job===godJobId){godHint=null;renderGame()}},9000)}catch(e){if(job!==godJobId)return;godThinking=false;renderGame();toast('神託が乱れました')}}
async function requestAI(){if(gameOver||config.mode!=='ai'||state.turn!==1)return;const job=++aiJobId,snapshot=state;aiThinking=true;renderGame();try{const r=await workerSearch('AI',snapshot,config.difficulty,AI_LIMITS[config.difficulty]||180);if(job!==aiJobId||state!==snapshot||gameOver)return;aiThinking=false;if(r.move&&state.legal(r.move))playMove(r.move,true);else{const m=state.moves()[0];m?playMove(m,true):finish(0,[])}}catch(e){if(job!==aiJobId)return;aiThinking=false;const m=state.moves()[0];m?playMove(m,true):finish(0,[])}}

function showAnalysisQuestion(){if(questMode||!gameOver||!analysisMoves.length)return;$('#analysisAskModal').classList.add('open')}
function normalizeEvaluation(score){if(score>=90000)return 100;if(score<=-90000)return-100;return Math.max(-99,Math.min(99,Math.round(100*Math.tanh(score/1200))))}
function evaluationLabel(delta){if(delta>=30)return'神の一手';if(delta>=15)return'好手';if(delta<=-45)return'致命手';if(delta<=-25)return'悪手';if(delta<=-10)return'疑問手';return'通常手'}

function moverDeltaAt(index){const current=analysisResults[index]?.score??0,previous=index?analysisResults[index-1].score:0,player=analysisResults[index]?.player??0;return (current-previous)*(player===0?1:-1)}
function classifyAllMoves(){return analysisResults.map((item,index)=>({...item,delta:moverDeltaAt(index),label:evaluationLabel(moverDeltaAt(index))}))}
function calculateResultRank(classified){
  const focus=config.mode==='ai'?classified.filter(x=>x.player===0):classified;
  const bad=focus.filter(x=>x.delta<=-25).length,fatal=focus.filter(x=>x.delta<=-45).length,great=focus.filter(x=>x.delta>=15).length,divine=focus.filter(x=>x.delta>=30).length;
  const winner=lastRecordedOutcome?.winner,won=config.mode==='local'||winner===0,movePenalty=Math.max(0,analysisMoves.length-(rules.n===3?10:18));
  let points=(won?72:38)+great*4+divine*5-fatal*20-bad*9-matchUndoCount*5-matchGodCount*4-movePenalty;
  if(lastRecordedOutcome?.type==='draw')points=55+great*3-bad*7-matchUndoCount*4;
  const rank=points>=92?'S':points>=78?'A':points>=62?'B':points>=45?'C':'D';
  const comments={S:'絶対神も認める完璧な対局',A:'勝負所を制した見事な対局',B:'堅実に戦い抜いた対局',C:'改善点が見つかる対局',D:'次の一手で大きく伸びる対局'};
  return{rank,comment:comments[rank],great,divine,bad,fatal};
}
function renderEnhancedResult(){
  if(!analysisResults.length)return;const classified=classifyAllMoves(),rank=calculateResultRank(classified);
  let bestIndex=0,turnIndex=0,best=-Infinity,largest=-Infinity;
  classified.forEach((item,index)=>{if(item.delta>best){best=item.delta;bestIndex=index}const swing=Math.abs(item.score-(index?classified[index-1].score:0));if(swing>largest){largest=swing;turnIndex=index}});
  const bestMove=classified[bestIndex],turn=classified[turnIndex];
  $('#resultSummary').classList.remove('hidden');$('#resultRank').textContent=rank.rank;$('#rankComment').textContent=rank.comment;
  $('#resultMetrics').innerHTML=`<div class="result-metric"><strong>${analysisMoves.length}</strong>手数</div><div class="result-metric"><strong>${matchMountCount}</strong>マウント</div><div class="result-metric"><strong>${rank.divine}</strong>神の一手</div><div class="result-metric"><strong>${rank.great}</strong>好手以上</div><div class="result-metric"><strong>${rank.bad}</strong>悪手</div><div class="result-metric"><strong>${matchUndoCount}</strong>一手戻る</div><div class="result-metric"><strong>${matchGodCount}</strong>絶対神</div>`;
  $('#bestMoveTitle').textContent=`第${bestMove.moveNumber}手 ${bestMove.pieceName}`;$('#bestMoveText').textContent=`評価変化 ${bestMove.delta>0?'+':''}${bestMove.delta}・${bestMove.label}`;$('#bestMoveCard').dataset.index=String(bestIndex);
  $('#turningPointTitle').textContent=`第${turn.moveNumber}手 ${turn.pieceName}`;$('#turningPointText').textContent=`評価 ${turn.score>0?'+':''}${turn.score}へ変化`;$('#turningPointCard').dataset.index=String(turnIndex);
}
async function beginPostGameAnalysis(){
  $('#analysisAskModal').classList.remove('open');$('#resultModal').classList.remove('open');$('#analysisModal').classList.add('open');
  $('#cancelAnalysisBtn').classList.remove('hidden');$('#restoreMoveBtn').classList.add('hidden');
  analysisResults=[];analysisRunning=true;$('#resultSummary').classList.add('hidden');const session=++analysisSessionId;renderAnalysisChart();
  for(let i=0;i<analysisMoves.length;i++){
    if(session!==analysisSessionId||!analysisRunning)return;
    $('#analysisProgress').textContent=`絶対神が解析中 ${i+1} / ${analysisMoves.length}`;
    try{const result=await workerSearch('ANALYZE',analysisMoves[i].afterState,'expert',350);if(session!==analysisSessionId)return;analysisResults.push({...analysisMoves[i],rawScore:result.score||0,score:normalizeEvaluation(result.score||0)});renderAnalysisChart()}catch(error){if(session!==analysisSessionId)return;analysisRunning=false;$('#analysisProgress').textContent='解析中に問題が発生しました';return}
  }
  analysisRunning=false;addCharacterProgress('absolute-god',{lineWins:1,xp:20});updateDaily('analysis',1);$('#cancelAnalysisBtn').classList.add('hidden');$('#analysisProgress').textContent='解析完了。グラフの点を選択してください';renderAnalysisChart();renderEnhancedResult();
}
function renderAnalysisChart(){
  const box=$('#analysisChart'),data=analysisResults;if(!data.length){box.innerHTML='<div style="padding:80px 20px;text-align:center;color:#bec9db">評価値を計算しています…</div>';return}
  const width=Math.max(560,data.length*46+80),height=320,left=48,right=20,top=24,bottom=42,plotW=width-left-right,plotH=height-top-bottom;
  const x=i=>left+(data.length===1?plotW/2:i*plotW/(data.length-1)),y=v=>top+(100-v)*plotH/200;
  let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="勇者軍側から見た評価値">`;
  for(const v of[-100,-50,0,50,100])svg+=`<line class="${v===0?'analysis-zero':'analysis-grid'}" x1="${left}" y1="${y(v)}" x2="${width-right}" y2="${y(v)}"/><text class="analysis-label" x="6" y="${y(v)+4}">${v>0?'+':''}${v}</text>`;
  svg+=`<polyline class="analysis-line" points="${data.map((d,i)=>`${x(i)},${y(d.score)}`).join(' ')}"/>`;
  data.forEach((d,i)=>{const cls=`analysis-point ${d.player===0?'hero':'demon'} ${d.wasMount?'mount':''} ${i===analysisSelectedIndex?'selected':''}`;svg+=`<circle class="${cls}" data-analysis-index="${i}" cx="${x(i)}" cy="${y(d.score)}" r="${i===analysisSelectedIndex?9:7}"><title>第${d.moveNumber}手 ${d.score>0?'+':''}${d.score}</title></circle><text class="analysis-label" x="${x(i)}" y="${height-17}" text-anchor="middle">${d.moveNumber}</text>`});
  box.innerHTML=svg+'</svg>';
}
function selectAnalysisMove(index){
  const item=analysisResults[index];if(!item)return;analysisSelectedIndex=index;renderAnalysisChart();
  const previous=index?analysisResults[index-1].score:0,delta=item.score-previous,label=evaluationLabel(moverDeltaAt(index)),row=Math.floor(item.move.dst/rules.n)+1,col=item.move.dst%rules.n+1;
  $('#analysisDetail').innerHTML=`<h3>第${item.moveNumber}手　${PLAYER_NAMES[item.player]}</h3><div class="analysis-score ${item.score>=0?'analysis-good':'analysis-bad'}">評価 ${item.score>0?'+':''}${item.score}</div><p>${item.pieceName}を ${row}行${col}列へ${item.move.src===null?'配置':'移動'}${item.wasMount?'（マウント）':''}</p><p>評価変化 ${delta>0?'+':''}${delta}　<strong>${label}</strong></p>`;
  const canRestore=config.mode==='local'||item.player===0;const button=$('#restoreMoveBtn');button.classList.toggle('hidden',!canRestore);button.dataset.index=String(index);if(!canRestore)$('#analysisDetail').insertAdjacentHTML('beforeend','<p class="note">AIの手には戻れません。勇者軍の手を選択してください。</p>');
}
function undoRecordedOutcome(){if(config.mode!=='ai'||!lastRecordedOutcome)return;const d=loadData();d.games=Math.max(0,d.games-1);if(lastRecordedOutcome.type==='win'){d.wins=Math.max(0,d.wins-1);d.byDifficulty[lastRecordedOutcome.difficulty].w=Math.max(0,d.byDifficulty[lastRecordedOutcome.difficulty].w-1)}else if(lastRecordedOutcome.type==='loss'){d.losses=Math.max(0,d.losses-1);d.byDifficulty[lastRecordedOutcome.difficulty].l=Math.max(0,d.byDifficulty[lastRecordedOutcome.difficulty].l-1)}else if(lastRecordedOutcome.type==='draw')d.draws=Math.max(0,(d.draws||0)-1);saveData(d,{immediate:true});rollbackProgressAward();lastRecordedOutcome=null}
function restoreAnalysisMove(index){
  const item=analysisResults[index];if(!item)return;if(config.mode==='ai'&&item.player!==0)return toast('AIの手には戻れません');
  if(!confirm(`第${item.moveNumber}手を指す直前へ戻りますか？\nこれ以降の手と解析結果は削除されます。`))return;
  undoRecordedOutcome();cancelWorker();clearAllTimers();state=cloneStateSnapshot(item.beforeState);gameOver=false;winningLine=[];selection=null;history=[];positionHistory=[repetitionKey(state)];lastMoveDst=null;lastMoveWasCover=false;lastRenderedTurn=null;returnAnimation=true;analysisMoves=analysisMoves.slice(0,index);$('#analysisModal').classList.remove('open');$('#analysisAskModal').classList.remove('open');$('#resultModal').classList.remove('open');clearAnalysisData();showScreen('gameScreen');renderGame();
}
function discardPostGameAnalysis(){clearAnalysisData();lastRecordedOutcome=null;$('#analysisAskModal').classList.remove('open');$('#analysisModal').classList.remove('open')}

$('#bestMoveCard').addEventListener('click',()=>selectAnalysisMove(Number($('#bestMoveCard').dataset.index)));
$('#turningPointCard').addEventListener('click',()=>selectAnalysisMove(Number($('#turningPointCard').dataset.index)));
$('#showAnalysisBtn').addEventListener('click',beginPostGameAnalysis);
$('#skipAnalysisBtn').addEventListener('click',()=>{discardPostGameAnalysis();$('#resultModal').classList.add('open')});
$('#analysisChart').addEventListener('click',event=>{const point=event.target.closest('[data-analysis-index]');if(point)selectAnalysisMove(Number(point.dataset.analysisIndex))});
$('#restoreMoveBtn').addEventListener('click',()=>restoreAnalysisMove(Number($('#restoreMoveBtn').dataset.index)));
$('#cancelAnalysisBtn').addEventListener('click',()=>{cancelWorker();discardPostGameAnalysis();$('#resultModal').classList.add('open')});
$('#closeAnalysisBtn').addEventListener('click',()=>{discardPostGameAnalysis();$('#resultModal').classList.add('open')});



$('#dataManagerBtn').addEventListener('click',()=>{renderSaveSummary();showScreen('dataScreen')});
$('#welcomeBackBtn').addEventListener('click',()=>{welcomePage=Math.max(0,welcomePage-1);renderWelcomePage()});
$('#welcomeNextBtn').addEventListener('click',()=>{const pages=$$('[data-welcome-page]');if(welcomePage>=pages.length-1)completeOnboarding();else{welcomePage++;renderWelcomePage()}});
$('#closeReleaseBtn').addEventListener('click',()=>$('#releaseModal').classList.remove('open'));
$('#exportSaveBtn').addEventListener('click',exportSaveFile);
$('#copySaveBtn').addEventListener('click',copySaveString);
$('#restoreTextBtn').addEventListener('click',restoreSaveText);
$('#importSaveInput').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{await importSaveFile(file)}catch(error){alert(`復元できませんでした。\n${error.message}`)}finally{event.target.value=''}});
$('#customizeMenuBtn').addEventListener('click',()=>{renderCustomization();showScreen('customizeScreen')});
$('#themeList').addEventListener('click',event=>{const item=event.target.closest('[data-theme-id]');if(item&&!item.disabled)selectTheme(item.dataset.themeId)});
$('#skinList').addEventListener('click',event=>{const item=event.target.closest('[data-skin-id]');if(item&&!item.disabled)selectSkin(item.dataset.skinId)});
$('#dailyMenuBtn').addEventListener('click',()=>{renderDaily();showScreen('dailyScreen')});
$('#claimDailyBtn').addEventListener('click',claimDailyReward);
$('#closeDailyCompleteBtn').addEventListener('click',()=>$('#dailyCompleteModal').classList.remove('open'));
$('#encyclopediaMenuBtn').addEventListener('click',()=>{renderEncyclopedia();showScreen('encyclopediaScreen')});
$('#encyclopediaGrid').addEventListener('click',event=>{const card=event.target.closest('[data-character-id]');if(card)showCharacterDetail(card.dataset.characterId)});
$('#closeCharacterDetailBtn').addEventListener('click',()=>$('#characterDetailModal').classList.remove('open'));
$('#profileMenuBtn').addEventListener('click',()=>{renderProfile();showScreen('profileScreen')});
$('#titleList').addEventListener('click',event=>{const button=event.target.closest('[data-title-id]');if(!button||button.disabled)return;const d=loadData();d.selectedTitle=button.dataset.titleId;saveData(d,{immediate:true});renderProfile()});
$('#closeLevelUpBtn').addEventListener('click',()=>$('#levelUpModal').classList.remove('open'));
$('#questMenuBtn').addEventListener('click',()=>{renderQuestList();showScreen('questScreen')});
$('#questList').addEventListener('click',event=>{const card=event.target.closest('[data-quest-id]');if(card&&!card.disabled)showQuestBrief(card.dataset.questId)});
$('#startQuestBtn').addEventListener('click',startSelectedQuest);
$('#cancelQuestBtn').addEventListener('click',()=>$('#questBriefModal').classList.remove('open'));
$('#questRetryBtn').addEventListener('click',()=>{$('#questResultModal').classList.remove('open');startSelectedQuest()});
$('#questListBtn').addEventListener('click',()=>{$('#questResultModal').classList.remove('open');leaveQuestMode();renderQuestList();showScreen('questScreen')});
$('#quitBtn').addEventListener('click',()=>{if(confirm('対局を終了してタイトルへ戻りますか？')){leaveQuestMode();clearAnalysisData();cancelWorker();clearAllTimers();aiJobId++;aiThinking=false;showScreen('homeScreen')}});
$('#godBtn').addEventListener('click',askAbsoluteGod);
$('#undoBtn').addEventListener('click',undoMove);
$('#resetBtn').addEventListener('click',()=>{if(confirm('同じ設定で最初からやり直しますか？'))beginMatch()});
$('#rulesBtn').addEventListener('click',()=>$('#rulesModal').classList.add('open'));$('#closeRulesBtn').addEventListener('click',()=>$('#rulesModal').classList.remove('open'));
$('#rematchBtn').addEventListener('click',()=>{discardPostGameAnalysis();$('#resultModal').classList.remove('open');beginMatch()});
$('#resultHomeBtn').addEventListener('click',()=>{discardPostGameAnalysis();$('#resultModal').classList.remove('open');showScreen('homeScreen')});
function renderStats(){const d=loadData(),decided=d.wins+d.losses,rate=decided?Math.round(d.wins/decided*100):0;$('#statsGrid').innerHTML=`<div class="stat"><strong>${d.games}</strong>AI対局</div><div class="stat"><strong>${d.wins}</strong>勝利</div><div class="stat"><strong>${d.losses}</strong>敗北</div><div class="stat"><strong>${d.draws||0}</strong>引き分け</div><div class="stat"><strong>${rate}%</strong>勝率（引分除外）</div><div class="stat"><strong>${d.covers}</strong>マウント</div><div class="stat"><strong>${Object.keys(d.unlocked||{}).length}</strong>実績解除</div>`}
function renderAchievements(){const d=loadData();$('#achievementList').innerHTML=ACHIEVEMENTS.map(a=>`<div class="achievement ${d.unlocked?.[a.id]?'unlocked':''}"><span class="achievement-icon">${d.unlocked?.[a.id]?a.icon:'🔒'}</span><div><strong>${a.name}</strong><small>${a.desc}</small></div></div>`).join('')}
$('#clearStatsBtn').addEventListener('click',()=>{if(!confirm('戦績と実績をすべて削除しますか？'))return;const settings={...loadData().settings};cachedData={...defaultData(),settings};saveData(cachedData,{immediate:true});renderStats();renderAchievements();toast('戦績と実績をリセットしました')});
$('#clearSettingsBtn').addEventListener('click',()=>{if(!confirm('ゲーム設定を初期状態へ戻しますか？'))return;const d=loadData();d.settings={...DEFAULT_SETTINGS};saveData(d,{immediate:true});applySavedSettings();applyCustomization();scheduleTimer(showStartupNotices,120);toast('ゲーム設定を初期化しました')});
let toastTimer;function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1700)}
applySavedSettings();
window.addEventListener('pagehide',()=>{flushData();cancelWorker();clearAllTimers()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushData();else ensureDaily()});


function registerPWA(){if(!("serviceWorker" in navigator))return;window.addEventListener("load",async()=>{try{const r=await navigator.serviceWorker.register("./service-worker.js?v=30",{updateViaCache:"none"});r.update().catch(()=>{});r.addEventListener("updatefound",()=>{const w=r.installing;if(!w)return;w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)toast("更新版があります。再読み込みしてください")})})}catch(e){console.warn("PWA登録失敗",e)}})}registerPWA();
