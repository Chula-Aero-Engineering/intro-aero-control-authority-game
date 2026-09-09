import './learning/lab.css';
import Game from './onboarding/Game.jsx';
import MissionLab from './missions/MissionLab.jsx';
import GuidedLab from './learning/GuidedLab.jsx';
import {useState} from 'react';
export default function App(){const [view,setView]=useState('game');return <><details className="mission-switch"><summary>Other optional workspaces — separate from the assigned Chapter 6 game</summary><p>These older workspaces have independent progress and may contain unimplemented modules. They are not required for the Chapter 6 onboarding assignment.</p><nav aria-label="Learning workspace"><button onClick={()=>setView('game')}>Return to Chapter 6 game</button><button onClick={()=>setView('missions')}>Legacy Week 6 (separate progress)</button><button onClick={()=>setView('lab')}>Optional earlier-chapter lab</button></nav></details>{view==='game'?<Game/>:view==='missions'?<MissionLab/>:<GuidedLab/>}</>;}
