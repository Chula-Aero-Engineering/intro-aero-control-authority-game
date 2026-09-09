import {useEffect,useState} from 'react';
import EngineeringPlot from '../visualization/EngineeringPlot.jsx';
import {formatValue,caseResult} from './investigation.js';
export const pitchAngle=(acceleration,time)=>0.5*acceleration*time*time*180/Math.PI;
export default function PitchReplay({mission,record,task,acceleration}) {
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(.1);
 useEffect(()=>{setTime(0);setPlaying(false);},[task.id,record.attempt.id]);
 useEffect(()=>{if(!playing)return;let previous=performance.now();const timer=setInterval(()=>{const now=performance.now(),dt=(now-previous)/1000*speed;previous=now;setTime(t=>{const next=Math.min(.5,t+dt);if(next>=.5)setPlaying(false);return next;});},30);return()=>clearInterval(timer);},[playing,speed]);
 const angle=pitchAngle(acceleration,time),colors=['#166e82','#9a5718','#7140a0'];
 const series=mission.investigation.cases.map((c,i)=>{const a=caseResult(mission,record.answer,record.attempt.result,c).readouts[3].value;return {label:c.label,color:colors[i],points:Array.from({length:51},(_,j)=>({x:j/100,y:pitchAngle(a,j/100)}))};});
 series.push({label:'Trajectory at the specified minimum acceleration',color:'#68756f',points:Array.from({length:51},(_,j)=>({x:j/100,y:pitchAngle(mission.variables.target,j/100)}))});
 return <section className="pitch-replay" aria-label="Pitch response visualisation"><h4>Watch the initial response in slow motion</h4><p>The model covers <strong>0.5 seconds of simulated time</strong>. At the default 0.1× playback speed, this takes <strong>5 seconds to watch</strong>. Scrub the time control or compare the curves below. Playback speed changes only the animation, not the physics.</p>
 <svg viewBox="0 0 600 180" role="img" aria-label={`Pitch angle ${angle.toFixed(2)} degrees at ${time.toFixed(2)} simulated seconds`}><path d="M35 100 H565" stroke="#73877e" strokeDasharray="6 6"/><text x="40" y="145">Initial attitude: 0°</text><g transform={`translate(300 90) rotate(${-angle})`}><path d="M-190 0 L160 0 L200 12 L-180 20 Z M-160 0 L-185 -42 L-153 -42 L-125 0 M-20 8 L-100 42 L25 14" fill="#287568" stroke="#173b40" strokeWidth="3"/><path d="M-148 4 L-180 15" stroke="#e38c35" strokeWidth="6"/><text x="65" y="-20">Nose →</text></g><text x="380" y="160">Actual angle (no exaggeration)</text></svg>
 <div className="readouts"><div>Simulated time<strong>{time.toFixed(2)} s</strong></div><div>Pitch angle<strong>{angle.toFixed(3)}°</strong></div><div>Initial pitch acceleration<strong>{formatValue(acceleration)} rad/s²</strong></div><div>Specified minimum acceleration<strong>{mission.variables.target} rad/s²</strong></div></div>
 <label>Playback speed<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.1">0.1× — 5 seconds to watch</option><option value="0.25">0.25× — 2 seconds to watch</option><option value="1">1× — real time</option></select></label>
 <button onClick={()=>{setTime(0);setPlaying(true);}}>Replay from start</button><button disabled={!playing} onClick={()=>setPlaying(false)}>Pause replay</button><button disabled={playing||time>=.5} onClick={()=>setPlaying(true)}>Resume replay</button>
 <label>Simulated time (s)<input aria-label="Simulated time (s)" type="range" min="0" max="0.5" step="0.01" value={time} onChange={e=>{setPlaying(false);setTime(Number(e.target.value));}}/></label>
 <EngineeringPlot plot={{id:'initial-pitch-time',title:'Pitch angle versus simulated time',xLabel:'Simulated time (s)',yLabel:'Pitch angle (deg)',currentX:time,cursorLabel:'Replay position',series}}/>
 <p>From rest: θ(t) = ½α₀t². Each curve holds that case’s initial acceleration constant, at full elevator command. This short extrapolation omits changing aerodynamics, damping and actuator transients. The minimum-acceleration curve is a comparison aid, not a takeoff trajectory. Angle is not acceleration.</p></section>;
}
