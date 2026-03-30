const S={i:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',m:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>',c:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',g:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',b:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',s:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'};

document.addEventListener('DOMContentLoaded',()=>{
    const gE=id=>document.getElementById(id);
    const gC=gE('goalsContainer'),aB=gE('addGoalBtn'),nB=gE('navigateBtn'),tC=gE('timeConstraints'),hA=gE('hoursAvailable');
    const aO=gE('appOutput'),tR=gE('tabsRow'),gCC=gE('goalContentContainer'),sE=gE('scheduleEvaluation'),sG=gE('scheduleGrid');
    const rSB=gE('resetSessionBtn'), iS=gE('intakeSection');

    let gCt=0;



    rSB.onclick=()=>{
        if(confirm("Are you sure you want to delete this roadmap? Your progress will reset.")){
            localStorage.removeItem('saved_dashboard');
            location.reload();
        }
    };

    let csh = localStorage.getItem('saved_dashboard');
    if(csh){
        iS.classList.add('hidden');
        rSB.classList.remove('hidden');
        setTimeout(() => bD(JSON.parse(csh)), 50);
    }

    function cGB(){
        if(gCt>=10)return; gCt++;
        const b=document.createElement('div'); b.className='goal-block fade-in'; b.id="g-"+gCt;
        b.innerHTML=`<div class="goal-block-header"><h4 style="color:#22d3ee;">Goal #${gCt}</h4><button class="remove-goal-btn" onclick="this.parentElement.parentElement.remove();window.uGB();">X</button></div>
        <div class="input-group"><input type="text" class="form-control g-txt" placeholder="Goal (e.g. Learn Guitar)"></div>
        <div class="input-group" style="margin-top:10px;"><textarea class="form-control g-exp" placeholder="Past Experience?"></textarea></div>
        <div class="input-group" style="margin-top:10px;"><label style="font-size:.9rem;color:var(--text-secondary);">Duration (Days)</label><input type="number" class="form-control g-days" min="3" max="60" value="7"></div>`;
        gC.appendChild(b); window.uGB();
    }
    
    window.uGB=()=>{ aB.style.display=document.querySelectorAll('.goal-block').length>=10?'none':'block'; };
    aB.onclick=cGB;
    cGB(); setTimeout(()=>{if(document.querySelectorAll('.goal-block').length===1)document.querySelector('.remove-goal-btn').style.display='none';},50);

    nB.onclick=async()=>{
        const c=tC.value.trim(),a=hA.value.trim(),bs=document.querySelectorAll('.goal-block'),fG=[];
        bs.forEach(b=>{
            const t=b.querySelector('.g-txt').value.trim(),e=b.querySelector('.g-exp').value.trim(),d=b.querySelector('.g-days').value.trim()||"7";
            if(t)fG.push("- Goal: "+t+" | Exp: "+(e||'None')+" | Target Duration: "+d+" Days");
        });
        if(!fG.length)return alert('Please add at least one goal.');
        
        const PT=`CONSTRAINTS: ${c}\nHOURS: ${a}/day.\nGOALS:\n${fG.join('\n')}\nCRITICAL: Return exactly ${fG.length} goals in the array matching the target durations requested.`;
        
        document.querySelector('.btn-text').classList.add('hidden');
        document.querySelector('.loader').classList.remove('hidden');
        nB.disabled=true; aO.classList.add('hidden');

        try{
            const res=await fetch('/api/generate',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({prompt: PT})
            });
            if(!res.ok)throw new Error(await res.text());
            const d=await res.json();
            const fJ = JSON.parse(d.choices[0].message.content.replace(/^\s*```json/i,'').replace(/```\s*$/i,''));
            localStorage.setItem('saved_dashboard', JSON.stringify(fJ));
            iS.classList.add('hidden');
            rSB.classList.remove('hidden');
            bD(fJ);
        }catch(e){alert('Error: '+e.message);}finally{
            document.querySelector('.btn-text').classList.remove('hidden');
            document.querySelector('.loader').classList.add('hidden');
            nB.disabled=false;
        }
    };

    let cDA=[];
    function bD(d){
        cDA=d.goals; sE.textContent=d.time_management.evaluation; sG.innerHTML='';
        d.time_management.daily_schedule.forEach(s=>{
            const v=document.createElement('div'); v.className='stat-card fade-in';
            v.innerHTML='<div class="stat-hours">'+s.hours+'h</div><div class="stat-label">'+s.activity+'</div>'; sG.appendChild(v);
        });
        tR.innerHTML='';
        cDA.forEach((g,i)=>{
            const b=document.createElement('button'); b.className="tab-btn "+(i===0?'active':'');
            b.textContent=g.goal_name?g.goal_name:"Goal "+g.goal_number;
            b.onclick=()=>rT(i); tR.appendChild(b);
        });
        aO.classList.remove('hidden'); rT(0);
    }

    function rT(i){
        document.querySelectorAll('.tab-btn').forEach((b,x)=>b.classList.toggle('active',x===i));
        const g=cDA[i], h=btoa(encodeURI(g.goal_name||"g"+i)).substring(0,20);
        
        gCC.innerHTML=`
            <div class="result-card glass-card fade-in"><div class="card-header"><div class="icon-box info-icon">${S.i}</div><h2>Goal Analysis</h2></div><div class="card-content"><div style="display:flex;gap:10px;margin-bottom:15px;"><div class="verdict-banner ${g.analysis.verdict.includes('Good')?'good':'rethink'}">${g.analysis.verdict}</div><div class="verdict-banner" style="background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.4);color:#22d3ee;">${g.analysis.phase_duration||g.daily_plan.length+" Days"}</div></div><p class="text-body">${g.analysis.explanation}</p><h3>Components</h3><ul class="styled-list">${g.analysis.breakdown.map(b=>"<li>"+b+"</li>").join('')}</ul></div></div>
            <div class="result-card glass-card fade-in delay-1" style="margin-top:30px;"><div class="card-header"><div class="icon-box map-icon">${S.m}</div><h2>Step-by-Step Instructions</h2></div><div class="card-content"><div class="steps-timeline">${g.guide.steps.map(s=>'<div class="step-item"><p class="step-text">'+s+'</p></div>').join('')}</div></div></div>
            <div class="result-card glass-card fade-in delay-1" style="margin-top:30px;"><div class="card-header"><div class="icon-box" style="background:rgba(16,185,129,.1);color:#34d399;">${S.c}</div><h2>Action Tracker (${g.daily_plan.length} Days)</h2></div><div class="card-content"><div class="daily-tracker-list" id="t-${h}"></div></div></div>
            <div class="result-card glass-card fade-in delay-2" style="margin-top:30px;"><div class="card-header"><div class="icon-box cart-icon">${S.g}</div><h2>Gear & Gadgets</h2></div><div class="card-content"><div class="resources-grid">${g.gadgets.map(j=>`<div class="resource-card"><a href="${j.url}" target="_blank" class="resource-title">${S.c}${j.name} <span style="font-size:.8em;margin-left:auto;">${j.price_guess}</span></a><p class="resource-note"><strong style="color:#22d3ee;">${j.platform}</strong>: ${j.reason}</p></div>`).join('')}</div></div></div>
            <div class="result-card glass-card fade-in delay-3" style="margin-top:30px;"><div class="card-header"><div class="icon-box" style="background:rgba(16,185,129,.1);color:#34d399;">${S.b}</div><h2>Deep Learning</h2></div><div class="card-content"><h3>Channels</h3><ul class="styled-list">${g.learning.channels.map(c=>`<li><a href="${c.url}" target="_blank" style="color:#f0fdfa;"><strong>${c.name}</strong></a> - ${c.description}</li>`).join('')}</ul><h3 style="margin-top:20px;">Videos</h3><ul class="styled-list">${g.learning.videos.map(v=>`<li><a href="${v.url}" target="_blank" style="color:#f0fdfa;">"<strong>${v.title}</strong>"</a></li>`).join('')}</ul><h3 style="margin-top:20px;">Sites</h3><ul class="styled-list checks">${g.learning.websites.map(w=>`<li><a href="${w.url}" target="_blank" style="color:#22d3ee;">${w.name}</a></li>`).join('')}</ul></div></div>
            <div class="result-card glass-card fade-in delay-4" style="margin-top:30px;"><div class="card-header"><div class="icon-box star-icon">${S.s}</div><h2>Post-Mastery</h2></div><div class="card-content"><h3>Applications</h3><ul class="styled-list">${g.post_mastery.applications.map(a=>"<li>"+a+"</li>").join('')}</ul><h3 style="margin-top:20px;">Monetization</h3><ul class="styled-list checks">${g.post_mastery.monetization.map(m=>"<li>"+m+"</li>").join('')}</ul><h3 style="margin-top:20px;">What Next?</h3><ul class="styled-list">${g.post_mastery.next_steps.map(n=>"<li>"+n+"</li>").join('')}</ul></div></div>
        `;

        let SS=JSON.parse(localStorage.getItem("t_"+h)||"[]");
        const tC=gE("t-"+h);
        const rU=()=>{
            let nf=false;
            Array.from(tC.children).forEach((n,x)=>{
                const iC=SS[x]===true; n.className="daily-item "+(iC?'completed':'');
                if(!iC&&!nf){n.classList.add('active-next');nf=true;}
            });
            localStorage.setItem("t_"+h,JSON.stringify(SS));
        };
        g.daily_plan.forEach((p,x)=>{
            if(SS[x]===undefined)SS[x]=false;
            const iN=document.createElement('div'); iN.className="daily-item";
            iN.innerHTML='<div class="check-circle"></div><div class="daily-content"><h4>'+p.day+'</h4><div class="daily-text">'+p.action+'</div></div>';
            iN.onclick=()=>{SS[x]=!SS[x];rU();}; tC.appendChild(iN);
        }); rU();
    }
});
