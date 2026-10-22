// Urban Atlas 1.2: focused, bounded Overpass queries. Each request asks for
// either roads, POIs, or building footprints; the former combined query was
// too expensive for central Gdańsk and routinely timed out.
const UPSTREAM = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
const MAX_RADIUS = 1900;
const UPSTREAM_TIMEOUT = 18000;
function bbox(lat, lon, radius) {
  const dy=radius/111320, dx=radius/(111320*Math.cos(lat*Math.PI/180));
  return [lat-dy,lon-dx,lat+dy,lon+dx].map(n=>n.toFixed(6)).join(',');
}
function queryFor(mode,lat,lon,radius){
  const b=bbox(lat,lon,radius);
  // out geom avoids recursively fetching every highway node (the old >;out skel);
  // way.nodes IDs remain present so intersections can still be joined correctly.
  if(mode==='walk')return `[out:json][timeout:35];way["highway"]["highway"!~"motorway|motorway_link|trunk|trunk_link|construction|proposed|raceway|bus_guideway|platform"](${b});out body geom;`;
  if(mode==='build')return `[out:json][timeout:35];way["building"](${b});out body geom;`;
  if(mode==='poi')return `[out:json][timeout:35];(node["amenity"](${b});node["shop"](${b});node["tourism"](${b});node["leisure"="park"](${b}););out body;`;
  return null;
}
async function fetchInstance(url,query,signal){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),UPSTREAM_TIMEOUT);
  const abort=()=>ctrl.abort();
  signal?.addEventListener('abort',abort,{once:true});
  try{
    const response=await fetch(url,{
      method:'POST',
      body:new URLSearchParams({data:query}).toString(),
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','Accept':'application/json','User-Agent':'UrbanAtlas/1.2 (research prototype)'},
      signal:ctrl.signal
    });
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    if(!data||!Array.isArray(data.elements))throw new Error('invalid JSON elements');
    return data;
  }finally{
    clearTimeout(timer);
    signal?.removeEventListener('abort',abort);
  }
}
async function fetchAny(query){
  // Race two independent public services; cancel the loser once one responds.
  const controllers=UPSTREAM.slice(0,2).map(()=>new AbortController());
  const errors=[];
  const work=UPSTREAM.slice(0,2).map((url,i)=>fetchInstance(url,query,controllers[i].signal).catch(e=>{
    errors[i]=e.name==='AbortError'?'timeout':e.message;
    throw e;
  }));
  try {
    const result=await Promise.any(work);
    controllers.forEach(c=>c.abort());
    return result;
  }catch{
    // The third endpoint is a last resort, not another simultaneous request.
    try{return await fetchInstance(UPSTREAM[2],query)}
    catch(e){throw new Error('Все поставщики недоступны: '+errors.join('; ')+'; '+(e.name==='AbortError'?'timeout':e.message))}
  }
}
async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const {mode,lat,lon,radius}=req.query||{};
  if(mode==='health')return res.status(200).json({status:'ok',service:'Urban Atlas OSM proxy',version:'1.2',upstream:'not checked'});
  const latitude=Number(lat),longitude=Number(lon),r=Number(radius);
  if(!['walk','build','poi'].includes(mode)||!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(r)||Math.abs(latitude)>85||Math.abs(longitude)>180||r<250||r>MAX_RADIUS){
    return res.status(400).json({error:'Invalid mode, coordinate or radius (250–1900 m)'});
  }
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=86400');
  try {
    const data=await fetchAny(queryFor(mode,latitude,longitude,Math.round(r)));
    res.status(200).json({elements:data.elements,osm3s:data.osm3s||null,source:'OpenStreetMap / Overpass',query_mode:mode});
  }catch(e){
    res.setHeader('Cache-Control','no-store');
    res.status(502).json({error:'Источники OpenStreetMap не ответили: '+e.message});
  }
}
module.exports=handler;
module.exports.queryFor=queryFor;
module.exports.bbox=bbox;
module.exports.fetchAny=fetchAny;
