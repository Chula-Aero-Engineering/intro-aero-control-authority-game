import {investigationComplete} from './investigation.js';
import { evaluate } from './expression.js';
export const sectionNames=['Engineering question','Physics model','Inputs','Outputs','Assumptions','Validity','Predictions','Manual reference','Verification cases','Feature requirements','Implementation','Decision'];
export function checkAnswer(mission,answer){
 const issues=[];
 for(const field of mission.fields){const value=answer[field.id];if(value===undefined||String(value).trim()===''){issues.push({field:field.id,message:`Supply ${field.label}.`,kind:'missing'});continue;}
 if(field.type==='number'&&!Number.isFinite(Number(value)))issues.push({field:field.id,message:`${field.label} must be a finite number.`,kind:'invalid'});
 if(field.type==='equation'){try{evaluate(value,mission.variables);}catch(e){issues.push({field:field.id,message:e.message,kind:'invalid'});}}
 }
 return issues;
}
export function runMission(mission,answer){
 const missing=checkAnswer(mission,answer);if(missing.length)return {runnable:false,checks:missing};
 const values={...mission.variables};for(const f of mission.fields)if(f.type==='number')values[f.id]=Number(answer[f.id]);
 const checks=mission.checks.map(c=>{let actual=answer[c.field],expected=c.expected;try{
 if(c.expression)actual=evaluate(c.expression,values);
 if(c.studentExpression)actual=evaluate(answer[c.studentExpression],{...values,...c.variables});
 if(c.referenceExpression)expected=evaluate(c.referenceExpression,{...values,...c.variables});
 const passed=typeof expected==='number'?Number.isFinite(Number(actual))&&Math.abs(Number(actual)-expected)<=Math.max(c.tolerance??1e-6,Math.abs(expected)*(c.relativeTolerance??0)):actual===expected;
 return {...c,actual,expected,passed};
 }catch(e){return {...c,passed:false,error:e.message};}});
 const traces=(mission.sweep?.values||[]).map((x,index)=>{const vars={...values,[mission.sweep.variable]:x};let supplied=null,reference=null;try{supplied=evaluate(answer[mission.sweep.studentField]||mission.sweep.expression,vars);}catch{}try{reference=evaluate(mission.sweep.reference,vars);}catch{}if(mission.sweep.referenceValues)reference=mission.sweep.referenceValues[index];return {x,supplied,reference};});
 if(mission.number===1 && /(?:can|will|prove|approve|safe|successful).{0,50}(?:take\s?off|safety)|(?:take\s?off).{0,30}(?:safe|success)/i.test(answer.question||'')) checks.push({field:'question',passed:false,message:'Your question may ask for an unsupported takeoff or safety claim. This keyword screen is not prose grading: rewrite the question around initial pitch acceleration, and put limitations in the reasoning field.'});
 return {runnable:true,passed:checks.every(c=>c.passed),checks,traces};
}
export function reflectionChecks(reflection={}){return Boolean(reflection.observation?.trim()&&reflection.change?.trim()&&reflection.limit?.trim()&&reflection.result==='supported');}
export function progress(missions,work,messages=[]){
 let previousEarned=true;
 return missions.map(m=>{
  const w=work[m.id]||{},current=Boolean(w.attempt&&w.attempt.answerSnapshot===JSON.stringify(w.answer)&&w.attempt.missionVersion===m.version);
  function earned(record,answer){
   if(!record?.attempt||record.attempt.missionVersion!==m.version)return false;
   const override=messages.some(f=>f.kind==='override'&&f.mission===m.id&&f.snapshot===JSON.stringify(answer));
   const checked=runMission(m,answer);
   return Boolean((override||(checked.passed&&(!m.codeCases||record.attempt.result?.passed)))&&reflectionChecks(record.reflection)&&(!m.investigation||(record.reflection.confirmedFor===record.attempt.id&&investigationComplete(m,{...record,answer}))));
  }
  const complete=current&&earned(w,w.answer),available=previousEarned||complete;
  let earlier=false;try{earlier=earned(w,JSON.parse(w.attempt?.answerSnapshot||'{}'));}catch{}
  if(!earlier)earlier=(w.history||[]).some(h=>{try{return earned(h,JSON.parse(h.attempt.answerSnapshot));}catch{return false;}});
  previousEarned=previousEarned&&(complete||earlier);
  return {id:m.id,state:complete?'complete':available?'available':'locked',complete,stale:Boolean(w.attempt&&!current),investigated:current&&investigationComplete(m,w)};
 });
}
export function markdown(mission,work){return `# ${mission.title}\n\n`+sectionNames.map((title,i)=>`## ${title}\n${mission.missing.includes(i)?Object.entries(work.answer||{}).filter(([k])=>mission.fields.find(f=>f.id===k)?.section===i).map(([k,v])=>`${k}: ${v}`).join('\n\n'):mission.supplied[i]}`).join('\n\n')+'\n\n## Recorded investigations\n'+JSON.stringify(work.observations||{},null,2)+'\n\n## Interpretation attempts\n'+JSON.stringify(work.interpretations||{},null,2)+'\n\n## Evidence status\nWritten reasoning awaits instructor review. This export is the current draft; compare it with the answer snapshot of the last run.\n\n## Student reflection\n'+'Question: '+mission.experience.reflection.question+'\n\nIncluded: '+mission.experience.reflection.included+'\n\nOmitted: '+mission.experience.reflection.omitted+'\n\n'+Object.entries(work.reflection||{}).map(([k,v])=>`${k}: ${v}`).join('\n\n');}

export function implementationPrompt(mission,work){const base=`student-work/onboarding/implementation/${mission.id}`;return `Implement the specification below using function calculate(input), ${mission.codeContract?.description||'following the declared input/output contract.'} The app generates these three review artifacts when you save a GitHub checkpoint; do not create them manually: ${base}/physics.js, ${base}/feature.json, ${base}/verification.json. Do not modify the application or supplied lesson. Keep units, assumptions, and limits explicit. This prompt can be used with an already available coding tool; no AI service is required. Paste the calculate function into the app code field to run the browser checks.\n\n${markdown(mission,work)}`;}
