import { useNavigate, NavLink } from "react-router-dom";
import { removeToken } from "../utils/auth";

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="app-logo">MyApp</span>
        <nav className="header-nav">
          <NavLink to="/list" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            メモ
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            請求書
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            取引先
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            設定
          </NavLink>
        </nav>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
        ログアウト
      </button>
    </header>
  );
}

export default Header;
