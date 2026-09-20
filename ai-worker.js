"use strict";
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
function restore(data){const rules=new Rules(data.rules.n);rules.lines=data.rules.lines;rules.counts=data.rules.counts;return new State(rules,data.board.map(stack=>stack.map(p=>({...p}))),data.reserves.map(x=>[...x]),data.turn)}
self.addEventListener('message',event=>{const m=event.data;if(m?.type!=='SEARCH')return;try{const state=restore(m.state);const move=AI.choose(state,m.difficulty,m.timeLimit);self.postMessage({type:'RESULT',jobId:m.jobId,purpose:m.purpose,move})}catch(error){self.postMessage({type:'ERROR',jobId:m.jobId,purpose:m.purpose,message:error instanceof Error?error.message:String(error)})}});
