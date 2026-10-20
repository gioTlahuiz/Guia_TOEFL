(()=>{'use strict';
const bank=window.ENALLT_EXAMS,store='enallt_results_v1';let run=null,timer=null;
const el=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function history(){let entries=[];try{entries=JSON.parse(localStorage.getItem(store)||'[]')}catch(e){}el('enalltHistory').innerHTML=entries.length?'<div class="panel"><h5>Historial de simulacros</h5>'+entries.slice(-8).reverse().map(x=>`<div class="py-2 border-bottom">${escape(x.date)} · Inglés ${x.level} · ${x.correct}/${x.total} (${x.percent}%)</div>`).join('')+'</div>':''}
function home(){el('enalltSelector').innerHTML=Object.entries(bank).map(([id,e])=>`<div class="col-md-6 col-xl-3"><div class="skill-card h-100"><span class="badge text-bg-success mb-3">Inglés ${id}</span><h4>Simulacro ${id}</h4><p>2 lecturas · 2 textos con espacios · 16 reactivos · ${e.minutes} minutos</p><button class="btn btn-primary" onclick="ENALLT.start('${id}')">Iniciar examen</button></div></div>`).join('');history()}
function start(id){if(run&&!confirm('¿Abandonar el examen actual?'))return;clearInterval(timer);let e=bank[id];run={id,exam:e,answers:{},end:Date.now()+e.minutes*60000};el('enalltSelector').hidden=true;el('enalltWorkspace').hidden=false;draw();timer=setInterval(()=>{if(!run)return;let ms=run.end-Date.now();let t=el('enalltClock');if(t)t.textContent=format(ms);if(ms<=0)finish()},1000);el('enallt').scrollIntoView({behavior:'smooth'})}
function format(ms){let s=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function clozeText(sec,si){
 const source=sec.cloze||'';
 // The original exercises use numbered blanks: (1) ____, (2) ____, etc.
 const chunks=source.split(/\((\d+)\)\s*_{2,}/g);
 return chunks.map((chunk,i)=>{
   if(i%2===0)return escape(chunk);
   const qi=Number(chunk)-1,key=si+'-'+qi,q=sec.questions[qi];
   if(!q)return escape('('+chunk+') ____');
   const chosen=run.answers[key];
   return `<span class="enallt-blank ${chosen===undefined?'':'is-filled'}" id="enallt-blank-${key}" title="Espacio ${chunk}"><span class="enallt-blank-number">${chunk}</span><span class="enallt-blank-value">${chosen===undefined?'________':escape(q.options[chosen])}</span></span>`;
 }).join('');
}
function draw(){let count=0;
 let blocks=run.exam.sections.map((sec,si)=>{
   const cloze=!!sec.cloze;
   const qs=sec.questions.map((q,qi)=>{
     const key=si+'-'+qi;count++;
     return `<fieldset class="enallt-question" id="enallt-q-${key}"><legend class="enallt-question-title"><span class="enallt-question-number">${count}.</span> ${cloze?'Completa el espacio '+(qi+1):escape(q.stem)}</legend><div class="enallt-options">${q.options.map((op,oi)=>`<label class="enallt-answer"><input type="radio" name="e-${key}" value="${oi}" ${run.answers[key]===oi?'checked':''} onchange="ENALLT.answer('${key}',${oi})"><span class="enallt-option-letter">${String.fromCharCode(65+oi)}.</span><span>${escape(op)}</span></label>`).join('')}</div></fieldset>`;
   }).join('');
   return `<article class="enallt-unit"><div class="enallt-unit-heading"><span class="enallt-type">${cloze?'Completar texto':'Comprensión de lectura'}</span><h4>${escape(sec.title)}</h4><p>${cloze?'Selecciona una respuesta a la derecha para completar cada espacio del texto.':'Lee el texto y responde las preguntas del panel derecho.'}</p></div><div class="enallt-split"><div class="enallt-reading-pane"><div class="enallt-pane-label">TEXTO · ${cloze?'ESPACIOS INTERACTIVOS':'LECTURA'}</div><div class="enallt-reading-content">${cloze?clozeText(sec,si):escape(sec.passage||'')}</div></div><div class="enallt-questions-pane"><div class="enallt-pane-label">PREGUNTAS · ${sec.questions.length} REACTIVOS</div>${qs}</div></div></article>`;
 }).join('');
 el('enalltWorkspace').innerHTML=`<div class="enallt-toolbar"><div><strong>${escape(run.exam.name)}</strong><div class="small" id="enalltCount"></div></div><div class="enallt-toolbar-actions"><div class="enallt-clock"><i class="bi bi-clock"></i> <span id="enalltClock">${format(run.end-Date.now())}</span></div><button class="btn btn-primary" onclick="ENALLT.finish()">Finalizar y evaluar</button></div></div><div class="enallt-units">${blocks}</div>`;
 updateCount();
}
function updateCount(){let answered=Object.keys(run.answers).length,total=run.exam.sections.reduce((n,s)=>n+s.questions.length,0);el('enalltCount').textContent=`${answered}/${total} respuestas`}
function answer(key,val){
 if(!run)return;
 run.answers[key]=val;
 const [si,qi]=key.split('-').map(Number),sec=run.exam.sections[si];
 if(sec&&sec.cloze){
   const blank=el('enallt-blank-'+key);
   if(blank){blank.classList.add('is-filled');blank.querySelector('.enallt-blank-value').textContent=sec.questions[qi].options[val]}
 }
 updateCount();
}
function finish(){if(!run)return;clearInterval(timer);let rows=[],correct=0;run.exam.sections.forEach((sec,si)=>sec.questions.forEach((q,qi)=>{let key=si+'-'+qi,selected=run.answers[key],ok=selected===q.answer;if(ok)correct++;rows.push({question:q.stem,skill:q.skill,correct:ok,chosen:selected===undefined?'Sin responder':q.options[selected],expected:q.options[q.answer],explanation:q.explanation})}));let percent=Math.round(correct/rows.length*100),level=run.id;let past=[];try{past=JSON.parse(localStorage.getItem(store)||'[]')}catch(e){}past.push({date:new Date().toLocaleString('es-MX'),level,correct,total:rows.length,percent});localStorage.setItem(store,JSON.stringify(past.slice(-60)));let skills={};rows.forEach(r=>{skills[r.skill]??={n:0,c:0};skills[r.skill].n++;if(r.correct)skills[r.skill].c++});el('enalltWorkspace').innerHTML=`<div class="panel"><h2>Resultados · Inglés ${level}</h2><div class="display-5 fw-bold">${percent}%</div><p>${correct} de ${rows.length} respuestas correctas. Puntuación de práctica, no calificación oficial ENALLT.</p><h4>Diagnóstico por habilidad</h4>${Object.entries(skills).map(([name,v])=>`<div class="mb-2"><div class="d-flex justify-content-between"><span>${escape(name)}</span><strong>${v.c}/${v.n}</strong></div><div class="progress"><div class="progress-bar" style="width:${100*v.c/v.n}%"></div></div></div>`).join('')}<h4 class="mt-4">Revisión de respuestas</h4>${rows.map((r,i)=>`<details class="enallt-review"><summary>${r.correct?'✓':'✗'} ${i+1}. ${escape(r.question)} · ${escape(r.skill)}</summary><p>Tu respuesta: ${escape(r.chosen)}<br>Correcta: <b>${escape(r.expected)}</b></p><p>${escape(r.explanation)}</p></details>`).join('')}<button class="btn btn-primary mt-4" onclick="ENALLT.back()">Elegir otro examen</button></div>`;run=null;history()}
function back(){clearInterval(timer);run=null;el('enalltWorkspace').hidden=true;el('enalltSelector').hidden=false;history()}
window.ENALLT={start,answer,finish,back};document.addEventListener('DOMContentLoaded',home);
})();