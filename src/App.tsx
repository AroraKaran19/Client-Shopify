import AppRouter from "./Routes/AppRouter";
import { StoreProvider } from "./StoreContext";

function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}

export default App;
