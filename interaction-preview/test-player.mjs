import assert from 'node:assert/strict';
import {createPlayer} from './player-state.mjs';
let clock=0,id=0,emitted=[],pending=new Map();
const schedule=(fn,delay)=>{const handle=++id;pending.set(handle,{fn,at:clock+delay});return handle;};
const cancel=handle=>pending.delete(handle);
function tick(ms){
  const end=clock+ms;
  while(true){
    const next=[...pending].filter(([,job])=>job.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
    if(!next)break;
    clock=next[1].at;pending.delete(next[0]);next[1].fn();
  }
  clock=end;
}
const p=createPlayer({count:7,interval:4500,onChange:s=>emitted.push(s),schedule,cancel});
assert.equal(p.state().index,0);
p.play();assert.equal(p.state().playing,true);assert.equal(pending.size,1);
p.play();assert.equal(pending.size,1); // No duplicate timer on repeated play.
tick(4499);assert.equal(p.state().index,0);
tick(1);assert.equal(p.state().index,1);
p.stop();assert.equal(pending.size,0);tick(30000);assert.equal(p.state().index,1);
p.play();tick(4500);assert.equal(p.state().index,2);
p.go(5);assert.equal(p.state().playing,false);assert.equal(pending.size,0);
p.play();tick(4500);assert.equal(p.state().index,6);assert.equal(p.state().playing,false);assert.equal(pending.size,0); // Stop on the last tick, not the following tick.
tick(30000);assert.equal(p.state().index,6);
p.play();assert.equal(p.state().index,0);assert.equal(p.state().playing,true);
p.speed(2800);assert.equal(pending.size,1);tick(2799);assert.equal(p.state().index,0);tick(1);assert.equal(p.state().index,1);
p.go(-100);assert.equal(p.state().index,0);assert.equal(pending.size,0);
p.go(100);assert.equal(p.state().index,6);
p.go(NaN);assert.equal(p.state().index,6);
p.speed(100);assert.equal(p.state().interval,2800);
p.reduced(true);p.play();assert.equal(p.state().playing,false);assert.equal(pending.size,0);
p.go(3);assert.equal(p.state().index,3); // Manual navigation remains available.
p.reduced(false);p.play();assert.equal(p.state().playing,true);p.reduced(true);assert.equal(pending.size,0);
p.reduced(false);p.go(4);p.toggle();assert.equal(p.state().playing,true);p.toggle();assert.equal(p.state().playing,false);
const single=createPlayer({count:1,schedule,cancel});single.play();assert.equal(single.state().playing,false);
assert.throws(()=>createPlayer({count:0}));
assert.deepEqual(emitted.at(-1),p.state());
console.log('Playback checks passed: bounds, repeat clicks, pause, final-frame stop, replay, speed, reset, reduced motion.');
