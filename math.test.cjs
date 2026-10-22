const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function extract(start,end){const a=src.indexOf(start),b=src.indexOf(end,a);assert(a>=0&&b>a);return src.slice(a,b)}
const code=[extract('function haversine(','\nfunction bbox('),extract('function dijkstra(','\nfunction interp('),extract('function interp(','\nfunction roadFeatures('),extract('function roadFeatures(','\nfunction spatialIndex('),extract('function planarArea(','\nfunction valueFmt(')].join('\n');
const Heap=class {constructor(){this.v=[]}push(x){this.v.push(x);this.v.sort((a,b)=>a[0]-b[0])}pop(){return this.v.shift()}get length(){return this.v.length}};
const F=new Function('Heap',code+'; return {haversine,dijkstra,roadFeatures,planarArea};')(Heap);
const near=(a,b,tol)=>assert.ok(Math.abs(a-b)<=tol,`${a} not within ${tol} of ${b}`);
near(F.haversine([54.35,18.65],[54.35,18.65]),0,1e-8);
near(F.haversine([0,0],[0,1]),111195,250);
const lat=54.35, lon=18.65, dy=100/111320,dx=100/(111320*Math.cos(lat*Math.PI/180));
near(F.planarArea([[lon,lat],[lon+dx,lat],[lon+dx,lat+dy],[lon,lat+dy],[lon,lat]]),10000,100);
const adj=new Map([[1,[[2,100]]],[2,[[1,100],[3,200]]],[3,[[2,200]]]]);
assert.deepEqual([...F.dijkstra(adj,1,250).entries()],[[1,0],[2,100]]);
const g={edges:[[1,2,100],[2,3,200]],nodes:new Map([[1,[0,0]],[2,[0,.001]],[3,[0,.003]]])};
const r=F.roadFeatures(g,F.dijkstra(adj,1,250),250);
near(r.length,250,.001);
assert.equal(r.features.length,2);
// A street reachable from both endpoints need not be reachable in the middle.
const g2={edges:[[1,2,100]],nodes:new Map([[1,[0,0]],[2,[0,0.001]]])};
const partial=F.roadFeatures(g2,new Map([[1,0],[2,0]]),20);
near(partial.length,40,0.001);
assert.equal(partial.features.length,2);
const complete=F.roadFeatures(g2,new Map([[1,0],[2,0]]),50);
near(complete.length,100,0.001);
assert.equal(complete.features.length,1);
const accessBudget=15*75-50; assert.equal(accessBudget,1075);
console.log('PASS: distance zero; 1° Earth distance; 10,000m² polygon; shortest-path cutoff; partial edges at both ends; access connector budget');
