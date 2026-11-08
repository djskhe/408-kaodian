var SLUGS=["ask", "calc", "cheat", "co", "code", "confuse", "ds", "fig", "link", "map", "model", "net", "num", "os", "paper", "pit", "plan", "quiz", "skill", "tpl"];

(function(){
  /* ---- 掌握度标记（存本机 localStorage） ---- */
  var KEY='k408done-v1', store={};
  try{ store=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ store={}; }
  function saveStore(){ try{ localStorage.setItem(KEY,JSON.stringify(store)); }catch(e){} }
  var progMap=[];
  document.querySelectorAll('.subject').forEach(function(sec){
    if(['ds','co','os','net'].indexOf(sec.id)<0) return;
    var total=0;
    sec.querySelectorAll('.chap').forEach(function(c,ci){
      c.querySelectorAll('.body > ul > li').forEach(function(li,ii){
        var id=sec.id+'-'+ci+'-'+ii; total++;
        if(store[id]) li.classList.add('done');
        var btn=document.createElement('button');
        btn.type='button'; btn.className='ck'; btn.textContent='\u2713';
        btn.setAttribute('aria-label','标记已掌握');
        btn.addEventListener('click',function(ev){
          ev.preventDefault(); ev.stopPropagation();
          var on=li.classList.toggle('done');
          if(on){ store[id]=1; } else { delete store[id]; }
          saveStore(); updateProg();
        });
        li.appendChild(btn);
      });
    });
    var chip=document.createElement('span');
    chip.className='prog'; chip.textContent='0/'+total;
    var head=sec.querySelector('.subhead');
    if(head) head.appendChild(chip);
    progMap.push({sec:sec, chip:chip, total:total});
  });
  function updateProg(){
    progMap.forEach(function(p){
      var d=p.sec.querySelectorAll('.body>ul>li.done').length;
      p.chip.textContent=d+'/'+p.total;
    });
  }
  updateProg();
  var unBtn=document.getElementById('unBtn');
  unBtn.addEventListener('click',function(){
    var on=document.body.classList.toggle('undoneonly');
    unBtn.classList.toggle('on',on);
    unBtn.textContent=on?'开':'关';
  });
  var resetBtn=document.getElementById('resetBtn');
  if(resetBtn) resetBtn.addEventListener('click',function(){
    if(!confirm('清除所有「已掌握」标记？')) return;
    store={}; saveStore();
    document.querySelectorAll('.body>ul>li.done').forEach(function(li){ li.classList.remove('done'); });
    updateProg();
  });

  /* ---- 题库 / 模拟卷 / 错题本 ---- */
  var WKEY='k408wrong-v1', wrongList=[];
  var SHUFKEY='k408shuf-v1';
  function shufOn(){ try{ return localStorage.getItem(SHUFKEY)!=='0'; }catch(e){ return true; } }
  function setShuf(v){ try{ localStorage.setItem(SHUFKEY, v?'1':'0'); }catch(e){} }
  /* 解析里若用字母指代选项（答 A / 选项 B / C 错），该题不能乱序，否则解析会指错 */
  var REFPAT=/答\s*[A-D][（、。；，]|选项\s*[A-D]|选\s*[A-D][（、。；，]|(^|[^A-Za-z0-9])[A-D]\s*[错对]|(^|[^A-Za-z0-9])[A-D]\s*项/;
  try{ wrongList=JSON.parse(localStorage.getItem(WKEY)||'[]')||[]; }catch(e){ wrongList=[]; }
  function saveWrong(){ try{ localStorage.setItem(WKEY,JSON.stringify(wrongList)); }catch(e){} }
  /* 模拟成绩记录 */
  var SKEY='k408score-v1', scoreHist=[];
  try{ scoreHist=JSON.parse(localStorage.getItem(SKEY)||'[]')||[]; }catch(e){ scoreHist=[]; }
  function bank(){
    var out=[];
    document.querySelectorAll('#quiz .qz, #paper .qz').forEach(function(q,i){
      var stem=q.querySelector('.stem'), opt=q.querySelector('.opt'), ans=q.querySelector('.ansbody');
      if(!stem||!opt||!ans) return;
      var txt=ans.textContent, m=txt.match(/答案\s*([A-D])/);
      if(!m) return;
      var h3=q.previousElementSibling;
      while(h3 && h3.tagName!=='H3'){ h3=h3.previousElementSibling; }
      var chEl=q.closest('.chap[data-set]')||q.closest('.chap'), set=chEl?(chEl.getAttribute('data-set')||''):'';
      var subTxt=chEl&&chEl.querySelector('summary')?chEl.querySelector('summary').textContent:'';
      var sub=(subTxt.match(/数据结构|组成原理|操作系统|网络/)||[''])[0];
      if(!sub && h3){ var m2=h3.textContent.match(/数据结构|组成原理|操作系统|网络/); if(m2) sub=m2[0]; }
      out.push({
        id:i, sub:sub, set:set,
        ch: h3?h3.textContent.trim():'',
        stem: stem.textContent.replace(/^\s*\d+[.、]\s*/,'').replace(/\s+/g,' ').trim(),
        opts: [].map.call(opt.querySelectorAll('span'),function(s){ return s.textContent.replace(/\s+/g,' ').trim(); }),
        ans: m[1].charCodeAt(0)-65, multi:/答案\s*[A-D][、,，和]/.test(txt),
        exp: txt.replace(/^\s*答案\s*[A-D]\s*[。.]?\s*/,'').replace(/^\s*解析\s*/,'').replace(/\s+/g,' ').trim(),
        nos: REFPAT.test(txt),
        fig: (function(){ var f=q.querySelector('.qfig'); return f?f.innerHTML:''; })()
      });
    });
    return out;
  }
  function compBank(){
    var out=[];
    document.querySelectorAll('#paper .comp').forEach(function(q,i){
      var stem=q.querySelector('.stem'), ans=q.querySelector('.ansbody');
      if(!stem) return;
      var chEl=q.closest('.chap[data-set]');
      out.push({ id:'c'+i, comp:true, sub:'综合', ans:-1, opts:[],
        set: chEl?chEl.getAttribute('data-set'):'',
        stem: stem.textContent.replace(/^\s*\d+[.、]\s*/,'').replace(/\s+/g,' ').trim(),
        exp: ans?ans.textContent.replace(/\s+/g,' ').trim():'',
        fig: (function(){ var f=q.querySelector('.qfig'); return f?f.innerHTML:''; })() });
    });
    return out;
  }
  var sheet=document.getElementById('sheet'), sheetBody=document.getElementById('sheetBody'),
      sheetTtl=document.getElementById('sheetTtl'), sheetTm=document.getElementById('sheetTm'),
      sheetSub=document.getElementById('sheetSub'), sheetClose=document.getElementById('sheetClose');
  var exam={qs:[], ans:{}, map:[], timer:null, running:false};
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), x=a[i]; a[i]=a[j]; a[j]=x; } return a; }
  function fmt(s){ var m=Math.floor(s/60), r=s%60; return (m<10?'0':'')+m+':'+(r<10?'0':'')+r; }
  function renderExam(){
    sheetBody.innerHTML='';
    exam.qs.forEach(function(q,i){
      var d=document.createElement('div'); d.className='qz'; d.id='eq'+i;
      var s=document.createElement('div'); s.className='stem';
      var no=document.createElement('span'); no.className='no'; no.textContent=(i+1)+'.';
      s.appendChild(no); s.appendChild(document.createTextNode(' '+q.stem+' '));
      if(q.ch && q.ch.indexOf('题')<0){ var ch=document.createElement('span'); ch.className='s'; ch.textContent='（'+q.ch+'）'; s.appendChild(ch); }
      d.appendChild(s);
      if(q.fig){ var fg=document.createElement('div'); fg.className='qfig'; fg.innerHTML=q.fig; d.appendChild(fg); }
      if(q.comp){
        var ta=document.createElement('textarea');
        ta.setAttribute('placeholder','在纸上作答，这里只写要点提纲');
        d.appendChild(ta);
        sheetBody.appendChild(d);
        return;
      }
      var order=exam.map[i]||[0,1,2,3];
      order.forEach(function(oi,k){
        var body=String(q.opts[oi]||'').replace(/^[A-D][.．、)）]\s*/,'');
        var b=document.createElement('button'); b.type='button'; b.className='op';
        b.textContent='ABCD'.charAt(k)+'. '+body;
        b.addEventListener('click',function(){
          exam.ans[i]=oi;
          [].forEach.call(d.querySelectorAll('.op'),function(x){ x.classList.remove('sel'); });
          b.classList.add('sel');
          sheetTtl.textContent='模拟套卷 '+Object.keys(exam.ans).length+'/'+exam.qs.length;
        });
        d.appendChild(b);
      });
      sheetBody.appendChild(d);
    });
  }
  function openSheet(){ sheet.classList.add('on'); sheet.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeSheet(){
    clearInterval(exam.timer); exam.running=false;
    sheet.classList.remove('on'); sheet.setAttribute('aria-hidden','true'); document.body.style.overflow='';
  }
  function startExam(list, minutes, title, mode){
    exam.qs=list.slice(); exam.ans={}; exam.running=true; exam.mode=mode||'exam';
    exam.title=title||'练习'; exam.self={}; exam.compMax=0; exam.objRight=0; exam.objTotal=0;
    var sh=shufOn();
    exam.map=exam.qs.map(function(q){
      var idx=[], n=(q.opts?q.opts.length:0);
      for(var k=0;k<n;k++) idx.push(k);
      if(sh && !q.comp && !q.multi && !q.nos && n===4) shuffle(idx);
      return idx;
    });
    sheetTtl.textContent=title+' 0/'+exam.qs.length;
    sheetTm.textContent=fmt(minutes*60);
    sheetSub.textContent='交卷'; sheetSub.classList.add('pri');
    renderExam(); openSheet();
    exam.left=Math.round(minutes*60); exam.auto=false;
    sheetTm.classList.remove('warn');
    clearInterval(exam.timer);
    exam.timer=setInterval(function(){
      exam.left--;
      sheetTm.textContent=fmt(Math.max(0,exam.left));
      sheetTm.classList.toggle('warn',exam.left<=300&&exam.left>0);
      if(exam.left<=0){ exam.auto=true; finishExam(); }
    },1000);
  }
  /* ---- 错题 -> 考点反查：按科目隔离 + 人工校正表 ---- */
  var KPMAP=null;
  var KPSUB={'数据结构':'ds','组成原理':'co','操作系统':'os','网络':'cn'};
  var KPOVR={
    '数据结构':{'KMP':'kp-ds-3-5','串':'kp-ds-3-5','栈':'kp-ds-3-1','队列':'kp-ds-3-2',
      '矩阵':'kp-ds-3-4','复杂度':'kp-ds-1-1','排序':'kp-ds-7-1','快速排序':'kp-ds-7-3',
      '快排':'kp-ds-7-3','堆排序':'kp-ds-7-4','归并':'kp-ds-7-5','折半':'kp-ds-6-1',
      '散列':'kp-ds-6-4','哈希':'kp-ds-6-4','B 树':'kp-ds-6-3','B+ 树':'kp-ds-6-3',
      '哈夫曼':'kp-ds-4-6','查找':'kp-ds-6-1','拓扑':'kp-ds-5-4','最小生成树':'kp-ds-5-4',
      'Dijkstra':'kp-ds-5-4','Floyd':'kp-ds-5-4','邻接':'kp-ds-5-2'},
    '组成原理':{'Cache':'kp-co-3-5','IEEE':'kp-co-2-3','补码':'kp-co-2-1','原码':'kp-co-2-1',
      '浮点':'kp-co-2-3','总线':'kp-co-6-1','中断':'kp-co-5-4','DMA':'kp-co-7-3',
      '磁盘':'kp-co-3-4','流水线':'kp-co-5-6','寻址':'kp-co-4-2','CISC':'kp-co-4-4',
      'RISC':'kp-co-4-4','MESI':'kp-co-5-7'},
    '操作系统':{'PV':'kp-os-2-3','信号量':'kp-os-2-3','死锁':'kp-os-2-4','银行家':'kp-os-2-4',
      '页面置换':'kp-os-3-2','LRU':'kp-os-3-2','OPT':'kp-os-3-2','FIFO':'kp-os-3-2',
      '页表':'kp-os-3-1','TLB':'kp-os-3-1','inode':'kp-os-4-1','FAT':'kp-os-4-3',
      '文件':'kp-os-4-1','进程':'kp-os-2-1','线程':'kp-os-2-1','调度':'kp-os-2-2',
      '磁盘':'kp-os-5-3'},
    '网络':{'TCP':'kp-cn-5-3','UDP':'kp-cn-5-2','拥塞':'kp-cn-5-3','滑动窗口':'kp-cn-3-3',
      '子网':'kp-cn-4-2','路由':'kp-cn-4-4','RIP':'kp-cn-4-4','OSPF':'kp-cn-4-4',
      '以太网':'kp-cn-3-5','CSMA':'kp-cn-3-4','HTTP':'kp-cn-6-5','DNS':'kp-cn-6-2',
      'FTP':'kp-cn-6-3','奈氏':'kp-cn-2-1','香农':'kp-cn-2-1','曼彻斯特':'kp-cn-2-1',
      '调制':'kp-cn-2-1','复用':'kp-cn-2-1','时延':'kp-cn-1-1','分层':'kp-cn-1-2'}
  };
  function buildKpMap(){
    KPMAP={};
    var bySub={}, NAME2KP={};
    /* 新版导图：知识点在 #map .mkp[data-kp] 上，正文全文取自该条目 */
    [].forEach.call(document.querySelectorAll('#map .mkp[data-kp]'),function(b){
      var id=b.getAttribute('data-kp');
      var name=b.textContent.replace(/^\s*\d+\.\d+\s*/,'').trim();
      var host=b.closest('li'), body='';
      if(host){
        body=host.textContent.replace(name,' ')+' ';
      } else {
        var h3=document.getElementById(id), n=h3?h3.nextElementSibling:null, c=0;
        while(n && n.tagName!=='H3' && c<12){ body+=n.textContent+' '; n=n.nextElementSibling; c++; }
      }
      var pre=id.split('-')[1];
      (bySub[pre]=bySub[pre]||[]).push({id:id,name:name,full:name+' '+body});
      NAME2KP[id]=name;
    });
    Object.keys(KPSUB).forEach(function(subj){
      var list=bySub[KPSUB[subj]]||[], ovr=KPOVR[subj]||{}, m={};
      TOPICS.forEach(function(term){
        if(ovr[term] && NAME2KP[ovr[term]]){ m[term]={id:ovr[term],name:NAME2KP[ovr[term]]}; return; }
        var best=null, bs=-1;
        list.forEach(function(k){
          var s=0;
          if(k.name.indexOf(term)>=0) s=100+term.length;
          s+=k.full.split(term).length-1;
          if(s>bs){ bs=s; best=k; }
        });
        if(best && bs>0) m[term]={id:best.id,name:best.name};
      });
      KPMAP[subj]=m;
    });
  }
  function kpOf(q){
    if(!KPMAP) buildKpMap();
    var m=KPMAP[q.sub||''];
    if(!m) return null;
    return m[topicOf(q)]||null;
  }
  function gotoKp(id){
    closeSheet(); go('map');
    setTimeout(function(){
      var chip=document.querySelector('#map .mkp[data-kp="'+id+'"]');
      if(!chip) return;
      var det=chip.closest('details.chap'); if(det) det.open=true;
      var li=chip.closest('li');
      if(li){
        var sub=li.querySelector('ul.msub'), mt=li.querySelector('details.mdet');
        if(sub) sub.classList.add('kpopen');
        if(mt) mt.open=true;
      }
      try{ chip.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){}
      var host=chip.closest('li')||chip;
      host.classList.add('flash');
      setTimeout(function(){ host.classList.remove('flash'); },1800);
    },240);
  }
  function updateScoreSum(){
    var el=document.getElementById('scoreSum'); if(!el) return;
    var cs=0,k; for(k in exam.self) cs+=exam.self[k];
    var om=(exam.objTotal||0)*2, os=(exam.objRight||0)*2, cm=exam.compMax||0;
    el.innerHTML='<b>本次估分 '+(os+cs)+' / '+(om+cm)+' 分</b><br>选择题 '+os+'/'+om+
      '　+　综合题自评 '+cs+'/'+cm+
      '<br><span style="color:var(--tx2);font-size:12.5px">综合题按你点的分数累加，没点的按 0 分；逐题打完分再点下面的保存。</span>';
  }
  function saveScore(){
    var cs=0,k; for(k in exam.self) cs+=exam.self[k];
    var rec={t:Date.now(), name:exam.title||'练习',
      os:(exam.objRight||0)*2, om:(exam.objTotal||0)*2, cs:cs, cm:exam.compMax||0,
      tot:(exam.objRight||0)*2+cs, max:(exam.objTotal||0)*2+(exam.compMax||0)};
    scoreHist.push(rec); if(scoreHist.length>80) scoreHist=scoreHist.slice(-80);
    try{ localStorage.setItem(SKEY,JSON.stringify(scoreHist)); }catch(e){}
    renderScores();
  }
  function renderScores(){
    var box=document.getElementById('scoreBox'); if(!box) return;
    if(!scoreHist.length){
      box.innerHTML='<div class="tip">还没有记录。做完一套 40 选择 + 7 综合的整卷，交卷后逐题给综合题打分，再点「保存本次成绩」，这里就会累积出你的成绩曲线。</div>';
      return;
    }
    var h=scoreHist.slice(-12), sum=0;
    h.forEach(function(r){ sum+=r.tot; });
    var avg=Math.round(sum/h.length);
    var line=h.map(function(r){ return '<span class="stot">'+r.tot+'</span>'; }).join(' → ');
    var mx=Math.max.apply(null,h.map(function(r){return r.tot;}));
    var mn=Math.min.apply(null,h.map(function(r){return r.tot;}));
    var judge = avg>=130?'按这个势头，顶尖院校可以冲。'
      : avg>=115?'稳过 211 线，离 985 线还差一点。'
      : avg>=100?'过线没问题，但离 211 稳录还有距离。'
      : avg>=85?'刚过国家线边缘，综合题和 41/44 两道大题要重点补。'
      : '还在打基础，先把主干六套押题卷刷完再来估分。';
    var htm='<div class="tip"><b>近 '+h.length+' 次：</b>'+line+
      '<br><b>平均 '+avg+' / 150 分</b>'+(h.length>1?'　最高 '+mx+'　最低 '+mn:'')+
      '<br><span style="color:var(--tx2)">'+judge+'</span></div><div>';
    h.slice().reverse().forEach(function(r){
      var d=new Date(r.t);
      var ds=(d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
      htm+='<div class="srow"><span><b class="stot">'+r.tot+'/'+r.max+'</b> <span class="sname">'+
           (r.name||'练习')+'</span></span><span class="sname">选择 '+r.os+'/'+r.om+
           '　综合 '+r.cs+'/'+r.cm+'　'+ds+'</span></div>';
    });
    box.innerHTML=htm+'</div>';
  }

  function finishExam(){
    clearInterval(exam.timer); exam.running=false;
    var right=0, added=0, objTotal=0;
    exam.qs.forEach(function(q,i){
      var card=document.getElementById('eq'+i), pick=exam.ans[i];
      if(q.comp){
        var rb=document.createElement('details'); rb.className='ans comp-ref';
        var rs=document.createElement('summary'); rs.textContent='查看参考答案与给分点';
        var ra=document.createElement('div'); ra.className='ansbody';
        ra.textContent=q.exp||'';
        rb.appendChild(rs); rb.appendChild(ra);
        card.appendChild(rb);
        var mm=(q.stem||'').match(/（\s*(\d+)\s*分\s*）/);
        var mx=mm?parseInt(mm[1],10):10;
        exam.compMax=(exam.compMax||0)+mx; exam.self[i]=0;
        var sr=document.createElement('div'); sr.className='scoreRow';
        var lb=document.createElement('div'); lb.className='slab';
        lb.textContent='对照上面的给分点自评：这道题你拿几分？（满分 '+mx+' 分，点数字即可）';
        sr.appendChild(lb);
        var bs=document.createElement('div'); bs.className='sbtns';
        for(var si=0;si<=mx;si++){
          (function(val){
            var sb3=document.createElement('button'); sb3.type='button';
            sb3.className='sb'+(val===0?' on':''); sb3.textContent=val;
            sb3.addEventListener('click',function(){
              exam.self[i]=val;
              [].forEach.call(bs.querySelectorAll('.sb'),function(x){ x.classList.toggle('on',x===sb3); });
              updateScoreSum();
            });
            bs.appendChild(sb3);
          })(si);
        }
        sr.appendChild(bs); card.appendChild(sr);
        return;
      }
      objTotal++;
      var ord=exam.map[i]||[0,1,2,3];
      [].forEach.call(card.querySelectorAll('.op'),function(b,k){
        var oi=ord[k];
        b.classList.remove('sel');
        if(oi===q.ans){ b.classList.add('ok'); } else if(oi===pick){ b.classList.add('no'); }
      });
      if(pick===q.ans){
        right++;
        if(exam.mode==='redo'){
          wrongList=wrongList.filter(function(w){ return w.stem!==q.stem; });
        }
      } else {
        if(!wrongList.some(function(w){ return w.stem===q.stem; })){ wrongList.push(q); added++; }
      }
      var ex=document.createElement('div'); ex.className='explain';
      ex.textContent='正确答案 '+String.fromCharCode(65+Math.max(0,(exam.map[i]||[0,1,2,3]).indexOf(q.ans)))+'　'+q.exp;
      card.appendChild(ex);
      card.classList.add(pick===q.ans?'done':'wrong');
    });
    saveWrong(); refreshWrongBtn();
    var compN=exam.qs.filter(function(q){ return q.comp; }).length;
    var r=document.createElement('div'); r.className='result';
    var pct=Math.round(right*100/Math.max(1,objTotal));
    var bySub={};
    exam.qs.forEach(function(q,i){
      if(q.comp) return;
      var k=q.sub||'其他';
      bySub[k]=bySub[k]||{r:0,t:0};
      bySub[k].t++;
      if(exam.ans[i]===q.ans) bySub[k].r++;
    });
    var subLine=Object.keys(bySub).map(function(k){
      return k+' '+bySub[k].r+'/'+bySub[k].t;
    }).join('　');
    var bigTxt = compN ? (right+' / '+objTotal+'　选择题') : (right+' / '+objTotal);
    var scoreTxt = compN
      ? '选择题折算：'+(right*2)+' / '+(objTotal*2)+' 分　|　综合题 '+compN+' 道（70 分）参考答案已折叠，逐题展开后自评'
      : '每题 2 分制折算：'+(right*2)+' / '+(objTotal*2)+' 分';
    r.innerHTML='<div class="big">'+bigTxt+'</div><div class="sm">正确率 '+pct+'%'+
      (exam.auto?'　⏰ 时间到，已自动交卷':'')+
      (added?'　新收错题 '+added+' 道':'　错题已在错题本中')+'<br>'+scoreTxt+
      (subLine?'<br><b>分科：</b>'+subLine:'')+'</div>';
    exam.objRight=right; exam.objTotal=objTotal;
    if(compN){
      var sbx=document.createElement('div'); sbx.className='scoreSum'; sbx.id='scoreSum';
      r.appendChild(sbx);
      var saveB=document.createElement('button'); saveB.type='button'; saveB.className='rbtn';
      saveB.textContent='保存本次成绩到成绩记录';
      saveB.addEventListener('click',function(){
        saveScore(); saveB.disabled=true; saveB.textContent='已保存 ✓ 去「我的数据」看曲线';
      });
      r.appendChild(saveB);
      setTimeout(updateScoreSum,0);
    }
    if(added){
      var rb=document.createElement('button'); rb.type='button'; rb.className='rbtn';
      rb.textContent='看这 '+added+' 道错题的同类题';
      rb.addEventListener('click',function(){ openWrong(); });
      r.appendChild(rb);
    }
    sheetBody.insertBefore(r, sheetBody.firstChild);
    sheetSub.textContent='完成'; sheetSub.classList.remove('pri');
    sheetTm.textContent='已交卷'; sheetBody.scrollTop=0;
  }
  var TOPICS=['Cache','KMP','PV','信号量','死锁','页面置换','LRU','OPT','FIFO','Dijkstra','Floyd','哈夫曼',
   'B+ 树','B 树','散列','哈希','快速排序','快排','堆排序','归并','折半','流水线','IEEE','补码','原码','浮点',
   '总线','中断','DMA','磁盘','TCP','UDP','拥塞','滑动窗口','子网','路由','RIP','OSPF','以太网','CSMA',
   'HTTP','DNS','FTP','进程','线程','调度','银行家','页表','TLB','inode','FAT','文件','排序','查找','拓扑',
   '最小生成树','邻接','栈','队列','串','矩阵','复杂度','MESI','寻址','CISC','RISC','海明','CRC','奈氏',
   '香农','曼彻斯特','调制','复用','时延','分层'];
  function topicOf(q){
    var s=(q.stem||'')+' '+(q.exp||''), best='', bc=0;
    for(var i=0;i<TOPICS.length;i++){
      var k=TOPICS[i], c=s.split(k).length-1;
      if(c>bc){ bc=c; best=k; }
    }
    return best||(q.sub||'其它');
  }
  function recommendFor(q,n,all){
    var t=topicOf(q), out=[];
    for(var i=0;i<all.length && out.length<(n||2);i++){
      var x=all[i];
      if(x.stem===q.stem) continue;
      if(topicOf(x)!==t) continue;
      if(wrongList.some(function(w){ return w.stem===x.stem; })) continue;
      if(out.some(function(o){ return o.stem===x.stem; })) continue;
      out.push(x);
    }
    return out;
  }
  function openWrong(){
    clearInterval(exam.timer); exam.qs=[]; exam.ans={}; exam.running=false;
    sheetTtl.textContent='错题本 '+wrongList.length+' 题';
    sheetTm.textContent='';
    sheetSub.textContent= wrongList.length?'重做错题':'关闭';
    sheetSub.classList.toggle('pri', wrongList.length>0);
    sheetBody.innerHTML='';
    /* ---- 按考点聚合，定位薄弱点 ---- */
    if(wrongList.length){
      var agg={}, order=[];
      wrongList.forEach(function(q){
        var kp=kpOf(q), key=kp?kp.id:('#other-'+topicOf(q));
        if(!agg[key]){ agg[key]={kp:kp, topic:topicOf(q), n:0, qs:[]}; order.push(key); }
        agg[key].n++; agg[key].qs.push(q);
      });
      order.sort(function(a,b){ return agg[b].n-agg[a].n; });
      var box=document.createElement('div'); box.className='kpagg';
      var hd=document.createElement('div'); hd.className='kagh';
      hd.innerHTML='<b>错题集中在这些考点</b>　共 '+order.length+' 个考点';
      box.appendChild(hd);
      order.forEach(function(k){
        var a=agg[k];
        var chip=document.createElement('button'); chip.type='button'; chip.className='kag';
        var bar=Math.min(100, Math.round(a.n/Math.max(1,wrongList.length*0.6)*100));
        chip.innerHTML='<span class="kagn">'+a.n+'</span><span class="kagt">'
          +(a.kp?a.kp.name:a.topic)+'</span><span class="kagb" style="width:'+bar+'%"></span>';
        chip.addEventListener('click',function(){
          if(a.kp){ gotoKp(a.kp.id); }
          else { closeSheet(); go('map'); }
        });
        box.appendChild(chip);
      });
      var tip=document.createElement('div'); tip.className='kagtip';
      tip.textContent='点考点可直接跳到导图对应位置复习；错得越多的考点排在越前。';
      box.appendChild(tip);
      sheetBody.appendChild(box);
      var sp=document.createElement('div'); sp.className='kagsep'; sp.textContent='逐题查看';
      sheetBody.appendChild(sp);
    }
    if(!wrongList.length){
      var p=document.createElement('div'); p.className='result';
      p.innerHTML='<div class="sm">还没有错题。<br>点顶部「模拟卷」做一套 40 题，答错的会自动收进这里。</div>';
      sheetBody.appendChild(p);
    } else {
      var allQ=bank();
      wrongList.forEach(function(q,i){
        var d=document.createElement('div'); d.className='qz';
        var s=document.createElement('div'); s.className='stem';
        var no=document.createElement('span'); no.className='no'; no.textContent=(i+1)+'.';
        s.appendChild(no); s.appendChild(document.createTextNode(' '+q.stem));
        d.appendChild(s);
        if(q.fig){ var fg2=document.createElement('div'); fg2.className='qfig'; fg2.innerHTML=q.fig; d.appendChild(fg2); }
        q.opts.forEach(function(o){
          var b=document.createElement('button'); b.type='button'; b.className='op'; b.textContent=o;
          if(o===q.opts[q.ans]){ b.classList.add('ok'); }
          d.appendChild(b);
        });
        var ex=document.createElement('div'); ex.className='explain';
        ex.textContent='正确答案 '+String.fromCharCode(65+q.ans)+'　'+q.exp;
        d.appendChild(ex);
        var kp=kpOf(q);
        if(kp){
          var kl=document.createElement('button'); kl.type='button'; kl.className='kplink';
          kl.setAttribute('data-kp',kp.id); kl.setAttribute('data-sub',q.sub||'');
          kl.textContent='→ 相关考点：'+kp.name;
          kl.addEventListener('click',function(){ gotoKp(kp.id); });
          d.appendChild(kl);
        }
        var recs=recommendFor(q,2,allQ);
        if(recs.length){
          var rd=document.createElement('div'); rd.className='rec';
          var lb=document.createElement('div'); lb.className='rlab';
          lb.textContent='同类题 · '+topicOf(q); rd.appendChild(lb);
          recs.forEach(function(r){
            var pp=document.createElement('div'); pp.className='rt';
            pp.textContent='· '+r.stem.slice(0,44)+(r.stem.length>44?'…':'');
            rd.appendChild(pp);
          });
          var bt=document.createElement('button'); bt.type='button'; bt.className='rbtn';
          bt.textContent='做这 '+recs.length+' 道同类题（5 分钟）';
          bt.addEventListener('click',function(){ startExam(recs,5,'同类题专练','exam'); });
          rd.appendChild(bt); d.appendChild(rd);
        }
        sheetBody.appendChild(d);
      });
    }
    openSheet();
  }
  function refreshWrongBtn(){
    document.getElementById('wrongBtn').textContent='错题本 '+wrongList.length;
    var wv=document.getElementById('wrongV'); if(wv){ wv.textContent=wrongList.length+' 题'; }
  }
  sheetSub.addEventListener('click',function(){
    if(exam.running){
      var un=exam.qs.length-Object.keys(exam.ans).length;
      if(un>0 && !confirm('还有 '+un+' 题未作答，未答的会记入错题本。确定交卷？')) return;
      finishExam(); return;
    }
    if(wrongList.length && sheetTtl.textContent.indexOf('错题本')===0){
      startExam(wrongList.slice(), Math.max(10, wrongList.length*2), '错题重做', 'redo'); return;
    }
    closeSheet();
  });
  sheetClose.addEventListener('click',closeSheet);
  document.getElementById('examBtn').addEventListener('click',function(){
    var b=bank();
    if(b.length<10){ alert('题库未加载完成，请稍后重试'); return; }
    startExam(shuffle(b.slice()).slice(0,Math.min(40,b.length)), 80, '模拟套卷');
  });
  document.getElementById('wrongBtn').addEventListener('click',openWrong);
  refreshWrongBtn();


  /* 章节目录胶囊 */
  [].forEach.call(document.querySelectorAll('.subject'),function(sec){
    var chaps=sec.querySelectorAll('.chap');
    if(!chaps.length) return;
    var toc=document.createElement('div'); toc.className='toc';
    [].forEach.call(chaps,function(c,i){
      c.id=sec.id+'-c'+(i+1);
      var s=c.querySelector('summary'), clone=s.cloneNode(true);
      [].forEach.call(clone.querySelectorAll('.num,.cnt,.arw,.lv'),function(n){ n.remove(); });
      var title=clone.textContent.replace(/\s+/g,'').trim();
      var b=document.createElement('button');
      b.className='chip'; b.textContent=(i+1)+'. '+title;
      b.addEventListener('click',function(){ c.open=true; c.scrollIntoView({behavior:'smooth',block:'start'}); });
      toc.appendChild(b);
    });
    var head=sec.querySelector('.subhead');
    if(head) head.insertAdjacentElement('afterend',toc);
  });
  /* ===== 手机版路由 ===== */
  var SEC=[['plan','冲刺计划','learn'],['map','思维导图','learn'],['ds','数据结构','learn'],
    ['co','计算机组成原理','learn'],['os','操作系统','learn'],['net','计算机网络','learn'],
    ['link','跨科串联','learn'],['quiz','选择题库','drill'],['paper','模拟套卷','drill'],['tpl','大题答题模板','drill'],
    ['model','满分范文','drill'],['calc','计算专项','drill'],['skill','解题技巧','ref'],
    ['ask','考法速查','ref'],['fig','图解','ref'],['num','数字大全','ref'],
    ['confuse','易混辨析','ref'],['code','算法代码库','ref'],['cheat','公式速查卡','ref'],
    ['pit','避坑清单','ref']];
  var TT={home:'408 考点精讲',learn:'学 · 考点',drill:'练 · 做题',ref:'查 · 速查',me:'我的进度',search:'搜索结果',review:'今日复习',examset:'模拟套卷',data:'我的数据 · 分享'};
  var secEl={},metaC={},groupOf={data:'home'};
  SEC.forEach(function(s){
    var el=document.getElementById(s[0]);
    if(el){ el.classList.add('page'); secEl[s[0]]=el; TT[s[0]]=s[1]; groupOf[s[0]]=s[2]; }
  });
  function metaOf(id){
    if(metaC[id]) return metaC[id];
    var el=secEl[id]; if(!el) return (metaC[id]='');
    var qz=el.querySelectorAll('.qz').length, fg=el.querySelectorAll('svg.dg').length,
        cd=el.querySelectorAll('pre.code').length, ch=el.querySelectorAll('.chap').length,
        li=el.querySelectorAll('.body>ul>li').length, t;
    if(qz) t=qz+' 道题 · 带解析';
    else if(fg) t=fg+' 张矢量图';
    else if(cd) t=cd+' 张手写代码';
    else if(li) t=ch+' 章 · '+li+' 条';
    else t=ch+' 节';
    return metaC[id]=t;
  }
  function accentOf(id){
    var el=secEl[id], v=el?getComputedStyle(el).getPropertyValue('--accent'):'';
    return (v&&v.trim())||'#2f6df6';
  }
  /* 拆页版：首页与导航为静态链接，无需动态渲染 */
/* 路由 */
  var curV='home', lastV='home', tabbar=document.getElementById('tabbar'),
      pageTitle=document.getElementById('pageTitle'), backBtn=document.getElementById('backBtn');
  function go(v,noPush){
    if(!v) v='home';
    if(!document.getElementById(v)){
      if(SLUGS.indexOf(v)>=0){ location.href=v+'.html'; return; }
      v='home';
    }
    if(v!=='search' && v!==curV) lastV=curV;
    [].forEach.call(document.querySelectorAll('.page'),function(p){ p.classList.toggle('on',p.id===v); });
    if(pageTitle) pageTitle.textContent=TT[v]||'408 考点精讲';
    if(backBtn) backBtn.hidden=(['home','learn','drill','ref','me'].indexOf(v)>=0);
    if(tabbar) [].forEach.call(tabbar.querySelectorAll('button'),function(b){
      var on=(b.dataset.v===v)||(groupOf[v]===b.dataset.v);
      b.classList.toggle('on',on);
    });
    curV=v;
    if(v==='data') renderScores();
    window.scrollTo(0,0);
    if(!noPush){ try{ history.pushState({v:v},'','#'+v); }catch(e){ location.hash=v; } }
    if(v==='me') renderMe();
    if(v==='home'){ renderHero(); renderRevBox(); renderToday(); }
    if(v==='review') renderReview();
    if(v==='examset') renderExamSets();
    closeMenu();
  }
  if(tabbar) tabbar.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return; go(b.dataset.v);
  });
  if(backBtn) backBtn.addEventListener('click',function(){ go(groupOf[curV]||'home'); });
  window.addEventListener('popstate',function(e){
    var v=(e.state&&e.state.v)||'home'; go(v,true);
  });
  /* 首页进度 */
  function renderHero(){
    var tot=0,done=0;
    ['ds','co','os','net'].forEach(function(id){
      var el=secEl[id]; if(!el) return;
      tot+=el.querySelectorAll('.body>ul>li').length;
      done+=el.querySelectorAll('.body>ul>li.done').length;
    });
    var pct=tot?Math.round(done*100/tot):0;
    var hb=document.getElementById('heroBar'); if(hb) hb.style.width=pct+'%';
    var ht=document.getElementById('heroT'); if(ht) ht.textContent=done?('已掌握 '+done+' / '+tot+' 条考点'):'开始今天的复习';
    var hs=document.getElementById('heroS'); if(hs) hs.textContent=done?('进度 '+pct+'%　继续点开考点，右侧圆圈打勾即可记录')
      :'四个科目 27 章，按「学 → 练 → 查」顺序过一遍；考点右侧圆圈点一下即标记已掌握';
  }
  function renderMe(){
    if(!document.getElementById('meRows')) return;
    var box=document.getElementById('meRows'); box.innerHTML='';
    [['ds','数据结构'],['co','组成原理'],['os','操作系统'],['net','计算机网络']].forEach(function(p){
      var el=secEl[p[0]]; if(!el) return;
      var tot=el.querySelectorAll('.body>ul>li').length,
          done=el.querySelectorAll('.body>ul>li.done').length, pct=tot?Math.round(done*100/tot):0;
      var d=document.createElement('div'); d.className='mrow';
      var nm=document.createElement('span'); nm.className='nm'; nm.textContent=p[1];
      var pb=document.createElement('div'); pb.className='pb';
      var i=document.createElement('i'); i.style.width=pct+'%'; pb.appendChild(i);
      var pc=document.createElement('span'); pc.className='pc'; pc.textContent=done+'/'+tot;
      d.appendChild(nm); d.appendChild(pb); d.appendChild(pc);
      box.appendChild(d);
    });
    renderWrongStat();
  }
  /* 搜索（全局） */
  var IDX=null;
  function buildIdx(){
    IDX=[];
    SEC.forEach(function(s){
      var el=secEl[s[0]]; if(!el) return;
      [].forEach.call(el.querySelectorAll('.chap'),function(c,ci){
        var sm=c.querySelector('summary');
        var ct=sm?sm.textContent.replace(/\s+/g,' ').trim():'';
        [].forEach.call(c.querySelectorAll('.body>ul>li, ul.mpoint>li, .qz, .fig, pre.code, .body>table'),function(it,ii){
          var tx=it.textContent.replace(/\s+/g,' ').trim();
          if(tx.length>1) IDX.push({s:s[0],st:s[1],c:ci,ct:ct,i:ii,t:tx.toLowerCase(),raw:tx});
        });
      });
    });
  }
  var qEl=document.getElementById('q');
  qEl.addEventListener('input',function(){
    var v=qEl.value.trim();
    if(!v){ if(curV==='search') go(lastV||'home'); return; }
    if(!IDX) buildIdx();
    var lv=v.toLowerCase(), rows=document.getElementById('searchRows'), n=0;
    rows.innerHTML='';
    IDX.forEach(function(it){
      if(n>=60) return;
      var p=it.t.indexOf(lv); if(p<0) return;
      n++;
      var b=document.createElement('button'); b.type='button'; b.className='res';
      b.style.setProperty('--accent',accentOf(it.s));
      var src=document.createElement('div'); src.className='src'; src.textContent=it.st+' · '+it.ct;
      var tx=document.createElement('div'); tx.className='tx';
      var s0=Math.max(0,p-28), frag=it.raw.substr(s0,110);
      tx.appendChild(document.createTextNode((s0>0?'…':'')+frag.slice(0,p-s0)));
      var mk=document.createElement('mark'); mk.textContent=frag.substr(p-s0,v.length);
      tx.appendChild(mk);
      tx.appendChild(document.createTextNode(frag.slice(p-s0+v.length)+(it.raw.length>s0+110?'…':'')));
      b.appendChild(src); b.appendChild(tx);
      b.addEventListener('click',function(){ jumpTo(it); });
      rows.appendChild(b);
    });
    if(!n){
      var d=document.createElement('div'); d.className='res';
      var t=document.createElement('div'); t.className='tx';
      t.textContent='没找到「'+v+'」。换个词试试：页表、CSMA、KMP、银行家、补码';
      d.appendChild(t); rows.appendChild(d);
    }
    go('search');
  });
  function jumpTo(it){
    go(it.s);
    var el=secEl[it.s], chaps=el.querySelectorAll('.chap'), c=chaps[it.c];
    if(!c) return;
    c.open=true;
    var items=c.querySelectorAll('.body>ul>li, ul.mpoint>li, .qz, .fig, pre.code, .body>table');
    var tgt=items[it.i];
    if(tgt){
      setTimeout(function(){
        tgt.scrollIntoView({block:'center',behavior:'smooth'});
        tgt.classList.add('flash');
        setTimeout(function(){ tgt.classList.remove('flash'); },1600);
      },60);
    }
  }
  /* 菜单 */
  var menu=document.getElementById('menu');
  function openMenu(){ menu.classList.add('on'); }
  function closeMenu(){ menu.classList.remove('on'); }
  document.getElementById('menuBtn').addEventListener('click',openMenu);
  menu.querySelector('.mask').addEventListener('click',closeMenu);
  var hotBtn=document.getElementById('hotBtn');
  hotBtn.addEventListener('click',function(){
    var on=document.body.classList.toggle('hotonly');
    hotBtn.classList.toggle('on',on); hotBtn.textContent=on?'开':'关';
  });
  var expRow=document.getElementById('expRow'), expV=document.getElementById('expV'), expOpen=false;
  expRow.addEventListener('click',function(){
    var el=secEl[curV]||document;
    expOpen=!expOpen;
    [].forEach.call(el.querySelectorAll('.chap'),function(c){ c.open=expOpen; });
    expV.textContent=expOpen?'收起':'展开';
  });
  document.getElementById('examRow').addEventListener('click',function(){ closeMenu(); go('examset'); });
  document.getElementById('wrongRow').addEventListener('click',function(){ closeMenu(); document.getElementById('wrongBtn').click(); });
  var _pr=document.getElementById('planRow');
  if(_pr) _pr.addEventListener('click',function(){ closeMenu(); plan={start:todayStr(),done:{}}; savePlan(); renderToday(); });
  var _rr=document.getElementById('resetRow');
  if(_rr) _rr.addEventListener('click',function(){ closeMenu(); var r=document.getElementById('resetBtn'); if(r) r.click(); });
  var _examBtn2=document.getElementById('examBtn2');
  if(_examBtn2) _examBtn2.addEventListener('click',function(){ go('examset'); });
  var _wrongBtn2=document.getElementById('wrongBtn2');
  if(_wrongBtn2) _wrongBtn2.addEventListener('click',function(){ document.getElementById('wrongBtn').click(); });
  var _examBtn3=document.getElementById('examBtn3');
  if(_examBtn3) _examBtn3.addEventListener('click',function(){ go('examset'); });
  var _wrongBtn3=document.getElementById('wrongBtn3');
  if(_wrongBtn3) _wrongBtn3.addEventListener('click',function(){ document.getElementById('wrongBtn').click(); });
  var _resetBtn2=document.getElementById('resetBtn2');
  if(_resetBtn2) _resetBtn2.addEventListener('click',function(){ var r=document.getElementById('resetBtn'); if(r) r.click(); });
  /* 字号 */
  var FSKEY='k408fs-v1';
  function applyFs(v){
    document.body.style.zoom=v;
    [].forEach.call(document.querySelectorAll('#fsBox button, #segFs button'),function(b){
      b.classList.toggle('on', b.dataset.fs===v);
    });
    try{ localStorage.setItem(FSKEY,v); }catch(e){}
  }
  [].forEach.call(document.querySelectorAll('#fsBox button, #segFs button'),function(b){
    b.addEventListener('click',function(){ applyFs(b.dataset.fs); });
  });
  var sf='1'; try{ sf=localStorage.getItem(FSKEY)||'1'; }catch(e){}
  applyFs(sf);
  /* ===== 导图自测模式 ===== */
  var QZKEY='k408selfquiz-v1', selfQuiz=false;
  try{ selfQuiz=localStorage.getItem(QZKEY)==='1'; }catch(e){}
  function applySelfQuiz(on){
    selfQuiz=!!on;
    document.body.classList.toggle('selfquiz', selfQuiz);
    try{ localStorage.setItem(QZKEY, selfQuiz?'1':'0'); }catch(e){}
    [].forEach.call(document.querySelectorAll('#quizBtn'),function(b){
      b.setAttribute('aria-pressed', selfQuiz?'true':'false');
      b.textContent = selfQuiz? '自测中' : '自测模式';
    });
    var tg=document.getElementById('quizToggle'); if(tg) tg.classList.toggle('on', selfQuiz);
  }
  (function(){
    var mapSec=document.getElementById('map'); if(!mapSec) return;
    var bar=document.createElement('div'); bar.id='quizToggle';
    var t1=document.createElement('button'); t1.type='button'; t1.id='quizBtn';
    t1.className='qtbtn';
    var t2=document.createElement('button'); t2.type='button';
    t2.className='qtbtn ghost'; t2.textContent='全部显示';
    bar.appendChild(t1); bar.appendChild(t2);
    var first=mapSec.querySelector('.subhead')||mapSec.querySelector('.gtitle')||mapSec.firstElementChild;
    if(first && first.parentNode) first.parentNode.insertBefore(bar, first.nextSibling);
    t1.addEventListener('click',function(){ applySelfQuiz(!selfQuiz); });
    t2.addEventListener('click',function(){
      [].forEach.call(mapSec.querySelectorAll('ul.msub li, details.mdet p, .mfig'),function(e){
        e.classList.add('rev');
      });
    });
    mapSec.addEventListener('click',function(ev){
      if(!selfQuiz) return;
      var el=ev.target.closest('ul.msub li, details.mdet p, .mfig');
      if(el && !el.classList.contains('rev')){ el.classList.add('rev'); }
    });
    applySelfQuiz(selfQuiz);
  })();


  /* 落地页按钮 */
  [].forEach.call(document.querySelectorAll('.landb[data-go]'), function(b){
    b.addEventListener('click', function(){ go(b.dataset.go); });
  });
  [].forEach.call(document.querySelectorAll('.bigbtn[data-go]'), function(b){
    b.addEventListener('click', function(){ go(b.dataset.go); });
  });

  /* 主题：auto / light / dark，存本机 */
  var THEMEKEY='k408theme-v1';
  function applyTheme(v){
    var root=document.documentElement;
    if(v==='light'||v==='dark'){ root.setAttribute('data-theme',v); }
    else { root.removeAttribute('data-theme'); }
    [].forEach.call(document.querySelectorAll('#segTheme button'),function(b){
      b.classList.toggle('on', b.dataset.theme===v);
    });
    try{ localStorage.setItem(THEMEKEY,v); }catch(e){}
    var mt=document.querySelector('meta[name="theme-color"]');
    if(mt){
      var dark=(v==='dark')||(v==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
      mt.setAttribute('content', dark?'#12151a':'#f4f6f9');
    }
  }
  [].forEach.call(document.querySelectorAll('#segTheme button'),function(b){
    b.addEventListener('click',function(){ applyTheme(b.dataset.theme); });
  });
  var st='auto'; try{ st=localStorage.getItem(THEMEKEY)||'auto'; }catch(e){}
  applyTheme(st);

  /* ===== 遗忘曲线复习队列 ===== */
  var DUEKEY='k408due-v1', due={}, IV=[1,3,7,15];
  try{ due=JSON.parse(localStorage.getItem(DUEKEY)||'{}')||{}; }catch(e){ due={}; }
  function saveDue(){ try{ localStorage.setItem(DUEKEY,JSON.stringify(due)); }catch(e){} }
  function idOf(li){
    var sec=li.closest('.subject'), chap=li.closest('.chap');
    if(!sec||!chap) return null;
    var ci=[].indexOf.call(sec.querySelectorAll('.chap'),chap);
    var ii=[].indexOf.call(chap.querySelectorAll('.body>ul>li'),li);
    if(ci<0||ii<0) return null;
    return sec.id+'-'+ci+'-'+ii;
  }
  function liOf(id){
    var p=String(id).split('-'); if(p.length!==3) return null;
    var sec=document.getElementById(p[0]); if(!sec) return null;
    var chap=sec.querySelectorAll('.chap')[+p[1]]; if(!chap) return null;
    return chap.querySelectorAll('.body>ul>li')[+p[2]]||null;
  }
  function dueList(){
    var now=Date.now(), out=[];
    Object.keys(due).forEach(function(id){
      var d=due[id]; if(!d||typeof d.r!=='number'||d.r>=IV.length) return;
      var next=d.t+IV[d.r]*864e5;
      if(now>=next) out.push({id:id,r:d.r,over:Math.floor((now-next)/864e5)});
    });
    out.sort(function(a,b){ return b.over-a.over; });
    return out;
  }
  function trackDue(li){
    var id=idOf(li); if(!id) return;
    if(li.classList.contains('done')){ due[id]={t:Date.now(),r:0}; }
    else { delete due[id]; }
    saveDue(); renderRevBox();
  }
  function renderRevBox(){
    var box=document.getElementById('revBox'); if(!box) return;
    box.innerHTML='';
    var dl=dueList(), tot=Object.keys(due).length;
    var b=document.createElement('button'); b.type='button'; b.className='revcard';
    if(!tot){
      b.disabled=true;
      b.textContent='打勾后自动排复习：第 1、3、7、15 天提醒你回看';
    } else if(!dl.length){
      b.disabled=true;
      b.textContent='今日无待复习 · 队列里还有 '+tot+' 条考点在按 1/3/7/15 天循环';
    } else {
      b.textContent='今天该复习 '+dl.length+' 条考点 ›';
      b.addEventListener('click',function(){ go('review'); });
    }
    box.appendChild(b);
  }
  function renderReview(){
    var rows=document.getElementById('revRows'); rows.innerHTML='';
    var dl=dueList();
    if(!dl.length){
      var d=document.createElement('div'); d.className='revitem';
      var tx=document.createElement('div'); tx.className='rtx';
      tx.textContent='今天没有待复习的考点。去考点里点右侧圆圈标记「已掌握」，系统会按第 1、3、7、15 天自动安排回看。';
      d.appendChild(tx); rows.appendChild(d); return;
    }
    dl.forEach(function(it){
      var li=liOf(it.id); if(!li) return;
      var card=document.createElement('div'); card.className='revitem';
      var tx=document.createElement('div'); tx.className='rtx';
      tx.textContent=li.textContent.replace(/\u2713/g,'').replace(/\s+/g,' ').trim().slice(0,110);
      var btns=document.createElement('div'); btns.className='rbtns';
      var b1=document.createElement('button'); b1.type='button'; b1.className='segbtn on'; b1.textContent='记住了';
      b1.addEventListener('click',function(){
        var d=due[it.id];
        if(d){ d.r++; d.t=Date.now(); if(d.r>=IV.length) delete due[it.id]; }
        saveDue(); card.remove(); renderRevBox();
        if(!dueList().length){ renderReview(); }
      });
      var b2=document.createElement('button'); b2.type='button'; b2.className='segbtn'; b2.textContent='回看原文';
      b2.addEventListener('click',function(){ jumpToId(it.id); });
      btns.appendChild(b1); btns.appendChild(b2);
      card.appendChild(tx); card.appendChild(btns);
      rows.appendChild(card);
    });
  }
  function jumpToId(id){
    var p=String(id).split('-'), sec=document.getElementById(p[0]);
    if(!sec) return;
    go(p[0]);
    var chap=sec.querySelectorAll('.chap')[+p[1]]; if(!chap) return;
    chap.open=true;
    var li=chap.querySelectorAll('.body>ul>li')[+p[2]];
    if(li){ setTimeout(function(){
      li.scrollIntoView({block:'center',behavior:'smooth'});
      li.classList.add('flash'); setTimeout(function(){ li.classList.remove('flash'); },1600);
    },60); }
  }
  /* ===== 错题按章节统计 ===== */
  function renderWrongStat(){
    var box=document.getElementById('wrongStat'); if(!box) return;
    box.innerHTML='';
    if(!wrongList.length){
      var d=document.createElement('div'); d.className='revitem';
      var tx=document.createElement('div'); tx.className='rtx';
      tx.textContent='还没有错题。做完一套模拟卷，答错的题会自动统计到这里，并按章节排序告诉你哪章最弱。';
      d.appendChild(tx); box.appendChild(d); return;
    }
    var m={};
    wrongList.forEach(function(q){ var k=(q.ch||'未分类章节'); m[k]=(m[k]||0)+1; });
    var arr=Object.keys(m).map(function(k){ return [k,m[k]]; })
      .sort(function(a,b){ return b[1]-a[1]; });
    arr.slice(0,8).forEach(function(p){
      var r=document.createElement('button'); r.type='button'; r.className='row';
      var rt=document.createElement('div'); rt.className='rt';
      var b=document.createElement('b'); b.textContent=p[0];
      var sp=document.createElement('span'); sp.textContent=p[1]+' 道错题 · 点开回看该章';
      rt.appendChild(b); rt.appendChild(sp);
      var go2=document.createElement('span'); go2.className='go'; go2.textContent='›';
      r.appendChild(rt); r.appendChild(go2);
      r.addEventListener('click',function(){ jumpToChapTitle(p[0]); });
      box.appendChild(r);
    });
  }
  function jumpToChapTitle(title){
    var h3s=document.querySelectorAll('#quiz h3');
    for(var i=0;i<h3s.length;i++){
      if(h3s[i].textContent.replace(/\s+/g,'')===String(title).replace(/\s+/g,'')){
        var chap=h3s[i].closest('.chap'); go('quiz'); if(chap) chap.open=true;
        setTimeout(function(){ h3s[i].scrollIntoView({block:'start',behavior:'smooth'}); },80);
        return;
      }
    }
    go('quiz');
  }
  /* ===== 记住上次位置 ===== */
  var POSKEY='k408pos-v1', posTimer=0;
  function savePos(){
    if(!groupOf[curV]) return;
    try{ localStorage.setItem(POSKEY,JSON.stringify({v:curV,y:Math.round(window.scrollY),t:Date.now()})); }catch(e){}
  }
  window.addEventListener('scroll',function(){ clearTimeout(posTimer); posTimer=setTimeout(savePos,350); },{passive:true});
  /* ===== 手势左右滑切换 ===== */
  function swipeTarget(dir){
    if(groupOf[curV]){
      var order=SEC.filter(function(s){ return s[2]===groupOf[curV]; }).map(function(s){ return s[0]; });
      var i=order.indexOf(curV)+dir;
      return (i>=0&&i<order.length)?order[i]:null;
    }
    var gs=['home','learn','drill','ref','me'], j=gs.indexOf(curV)+dir;
    return (j>=0&&j<gs.length)?gs[j]:null;
  }
  var tX=0,tY=0,track=false;
  document.addEventListener('touchstart',function(e){
    if(e.touches.length!==1){ track=false; return; }
    if(e.target.closest('.sheet,.menu,input,pre,.toc,.body table,.rbtns')){ track=false; return; }
    tX=e.touches[0].clientX; tY=e.touches[0].clientY; track=true;
  },{passive:true});
  document.addEventListener('touchend',function(e){
    if(!track) return; track=false;
    var tp=e.changedTouches[0], dx=tp.clientX-tX, dy=tp.clientY-tY;
    if(Math.abs(dx)>75 && Math.abs(dy)<55){
      var tgt=swipeTarget(dx<0?1:-1);
      if(tgt) go(tgt);
    }
  },{passive:true});


  /* ===== 模拟套卷选择 ===== */
  function examRow(name,desc,fn){
    var b=document.createElement('button'); b.type='button'; b.className='row';
    var rt=document.createElement('div'); rt.className='rt';
    var tt=document.createElement('b'); tt.textContent=name;
    var sp=document.createElement('span'); sp.textContent=desc;
    rt.appendChild(tt); rt.appendChild(sp);
    var g=document.createElement('span'); g.className='go'; g.textContent='\u203a';
    b.appendChild(rt); b.appendChild(g);
    b.addEventListener('click',fn);
    return b;
  }
  function buildSets(){
    var all=bank().filter(function(q){ return !q.set; }), by={};
    all.forEach(function(q){ var k=q.sub||'其他'; (by[k]=by[k]||[]).push(q); });
    var sets=[];
    for(var k=0;k<3;k++){
      var list=[];
      ['数据结构','组成原理','操作系统','网络'].forEach(function(s){
        var arr=by[s]||[];
        for(var j=k*10;j<k*10+10 && j<arr.length;j++) list.push(arr[j]);
      });
      if(list.length>=30) sets.push({name:'题库卷 '+(k+1),qs:list,min:80,
        desc:list.length+' 题 · 80 分钟 · 按真题配比抽取'});
    }
    return sets;
  }
  function newPapers(){
    var out=[], cache={};
    [].forEach.call(document.querySelectorAll('#paper .chap[data-set]'),function(ch){
      var set=ch.getAttribute('data-set');
      var min=parseInt(ch.getAttribute('data-min')||'0',10)||0;
      if(!cache[set]){
        cache[set]=bank().filter(function(q){ return q.set===set; })
          .concat(compBank().filter(function(q){ return q.set===set; }));
      }
      if(!cache[set].length) return;
      var nObj=cache[set].filter(function(q){ return !q.comp; }).length;
      var nComp=cache[set].length-nObj;
      if(!min) min = nComp ? 180 : 80;
      var nm=ch.getAttribute('data-name')||('卷 '+set);
      out.push({name:nm, qs:cache[set], min:min,
        desc: nObj+' 选择'+(nComp?' + '+nComp+' 综合':'' )+' · '+min+' 分钟'+(nComp?' · 整卷训练':' · 专项选择训练')});
    });
    return out;
  }
  function renderExamSets(){
    var box=document.getElementById('examRows'); box.innerHTML='';
    if(document.querySelector('#paper .chap')){
      box.appendChild(examRow('综合应用题','7 题 70 分 · 练习区可随时查看参考答案与评分点',function(){ go('paper'); }));
    }
    var sr=document.createElement('label'); sr.className='shufrow';
    var cb=document.createElement('input'); cb.type='checkbox'; cb.checked=shufOn();
    cb.addEventListener('change',function(){ setShuf(cb.checked); });
    sr.appendChild(cb);
    var sp=document.createElement('span');
    sp.innerHTML='<b>选项乱序</b>　打乱每题 A/B/C/D 的摆放位置，答案与判分自动跟随，防止背答案位置';
    sr.appendChild(sp); box.appendChild(sr);
    var h=document.createElement('div'); h.className='gtitle';
    h.textContent='题库组卷（40 题 · 80 分钟）'; box.appendChild(h);
    buildSets().forEach(function(s){
      box.appendChild(examRow(s.name,s.desc,function(){ startExam(s.qs,s.min,s.name,'exam'); }));
    });
    box.appendChild(examRow('随机卷','随机 40 题 · 80 分钟 · 每次都不一样',function(){
      var all=bank().filter(function(q){ return !q.set; });
      startExam(shuffle(all.slice()).slice(0,40),80,'随机卷','exam');
    }));
    var np=newPapers();
    if(np.length){
      var h2=document.createElement('div'); h2.className='gtitle';
      h2.textContent='整卷训练与专项训练'; box.appendChild(h2);
      np.forEach(function(s){
        box.appendChild(examRow(s.name,s.desc,function(){ startExam(s.qs,s.min,s.name,'exam'); }));
      });
    }
    var h3=document.createElement('div'); h3.className='gtitle';
    h3.textContent='错题'; box.appendChild(h3);
    box.appendChild(examRow('错题本',wrongList.length+' 题 · 重做答对自动移出',function(){ openWrong(); }));
  }
  /* ===== 每日学习计划 ===== */
var PLAN30=[[1, "数据结构1~2章+题库1~2组（8题）+图解4.1", "90min"], [2, "数据结构3~4章+题库3~4组（8题）+图解4.2", "90min"], [3, "数据结构第5章+题库第5组+代码卡1~4+图4.3", "120min"], [4, "数据结构第6章+题库第6组+代码卡10~12+图5.5", "120min"], [5, "数据结构7~8章+题库7~8组+代码卡13~16", "120min"], [6, "组成原理1~2章+题库1~2组（10题）+图解2.3", "100min"], [7, "模拟卷40题（60min）+错题本整理半天+代码卡5~9", "120min"], [8, "组成原理第3章+题库第3组+图解2.1、2.2", "100min"], [9, "组成原理4~5章+题库4~5组（10题）+图解2.4", "120min"], [10, "组成原理6~7章+题库6~7组（10题）+图解2.5", "110min"], [11, "操作系统1~2章+题库1~2组（12题）+图解3.1", "110min"], [12, "操作系统第3章+题库第3组+图解3.2、5.6", "100min"], [13, "操作系统第4章+题库第4组+图解3.3", "100min"], [14, "模拟卷40题（60min）+错题本整理半天+图解3.5", "120min"], [15, "操作系统5~6章+题库5~6组（12题）+图解3.4", "110min"], [16, "网络1~2章+题库1~2组（12题）+图解1.5", "110min"], [17, "网络3~4章+题库3~4组（12题）+图解5.2、5.3", "120min"], [18, "网络5~6章+题库5~6组（12题）+图解1.1~1.4", "120min"], [19, "大题模板1~3套（数据结构）+手写2题+代码卡6~9", "110min"], [20, "大题模板4~6套（组成原理）+计算专项1~8题", "110min"], [21, "模拟卷40题（60min）+错题本整理+模板7~8套", "120min"], [22, "大题模板9~11套（网络）+计算专项9~14题", "110min"], [23, "满分范文5篇精读+手写1篇+跨科串联", "100min"], [24, "计算专项15~20题+解题技巧+考法速查+易混辨析", "100min"], [25, "模拟卷40题（60min）+错题本整理+公式速查卡", "120min"], [26, "错题本二刷四科+薄弱章题库重做", "110min"], [27, "模拟卷40题（60min）+错题本整理+数字大全", "120min"], [28, "错题本三刷+思维导图默写四科+计算专项错题", "110min"], [29, "图解1.1~5.6全过+数字大全+避坑清单", "90min"], [30, "数字大全+避坑清单+公式速查卡+图解易错图", "90min"]];
  var PKEY='k408plan-v1', plan=null;
  try{ plan=JSON.parse(localStorage.getItem(PKEY)||'null'); }catch(e){}
  function todayStr(){
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function savePlan(){ try{ localStorage.setItem(PKEY,JSON.stringify(plan)); }catch(e){} }
  function dayIndex(){
    if(!plan||!plan.start) return 1;
    var s=new Date(plan.start+'T00:00:00'), n=new Date(todayStr()+'T00:00:00');
    return Math.min(30,Math.max(1,Math.round((n-s)/864e5)+1));
  }
  function guessSection(task){
    if(/数据结构/.test(task)) return 'ds';
    if(/组成原理/.test(task)) return 'co';
    if(/操作系统/.test(task)) return 'os';
    if(/网络/.test(task)) return 'net';
    if(/模拟卷/.test(task)) return 'examset';
    if(/模板/.test(task)) return 'tpl';
    if(/代码卡/.test(task)) return 'code';
    if(/图解|图\d/.test(task)) return 'fig';
    if(/数字大全|避坑|速查/.test(task)) return 'num';
    return 'home';
  }
  function renderToday(){
    var box=document.getElementById('todayBox'); if(!box) return;
    if(!plan||!plan.start){ plan={start:todayStr(),done:{}}; savePlan(); }
    if(!plan.done) plan.done={};
    var n=dayIndex(), item=PLAN30[n-1], done=!!plan.done[n];
    var cnt=Object.keys(plan.done).length;
    box.innerHTML='';
    var card=document.createElement('div'); card.className='todaycard'+(done?' done':'');
    var tt=document.createElement('div'); tt.className='tt';
    var b=document.createElement('b'); b.textContent='第 '+n+' 天 / 30';
    var sp=document.createElement('span'); sp.textContent=done?'今天已完成':'今日任务';
    tt.appendChild(b); tt.appendChild(sp);
    var task=document.createElement('div'); task.className='task'; task.textContent=item[1];
    var mins=document.createElement('div'); mins.className='mins';
    mins.textContent='预计 '+item[2]+' · 已完成 '+cnt+'/30 天';
    var pb=document.createElement('div'); pb.className='pbar';
    var pi=document.createElement('i'); pi.style.width=(cnt/30*100)+'%'; pb.appendChild(pi);
    var acts=document.createElement('div'); acts.className='acts';
    var b1=document.createElement('button'); b1.className='pri';
    b1.textContent=done?'已完成':'完成今天';
    b1.addEventListener('click',function(){
      if(plan.done[n]) delete plan.done[n]; else plan.done[n]=1;
      savePlan(); renderToday();
    });
    var b2=document.createElement('button'); b2.textContent='去学习';
    b2.addEventListener('click',function(){ go(guessSection(item[1])); });
    acts.appendChild(b1); acts.appendChild(b2);
    card.appendChild(tt); card.appendChild(task); card.appendChild(mins); card.appendChild(pb); card.appendChild(acts);
    box.appendChild(card);
    if(!plan.exam){ plan.exam='2026-12-19'; savePlan(); }
    var cd=document.createElement('div'); cd.className='cd';
    try{
      var exD=new Date(plan.exam+'T00:00:00'), nowD=new Date(todayStr()+'T00:00:00');
      var left=Math.round((exD-nowD)/864e5);
      var totLi=0, doneLi=0;
      progMap.forEach(function(p){ totLi+=p.total; doneLi+=p.sec.querySelectorAll('.body>ul>li.done').length; });
      var rest=Math.max(0,totLi-doneLi);
      var per=left>0?Math.ceil(rest/left):rest;
      cd.className='cd'+(left<=30?' warn':'');
      cd.innerHTML= left>0
        ? '<span>距考试 <b>'+left+'</b> 天</span><span>还剩 '+rest+' / '+totLi+' 个知识点</span><span>每天约 <b>'+per+'</b> 个</span>'
        : '<span>考试日期已到或已过，请更新日期</span>';
    }catch(e){ cd.textContent=''; }
    box.appendChild(cd);
    var cds=document.createElement('div'); cds.className='cdset';
    cds.innerHTML='<span>考试日期</span><input type="date" id="examDate" value="'+plan.exam+'">'+
                  '<button type="button" id="examDateSave">保存</button>';
    box.appendChild(cds);
    var dIn=cds.querySelector('#examDate'), dBt=cds.querySelector('#examDateSave');
    if(dBt) dBt.addEventListener('click',function(){
      var v=dIn&&dIn.value; if(!v) return;
      plan.exam=v; savePlan(); renderToday();
    });
    [].forEach.call(document.querySelectorAll('#plan tbody tr'),function(tr){
      var td=tr.querySelector('td');
      tr.classList.toggle('now',!!td && td.textContent.trim()==='D'+n);
    });
  }

  /* 顶栏/进度条/回顶 */
  var bar=document.getElementById('bar'), topBtn=document.getElementById('top');
  topBtn.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
  function onScroll(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.width=(h>0?Math.min(100,window.scrollY/h*100):0)+'%';
    topBtn.classList.toggle('show',window.scrollY>700);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  document.addEventListener('click',function(e){
    if(e.target.classList && e.target.classList.contains('ck')){
      var li=e.target.closest('li');
      if(li){ trackDue(li); }
      setTimeout(function(){ if(curV==='home'){ renderHero(); renderRevBox(); } if(curV==='me') renderMe(); },0);
    }
  });
  onScroll(); renderHero(); renderRevBox(); renderToday(); renderScores();
  /* ===== 首次使用引导 / 数据管理 / 分享 ===== */
  var GKEY='k408guide-v1';
  function guideSeen(){ try{ return localStorage.getItem(GKEY)==='1'; }catch(e){ return true; } }
  function markGuide(){ try{ localStorage.setItem(GKEY,'1'); }catch(e){} }
  var GUIDE_HTML='<div class="tip" style="border-color:var(--accentbd);background:var(--accentbg)">'
    +'<b>第一次用？看这三步就够了</b><br>'
    +'① <b>学</b>：点底部「学」，按数据结构 / 组成原理 / 操作系统 / 计算机网络四科 27 章过考点；每个考点右边的圆圈点一下就是「已掌握」。<br>'
    +'② <b>练</b>：点底部「练」，有分章题库和 25 套模拟卷；交卷自动判分，答错的题自动进错题本。<br>'
    +'③ <b>查</b>：点底部「查」，公式表、易错点、解题技巧、图解随时翻。<br>'
    +'<span style="color:var(--tx2)">全部离线可用，进度只存在你手机本地，不会上传。右上角「⋯」里有使用说明和数据管理。</span>'
    +'<div style="margin-top:10px"><button class="bigbtn" id="guideOk" style="margin:0">知道了，开始用</button></div></div>';
  var guideBox=document.getElementById('guideBox');
  if(!guideBox){ guideBox=document.createElement('div'); guideBox.id='guideBox'; guideBox.style.display='none'; document.body.appendChild(guideBox); }
  function showGuide(){
    if(!guideBox) return;
    guideBox.innerHTML=GUIDE_HTML;
    var ok=document.getElementById('guideOk');
    if(ok) ok.addEventListener('click',function(){ markGuide(); guideBox.innerHTML=''; });
  }
  if(!guideSeen()) showGuide();
  var gRow=document.getElementById('guideRow');
  if(gRow) gRow.addEventListener('click',function(){ closeMenu(); markGuide(); showGuide(); go('home'); });
  var dRow=document.getElementById('dataRow');
  if(dRow) dRow.addEventListener('click',function(){ closeMenu(); go('data'); renderScores(); });
  var cM=document.getElementById('clrMaster');
  if(cM) cM.addEventListener('click',function(){ var r=document.getElementById('resetBtn'); if(r) r.click(); });
  var cW=document.getElementById('clrWrong');
  if(cW) cW.addEventListener('click',function(){
    if(!confirm('清空错题本？此操作不可恢复。')) return;
    wrongList=[]; saveWrong();
    var wv=document.getElementById('wrongV'); if(wv) wv.textContent='0 题';
    if(typeof renderMe==='function') renderMe();
    alert('错题本已清空。');
  });
  var cP=document.getElementById('clrPlan');
  if(cP) cP.addEventListener('click',function(){
    if(!confirm('重置每日学习计划？将从今天重新开始。')) return;
    plan={start:todayStr(),done:{}}; savePlan(); renderToday();
    if(typeof renderMe==='function') renderMe();
    alert('学习计划已重置。');
  });
  var cA=document.getElementById('clrAll');
  if(cA) cA.addEventListener('click',function(){
    if(!confirm('清空全部个人数据（已掌握标记、错题本、学习计划、遗忘曲线队列、字号、选项乱序开关、阅读位置）？此操作不可恢复。')) return;
    try{
      ['k408done-v1','k408wrong-v1','k408plan-v1','k408due-v1','k408fs-v1','k408shuf-v1','k408pos-v1','k408guide-v1','k408score-v1'].forEach(function(k){ localStorage.removeItem(k); });
    }catch(e){}
    location.reload();
  });

  var init=(location.hash||'').replace('#',''), saved=null;
  try{ saved=JSON.parse(localStorage.getItem(POSKEY)||'null'); }catch(e){}
  var startV='home';
  if(init && document.getElementById(init)) startV=init;
  else if(saved && saved.v && document.getElementById(saved.v)) startV=saved.v;
  go(startV,true);
  if(saved && saved.v===startV && saved.y>0){
    setTimeout(function(){ window.scrollTo(0,saved.y); },180);
  }

})();
