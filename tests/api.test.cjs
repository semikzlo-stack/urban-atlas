const assert=require('node:assert/strict');
const handler=require('../api/gus.js');
async function run(query,payload,status=200){const old=global.fetch;let requrl;global.fetch=async url=>{requrl=String(url);return {ok:status===200,status,json:async()=>payload}};const req={query};let result,code=200;const res={setHeader(){},status(n){code=n;return this},json(x){result=x;return this}};try{await handler(req,res);return {result,code,requrl}}finally{global.fetch=old}}
(async()=>{
let x=await run({action:'units',name:'Gdańsk'},{results:[{id:'226100000000',name:'Gdańsk',level:5}]});assert.equal(x.code,200);assert.equal(x.result.results[0].name,'Gdańsk');assert.ok(x.requrl.includes('/units?'));
x=await run({action:'data',unit:'226100000000',variable:'3643'},{results:[{id:3643,values:[{year:2024,val:100}]}]});assert.equal(x.result.results[0].val,100);assert.ok(x.requrl.includes('var-id=3643'));
x=await run({action:'variable',variable:'3643'},{id:3643,name:'Ludność'});assert.equal(x.result.variable.name,'Ludność');
x=await run({action:'data',unit:'../../etc',variable:'3643'},{});assert.equal(x.code,400);
console.log('PASS: GUS search, values, variable metadata and invalid ID validation');
})().catch(e=>{console.error(e);process.exit(1)});
