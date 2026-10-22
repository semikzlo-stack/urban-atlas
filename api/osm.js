// Urban Atlas 1.1: read-only, parameter-bound Overpass proxy.
// Limits area and query modes to prevent arbitrary large public queries.
const UPSTREAM = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
function bbox(lat, lon, radius) {
  const dy=radius/111320, dx=radius/(111320*Math.cos(lat*Math.PI/180));
  return [lat-dy,lon-dx,lat+dy,lon+dx].map(n=>n.toFixed(6)).join(',');
}
function queryFor(mode,lat,lon,radius){
  const b=bbox(lat,lon,radius);
  if(mode==='walk')return `[out:json][timeout:24];(way["highway"]["highway"!~"motorway|motorway_link|trunk|trunk_link|construction|proposed|raceway|bus_guideway|platform"](${b});node["amenity"](${b});node["tourism"](${b});node["shop"](${b});node["leisure"="park"](${b}););out body;>;out skel qt;`;
  if(mode==='build')return `[out:json][timeout:24];way["building"](${b});out geom;`;
  if(mode==='poi')return `[out:json][timeout:24];(node["amenity"](around:${radius},${lat},${lon});node["shop"](around:${radius},${lat},${lon});node["tourism"](around:${radius},${lat},${lon}););out body;`;
  return null;
}
module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const {mode,lat,lon,radius}=req.query||{};
  if(mode==='health')return res.status(200).json({status:'ok',service:'Urban Atlas Overpass proxy',version:'1.1'});
  const latitude=Number(lat), longitude=Number(lon), r=Number(radius);
  if(!['walk','build','poi'].includes(mode)||!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(r)||Math.abs(latitude)>85||Math.abs(longitude)>180||r<250||r>1900)return res.status(400).json({error:'Недопустимый режим или координаты/радиус (250–1900 м)'});
  const query=queryFor(mode,latitude,longitude,Math.round(r));
  let errors=[];
  for(const [index,url] of UPSTREAM.entries()){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
    try{
      const resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json','User-Agent':'UrbanAtlas/1.1 (geospatial research demo; contact via project homepage)'},body:new URLSearchParams({data:query}).toString(),signal:controller.signal});
      if(!resp.ok)throw new Error('HTTP '+resp.status);
      const data=await resp.json();
      if(!Array.isArray(data.elements)||!data.elements.length)throw new Error('No elements returned');
      return res.status(200).json(data);
    }catch(e){errors.push('Источник '+(index+1)+': '+(e.name==='AbortError'?'timeout':e.message));}
    finally{clearTimeout(timer)}
  }
  return res.status(502).json({error:'Невозможно получить OpenStreetMap: '+errors.join('; ')});
};
module.exports.queryFor = queryFor;
module.exports.bbox = bbox;
