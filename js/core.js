"use strict";
const PIECES=[
  [{name:"魔法使い",asset:"wizard",emoji:"🧙",image:"assets/wizard.png",size:1},{name:"戦士",asset:"warrior",emoji:"🛡️",image:"assets/warrior.png",size:2},{name:"勇者",asset:"hero",emoji:"⚔️",image:"assets/hero.png",size:3}],
  [{name:"ゴブリン",asset:"goblin",emoji:"👺",image:"assets/goblin.png",size:1},{name:"魔人",asset:"demon",emoji:"😈",image:"assets/demon.png",size:2},{name:"魔王",asset:"demonlord",emoji:"👑",image:"assets/demonlord.png",size:3}]
];
const PLAYER_NAMES=["勇者軍","魔王軍"];
const ACHIEVEMENTS=[
  {id:"firstGame",icon:"🗺️",name:"冒険の始まり",desc:"初めて対局する"},
  {id:"firstWin",icon:"⚔️",name:"勇者誕生",desc:"AI対戦で初勝利する"},
  {id:"cover10",icon:"💥",name:"マウント見習い",desc:"累計10回、駒を覆う"},
  {id:"hardWin",icon:"🛡️",name:"魔王討伐",desc:"上級AIに勝利する"},
  {id:"expertWin",icon:"👑",name:"伝説の勇者",desc:"最強AIに勝利する"},
  {id:"tenWins",icon:"🏆",name:"百戦錬磨への道",desc:"AI対戦で10勝する"}
];
let config={mode:"ai",size:4,difficulty:"medium",first:"hero"};
let rules=null,state=null,selection=null,gameOver=false,winningLine=[],aiThinking=false;
let aiJobId=0;
let history=[];
let lastMoveDst=null,lastMoveWasCover=false,lastRenderedTurn=null,returnAnimation=false;
let godHint=null,godThinking=false,godJobId=0;
let positionHistory=[],aiWorker=null,workerSequence=0;
const workerJobs=new Map(),activeTimers=new Set();
const AI_LIMITS={easy:80,medium:180,hard:450,expert:950};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function scheduleTimer(fn,delay){const id=setTimeout(()=>{activeTimers.delete(id);fn()},delay);activeTimers.add(id);return id}
function clearAllTimers(){for(const id of activeTimers)clearTimeout(id);activeTimers.clear()}
function worker(){if(aiWorker)return aiWorker;aiWorker=new Worker('./js/ai-worker.js?v=301');aiWorker.onmessage=e=>{const r=e.data,j=workerJobs.get(r.jobId);if(!j)return;workerJobs.delete(r.jobId);r.type==='ERROR'?j.reject(new Error(r.message)):j.resolve(r)};aiWorker.onerror=e=>{console.error(e);for(const j of workerJobs.values())j.reject(new Error('Worker error'));workerJobs.clear();aiWorker?.terminate();aiWorker=null};return aiWorker}
function workerState(x){return{rules:{n:x.rules.n,lines:x.rules.lines,counts:x.rules.counts},board:x.board,reserves:x.reserves,turn:x.turn}}
function workerSearch(purpose,current,difficulty,timeLimit){const jobId=++workerSequence;return new Promise((resolve,reject)=>{workerJobs.set(jobId,{resolve,reject});worker().postMessage({type:'SEARCH',jobId,purpose,state:workerState(current),difficulty,timeLimit})})}
function cancelWorker(){for(const j of workerJobs.values())j.reject(new Error('cancelled'));workerJobs.clear();aiWorker?.terminate();aiWorker=null;workerSequence++}
function repetitionKey(x){return `${x.turn}|${x.reserves[0].join('')}/${x.reserves[1].join('')}|`+x.board.map(stack=>stack.map(q=>`${q.player}${q.size}`).join('')).join(';')}
function threefold(h){for(let c=1;c<=Math.floor(h.length/3);c++){const st=h.length-c*3;let ok=true;for(let i=st+c;i<h.length;i++)if(h[i]!==h[st+(i-st)%c]){ok=false;break}if(ok)return true}return false}
function imageTag(name,alt,cls='piece-img'){return `<img class="${cls}" src="assets/webp/${name}.webp?v=20" data-fallback="assets/${name}.png?v=20" alt="${alt}" decoding="async" width="512" height="512" onerror="if(this.dataset.fallback&&this.src.indexOf('.png')<0)this.src=this.dataset.fallback">`}
const STORAGE_KEY="mountQuestData";
const DATA_VERSION=7;
const DEFAULT_SETTINGS={mode:"ai",size:4,difficulty:"medium",first:"hero",godHelp:"on"};
let saveTimer=null,cachedData=null;
function defaultData(){return {version:DATA_VERSION,games:0,wins:0,losses:0,draws:0,covers:0,byDifficulty:{easy:{w:0,l:0},medium:{w:0,l:0},hard:{w:0,l:0},expert:{w:0,l:0}},unlocked:{},settings:{...DEFAULT_SETTINGS},questProgress:{},xp:0,level:1,currentStreak:0,bestStreak:0,selectedTitle:"rookie",titles:{rookie:true},characterStats:{},daily:{date:"",tasks:[],claimed:false},dailyStamps:0,selectedTheme:"default",selectedSkin:"default",onboardingComplete:false,lastSeenVersion:""}}
function numberOr(value,fallback=0){return Number.isFinite(Number(value))?Math.max(0,Number(value)):fallback}
function validSettings(raw={}){const settings={...DEFAULT_SETTINGS,...raw};if(!["ai","local"].includes(settings.mode))settings.mode="ai";settings.size=Number(settings.size)===3?3:4;if(!["easy","medium","hard","expert"].includes(settings.difficulty))settings.difficulty="medium";if(!["hero","demon","random"].includes(settings.first))settings.first="hero";if(!["on","off"].includes(settings.godHelp))settings.godHelp="on";return settings}
function migrateData(raw){const base=defaultData();if(!raw||typeof raw!=="object")return base;const migrated={...base,...raw,version:DATA_VERSION};migrated.games=numberOr(raw.games);migrated.wins=numberOr(raw.wins);migrated.losses=numberOr(raw.losses);migrated.draws=numberOr(raw.draws);migrated.covers=numberOr(raw.covers);migrated.unlocked=raw.unlocked&&typeof raw.unlocked==="object"?{...raw.unlocked}:{};migrated.byDifficulty={};for(const level of ["easy","medium","hard","expert"]){const source=raw.byDifficulty?.[level]||{};migrated.byDifficulty[level]={w:numberOr(source.w),l:numberOr(source.l)}}migrated.settings=validSettings(raw.settings);migrated.questProgress=raw.questProgress&&typeof raw.questProgress==="object"?{...raw.questProgress}:{};migrated.xp=numberOr(raw.xp);migrated.level=Math.max(1,numberOr(raw.level,1));migrated.currentStreak=numberOr(raw.currentStreak);migrated.bestStreak=numberOr(raw.bestStreak);migrated.titles=raw.titles&&typeof raw.titles==="object"?{rookie:true,...raw.titles}:{rookie:true};migrated.selectedTitle=typeof raw.selectedTitle==="string"&&migrated.titles[raw.selectedTitle]?raw.selectedTitle:"rookie";migrated.characterStats=raw.characterStats&&typeof raw.characterStats==="object"?{...raw.characterStats}:{};migrated.daily=raw.daily&&typeof raw.daily==="object"?{date:"",tasks:[],claimed:false,...raw.daily}:{date:"",tasks:[],claimed:false};migrated.dailyStamps=numberOr(raw.dailyStamps);migrated.selectedTheme=typeof raw.selectedTheme==="string"?raw.selectedTheme:"default";migrated.selectedSkin=typeof raw.selectedSkin==="string"?raw.selectedSkin:"default";migrated.onboardingComplete=Boolean(raw.onboardingComplete);migrated.lastSeenVersion=typeof raw.lastSeenVersion==="string"?raw.lastSeenVersion:"";return migrated}
function loadData(){if(cachedData)return cachedData;try{cachedData=migrateData(JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"))}catch(error){console.warn("保存データを復旧しました",error);cachedData=defaultData()}writeDataNow(cachedData);return cachedData}
function writeDataNow(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch(error){console.error("保存に失敗しました",error)}}
function saveData(data,{immediate=false}={}){cachedData=migrateData(data);clearTimeout(saveTimer);if(immediate){writeDataNow(cachedData);return}saveTimer=setTimeout(()=>{writeDataNow(cachedData);saveTimer=null},120)}
function flushData(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null}if(cachedData)writeDataNow(cachedData)}
function setRadioValue(name,value){const input=document.querySelector(`input[name="${name}"][value="${value}"]`);if(input)input.checked=true}
function applySavedSettings(){const settings=loadData().settings;setRadioValue("mode",settings.mode);setRadioValue("size",String(settings.size));setRadioValue("difficulty",settings.difficulty);setRadioValue("first",settings.first);setRadioValue("godHelp",settings.godHelp);refreshModeFields()}
function refreshModeFields(){const ai=selected("mode")==="ai";$("#difficultyField").classList.toggle("hidden",!ai);$("#modeNote").textContent=ai?"AI対戦では、あなたは勇者軍、AIは魔王軍で固定されます。絶対神の助言は勇者軍の手番中に利用できます。":"2人対戦では、勇者軍と魔王軍を交互に操作します。"}
function saveCurrentSettings(){const d=loadData();d.settings=validSettings({mode:selected("mode"),size:Number(selected("size")),difficulty:selected("difficulty"),first:selected("first"),godHelp:selected("godHelp")});saveData(d)}
function unlock(id){const d=loadData();if(!d.unlocked)d.unlocked={};if(!d.unlocked[id]){d.unlocked[id]=true;saveData(d);const a=ACHIEVEMENTS.find(x=>x.id===id);if(a)toast(`実績解除：${a.name}`)}}
function showScreen(id){$$('.screen').forEach(x=>x.classList.toggle('active',x.id===id));if(id==='statsScreen')renderStats();if(id==='achievementsScreen')renderAchievements();scrollTo(0,0)}
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.nav)));
$$('input[name]').forEach(input=>input.addEventListener('change',()=>{if(input.name==='mode')refreshModeFields();saveCurrentSettings()}));
function selected(name){return $(`input[name="${name}"]:checked`).value}
class Rules{
  constructor(n){this.n=n;this.k=n;this.counts=n===3?[2,2,2]:[4,3,3];this.lines=[];for(let r=0;r<n;r++)this.lines.push(Array.from({length:n},(_,c)=>r*n+c));for(let c=0;c<n;c++)this.lines.push(Array.from({length:n},(_,r)=>r*n+c));this.lines.push(Array.from({length:n},(_,i)=>i*n+i));this.lines.push(Array.from({length:n},(_,i)=>i*n+(n-1-i)))}
}
class State{
  constructor(r,board=null,reserves=null,turn=0){this.rules=r;this.board=board||Array.from({length:r.n*r.n},()=>[]);this.reserves=reserves||[[...r.counts],[...r.counts]];this.turn=turn}
  top(i){const s=this.board[i];return s.length?s[s.length-1]:null}
  winners(){const out=[];for(const line of this.rules.lines){const p=this.top(line[0])?.player;if(p!==undefined&&line.every(i=>this.top(i)?.player===p)&&!out.some(x=>x.player===p))out.push({player:p,line})}return out}
  legal(m){if(!Number.isInteger(m.dst)||m.dst<0||m.dst>=this.board.length||m.size<1||m.size>3)return false;const target=this.top(m.dst);if(target&&m.size<=target.size)return false;if(m.src===null)return this.reserves[this.turn][m.size-1]>0;if(m.src===m.dst||m.src<0||m.src>=this.board.length)return false;const p=this.top(m.src);return !!p&&p.player===this.turn&&p.size===m.size}
  apply(m){const b=this.board.slice(),r=[this.reserves[0],this.reserves[1]];let covered=b[m.dst].length>0;b[m.dst]=b[m.dst].slice();if(m.src===null){r[this.turn]=this.reserves[this.turn].slice();r[this.turn][m.size-1]--;b[m.dst].push({player:this.turn,size:m.size})}else{b[m.src]=b[m.src].slice();const p=b[m.src].pop();b[m.dst].push(p)}return {state:new State(this.rules,b,r,1-this.turn),covered}}
  moves(){const a=[];for(let z=1;z<=3;z++)if(this.reserves[this.turn][z-1]>0)for(let d=0;d<this.board.length;d++){const m={src:null,dst:d,size:z};if(this.legal(m))a.push(m)}for(let s=0;s<this.board.length;s++){const p=this.top(s);if(p?.player===this.turn)for(let d=0;d<this.board.length;d++){const m={src:s,dst:d,size:p.size};if(this.legal(m))a.push(m)}}return a}
}
