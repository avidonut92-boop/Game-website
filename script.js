const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const defaultData = {
  name: "",
  xp: 250,
  level: 1,
  wins: 13,
  matches: 24,
  achievements: 6,
  leaderboardScore: 8250
};

const saved = JSON.parse(localStorage.getItem("sc2Player") || "null");
let player = {...defaultData, ...(saved || {})};
let soundOn = false;
let audioCtx = null;

const games = [
  {name:"VALORANT", type:"Tactical Shooter", accent:"#ff315b", image:"assets/sc2-hero.png", text:"Enter a tactical arena built around agents, abilities and precise team play.", stats:["5v5","TACTICAL","RANKED"]},
  {name:"CS2", type:"Tactical Shooter", accent:"#dba642", image:"assets/sc2-hero.png", text:"Competitive rounds, economy management and sharp aim.", stats:["5v5","FPS","COMPETITIVE"]},
  {name:"PUBG", type:"Battle Royale", accent:"#f2a900", image:"assets/sc2-hero.png", text:"Drop in, gear up and outlast the competition.", stats:["BATTLE","100 PLAYERS","SURVIVAL"]},
  {name:"APEX LEGENDS", type:"Battle Royale", accent:"#55a8ff", image:"assets/sc2-hero.png", text:"Squad up and combine movement, weapons and unique legends.", stats:["SQUAD","BATTLE","RANKED"]},
  {name:"GTA V", type:"Open World", accent:"#62d04f", image:"assets/sc2-hero.png", text:"Explore an open world packed with missions, crews and chaos.", stats:["OPEN WORLD","ONLINE","CREWS"]}
];

const tournaments = [
  ["CS2 OPEN CUP","25 SEP 2026","06:00 PM","5v5 • Double Elimination"],
  ["PUBG BATTLE ROYALE","02 OCT 2026","05:00 PM","Solo • Classic Mode"],
  ["APEX LEGENDS CUP","09 OCT 2026","07:00 PM","Squad • Battle Royale"]
];

const news = [
  ["GAME UPDATE","New Agent Teaser Released!","Get ready for the next chapter in competitive tactical gaming.","05 SEP 2026","https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1000&q=80"],
  ["SC2 COMMUNITY","SC2 Community Event","Join our weekly gaming nights and compete for exclusive rewards.","03 SEP 2026","https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1000&q=80"],
  ["TOURNAMENT","Tournament Registrations Open","The Valorant Showdown is now live. Sign up and compete.","01 SEP 2026","https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80"]
];

let leaderboard = JSON.parse(localStorage.getItem("sc2Leaderboard") || "null") || [
  {name:"ShadowX",xp:12450,level:27,wins:188},
  {name:"FireBlaze",xp:11230,level:24,wins:167},
  {name:"Krypto",xp:10890,level:23,wins:151},
  {name:"Zenox",xp:9760,level:21,wins:139},
  {name:"RazeOP",xp:8540,level:19,wins:121}
];

function save(){
  localStorage.setItem("sc2Player", JSON.stringify(player));
  localStorage.setItem("sc2Leaderboard", JSON.stringify(leaderboard));
}

function initials(name){ return (name || "P").slice(0,2).toUpperCase(); }

function showToast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),2500);
}

function initPlayer(){
  if(!player.name){
    $("#nameScreen").classList.remove("hidden");
  }else{
    $("#nameScreen").classList.add("hidden");
    renderPlayer();
  }
}

$("#nameForm").addEventListener("submit", e=>{
  e.preventDefault();
  const name=$("#gamerName").value.trim();
  if(!name) return;
  player.name=name;
  player.xp=250; player.level=1; player.leaderboardScore=8250;
  save(); renderPlayer();
  $("#nameScreen").classList.add("hidden");
  showToast(`WELCOME TO SC2, ${name.toUpperCase()}`);
  playTone(660,.08);
});

function renderPlayer(){
  const name=player.name || "PLAYER";
  $("#navName").textContent=name.toUpperCase();
  $("#profileName").textContent=name.toUpperCase();
  $("#avatar").textContent=initials(name);
  $("#bigAvatar").textContent=initials(name);
  $("#navLevel").textContent=player.level;
  $("#profileLevel").textContent=player.level;
  $("#xpValue").textContent=player.xp;
  $("#xpBar").style.width=Math.min(100,(player.xp%1000)/10)+"%";
  $("#winValue").textContent=Math.round(player.wins/Math.max(1,player.matches)*100)+"%";
  $("#matchValue").textContent=player.matches;
  $("#achievementValue").textContent=player.achievements;
  const ranks=["BRONZE III","BRONZE II","BRONZE I","SILVER III","SILVER II","SILVER I","GOLD III","GOLD II","GOLD I","PLATINUM"];
  $("#rankValue").textContent=ranks[Math.min(ranks.length-1,Math.floor(player.level/2))];
  renderBoards();
}

