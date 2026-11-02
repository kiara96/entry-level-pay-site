// Beyond-the-CV charts, drawn with the same bars, colours and hover as the pay charts.
(function(){
  const LAB={
    'Portfolio':'Portfolio / work samples',
    'Personal projects':'Personal / side projects',
    'Extracurriculars':'Extracurriculars, associations, volunteering',
    'Hackathons & competitions':'Hackathons & competitions',
    'Code / open source':'GitHub / open-source work',
    'Achievements':'Personal achievements',
    'Publications':'Publications / publication list'
  };
  const TYPES=['Portfolio','Personal projects','Extracurriculars','Hackathons & competitions','Code / open source','Publications'];
  const FN={
    CREATIVE_DESIGN:'Creative & design',SOFTWARE_DATA:'Software & data',MARKETING_COMMS:'Marketing & comms',
    STRATEGY_CONSULTING:'Strategy & consulting',SCIENCE_RESEARCH:'Science & research',HR_PEOPLE:'HR & people',
    FINANCE_ACCOUNTING:'Finance & accounting',ENGINEERING_TECH:'Engineering & tech',SALES_BD:'Sales & BD',
    OPS_SUPPLY_CHAIN:'Ops & supply chain',HOSPITALITY_FOOD:'Hospitality & food',RETAIL:'Retail',HEALTH_CARE:'Health & care'
  };
  const TYPE_NAME={'startups & scaleups':'Startups & scaleups','small & medium businesses':'Small & medium businesses','public sector & NGO':'Public sector & NGO','corporate & enterprise':'Corporate & enterprise'};
  const AVG=940/55723;
  const ORANGE='var(--s1)', MUTED='var(--cds-chart-muted)';
  const pct1=v=>(v*100).toFixed(1)+'%';
  const pct2=v=>(v*100).toFixed(2)+'%';
  const num=v=>Number(v).toLocaleString('en-US');
  const bars=window.payCharts.hbars;

  function ok(id){return dash.data(id).status==='ok';}
  function fail(id){
    const box=document.getElementById(id); if(!box) return;
    box.textContent='';
    const f=document.createElement('div'); f.className='fail'; f.textContent='Failed to load'; box.appendChild(f);
  }

  function drawRare(){
    const box=document.getElementById('accRareChart'); if(!box) return;
    if(!ok('accTypes')){ if(dash.data('accTypes').status==='error') fail('accRareChart'); return; }
    const raw=dash.data('accTypes').data.map(r=>({cat:r.category,n:+r.postings,share:+r.share_of_postings}));
    const rows=raw.filter(r=>r.cat!=='Awards'&&r.cat!=='Achievements').sort((a,b)=>b.n-a.n);
    const ach=raw.find(r=>r.cat==='Achievements'); if(ach) rows.push(ach);
    bars(box, rows.map(r=>({
      label:LAB[r.cat]||r.cat, value:r.share, color:ORANGE,
      tip:[{c:ORANGE,v:num(r.n),n:'postings'},{v:pct2(r.share),n:'of 55,723 ads'}]
    })), {fmt:pct2, axisTop:true, xTitle:'Share of postings', yTitle:'What they ask for'});
  }

  function shareBars(id, source, yTitle){
    const box=document.getElementById(id); if(!box) return;
    if(!ok(source)){ if(dash.data(source).status==='error') fail(id); return; }
    const rows=dash.data(source).data.map(r=>{
      const label=r.strength||r.location, share=+r.share;
      return {label, value:share, color:ORANGE, tip:[{c:ORANGE,v:pct1(share),n:label}]};
    });
    bars(box, rows, {fmt:v=>Math.round(v*100)+'%', axisTop:true, xTitle:'Share of mentions', yTitle});
  }

  function drawWhere(){
    const specs=[
      {id:'accWhereRole', title:'Role type', order:['Internship','Working student','Work-study / apprenticeship','Junior']},
      {id:'accWhereType', title:'Company type', rename:TYPE_NAME},
      {id:'accWhereSize', title:'Company size', order:['Small (11-50)','Medium (51-200)','Large (201-1000)','Enterprise (1000+)']},
      {id:'accWhereIndustry', title:'Employer industry', min:500},
      {id:'accWhereCountry', title:'Country'},
      {id:'accWhereFunction', title:'Job function', only:FN}
    ];
    if(!ok('accWhere')){
      if(dash.data('accWhere').status==='error') specs.forEach(s=>fail(s.id));
      return;
    }
    const all=dash.data('accWhere').data.map(r=>({dim:r.dimension,group:r.group,postings:+r.postings,asking:+r.asking,share:+r.share}));
    const dimOf={accWhereRole:'role_type',accWhereType:'company_type',accWhereSize:'company_size',accWhereIndustry:'industry',accWhereCountry:'country_en',accWhereFunction:'macro_function'};
    specs.forEach(s=>{
      const box=document.getElementById(s.id); if(!box) return;
      let rows=all.filter(r=>r.dim===dimOf[s.id]&&r.postings>=(s.min||0));
      rows=rows.map(r=>({...r, label:s.only?s.only[r.group]:((s.rename&&s.rename[r.group])||r.group)}));
      if(s.only) rows=rows.filter(r=>s.only[r.group]);
      if(s.order){
        const rank=new Map(s.order.map((g,i)=>[g,i]));
        rows=rows.filter(r=>rank.has(r.group)).sort((a,b)=>rank.get(a.group)-rank.get(b.group));
      }else rows.sort((a,b)=>b.share-a.share);
      bars(box, rows.map(r=>{
        const color=r.share<AVG?MUTED:ORANGE;
        return {label:r.label, value:r.share, color, tip:[
          {c:color, v:pct1(r.share), n:`${num(r.asking)} of ${num(r.postings)} ads`}
        ]};
      }), {fmt:pct1, axisTop:true, xTitle:'Share of postings', yTitle:s.title, ref:AVG, refLabel:'All: 1.7%'});
    });
  }

  function drawFamilies(){
    const box=document.getElementById('accFamChart'); if(!box) return;
    if(!ok('accFamilies')){ if(dash.data('accFamilies').status==='error') fail('accFamChart'); return; }
    const COL={
      'Portfolio':'#FF5E36','Personal projects':'#310A5E','Extracurriculars':'#FF8A6E',
      'Hackathons & competitions':'#6B3D8C','Code / open source':'#C2411F','Publications':'#a894c9'
    };
    const light=new Set(['#ff8a6e','#a894c9']);
    const rows=dash.data('accFamilies').data.map(r=>{
      const counts=TYPES.map(t=>+r[t]||0), sum=counts.reduce((a,b)=>a+b,0)||1;
      return {family:r.family, ads:+r.ads, asked:+r.asked, rate:+r.rate, parts:TYPES.map((t,i)=>({t,v:counts[i]/sum}))};
    }).filter(r=>r.asked>=10&&r.family!=='Other').sort((a,b)=>b.rate-a.rate);
    box.textContent='';
    const W=box.clientWidth||1000, narrow=W<860, gap=28, rh=28, top=36, legendH=44;
    const leftW=narrow?W:Math.round(W*0.46), rightX=narrow?0:leftW+gap, rightW=narrow?W:W-rightX;
    const plotH=top+rows.length*rh+22;
    const H=narrow?plotH+16+plotH+legendH:plotH+legendH;
    const svg=d3.select(box).append('svg').attr('width','100%').attr('viewBox',`0 0 ${W} ${H}`).attr('height',H);
    const meas=t=>{const n=svg.append('text').text(t); const w=n.node().getComputedTextLength(); n.remove(); return w;};
    const labW=Math.ceil(d3.max(rows,r=>meas(r.family)))+12;
    const valW=Math.ceil(meas('21% (115 of 1,053)'))+12;
    svg.append('text').attr('class','axis-title').attr('x',0).attr('y',16).text('How often they ask');
    const x=d3.scaleLinear([0,0.32],[labW,leftW-valW]);
    [0.1,0.2].forEach(t=>svg.append('line').attr('x1',x(t)).attr('x2',x(t)).attr('y1',top).attr('y2',top+rows.length*rh).attr('stroke','var(--cds-chart-grid)'));
    rows.forEach((r,i)=>{
      const cy=top+i*rh+rh/2;
      svg.append('text').attr('class','lbl').attr('text-anchor','end').attr('x',labW-8).attr('y',cy).attr('dy','0.35em').text(r.family);
      svg.append('rect').attr('x',labW).attr('y',cy-8).attr('width',Math.max(1,x(r.rate)-labW)).attr('height',16).attr('rx',4).attr('fill',ORANGE);
      svg.append('text').attr('x',x(r.rate)+6).attr('y',cy).attr('dy','0.35em').text(`${Math.round(r.rate*100)}% (${num(r.asked)} of ${num(r.ads)})`);
      if(narrow){
        const tip=[{c:ORANGE,v:`${num(r.asked)} of ${num(r.ads)}`,n:'ads ask'}].concat(r.parts.filter(p=>p.v>0).map(p=>({c:COL[p.t],v:Math.round(p.v*100)+'%',n:p.t})));
        svg.append('rect').attr('x',0).attr('width',W).attr('y',top+i*rh).attr('height',rh).attr('fill','transparent')
          .on('pointermove',ev=>window.payCharts.showTip(box,ev,r.family,tip))
          .on('pointerleave',()=>window.payCharts.hideTip(box));
      }
    });
    [0,0.1,0.2].forEach(t=>svg.append('text').attr('text-anchor','middle').attr('x',x(t)).attr('y',top+rows.length*rh+16).text(Math.round(t*100)+'%'));
    const yShift=narrow?plotH+16:0;
    svg.append('text').attr('class','axis-title').attr('x',rightX).attr('y',yShift+16).text('What they ask for (share of mentions)');
    const x2=d3.scaleLinear([0,1],[rightX,rightX+rightW]);
    [0.5].forEach(t=>svg.append('line').attr('x1',x2(t)).attr('x2',x2(t)).attr('y1',yShift+top).attr('y2',yShift+top+rows.length*rh).attr('stroke','var(--cds-chart-grid)'));
    rows.forEach((r,i)=>{
      const cy=yShift+top+i*rh+rh/2;
      let acc=0;
      r.parts.forEach(p=>{
        if(p.v<=0) return;
        const xA=x2(acc), xB=x2(acc+p.v);
        svg.append('rect').attr('x',xA).attr('y',cy-8).attr('width',Math.max(0,xB-xA-1)).attr('height',16).attr('fill',COL[p.t]);
        if(p.v>=0.12){
          svg.append('text').attr('class',light.has(COL[p.t].toLowerCase())?'ac-onbar ink':'ac-onbar').attr('text-anchor','middle')
            .attr('x',(xA+xB)/2).attr('y',cy).attr('dy','0.35em').text(Math.round(p.v*100)+'%');
        }
        acc+=p.v;
      });
      const tip=[{c:ORANGE,v:`${num(r.asked)} of ${num(r.ads)}`,n:'ads ask'}].concat(r.parts.filter(p=>p.v>0).map(p=>({c:COL[p.t],v:Math.round(p.v*100)+'%',n:p.t})));
      svg.append('rect').attr('x',0).attr('width',W).attr('y',yShift+top+i*rh).attr('height',rh).attr('fill','transparent')
        .on('pointermove',ev=>window.payCharts.showTip(box,ev,r.family,tip))
        .on('pointerleave',()=>window.payCharts.hideTip(box));
    });
    [0,0.5,1].forEach(t=>svg.append('text').attr('text-anchor',t===1?'end':'middle').attr('x',t===1?rightX+rightW-2:x2(t)).attr('y',yShift+top+rows.length*rh+16).text(Math.round(t*100)+'%'));
    const ly=H-28;
    TYPES.forEach((t,i)=>{
      const col=i%3, row=Math.floor(i/3), lx=col*(W/3), yy=ly+row*16;
      svg.append('rect').attr('x',lx).attr('y',yy-9).attr('width',10).attr('height',10).attr('rx',2).attr('fill',COL[t]);
      svg.append('text').attr('x',lx+16).attr('y',yy).text(t);
    });
    if(window.karimiMark) window.karimiMark(svg,W,H,'top');
  }

  function drawQuotes(){
    const box=document.getElementById('accQuoteChart'); if(!box) return;
    if(!ok('accQuotes')){ if(dash.data('accQuotes').status==='error'){box.textContent='Failed to load';} return; }
    box.textContent='';
    dash.data('accQuotes').data.forEach(r=>{
      const card=document.createElement('article'); card.className='ac-quote';
      const k=document.createElement('b'); k.textContent=r.type.toUpperCase();
      const p=document.createElement('p'); p.textContent='“'+r.quote+'”';
      const who=document.createElement('span'); who.textContent=r.attribution;
      card.append(k,p,who); box.appendChild(card);
    });
  }

  function draw(){ drawRare(); shareBars('accStrengthChart','accStrength','How firmly'); shareBars('accLocationChart','accLocation','Where in the ad'); drawWhere(); drawFamilies(); drawQuotes(); }
  dash.onData(draw);
})();
