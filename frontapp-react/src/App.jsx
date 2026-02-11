import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateMemo from "./CreateMemo";
import ListMemos from "./ListMemos";
import EditMemo from "./EditMemo"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/list" replace />} />
        <Route path="/list" element={<ListMemos />} />
        <Route path="/create" element={<CreateMemo />} />
        <Route path="/memos/:id/edit" element={<EditMemo />} />
         <Route path="*" element={<Navigate to="/list" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
