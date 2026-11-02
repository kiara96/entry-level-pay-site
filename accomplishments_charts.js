// Four charts: what entry-level postings ask for beyond the CV.
(function(){
  const COL={
    'Portfolio':'#FF5E36','Personal projects':'#310A5E','Extracurriculars':'#FF8A6E',
    'Hackathons & competitions':'#6B3D8C','Code / open source':'#C2411F',
    'Publications':'#a894c9','Achievements':'#c9b3e6'
  };
  const LAB={
    'Portfolio':'Portfolio / work samples',
    'Personal projects':'Personal / side projects',
    'Extracurriculars':'Extracurriculars, associations,\nvolunteering',
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
  const pct0=v=>Math.round(v*100)+'%';
  const pct1=v=>(v*100).toFixed(1)+'%';
  const pct2=v=>(v*100).toFixed(2)+'%';
  const num=v=>Number(v).toLocaleString('en-US');
  const onFill=hex=>['#ff8a6e','#a894c9','#c9b3e6'].includes(String(hex).toLowerCase())?'#0b0b0b':'#ffffff';

  function ready(ids){
    const sts=ids.map(id=>dash.data(id));
    if(sts.some(s=>s.status==='error')) return 'error';
    if(sts.every(s=>s.status==='ok')) return 'ok';
    return 'loading';
  }
  function clear(id){
    const box=document.getElementById(id); if(!box) return null;
    box.textContent='';
    return box;
  }
  function fail(box){
    const f=document.createElement('div'); f.className='fail'; f.textContent='Failed to load'; box.appendChild(f);
  }
  function svgOf(box,w,h){
    return d3.select(box).append('svg').attr('width','100%').attr('viewBox',`0 0 ${w} ${h}`).attr('height',h);
  }
  function measure(svg,text,cls){
    const n=svg.append('text').attr('class',cls||'ac-ink').text(text);
    const w=n.node().getComputedTextLength(); n.remove(); return w;
  }
  function stamp(svg,w,h){ if(window.karimiMark) window.karimiMark(svg,w,h,'top'); }

  function drawRare(){
    const box=clear('accRareChart'); if(!box) return;
    const st=ready(['accTypes','accStrength','accLocation']);
    if(st!=='ok'){ if(st==='error') fail(box); return; }
    const raw=dash.data('accTypes').data.map(r=>({cat:r.category,n:+r.postings,share:+r.share_of_postings}));
    const awards=raw.find(r=>r.cat==='Awards');
    const rows=raw.filter(r=>r.cat!=='Awards'&&r.cat!=='Achievements').sort((a,b)=>b.n-a.n);
    const ach=raw.find(r=>r.cat==='Achievements'); if(ach) rows.push(ach);
    const strength=dash.data('accStrength').data.map(r=>({k:r.strength,v:+r.share}));
    const location=dash.data('accLocation').data.map(r=>({k:r.location,v:+r.share}));
    const W=box.clientWidth||900, narrow=W<860, gap=28;
    const leftW=narrow?W:Math.round(W*0.60), rightW=narrow?W:W-leftW-gap;
    const rh=46, top=28, foot=22;
    const leftH=top+rows.length*rh+foot;
    const stackBlock=118;
    const H=narrow?leftH+16+stackBlock*2:Math.max(leftH,16+stackBlock*2);
    const svg=svgOf(box,W,H);
    const labW=Math.ceil(d3.max(rows,r=>d3.max(LAB[r.cat].split('\n'),line=>measure(svg,line))))+12;
    const valSample=measure(svg,'250 (0.45% of postings)','ac-sub')+16;
    const x=d3.scaleLinear([0,d3.max(rows,r=>r.n)],[labW,leftW-valSample]);
    svg.append('text').attr('class','ac-title').attr('x',0).attr('y',16).text('Postings asking for each (one posting can ask for several)');
    rows.forEach((r,i)=>{
      const y=top+i*rh, cy=y+rh/2-4, col=COL[r.cat]||'var(--s1)';
      const lines=LAB[r.cat].split('\n');
      lines.forEach((line,li)=>{
        svg.append('text').attr('class','ac-ink').attr('text-anchor','end').attr('x',labW-10)
          .attr('y',cy+(li-(lines.length-1)/2)*14).text(line);
      });
      svg.append('rect').attr('x',labW).attr('y',cy-9).attr('width',Math.max(2,x(r.n)-labW)).attr('height',18).attr('fill',col);
      svg.append('text').attr('class','ac-sub').attr('x',x(r.n)+8).attr('y',cy).attr('dy','0.35em')
        .text(`${r.n} (${pct2(r.share)} of postings)`);
    });
    svg.append('text').attr('class','ac-muted').attr('x',0).attr('y',top+rows.length*rh+8)
      .text(`Awards and scholarships: ${awards?awards.n:1} posting. Not shown.`);
    const sx=narrow?0:leftW+gap, sy=narrow?leftH+8:0;
    stack(svg,sx,sy,rightW,strength,[
      ['Listed, no weight given','#c9b3e6'],
      ['Nice to have / "a plus"','#6B3D8C'],
      ['Required','#FF5E36']
    ],'How firmly it is asked (excl. publications)');
    stack(svg,sx,sy+stackBlock,rightW,location,[
      ['In the candidate profile','#c9b3e6'],
      ['In the application instructions','#310A5E']
    ],'Where it appears in the ad (excl. publications)');
    if(window.karimiMark) window.karimiMark(svg,W,H,'bottom');
  }

  function stack(svg,x,y,w,series,order,title){
    const map=new Map(series.map(r=>[r.k,r.v]));
    const parts=order.map(([k,c])=>({k,c,v:map.get(k)||0})).filter(p=>p.v>0);
    svg.append('text').attr('class','ac-title').attr('x',x).attr('y',y+16).text(title);
    const barY=y+36, barH=22, labelW=36, barW=w-labelW;
    let left=0;
    parts.forEach(p=>{
      const seg=p.v*barW;
      svg.append('rect').attr('x',x+left).attr('y',barY).attr('width',Math.max(seg-1,0)).attr('height',barH).attr('fill',p.c);
      const inside=p.v>0.12;
      svg.append('text').attr('class','ac-onbar'+(onFill(p.c)==='#0b0b0b'?' ink':''))
        .attr('text-anchor',inside?'middle':'start')
        .attr('x',inside?x+left+seg/2:x+left+seg+4)
        .attr('y',inside?barY+barH/2:barY-6).attr('dy',inside?'0.35em':'0')
        .text(pct0(p.v));
      left+=seg;
    });
    parts.forEach((p,i)=>{
      const ly=barY+barH+18+i*16;
      svg.append('rect').attr('x',x).attr('y',ly-9).attr('width',10).attr('height',10).attr('fill',p.c);
      svg.append('text').attr('class','ac-sub').attr('x',x+16).attr('y',ly).text(p.k);
    });
  }

  function drawWhere(){
    const box=clear('accWhereChart'); if(!box) return;
    const st=ready(['accWhere']);
    if(st!=='ok'){ if(st==='error') fail(box); return; }
    const all=dash.data('accWhere').data.map(r=>({dim:r.dimension,group:r.group,postings:+r.postings,share:+r.share}));
    const W=box.clientWidth||1000, cols=W>=1320?3:W>=760?2:1, gapX=26, gapY=26;
    const pw=(W-gapX*(cols-1))/cols;
    const specs=[
      {title:'By role type', dim:'role_type', order:['Internship','Working student','Work-study / apprenticeship','Junior']},
      {title:'By company type', dim:'company_type', rename:TYPE_NAME},
      {title:'By company size', dim:'company_size', order:['Small (11-50)','Medium (51-200)','Large (201-1000)','Enterprise (1000+)']},
      {title:'By employer industry', dim:'industry', min:500},
      {title:'By country', dim:'country_en'},
      {title:'By job function (wider scale)', dim:'macro_function', wide:true, only:FN}
    ];
    const panels=specs.map(s=>{
      let rows=all.filter(r=>r.dim===s.dim&&r.postings>=(s.min||0));
      if(s.only) rows=rows.filter(r=>s.only[r.group]).map(r=>Object.assign({},r,{label:s.only[r.group]}));
      else rows=rows.map(r=>Object.assign({},r,{label:(s.rename&&s.rename[r.group])||r.group}));
      if(s.order){
        const rank=new Map(s.order.map((g,i)=>[g,i]));
        rows=rows.filter(r=>rank.has(r.group)).sort((a,b)=>rank.get(a.group)-rank.get(b.group));
      }else rows.sort((a,b)=>b.share-a.share);
      return Object.assign({rows},s);
    });
    const svg=svgOf(box,W,10);
    const valW=Math.ceil(measure(svg,'15.4% · 42,381 ads','ac-sub'))+14;
    const rh=24, head=26, axis=22;
    const heights=panels.map(p=>head+p.rows.length*rh+axis);
    const rowCount=Math.ceil(panels.length/cols);
    const rowH=[];
    for(let r=0;r<rowCount;r++){
      let m=0; for(let c=0;c<cols;c++){const i=r*cols+c; if(panels[i]) m=Math.max(m,heights[i]);}
      rowH.push(m);
    }
    const H=rowH.reduce((a,b)=>a+b,0)+gapY*(rowCount-1)+4;
    svg.attr('viewBox',`0 0 ${W} ${H}`).attr('height',H);
    const sharedMax=Math.max(0.08,d3.max(panels.filter(p=>!p.wide),p=>d3.max(p.rows,r=>r.share))+0.012);
    panels.forEach((p,i)=>{
      const c=i%cols, r=Math.floor(i/cols);
      const x0=c*(pw+gapX);
      const y0=rowH.slice(0,r).reduce((a,b)=>a+b,0)+r*gapY;
      const g=svg.append('g').attr('transform',`translate(${x0},${y0})`);
      g.append('text').attr('class','ac-title').attr('x',0).attr('y',14).text(p.title);
      const labW=Math.ceil(d3.max(p.rows,row=>measure(svg,row.label)))+12;
      const domain=p.wide?0.25:sharedMax;
      const x=d3.scaleLinear([0,domain],[labW,pw-valW]);
      const ticks=p.wide?[0,0.05,0.1,0.15,0.2]:[0,0.02,0.04,0.06];
      const top=head, bot=head+p.rows.length*rh;
      ticks.forEach(t=>{
        if(t===0) return;
        g.append('line').attr('x1',x(t)).attr('x2',x(t)).attr('y1',top).attr('y2',bot).attr('stroke','var(--cds-chart-grid)');
      });
      g.append('line').attr('x1',x(AVG)).attr('x2',x(AVG)).attr('y1',top-2).attr('y2',bot).attr('stroke','#898781').attr('stroke-dasharray','4 3');
      p.rows.forEach((row,ri)=>{
        const cy=top+ri*rh+rh/2;
        const col=p.wide&&row.share>0.03?'var(--s2)':'var(--s1)';
        g.append('text').attr('class','ac-ink').attr('text-anchor','end').attr('x',labW-8).attr('y',cy).attr('dy','0.35em').text(row.label);
        g.append('rect').attr('x',labW).attr('y',cy-7).attr('width',Math.max(1,x(row.share)-labW)).attr('height',14).attr('fill',col);
        g.append('text').attr('class','ac-sub').attr('x',x(row.share)+6).attr('y',cy).attr('dy','0.35em').text(`${pct1(row.share)} · ${num(row.postings)} ads`);
      });
      let lastTick=-999;
      ticks.forEach(t=>{
        const tx=x(t);
        if(tx-lastTick<34) return;
        lastTick=tx;
        g.append('text').attr('class','ac-muted').attr('text-anchor','middle').attr('x',tx).attr('y',bot+16).text(t===0?'0%':pct0(t));
      });
    });
    stamp(svg,W,H);
  }

  function drawFamilies(){
    const box=clear('accFamChart'); if(!box) return;
    const st=ready(['accFamilies']);
    if(st!=='ok'){ if(st==='error') fail(box); return; }
    const rows=dash.data('accFamilies').data.map(r=>{
      const counts=TYPES.map(t=>+r[t]||0);
      const sum=d3.sum(counts)||1;
      return {family:r.family,ads:+r.ads,asked:+r.asked,rate:+r.rate,mix:counts.map(c=>c/sum)};
    }).filter(r=>r.asked>=10&&r.family!=='Other').sort((a,b)=>b.rate-a.rate);
    const W=box.clientWidth||1000, narrow=W<820, gap=24;
    const leftW=narrow?W:Math.round(W*0.46), rightX=narrow?0:leftW+gap, rightW=narrow?W:W-rightX;
    const rh=28, top=46, legendH=48;
    const plotH=top+rows.length*rh+26;
    const H=narrow?plotH+8+plotH+legendH:plotH+legendH;
    const svg=svgOf(box,W,H);
    const valW=Math.ceil(measure(svg,'21% (115 of 1,053)','ac-sub'))+12;
    const labW=Math.ceil(d3.max(rows,r=>measure(svg,r.family)))+12;
    svg.append('text').attr('class','ac-title').attr('x',0).attr('y',34).text('How often they ask');
    const x=d3.scaleLinear([0,0.32],[labW,leftW-valW]);
    [0.1,0.2].forEach(t=>svg.append('line').attr('x1',x(t)).attr('x2',x(t)).attr('y1',top).attr('y2',top+rows.length*rh).attr('stroke','var(--cds-chart-grid)'));
    rows.forEach((r,i)=>{
      const cy=top+i*rh+rh/2;
      svg.append('text').attr('class','ac-ink').attr('text-anchor','end').attr('x',labW-8).attr('y',cy).attr('dy','0.35em').text(r.family);
      svg.append('rect').attr('x',labW).attr('y',cy-7).attr('width',Math.max(1,x(r.rate)-labW)).attr('height',14).attr('fill','var(--s1)');
      svg.append('text').attr('class','ac-sub').attr('x',x(r.rate)+6).attr('y',cy).attr('dy','0.35em').text(`${pct0(r.rate)} (${num(r.asked)} of ${num(r.ads)})`);
    });
    [0,0.1,0.2].forEach(t=>svg.append('text').attr('class','ac-muted').attr('text-anchor','middle').attr('x',x(t)).attr('y',top+rows.length*rh+16).text(pct0(t)));
    const yShift=narrow?plotH+8:0;
    svg.append('text').attr('class','ac-title').attr('x',rightX).attr('y',yShift+34).text('What they ask for (share of mentions)');
    const x2=d3.scaleLinear([0,1],[rightX,rightX+rightW]);
    [0.5,1].forEach(t=>svg.append('line').attr('x1',x2(t)).attr('x2',x2(t)).attr('y1',yShift+top).attr('y2',yShift+top+rows.length*rh).attr('stroke','var(--cds-chart-grid)'));
    rows.forEach((r,i)=>{
      const cy=yShift+top+i*rh+rh/2;
      let acc=0;
      r.mix.forEach((v,ti)=>{
        if(v<=0) return;
        const xA=x2(acc), xB=x2(acc+v);
        svg.append('rect').attr('x',xA).attr('y',cy-7).attr('width',Math.max(0,xB-xA-1)).attr('height',14).attr('fill',COL[TYPES[ti]]);
        if(v>=0.12){
          svg.append('text').attr('class','ac-onbar'+(onFill(COL[TYPES[ti]])==='#0b0b0b'?' ink':'')).attr('text-anchor','middle')
            .attr('x',(xA+xB)/2).attr('y',cy).attr('dy','0.35em').text(pct0(v));
        }
        acc+=v;
      });
    });
    [0,0.5,1].forEach(t=>svg.append('text').attr('class','ac-muted').attr('text-anchor',t===1?'end':'middle').attr('x',t===1?rightX+rightW:x2(t)).attr('y',yShift+top+rows.length*rh+16).text(pct0(t)));
    const ly=H-30;
    TYPES.forEach((t,i)=>{
      const col=i%3, row=Math.floor(i/3);
      const lx=col*(W/3), yy=ly+row*18;
      svg.append('rect').attr('x',lx).attr('y',yy-9).attr('width',10).attr('height',10).attr('fill',COL[t]);
      svg.append('text').attr('class','ac-sub').attr('x',lx+16).attr('y',yy).text(t);
    });
    stamp(svg,W,H);
  }

  function drawQuotes(){
    const box=clear('accQuoteChart'); if(!box) return;
    const st=ready(['accQuotes']);
    if(st!=='ok'){ if(st==='error') fail(box); return; }
    const quotes=dash.data('accQuotes').data.map(r=>({type:r.type,who:r.attribution,quote:r.quote}));
    const W=box.clientWidth||900, cols=W<700?1:2, gap=14, foot=26;
    const cw=(W-gap*(cols-1))/cols;
    const svg=svgOf(box,W,10);
    const inner=cw-36;
    const wrapped=quotes.map(q=>{
      const words=('“'+q.quote+'”').split(' ');
      const lines=[]; let line='';
      words.forEach(word=>{
        const test=line?line+' '+word:word;
        if(line&&measure(svg,test,'ac-quote')>inner){lines.push(line);line=word;}
        else line=test;
      });
      if(line) lines.push(line);
      return Object.assign({lines},q);
    });
    const rowCount=Math.ceil(wrapped.length/cols);
    const rowH=[];
    for(let r=0;r<rowCount;r++){
      let lines=1;
      for(let c=0;c<cols;c++){const q=wrapped[r*cols+c]; if(q) lines=Math.max(lines,q.lines.length);}
      rowH.push(58+lines*18);
    }
    const H=rowH.reduce((a,b)=>a+b,0)+gap*(rowCount-1)+foot;
    svg.attr('viewBox',`0 0 ${W} ${H}`).attr('height',H);
    wrapped.forEach((q,i)=>{
      const c=i%cols, r=Math.floor(i/cols);
      const x=c*(cw+gap);
      const y=rowH.slice(0,r).reduce((a,b)=>a+b,0)+r*gap;
      const h=rowH[r];
      svg.append('rect').attr('class','ac-card').attr('x',x).attr('y',y).attr('width',cw).attr('height',h).attr('rx',2);
      svg.append('rect').attr('x',x).attr('y',y).attr('width',4).attr('height',h).attr('fill',COL[q.type]||'#2a78d6');
      svg.append('text').attr('class','ac-kicker').attr('x',x+16).attr('y',y+20).text(q.type.toUpperCase());
      q.lines.forEach((line,li)=>{
        svg.append('text').attr('class','ac-quote').attr('x',x+16).attr('y',y+42+li*18).text(line);
      });
      svg.append('text').attr('class','ac-muted').attr('x',x+16).attr('y',y+h-14).text(q.who);
    });
    if(window.karimiMark) window.karimiMark(svg,W,H,'bottom');
  }

  function draw(){ drawRare(); drawWhere(); drawFamilies(); drawQuotes(); }
  dash.onData(draw);
})();
