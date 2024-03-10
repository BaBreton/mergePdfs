import './App.css';
import Merge from './components/Merge';
import { NextUIProvider } from '@nextui-org/system';

function App() {
  return (
    <NextUIProvider>
		<Merge />
	</NextUIProvider>
  );
}

export default App;
