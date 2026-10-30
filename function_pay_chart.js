// "Who pays the most for junior software, sales and operations roles"
// Self-contained d3 v7 chart for the entry-level pay site.
// Needs: d3 v7, the page's `dash` shim with  funcemp:'function_pay_by_employer.csv'  added to its files map,
// and an element <div class="chart" id="funcEmpChart" data-source="funcemp"></div> inside a card.
(function(){
  const FUNCS=['Software & data','Sales & BD','Ops & supply chain'];
  const SECTIONS=[['industry','By industry'],['company_type','By company type']];
  const POS='var(--s1)', NEG='var(--color-bad)';
  const pct=v=>(v>0?'+':v<0?'−':'±')+Math.round(Math.abs(v)*100)+'%';
  const eurK=v=>'€'+(v/1000).toFixed(1)+'k';
  const eur=v=>'€'+d3.format(',.0f')(v);

  function tip(box){let t=box.querySelector('.fe-tt');if(!t){t=document.createElement('div');t.className='fe-tt';t.hidden=true;box.appendChild(t);}return t;}
  function show(box,ev,lines){const t=tip(box);t.textContent='';lines.forEach((l,i)=>{const d=document.createElement('div');d.textContent=l;if(i===0)d.className='fe-h';t.appendChild(d);});t.hidden=false;
    const b=box.getBoundingClientRect();let x=ev.clientX-b.left+12,y=ev.clientY-b.top+12;if(x+t.offsetWidth>b.width)x=ev.clientX-b.left-t.offsetWidth-12;t.style.left=Math.max(0,x)+'px';t.style.top=y+'px';}
  function hide(box){const t=box.querySelector('.fe-tt');if(t)t.hidden=true;}

  function draw(){
    const box=document.getElementById('funcEmpChart'); if(!box)return;
    const st=dash.data('funcemp'); box.textContent='';
    if(st.status!=='ok'){
      if(st.status==='error'){const f=document.createElement('div');f.className='fail';f.textContent='Failed to load';box.appendChild(f);}
      return;
    }
    const rows=st.data.map(r=>({f:r.function,dim:r.dimension,cat:r.category,emp:+r.employers,posts:+r.postings,gap:+r.pay_gap,lo:+r.ci80_low,hi:+r.ci80_high,eur:+r.median_monthly_eur,ov:+r.function_overall_gap}));
    const W=box.clientWidth||900, cols=W>=1500?3:1, gapX=28, pw=(W-gapX*(cols-1))/cols, narrow=pw<640;
    const grid=document.createElement('div');grid.className='fe-grid';grid.style.gridTemplateColumns=`repeat(${cols},minmax(0,1fr))`;box.appendChild(grid);
    // shared x scale across panels
    const xmin=Math.min(-0.2,d3.min(rows,r=>r.lo)), xmax=Math.max(0.6,d3.max(rows,r=>r.hi));
    const nMax={}; SECTIONS.forEach(([d])=>nMax[d]=d3.max(FUNCS,f=>rows.filter(r=>r.f===f&&r.dim===d).length));
    FUNCS.forEach(f=>{
      const panel=document.createElement('div');panel.className='fe-panel';grid.appendChild(panel);
      const ov=rows.find(r=>r.f===f).ov;
      const h=document.createElement('h4');h.textContent=f;panel.appendChild(h);
      const sub=document.createElement('p');sub.className='fe-sub';sub.textContent=`All employers: ${pct(ov)} (dashed line)`;panel.appendChild(sub);
      const rh=narrow?40:26, secH=30, axisH=22;
      const H=SECTIONS.reduce((a,[d])=>a+secH+nMax[d]*rh,0)+axisH;
      const svg=d3.select(panel).append('svg').attr('width','100%').attr('viewBox',`0 0 ${pw} ${H}`).attr('height',H);
      const meas=t=>{const n=svg.append('text').attr('class','fe-t').text(t);const w=n.node().getComputedTextLength();n.remove();return w;};
      const labW=narrow?4:Math.ceil(d3.max(rows,r=>meas(r.cat)))+10;
      const valW=Math.ceil(meas(narrow?'+55% · €3.3k':'+55% · €3.3k · 144 employers'))+12;
      const x=d3.scaleLinear([xmin,xmax],[labW,pw-valW]).nice();
      const nt=Math.max(3,Math.min(7,Math.floor((pw-valW-labW)/60)));
      let y0=0;
      SECTIONS.forEach(([dim,title])=>{
        const s=rows.filter(r=>r.f===f&&r.dim===dim).sort((a,b)=>b.gap-a.gap);
        const g=svg.append('g').attr('transform',`translate(0,${y0})`);
        g.append('text').attr('class','fe-sec').attr('x',0).attr('y',16).text(title.toUpperCase());
        const top=secH, bot=secH+nMax[dim]*rh;
        x.ticks(nt).forEach(t=>g.append('line').attr('x1',x(t)).attr('x2',x(t)).attr('y1',top).attr('y2',bot).attr('stroke',t===0?'var(--cds-chart-axis)':'var(--cds-chart-grid)'));
        g.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',top).attr('y2',bot).attr('stroke','var(--cds-chart-axis)');
        g.append('line').attr('x1',x(ov)).attr('x2',x(ov)).attr('y1',top).attr('y2',bot).attr('stroke','var(--cds-chart-reference)').attr('stroke-dasharray','4 3');
        s.forEach((r,i)=>{
          const cy=top+i*rh+(narrow?27:rh/2), col=r.gap>=0?POS:NEG;
          const row=g.append('g');
          if(narrow) row.append('text').attr('class','fe-t lbl').attr('x',0).attr('y',cy-13).text(r.cat);
          else row.append('text').attr('class','fe-t lbl').attr('x',labW-8).attr('y',cy).attr('dy','0.35em').attr('text-anchor','end').text(r.cat);
          row.append('line').attr('x1',x(r.lo)).attr('x2',x(r.hi)).attr('y1',cy).attr('y2',cy).attr('stroke',col).attr('stroke-width',7).attr('stroke-linecap','round').attr('opacity',.22);
          if(dim==='industry') row.append('circle').attr('cx',x(r.gap)).attr('cy',cy).attr('r',5).attr('fill',col).attr('stroke','var(--color-panel)').attr('stroke-width',2);
          else row.append('path').attr('d',d3.symbol(d3.symbolDiamond,90)()).attr('transform',`translate(${x(r.gap)},${cy})`).attr('fill',col).attr('stroke','var(--color-panel)').attr('stroke-width',2);
          row.append('text').attr('class','fe-t').attr('x',x(Math.max(r.hi,r.gap))+8).attr('y',cy).attr('dy','0.35em').text(narrow?`${pct(r.gap)} · ${eurK(r.eur)}`:`${pct(r.gap)} · ${eurK(r.eur)} · ${r.emp} employers`);
          row.append('rect').attr('x',0).attr('width',pw).attr('y',cy-(narrow?27:rh/2)).attr('height',rh).attr('fill','transparent')
            .on('pointermove',ev=>show(box,ev,[`${f} · ${r.cat}`,`${pct(r.gap)} vs country junior median`,`80% interval ${pct(r.lo)} to ${pct(r.hi)}`,`Median pay ${eur(r.eur)} a month`,`${r.emp} employers, ${r.posts} postings`]))
            .on('pointerleave',()=>hide(box));
        });
        y0+=secH+nMax[dim]*rh;
      });
      const ax=svg.append('g').attr('transform',`translate(0,${y0+2})`).call(d3.axisBottom(x).ticks(nt).tickFormat(v=>v===0?'0':pct(v)).tickSize(0)).attr('font-size',null).attr('font-family',null);
      ax.select('.domain').remove(); ax.selectAll('text').attr('class','fe-t').attr('dy','1em');
      if(window.karimiMark) window.karimiMark(svg,pw,H,'top');
    });
  }
  dash.onData(draw);
})();
