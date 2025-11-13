import AuthProvider from "./provider/authProvider";
//import AppRoutes from "./routes";
import AppRoutes from "./routes/AppRoutes";
//import Routes from "./routes";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
