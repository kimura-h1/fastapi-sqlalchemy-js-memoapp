import { useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <h1>メモアプリ</h1>
      <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
        ログアウト
      </button>
    </header>
  );
}

export default Header;
