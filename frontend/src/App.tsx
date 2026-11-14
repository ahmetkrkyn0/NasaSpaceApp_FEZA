import { useState } from 'react';
import { Shell } from './shell/Shell';
import { Splash } from './shell/Splash';

export default function App() {
  const [entered, setEntered] = useState(false);
  return entered ? <Shell /> : <Splash onEnter={() => setEntered(true)} />;
}
