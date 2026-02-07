import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateMemo from "./CreateMemo";
import ListMemos from "./ListMemos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/list" replace />} />
        <Route path="/list" element={<ListMemos />} />
        <Route path="/create" element={<CreateMemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
