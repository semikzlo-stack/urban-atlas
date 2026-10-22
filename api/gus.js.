// Read-only allowlisted proxy for Poland GUS BDL. No credentials required for anonymous quota.
module.exports = async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
 const {action,name,unit,variable}=req.query||{};
 let path;
 if(action==='units'){
  if(typeof name!=='string'||name.length>80||!name.trim())return res.status(400).json({error:'Invalid name'});
  path='/units?'+new URLSearchParams({name:name.trim(),'page-size':'100',format:'json'});
 }else if(action==='variable'){
  if(!/^\d{1,9}$/.test(variable||''))return res.status(400).json({error:'Invalid variable ID'});
  path='/variables/'+variable+'?'+new URLSearchParams({format:'json'});
 }else if(action==='data'){
  if(!/^\d{6,16}$/.test(unit||'')||!/^\d{1,9}$/.test(variable||''))return res.status(400).json({error:'Invalid GUS identifiers'});
  path='/data/by-unit/'+unit+'?'+new URLSearchParams({'var-id':variable,'page-size':'100',format:'json'});
 }else return res.status(400).json({error:'Unsupported action'});
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  let upstream;try{upstream=await fetch('https://bdl.stat.gov.pl/api/v1'+path,{signal:controller.signal,headers:{'Accept':'application/json'}})}finally{clearTimeout(timer)}
  if(!upstream.ok)return res.status(502).json({error:'GUS API HTTP '+upstream.status});
  const body=await upstream.json();
  if(action==='variable')return res.status(200).json({source:'GUS BDL',variable:{id:body.id,name:body.name,unitId:body.unitId,measureUnitId:body.measureUnitId,subjectId:body.subjectId}});
  if(action==='units')return res.status(200).json({source:'GUS BDL',results:(body.results||[]).map(x=>({id:String(x.id),name:x.name,level:x.level}))});
  const row=(body.results||[]).find(x=>String(x.id)===String(variable))||body.results?.[0];
  return res.status(200).json({source:'GUS BDL',results:(row?.values||[]).map(v=>({year:v.year,val:v.val,attrId:v.attrId}))});
 }catch(e){return res.status(502).json({error:'GUS API unavailable: '+e.message})}
};
