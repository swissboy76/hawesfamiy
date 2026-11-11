'use strict';
(async function(){
 const warning=document.getElementById('map-unavailable');
 let places;
 try{const response=await fetch('places-data.json');if(!response.ok)throw new Error('Place records unavailable');places=await response.json();}catch(e){warning.hidden=false;return;}
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const route=places.filter(p=>p.route).sort((a,b)=>a.route-b.route);
 const mapped=places.filter(p=>p.coords);
 let overview,detail,markers=new Map(),detailLayers,selectedId='gipsy';
 const mapSearch=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.title+(p.id==='st-george'?' London':' London England'));
 const popup=p=>'<b>'+escape(p.title)+'</b><br>'+escape(p.period)+'<br><small>'+escape(p.kind)+'</small>';
 const people=p=>p.people.map(([id,name])=>'<a href="biographies/'+encodeURIComponent(id)+'.html">'+escape(name)+'</a>').join(' · ');
 function content(p){return '<span class="eyebrow">'+escape(p.period)+' · '+escape(p.kind)+'</span><h3>'+escape(p.title)+'</h3><p>'+people(p)+'</p><p>'+escape(p.desc)+'</p><p class="precision">'+escape(p.precision)+'</p><div class="actions"><a href="'+p.source+'">Read the evidence →</a><a href="'+mapSearch(p)+'" target="_blank" rel="noopener">Open address search ↗</a></div>';}
 function choose(p,pan=true){
  selectedId=p.id;document.getElementById('selected-place').innerHTML=content(p);
  if(detail&&p.coords&&pan){detail.setView(p.coords,15,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});const marker=markers.get(p.id);if(marker)marker.openPopup();}
 }
 function selectStage(p){
  document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage===p.id)));
  document.getElementById('route-detail').innerHTML=content(p);
  if(overview&&p.coords){overview.setView(p.coords,p.route<=4?16:14);routeMarkers.get(p.id)?.openPopup();}
 }
 const routeMarkers=new Map();
 document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>selectStage(places.find(p=>p.id===b.dataset.stage))));
 document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>{
  const p=places.find(p=>p.id===b.dataset.place);document.getElementById('generation').value='all';filterPlaces();choose(p);document.getElementById('addresses').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }));
 // Include every generation named in the family connections, rather than only the address's primary generation.
 const generationIds=[['john0','ann'],['william','elizabeth-mullinex'],['henry','sophia','thomas','sophia-perkins','maria','louisa','maryemma','caroline1853','richard1848'],['edward','mary-ellis'],['walter','frances'],['eric','george','gladys1913','mary']];
 function filterPlaces(){
  const filter=document.getElementById('generation').value;
  const visible=places.filter(p=>filter==='all'||p.people.some(([id])=>generationIds[Number(filter)].includes(id)));
  const ids=new Set(visible.map(p=>p.id));
  document.querySelectorAll('.place-card').forEach(card=>card.hidden=!ids.has(card.id.replace('place-','')));
  document.getElementById('place-count').textContent=visible.length+' recorded '+(visible.length===1?'place':'places');
  if(detail){
   detailLayers.clearLayers();markers.clear();
   visible.filter(p=>p.coords).forEach(p=>{
    const color=p.kind==='Parish connection'?'#9c783c':p.id==='anerley'?'#637aa0':'#244936';
    const marker=L.circleMarker(p.coords,{radius:8,color:'#fff',weight:2,fillColor:color,fillOpacity:1}).bindPopup(popup(p)).addTo(detailLayers);
    marker.on('click',()=>choose(p,false));markers.set(p.id,marker);
   });
   const points=visible.filter(p=>p.coords).map(p=>p.coords);if(points.length>1)detail.fitBounds(points,{padding:[35,35],maxZoom:15});else if(points.length===1)detail.setView(points[0],14);
  }
  if(!ids.has(selectedId)&&visible.length)choose(visible.find(p=>p.coords)||visible[0],false);
 }
 document.getElementById('generation').addEventListener('change',filterPlaces);
 document.getElementById('fit-places').addEventListener('click',()=>{document.getElementById('generation').value='all';filterPlaces();});
 choose(places.find(p=>p.id==='gipsy'),false);
 if(typeof L==='undefined'){warning.hidden=false;filterPlaces();return;}
 try{
  const init=id=>{
   const map=L.map(id,{scrollWheelZoom:false,zoomSnap:.5});
   const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
   tiles.on('tileerror',()=>document.getElementById('map-status').textContent='Some background map tiles could not load. Place markers, address searches and the full record collection remain available.');tiles.addTo(map);L.control.scale({imperial:false}).addTo(map);return map;
  };
  overview=init('migration-map');detail=init('places-map');detailLayers=L.layerGroup().addTo(detail);
  L.polyline(route.map(p=>p.coords),{color:'#fffdf3',weight:8,opacity:.95}).addTo(overview);
  L.polyline(route.map(p=>p.coords),{color:'#244936',weight:4,dashArray:'8 9',opacity:1}).addTo(overview);
  route.forEach(p=>{
   const cls=p.id==='st-george'?' parish':p.id==='anerley'?' visit':'';
   const marker=L.marker(p.coords,{icon:L.divIcon({className:'number-pin'+cls,html:'<span>'+p.route+'</span>',iconSize:[30,30],iconAnchor:[15,15]}),title:p.title,alt:'Stage '+p.route+': '+p.title}).bindPopup(popup(p)).addTo(overview);
   marker.on('click',()=>{document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage===p.id)));document.getElementById('route-detail').innerHTML=content(p);});routeMarkers.set(p.id,marker);
  });
  overview.fitBounds(route.map(p=>p.coords),{padding:[45,45]});
  const fit=L.control({position:'topright'});fit.onAdd=()=>{const box=L.DomUtil.create('div','leaflet-bar');const button=L.DomUtil.create('button','',box);button.type='button';button.textContent='Fit journey';button.style.cssText='border:0;background:#fff;padding:9px 13px;cursor:pointer;font:13px system-ui';L.DomEvent.disableClickPropagation(box);['Central London','South London'].forEach((label,i)=>{const extra=L.DomUtil.create('button','',box);extra.type='button';extra.textContent=label;extra.style.cssText=button.style.cssText+';border-left:1px solid #ddd';extra.onclick=()=>overview.fitBounds(route.filter(p=>i===0?p.route<=4:p.route>=5).map(p=>p.coords),{padding:[45,45]});});button.onclick=()=>overview.fitBounds(route.map(p=>p.coords),{padding:[45,45]});return box;};fit.addTo(overview);
  filterPlaces();
  // Reveal each map only when it is being viewed, retaining normal browser caching for tiles.
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){(entry.target.id==='migration-map'?overview:detail).invalidateSize();}}));observer.observe(document.getElementById('migration-map'));observer.observe(document.getElementById('places-map'));}
 }catch(e){warning.hidden=false;}
})();
