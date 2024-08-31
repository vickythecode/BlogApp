import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  function toggleTheme() {
    setIsDarkTheme(prevTheme => !prevTheme);
  }

  useEffect(() => {
    fetch('http://localhost:4000/profile', {
      credentials: 'include',
    }).then(response => {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    });
  }, []);

  function logout() {
    fetch('http://localhost:4000/logout', {
      credentials: 'include',
      method: 'POST',
    });
    alert("logout successfully")
    setUserInfo(null);
  }

  const username = userInfo?.username;

  return (
    <div className="Navbar">
      <header>
        <Link to="/" className="logo">Bloggy</Link>
        <div className="burger-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          &#9776;
        </div>
        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
          </button>

          {username && (
            <>
              <Link to="/create">Create new post</Link>
              <a onClick={logout}>Logout ({username})</a>
            </>
          )}
          {!username && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
    </div>
  );
}
