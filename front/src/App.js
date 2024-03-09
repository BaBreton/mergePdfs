import './App.css';
import Merge from './Merge';
import { NextUIProvider } from '@nextui-org/system';

function App() {
  return (
    <NextUIProvider>
		<Merge />
	</NextUIProvider>
  );
}

export default App;
