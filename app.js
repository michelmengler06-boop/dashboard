(()=>{
  'use strict';
  const KEY='life-os-plus-v3';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>new Date().toISOString().slice(0,10);
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const fmtCHF=n=>'CHF '+Number(n||0).toLocaleString('it-CH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const insights=[
    'Fai prima una cosa piccola ma concreta: crea slancio e il resto diventa più facile.',
    'Allenamento, studio e cibo funzionano meglio quando li tracci senza ossessione: guarda la tendenza, non il singolo giorno.',
    'La dashboard non serve a essere perfetti: serve a capire dove stai andando.',
    'Un pasto scritto, un set salvato e una quest completata valgono più di una pianificazione infinita.',
    'Se oggi hai poca energia, abbassa la difficoltà ma non rompere la catena.'
  ];
  const defaults={
    profile:{name:'Michel',city:'Lugano',lat:46.0037,lon:8.9511},
    xp:0, level:1, insightIndex:0, questClaims:{},
    subjects:['Matematica','Italiano','Economia','Storia','Biologia','Inglese'],
    tasks:[], grades:{}, notes:[], goals:[], events:[], expenses:[], savings:{goal:0,now:0},
    habits:[{id:'water',name:'Bere acqua'},{id:'study',name:'Studiare 45 min'},{id:'train',name:'Allenamento'},{id:'sleep',name:'Dormire bene'}],
    habitLog:{}, wellness:{}, meals:[],
    pomodoro:{min:25,total:1500,left:1500,running:false,today:0,date:today()},
    workout:{day:'Push',current:null,sessions:[],templates:{
      Push:['Panca piana','Shoulder press','Croci','Pushdown tricipiti'],
      Pull:['Lat machine','Rematore','Pulley','Curl bilanciere'],
      Legs:['Squat','Leg press','Leg curl','Calf raises'],
      Custom:[]
    }}
  };
  const merge=(a,b)=>{ if(Array.isArray(a)) return Array.isArray(b)?b:a; const o={...a}; if(b&&typeof b==='object') for(const k of Object.keys(b)) o[k]=(a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))?merge(a[k],b[k]):b[k]; return o; };
  let state=merge(defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));
  let timer=null;
  function ensureDay(){
    const d=today();
    state.wellness[d]??={water:0,sleep:'',steps:'',mood:3};
    state.habits.forEach(h=>state.habitLog[h.id]??={});
    state.questClaims[d]??={};
    if(state.pomodoro.date!==d){state.pomodoro.today=0;state.pomodoro.date=d;state.pomodoro.running=false;state.pomodoro.left=state.pomodoro.total||1500;}
  }
  function save(){ensureDay(); localStorage.setItem(KEY,JSON.stringify(state));}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('on'),1800)}
  function gain(x,label='XP'){state.xp+=x; while(state.xp>=100){state.xp-=100;state.level++; toast('Level up!');} save(); render(); if(label!=='XP') toast('+'+x+' XP · '+label);}
  function dailyQuests(){
    const d=today(), w=state.wellness[d]||{};
    const meals=state.meals.filter(m=>m.date===d).length;
    const trained=state.workout.sessions.some(s=>s.date===d);
    const doneHab=state.habits.filter(h=>state.habitLog[h.id]?.[d]).length;
    return [
      {id:'q-study',text:'Completa 1 blocco di studio',xp:20,complete:state.pomodoro.today>0},
      {id:'q-meal',text:'Scrivi almeno 2 pasti',xp:15,complete:meals>=2},
      {id:'q-water',text:'Bevi 6 bicchieri d’acqua',xp:15,complete:(w.water||0)>=6},
      {id:'q-gym',text:'Salva un allenamento',xp:30,complete:trained},
      {id:'q-habit',text:'Chiudi metà abitudini',xp:20,complete:doneHab>=Math.ceil(state.habits.length/2)}
    ].map(q=>({...q,claimed:!!state.questClaims[today()]?.[q.id],done:q.complete&&!!state.questClaims[today()]?.[q.id]}));
  }
  function energyScore(){const w=state.wellness[today()]||{};return Math.round(Math.min(35,(w.water||0)/8*35)+Math.min(35,(+w.sleep||0)/8*35)+Math.min(20,(+w.steps||0)/8000*20)+(+w.mood||0)*2)}
  function focusScore(){const open=state.tasks.filter(t=>t.col!=='done').length;return Math.max(5,Math.min(100,state.pomodoro.today*25 + dailyQuests().filter(q=>q.claimed).length*10 - open*2));}
  function setSelects(){
    const opts=state.subjects.map(s=>`<option>${esc(s)}</option>`).join(''); ['#taskSubject','#gradeSubject'].forEach(id=>$(id).innerHTML=opts);
    $('#gradeValue').innerHTML=[6,5.5,5,4.5,4,3.5,3,2.5,2,1.5,1].map(v=>`<option value="${v}">${v}</option>`).join('');
  }
  function renderHome(){
    const d=new Date(); $('#dateLine').textContent=d.toLocaleDateString('it-CH',{weekday:'long',day:'numeric',month:'long'}); $('#dayLabel').textContent=d.toLocaleDateString('it-CH',{weekday:'long'});
    $('#hello').textContent=`Ciao, ${state.profile.name}`; $('#rankChip').textContent=`Lvl ${state.level} · Rank ${['E','D','C','B','A','S'][Math.min(5,Math.floor(state.level/4))]}`;
    $('#xpFill').style.width=state.xp+'%'; $('#xpVal').textContent=`${state.xp}/100`;
    const energy=energyScore(), focus=focusScore(); $('#energyFill').style.width=energy+'%'; $('#energyVal').textContent=energy+'%'; $('#focusFill').style.width=focus+'%'; $('#focusVal').textContent=focus+'%';
    const dkey=today(); const meals=state.meals.filter(m=>m.date===dkey); const kcal=meals.reduce((a,m)=>a+(+m.calories||0),0); const sessions=state.workout.sessions.filter(s=>s.date===dkey).length;
    $('#quickStats').innerHTML=[['Quest',`${dailyQuests().filter(q=>q.claimed).length}/${dailyQuests().length}`],['Pasti',meals.length],['Kcal',kcal],['Gym',sessions]].map(([a,b])=>`<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
    const qs=dailyQuests(); $('#questCounter').textContent=`${qs.filter(q=>q.claimed).length}/${qs.length}`; $('#quests').innerHTML=qs.map(q=>`<div class="quest ${q.claimed?'done':''}"><div><b>${esc(q.text)}</b><div class="tiny">${q.complete?(q.claimed?'completata':`+${q.xp} XP da riscattare`):'non ancora completata'}</div></div><button class="check ${q.claimed?'on':''}" data-quest="${q.id}" ${(!q.complete||q.claimed)?'disabled':''}>${q.claimed?'✓':'+'}</button></div>`).join('');
    $('#notesPill').textContent=state.notes.length; $('#notes').innerHTML=state.notes.slice(-5).reverse().map(n=>`<div class="item"><b>${esc(n.date)}</b><p class="tiny">${esc(n.text)}</p></div>`).join('')||'<div class="empty">Nessuna nota</div>';
    $('#insightText').textContent=insights[state.insightIndex%insights.length];
  }
  function renderTasks(){
    const cols=[['todo','Da fare'],['doing','In corso'],['done','Fatto']]; $('#taskPill').textContent=state.tasks.length+' compiti';
    $('#kanban').innerHTML=cols.map(([c,name])=>`<div class="lane"><h4>${name}</h4>${state.tasks.filter(t=>t.col===c).map(t=>`<div class="task"><b>${esc(t.title)}</b><div class="tiny"><span class="prio-${t.prio}">${t.prio}</span> · ${esc(t.subj)} ${t.due?'· '+esc(t.due):''}</div><div class="task-actions">${c!=='todo'?`<button class="btn small" data-move="${t.id}|todo">todo</button>`:''}${c!=='doing'?`<button class="btn small" data-move="${t.id}|doing">doing</button>`:''}${c!=='done'?`<button class="btn small" data-move="${t.id}|done">done</button>`:''}<button class="btn small danger" data-del-task="${t.id}">×</button></div></div>`).join('')||'<div class="empty">Vuoto</div>'}</div>`).join('');
  }
  function renderPomo(){const p=state.pomodoro; $('#pomoPill').textContent=p.today+' oggi'; $('#pomoTime').textContent=`${pad(Math.floor(p.left/60))}:${pad(p.left%60)}`; $('#pomoStart').textContent=p.running?'Pausa':'Start'; $('#pomoFg').style.strokeDashoffset=383.27-(p.left/p.total)*383.27; $$('#pomoPreset button').forEach(b=>b.classList.toggle('on',+b.dataset.min===p.min));}
  function renderGrades(){
    let all=[]; for(const [s,arr] of Object.entries(state.grades)) arr.forEach(v=>all.push(v)); const mean=all.length?all.reduce((a,b)=>a+b,0)/all.length:0; $('#meanPill').textContent=all.length?'media '+mean.toFixed(2):'media —';
    $('#grades').innerHTML=state.subjects.map(s=>{const arr=state.grades[s]||[]; const m=arr.length?(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2):'—'; return `<div class="grade-row"><div><b>${esc(s)}</b><div class="tiny">${arr.join(', ')||'nessun voto'}</div></div><span class="pill">${m}</span></div>`}).join('');
  }
  function streak(id){let c=0, d=new Date(); for(let i=0;i<365;i++){const k=d.toISOString().slice(0,10); if(state.habitLog[id]?.[k]) c++; else if(i>0) break; d.setDate(d.getDate()-1);} return c;}
  function renderHabits(){const d=today(); const done=state.habits.filter(h=>state.habitLog[h.id]?.[d]).length; $('#habitPill').textContent=state.habits.length?Math.round(done/state.habits.length*100)+'%':'0%';
    $('#habitsList').innerHTML=state.habits.map(h=>`<div class="habit"><button class="check ${state.habitLog[h.id]?.[d]?'on':''}" data-habit="${h.id}">✓</button><div class="habit-name"><b>${esc(h.name)}</b><span class="streak">🔥 ${streak(h.id)} giorni</span></div><button class="btn small danger" data-del-habit="${h.id}">×</button></div>`).join('');
    let cells=[]; for(let i=34;i>=0;i--){const dt=new Date(); dt.setDate(dt.getDate()-i); const k=dt.toISOString().slice(0,10); const n=state.habits.filter(h=>state.habitLog[h.id]?.[k]).length; const lv=n===0?'':n<state.habits.length/2?'l1':n<state.habits.length?'l2':'l3'; cells.push(`<div class="cell ${lv}" title="${k}: ${n}"></div>`)} $('#heatmap').innerHTML=cells.join('');
  }
  function renderHealth(){const w=state.wellness[today()]||{}; $('#healthScore').textContent='score '+energyScore()+'/100'; $('#water').innerHTML=Array.from({length:8},(_,i)=>`<button class="glass ${i<(w.water||0)?'on':''}" data-water="${i+1}">💧</button>`).join(''); $('#sleep').value=w.sleep||''; $('#steps').value=w.steps||''; $$('#mood button').forEach(b=>b.classList.toggle('on',+b.dataset.mood===+w.mood));}
  function renderMeals(){const d=today(); const meals=state.meals.filter(m=>m.date===d); const kcal=meals.reduce((a,m)=>a+(+m.calories||0),0); const prot=meals.reduce((a,m)=>a+(+m.protein||0),0); $('#mealPill').textContent=kcal+' kcal'; $('#calToday').textContent=kcal; $('#proteinToday').textContent=prot+'g'; $('#mealsToday').textContent=meals.length; $('#mealsList').innerHTML=meals.slice().reverse().map(m=>`<div class="item"><div class="item-row"><div><b>${esc(m.name)}</b><div class="tiny">${esc(m.type)} · ${m.calories||0} kcal · ${m.protein||0}g proteine</div></div><button class="btn small danger" data-del-meal="${m.id}">×</button></div>${m.notes?`<p class="tiny">${esc(m.notes)}</p>`:''}</div>`).join('')||'<div class="empty">Scrivi il primo pasto di oggi</div>';}
  function startWorkoutIfNeeded(){const w=state.workout; if(!w.current||w.current.day!==w.day){w.current={id:uid(),day:w.day,name:w.day+' workout',exercises:(w.templates[w.day]||[]).map(name=>({id:uid(),name,sets:[{r:8,kg:0,done:false},{r:8,kg:0,done:false},{r:8,kg:0,done:false}]}))};}}
  function renderWorkout(){const w=state.workout; startWorkoutIfNeeded(); $('#workoutName').value=w.current.name||''; $('#workoutNamePill').textContent=w.current.name||w.day; $$('#workoutTabs button').forEach(b=>b.classList.toggle('on',b.dataset.day===w.day));
    $('#exercises').innerHTML=w.current.exercises.map((ex,ei)=>`<div class="exercise"><div class="item-row"><b>${esc(ex.name)}</b><button class="btn small danger" data-del-ex="${ei}">×</button></div>${ex.sets.map((s,si)=>`<div class="setrow"><span class="tiny">${si+1}</span><input data-reps="${ei}|${si}" type="number" value="${s.r||''}" placeholder="reps"><input data-kg="${ei}|${si}" type="number" value="${s.kg||''}" placeholder="kg"><button class="check ${s.done?'on':''}" data-set="${ei}|${si}">✓</button></div>`).join('')}<button class="btn small" data-add-set="${ei}">+ set</button></div>`).join('')||'<div class="empty">Aggiungi esercizi per iniziare</div>';
    $('#sessionPill').textContent=w.sessions.length; $('#workoutHistory').innerHTML=w.sessions.slice(-8).reverse().map(s=>{const sets=s.exercises.flatMap(e=>e.sets).filter(x=>x.done).length; return `<div class="item workout-summary"><div><b>${esc(s.name||s.day)}</b><div class="tiny">${s.date} · ${s.exercises.length} esercizi · ${sets} set completati</div></div><button class="btn small danger" data-del-session="${s.id}">×</button></div>`}).join('')||'<div class="empty">Nessun allenamento salvato</div>';
  }
  function renderMoney(){const month=today().slice(0,7); const ex=state.expenses.filter(e=>e.date.slice(0,7)===month); const tot=ex.reduce((a,e)=>a+(+e.amount||0),0); $('#budgetPill').textContent=fmtCHF(tot); $('#expenses').innerHTML=ex.slice().reverse().map(e=>`<div class="item item-row"><div><b>${esc(e.name)}</b><div class="tiny">${e.date}</div></div><div><b>${fmtCHF(e.amount)}</b> <button class="btn small danger" data-del-exp="${e.id}">×</button></div></div>`).join('')||'<div class="empty">Nessuna spesa questo mese</div>'; const days=Array.from({length:7},(_,i)=>{const d=new Date(); d.setDate(d.getDate()-6+i); const k=d.toISOString().slice(0,10); return ex.filter(e=>e.date===k).reduce((a,e)=>a+(+e.amount||0),0)}); const max=Math.max(1,...days); $('#budgetChart').innerHTML=days.map(v=>`<div class="bar-col" style="height:${Math.max(7,v/max*64)}px" title="${fmtCHF(v)}"></div>`).join(''); $('#savingGoal').value=state.savings.goal||''; $('#savingNow').value=state.savings.now||''; const pc=state.savings.goal?Math.min(100,state.savings.now/state.savings.goal*100):0; $('#savingFill').style.width=pc+'%'; $('#savingPill').textContent=Math.round(pc)+'%';}
  function renderCalendar(){const now=new Date(Date.now()-86400000); const ev=state.events.filter(e=>new Date(e.when)>=now).sort((a,b)=>new Date(a.when)-new Date(b.when)); $('#eventPill').textContent=ev.length; $('#events').innerHTML=ev.map(e=>{const d=new Date(e.when); return `<div class="item event"><div class="datebox">${pad(d.getDate())}</div><div><b>${esc(e.title)}</b><div class="tiny">${d.toLocaleString('it-CH',{month:'short',hour:'2-digit',minute:'2-digit'})}</div></div><button class="btn small danger" data-del-event="${e.id}">×</button></div>`}).join('')||'<div class="empty">Nessun evento</div>'; $('#goalPill').textContent=state.goals.filter(g=>!g.done).length; $('#goals').innerHTML=state.goals.map(g=>`<div class="item item-row"><div><b style="${g.done?'text-decoration:line-through;opacity:.65':''}">${esc(g.text)}</b><div class="tiny">${g.date}</div></div><button class="check ${g.done?'on':''}" data-goal="${g.id}">✓</button></div>`).join('')||'<div class="empty">Nessun obiettivo</div>';}
  function render(){ensureDay(); setSelects(); renderHome(); renderTasks(); renderPomo(); renderGrades(); renderHabits(); renderHealth(); renderMeals(); renderWorkout(); renderMoney(); renderCalendar();}
  document.addEventListener('click',e=>{
    const q=e.target.closest('[data-quest]'); if(q&&!q.disabled){const quest=dailyQuests().find(x=>x.id===q.dataset.quest); if(quest&&quest.complete&&!quest.claimed){state.questClaims[today()][quest.id]=true; gain(quest.xp,'quest');}}
    const h=e.target.closest('[data-habit]'); if(h){const d=today(),id=h.dataset.habit; state.habitLog[id]??={}; const was=!!state.habitLog[id][d]; state.habitLog[id][d]=!was; save(); was?render():gain(10,'habit');}
    const dw=e.target.closest('[data-water]'); if(dw){state.wellness[today()].water=+dw.dataset.water; save(); renderHealth(); renderHome();}
    const mo=e.target.closest('[data-mood]'); if(mo){state.wellness[today()].mood=+mo.dataset.mood; save(); renderHealth(); renderHome();}
    const mv=e.target.closest('[data-move]'); if(mv){const [id,col]=mv.dataset.move.split('|'); const t=state.tasks.find(x=>x.id===id); if(t){t.col=col; save(); col==='done'?gain(20,'studio'):render();}}
    const delMap=[['delTask','tasks'],['delHabit','habits'],['delExp','expenses'],['delEvent','events'],['delMeal','meals']]; delMap.forEach(([data,key])=>{const el=e.target.closest(`[data-${data.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}]`); if(el){const attr='data-'+data.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()); state[key]=state[key].filter(x=>x.id!==el.getAttribute(attr)); save(); render();}});
    const set=e.target.closest('[data-set]'); if(set){const [ei,si]=set.dataset.set.split('|').map(Number); const s=state.workout.current.exercises[ei].sets[si]; s.done=!s.done; save(); renderWorkout();}
    const addSet=e.target.closest('[data-add-set]'); if(addSet){state.workout.current.exercises[+addSet.dataset.addSet].sets.push({r:8,kg:0,done:false}); save(); renderWorkout();}
    const delEx=e.target.closest('[data-del-ex]'); if(delEx){state.workout.current.exercises.splice(+delEx.dataset.delEx,1); save(); renderWorkout();}
    const delSession=e.target.closest('[data-del-session]'); if(delSession){state.workout.sessions=state.workout.sessions.filter(s=>s.id!==delSession.dataset.delSession); save(); renderWorkout(); renderHome();}
    const goal=e.target.closest('[data-goal]'); if(goal){const g=state.goals.find(x=>x.id===goal.dataset.goal); if(g){g.done=!g.done; save(); if(g.done)gain(25,'obiettivo'); else renderCalendar();}}
  });
  document.addEventListener('input',e=>{ if(e.target.matches('[data-reps]')){const [ei,si]=e.target.dataset.reps.split('|').map(Number); state.workout.current.exercises[ei].sets[si].r=+e.target.value; save();} if(e.target.matches('[data-kg]')){const [ei,si]=e.target.dataset.kg.split('|').map(Number); state.workout.current.exercises[ei].sets[si].kg=+e.target.value; save();} });
  $('#newInsight').onclick=()=>{state.insightIndex=(state.insightIndex+1)%insights.length; save(); renderHome();};
  $('#addNote').onclick=()=>{const v=$('#noteText').value.trim(); if(!v)return; state.notes.push({id:uid(),text:v,date:new Date().toLocaleString('it-CH')}); $('#noteText').value=''; save(); gain(5,'nota');};
  $('#dailyReview').onclick=()=>{const w=state.wellness[today()]||{}, qs=dailyQuests(); state.notes.push({id:uid(),date:new Date().toLocaleString('it-CH'),text:`Review: ${qs.filter(q=>q.claimed).length}/${qs.length} quest, ${state.pomodoro.today} pomodoro, acqua ${w.water||0}/8, sonno ${w.sleep||'?'}h, pasti ${state.meals.filter(m=>m.date===today()).length}.`}); save(); renderHome(); toast('Review creata');};
  $('#addTask').onclick=()=>{const v=$('#taskTitle').value.trim(); if(!v)return; state.tasks.push({id:uid(),title:v,subj:$('#taskSubject').value,prio:$('#taskPrio').value,due:$('#taskDue').value,col:'todo'}); $('#taskTitle').value=''; save(); renderTasks(); renderHome();};
  $('#addGrade').onclick=()=>{const s=$('#gradeSubject').value; state.grades[s]??=[]; state.grades[s].push(+( $('#gradeValue').value)); save(); gain(8,'voto');};
  $('#addHabit').onclick=()=>{const v=$('#habitName').value.trim(); if(!v)return; state.habits.push({id:uid(),name:v}); $('#habitName').value=''; save(); renderHabits();};
  $('#sleep').onchange=()=>{state.wellness[today()].sleep=$('#sleep').value; save(); renderHealth(); renderHome();}; $('#steps').onchange=()=>{state.wellness[today()].steps=$('#steps').value; save(); renderHealth(); renderHome();};
  $('#addMeal').onclick=()=>{const name=$('#mealName').value.trim(); if(!name)return; state.meals.push({id:uid(),date:today(),time:new Date().toLocaleTimeString('it-CH',{hour:'2-digit',minute:'2-digit'}),name,type:$('#mealType').value,calories:+$('#mealCalories').value||0,protein:+$('#mealProtein').value||0,notes:$('#mealNotes').value.trim()}); ['#mealName','#mealCalories','#mealProtein','#mealNotes'].forEach(id=>$(id).value=''); save(); gain(12,'pasto');};
  $('#workoutName').onchange=()=>{startWorkoutIfNeeded(); state.workout.current.name=$('#workoutName').value.trim()||state.workout.day+' workout'; save(); renderWorkout();};
  $('#addExercise').onclick=()=>{const v=$('#exerciseName').value.trim(); if(!v)return; startWorkoutIfNeeded(); state.workout.current.exercises.push({id:uid(),name:v,sets:[{r:8,kg:0,done:false},{r:8,kg:0,done:false},{r:8,kg:0,done:false}]}); $('#exerciseName').value=''; save(); renderWorkout();};
  $('#saveTemplate').onclick=()=>{startWorkoutIfNeeded(); state.workout.templates[state.workout.day]=state.workout.current.exercises.map(e=>e.name); save(); toast('Template salvato');};
  $('#finishWorkout').onclick=()=>{startWorkoutIfNeeded(); const done=state.workout.current.exercises.flatMap(e=>e.sets).filter(s=>s.done).length; if(!state.workout.current.exercises.length)return toast('Aggiungi almeno un esercizio'); state.workout.sessions.push({date:today(),savedAt:new Date().toISOString(),...JSON.parse(JSON.stringify(state.workout.current))}); state.habitLog.train??={}; state.habitLog.train[today()]=true; state.workout.current=null; save(); gain(Math.max(30,done*4),'workout');};
  $$('#workoutTabs button').forEach(b=>b.onclick=()=>{state.workout.day=b.dataset.day; state.workout.current=null; save(); renderWorkout();});
  $('#addExpense').onclick=()=>{const n=$('#expenseName').value.trim(),a=+$('#expenseAmount').value; if(!n||!a)return; state.expenses.push({id:uid(),name:n,amount:a,date:today()}); $('#expenseName').value=''; $('#expenseAmount').value=''; save(); renderMoney(); renderHome();};
  $('#savingGoal').onchange=()=>{state.savings.goal=+$('#savingGoal').value||0; save(); renderMoney();}; $('#savingNow').onchange=()=>{state.savings.now=+$('#savingNow').value||0; save(); renderMoney();};
  $('#addEvent').onclick=()=>{const t=$('#eventTitle').value.trim(),w=$('#eventWhen').value; if(!t||!w)return; state.events.push({id:uid(),title:t,when:w}); $('#eventTitle').value=''; $('#eventWhen').value=''; save(); renderCalendar();};
  $('#addGoal').onclick=()=>{const v=$('#goalText').value.trim(); if(!v)return; state.goals.push({id:uid(),text:v,date:today(),done:false}); $('#goalText').value=''; save(); renderCalendar();};
  $$('#pomoPreset button').forEach(b=>b.onclick=()=>{state.pomodoro.min=+b.dataset.min; state.pomodoro.total=state.pomodoro.left=state.pomodoro.min*60; state.pomodoro.running=false; save(); renderPomo();});
  $('#pomoStart').onclick=()=>{state.pomodoro.running=!state.pomodoro.running; save(); startTimer(); renderPomo();}; $('#pomoReset').onclick=()=>{state.pomodoro.running=false; state.pomodoro.left=state.pomodoro.total; save(); renderPomo();};
  function startTimer(){clearInterval(timer); if(!state.pomodoro.running)return; timer=setInterval(()=>{state.pomodoro.left--; if(state.pomodoro.left<=0){state.pomodoro.running=false; state.pomodoro.today++; state.pomodoro.left=state.pomodoro.total; gain(30,'focus');} save(); renderPomo(); renderHome(); if(!state.pomodoro.running)clearInterval(timer);},1000);}
  $('#nav').onclick=e=>{const b=e.target.closest('.tab'); if(!b)return; $$('.tab').forEach(x=>x.classList.remove('on')); b.classList.add('on'); $$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===b.dataset.page)); scrollTo({top:0,behavior:'smooth'});};
  $('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`life-os-backup-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);};
  $('#importBtn').onclick=()=>$('#importFile').click(); $('#importFile').onchange=async e=>{const f=e.target.files[0]; if(!f)return; try{state=merge(defaults,JSON.parse(await f.text())); save(); render(); toast('Backup importato');}catch{toast('File non valido');}};
  $('#resetBtn').onclick=()=>{if(confirm('Cancellare tutti i dati locali?')){localStorage.removeItem(KEY); location.reload();}};
  async function weather(){try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${state.profile.lat}&longitude=${state.profile.lon}&current=temperature_2m&timezone=Europe%2FZurich`); const j=await r.json(); $('#weatherChip').textContent=`${state.profile.city} · ${Math.round(j.current.temperature_2m)}°`;}catch{$('#weatherChip').textContent=`${state.profile.city} · offline`;}}
  render(); startTimer(); weather(); if('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