function renderGames(){
  $("#gameGrid").innerHTML=games.map((g,i)=>`
    <article class="game-card" data-game="${i}" style="--bgimg:url('${g.image}')">
      <div class="game-info"><h3>${g.name}</h3><p>${g.type}</p></div>
      <div class="game-arrow">→</div>
    </article>`).join("");
  $$(".game-card").forEach(c=>c.addEventListener("click",()=>openGame(+c.dataset.game)));
}

function renderTournaments(){
  $("#tourneyList").innerHTML=tournaments.map(t=>`
    <div class="tourney-row"><div><strong>${t[0]}</strong><small>${t[3]}</small></div><span>${t[1]}</span><small>${t[2]}</small></div>`).join("");
}

function renderNews(){
  $("#newsGrid").innerHTML=news.map(n=>`
    <article class="news-card"><div class="news-img" style="background-image:url('${n[4]}')"></div>
      <div class="news-copy"><span>${n[0]}</span><h3>${n[1]}</h3><p>${n[2]}</p><time>${n[3]}</time></div>
    </article>`).join("");
}

function renderBoards(){
  const sorted=[...leaderboard];
  if(player.name){
    const existing=sorted.findIndex(x=>x.name.toLowerCase()===player.name.toLowerCase());
    const me={name:player.name,xp:player.leaderboardScore,level:player.level,wins:player.wins};
    if(existing>=0) sorted[existing]=me; else sorted.push(me);
  }
  sorted.sort((a,b)=>b.xp-a.xp);
  const rows=sorted.slice(0,8).map((p,i)=>`
    <div class="board-row"><span class="rank">${i+1}</span>
      <div class="board-player"><i>${initials(p.name)}</i><div><b>${p.name}</b><small>${p.name===player.name?"YOU • ":""}SC2 PLAYER</small></div></div>
      <span>${p.level}</span><span>${p.wins}</span><span class="xp">${p.xp.toLocaleString()} XP</span>
    </div>`).join("");
  $("#fullBoard").innerHTML=rows;
  $("#previewBoard").innerHTML=sorted.slice(0,5).map((p,i)=>`
    <div class="board-row"><span class="rank">${i+1}</span><div class="board-player"><i>${initials(p.name)}</i><div><b>${p.name}</b><small>LEVEL ${p.level}</small></div></div><span class="xp">${p.xp.toLocaleString()} XP</span></div>`).join("");
}

function openGame(i){
  const g=games[i];
  $("#modalBanner").style.setProperty("--bgimg",`url('${g.image}')`);
  $("#modalTitle").textContent=g.name;
  $("#modalText").textContent=g.text;
  $("#modalStats").innerHTML=g.stats.map(x=>`<div><strong>${x}</strong><span>GAME MODE</span></div>`).join("");
  $("#modalPlay").onclick=()=>{
    player.matches++; player.wins++; player.xp+=75; player.leaderboardScore+=75;
    if(player.xp>=1000){player.level++;player.xp-=1000;showToast("LEVEL UP! +1 LEVEL");}
    save();renderPlayer();$("#gameModal").classList.remove("open");showToast(`${g.name} SESSION STARTED +75 XP`);playTone(880,.1);
  };
  $("#gameModal").classList.add("open");playTone(440,.07);
}

$$(".modal-close,.modal-close-btn").forEach(b=>b.addEventListener("click",()=>b.closest(".modal").classList.remove("open")));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));

$("#addScore").addEventListener("click",()=>$("#scoreModal").classList.add("open"));
$("#saveScore").addEventListener("click",()=>{
  const val=Math.max(100,Number($("#scoreInput").value||0));
  if(!val) return;
  player.leaderboardScore=val; player.xp=Math.min(999,Math.round(val/12));
  player.level=Math.max(1,Math.floor(val/450));
  save();renderPlayer();$("#scoreModal").classList.remove("open");$("#scoreInput").value="";
  showToast("LEADERBOARD SCORE UPDATED");playTone(700,.08);
});

