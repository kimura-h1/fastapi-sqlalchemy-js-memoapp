import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./utils/auth";
import CreateMemo from "./CreateMemo";
import ListMemos from "./ListMemos";
import EditMemo from "./EditMemo";
import Login from "./Login";
import Register from "./Register";
import InvoiceList from "./invoices/InvoiceList";
import InvoiceCreate from "./invoices/InvoiceCreate";
import InvoiceDetail from "./invoices/InvoiceDetail";
import ClientList from "./clients/ClientList";
import Profile from "./Profile";

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/list" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/" element={<Navigate to="/list" replace />} />
        <Route path="/list" element={<PrivateRoute><ListMemos /></PrivateRoute>} />
        <Route path="/create" element={<PrivateRoute><CreateMemo /></PrivateRoute>} />
        <Route path="/memos/:id/edit" element={<PrivateRoute><EditMemo /></PrivateRoute>} />
        <Route path="/invoices" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
        <Route path="/invoices/create" element={<PrivateRoute><InvoiceCreate /></PrivateRoute>} />
        <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetail /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><ClientList /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/list" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
