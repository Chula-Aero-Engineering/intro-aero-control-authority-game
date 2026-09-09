import {it,expect} from 'vitest';
import fs from 'node:fs';
import {caseResult} from '../../src/core/onboarding/investigation.js';
const missions=Array.from({length:13},(_,i)=>JSON.parse(fs.readFileSync(new URL(`../../lessons/onboarding/mission${String(i+1).padStart(2,'0')}.json`,import.meta.url))));
it('provides defined terms, specific input help and distinct reflection questions for every mission',()=>{
 expect(new Set(missions.map(m=>m.experience.reflection.question)).size).toBe(13);
 for(const m of missions){expect(m.experience.terms.length,m.id).toBeGreaterThan(80);for(const f of m.fields){expect(f.help,m.id+f.id).not.toContain('Choose the statement supported');expect(f.help,m.id+f.id).not.toContain('Use your own words. Refer to');}for(const c of m.investigation.cases)if(c.readouts)expect(c.readouts[c.evidenceIndex],m.id+c.id).toBeDefined();}
});
it('records the quantity used to decide the case rather than an unchanged baseline',()=>{
 const indices={3:1,4:4,5:3,7:2,10:3,12:5};for(const [n,index] of Object.entries(indices))for(const c of missions[n-1].investigation.cases)expect(c.evidenceIndex).toBe(index);
 for(const c of missions[5].investigation.cases)expect(c.readouts[c.evidenceIndex].expression).toBe('deltaDeg');
});
it('describes a failed numerical comparison with a true inequality',()=>{
 const m=missions[0],v=caseResult(m,{}, {},m.investigation.cases[2]);expect(v.comparisonText).toBe('0.0501 < 0.12');
});