$("#editProfile").addEventListener("click",()=>{
  const n=prompt("ENTER NEW GAMER NAME",player.name);
  if(n && n.trim()){player.name=n.trim().slice(0,18);save();renderPlayer();showToast("PROFILE UPDATED")}
});

$("#resetBtn").addEventListener("click",()=>{
  if(confirm("Reset your SC2 player data?")){localStorage.removeItem("sc2Player");player={...defaultData,name:""};location.reload();}
});

$("#joinBtn").addEventListener("click",()=>document.querySelector("#community").scrollIntoView({behavior:"smooth"}));
$("#exploreBtn").addEventListener("click",()=>document.querySelector("#games").scrollIntoView({behavior:"smooth"}));
$("#viewGames").addEventListener("click",()=>document.querySelector("#games").scrollIntoView({behavior:"smooth"}));
$("#refreshNews").addEventListener("click",()=>{renderNews();showToast("NEWS FEED REFRESHED");playTone(520,.06)});
$$("[data-scroll]").forEach(b=>b.addEventListener("click",()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"})));

const searchPanel=$("#searchPanel");
$("#searchBtn").addEventListener("click",()=>{searchPanel.classList.toggle("open");$("#searchInput").focus()});
$("#searchInput").addEventListener("input",e=>{
  const q=e.target.value.toLowerCase().trim();
  const results=[...games.map(g=>g.name),...tournaments.map(t=>t[0]),...news.map(n=>n[1])].filter(x=>x.toLowerCase().includes(q)).slice(0,7);
  $("#searchResults").innerHTML=q?results.map(x=>`<div class="search-result"><b>${x}</b><br>SC2 CONTENT</div>`).join(""):"";
});

$("#mobileMenu").addEventListener("click",()=>$("#nav").classList.toggle("open"));
$$("nav a").forEach(a=>a.addEventListener("click",()=>$("#nav").classList.remove("open")));

window.addEventListener("scroll",()=>{
  const y=scrollY+100;
  $$("main section[id]").forEach(s=>{
    const a=document.querySelector(`nav a[href="#${s.id}"]`);
    if(a && y>=s.offsetTop && y<s.offsetTop+s.offsetHeight){$$("nav a").forEach(x=>x.classList.remove("active"));a.classList.add("active")}
  });
});

document.addEventListener("mousemove",e=>{$("#cursorGlow").style.left=e.clientX+"px";$("#cursorGlow").style.top=e.clientY+"px"});
document.addEventListener("click",e=>{if(soundOn)playTone(e.target.closest("button,a")?680:300,.035)});

function playTone(freq=500,duration=.05){
  if(!soundOn)return;
  audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type="sine";o.frequency.value=freq;g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
  o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
}
function toggleSound(){
  soundOn=!soundOn;
  $("#soundBtn").textContent=soundOn?"◉":"♫";
  $("#musicToggle span").textContent=soundOn?"SOUND ON":"MUSIC OFF";
  if(soundOn)playTone(620,.12);
}
$("#soundBtn").addEventListener("click",toggleSound);
$("#musicToggle").addEventListener("click",toggleSound);

renderGames();renderTournaments();renderNews();initPlayer();


/* ===== SC2 PARTICLE SYSTEM ===== */
(function(){
  const layer=document.getElementById("particles");
  if(!layer) return;
  const count=window.innerWidth<700?24:48;
  for(let i=0;i<count;i++){
    const p=document.createElement("i");
    p.className="particle";
    p.style.left=(Math.random()*100)+"%";
    p.style.setProperty("--dur",(7+Math.random()*10)+"s");
    p.style.setProperty("--drift",((Math.random()-.5)*220)+"px");
    p.style.animationDelay=(-Math.random()*12)+"s";
    p.style.opacity=(.25+Math.random()*.6).toFixed(2);
    const s=(1+Math.random()*2.5).toFixed(1);
    p.style.width=s+"px";p.style.height=s+"px";
    layer.appendChild(p);
  }
})();

/* Subtle parallax for the hero artwork. */
(function(){
  const hero=document.querySelector(".hero");
  if(!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  hero.addEventListener("mousemove",e=>{
    const x=(e.clientX/window.innerWidth-.5)*2;
    const y=(e.clientY/window.innerHeight-.5)*2;
    hero.style.backgroundPosition=`calc(50% + ${x*12}px) calc(50% + ${y*7}px)`;
  });
  hero.addEventListener("mouseleave",()=>hero.style.backgroundPosition="center");
})();
